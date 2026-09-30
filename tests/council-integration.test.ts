import { expect, it } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  preview,
} from "../src/simulation/engine";
import { parseMatch } from "../src/simulation/schema";
import { guestSnapshot } from "../src/network/protocol";
import type { Action, Match } from "../src/simulation/types";
function issue(s: Match, seat: string, action: Action) {
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
function tick(s: Match) {
  s = resolveWeek(s);
  while (s.combatPhase) s = resolveWeek(s);
  return s;
}
function injured() {
  let s = createMatch(["nienna", "human_gondor", "human_rohan"], 127);
  for (const p of Object.values(s.players)) p.ai = false;
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
  Object.assign(u, { x: 4, y: 4 });
  Object.assign(s.units["p2:company:0"], { x: 5, y: 4, attack: 6 });
  Object.assign(s.facilities["p2:core"], { x: 6, y: 4 });
  s = tick(
    issue(s, "p2", { kind: "attack", unit: "p2:company:0", target: u.id }),
  );
  return s;
}
function agreed() {
  let s = injured();
  s = tick(issue(s, "p1", { kind: "move", unit: "p1:company:0", x: 3, y: 4 }));
  const q = Object.values(s.grievances).find((q) => q.offenderSeat === "p2")!;
  expect(q).toBeDefined();
  s = tick(
    issue(s, "p1", {
      kind: "council-terms",
      grievance: q.id,
      payment: { P: 5, M: 0, K: 0, E: 0 },
      mediator: "p1",
    }),
  );
  s = tick(
    issue(s, "p2", {
      kind: "council-consent",
      grievance: q.id,
      accept: true,
      termsVersion: 1,
    }),
  );
  return { s, id: q.id };
}
it("actual injury produces private grievances, negotiated stocks travel once before paid settlement", () => {
  const prepared = agreed(),
    id = prepared.id;
  let s = prepared.s;
  const before = s.players.p2.stock.P;
  s = issue(s, "p2", {
    kind: "council-deliver",
    grievance: id,
    carrier: "p2:company:0",
    origin: "p2:core",
    destination: "p1:core",
    route: [
      { x: 5, y: 4 },
      { x: 4, y: 4 },
    ],
  });
  const p = preview(s, "p2");
  expect(p.players.p2.stock.P).toBe(before - 5);
  expect(p.players.p2.operations).toBe(2);
  expect(p.grievances[id].delivered).toBe(false);
  s = tick(s);
  expect(s.grievances[id].delivered).toBe(true);
  expect(Object.values(s.restitutions)[0].cargo.P).toBe(0);
  s = issue(s, "p1", { kind: "council-settle", grievance: id });
  expect(preview(s, "p1").players.p1.commitment).toBe(0);
  s = tick(s);
  expect(s.grievances[id].resolved).toBe(true);
  expect(parseMatch(s)).toEqual(s);
  expect(guestSnapshot(s, "p3").grievances).toEqual({});
  for (const seat of ["p1", "p2", "p3"])
    expect(() => parseMatch(guestSnapshot(s, seat), seat)).not.toThrow();
});
it("revocation pauses escrow and the courier cannot take another movement role", () => {
  const prepared = agreed(),
    id = prepared.id;
  let s = prepared.s;
  s = issue(s, "p2", {
    kind: "council-deliver",
    grievance: id,
    carrier: "p2:company:0",
    origin: "p2:core",
    destination: "p1:core",
    route: [
      { x: 5, y: 4 },
      { x: 4, y: 4 },
    ],
  });
  const r = submit(s, {
    id: "busy",
    seat: "p2",
    seq: s.nextSeq.p2,
    turn: s.turn,
    revision: s.revision,
    action: { kind: "move", unit: "p2:company:0", x: 6, y: 4 },
  });
  expect(r.ok).toBe(false);
  s = tick(s);
  s = tick(
    issue(s, "p1", {
      kind: "council-consent",
      grievance: id,
      accept: false,
      termsVersion: 1,
    }),
  );
  expect(
    submit(s, {
      id: "settle",
      seat: "p1",
      seq: s.nextSeq.p1,
      turn: s.turn,
      revision: s.revision,
      action: { kind: "council-settle", grievance: id },
    }).ok,
  ).toBe(false);
  expect(s.grievances[id].resolved).toBe(false);
});
it("save validation rejects invented delivered restitution and malformed terms", () => {
  const { s, id } = agreed();
  s.grievances[id].delivered = true;
  expect(() => parseMatch(s)).toThrow();
  s.grievances[id].delivered = false;
  s.grievances[id].payment!.P = 0;
  expect(() => parseMatch(s)).toThrow();
});
it("changed terms cannot reuse submitted consent", () => {
  const prepared = agreed(),
    id = prepared.id;
  let s = prepared.s;
  s = tick(
    issue(s, "p1", {
      kind: "council-terms",
      grievance: id,
      payment: { P: 6, M: 0, K: 0, E: 0 },
      mediator: "p1",
    }),
  );
  expect(
    submit(s, {
      id: "stale-consent",
      seat: "p2",
      seq: s.nextSeq.p2,
      turn: s.turn,
      revision: s.revision,
      action: {
        kind: "council-consent",
        grievance: id,
        accept: true,
        termsVersion: 1,
      },
    }).ok,
  ).toBe(false);
  expect(s.grievances[id].consents).toEqual(["p1"]);
});
it("revocation before delivery preserves escrow, explicit drop frees the courier, recovery conserves cargo", () => {
  const prepared = agreed(),
    id = prepared.id;
  let s = prepared.s;
  s = issue(s, "p2", {
    kind: "council-deliver",
    grievance: id,
    carrier: "p2:company:0",
    origin: "p2:core",
    destination: "p1:core",
    route: [
      { x: 5, y: 4 },
      { x: 4, y: 4 },
    ],
  });
  s = preview(s, "p2");
  s.orders = [];
  s = tick(
    issue(s, "p1", {
      kind: "council-consent",
      grievance: id,
      accept: false,
      termsVersion: 1,
    }),
  );
  let j = Object.values(s.restitutions)[0];
  expect(j.cargo.P).toBe(5);
  expect(j.phase).toBe("travel");
  s = tick(issue(s, "p2", { kind: "council-drop", restitution: j.id }));
  j = s.restitutions[j.id];
  expect(j.phase).toBe("lost");
  expect(j.cargo.P).toBe(5);
  s = tick(
    issue(s, "p1", {
      kind: "council-consent",
      grievance: id,
      accept: true,
      termsVersion: 1,
    }),
  );
  s = issue(s, "p2", {
    kind: "council-recover",
    restitution: j.id,
    carrier: "p2:company:0",
    route: [
      { x: 5, y: 4 },
      { x: 4, y: 4 },
    ],
  });
  expect(preview(s, "p2").restitutions[j.id].cargo.P).toBe(5);
  s = tick(s);
  expect(s.restitutions[j.id].cargo.P).toBe(0);
  expect(s.grievances[id].delivered).toBe(true);
  expect(() => parseMatch(s)).not.toThrow();
});
it("actual interception leaves the same cargo recoverable by another existing courier", () => {
  const prepared = agreed(),
    id = prepared.id;
  let s = prepared.s;
  s = preview(
    issue(s, "p2", {
      kind: "council-deliver",
      grievance: id,
      carrier: "p2:company:0",
      origin: "p2:core",
      destination: "p1:core",
      route: [
        { x: 5, y: 4 },
        { x: 4, y: 4 },
      ],
    }),
    "p2",
  );
  s.orders = [];
  Object.assign(s.units["p3:company:0"], { x: 5, y: 3, attack: 100 });
  s = tick(
    issue(s, "p3", {
      kind: "attack",
      unit: "p3:company:0",
      target: "p2:company:0",
    }),
  );
  const j = Object.values(s.restitutions)[0];
  expect(j.phase).toBe("lost");
  expect(j.cargo.P).toBe(5);
  expect(s.grievances[id].delivered).toBe(false);
  Object.assign(s.units["p2:company:1"], { x: j.x, y: j.y });
  s = tick(
    issue(s, "p2", {
      kind: "council-recover",
      restitution: j.id,
      carrier: "p2:company:1",
      route: [
        { x: 5, y: 4 },
        { x: 4, y: 4 },
      ],
    }),
  );
  expect(s.restitutions[j.id].phase).toBe("arrived");
  expect(s.restitutions[j.id].cargo.P).toBe(0);
  expect(() => parseMatch(s)).not.toThrow();
});
it("an actual declared withdrawal keeps only a dated known separated survivor for Nienna", () => {
  let s = injured();
  Object.assign(s.units["p1:company:1"], { x: 8, y: 8 });
  s = tick(
    issue(s, "p1", {
      kind: "declare-tactical",
      order: {
        kind: "fallback",
        unit: "p1:company:0",
        route: [
          { x: 4, y: 4 },
          { x: 3, y: 4 },
          { x: 2, y: 4 },
        ],
      },
    }),
  );
  const memory = Object.values(s.survivorMemories)[0];
  expect(memory).toMatchObject({
    owner: "p1",
    party: "p1:company:0",
    x: 2,
    y: 4,
  });
  expect(guestSnapshot(s, "p2").survivorMemories).toEqual({});
  s = tick(issue(s, "p1", { kind: "move", unit: "p1:company:0", x: 1, y: 4 }));
  expect(Object.values(s.survivorMemories)[0]).toEqual(memory);
  expect(() => parseMatch(s)).not.toThrow();
});
