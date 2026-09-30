import { expect, it } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  preview,
} from "../src/simulation/engine";
import { parseMatch } from "../src/simulation/schema";
import { guestSnapshot } from "../src/network/protocol";
import { damageMorale, retreatMorale } from "../src/simulation/morale";
import { completeLanding } from "../src/simulation/shore-powers";
import type { Action, Match } from "../src/simulation/types";
function setup() {
  const s = createMatch(["irmo", "human_gondor"], 127);
  const p = s.players.p1,
    u = s.units["p1:company:0"];
  p.hero.status = "living";
  p.hero.readiness = 6;
  s.units[p.hero.id] = {
    ...structuredClone(u),
    id: p.hero.id,
    kind: "hero",
    x: 4,
    y: 5,
  };
  Object.assign(u, {
    x: 4,
    y: 4,
    effects: [{ kind: "fatigue", value: 2, until: 1000000, source: "travel" }],
  });
  s.facilities.refuge = {
    ...structuredClone(s.facilities["p1:core"]),
    id: "refuge",
    kind: "refuge",
    x: 4,
    y: 4,
  };
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
function prepared(contingency: "fear" | "withdrawal" | "landing" = "fear") {
  let s = setup();
  s = issue(s, { kind: "rest", unit: "p1:company:0", facility: "refuge" });
  return issue(s, {
    kind: "prepare-dream",
    unit: "p1:company:0",
    facility: "refuge",
    contingency,
  });
}
it("reserves the paid rest operation and separate hero commitment; completes and checkpoints privately", () => {
  let s = prepared();
  const p = preview(s, "p1");
  expect(p.players.p1.operations).toBe(2);
  expect(p.players.p1.commitment).toBe(0);
  expect(p.players.p1.hero.readiness).toBe(3);
  expect(Object.values(p.dreamPlans)[0].phase).toBe("resting");
  s = resolveWeek(s);
  expect(Object.values(s.dreamPlans)[0].phase).toBe("ready");
  expect(s.facilities.refuge.rest).toBeUndefined();
  expect(parseMatch(s)).toEqual(s);
  expect(guestSnapshot(s, "p2").dreamPlans).toEqual({});
  expect(() => parseMatch(guestSnapshot(s, "p2"), "p2")).not.toThrow();
});
it.each(["fear", "withdrawal", "landing"] as const)(
  "consumes the first real %s coordination penalty once",
  (contingency) => {
    const s = resolveWeek(prepared(contingency)),
      u = s.units["p1:company:0"];
    const trigger = () =>
      contingency === "fear"
        ? damageMorale(s, u, Math.ceil(u.maxHp * 0.25))
        : contingency === "withdrawal"
          ? retreatMorale(s, u, [
              { x: 4, y: 4 },
              { x: 5, y: 4 },
            ])
          : completeLanding(s, "transport", u, { x: 4, y: 4 });
    trigger();
    expect(
      u.effects.some((e) => e.kind === "cohesion-loss" && e.value > 0),
    ).toBe(false);
    expect(Object.values(s.dreamPlans)[0].phase).toBe("spent");
    trigger();
    expect(
      u.effects.some((e) => e.kind === "cohesion-loss" && e.value > 0),
    ).toBe(true);
  },
);
it("rejects missing reports and replaces once using fresh owned nonempty verified night evidence without extending expiry", () => {
  let s = resolveWeek(prepared());
  const q = Object.values(s.dreamPlans)[0],
    expiry = q.expiresTurn;
  const action: Action = {
    kind: "replace-dream",
    plan: q.id,
    contingency: "landing",
    report: "report",
  };
  const tryOrder = () =>
    submit(s, {
      id: "report-order",
      seat: "p1",
      seq: s.nextSeq.p1,
      turn: s.turn,
      revision: s.revision,
      action,
    });
  expect(tryOrder().ok).toBe(false);
  s.nightReports.report = {
    id: "report",
    owner: "p1",
    patrol: "patrol",
    createdTurn: s.turn,
    createdRevision: s.revision,
    verified: true,
    observations: [],
  };
  expect(tryOrder().ok).toBe(false);
  s.nightReports.report.observations = [
    { x: 4, y: 4, direction: "east", turn: s.turn, revision: s.revision },
  ];
  s = issue(s, action);
  let view = preview(s, "p1");
  expect(Object.values(view.dreamPlans)[0]).toMatchObject({
    contingency: "landing",
    replaced: true,
    expiresTurn: expiry,
  });
  expect(
    submit(s, {
      id: "again",
      seat: "p1",
      seq: s.nextSeq.p1,
      turn: s.turn,
      revision: s.revision,
      action,
    }).ok,
  ).toBe(false);
  view = resolveWeek(s);
  expect(() => parseMatch(view)).not.toThrow();
});
it("cancelled rest never becomes a ready dream", () => {
  let s = prepared();
  s = issue(s, { kind: "cancel", facility: "refuge" });
  s = resolveWeek(s);
  expect(s.dreamPlans).toEqual({});
});
it("real injury during paid rest interrupts preparation before weekly completion", () => {
  let s = prepared();
  Object.assign(s.units["p2:company:0"], { x: 5, y: 4, attack: 8 });
  s = issue(
    s,
    { kind: "attack", unit: "p2:company:0", target: "p1:company:0" },
    "p2",
  );
  s = resolveWeek(s);
  expect(s.units["p1:company:0"].hp).toBeLessThan(
    s.units["p1:company:0"].maxHp,
  );
  expect(s.dreamPlans).toEqual({});
});
it("save validation rejects an invented ready dream on a foreign company or without completed rest", () => {
  const s = resolveWeek(prepared()),
    q = Object.values(s.dreamPlans)[0];
  q.unit = "p2:company:0";
  expect(() => parseMatch(s)).toThrow();
  q.unit = "p1:company:0";
  q.phase = "resting";
  expect(() => parseMatch(s)).toThrow();
});
it("ordinary trained night patrol creates fresh evidence that enables exactly one replacement", () => {
  let s = setup();
  const scout = "p1:company:1";
  Object.assign(s.units[scout], { x: 6, y: 4 });
  s = resolveWeek(
    issue(s, { kind: "night", mode: "train-scout", unit: scout }),
  );
  for (const n of Object.values(s.nightRegions))
    if (n.owner === "p1") n.period = "night";
  s = issue(s, { kind: "rest", unit: "p1:company:0", facility: "refuge" });
  s = issue(s, {
    kind: "prepare-dream",
    unit: "p1:company:0",
    facility: "refuge",
    contingency: "fear",
  });
  s = issue(s, {
    kind: "night",
    mode: "patrol",
    unit: scout,
    method: "ordinary",
    route: [
      { x: 6, y: 4 },
      { x: 7, y: 4 },
    ],
  });
  s = resolveWeek(s);
  s = resolveWeek(s);
  Object.assign(s.units["p2:company:0"], { x: 6, y: 5 });
  s = issue(s, { kind: "move", unit: "p2:company:0", x: 6, y: 4 }, "p2");
  // Cross the surveyed route after the scout physically arrives at its observation point.
  s = resolveWeek(s);
  while (s.combatPhase) s = resolveWeek(s);
  const report = Object.values(s.nightReports).find(
    (r) => r.owner === "p1" && r.observations.length,
  )!;
  expect(report).toBeDefined();
  const q = Object.values(s.dreamPlans)[0];
  s = issue(s, {
    kind: "replace-dream",
    plan: q.id,
    report: report.id,
    contingency: "withdrawal",
  });
  expect(preview(s, "p1").dreamPlans[q.id]).toMatchObject({
    replaced: true,
    contingency: "withdrawal",
    expiresTurn: q.expiresTurn,
  });
});
