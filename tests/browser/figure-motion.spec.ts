import { test, expect } from "@playwright/test";
import { FIGURE_FAMILIES } from "../../src/render/figure-motion";
import type { Match, Action } from "../../src/simulation/types";
import type { World } from "../../src/render/world";
type MotionScene = Omit<World, never> & {
  state: Match;
  life: {
    motionSprites: Map<
      string,
      { texture: { key: string }; frame: { name: string }; visible: boolean }
    >;
  };
};

test("paid hero queue drives species-appropriate work frames and reduced motion restores static art", async ({
  page,
}, testInfo) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const result = await page.evaluate(async () => {
    const e = await import("/src/simulation/engine.ts" as string),
      { scene } = (window as unknown as { renderWorld: { scene: MotionScene } })
        .renderWorld;
    let s = e.createMatch(["eagle_eyrie", "human_gondor"], 890, 32) as Match;
    s.players.p2.ai = false;
    const commit = (action: Action) => {
      const r = e.submit(s, {
        id: `work:${s.turn}`,
        seat: "p1",
        seq: s.nextSeq.p1,
        turn: s.turn,
        revision: s.revision,
        action,
      });
      if (!r.ok) throw new Error(r.reason);
      s = e.resolveWeek(r.state);
    };
    commit({ kind: "produce", facility: "p1:core", recipe: "component" });
    while (s.facilities["p1:core"].job) s = e.resolveWeek(s);
    commit({ kind: "produce", facility: "p1:core", recipe: "hero" });
    if (!s.facilities["p1:core"].job) throw new Error("No paid ongoing queue");
    scene.setState(s, "p1", "p1:core");
    scene.locate("p1:core");
    scene.cameras.main.setZoom(1.4);
    for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
    const sprite = scene.life.motionSprites.get("work:p1:core");
    return {
      texture: sprite?.texture.key,
      frame: sprite?.frame.name,
      component: s.players.p1.component,
    };
  });
  expect(result.texture).toBe("figure-motion:eagle");
  expect(Number(result.frame)).toBeGreaterThanOrEqual(16);
  expect(Number(result.frame)).toBeLessThan(32);
  expect(result.component).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("paid-work-frame.png") });
});

