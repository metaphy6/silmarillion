import { expect, it } from "vitest";
import type { Unit } from "../src/simulation/types";
import { createMatch } from "../src/simulation/engine";
import { interruptCastOnDamage } from "../src/simulation/cast-interruption";
function fixture(profile = "istari_pallando") {
  const s = createMatch([profile, "human_gondor"], 82),
    p = s.players.p1;
  const h: Unit = {
    ...structuredClone(s.units["p1:company:0"]),
    id: p.hero.id,
    kind: "hero" as const,
    hp: 100,
    maxHp: 100,
    effects: [],
  };
  s.units[h.id] = h;
  p.hero.status = "living";
  s.warnings = [
    {
      id: "warn",
      seat: "p1",
      power: "field",
      target: "p2:company:0",
      x: 4,
      y: 4,
      due: s.revision + 1,
    },
  ];
  return { s, h };
}
it("Pallando delays first actual magical interruption once, then cancels without refund or new action", () => {
  const { s, h } = fixture(),
    stock = structuredClone(s.players.p1.stock),
    readiness = s.players.p1.hero.readiness,
    due = s.warnings[0].due;
  interruptCastOnDamage(s, h, 1, true);
  expect(s.warnings).toHaveLength(1);
  expect(s.warnings[0].due).toBe(due + 1);
  expect(s.players.p1.stock).toEqual(stock);
  expect(s.players.p1.hero.readiness).toBe(readiness);
  expect(s.orders).toHaveLength(0);
  interruptCastOnDamage(s, h, 1, true);
  expect(s.warnings).toHaveLength(0);
});
it("a new encounter refreshes allowance while retaining the same identity", () => {
  const { s, h } = fixture();
  interruptCastOnDamage(s, h, 1, true);
  s.turn++;
  const due = s.warnings[0].due;
  interruptCastOnDamage(s, h, 1, true);
  expect(s.warnings[0].due).toBe(due + 1);
});
it.each([false, true])(
  "ordinary hit or lethal magical hit cancels immediately (magical=%s)",
  (magical) => {
    const { s, h } = fixture();
    interruptCastOnDamage(s, h, magical ? 100 : 1, magical);
    expect(s.warnings).toHaveLength(0);
  },
);
it("zero/invalid hits and no active cast do not consume the allowance", () => {
  const { s, h } = fixture();
  const before = structuredClone(s);
  for (const hit of [0, -1, NaN, Infinity])
    interruptCastOnDamage(s, h, hit, true);
  expect(s).toEqual(before);
  s.warnings = [];
  interruptCastOnDamage(s, h, 1, true);
  expect(h.effects).toEqual([]);
});
it("other heroes cancel on magical damage and incapacitation overrides Pallando while roots do not", () => {
  const other = fixture("istari_gandalf");
  interruptCastOnDamage(other.s, other.h, 1, true);
  expect(other.s.warnings).toHaveLength(0);
  for (const kind of ["stunned", "incapacitated"]) {
    const { s, h } = fixture();
    h.effects.push({ kind, value: 1, until: s.revision + 2, source: "enemy" });
    interruptCastOnDamage(s, h, 1, true);
    expect(s.warnings).toHaveLength(0);
  }
  const { s, h } = fixture();
  h.effects.push({
    kind: "root",
    value: 1,
    until: s.revision + 2,
    source: "enemy",
  });
  interruptCastOnDamage(s, h, 1, true);
  expect(s.warnings).toHaveLength(1);
});
it("nonhero counterattack damage cannot cancel its owners hero warning", () => {
  const { s } = fixture();
  interruptCastOnDamage(s, s.units["p1:company:0"], 5, true);
  expect(s.warnings).toHaveLength(1);
});
it("inactive or captive Pallando cannot preserve a cast and other seats remain untouched", () => {
  for (const captive of [false, true]) {
    const { s, h } = fixture();
    if (captive) s.players.p1.hero.status = "captive";
    else h.active = false;
    s.warnings.push({ ...s.warnings[0], id: "other", seat: "p2" });
    interruptCastOnDamage(s, h, 1, true);
    expect(s.warnings.map((w) => w.seat)).toEqual(["p2"]);
  }
});
