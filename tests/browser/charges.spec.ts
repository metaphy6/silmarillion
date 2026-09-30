import { test, expect } from "@playwright/test";
test("Rohan reviews a real approach, waits for response, then moves its existing company", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const e = await import("/src/simulation/engine.ts" as string),
      p = await import("/src/persistence/checkpoints.ts" as string);
    const s = e.createMatch(["human_rohan", "human_gondor"], 53);
    s.map.terrain.fill("meadow");s.waterChannels={};
    s.seaHazards = {};s.shallowWater={};
    s.infrastructureSites = {};
    s.players.p2.ai = false;
    const owner = s.players.p1,
      a = s.units["p1:company:0"],
      target = s.units["p2:company:0"];
    owner.hero.status = "living";
    owner.hero.readiness = 6;
    s.units[owner.hero.id] = {
      ...structuredClone(a),
      id: owner.hero.id,
      kind: "hero",
      x: 8,
      y: 9,
      effects: [],
    };
    Object.assign(a, { x: 8, y: 10, move: 4 });
    Object.assign(target, { x: 11, y: 10, hp: 100, maxHp: 100 });
    for (const u of Object.values(s.units) as Array<{
      owner: string;
      x: number;
      y: number;
    }>)
      if (u.owner === "p2" && u !== target) {
        u.x = 28;
        u.y = 28;
      }
    await p.saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page
    .getByText("Prepared charges and divided pursuit", { exact: true })
    .click();
  await page.locator("#charge-target").selectOption("p2:company:0");
  await page.locator("#charge-unit-0").selectOption("p1:company:0");
  await page.locator("#charge-x-0").fill("10");
  await page.locator("#charge-y-0").fill("10");
  await page.getByRole("button", { name: "Review prepared charge" }).click();
  await expect(page.locator("dialog")).toContainText(
    "1 reserved ordinary operations",
  );
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await expect(page.locator(".topbar")).toContainText("tactical phase");
  await page.locator("#entity").selectOption("p1:company:0");
  await expect(page.locator("#controls")).toContainText("(8, 10)");
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await expect(page.locator("#controls")).toContainText("(10, 10)");
});
