import { test, expect } from "@playwright/test";
test("Rohan playable creation, AI resolution, save restore and text reflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Begin Cross-era sandbox" }).click();
  await page.getByRole("button", { name: "Close tutorial" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  const component = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Signature component",
      exact: true,
    }),
  });
  await component.getByRole("button").click();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page.getByRole("button", { name: "Resolve week" }).click();
  await expect(page.locator("#status")).toContainText("Week 2 committed");
  const hero = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Create / recreate Rider Marshal",
      exact: true,
    }),
  });
  await hero.getByRole("button").click();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page.getByRole("button", { name: "Resolve week" }).click();
  await expect(page.locator("#status")).toContainText("Week 3 committed");
  await page.getByRole("button", { name: "Resolve week" }).click();
  await page.getByRole("button", { name: "Hero", exact: true }).click();
  await expect(page.locator("#controls")).toContainText("LIVING");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#text-scale").selectOption("2");
  await expect(page.locator("#controls")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator("#text-scale").selectOption("1");
  await page.screenshot({ path: "docs/reports/runtime/local-1440.png" });
  await page.reload();
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await expect(page.locator(".topbar")).toContainText("Week 4");
  expect(errors).toEqual([]);
});

test("committed objective control reaches visible victory through the playable turn controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const engine = await import("/src/simulation/engine.ts" as string),
      storage = await import("/src/persistence/checkpoints.ts" as string);
    const s = engine.createMatch(["human_rohan", "human_gondor"], 2026);
    s.turn = 8;
    s.players.p2.ai = false;
    Object.assign(s.units["p1:company:0"], {
      x: s.sites[0].x,
      y: s.sites[0].y,
    });
    Object.assign(s.units["p1:company:1"], {
      x: s.sites[1].x,
      y: s.sites[1].y,
    });
    await storage.saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Resolve week" }).click();
  await expect(page.locator(".victory")).toContainText("Victory");
});

test("compact viewport, 200-percent text, keyboard cancellation and landscape view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#tutorial").uncheck();
  await page.getByRole("button", { name: "Begin Cross-era sandbox" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const mapGap = await page.evaluate(() => {
    const controls = document.querySelector('#controls')!.getBoundingClientRect();
    const objectives = document.querySelector('.objectives')!.getBoundingClientRect();
    return controls.top - objectives.bottom;
  });
  expect(mapGap).toBeGreaterThan(150);
  await page.locator("#text-scale").selectOption("2");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#text-scale").selectOption("1");
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  const component = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Signature component",
      exact: true,
    }),
  });
  await component.getByRole("button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Hero", exact: true }).click();
  await expect(page.locator(".portrait")).toBeVisible();
  const turnButton = await page.getByRole('button', { name: 'Resolve week →', exact: true }).boundingBox();
  expect(turnButton!.y + turnButton!.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: "docs/reports/runtime/compact-390.png" });
  await page
    .getByRole("button", { name: "View landscape", exact: true })
    .click();
  await expect(page.locator("#controls")).toBeHidden();
  await page
    .getByRole("button", { name: "Show controls", exact: true })
    .click();
  await expect(page.locator("#controls")).toBeVisible();
});

test("damaged equipment is repaired through a paid workshop queue and saved with its identity", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const engine = await import("/src/simulation/engine.ts" as string),
      storage = await import("/src/persistence/checkpoints.ts" as string);
    const s = engine.createMatch(["elf_feanor", "human_rohan"], 42),
      f = s.facilities["p1:core"];
    s.players.p2.ai = false;
    s.facilities.work = {
      ...f,
      id: "work",
      kind: "workshop",
      name: "Repair test workshop",
    };
    s.items.gear = {
      id: "gear",
      name: "Worn field fitting",
      owner: "p1",
      bearer: null,
      bonus: 1,
      attackBonus: 1,
      durability: 20,
      maxDurability: 100,
      crafted: true,
      materials: ["metal"],
      x: f.x,
      y: f.y,
    };
    await storage.saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page.locator("#facility").selectOption("work");
  await page
    .getByText("Paid repairs and equipment wear", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review ordinary repair", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("20M + 5K");
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page.getByRole("button", { name: "Resolve week" }).click();
  await expect(page.locator("#recipes")).toContainText("1 weeks");
  await page.getByRole("button", { name: "Resolve week" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await expect(page.locator("#repair-target")).toContainText("45/100");
});

test("physical convoy UI commits real cargo, travels and unloads once", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const e = await import("/src/simulation/engine.ts" as string),
      p = await import("/src/persistence/checkpoints.ts" as string);
    const s = e.createMatch(["human_rohan", "human_gondor"], 41),
      f = s.facilities["p1:core"],
      u = s.units["p1:company:0"];
    s.players.p2.ai = false;
    Object.assign(u, { x: f.x, y: f.y, move: 2 });
    s.facilities.dest = {
      ...f,
      id: "dest",
      name: "Northern store",
      x: f.x + 4,
      kind: "farm",
    };
    await p.saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page.getByText("Physical convoys", { exact: true }).click();
  await page.locator("#convoy-carrier").selectOption("p1:company:0");
  await page.locator("#convoy-origin").selectOption("p1:core");
  await page.locator("#convoy-destination").selectOption("dest");
  await page
    .getByRole("button", { name: "Review convoy", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("real cargo plus 1P");
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page.getByRole("button", { name: "Resolve week" }).click();
  await expect(page.locator("#existing-convoy")).toContainText("travel");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Resolve week" }).click();
  await expect(page.locator("#existing-convoy option")).toHaveCount(0);
  const saved = await page.evaluate(async () => {
    const p = await import("/src/persistence/checkpoints.ts" as string);
    return (await p.loadCheckpoint()).state;
  });
  expect(saved.units["p1:company:0"].x).toBe(8);
  expect(Object.keys(saved.convoys)).toHaveLength(0);
});

test("Spider power creates an inspectable fixed terrain zone with rendered bounds", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const e = await import("/src/simulation/engine.ts" as string),
      p = await import("/src/persistence/checkpoints.ts" as string);
    const s = e.createMatch(["spider_brood", "human_rohan"], 62),
      owner = s.players.p1,
      u = s.units["p1:company:0"];
    owner.hero.status = "living";
    owner.hero.readiness = 6;
    s.players.p2.ai = false;
    s.units[owner.hero.id] = {
      ...structuredClone(u),
      id: owner.hero.id,
      kind: "hero",
      name: "Brood Mother",
      x: 4,
      y: 4,
      effects: [],
      inventory: [],
    };
    Object.assign(s.units["p2:company:0"], { x: 5, y: 4 });
    await p.saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Hero", exact: true }).click();
  await page.locator("#target").selectOption("p2:company:0");
  await page.getByRole("button", { name: "Review power", exact: true }).click();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page.getByRole("button", { name: "Resolve week" }).click();
  await page.getByRole("button", { name: "World", exact: true }).click();
  await page.getByText("Observed terrain effects", { exact: true }).click();
  // The two-tile line is centered on (5,4), so its persisted first endpoint is (5,3).
  await expect(page.locator("#controls")).toContainText("web at (5,3)");
  await page.screenshot({ path: "docs/reports/runtime/zones.png" });
});
