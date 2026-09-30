import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  recordGrievance,
  offerTerms,
  consentTerms,
  deliverRestitution,
  progressRestitution,
  settleCouncil,
  validateCouncils,
  type CouncilState,
} from "../src/simulation/council";
const c = {
  connected: () => true,
  route: () => true,
  cost: (_s: unknown, _u: unknown, r: unknown[]) => r.length - 1,
  moved: () => {},
};
function fixture() {
  const s = Object.assign(createMatch(["nienna", "human_gondor"], 44), {
    grievances: {},
    restitutions: {},
  }) as CouncilState;
  const a = s.units["p2:company:0"],
    b = s.units["p1:company:0"];
  Object.assign(a, { x: 5, y: 4 });
  Object.assign(b, { x: 4, y: 4 });
  s.players.p1.hero.status = "living";
  s.units[s.players.p1.hero.id] = {
    ...structuredClone(b),
    id: s.players.p1.hero.id,
    kind: "hero",
  };
  const origin = s.facilities["p2:core"],
    end = s.facilities["p1:core"];
  Object.assign(origin, { x: 5, y: 4 });
  Object.assign(end, { x: 4, y: 4 });
  const q = recordGrievance(s, a, b, 3)!;
  return { s, a, b, origin, end, q };
}
it("real local injury records distinct parties; no injury invents no grievance", () => {
  const { s, a, b, q } = fixture();
  expect(q.offender).toBe(a.id);
  expect(q.claimant).toBe(b.id);
  expect(recordGrievance(s, a, b, 0)).toBeUndefined();
  expect(Object.keys(s.grievances)).toHaveLength(1);
});
it("both parties must consent to exact paid terms before delivery or mediation", () => {
  const { s, q, a, origin, end } = fixture();
  offerTerms(s, "p1", q.id, { P: 5, M: 0, K: 0, E: 0 });
  expect(() =>
    deliverRestitution(
      s,
      "p2",
      q.id,
      a.id,
      origin.id,
      end.id,
      [
        { x: 5, y: 4 },
        { x: 4, y: 4 },
      ],
      c,
    ),
  ).toThrow(/consent/);
  expect(() => settleCouncil(s, "p1", q.id, c)).toThrow();
  consentTerms(s, "p2", q.id, true);
  expect(() => settleCouncil(s, "p1", q.id, c)).toThrow(/delivered/);
});
it("restitution conserves actual stocks, travels once, then permits one settlement", () => {
  const { s, q, a, origin, end } = fixture();
  offerTerms(s, "p1", q.id, { P: 5, M: 0, K: 0, E: 0 });
  consentTerms(s, "p2", q.id, true);
  const payer = s.players.p2.stock.P,
    receiver = s.players.p1.stock.P;
  deliverRestitution(
    s,
    "p2",
    q.id,
    a.id,
    origin.id,
    end.id,
    [
      { x: 5, y: 4 },
      { x: 4, y: 4 },
    ],
    c,
  );
  expect(s.players.p2.stock.P).toBe(payer - 5);
  expect(s.players.p1.stock.P).toBe(receiver);
  progressRestitution(s, c);
  expect(a.x).toBe(4);
  expect(s.players.p1.stock.P).toBe(receiver + 5);
  progressRestitution(s, c);
  expect(s.players.p1.stock.P).toBe(receiver + 5);
  settleCouncil(s, "p1", q.id, c);
  expect(q.resolved).toBe(true);
  expect(s.players.p1.hero.readiness).toBe(3);
  expect(() => settleCouncil(s, "p1", q.id, c)).toThrow();
  expect(() => validateCouncils(s)).not.toThrow();
});
it("blocked delivery and withdrawn consent never count as fulfilled restitution", () => {
  const { s, q, a, origin, end } = fixture();
  offerTerms(s, "p1", q.id, { P: 5, M: 0, K: 0, E: 0 });
  consentTerms(s, "p2", q.id, true);
  deliverRestitution(
    s,
    "p2",
    q.id,
    a.id,
    origin.id,
    end.id,
    [
      { x: 5, y: 4 },
      { x: 4, y: 4 },
    ],
    c,
  );
  progressRestitution(s, { ...c, route: () => false });
  expect(q.delivered).toBe(false);
  expect(a.x).toBe(5);
  consentTerms(s, "p1", q.id, false);
  expect(() => settleCouncil(s, "p1", q.id, c)).toThrow();
});
it("later injury creates a new grievance and dead carriers retain escrow", () => {
  const { s, q, a, b, origin, end } = fixture();
  offerTerms(s, "p1", q.id, { P: 5, M: 0, K: 0, E: 0 });
  consentTerms(s, "p2", q.id, true);
  const j = deliverRestitution(
    s,
    "p2",
    q.id,
    a.id,
    origin.id,
    end.id,
    [
      { x: 5, y: 4 },
      { x: 4, y: 4 },
    ],
    c,
  );
  a.alive = false;
  progressRestitution(s, c);
  expect(j.phase).toBe("lost");
  expect(j.cargo.P).toBe(5);
  expect(q.delivered).toBe(false);
  a.alive = true;
  s.revision++; // A later actual injury, rather than aggregation of this same response.
  expect(recordGrievance(s, a, b, 1)?.id).not.toBe(q.id);
});
it("resolved history retires together with empty arrived escrow before capacity is exhausted", () => {
  const { s, a, b } = fixture();
  s.grievances = {};
  for (let i = 0; i < 129; i++) {
    s.revision++;
    const q = recordGrievance(s, a, b, 1);
    expect(q).toBeDefined();
    q!.resolved = true;
    q!.delivered = true;
    q!.payment = { P: 1, M: 0, K: 0, E: 0 };
    q!.termsVersion = 1;
    q!.consents = ["p1", "p2"];
    s.restitutions[`r:${i}`] = {
      id: `r:${i}`,
      grievance: q!.id,
      owner: "p2",
      carrier: a.id,
      origin: "p2:core",
      destination: "p1:core",
      route: [{ x: 5, y: 4 }],
      index: 0,
      x: 5,
      y: 4,
      cargo: { P: 0, M: 0, K: 0, E: 0 },
      phase: "arrived",
    };
  }
  expect(Object.keys(s.grievances)).toHaveLength(128);
  expect(Object.keys(s.restitutions)).toHaveLength(128);
});
