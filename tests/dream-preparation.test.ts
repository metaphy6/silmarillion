import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { startRest } from "../src/simulation/fatigue";
import {
  prepareDream,
  completeDreamRest,
  dreamMitigation,
  interruptDream,
  replaceDream,
  pruneDreams,
  validateDreams,
  type DreamState,
} from "../src/simulation/dream-preparation";
function fixture() {
  const base = createMatch(["irmo", "human_gondor"], 127);
  const s = Object.assign(base, { dreamPlans: {} }) as DreamState;
  const p = s.players.p1,
    u = s.units["p1:company:0"];
  const f = s.facilities["p1:core"];
  Object.assign(f, { kind: "refuge", x: 4, y: 4, workers: 1 });
  Object.assign(u, {
    x: 4,
    y: 4,
    supplied: true,
    active: true,
    effects: [{ kind: "fatigue", value: 2, until: 1000000, source: "travel" }],
  });
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.commitment = 0;
  s.units[p.hero.id] = {
    ...structuredClone(u),
    id: p.hero.id,
    kind: "hero",
    x: 4,
    y: 5,
  };
  startRest(s, "p1", u.id, f.id);
  return { s, p, u, f };
}
const checks = { connected: () => true, verifiedReport: () => true };
it("rehearsal requires a real paid rest and does not complete or duplicate that queue", () => {
  const { s, p, u, f } = fixture();
  const rest = structuredClone(f.rest),
    P = p.stock.P;
  const q = prepareDream(s, "p1", u.id, f.id, "fear", checks);
  expect(f.rest).toEqual(rest);
  expect(p.stock.P).toBe(P);
  expect(p.hero.readiness).toBe(3);
  expect(dreamMitigation(s, u, "fear", 1)).toBe(1);
  expect(q.phase).toBe("resting");
});
it("normal rest completion enables exactly one matching coordination reduction without changing health", () => {
  const { s, u, f } = fixture();
  const q = prepareDream(s, "p1", u.id, f.id, "withdrawal", checks),
    hp = u.hp;
  completeDreamRest(s, f.id, f.rest!.id);
  s.turn++;
  expect(q.phase).toBe("ready");
  expect(dreamMitigation(s, u, "fear", 1)).toBe(1);
  expect(dreamMitigation(s, u, "withdrawal", 2)).toBe(1);
  expect(dreamMitigation(s, u, "withdrawal", 2)).toBe(2);
  expect(u.hp).toBe(hp);
});
it("rest injury interrupts rehearsal, while expiry never renews itself", () => {
  const { s, u, f } = fixture();
  prepareDream(s, "p1", u.id, f.id, "fear", checks);
  interruptDream(s, u.id);
  completeDreamRest(s, f.id, f.rest!.id);
  expect(Object.values(s.dreamPlans)).toHaveLength(0);
  prepareDream(s, "p1", u.id, f.id, "fear", checks);
  s.turn += 2;
  pruneDreams(s);
  expect(Object.values(s.dreamPlans)).toHaveLength(0);
});
it("fresh verified scouting replaces one contingency without refreshing expiry or usage", () => {
  const { s, u, f } = fixture();
  const q = prepareDream(s, "p1", u.id, f.id, "fear", checks);
  completeDreamRest(s, f.id, f.rest!.id);
  const expiry = q.expiresTurn;
  replaceDream(s, "p1", q.id, "landing", "real-report", checks);
  expect(q.contingency).toBe("landing");
  expect(q.expiresTurn).toBe(expiry);
  expect(() =>
    replaceDream(s, "p1", q.id, "withdrawal", "real-report", checks),
  ).toThrow(/already/);
  expect(() => validateDreams(s)).not.toThrow();
});
it("no invented report or duplicate company preparation can grant a new contingency", () => {
  const { s, u, f } = fixture();
  const q = prepareDream(s, "p1", u.id, f.id, "fear", checks);
  expect(() => prepareDream(s, "p1", u.id, f.id, "landing", checks)).toThrow(
    /already/,
  );
  expect(() =>
    replaceDream(s, "p1", q.id, "landing", "missing", {
      ...checks,
      verifiedReport: () => false,
    }),
  ).toThrow(/verified/);
});
