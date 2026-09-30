import { test, expect } from "@playwright/test";
test("real-time skirmish exposes commands, paid queues, pause and isolated checkpoint", async ({
  page,
}) => {
  await page.goto("/?mode=rts");
  await page
    .getByRole("button", { name: "Begin real-time skirmish", exact: true })
    .click();
  await expect(
    page.getByText("Cross-era sandbox · The Two Fords", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page
    .getByLabel("Named battlefield selection")
    .selectOption({ label: "Own · Citadel Hall" });
  await page.getByRole("button", { name: /Recruit Worker/ }).click();
  await expect(page.locator("#rts-feedback")).toContainText(/Queued|queue/i);
  await page
    .getByRole("button", { name: "Save skirmish", exact: true })
    .click();
  await expect(page.locator("#rts-feedback")).toContainText("Saved");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Text scale").selectOption("2");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await expect(page.locator("body")).toHaveClass(/rts-large/);
  await page.reload();
  await page
    .getByRole("button", { name: "Continue skirmish", exact: true })
    .click();
  await expect(page.locator("#rts-clock")).toContainText("Paused");
  await expect(page.locator("#rts-queue")).toContainText(/worker/i);
});

test("constructs through keyboard commands and protects typing from battlefield hotkeys", async ({
  page,
}) => {
  await page.goto("/?mode=rts");
  await page
    .getByRole("button", { name: "Begin real-time skirmish", exact: true })
    .click();
  await page.locator("#world canvas").focus();
  await page.keyboard.press("w");
  await expect(page.locator("#rts-name")).toContainText("selected");
  await page.getByRole("button", { name: /Build Provision farm/ }).click();
  await page.getByLabel("Order X coordinate").fill("11");
  await page.getByLabel("Order Y coordinate").fill("15");
  await page.getByLabel("Order Y coordinate").press("Enter");
  await expect(page.locator("#rts-feedback")).toContainText(
    "Construction paid",
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("attack hotkey", { exact: true }).fill("q");
  await page.getByLabel("attack hotkey", { exact: true }).press("Tab");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page
    .getByLabel("Named battlefield selection")
    .selectOption({ label: "Own · Provision farm" });
  await expect(page.locator("#rts-detail")).toContainText("Ready", {
    timeout: 20000,
  });
  await page
    .getByRole("button", { name: "Save skirmish", exact: true })
    .click();
  const checkpoint = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("silmarillion-rts-save-v1")!),
  );
  expect(checkpoint.tick).toBeGreaterThan(0);
  expect(
    Object.values(checkpoint.buildings).some((b: unknown) => {
      const f = b as { kind: string; progress: number };
      return f.kind === "farm" && f.progress === 1;
    }),
  ).toBe(true);
  expect(checkpoint.players.p1.stock.M).toBeLessThan(250);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("silmarillion-rts-hotkeys-v1")!).attack,
    ),
  ).toBe("q");
});

