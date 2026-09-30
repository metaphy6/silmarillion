import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { cpus, totalmem, platform, release } from "node:os";
import type { RTSUnit } from "../../src/simulation/rts";

test("RTS actual play and 40/100/200-unit renderer plus simulation budgets", async ({
  page,
  browser,
}) => {
  test.setTimeout(90000);
  // Freeze this capture against unrelated developer hot reloads during a run.
  await page.routeWebSocket(/.*/, () => {});
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?mode=rts");
  await page
    .getByRole("button", { name: "Begin real-time skirmish", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const uiAcknowledgment = await page
    .getByRole("button", { name: /Recruit Worker/ })
    .evaluate(async (button) => {
      const start = performance.now();
      (button as HTMLButtonElement).click();
      const synchronousMs = performance.now() - start;
      const feedback = document.querySelector("#rts-feedback")?.textContent;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      return {
        synchronousMs,
        nextFrameMs: performance.now() - start,
        feedback,
      };
    });
  expect(uiAcknowledgment.feedback).toMatch(/Paid production queued/);
  await page.keyboard.press("w");
  await page.getByRole("button", { name: /Build Provision farm/ }).click();
  await page.getByLabel("Order X coordinate").fill("11");
  await page.getByLabel("Order Y coordinate").fill("12");
  await page.getByLabel("Order Y coordinate").press("Enter");
  await expect(page.locator("#rts-feedback")).toContainText(
    "Construction paid",
  );
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator("#rts-clock")).toHaveText("0:12", {
    timeout: 16000,
  });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page
    .getByRole("button", { name: "Save skirmish", exact: true })
    .click();
  const normalPlay = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("silmarillion-rts-save-v1")!);
    return {
      tick: state.tick,
      units: Object.values(state.units).length,
      farms: Object.values(state.buildings)
        .filter(
          (b) => (b as { kind: string; progress: number }).kind === "farm",
        )
        .map((b) => ({ progress: (b as { progress: number }).progress })),
    };
  });
  expect(normalPlay.units).toBeGreaterThan(18);
  expect(normalPlay.farms).toEqual([{ progress: 1 }]);
  await page.screenshot({ path: "docs/reports/runtime/rts-after.png" });

  // Route fulfills a clean same-origin document: no application hidden-state export.
  await page.route("**/rts-performance-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html><head><style>body{margin:0;background:#182e33}#benchmark-world{position:fixed;inset:0}</style></head><body><div id="benchmark-world"></div></body></html>',
    }),
  );
  const scenarios = [];
  for (const count of [40, 100, 200]) {
    await page.goto("/rts-performance-harness");
    const report = await page.evaluate(async (count) => {
      const sim = (await import(
        "/src/simulation/rts.ts" as string
      )) as typeof import("../../src/simulation/rts");
      const render = (await import(
        "/src/render/rts-world.ts" as string
      )) as typeof import("../../src/render/rts-world");
      const state = sim.createRTS(1947);
      state.players.p1.ai = false;
      state.players.p2.ai = false;
      const template = structuredClone(Object.values(state.units)[0]);
      state.units = {};
      for (let i = 0; i < count; i++) {
        const owner = i < count / 2 ? "p1" : "p2",
          j = i % (count / 2),
          kind = i % 12 === 0 ? "siege" : i % 3 === 0 ? "soldier" : "archer";
        const spec = sim.unitSpec(kind, state.players[owner].profile);
        const unit: RTSUnit = {
          ...structuredClone(template),
          id: `fixture-${i}`,
          owner,
          kind,
          name: spec.name,
          x:
            owner === "p1"
              ? 21 - Math.floor(j / 10) * 0.65
              : 26 + Math.floor(j / 10) * 0.65,
          y: 7 + (j % 10) * 0.75,
          hp: 10000,
          maxHp: 10000,
          ammo: kind === "siege" ? 30 : 0,
          orders: [{ kind: "attackMove", x: owner === "p1" ? 27 : 20, y: 10 }],
          cargo: { P: 0, M: 0, K: 0, E: 0 },
          path: [],
        };
        state.units[unit.id] = unit;
      }
      const world = render.createRtsWorld(
        document.getElementById("benchmark-world")!,
        { select() {}, order() {}, ground() {}, hover() {} },
      );
      world.setState(state, []);
      await new Promise<void>((resolve) => {
        const ready = () => {
          if (world.scene.loaded) resolve();
          else requestAnimationFrame(ready);
        };
        ready();
      });
      world.center(24, 11);
      // Warm asset uploads/terrain caches before measuring sustained work.
      await new Promise<void>((resolve) => {
        let n = 0;
        const frame = () => {
          if (++n === 30) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      const friendly = Object.values(state.units)
        .filter((u) => u.owner === "p1")
        .map((u) => u.id);
      const commandStart = performance.now();
      const command = sim.commandRTS(state, "p1", {
        kind: "order",
        units: friendly,
        order: { kind: "attackMove", x: 27, y: 10 },
      });
      world.setState(state, friendly.slice(0, 5));
      const commandAcknowledgmentMs = performance.now() - commandStart;
      const frameTimes: number[] = [],
        stepTimes: number[] = [],
        snapshotTimes: number[] = [];
      let last = 0,
        accumulator = 0;
      const measurementStart = performance.now();
      await new Promise<void>((resolve) => {
        const frame = (now: number) => {
          if (last) {
            const elapsed = now - last;
            frameTimes.push(elapsed);
            accumulator += elapsed;
          }
          last = now;
          let catchup = 0;
          while (accumulator >= sim.RTS_TICK_MS && catchup++ < 10) {
            const start = performance.now();
            sim.stepRTS(state);
            stepTimes.push(performance.now() - start);
            accumulator -= sim.RTS_TICK_MS;
            const snapshotStart = performance.now();
            world.setState(state, friendly.slice(0, 5));
            snapshotTimes.push(performance.now() - snapshotStart);
          }
          if (frameTimes.length >= 240 || now - measurementStart >= 6000)
            resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      const stats = (values: number[]) => {
        const sorted = [...values].sort((a, b) => a - b);
        return {
          samples: sorted.length,
          p50Ms: sorted[Math.floor(sorted.length * 0.5)],
          p95Ms: sorted[Math.floor(sorted.length * 0.95)],
          maxMs: sorted.at(-1),
        };
      };
      return {
        units: count,
        livingAtEnd: Object.values(state.units).filter((u) => u.hp > 0).length,
        ticks: state.tick,
        measurementElapsedMs: performance.now() - measurementStart,
        retainedSimulationBacklogMs: accumulator,
        frames: stats(frameTimes),
        simulation: stats(stepTimes),
        snapshotUpdate: stats(snapshotTimes),
        commandAcknowledgmentMs,
        commandAccepted: command.ok,
        renderer: world.diagnostics(),
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        scope:
          "Synthetic sustained combat fixture with 10,000 HP per unit and 30 siege ammunition, real movement/combat/fog/projectiles; AI disabled. Same 48×32 terrain and Phaser Canvas renderer, fixed 100ms simulation, warmed caches. Fixture bypasses economy/supply solely for load measurement.",
      };
    }, count);
    scenarios.push(report);
    if (count === 100)
      await page.screenshot({ path: "docs/reports/runtime/rts-battle.png" });
  }
  const report = {
    capturedAt: new Date().toISOString(),
    browser: browser.version(),
    viewport: page.viewportSize(),
    hardware: {
      cpu: cpus()[0]?.model,
      logicalCpus: cpus().length,
      memoryBytes: totalmem(),
      os: platform(),
      kernel: release(),
    },
    uiAcknowledgment,
    normalPlay,
    targets: {
      frameP95MsAt100Units: 33.3,
      commandAcknowledgmentMs: 50,
      simulationTickMs: 100,
      stress200Units:
        "Frame saturation probe; simulation and acknowledgment budgets still apply",
    },
    scenarios,
    limitations:
      "Headless workstation Chromium on a shared host while other repository gates run. Up to 240 frames per fixture, capped at six seconds; at most ten catch-up steps per frame matches the app clock and retains backlog. Browser handler and next animation frame are not physical input latency. Synthetic fixtures are separate from actual normal-play screenshot. No physical GPU/device, Firefox/Safari or remote multiplayer performance inference.",
  };
  writeFileSync(
    "docs/reports/runtime/rts-performance.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  expect(errors).toEqual([]);
  expect(uiAcknowledgment.synchronousMs).toBeLessThan(50);
  expect(
    scenarios.find((s) => s.units === 100)!.frames.p95Ms,
  ).toBeLessThanOrEqual(33.3);
  for (const scenario of scenarios) {
    expect(scenario.commandAccepted).toBe(true);
    expect(scenario.commandAcknowledgmentMs).toBeLessThan(50);
    expect(scenario.simulation.maxMs).toBeLessThan(100);
  }
});
