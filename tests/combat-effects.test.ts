import { it, expect } from "vitest";
import { createMatch, resolveWeek, submit } from "../src/simulation/engine";
import type { Match } from "../src/simulation/types";
function attack(s: Match, target: string) {
  const u = s.units["p1:company:0"];
  const r = submit(s, {
    id: "attack",
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action: { kind: "attack", unit: u.id, target },
  });
  expect(r.ok).toBe(true);
  return resolveWeek(r.state);
}
it("breach bonus modifies one actual obstacle hit and is consumed", () => {
  const s = createMatch(["troll_hold", "human_rohan"], 8),
    u = s.units["p1:company:0"];
  s.facilities.cover = {
    ...s.facilities["p2:core"],
    id: "cover",
    kind: "barricade",
    x: u.x + 1,
    y: u.y,
  };
  const plain = attack(structuredClone(s), "cover");
  u.effects.push({
    kind: "breach-bonus-percent",
    value: 25,
    source: "breach:cover",
    until: 3,
  });
  const enhanced = attack(s, "cover");
  expect(enhanced.facilities.cover.hp).toBeLessThan(plain.facilities.cover.hp);
  expect(
    enhanced.units[u.id].effects.some((e) => e.kind === "breach-bonus-percent"),
  ).toBe(false);
});
it("covered ranged targeting reduces hit probability through the stored seeded RNG", () => {
  const s = createMatch(["human_rohan", "elf_sindar"], 8),
    u = s.units["p1:company:0"],
    t = s.units["p2:company:0"];
  u.x = 8;
  u.y = 8;
  t.x = 10;
  t.y = 8;
  s.map.terrain[8 * s.map.width + 10] = "woodland";
  s.rng = 8;
  const plain = attack(structuredClone(s), t.id);
  t.effects.push({
    kind: "ranged-accuracy-reduction-percent",
    value: 25,
    source: "covered:10:8",
    until: 3,
  });
  const protectedState = attack(s, t.id);
  expect(protectedState.units[t.id].hp).toBe(t.hp);
  expect(plain.units[t.id].hp).toBeLessThan(t.hp);
});