test("visible opponents never expose private cargo, orders or queues in the HUD", async ({
  page,
}) => {
  await page.goto("/?mode=rts");
  await page.evaluate(async () => {
    const sim = (await import(
      "/src/simulation/rts.ts" as string
    )) as typeof import("../../src/simulation/rts");
    const state = sim.createRTS();
    const keep = Object.values(state.buildings).find(
      (b) => b.owner === "p2" && b.kind === "keep",
    )!;
    sim.commandRTS(state, "p2", {
      kind: "produce",
      building: keep.id,
      product: "worker",
    });
    keep.x = 11;
    keep.y = 9;
    keep.rally = { x: 12, y: 10 };
    const worker = Object.values(state.units).find(
      (u) => u.owner === "p2" && u.kind === "worker",
    )!;
    worker.x = 11;
    worker.y = 10;
    worker.cargo.E = 9;
    worker.orders = [{ kind: "move", x: 35, y: 23 }];
    localStorage.setItem("silmarillion-rts-save-v1", sim.serializeRTS(state));
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Continue skirmish", exact: true })
    .click();
  await page
    .getByLabel("Named battlefield selection")
    .selectOption({ label: "Hostile · Orthanc Workshop" });
  await expect(page.locator("#rts-queue")).toHaveText(
    "Observed opponent. Orders, cargo and production are private.",
  );
  const enemyOption = page
    .locator("#rts-entity option")
    .filter({ hasText: "Hostile · Isengard laborer" });
  await page
    .getByLabel("Named battlefield selection")
    .selectOption((await enemyOption.first().getAttribute("value")) as string);
  await expect(page.locator("#rts-detail")).not.toContainText("Carrying");
  await expect(page.locator("#rts-detail")).not.toContainText("orders");
  await expect(page.locator("#rts-queue")).not.toContainText("move");
});

test("minimap orders, queued movement and control groups acknowledge without advancing paused time", async ({
  page,
}) => {
  await page.goto("/?mode=rts");
  await page
    .getByRole("button", { name: "Begin real-time skirmish", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const firstWorker = await page
    .locator("#rts-entity option")
    .filter({ hasText: "Own · Gondor mason" })
    .first()
    .getAttribute("value");
  await page
    .getByLabel("Named battlefield selection")
    .selectOption(firstWorker!);
  await page.locator("#world canvas").focus();
  await page.keyboard.press("Control+1");
  await page.keyboard.press("e");
  await expect(page.locator("#rts-name")).toContainText("selected");
  await page.keyboard.press("1");
  await expect(page.locator("#rts-name")).toHaveText("Gondor mason");
  const minimap = page.locator("#rts-minimap"),
    bounds = (await minimap.boundingBox())!;
  await minimap.click({
    button: "right",
    position: { x: (15 / 48) * bounds.width, y: (12 / 32) * bounds.height },
  });
  await expect(page.locator("#rts-feedback")).toContainText(
    "Orders acknowledged",
  );
  await minimap.click({
    button: "right",
    modifiers: ["Shift"],
    position: { x: (17 / 48) * bounds.width, y: (13 / 32) * bounds.height },
  });
  await expect(page.locator("#rts-detail")).toContainText("2 orders");
  await page
    .getByRole("button", { name: "Save skirmish", exact: true })
    .click();
  const snapshot = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("silmarillion-rts-save-v1")!),
  );
  expect(snapshot.units[firstWorker!].orders).toHaveLength(2);
  await page.getByRole("button", { name: /Stop \[S\]/ }).click();
  await expect(page.locator("#rts-queue")).toContainText("Idle");
  await page
    .getByRole("button", { name: "Save skirmish", exact: true })
    .click();
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("silmarillion-rts-save-v1")!),
      )
    ).tick,
  ).toBe(snapshot.tick);
});

test("canvas supports direct click, additive and box selection with immediate right-click orders", async ({
  page,
}) => {
  await page.goto("/?mode=rts");
  await page
    .getByRole("button", { name: "Begin real-time skirmish", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.locator("#world canvas").focus();
  await page.keyboard.press("e");
  const points = await page.evaluate(
    () =>
      (
        window as unknown as {
          __rtsDiagnostics: () => {
            selectedPositions: {
              id: string;
              screen: { x: number; y: number };
            }[];
          };
        }
      ).__rtsDiagnostics().selectedPositions,
  );
  expect(points).toHaveLength(4);
  await page.mouse.click(points[0].screen.x, points[0].screen.y - 8);
  await expect(page.locator("#rts-name")).toHaveText("Gondor guardsman");
  await page.keyboard.down("Shift");
  await page.mouse.click(points[3].screen.x, points[3].screen.y - 8);
  await page.keyboard.up("Shift");
  await expect(page.locator("#rts-name")).toHaveText("2 selected");
  const xs = points.map((p) => p.screen.x),
    ys = points.map((p) => p.screen.y);
  await page.mouse.move(Math.min(...xs) - 20, Math.min(...ys) - 25);
  await page.mouse.down();
  await page.mouse.move(Math.max(...xs) + 20, Math.max(...ys) + 20, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.locator("#rts-name")).toContainText("selected");
  await page.mouse.click(points[0].screen.x + 130, points[0].screen.y - 50, {
    button: "right",
  });
  await expect(page.locator("#rts-feedback")).toContainText(
    "Orders acknowledged",
  );
  await page
    .getByRole("button", { name: "Save skirmish", exact: true })
    .click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("silmarillion-rts-save-v1")!),
  );
  expect(points.every((p) => state.units[p.id].orders.length > 0)).toBe(true);
});
