import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
for (const failure of [
  "before-acceptance",
  "after-acceptance",
  "partial-first-welcome",
] as const)
  test(`actual local WebRTC recovery: ${failure}`, async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(async (failure) => {
      const sessionPath = "/src/network/session.ts",
        enginePath = "/src/simulation/engine.ts",
        persistencePath = "/src/persistence/checkpoints.ts";
      const { MatchSession } = await import(sessionPath),
        { createMatch } = await import(enginePath),
        { encodeCheckpoint, decodeCheckpoint } = await import(persistencePath);
      const wait = async (check: () => boolean) => {
        const end = performance.now() + 8000;
        while (!check()) {
          if (performance.now() > end)
            throw new Error("Recovery condition timed out");
          await new Promise((r) => setTimeout(r, 20));
        }
      };
      const messages: string[] = [];
      let synchronized = 0;
      const host = new MatchSession(
        () => {},
        (s: string) => messages.push(s),
      );
      const guest = new MatchSession(
        () => {
          synchronized++;
        },
        (s: string) => messages.push(s),
      );
      const state = createMatch(["human_rohan", "human_gondor"], 812);
      // Force a multi-frame welcome while preserving valid authoritative state.
      if (failure === "partial-first-welcome")
        for (let n = 0; n < 300; n++)
          state.events.push({
            id: 1000 + n,
            turn: 1,
            audience: "public",
            text: "Snapshot transfer fixture ".repeat(8),
          });
      const invite = await host.host(state, true);
      let interrupted = false;
      if (failure === "partial-first-welcome") {
        const send = host.transport.send.bind(host.transport);
        host.transport.send = (peer: string, raw: string) => {
          const frame = JSON.parse(raw);
          if (!interrupted && frame.type === "chunk" && frame.index === 1) {
            interrupted = true;
            guest.transport.close();
            return;
          }
          send(peer, raw);
        };
      }
      await guest.join(invite, "p2");
      if (failure === "partial-first-welcome") {
        await wait(() => interrupted && !host.authority.assignments.p2);
        if (synchronized !== 0)
          throw new Error("Incomplete snapshot was applied");
        await guest.reconnect();
        await wait(() => synchronized > 0);
      } else {
        await wait(() => synchronized > 0);
        if (failure === "before-acceptance") {
          guest.transport.send = () => {
            interrupted = true;
            guest.transport.close();
            throw new Error("Injected drop before acceptance");
          };
        } else {
          const send = host.transport.send.bind(host.transport);
          host.transport.send = (peer: string, raw: string) => {
            if (!interrupted) {
              interrupted = true;
              guest.transport.close();
              return;
            }
            send(peer, raw);
          };
        }
        const order = {
          id: "fault-order",
          seat: "p2",
          seq: 1,
          turn: 1,
          revision: 0,
          action: { kind: "exchange" },
        };
        try {
          guest.order(order);
        } catch (e) {
          if (failure !== "before-acceptance") throw e;
        }
        await wait(() => interrupted && !host.authority.assignments.p2);
        const before = host.authority.state.orders.length;
        if (before !== (failure === "before-acceptance" ? 0 : 1))
          throw new Error("Unexpected acceptance boundary");
        await guest.reconnect();
        await wait(
          () =>
            host.authority.state.orders.length === 1 &&
            messages.includes(
              "Connected as p2; filtered snapshot synchronized",
            ),
        );
        await wait(() =>
          messages.some(
            (s) =>
              s === "Already accepted" ||
              s === "Order reserved; resolves with the week",
          ),
        );
      }
      // Resolve a committed turn and restore a new host with the same seat secret.
      const h = host.authority;
      const ready = (seat: string) => ({
        id: `ready-${seat}`,
        seat,
        seq: h.state.nextSeq[seat],
        turn: h.state.turn,
        revision: h.state.revision,
        action: { kind: "ready" },
      });
      guest.order(ready("p2"));
      await wait(() => h.state.players.p2.ready);
      host.order(ready("p1"));
      await host.resolve();
      const saved = decodeCheckpoint(
        encodeCheckpoint(h.state, h.assignments, h.seatTokens),
      );
      host.close();
      const recovered = new MatchSession(
        () => {},
        (s: string) => messages.push(s),
      );
      const restoredInvite = await recovered.host(
        saved.state,
        true,
        saved.seatTokens,
      );
      guest.close();
      const restoredGuest = new MatchSession(
        () => {},
        (s: string) => messages.push(s),
      );
      await restoredGuest.join(restoredInvite, "p2");
      await wait(() => Boolean(recovered.authority.assignments.p2));
      const summary = {
        turn: recovered.authority.state.turn,
        sequence: recovered.authority.state.nextSeq.p2,
        receipts: recovered.authority.state.receipts.p2.map(
          (r: { id: string }) => r.id,
        ),
        restored: true,
        interrupted,
      };
      restoredGuest.close();
      recovered.close();
      return summary;
    }, failure);
    expect(result).toMatchObject({
      turn: 2,
      restored: true,
      interrupted: true,
    });
    expect(result.sequence).toBe(failure === "partial-first-welcome" ? 2 : 3);
    expect(
      result.receipts.filter((id: string) => id === "fault-order"),
    ).toHaveLength(failure === "partial-first-welcome" ? 0 : 1);
  });