for (const family of FIGURE_FAMILIES)
  test(`real ${family} movement and attack use articulated frames`, async ({
    page,
  }, testInfo) => {
    await page.goto("/tests/browser/render-harness.html");
    await page.waitForFunction(() => document.body.dataset.ready === "true");
    const movement = await page.evaluate(async (family) => {
      const { scene } = (
        window as unknown as { renderWorld: { scene: MotionScene } }
      ).renderWorld;
      const e = await import("/src/simulation/engine.ts" as string),
        c = await import("/src/content/catalog.ts" as string),
        m = await import("/src/render/figure-motion.ts" as string);
      const species: Record<string, string> = {
        // This material family is inhabited by species, never a generic human.
        "embodied-wild": "troll_hold",
        wolf: "wolf_pack",
        spider: "spider_brood",
        eagle: "eagle_eyrie",
        ent: "ent_grove",
        troll: "troll_hold",
        rider: "human_rohan",
      };
      const kind = ["dragon", "winged-dragon", "balrog", "construct"].includes(
        family,
      )
        ? family
        : "company";
      const profile =
        species[family] ??
        (["dragon", "winged-dragon", "balrog", "construct"].includes(family)
          ? "melkor_dark_architect"
          : c.profiles.find(
              (p: { id: string }) =>
                m.motionFamily(p.id, "company", c.art(p.id).family) === family,
            )?.id);
      if (!profile) throw new Error("Missing representative " + family);
      const s = e.createMatch(
        [profile, profile === "human_gondor" ? "human_rohan" : "human_gondor"],
        431,
        32,
      ) as Match;
      s.map.terrain.fill("meadow");
      s.waterChannels = {};
      delete s.map.scenarioId;
      s.seaHazards = {};
      s.shallowWater = {};
      s.players.p2.ai = false;
      s.players.p1.relations.p2 = "war";
      s.players.p2.relations.p1 = "war";
      const u = s.units["p1:company:0"],
        enemy = s.units["p2:company:0"];
      Object.assign(u, { x: 8, y: 8, kind });
      Object.assign(enemy, { x: 10, y: 8 });
      scene.setState(s, "p1", u.id);
      scene.locate(u.id);
      scene.cameras.main.setZoom(1.4);
      const r = e.submit(s, {
        id: "motion-walk",
        seat: "p1",
        seq: s.nextSeq.p1,
        turn: s.turn,
        revision: s.revision,
        action: { kind: "move", unit: u.id, x: 9, y: 8 },
      });
      if (!r.ok) throw new Error(r.reason);
      const next = e.resolveWeek(r.state);
      scene.setState(next, "p1", u.id);
      for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
      const sprite = scene.life.motionSprites.get(u.id);
      const atlas = scene.textures
        .get(sprite!.texture.key)
        .getSourceImage() as HTMLCanvasElement;
      const context = atlas.getContext("2d")!;
      const poseHashes = Array.from({ length: 12 }, (_, group) =>
        Array.from({ length: 4 }, (_, phase) => {
          const index = group * 4 + phase,
            pixels = context.getImageData(
              (index % 8) * 64,
              Math.floor(index / 8) * 64,
              64,
              64,
            ).data;
          let hash = 0;
          for (const byte of pixels) hash = (hash * 31 + byte) >>> 0;
          return hash;
        }),
      );
      return {
        poseHashes,
        profile,
        texture: sprite?.texture.key,
        frame: sprite?.frame.name,
        painted: m.motionAppearance(profile, kind).frame,
        cohort: [...scene.life.motionSprites.keys()].filter(
          (id) => id === u.id || id.startsWith(`${u.id}:rank:`),
        ).length,
      };
    }, family);
    for (const phases of movement.poseHashes)
      expect(new Set(phases).size, `${family} action/direction phases`).toBe(4);
    const expectedFamily = family === "dragon" ? "dragon" : movement.painted;
    expect(movement.cohort).toBe(
      ["dragon", "winged-dragon", "balrog", "construct"].includes(family)
        ? 1
        : 3,
    );
    expect(movement.texture).toBe(`figure-motion:${expectedFamily}`);
    await page.screenshot({ path: testInfo.outputPath("walk-frame-a.png") });
    const nextFrame = await page.evaluate(async (previous) => {
      const { scene } = (
        window as unknown as { renderWorld: { scene: MotionScene } }
      ).renderWorld;
      for (let i = 0; i < 20; i++) {
        await new Promise(requestAnimationFrame);
        const frame = scene.life.motionSprites.get("p1:company:0")?.frame.name;
        if (frame !== undefined && frame !== previous) return frame;
      }
      throw new Error("Walk frames did not articulate");
    }, movement.frame);
    expect(nextFrame).not.toBe(movement.frame);
    await page.screenshot({ path: testInfo.outputPath("walk-frame-b.png") });
    await page.waitForFunction(
      () =>
        !(
          window as unknown as { renderWorld: { scene: World } }
        ).renderWorld.scene.motionStats()?.walks,
    );
    const attack = await page.evaluate(async () => {
      const { scene } = (
        window as unknown as { renderWorld: { scene: MotionScene } }
      ).renderWorld;
      const e = await import("/src/simulation/engine.ts" as string);
      let s = scene.state;
      const action: Action = {
        kind: "attack",
        unit: "p1:company:0",
        target: "p2:company:0",
      };
      const r = e.submit(s, {
        id: "motion-attack",
        seat: "p1",
        seq: s.nextSeq.p1,
        turn: s.turn,
        revision: s.revision,
        action,
      });
      if (!r.ok) throw new Error(r.reason);
      scene.setState(r.state, "p1", "p1:company:0");
      s = e.resolveWeek(r.state);
      scene.setState(s, "p1", "p1:company:0");
      for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
      const sprite = scene.life.motionSprites.get("p1:company:0");
      return { texture: sprite?.texture.key, frame: sprite?.frame.name };
    });
    expect(attack.texture).toBe(`figure-motion:${expectedFamily}`);
    expect(Number(attack.frame)).toBeGreaterThanOrEqual(32);
    await page.screenshot({ path: testInfo.outputPath("attack-frame.png") });
    await page.evaluate(() => {
      const { scene } = (
        window as unknown as { renderWorld: { scene: MotionScene } }
      ).renderWorld;
      scene.setMotionMode("reduced");
    });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const { scene } = (
            window as unknown as { renderWorld: { scene: MotionScene } }
          ).renderWorld;
          return scene.motionStats()?.motionSprites;
        }),
      )
      .toBe(0);
  });

