import { expect, it } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  validate,
} from "../src/simulation/engine";
import type { Action, Match } from "../src/simulation/types";
function order(s: Match, seat: string, action: Action) {
  return {
    id: `morale:${seat}:${s.nextSeq[seat]}`,
    seat,
    seq: s.nextSeq[seat],
    turn: s.turn,
    revision: s.revision,
    action,
  };
}
it("actual severe combat exposes morale during response phases and blocks routed attacks without adding movement", () => {
  let s = createMatch(["human_rohan", "human_gondor"], 85);
  s.map.terrain.fill("meadow");
  s.seaHazards = {};s.shallowWater={};
  s.infrastructureSites = {};
  s.players.p2.ai = false;
  Object.assign(s.units["p1:company:0"], {
    x: 8,
    y: 8,
    attack: 30,
    hp: 200,
    maxHp: 200,
  });
  Object.assign(s.units["p2:company:0"], {
    x: 9,
    y: 8,
    hp: 100,
    maxHp: 100,
    armor: 0,
  });
  for (let i = 0; i < 2; i++) {
    const r = submit(
      s,
      order(s, "p1", {
        kind: "attack",
        unit: "p1:company:0",
        target: "p2:company:0",
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) s = r.state;
    s = resolveWeek(s);
  }
  const target = s.units["p2:company:0"];
  expect(target.alive).toBe(true);
  expect(target.effects.some((e) => e.kind === "rout")).toBe(true);
  expect(target.x).toBe(9);
  expect(
    validate(
      s,
      order(s, "p2", {
        kind: "attack",
        unit: target.id,
        target: "p1:company:0",
      }),
    ),
  ).toMatch(/Routed/);
});
it("a real fallback records its existing endpoint for Sauron and cancellation removes that authority", () => {
  let s = createMatch(["sauron", "human_gondor"], 85);
  s.map.terrain.fill("meadow");
  s.seaHazards = {};s.shallowWater={};
  s.infrastructureSites = {};
  const u = s.units["p1:company:0"];
  Object.assign(u, { x: 8, y: 8 });
  let r = submit(
    s,
    order(s, "p1", {
      kind: "declare-tactical",
      order: {
        kind: "fallback",
        unit: u.id,
        route: [
          { x: 8, y: 8 },
          { x: 8, y: 9 },
        ],
      },
    }),
  );
  expect(r.ok).toBe(true);
  if (r.ok) s = r.state;
  s = resolveWeek(s);
  expect(
    s.units[u.id].effects.find((e) => e.kind === "declared-fallback")?.source,
  ).toBe("fallback:8:9");
  r = submit(s, order(s, "p1", { kind: "cancel-tactical", unit: u.id }));
  expect(r.ok).toBe(true);
  if (r.ok) s = r.state;
  s = resolveWeek(s);
  expect(
    s.units[u.id].effects.some((e) => e.kind === "declared-fallback"),
  ).toBe(false);
});