for (const count of [2, 3, 4])
  test(`${count} actual WebRTC tabs authenticate seats, commit and resolve`, async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const host = await context.newPage();
    await host.goto(process.env.SILMARILLION_TEST_URL ?? "/");
    await host.locator("#count").selectOption(String(count));
    await host.locator("#tutorial").uncheck();
    await host.getByRole("button", { name: "Begin Cross-era sandbox" }).click();
    await host.getByRole("button", { name: "Network", exact: true }).click();
    await host.locator("#local-network").check();
    await host.getByRole("button", { name: "Host current match" }).click();
    await expect(host.locator("#invite")).not.toHaveValue("");
    const invite = await host.locator("#invite").inputValue();
    const pages = [];
    for (let i = 2; i <= count; i++) {
      const p = await context.newPage();
      await p.goto(process.env.SILMARILLION_TEST_URL ?? "/");
      await p.locator("#tutorial").uncheck();
      await p.getByRole("button", { name: "Begin Cross-era sandbox" }).click();
      await p.getByRole("button", { name: "Network", exact: true }).click();
      await p.locator("#invite").fill(invite);
      await p.locator("#seat").selectOption(`p${i}`);
      await p.getByRole("button", { name: "Join private match" }).click();
      await expect(p.locator("#network-status")).toContainText(
        `Connected as p${i}`,
      );
      pages.push(p);
    }
    for (const p of pages)
      await p.getByRole("button", { name: "Commit my weekly orders" }).click();
    await host.getByRole("button", { name: "Commit my weekly orders" }).click();
    await host.getByRole("button", { name: "Resolve week" }).click();
    for (const p of [host, ...pages])
      await expect(p.locator(".topbar")).toContainText("Week 2");
    if (count === 2) {
      await host
        .getByRole("button", { name: "Save checkpoint", exact: true })
        .click();
      await expect(host.locator("#status")).toContainText("saved atomically");
      const saved = await host.evaluate(
        async () =>
          new Promise<{ hasToken: boolean; hasAssignment: boolean }>(
            (resolve, reject) => {
              const request = indexedDB.open("silmarillion-checkpoints", 1);
              request.onsuccess = () => {
                const db = request.result;
                const get = db
                  .transaction("checkpoints", "readonly")
                  .objectStore("checkpoints")
                  .get("latest");
                get.onsuccess = () => {
                  const checkpoint = JSON.parse(get.result);
                  resolve({
                    hasToken:
                      typeof checkpoint.seatTokens.p2 === "string" &&
                      checkpoint.seatTokens.p2.length >= 32,
                    hasAssignment:
                      typeof checkpoint.assignments.p2 === "string",
                  });
                  db.close();
                };
                get.onerror = () => reject(get.error);
              };
              request.onerror = () => reject(request.error);
            },
          ),
      );
      expect(saved).toEqual({ hasToken: true, hasAssignment: true });
      await host.getByRole("button", { name: "Settings", exact: true }).click();
      const downloadEvent = host.waitForEvent("download");
      await host
        .getByRole("button", { name: "Export host checkpoint", exact: true })
        .click();
      const download = await downloadEvent;
      const path = await download.path();
      if (!path) throw new Error("Missing checkpoint export");
      const exported = JSON.parse(await readFile(path, "utf8"));
      expect(typeof exported.seatTokens.p2).toBe("string");
      expect(exported.seatTokens.p2.length).toBeGreaterThanOrEqual(32);
      expect(typeof exported.assignments.p2).toBe("string");
    }
    await pages[0].getByRole("button", { name: "Reconnect seat" }).click();
    await expect(pages[0].locator("#network-status")).toContainText(
      "Connected as p2",
    );
    await host.close();
    await expect(pages[0].locator("#network-status")).toContainText(
      "Host unavailable",
    );
    await context.close();
  });
