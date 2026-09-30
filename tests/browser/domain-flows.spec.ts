import { test, expect, type Page } from "@playwright/test";

async function fixture(page: Page, profile: string) {
  await page.goto("/");
  await page.evaluate(async (profile) => {
    const e = await import("/src/simulation/engine.ts" as string);
    const p = await import("/src/persistence/checkpoints.ts" as string);
    const s = e.createMatch([profile, "human_gondor"], 84);
    s.map.terrain.fill("meadow");s.waterChannels={};s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
    s.players.p2.ai = false;
    const owner = s.players.p1, u = s.units["p1:company:0"];
    owner.hero.status = "living";
    s.units[owner.hero.id] = { ...structuredClone(u), id: owner.hero.id,
      kind: "hero", name: "Domain test hero", x: 10, y: 10, effects: [], inventory: [] };
    Object.assign(u, { x: 11, y: 10, move: 4 });
    if (profile === "varda") {
      Object.assign(s.units["p2:company:0"], { x: 12, y: 10, name: "Secret identity must stay hidden",
        effects: [{ kind: "concealed", value: 1, source: "test-concealment", until: 1000000 }] });
    }
    if (profile === "elf_finarfin") {
      s.facilities.refuge = { ...s.facilities["p1:core"], id: "refuge", kind: "refuge", name: "Quiet rest refuge", x:11,y:10 };
      u.effects.push({ kind: "fatigue", value: 5, source: "ordinary-travel", until: 1000000 });
    }
    await p.saveCheckpoint(s);
  }, profile);
  await page.getByRole("button", { name: "Continue saved match" }).click();
}

test("Varda casts on observed terrain and exposes a silhouette without identity", async ({ page }) => {
  await fixture(page, "varda");
  await page.getByRole("button", { name: "Hero", exact: true }).click();
  await expect(page.locator("#target")).not.toContainText("Secret identity must stay hidden");
  await page.locator("#point-cast").check();
  await page.locator("#power-x").fill("12");
  await page.locator("#power-y").fill("10");
  await page.getByRole("button", { name: "Review power", exact: true }).first().click();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page.getByRole("button", { name: "Resolve week" }).click();
  await page.getByRole("button", { name: "World", exact: true }).click();
  await expect(page.locator("#controls")).toContainText("Unidentified silhouettes: (12,10)");
  await expect(page.locator("#controls")).not.toContainText("Secret identity must stay hidden");
  await page.getByText("Observed terrain effects", { exact: true }).click();
  await expect(page.locator("#controls")).toContainText("light at (12,10)");
  await page.getByRole("button", {name:"Locate",exact:true}).click();
  await page.screenshot({ path: "docs/reports/runtime/domain-flows.png" });
});

test("Nessa's declared movement pays an operation and waits for the response phase", async ({ page }) => {
  await fixture(page, "nessa");
  await page.getByRole("button", { name: "Hero", exact: true }).click();
  await page.getByText("Declared movement power", {exact:true}).click();
  await page.locator("#plan-unit-0").selectOption("p1:company:0");
  await page.locator("#plan-x-0").fill("13");
  await page.locator("#plan-y-0").fill("10");
  await page.getByRole("button", { name: "Review movement power", exact: true }).click();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page.locator(".topbar")).toContainText("2/3 operations");
  await page.getByRole("button", { name: "Resolve week" }).click();
  await expect(page.locator("#plan-unit-0 option[value='p1:company:0']")).toContainText("(11,10)");
  await expect(page.locator("#controls")).toContainText("Declared plan");
  await page.getByRole("button", { name: "Resolve week" }).click();
  await expect(page.locator("#plan-unit-0 option[value='p1:company:0']")).toContainText("(13,10)");
  await expect(page.locator(".topbar")).toContainText("2/3 operations");
});

test("paid refuge rest reduces fatigue through the real queue and survives save reload", async ({ page }) => {
  await fixture(page, "elf_finarfin");
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page.getByText("Rest and travel fatigue", {exact:true}).click();
  await page.locator("#rest-unit").selectOption("p1:company:0");
  await page.locator("#rest-facility").selectOption("refuge");
  await page.getByRole("button", {name:"Review paid rest",exact:true}).click();
  await expect(page.getByRole("dialog")).toContainText("2P");
  await page.getByRole("button", {name:"Confirm order"}).click();
  await expect(page.locator(".topbar")).toContainText("2/3 operations");
  await page.getByRole("button", {name:"Resolve week"}).click();
  await expect(page.locator("#rest-unit option[value='p1:company:0']")).toContainText("fatigue 2/6");
  await page.reload();
  await page.getByRole("button", {name:"Continue saved match"}).click();
  await page.getByRole("button", {name:"Economy",exact:true}).click();
  await expect(page.locator("#rest-unit option[value='p1:company:0']")).toContainText("fatigue 2/6");
});
