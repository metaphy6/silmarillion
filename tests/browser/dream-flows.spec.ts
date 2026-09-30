import { test, expect } from "@playwright/test";
test("Irmo reviews paid rest and rehearsal, cancels by keyboard, completes and reloads the private preparation", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { createMatch } = await import("/src/simulation/engine.ts" as string);
    const { saveCheckpoint } = await import(
      "/src/persistence/checkpoints.ts" as string
    );
    const s = createMatch(["irmo", "human_gondor"], 127);
    s.players.p2.ai = false;
    const p = s.players.p1,
      u = s.units["p1:company:0"];
    p.hero.status = "living";
    p.hero.readiness = 6;
    s.units[p.hero.id] = {
      ...structuredClone(u),
      id: p.hero.id,
      kind: "hero",
      x: 4,
      y: 5,
    };
    Object.assign(u, {
      x: 4,
      y: 4,
      effects: [
        { kind: "fatigue", value: 2, until: 1000000, source: "travel" },
      ],
    });
    s.facilities.refuge = {
      ...structuredClone(s.facilities["p1:core"]),
      id: "refuge",
      kind: "refuge",
      name: "Rest garden",
      x: 4,
      y: 4,
    };
    await saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page
    .locator("#rest-unit")
    .locator("..")
    .locator("..")
    .evaluate((el: HTMLDetailsElement) => (el.open = true));
  await page.locator("#rest-unit").selectOption("p1:company:0");
  await page.locator("#rest-facility").selectOption("refuge");
  await page.locator('[data-action="rest"]').click();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await page.getByText("Rehearsal in Dream", { exact: true }).click();
  await page.locator("#dream-rest").selectOption("refuge");
  await page.getByRole("button", { name: "Review dream rehearsal" }).click();
  await expect(page.getByRole("dialog")).toContainText("3 readiness");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Review dream rehearsal" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Review dream rehearsal" }).click();
  await page.getByRole("button", { name: "Confirm order" }).click();
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
  expect(Object.values(s.dreamPlans)[0]).toMatchObject({
    phase: "ready",
    contingency: "fear",
    expiresTurn: 2,
  });
  expect(s.facilities.refuge.rest).toBeUndefined();
  await page.reload();
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page.getByText("Rehearsal in Dream", { exact: true }).click();
  await expect(page.locator("#dream-plan")).toContainText("ready");
  await page.locator("#dream-plan").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/dream-controls.png" });
  await page.setViewportSize({ width: 700, height: 1000 });
  await page.locator("#dream-plan").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/dream-controls-compact.png" });
});
