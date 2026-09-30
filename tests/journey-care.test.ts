import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  startCare,
  progressCare,
  recordRecoverableInjury,
  applyCareEvacuation,
  careEvacuationReason,
  recoveryInvariant,
  type CareEvacuationChecks,
} from "../src/simulation/recovery";
function fixture(profile = "este") {
  const s = createMatch([profile, "human_rohan"], 29),
    p = s.players.p1,
    u = s.units["p1:company:0"],
    f = s.facilities["p1:core"];
  Object.assign(f, {
    kind: profile === "istari_grove" ? "medicine-nursery" : "refuge",
    x: 4,
    y: 4,
  });
  Object.assign(u, { x: 4, y: 4, hp: 30 });
  p.hero.status = "living";
  s.units[p.hero.id] = {
    ...structuredClone(u),
    id: p.hero.id,
    kind: "hero",
    effects: [],
  };
  p.stock = { P: 100, M: 100, K: 100, E: 100 };
  recordRecoverableInjury(s, u, Math.ceil(u.maxHp / 4));
  s.facilities.dest = { ...structuredClone(f), id: "dest", x: 6 };
  startCare(s, "p1", { unit: u.id, facility: f.id });
  progressCare(s);
  s.turn++;
  const q = Object.values(s.recoveries)[0],
    checks: CareEvacuationChecks = {
      route: () => true,
      cost: (_s, _u, r) => r.length - 1,
    };
  const a = {
    care: q.id,
    destination: "dest",
    route: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
    ],
  };
  return { s, p, u, q, a, checks };
}
it("Este and Grove retain only an already completed personally treated step through routine evacuation", () => {
  for (const profile of ["este", "istari_grove"]) {
    const { s, p, u, q, a, checks } = fixture(profile),
      hp = u.hp;
    expect(q.remaining).toBe(1);
    applyCareEvacuation(s, "p1", a, checks);
    expect(q.remaining).toBe(1);
    expect(p.stock.P).toBe(93);
    expect(u.x).toBe(6);
    progressCare(s);
    expect(q.remaining).toBe(1);
    expect(u.hp).toBe(hp);
    recoveryInvariant(s);
    s.turn++;
    progressCare(s);
    expect(s.recoveries[q.id]).toBeUndefined();
    expect(u.hp).toBe(hp);
  }
});
it("ordinary evacuation loses the prior step and does not receive a remote hero benefit", () => {
  const { s, q, a, checks } = fixture("human_gondor");
  applyCareEvacuation(s, "p1", a, checks);
  expect(q.remaining).toBe(2);
  expect(q.evacuationUsed).toBeUndefined();
});
it("new injury cancels care after an evacuation without retaining or restoring progress", () => {
  const { s, u, q, a, checks } = fixture();
  applyCareEvacuation(s, "p1", a, checks);
  recordRecoverableInjury(s, u, 1);
  expect(s.recoveries[q.id]).toBeUndefined();
});
it("rejects blocked routes, missing paid rations and occupied receiving care capacity", () => {
  const { s, p, q, a, checks } = fixture();
  checks.route = () => false;
  expect(careEvacuationReason(s, "p1", a, checks)).toMatch(/route/i);
  checks.route = () => true;
  p.stock.P = 1;
  expect(careEvacuationReason(s, "p1", a, checks)).toMatch(/2P/);
  p.stock.P = 20;
  s.facilities.dest.rest = {
    id: "rest",
    unit: "x",
    started: s.turn,
    remaining: 1,
    cost: { P: 1, M: 0, K: 0, E: 0 },
  };
  expect(careEvacuationReason(s, "p1", a, checks)).toMatch(/occupied/i);
  expect(q.remaining).toBe(1);
});
it("repeated evacuation of one injury cannot preserve its step twice even with paid routes", () => {
  const { s, q, a, checks } = fixture("istari_grove");
  const origin = q.facility!;
  applyCareEvacuation(s, "p1", a, checks);
  expect(q.remaining).toBe(1);
  applyCareEvacuation(
    s,
    "p1",
    { care: q.id, destination: origin, route: [...a.route].reverse() },
    checks,
  );
  expect(q.remaining).toBe(2);
  recoveryInvariant(s);
});
it("a hero who did not personally treat the patient cannot retroactively retain progress", () => {
  const { s, p, q, a, checks } = fixture();
  delete q.treatedBy;
  s.units[p.hero.id].x = 12;
  applyCareEvacuation(s, "p1", a, checks);
  expect(q.remaining).toBe(2);
  expect(q.evacuationUsed).toBeUndefined();
});
