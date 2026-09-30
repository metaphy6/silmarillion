import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { cpus, totalmem, platform, release } from "node:os";

// Reproduce the retained weekly mode baseline before comparing the RTS slice.
test("weekly runtime baseline: paid production, resolution and frame evidence", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?mode=weekly");
  await page.locator("#faction").selectOption("human_gondor");
  await page.locator("#tutorial").uncheck();
  await page.getByRole("button", { name: "Begin Cross-era sandbox" }).click();
  await page.getByRole("button", { name: "Economy", exact: true }).click();
  await page
    .locator("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Signature component",
        exact: true,
      }),
    })
    .getByRole("button")
    .click();
  await expect(page.locator("#confirm")).toBeEnabled();
  const acknowledgment = await page
    .locator("#confirm")
    .evaluate(async (button) => {
      const begin = performance.now();
      (button as HTMLButtonElement).click();
      const synchronousMs = performance.now() - begin;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      return {
        synchronousMs,
        nextFrameMs: performance.now() - begin,
        status: document.querySelector("#status")?.textContent,
      };
    });
  await page
    .getByRole("button", { name: "Resolve week →", exact: true })
    .click();
  await expect(page.locator("#status")).toContainText("Week 2 committed");
  await page.getByRole("button", { name: "World", exact: true }).click();
  await page.waitForSelector("canvas");
  const measurement = await page.evaluate(async () => {
    const samples: number[] = [];
    let last = 0;
    await new Promise<void>((resolve) => {
      const frame = (now: number) => {
        if (last) samples.push(now - last);
        last = now;
        if (samples.length === 180) resolve();
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    samples.sort((a, b) => a - b);
    const persistence = await import(
      "/src/persistence/checkpoints.ts" as string
    );
    const saved = await persistence.loadCheckpoint();
    return {
      frameSamples: samples.length,
      frameP50Ms: samples[90],
      frameP95Ms: samples[171],
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      units: Object.keys(saved.state.units).length,
      turn: saved.state.turn,
      stocks: saved.state.players.p1.stock,
    };
  });
  await page.screenshot({ path: "docs/reports/runtime/rts-before.png" });
  writeFileSync(
    "docs/reports/runtime/rts-baseline.json",
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        browser: browser.version(),
        viewport: page.viewportSize(),
        hardware: {
          cpu: cpus()[0]?.model,
          logicalCpus: cpus().length,
          memoryBytes: totalmem(),
          os: platform(),
          kernel: release(),
        },
        acknowledgment,
        ...measurement,
        scope:
          "Actual default weekly scene after paid signature-component production and one resolution; headless Chromium Canvas on this workstation. The click measurement is browser-side handler-to-next-animation-frame, not physical input latency. Not a real-time battle benchmark.",
      },
      null,
      2,
    ) + "\n",
  );
  expect(measurement.turn).toBe(2);
  expect(measurement.units).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