test("supplemental companion paint has real runtime alpha and preserves animal identity during actual movement", async ({
  page,
}, info) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const result = await page.evaluate(async () => {
    const { scene } = (
      window as unknown as { renderWorld: { scene: MotionScene } }
    ).renderWorld;
    const atlas = scene.textures
      .get("companion-figures")
      .getSourceImage() as HTMLCanvasElement;
    const pixels = atlas
      .getContext("2d")!
      .getImageData(0, 0, atlas.width, atlas.height).data;
    let transparent = 0,
      opaque = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
      if (pixels[i] === 255) opaque++;
    }
    return { transparent, opaque, width: atlas.width, height: atlas.height };
  });
  expect(result).toMatchObject({ width: 1536, height: 1024 });
  expect(result.transparent).toBeGreaterThan(600000);
  expect(result.opaque).toBeGreaterThan(200000);
  for (const [companion, frame] of [
    ["pack-aurochs", "aurochs"],
    ["courier-stag", "stag"],
    ["rescue-hind", "hind"],
    ["songbird-swarm", "songbirds"],
    ["moth-clouds", "moths"],
  ] as const) {
    const actual = await page.evaluate(
      async ({ companion }) => {
        const { scene } = (
            window as unknown as { renderWorld: { scene: MotionScene } }
          ).renderWorld,
          { createMatch, submit, resolveWeek } = await import(
            "/src/simulation/engine.ts" as string
          );
        const s: Match = createMatch(["orome", "human_gondor"], 941);
        s.players.p2.ai = false;
        const u = s.units["p1:company:0"];
        Object.assign(u, { kind: "beast", companion, x: 8, y: 8 });
        scene.setState(s, "p1", u.id);
        scene.locate(u.id);
        scene.cameras.main.setZoom(1.4);
        const r = submit(s, {
          id: "companion-move",
          seat: "p1",
          seq: s.nextSeq.p1,
          turn: s.turn,
          revision: s.revision,
          action: { kind: "move", unit: u.id, x: 9, y: 8 },
        });
        if (!r.ok) throw Error(r.reason);
        scene.setState(resolveWeek(r.state), "p1", u.id);
        for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
        return scene.life.motionSprites.get(u.id)?.texture.key;
      },
      { companion },
    );
    expect(actual).toBe(`figure-motion:${frame}`);
    await page.screenshot({ path: info.outputPath(`${frame}-paint.png`) });
  }
});

