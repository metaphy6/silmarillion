import { test, expect } from "@playwright/test";
test("situated conversation reviews an ordinary paid rest order and cancellation costs nothing", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const e = await import("/src/simulation/engine.ts" as string),
      p = await import("/src/persistence/checkpoints.ts" as string);
    const s = e.createMatch(["human_rohan", "elf_finarfin"], 19),
      f = s.facilities["p1:core"],
      u = s.units["p1:company:0"];
    s.players.p2.ai = false;
    f.kind = "refuge";
    u.x = f.x;
    u.y = f.y;
    u.effects.push({
      kind: "fatigue",
      value: 2,
      source: "ordinary-travel",
      until: 1000000,
    });
    await p.saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByText("The Empty Hook", { exact: true }).click();
  await expect(page.locator("#controls")).toContainText(
    "not what waits on its next road",
  );
  await page
    .getByRole("button", { name: "Review paid rest for this party" })
    .click();
  await expect(page.locator("dialog")).toContainText("2P");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".turnbar")).toContainText("0 planned orders");
  await page
    .getByRole("button", { name: "Review paid rest for this party" })
    .click();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page.locator(".turnbar")).toContainText("1 planned orders");
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  const saved = await page.evaluate(async () => {
    const p = await import("/src/persistence/checkpoints.ts" as string);
    return (await p.loadCheckpoint()).state;
  });
  expect(
    saved.units["p1:company:0"].effects.some(
      (e: { kind: string }) => e.kind === "fatigue",
    ),
  ).toBe(false);
});
