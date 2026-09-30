import { test, expect } from "@playwright/test";
import type { Match } from "../../src/simulation/types";

test("real resolved movement traverses its recorded route while simulation remains committed", async ({
  page,
}) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const start = await page.evaluate(async () => {
    const w = (window as unknown as { renderWorld: { scene: unknown } })
      .renderWorld.scene as {
      state: Match;
      setState: (s: unknown, seat: string, id: string) => void;
      motionStats: () => unknown;
    };
    const e = await import("/src/simulation/engine.ts" as string);
    const s = structuredClone(w.state);
    const u = s.units["p1:company:0"];
    const at = [
      { x: u.x + 1, y: u.y },
      { x: u.x - 1, y: u.y },
      { x: u.x, y: u.y + 1 },
      { x: u.x, y: u.y - 1 },
    ].find((p) => e.path(s, u, p, false, u));
    if (!at) throw new Error("No ordinary move fixture");
    const r = e.submit(s, {
      id: "walk-check",
      seat: "p1",
      seq: s.nextSeq.p1,
      turn: s.turn,
      revision: s.revision,
      action: { kind: "move", unit: u.id, ...at },
    });
    if (!r.ok) throw new Error(r.reason);
    const committed = e.resolveWeek(r.state);
    w.setState(committed, "p1", u.id);
    return {
      stats: w.motionStats(),
      state: JSON.stringify(committed),
      target: { x: (at.x - at.y) * 68, y: (at.x + at.y) * 34 },
    };
  });
  expect(start.stats).toMatchObject({ walks: 1, enabled: true });
  const middle = await page.evaluate(async () => {
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
    const scene = (
      window as unknown as {
        renderWorld: {
          scene: { marks: Map<string, { x: number; y: number }> };
        };
      }
    ).renderWorld.scene;
    const c = scene.marks.get("p1:company:0")!;
    return { x: c.x, y: c.y };
  });
  expect(middle).not.toEqual(start.target);
  await page.waitForFunction(
    () =>
      (
        window as unknown as {
          renderWorld: { scene: { motionStats: () => { walks: number } } };
        }
      ).renderWorld.scene.motionStats().walks === 0,
  );
  const end = await page.evaluate(() => {
    const s = (
      window as unknown as {
        renderWorld: {
          scene: { state: Match; marks: Map<string, { x: number; y: number }> };
        };
      }
    ).renderWorld.scene;
    const c = s.marks.get("p1:company:0")!;
    return { state: JSON.stringify(s.state), at: { x: c.x, y: c.y } };
  });
  expect(end.at).toEqual(start.target);
  expect(end.state).toBe(start.state);
});

test("nature moves, observed damage has a bounded visual response, and reduced motion stops every loop", async ({
  page,
}) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const result = await page.evaluate(async () => {
    const s = (window as unknown as { renderWorld: { scene: unknown } })
      .renderWorld.scene as {
      state: Match;
      life: { ambient: { commandBuffer: unknown[] }; effects: unknown[] };
      setState: (s: unknown, seat: string, id: string) => void;
      motionStats: () => { clock: number; effects: number; enabled: boolean };
      setMotionMode: (mode: "reduced" | "system") => void;
    };
    const sample = () => JSON.stringify(s.life.ambient.commandBuffer);
    const first = sample();
    for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);
    const second = sample();
    const state = structuredClone(s.state) as {
      revision: number;
      units: Record<string, { hp: number }>;
    };
    state.revision++;
    state.units["p1:company:0"].hp -= 9;
    s.setState(state, "p1", "p1:company:0");
    const impact = s.motionStats();
    s.setMotionMode("reduced");
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    const stopped = s.motionStats();
    for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame);
    return {
      first,
      second,
      impact,
      stopped,
      after: s.motionStats(),
      ambient: s.life.ambient.commandBuffer.length,
    };
  });
  expect(result.first).not.toBe(result.second);
  expect(result.impact.effects).toBe(1);
  expect(result.stopped.enabled).toBe(false);
  expect(result.after.clock).toBe(result.stopped.clock);
  expect(result.after.effects).toBe(0);
  expect(result.ambient).toBe(0);
});

test("system reduced motion and accessible user setting retain usable game controls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  expect(
    await page.evaluate(() =>
      (
        window as unknown as {
          renderWorld: { scene: { motionStats: () => unknown } };
        }
      ).renderWorld.scene.motionStats(),
    ),
  ).toMatchObject({ enabled: false, walks: 0, effects: 0 });
  await page.goto("/");
  await page.locator("#tutorial").uncheck();
  await page.getByRole("button", { name: "Begin Cross-era sandbox" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("World motion").selectOption("reduced");
  await expect(page.getByLabel("World motion")).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Resolve week →", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: "docs/reports/runtime/living-world-settings.png",
  });
});

test("a newer destination cancels obsolete walking instead of dragging the unit back", async ({
  page,
}) => {
  await page.goto("/tests/browser/render-harness.html");
  await page.waitForFunction(() => document.body.dataset.ready === "true");
  const result = await page.evaluate(async () => {
    const w = (window as unknown as { renderWorld: { scene: unknown } })
      .renderWorld.scene as {
      state: Match;
      setState: (s: unknown, seat: string, id: string) => void;
      marks: Map<string, { x: number; y: number }>;
      motionStats: () => { walks: number };
    };
    const e = await import("/src/simulation/engine.ts" as string);
    const s = structuredClone(w.state),
      u = s.units["p1:company:0"];
    const to = [
      { x: u.x + 1, y: u.y },
      { x: u.x - 1, y: u.y },
      { x: u.x, y: u.y + 1 },
    ].find((p) => e.path(s, u, p, false, u));
    const r = e.submit(s, {
      id: "interrupted-walk",
      seat: "p1",
      seq: s.nextSeq.p1,
      turn: s.turn,
      revision: s.revision,
      action: { kind: "move", unit: u.id, ...to },
    });
    if (!r.ok) throw new Error(r.reason);
    const moved = e.resolveWeek(r.state);
    w.setState(moved, "p1", u.id);
    const walking = w.motionStats().walks;
    const newer = structuredClone(moved);
    newer.revision++;
    newer.units[u.id].x += 2;
    w.setState(newer, "p1", u.id);
    for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame);
    const mark = w.marks.get(u.id)!;
    return {
      walking,
      after: w.motionStats().walks,
      at: { x: mark.x, y: mark.y },
      expected: {
        x: (newer.units[u.id].x - u.y) * 68,
        y: (newer.units[u.id].x + u.y) * 34,
      },
    };
  });
  expect(result.walking).toBe(1);
  expect(result.after).toBe(0);
  expect(result.at).toEqual(result.expected);
});
