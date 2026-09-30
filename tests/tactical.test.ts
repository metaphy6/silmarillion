import { it, expect } from "vitest";
import { createMatch, resolveWeek, submit } from "../src/simulation/engine";
import type { Match, Action } from "../src/simulation/types";
function act(s: Match, a: Action, seat = "p1") {
  return submit(s, {
    id: `${seat}:${s.turn}:${s.nextSeq[seat]}`,
    seat,
    seq: s.nextSeq[seat],
    turn: s.turn,
    revision: s.revision,
    action: a,
  });
}
function fixture() {
  let s = createMatch(["istari_gandalf", "human_rohan"], 99);
  s = resolveWeek(
    act(s, { kind: "produce", facility: "p1:core", recipe: "component" }).state,
  );
  s = act(s, { kind: "produce", facility: "p1:core", recipe: "hero" }).state;
  for (let i = 0; i < 3; i++) s = resolveWeek(s);
  const h = s.units["p1:hero"],
    t = s.units["p2:company:0"];
  t.x = h.x + 1;
  t.y = h.y;
  return s;
}
it("one battle commitment supports distinct tactical actions and pauses weekly production", () => {
  let s = fixture();
  const start = s.turn;
  s = act(s, { kind: "cast", power: "field", target: "p2:company:0" }).state;
  s = resolveWeek(s);
  expect(s.turn).toBe(start);
  expect(s.combatPhase).toBe(1);
  expect(s.players.p1.commitment).toBe(0);
  expect(act(s, { kind: "cast", power: "support", target: "p1:hero" }).ok).toBe(
    true,
  );
});
it("an ordinary hero attack also opens one battle commitment", () => {
  let s = fixture();
  s = resolveWeek(
    act(s, { kind: "attack", unit: "p1:hero", target: "p2:company:0" }).state,
  );
  expect(s.combatPhase).toBe(1);
  expect(s.players.p1.commitment).toBe(0);
  expect(act(s, { kind: "cast", power: "support", target: "p1:hero" }).ok).toBe(
    true,
  );
});
it("target can escape a warned attack before it lands", () => {
  let s = fixture();
  const hp = s.units["p2:company:0"].hp;
  s = resolveWeek(
    act(s, { kind: "cast", power: "field", target: "p2:company:0" }).state,
  );
  const t = s.units["p2:company:0"];
  s = act(s, { kind: "move", unit: t.id, x: t.x + 3, y: t.y }, "p2").state;
  s = resolveWeek(s);
  expect(s.units[t.id].hp).toBe(hp);
});
it("a one-phase protective power remains effective for the next response attacks", () => {
  let s = createMatch(["elf_vanyar", "human_rohan"], 55);
  s = resolveWeek(
    act(s, { kind: "produce", facility: "p1:core", recipe: "component" }).state,
  );
  s = act(s, { kind: "produce", facility: "p1:core", recipe: "hero" }).state;
  for (let i = 0; i < 4; i++) s = resolveWeek(s);
  const h = s.units["p1:hero"],
    u = s.units["p1:company:0"],
    enemy = s.units["p2:company:0"];
  u.x = h.x + 1;
  u.y = h.y;
  enemy.x = u.x + 1;
  enemy.y = u.y;
  s = resolveWeek(act(s, { kind: "cast", power: "field", target: u.id }).state);
  const unprotected = structuredClone(s);
  unprotected.units[u.id].effects = [];
  const a: Action = { kind: "attack", unit: enemy.id, target: u.id };
  const defended = resolveWeek(act(s, a, "p2").state),
    ordinary = resolveWeek(act(unprotected, a, "p2").state);
  expect(defended.units[u.id].hp).toBeGreaterThan(ordinary.units[u.id].hp);
});
