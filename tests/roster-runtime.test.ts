import { it, expect } from "vitest";
import { profiles, heroRecipe, economy } from "../src/content/catalog";
import {
  createMatch,
  submit,
  resolveWeek,
  planAI,
} from "../src/simulation/engine";
import type { Match, Action } from "../src/simulation/types";
function act(s: Match, a: Action) {
  const r = submit(s, {
    id: `p1:${s.turn}:${s.nextSeq.p1}`,
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action: a,
  });
  expect(r.ok, r.reason).toBe(true);
  return r.state;
}
it("every exact profile completes its component and prescribed hero recipe", () => {
  for (const p of profiles) {
    let s = createMatch(
      [p.id, p.id === "human_rohan" ? "human_gondor" : "human_rohan"],
      1947,
    );
    const spec = heroRecipe(p.id);
    expect(spec.cost).toEqual(economy(p.id).recipe.cost);
    s = resolveWeek(
      act(s, { kind: "produce", facility: "p1:core", recipe: "component" }),
    );
    expect(s.players.p1.component).toBe(1);
    s = act(s, { kind: "produce", facility: "p1:core", recipe: "hero" });
    for (let i = 0; i < spec.turns; i++) s = resolveWeek(s);
    expect(s.players.p1.hero.status, p.id).toBe("living");
    expect(s.units["p1:hero"].name).toBe(p.hero);
  }
});
it("AI contest reaches scenario victory without hero-death elimination", () => {
  let s = createMatch(["human_rohan", "human_gondor"], 1947);
  for (let turn = 0; turn < 80 && !s.winner; turn++) {
    for (const p of Object.values(s.players)) {
      for (const action of planAI(s, p.seat)) {
        const r = submit(s, {
          id: `${p.seat}:${s.turn}:${s.nextSeq[p.seat]}`,
          seat: p.seat,
          seq: s.nextSeq[p.seat],
          turn: s.turn,
          revision: s.revision,
          action,
        });
        expect(r.ok).toBe(true);
        s = r.state;
      }
    }
    s = resolveWeek(s);
  }
  expect(s.winner).not.toBe(null);
  expect(s.phase).toBe("finished");
});
