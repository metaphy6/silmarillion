import { writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import type { World } from "../../src/render/world";

test("painted terrain retains bounded cache and large-map frame budget", async ({
  page,
}, testInfo) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const metrics = await page.evaluate(async () => {
    const { scene } = (window as unknown as { renderWorld: { scene: World } })
      .renderWorld;
    const frames: number[] = [];
    let previous = performance.now();
    await new Promise<void>((resolve) => {
      const next = (now: number) => {
        frames.push(now - previous);
        previous = now;
        if (frames.length < 120) requestAnimationFrame(next);
        else resolve();
      };
      requestAnimationFrame(next);
    });
    frames.sort((a, b) => a - b);
    const textures = scene.textures
      .getTextureKeys()
      .filter((key) => key.startsWith("terrain:"));
    const bytes = textures.reduce((sum, key) => {
      const source = scene.textures
        .get(key)
        .getSourceImage() as HTMLCanvasElement;
      return sum + source.width * source.height * 4;
    }, 0);
    return {
      p95: frames[114],
      textures: textures.length,
      bytes,
      scope:
        "96x96 / 400 companies, headless workstation; no physical-device claim",
    };
  });
  await writeFile(testInfo.outputPath("terrain-performance.json"),JSON.stringify(metrics,null,2)+"\n");
  await testInfo.attach("terrain-performance", {
    body: JSON.stringify(metrics),
    contentType: "application/json",
  });
  expect(metrics.textures).toBeLessThanOrEqual(16);
  expect(metrics.bytes).toBeLessThan(48 * 1024 * 1024);
  expect(metrics.p95).toBeLessThan(50);
});

test("paint and rules terrain share actual masks at three zooms", async ({
  page,
}, testInfo) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  await page.evaluate(async () => {
    const { createMatch } = await import("/src/simulation/engine.ts" as string);
    const { createBasinScenario } = await import(
      "/src/content/scenario.ts" as string
    );
    const s = createMatch(["human_rohan", "human_gondor"], 13, 32);
    s.map = {
      ...createBasinScenario(32).map,
      scenarioId: "cross-era-basin-v1",
    };
    s.units = {};
    s.facilities = {};
    s.sites = [];
    const { scene } = (window as unknown as { renderWorld: { scene: World } })
      .renderWorld;
    scene.setState(s, "p1", "");
    scene.setMotionMode("reduced");
  });
  for (const zoom of [0.4, 0.8, 1.4])
    for (const rules of [false, true]) {
      const samples = await page.evaluate(
        async ({ zoom, rules }) => {
          const { scene } = (
            window as unknown as { renderWorld: { scene: World } }
          ).renderWorld;
          const { iso, terrainPaint, rulesTerrainStyle } = await import(
            "/src/render/world.ts" as string
          );
          const { createBasinScenario } = await import(
            "/src/content/scenario.ts" as string
          );
          const s = createBasinScenario(32);
          scene.setRulesTerrain(rules);
          scene.cameras.main.setZoom(zoom);
          const result = [];
          for (const kind of [
            "meadow",
            "woodland",
            "water",
            "stone",
            "cliff",
          ]) {
            const index = s.map.terrain.findIndex(
              (t: string, i: number) =>
                t === kind &&
                i % 32 > 2 &&
                Math.floor(i / 32) > 2 &&
                !s.roads.some(
                  (p: { x: number; y: number }) =>
                    p.x === i % 32 && p.y === Math.floor(i / 32),
                ),
            );
            const x = index % 32,
              y = Math.floor(index / 32),
              at = iso(x, y);
            scene.cameras.main.centerOn(at.x, at.y);
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            );
            const c = scene.cameras.main;
            const color = await new Promise<number>((resolve) =>
              scene.game.renderer.snapshotPixel(
                c.width / 2,
                c.height / 2 + 28 * zoom,
                (pixel) => {
                  const p = pixel as {
                    red: number;
                    green: number;
                    blue: number;
                  };
                  resolve((p.red << 16) | (p.green << 8) | p.blue);
                },
              ),
            );
            result.push({
              kind,
              color,
              expected: rules
                ? rulesTerrainStyle(kind).fill
                : terrainPaint(kind, x, y).base,
            });
          }
          const at = iso(16, 11);
          scene.cameras.main.centerOn(at.x, at.y);
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          return result;
        },
        { zoom, rules },
      );
      if (rules)
        for (const sample of samples)
          expect(
            sample.color,
            `${sample.kind} at ${zoom}, rules=${rules}`,
          ).toBe(sample.expected);
      else {
        expect(new Set(samples.map((s) => s.color)).size).toBe(5);
        expect(samples.every((s) => s.color !== 0)).toBe(true);
      }
      await page.screenshot({
        path: testInfo.outputPath(
          `terrain-${zoom}-${rules ? "rules" : "paint"}.png`,
        ),
      });
    }
});
