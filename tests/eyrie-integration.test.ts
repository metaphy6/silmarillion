import { expect, it } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  preview,
} from "../src/simulation/engine";
import { parseMatch } from "../src/simulation/schema";
import { guestSnapshot } from "../src/network/protocol";
import {
  encodeCheckpoint,
  decodeCheckpoint,
} from "../src/persistence/checkpoints";
import type { Action, Match } from "../src/simulation/types";
function send(s: Match, seat: string, action: Action) {
  return submit(s, {
    id: `${seat}-${s.nextSeq[seat]}-${s.turn}`,
    seat,
    seq: s.nextSeq[seat],
    turn: s.turn,
    revision: s.revision,
    action,
  });
}
function issue(s: Match, seat: string, action: Action) {
  const r = send(s, seat, action);
  expect(r.ok, r.reason).toBe(true);
  return r.state;
}
function tick(s: Match) {
  s = resolveWeek(s);
  while (s.combatPhase) s = resolveWeek(s);
  return s;
}
function setup() {
  let s = createMatch(["eagle_eyrie", "human_rohan", "human_gondor"], 151);
  for (const p of Object.values(s.players)) {
    p.ai = false;
    p.stock = { P: 1000, M: 1000, K: 1000, E: 1000 };
  }
  // Explicit scenario actors and clear local flight corridor. Both prepared
  // ledges are built through normal construction orders below.
  for (let x = 3; x <= 8; x++) {
    s.map.terrain[4 * s.map.width + x] = "meadow";
    delete s.shallowWater[`${x},4`];
  }
  const w1 = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!,
    w2 = Object.values(s.units).find(
      (u) => u.owner === "p2" && u.kind === "worker",
    )!;
  Object.assign(w1, { x: 4, y: 4 });
  Object.assign(w2, { x: 7, y: 4 });
  const p = s.players.p1;
  Object.assign(s.facilities["p1:core"], { x: 3, y: 3 });
  p.hero.status = "living";
  p.hero.readiness = 6;
  s.units[p.hero.id] = {
    ...structuredClone(s.units["p1:company:0"]),
    id: p.hero.id,
    kind: "hero",
    x: 4,
    y: 4,
    move: 6,
    flying: true,
    landed: false,
  };
  s.players.p1.relations.p2 = "peace";
  s.players.p2.relations.p1 = "peace";
  s = tick(
    issue(
      issue(s, "p1", { kind: "build", building: "ledge", x: 4, y: 4 }),
      "p2",
      { kind: "build", building: "ledge", x: 7, y: 4 },
    ),
  );
  const origin = Object.values(s.facilities).find(
      (f) => f.kind === "ledge" && f.owner === "p1",
    )!.id,
    destination = Object.values(s.facilities).find(
      (f) => f.kind === "ledge" && f.owner === "p2",
    )!.id;
  const relay: Action = {
    kind: "eyrie-relay",
    origin,
    destination,
    cargo: { P: 5, M: 0, K: 3, E: 0 },
  };
  return { s, origin, destination, relay };
}
it("normal foreign ledge consent authorizes paid relay and saves only the relevant permission", () => {
  const f = setup();
  let s = f.s;
  expect(send(s, "p1", f.relay).ok).toBe(false);
  s = tick(
    issue(s, "p2", {
      kind: "consent-ledge",
      ledge: f.destination,
      visitor: "p1",
      allow: true,
    }),
  );
  const before = s.players.p1.stock;
  s = issue(s, "p1", f.relay);
  const staged = preview(s, "p1");
  expect(staged.players.p1.commitment).toBe(0);
  expect(staged.players.p1.stock.P).toBe(before.P - 15);
  expect(staged.players.p1.stock.M).toBe(before.M - 5);
  s = tick(s);
  expect(s.units[s.players.p1.hero.id].x).toBe(7);
  expect(Object.values(s.convoys)).toHaveLength(0);
  expect(decodeCheckpoint(encodeCheckpoint(s)).state).toEqual(s);
  expect(guestSnapshot(s, "p3").ledgeConsents).toEqual({});
  for (const seat of ["p1", "p2", "p3"])
    expect(() => parseMatch(guestSnapshot(s, seat), seat)).not.toThrow();
});
it("once-weekly landing survey is observation-only, budget-free and private", () => {
  const f = setup();
  let s = f.s;
  const stock = structuredClone(s.players.p1.stock);
  s = issue(s, "p1", { kind: "survey-landing", destination: { x: 6, y: 4 } });
  const staged = preview(s, "p1");
  expect(staged.players.p1.stock).toEqual(stock);
  expect(staged.players.p1.operations).toBe(3);
  expect(staged.players.p1.commitment).toBe(1);
  expect(staged.landingSurveys.p1).toMatchObject({
    destination: { x: 6, y: 4 },
    terrain: "meadow",
  });
  expect(
    send(s, "p1", { kind: "survey-landing", destination: { x: 5, y: 4 } }).ok,
  ).toBe(false);
  s = tick(s);
  expect(guestSnapshot(s, "p2").landingSurveys).toEqual({});
  expect(() => parseMatch(s)).not.toThrow();
  expect(
    send(s, "p1", {
      kind: "survey-landing",
      destination: { x: s.map.width - 1, y: s.map.height - 1 },
    }).ok,
  ).toBe(false);
});
it("permission revocation denies new relay without spending resources and strict fields cannot forge a survey", () => {
  const f = setup();
  let s = tick(
    issue(f.s, "p2", {
      kind: "consent-ledge",
      ledge: f.destination,
      visitor: "p1",
      allow: true,
    }),
  );
  s = tick(
    issue(s, "p2", {
      kind: "consent-ledge",
      ledge: f.destination,
      visitor: "p1",
      allow: false,
    }),
  );
  const before = structuredClone(s.players.p1);
  const result = send(s, "p1", f.relay);
  expect(result.ok).toBe(false);
  expect(result.state.players.p1).toEqual(before);
  expect(
    send(s, "p1", {
      kind: "survey-landing",
      destination: { x: 6, y: 4 },
      spaceAvailable: true,
    } as Action).ok,
  ).toBe(false);
  expect(
    send(s, "p1", {
      kind: "consent-ledge",
      ledge: f.destination,
      visitor: "p1",
      allow: true,
    }).ok,
  ).toBe(false);
});