test("all 88 painted direction masters retain real alpha and distinct rear/front anatomy", async ({
  page,
}, info) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const rows = await page.evaluate(async () => {
    const { DIRECTIONAL_SHEETS } = await import(
      "/src/render/figure-motion.ts" as string
    );
    const { scene } = (
      window as unknown as { renderWorld: { scene: MotionScene } }
    ).renderWorld;
    const canvas = document.createElement("canvas");
    canvas.id = "master-review";
    canvas.width = 640;
    canvas.height = 22 * 100 + 30;
    canvas.style.cssText = "position:absolute;left:0;top:0;z-index:999999";
    document.body.append(canvas);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#304647";
    ctx.fillRect(0, 0, 640, canvas.height);
    ctx.font = "14px Noto Sans";
    ctx.fillStyle = "white";
    ["north / rear", "east", "south / front", "west"].forEach((d, i) =>
      ctx.fillText(d, 130 + i * 125, 20),
    );
    const rows: { name: string; hashes: number[]; transparent: number[] }[] =
      [];
    let row = 0;
    for (const sheet of DIRECTIONAL_SHEETS)
      for (const name of sheet.archetypes) {
        const hashes: number[] = [],
          transparent: number[] = [];
        ctx.fillText(name, 5, row * 100 + 75);
        for (const [col, d] of ["north", "east", "south", "west"].entries()) {
          const f = scene.textures.getFrame(sheet.key, `${name}:${d}`);
          if (!f) throw Error(`Missing ${name}:${d}`);
          const cell = document.createElement("canvas");
          cell.width = 96;
          cell.height = 96;
          const c = cell.getContext("2d")!;
          const scale = Math.min(84 / f.cutWidth, 84 / f.cutHeight);
          c.drawImage(
            f.source.image as CanvasImageSource,
            f.cutX,
            f.cutY,
            f.cutWidth,
            f.cutHeight,
            48 - (f.cutWidth * scale) / 2,
            92 - f.cutHeight * scale,
            f.cutWidth * scale,
            f.cutHeight * scale,
          );
          const pixels = c.getImageData(0, 0, 96, 96).data;
          let hash = 0,
            clear = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] < 10) clear++;
            else
              hash =
                (hash * 31 +
                  pixels[i] +
                  pixels[i + 1] * 7 +
                  pixels[i + 2] * 11) >>>
                0;
          }
          hashes.push(hash);
          transparent.push(clear);
          ctx.drawImage(cell, 125 + col * 125, 30 + row * 100);
        }
        rows.push({ name, hashes, transparent });
        row++;
      }
    return rows;
  });
  expect(rows).toHaveLength(22);
  for (const row of rows) {
    expect(new Set(row.hashes).size, row.name).toBe(4);
    expect(
      row.transparent.every((x) => x > 1800),
      row.name,
    ).toBe(true);
  }
  await page
    .locator("#master-review")
    .screenshot({ path: info.outputPath("all-painted-directions.png") });
});

for (const [direction, target] of [
  ["north", { x: 8, y: 7 }],
  ["south", { x: 8, y: 9 }],
] as const)
  test(`committed company movement shows painted ${direction} master`, async ({
    page,
  }, info) => {
    await page.goto("/tests/browser/render-harness.html");
    await page.waitForFunction(() => document.body.dataset.ready === "true");
    const result = await page.evaluate(
      async ({ target }) => {
        const e = await import("/src/simulation/engine.ts" as string);
        const { scene } = (
          window as unknown as { renderWorld: { scene: MotionScene } }
        ).renderWorld;
        const s = e.createMatch(
          ["human_gondor", "human_rohan"],
          821,
          32,
        ) as Match;
        s.players.p2.ai = false;
        s.map.terrain.fill("meadow");
        s.waterChannels = {};
        s.shallowWater = {};
        s.seaHazards = {};
        delete s.map.scenarioId;
        const u = s.units["p1:company:0"];
        u.x = 8;
        u.y = 8;
        scene.setState(s, "p1", u.id);
        scene.locate(u.id);
        scene.cameras.main.setZoom(1.4);
        const r = e.submit(s, {
          id: "direction-walk",
          seat: "p1",
          seq: s.nextSeq.p1,
          turn: s.turn,
          revision: s.revision,
          action: { kind: "move", unit: u.id, ...target },
        });
        if (!r.ok) throw Error(r.reason);
        scene.setState(e.resolveWeek(r.state), "p1", u.id);
        for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
        const sprite = scene.life.motionSprites.get(u.id);
        return { key: sprite?.texture.key, frame: Number(sprite?.frame.name) };
      },
      { target },
    );
    expect(result.key).toBe("figure-motion:infantry");
    expect(result.frame).toBeGreaterThanOrEqual(direction === "north" ? 0 : 8);
    expect(result.frame).toBeLessThan(direction === "north" ? 4 : 12);
    await page.screenshot({
      path: info.outputPath(`${direction}-actual-movement.png`),
    });
  });

test("world uses native Canvas when the device exposes software WebGL", async ({
  page,
}) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const result = await page.evaluate(async () => {
    const { detectWorldRenderer } = await import(
      "/src/render/world.ts" as string
    );
    const { scene } = (
      window as unknown as { renderWorld: { scene: MotionScene } }
    ).renderWorld;
    return {
      preference: detectWorldRenderer(),
      actual: scene.game.renderer.type,
    };
  });
  if (result.preference === "canvas") expect(result.actual).toBe(1);
  else expect([1, 2]).toContain(result.actual);
});
