import { expect, it } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  preview,
} from "../src/simulation/engine";
import {
  encodeCheckpoint,
  decodeCheckpoint,
} from "../src/persistence/checkpoints";
import { guestSnapshot } from "../src/network/protocol";
import { parseMatch } from "../src/simulation/schema";
import type { Action, Match } from "../src/simulation/types";
function order(s: Match, a: Action) {
  return submit(s, {
    id: `log:${s.nextSeq.p1}`,
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action: a,
  });
}
it("two-phase rescue charges one encounter commitment, preserves allied identity in guest saves and completes real route", () => {
  let s = createMatch(["eagle_eyrie", "human_rohan"], 8);
  s.infrastructureSites = {};
  const p = s.players.p1,
    worker = Object.values(s.units).find(
      (u) => u.owner === "p2" && u.kind === "worker",
    )!;
  worker.x = 3;
  worker.y = 3;
  const h = {
    ...structuredClone(worker),
    id: p.hero.id,
    owner: "p1",
    kind: "hero" as const,
    loadClass: "standard" as const,
    flying: true,
    landed: false,
    move: 6,
  };
  s.units[h.id] = h;
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.relations.p2 = "alliance";
  s.players.p2.relations.p1 = "alliance";
  const r = order(s, {
    kind: "logistics",
    mode: "lift",
    unit: worker.id,
    to: { x: 7, y: 3 },
  });
  expect(r.ok, r.reason).toBe(true);
  expect(preview(r.state, "p1").players.p1.commitment).toBe(0);
  s = resolveWeek(r.state);
  expect(s.units[h.id].x).toBe(5);
  expect(s.units[worker.id].x).toBe(5);
  expect(() => encodeCheckpoint(s)).toThrow(/committed turn boundary/);
  s = parseMatch(JSON.parse(JSON.stringify(s)));
  const guest = guestSnapshot(s, "p2");
  expect(Object.keys(guest.logisticsJobs)).toHaveLength(1);
  expect(guest.units[h.id]?.inventory).toEqual([]);
  expect(() => parseMatch(guest, "p2")).not.toThrow();
  expect(order(s, { kind: "move", unit: h.id, x: 6, y: 3 }).reason).toMatch(
    /reserved|carrying/,
  );
  s = resolveWeek(s);
  expect(s.units[worker.id].x).toBe(7);
  expect(Object.keys(s.logisticsJobs)).toHaveLength(0);
  s = resolveWeek(s);
  expect(s.combatPhase).toBe(0);
  expect(decodeCheckpoint(encodeCheckpoint(s)).state.units[worker.id].x).toBe(
    7,
  );
});
it("Numenor power consumes weekly commitment, preserves operations and hides other player ship-transfer plans", async () => {
  const { spawnVessel } = await import("../src/simulation/naval");
  const s = createMatch(["human_numenor", "human_rohan"], 44);
  s.infrastructureSites = {};
  const p = s.players.p1,
    f = s.facilities["p1:core"];
  f.kind = "harbor";
  s.map.terrain[(f.y + 1) * s.map.width + f.x] = "water";
  const worker = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  worker.x = f.x;
  worker.y = f.y;
  s.units[p.hero.id] = {
    ...structuredClone(worker),
    id: p.hero.id,
    kind: "hero",
    loadClass: "standard",
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  const v = spawnVessel(s, "p1", f.id, worker.id, { x: f.x, y: f.y + 1 }),
    otherWorker = {
      ...structuredClone(worker),
      id: "another-worker",
      x: f.x,
      y: f.y,
    };
  s.units[otherWorker.id] = otherWorker;
  const w = spawnVessel(s, "p1", f.id, otherWorker.id, { x: f.x, y: f.y + 1 });
  v.cargo.P = 4;
  const r = order(s, {
    kind: "logistics",
    mode: "redistribute",
    method: "power",
    harbor: f.id,
    loads: [
      { ship: v.id, cargo: { P: 0, M: 0, K: 0, E: 0 }, passenger: null },
      { ship: w.id, cargo: { P: 4, M: 0, K: 0, E: 0 }, passenger: null },
    ],
  });
  expect(r.ok, r.reason).toBe(true);
  const state = preview(r.state, "p1");
  expect(state.players.p1.commitment).toBe(0);
  expect(state.players.p1.operations).toBe(3);
  expect(state.players.p1.stock.P).toBe(p.stock.P - 5);
  expect(Object.keys(guestSnapshot(state, "p2").logisticsJobs)).toHaveLength(0);
});
