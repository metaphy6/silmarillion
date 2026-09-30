import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("large-map simulation and rendered frame budget measurement", async ({
  page,
}) => {
  const start = Date.now();
  await page.goto("/");
  await page.locator("#tutorial").uncheck();
  await page.getByRole("button", { name: "Begin Cross-era sandbox" }).click();
  await page.getByRole("button", { name: "World", exact: true }).click();
  await page.waitForSelector("canvas");
  const report = await page.evaluate(async () => {
    const engine = await import("/src/simulation/engine.ts" as string);
    let state = engine.createMatch(
      [
        "human_rohan",
        "human_gondor",
        "istari_gandalf",
        "melkor_dark_architect",
      ],
      123,
      96,
    );
    const base = state.units["p1:company:0"];
    for (let i = 0; i < 400; i++)
      state.units[`stress:${i}`] = {
        ...structuredClone(base),
        id: `stress:${i}`,
        x: i % 96,
        y: Math.floor(i / 96),
        owner: `p${(i % 4) + 1}`,
      };
    const begin = performance.now();
    for (let i = 0; i < 10; i++) state = engine.resolveWeek(state);
    const simulationMs = performance.now() - begin;
    const paths = performance.now();
    for (let i = 0; i < 100; i++)
      engine.path(state, { x: 4, y: 4 }, { x: 90, y: 90 });
    const pathfindingMs = performance.now() - paths;
    const frames: number[] = [];
    let last = performance.now();
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        frames.push(now - last);
        last = now;
        if (frames.length < 120) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    frames.sort((a, b) => a - b);
    return {
      simulation: {
        map: "96x96",
        companies: 400,
        weeks: 10,
        totalMs: simulationMs,
        msPerWeek: simulationMs / 10,
      },
      pathfinding: { requests: 100, totalMs: pathfindingMs },
      render: {
        scene: "default32x32",
        samples: frames.length,
        p50Ms: frames[60],
        p95Ms: frames[114],
      },
      heap:
        (performance as Performance & { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize ?? null,
      userAgent: navigator.userAgent,
    };
  });
  const result = {
    ...report,
    loadToMeasurementMs: Date.now() - start,
    budgets: {
      loadMs: 8000,
      heapBytes: 268435456,
      frameP95Ms: 33.4,
      simulationWeekMs: 100,
    },
    scope:
      "Headless Chromium on this workstation; simulation stress is separate from default scene frame capture. Not physical-device or remote-service evidence.",
  };
  writeFileSync(
    "docs/reports/runtime/performance.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  expect(report.simulation.msPerWeek).toBeLessThan(100);
  expect(report.pathfinding.totalMs).toBeLessThan(5000);
});

test("actual large-map renderer culls 96x96 tiles and 400 companies", async ({
  page,
}) => {
  const start = Date.now();
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const loadMs = Date.now() - start;
  const frames = await page.evaluate(async () => {
    const values: number[] = [];
    let previous = performance.now();
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        values.push(now - previous);
        previous = now;
        if (values.length === 120) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    values.sort((a, b) => a - b);
    return {
      p50: values[60],
      p95: values[114],
      heap:
        (performance as Performance & { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize ?? null,
    };
  });
  const cache = await page.evaluate(() => {
    const world = (
      window as unknown as {
        renderWorld: {
          scene: {
            chunks: {
              image?: unknown;
              texture?: string;
              bounds: { width: number; height: number };
            }[];
          };
        };
      }
    ).renderWorld;
    const cached = world.scene.chunks.filter((chunk) => chunk.image);
    return {
      count: cached.length,
      bytes: cached.reduce(
        (sum, chunk) => sum + chunk.bounds.width * chunk.bounds.height * 4,
        0,
      ),
    };
  });
  expect(cache.count).toBeGreaterThan(0);
  expect(cache.count).toBeLessThanOrEqual(16);
  expect(cache.bytes).toBeLessThanOrEqual(16 * 1148 * 634 * 4);
  const report = {
    cache,
    map: "96x96",
    companies: 400,
    viewport: page.viewportSize(),
    loadMs,
    ...frames,
    budgets: { loadMs: 8000, heapBytes: 268435456, frameP95Ms: 34 },
    scope:
      "Actual Phaser large map on headless Chromium workstation. No physical-device or Safari/Firefox performance inference.",
  };
  writeFileSync(
    "docs/reports/runtime/large-render.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await page.screenshot({ path: "docs/reports/runtime/large-map.png" });
  expect(loadMs).toBeLessThan(8000);
  expect(frames.p95).toBeLessThan(50);
});
