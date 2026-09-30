import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  beginPassivePhase,
  endPassivePhase,
  passiveActivity,
  passiveOrdinaryHit,
} from "../src/simulation/passives";
function fixture(profile: string) {
  const s = createMatch([profile, "human_rohan"], 7),
    p = s.players.p1;
  const h = {
    ...structuredClone(s.units["p1:company:0"]),
    id: p.hero.id,
    kind: "hero" as const,
    effects: [],
  };
  s.units[h.id] = h;
  p.hero.status = "living";
  const target = s.units["p2:company:0"];
  target.x = h.x + 2;
  target.y = h.y;
  return { s, h, target };
}
it("Alatar must wait a complete phase and receives only one ordinary ranged hit bonus", () => {
  const { s, h, target } = fixture("istari_alatar");
  expect(passiveOrdinaryHit(s, h, target, 10)).toBe(10);
  beginPassivePhase(s);
  endPassivePhase(s);
  expect(passiveOrdinaryHit(s, h, target, 10)).toBe(10);
  s.revision++;
  expect(passiveOrdinaryHit(s, h, target, 10)).toBe(20);
  expect(passiveOrdinaryHit(s, h, target, 10)).toBe(10);
  expect(target.hp).toBe(target.maxHp);
});
it("movement, a missed attack and displacement prevent ambush preparation", () => {
  for (const action of ["move", "miss", "displacement"]) {
    const { s, h, target } = fixture("istari_alatar");
    beginPassivePhase(s);
    if (action === "displacement") h.x++;
    else passiveActivity(s, h);
    endPassivePhase(s);
    s.revision++;
    expect(passiveOrdinaryHit(s, h, target, 10)).toBe(10);
  }
});
it("ambush neither kills a healthy hero outright nor survives an encounter boundary", () => {
  const { s, h, target } = fixture("istari_alatar");
  target.kind = "hero";
  target.hp = target.maxHp = 15;
  beginPassivePhase(s);
  endPassivePhase(s);
  s.revision++;
  expect(passiveOrdinaryHit(s, h, target, 10)).toBe(14);
  s.turn++;
  expect(passiveOrdinaryHit(s, h, target, 10)).toBe(10);
});
it("a prepared ambush is invalidated by forced displacement before its attack", () => {
  const { s, h, target } = fixture("istari_alatar");
  beginPassivePhase(s);
  endPassivePhase(s);
  s.revision++;
  h.y++;
  expect(passiveOrdinaryHit(s, h, target, 10)).toBe(10);
});
it("Saruman needs an actual classified ordinary siege weapon, proximity and one fortification hit", () => {
  const { s, h } = fixture("istari_saruman"),
    u = s.units["p1:company:0"],
    f = s.facilities["p2:core"];
  u.x = h.x;
  u.y = h.y;
  expect(passiveOrdinaryHit(s, u, f, 10)).toBe(10);
  u.kind = "construct";
  expect(passiveOrdinaryHit(s, u, f, 10, true)).toBe(10);
  u.kind = "company";
  u.x = h.x + 5;
  expect(passiveOrdinaryHit(s, u, f, 10, true)).toBe(10);
  u.x = h.x;
  expect(passiveOrdinaryHit(s, u, f, 10, true)).toBe(20);
  expect(passiveOrdinaryHit(s, u, f, 10, true)).toBe(10);
});
