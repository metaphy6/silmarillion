import { expect, it } from "vitest";
import {
  createMatch,
  path,
  submit,
  resolveWeek,
  preview,
} from "../src/simulation/engine";
import {
  encodeCheckpoint,
  decodeCheckpoint,
} from "../src/persistence/checkpoints";
import { guestSnapshot } from "../src/network/protocol";
import type { Action, Match } from "../src/simulation/types";
const order = (s: Match, a: Action) =>
  submit(s, {
    id: `work:${s.nextSeq.p1}`,
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action: a,
  });
it("authored obstruction blocks land until funded work completes and invalidates cached routes", () => {
  let s = createMatch(["troll_hold", "human_rohan"], 91);
  const site = s.infrastructureSites["infrastructure:p1:haulway"],
    worker = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  worker.x = site.x;
  worker.y = site.y + 1;
  expect(path(s, worker, site, false, worker)).toBeNull();
  const terrain = s.map.terrain[site.y * s.map.width + site.x];
  const r = order(s, {
    kind: "infrastructure-work",
    site: site.id,
    worker: worker.id,
    facility: "p1:core",
  });
  expect(r.ok, r.reason).toBe(true);
  expect(
    order(r.state, {
      kind: "move",
      unit: worker.id,
      x: worker.x + 1,
      y: worker.y,
    }).reason,
  ).toMatch(/reserved/);
  expect(
    order(r.state, { kind: "produce", facility: "p1:core", recipe: "worker" })
      .ok,
  ).toBe(false);
  s = resolveWeek(r.state);
  s = decodeCheckpoint(encodeCheckpoint(s)).state;
  expect(s.infrastructureSites[site.id].blocked).toBe(true);
  s = resolveWeek(s);
  expect(s.infrastructureSites[site.id].blocked).toBe(false);
  expect(s.map.terrain[site.y * s.map.width + site.x]).toBe(terrain);
  expect(
    path(s, s.units[worker.id], site, false, s.units[worker.id]),
  ).not.toBeNull();
});
it("guests see observed obstruction geometry without finite wreck yield or another players work queue", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 91),
    site = s.infrastructureSites["infrastructure:p1:wreck"];
  const observer = s.units["p2:company:0"];
  observer.x = site.x;
  observer.y = site.y + 1;
  const guest = guestSnapshot(s, "p2");
  expect(guest.infrastructureSites[site.id]?.yield).toEqual({
    P: 0,
    M: 0,
    K: 0,
    E: 0,
  });
  expect(
    Object.values(guest.infrastructureWork).every((j) => j.owner === "p2"),
  ).toBe(true);
});
it("Troll support consumes commitment and exact supplied cost on a funded existing job", () => {
  const s = createMatch(["troll_hold", "human_rohan"], 91),
    p = s.players.p1,
    site = s.infrastructureSites["infrastructure:p1:haulway"],
    worker = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  worker.x = site.x;
  worker.y = site.y + 1;
  s.units[p.hero.id] = {
    ...structuredClone(worker),
    id: p.hero.id,
    kind: "hero",
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  const funded = order(s, {
    kind: "infrastructure-work",
    site: site.id,
    worker: worker.id,
    facility: "p1:core",
  });
  expect(funded.ok).toBe(true);
  const planned = preview(funded.state, "p1"),
    job = Object.keys(planned.infrastructureWork)[0];
  const powered = order(funded.state, { kind: "infrastructure-power", job });
  expect(powered.ok, powered.reason).toBe(true);
  const reserved = preview(powered.state, "p1");
  expect(reserved.players.p1.commitment).toBe(0);
  expect(reserved.players.p1.stock.M).toBe(p.stock.M - 15);
  expect(resolveWeek(powered.state).infrastructureSites[site.id].blocked).toBe(
    false,
  );
});
