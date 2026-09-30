import type {Match} from "../../src/simulation/types";
import { test, expect } from "@playwright/test";
test("Nienna reviews a real recorded injury, offers exact terms, cancels by keyboard and reloads", async ({
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
    let s:Match = createMatch(["nienna", "human_gondor"], 127);
    s.players.p2.ai = false;
    Object.assign(s.units["p2:company:0"], { x: 5, y: 4, attack: 6 });
    const r = submit(s, {
      id: "actual-injury",
      seat: "p2",
      seq: s.nextSeq.p2,
      turn: s.turn,
      revision: s.revision,
      action: { kind: "attack", unit: "p2:company:0", target: "p1:company:0" },
    });
    if (!r.ok) throw Error(r.reason);
    s = resolveWeek(r.state);
    while (s.combatPhase) s = resolveWeek(s);
    await saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page.getByText("Council of Repair", { exact: true }).click();
  await page.locator("#council-grievance").selectOption({ index: 0 });
  await page
    .getByRole("button", { name: "Review exact terms", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("5P");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Review exact terms", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Review exact terms", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm order", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await expect(page.locator("#status")).toContainText("committed and saved");
  await page.reload();
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page.getByText("Council of Repair", { exact: true }).click();
  await expect(
    page.locator("details").filter({ has: page.locator("#council-grievance") }),
  ).toContainText("5P 0M 0K 0E");
  await page.locator("#council-grievance").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/council-desktop.png" });
  await page.setViewportSize({ width: 700, height: 1000 });
  await page.locator("#council-grievance").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/council-compact.png" });
});
test("Nienna reviews and settles delivered restitution through the UI", async ({
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
    let s:Match = createMatch(["nienna", "human_gondor"], 127);
    s.players.p2.ai = false;
    const p = s.players.p1,
      u = s.units["p1:company:0"];
    p.hero.status = "living";
    s.units[p.hero.id] = {
      ...structuredClone(u),
      id: p.hero.id,
      kind: "hero",
      x: 4,
      y: 5,
    };
    Object.assign(s.units["p2:company:0"], { x: 5, y: 4, attack: 6 });
    Object.assign(s.facilities["p2:core"], { x: 6, y: 4 });
    const run = (seat: string, action: unknown) => {
      const r = submit(s, {
        id: `${seat}-${s.nextSeq[seat]}`,
        seat,
        seq: s.nextSeq[seat],
        turn: s.turn,
        revision: s.revision,
        action,
      });
      if (!r.ok) throw Error(r.reason);
      s = resolveWeek(r.state);
      while (s.combatPhase) s = resolveWeek(s);
    };
    run("p2", { kind: "attack", unit: "p2:company:0", target: u.id });
    run("p1", { kind: "move", unit: u.id, x: 3, y: 4 });
    const q = Object.values(s.grievances).find(
      (q: { offenderSeat: string }) => q.offenderSeat === "p2",
    ) as { id: string };
    run("p1", {
      kind: "council-terms",
      grievance: q.id,
      mediator: "p1",
      payment: { P: 5, M: 0, K: 0, E: 0 },
    });
    run("p2", {
      kind: "council-consent",
      grievance: q.id,
      accept: true,
      termsVersion: 1,
    });
    run("p2", {
      kind: "council-deliver",
      grievance: q.id,
      carrier: "p2:company:0",
      origin: "p2:core",
      destination: "p1:core",
      route: [
        { x: 5, y: 4 },
        { x: 4, y: 4 },
      ],
    });
    await saveCheckpoint(s);
  });
  await page.getByRole("button", { name: "Continue saved match" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page.getByText("Council of Repair", { exact: true }).click();
  await page.locator("#council-grievance").selectOption({ index: 0 });
  await page
    .getByRole("button", { name: "Review settlement", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("3 readiness");
  await page
    .getByRole("button", { name: "Confirm order", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await expect(page.locator("#status")).toContainText("committed and saved");
  const settled = await page.evaluate(async () => {
    const { loadCheckpoint } = await import(
      "/src/persistence/checkpoints.ts" as string
    );
    return Object.values(((await loadCheckpoint()).state as Match).grievances).some(
      (q: { resolved: boolean }) => q.resolved,
    );
  });
  expect(settled).toBe(true);
});
