import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { activeEffects, protectedDamage } from "../src/simulation/effects";
it("suppression disables a cast ward temporarily without removing it or freeing capacity", () => {
  const s = createMatch(["istari_pallando", "human_rohan"], 1),
    u = s.units["p1:company:0"];
  u.effects = [
    { kind: "hit-ward", value: 10, source: "cast:p1:1:0:support", until: 5 },
    { kind: "suppressed", value: 1, source: "cast:p1:1:0:support", until: 2 },
  ];
  expect(protectedDamage(s, u, 20, true)).toBe(20);
  expect(u.effects).toHaveLength(2);
  s.revision = 2;
  expect(protectedDamage(s, u, 20, true)).toBe(10);
  expect(u.effects.some((e) => e.kind === "hit-ward")).toBe(false);
});
it("temporary Forge repair suspends only its linked damaged-joint impairment", () => {
  const s = createMatch(["istari_forge", "human_rohan"], 1),
    u = s.units["p1:company:0"];
  u.effects = [
    { kind: "movement-impairment", value: 1, until: 9, source: "joint:left" },
    { kind: "movement-repair", value: 1, until: 2, source: "joint:left" },
  ];
  expect(
    activeEffects(s, u).some((e) => e.kind === "movement-impairment"),
  ).toBe(false);
  s.revision = 2;
  expect(
    activeEffects(s, u).some((e) => e.kind === "movement-impairment"),
  ).toBe(true);
});
it("Pallando circle reduces spells while inside and never physical hits", () => {
  const s = createMatch(["istari_pallando", "human_rohan"], 1),
    u = s.units["p1:company:0"];
  u.effects = [
    {
      kind: "spell-damage-reduction-percent",
      value: 50,
      until: 3,
      source: `circle:${u.x}:${u.y}`,
    },
  ];
  expect(protectedDamage(s, u, 20, true)).toBe(10);
  expect(protectedDamage(s, u, 20, false)).toBe(20);
  u.x++;
  expect(protectedDamage(s, u, 20, true)).toBe(20);
  s.revision = 3;
  expect(activeEffects(s, u)).toEqual([]);
});
