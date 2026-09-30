import { test, expect } from "@playwright/test";
test("an actual worker constructs a paid timber defense without creating new staff", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const e = await import("/src/simulation/engine.ts" as string),
      p = await import("/src/persistence/checkpoints.ts" as string);
    const s = e.createMatch(["human_gondor", "human_rohan"], 93);
    s.map.terrain.fill("meadow");s.waterChannels={};
    s.seaHazards = {};s.shallowWater={};
    s.infrastructureSites = {};
    s.players.p2.ai = false;
    s.players.p1.stock = { P: 500, M: 500, K: 500, E: 500 };
    Object.assign(s.facilities["p1:core"], { x: 4, y: 4 });
    const worker = (
      Object.values(s.units) as Array<{
        owner: string;
        kind: string;
        x: number;
        y: number;
      }>
    ).find((u) => u.owner === "p1" && u.kind === "worker")!;
    Object.assign(worker, { x: 5, y: 4 });
    await p.saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page
    .getByText("Physical defenses and carried repair supplies", { exact: true })
    .click();
  await page.locator("#field-form").selectOption("barricade");
  await page.locator("#field-material").selectOption("timber");
  await page.locator("#field-x").fill("5");
  await page.locator("#field-y").fill("5");
  await page.getByRole("button", { name: "Review staffed fieldwork" }).click();
  await expect(page.locator("dialog")).toContainText("actual worker");
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  const s = await page.evaluate(async () => {
    const p = await import("/src/persistence/checkpoints.ts" as string);
    return (await p.loadCheckpoint()).state;
  });
  const ids = Object.keys(s.fieldworks);
  expect(ids).toHaveLength(1);
  expect(s.facilities[ids[0]]).toMatchObject({
    x: 5,
    y: 5,
    kind: "barricade",
    workers: 0,
    hp: 60,
  });
  expect(s.fieldworks[ids[0]].material).toBe("timber");
  expect(Object.keys(s.fieldworkJobs)).toHaveLength(0);
});
