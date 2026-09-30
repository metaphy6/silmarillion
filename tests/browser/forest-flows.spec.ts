import { test, expect } from "@playwright/test";
test("Oromë reviews and executes a personally surveyed patrol and saves its physical position", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { createMatch, submit, resolveWeek } = await import(
      "/src/simulation/engine.ts" as string
    );
    const { saveCheckpoint } = await import(
      "/src/persistence/checkpoints.ts" as string
    );
    let s = createMatch(["orome", "human_gondor"], 127);
    s.players.p2.ai = false;
    const p = s.players.p1;
    p.hero.status = "living";
    p.hero.readiness = 6;
    s.units[p.hero.id] = {
      ...structuredClone(s.units["p1:company:0"]),
      id: p.hero.id,
      kind: "hero",
      x: 4,
      y: 4,
      move: 8,
    };
    for (const x of [5, 4]) {
      const r = submit(s, {
        id: `survey-${x}`,
        seat: "p1",
        seq: s.nextSeq.p1,
        turn: s.turn,
        revision: s.revision,
        action: { kind: "move", unit: p.hero.id, x, y: 4 },
      });
      if (!r.ok) throw Error(r.reason);
      s = resolveWeek(r.state);
    }
    await saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "World", exact: true }).click();
  await page.getByText("Keep the Wild Road", { exact: true }).click();
  await page.locator("#forest-survey").selectOption({ index: 0 });
  await page.getByRole("button", { name: "Review personal patrol" }).click();
  await expect(
    page.getByRole("button", { name: "Confirm order" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await expect(page.locator("#status")).toContainText("committed and saved");
  const s = await page.evaluate(async () => {
    const { loadCheckpoint } = await import(
      "/src/persistence/checkpoints.ts" as string
    );
    return (await loadCheckpoint())!.state;
  });
  expect(s.units[s.players.p1.hero.id]).toMatchObject({ x: 5, y: 4 });
  await page.screenshot({
    path: "test-results/forest-patrol.png",
    fullPage: true,
  });
});
test("Melian reviews Guest Road, creates paid markers and carries the same convoy through a committed week", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { createMatch, submit, resolveWeek } = await import(
      "/src/simulation/engine.ts" as string
    );
    const { saveCheckpoint } = await import(
      "/src/persistence/checkpoints.ts" as string
    );
    let s = createMatch(["melian", "human_gondor"], 127);
    s.preySites = {};
    s.players.p2.ai = false;
    const p = s.players.p1;
    p.hero.status = "living";
    p.hero.readiness = 6;
    p.stock = { P: 200, M: 200, K: 200, E: 200 };
    const u = s.units["p1:company:0"];
    Object.assign(u, { x: 4, y: 4, move: 8 });
    s.units[p.hero.id] = { ...structuredClone(u), id: p.hero.id, kind: "hero" };
    for (let x = 4; x <= 6; x++)
      s.map.terrain[4 * s.map.width + x] = "woodland";
    Object.assign(s.facilities["p1:core"], { x: 4, y: 4 });
    s.facilities.destination = {
      ...structuredClone(s.facilities["p1:core"]),
      id: "destination",
      name: "Wooded destination",
      x: 6,
      y: 4,
    };
    for (const x of [6, 4]) {
      const r = submit(s, {
        id: `survey-${x}`,
        seat: "p1",
        seq: s.nextSeq.p1,
        turn: s.turn,
        revision: s.revision,
        action: { kind: "move", unit: u.id, x, y: 4 },
      });
      if (!r.ok) throw Error(r.reason);
      s = resolveWeek(r.state);
    }
    const r = submit(s, {
      id: "carrier",
      seat: "p1",
      seq: s.nextSeq.p1,
      turn: s.turn,
      revision: s.revision,
      action: {
        kind: "convoy",
        carrier: u.id,
        origin: "p1:core",
        destination: "destination",
        cargo: { P: 1, M: 0, K: 0, E: 0 },
      },
    });
    if (!r.ok) throw Error(r.reason);
    await saveCheckpoint(resolveWeek(r.state));
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "World", exact: true }).click();
  await page
    .getByText("Woodland roads and thresholds", { exact: true })
    .click();
  await page.locator("#forest-survey").selectOption({ index: 0 });
  await page.locator("#forest-origin").selectOption("p1:core");
  await page.locator("#forest-destination").selectOption("destination");
  await page.getByRole("button", { name: "Review Guest Road" }).click();
  await expect(page.getByRole("dialog")).toContainText("10M");
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page.locator("#forest-release")).toContainText("maintained");
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await expect(page.locator("#status")).toContainText("committed and saved");
  const s = await page.evaluate(async () => {
    const { loadCheckpoint } = await import(
      "/src/persistence/checkpoints.ts" as string
    );
    return (await loadCheckpoint())!.state;
  });
  expect(s.forestRoutes).toEqual({});
  expect(Object.values(s.convoys)[0]).toMatchObject({
    phase: "unloading",
    x: 6,
    y: 4,
    cargo: { P: 1, M: 0, K: 0, E: 0 },
  });
  expect(s.units["p1:company:0"]).toMatchObject({ x: 6, y: 4 });
  await page
    .getByText("Woodland roads and thresholds", { exact: true })
    .click();
  await page.locator("#forest-origin").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/melian-road.png",
    fullPage: true,
  });
});
