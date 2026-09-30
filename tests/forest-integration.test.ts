import { expect, it } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  preview,
} from "../src/simulation/engine";
import { parseMatch } from "../src/simulation/schema";
import { guestSnapshot } from "../src/network/protocol";
import { observation } from "../src/simulation/visibility";
import type { Action, Match } from "../src/simulation/types";
function setup(profile = "orome") {
  const s = createMatch([profile, "human_gondor"], 127);
  const p = s.players.p1,
    u = s.units["p1:company:0"];
  p.hero.status = "living";
  p.hero.readiness = 6;
  s.units[p.hero.id] = {
    ...structuredClone(u),
    id: p.hero.id,
    kind: "hero",
    x: 4,
    y: 4,
    move: 8,
  };
  p.stock = { P: 200, M: 200, K: 200, E: 200 };
  return s;
}
function issue(s: Match, action: Action, seat = "p1") {
  const r = submit(s, {
    id: `${seat}-${s.revision}-${s.nextSeq[seat]}`,
    seat,
    seq: s.nextSeq[seat],
    turn: s.turn,
    revision: s.revision,
    action,
  });
  expect(r.ok, r.reason).toBe(true);
  return r.state;
}
it("physically surveys then personally patrols a route using the weekly commitment and normal provisions", () => {
  let s = setup();
  s = resolveWeek(
    issue(s, { kind: "move", unit: s.players.p1.hero.id, x: 5, y: 4 }),
  );
  const survey = Object.values(s.routeSurveys).find((q) => q.owner === "p1")!;
  s = resolveWeek(
    issue(s, { kind: "move", unit: s.players.p1.hero.id, x: 4, y: 4 }),
  );
  s = issue(s, { kind: "forest-power", mode: "wild-road", survey: survey.id });
  const p = preview(s, "p1");
  expect(p.players.p1.commitment).toBe(0);
  expect(p.players.p1.operations).toBe(3);
  expect(p.players.p1.stock.P).toBe(s.players.p1.stock.P - 1);
  s = resolveWeek(s);
  expect(Object.values(s.forestRoutes)).toHaveLength(1);
  expect(() => parseMatch(s)).not.toThrow();
  expect(guestSnapshot(s, "p2").forestRoutes).toEqual({});
  s = resolveWeek(s);
  expect(s.units[s.players.p1.hero.id]).toMatchObject(survey.route.at(-1)!);
});
it("a real wooded convoy is hidden by Guest Road until close inspection or marker loss", () => {
  let s = setup("melian");
  s.preySites = {};
  const u = s.units["p1:company:0"];
  Object.assign(u, { x: 4, y: 4, move: 8 });
  for (let x = 4; x <= 6; x++) s.map.terrain[4 * s.map.width + x] = "woodland";
  Object.assign(s.facilities["p1:core"], { x: 4, y: 4 });
  s.facilities.destination = {
    ...structuredClone(s.facilities["p1:core"]),
    id: "destination",
    x: 6,
    y: 4,
  };
  s = resolveWeek(issue(s, { kind: "move", unit: u.id, x: 6, y: 4 }));
  const survey = Object.values(s.routeSurveys).find((q) => q.owner === "p1")!;
  s = resolveWeek(issue(s, { kind: "move", unit: u.id, x: 4, y: 4 }));
  s = issue(s, {
    kind: "forest-power",
    mode: "guest-road",
    survey: survey.id,
    origin: "p1:core",
    destination: "destination",
  });
  s = issue(s, {
    kind: "convoy",
    carrier: u.id,
    origin: "p1:core",
    destination: "destination",
    cargo: { P: 1, M: 0, K: 0, E: 0 },
  });
  // Keep a tactical response boundary before ordinary weekly delivery.
  s.players.p2.encounter = true;
  s = resolveWeek(s);
  Object.assign(s.units["p2:company:0"], { x: 4, y: 7 });
  expect(observation(s, "p2", s.units[u.id])).toBe("hidden");
  expect(guestSnapshot(s, "p2").units[u.id]).toBeUndefined();
  expect(() => parseMatch(s)).not.toThrow();
  expect(() => parseMatch(guestSnapshot(s, "p2"), "p2")).not.toThrow();
  Object.assign(s.units["p2:company:0"], { x: 4, y: 5 });
  expect(observation(s, "p2", s.units[u.id])).toBe("identified");
  Object.assign(s.units["p2:company:0"], { x: 4, y: 7 });
  const q = Object.values(s.forestRoutes)[0];
  s.facilities[q.markers[0]].hp = 0;
  expect(observation(s, "p2", s.units[u.id])).toBe("identified");
});
it("Melian veils a declared withdrawal through wooded travel, keeping the body visible and raw tracks private", () => {
  let s = setup("melian");
  s.preySites = {};
  const u = s.units["p1:company:0"];
  Object.assign(u, { x: 4, y: 4, move: 8 });
  for (const at of [
    { x: 4, y: 4 },
    { x: 5, y: 4 },
  ])
    s.map.terrain[at.y * s.map.width + at.x] = "woodland";
  s = issue(s, {
    kind: "declare-tactical",
    order: {
      kind: "fallback",
      unit: u.id,
      route: [
        { x: 4, y: 4 },
        { x: 5, y: 4 },
      ],
    },
  });
  s = issue(s, { kind: "forest-power", mode: "departing", unit: u.id });
  s = resolveWeek(s);
  expect(s.players.p1.commitment).toBe(0);
  expect(s.players.p1.operations).toBe(2);
  expect(s.players.p1.hero.readiness).toBe(4);
  expect(() => parseMatch(s)).not.toThrow();
  s = resolveWeek(s);
  expect(s.units[u.id].x).toBe(5);
  expect(
    Object.values(s.movementTraces).find((q) => q.owner === "p1")?.erased,
  ).toBe(true);
  expect(guestSnapshot(s, "p2").forestVeils).toEqual({});
});
it("an allied departing company explicitly grants and can revoke Melian veil consent without exposing its route", () => {
  let s = setup("melian");
  s.preySites = {};
  s.players.p1.relations.p2 = "alliance";
  s.players.p2.relations.p1 = "alliance";
  Object.assign(s.units["p2:company:0"], { x: 4, y: 4, move: 8 });
  for (const x of [4, 5]) s.map.terrain[4 * s.map.width + x] = "woodland";
  s = issue(
    s,
    {
      kind: "declare-tactical",
      order: {
        kind: "fallback",
        unit: "p2:company:0",
        route: [
          { x: 4, y: 4 },
          { x: 5, y: 4 },
        ],
      },
    },
    "p2",
  );
  const view = preview(s, "p2");
  view.orders = [];
  const request: Action = {
    kind: "forest-power",
    mode: "departing",
    unit: "p2:company:0",
  };
  const attempt = (state: Match) =>
    submit(state, {
      id: "veil",
      seat: "p1",
      seq: state.nextSeq.p1,
      turn: state.turn,
      revision: state.revision,
      action: request,
    });
  expect(attempt(view).ok).toBe(false);
  s = issue(
    view,
    { kind: "consent-veil", unit: "p2:company:0", melian: "p1", accept: true },
    "p2",
  );
  s = preview(s, "p2");
  s.orders = [];
  expect(attempt(s).ok).toBe(true);
  const guest = guestSnapshot(s, "p1");
  expect(guest.tacticalOrders).toEqual({});
  expect(() => parseMatch(guest, "p1")).not.toThrow();
  expect(attempt(guest).ok).toBe(true);
  s = preview(
    issue(
      s,
      {
        kind: "consent-veil",
        unit: "p2:company:0",
        melian: "p1",
        accept: false,
      },
      "p2",
    ),
    "p2",
  );
  s.orders = [];
  expect(attempt(s).ok).toBe(false);
});
it("paid harassment delays an actual ordinary carrier without changing cargo or HP and gives the same public receipt for an empty party", () => {
  let s = setup();
  const carrier = s.units["p1:company:0"];
  Object.assign(carrier, { x: 4, y: 4 });
  Object.assign(s.facilities["p1:core"], { x: 4, y: 4 });
  s.facilities.destination = {
    ...structuredClone(s.facilities["p1:core"]),
    id: "destination",
    x: 6,
    y: 4,
  };
  s = resolveWeek(
    issue(s, {
      kind: "convoy",
      carrier: carrier.id,
      origin: "p1:core",
      destination: "destination",
      cargo: { P: 2, M: 0, K: 0, E: 0 },
    }),
  );
  Object.assign(s.units["p2:company:0"], { x: 5, y: 4 });
  const before = structuredClone(s),
    a: Action = {
      kind: "harass-convoy",
      unit: "p2:company:0",
      target: carrier.id,
    };
  const reserved = issue(s, a, "p2"),
    v = preview(reserved, "p2");
  expect(v.players.p2.operations).toBe(2);
  s = resolveWeek(reserved);
  const c = Object.values(s.convoys)[0];
  expect(c).toMatchObject({
    phase: "travel",
    x: 4,
    y: 4,
    cargo: { P: 2, M: 0, K: 0, E: 0 },
  });
  expect(s.units[carrier.id].hp).toBe(before.units[carrier.id].hp);
  const empty = structuredClone(before);
  empty.convoys = {};
  expect(issue(empty, a, "p2").receipts.p2.at(-1)?.reason).toBe(
    reserved.receipts.p2.at(-1)?.reason,
  );
});
