import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  startEyrieRelay,
  eyrieRelayReason,
  progressConvoys,
  settleConvoyLosses,
  validateConvoyState,
  type RouteFinder,
} from "../src/simulation/transport";
const finder: RouteFinder = (_s, a, b) => {
  const p = [{ x: a.x, y: a.y }];
  while (a.x !== b.x || a.y !== b.y) {
    a = {
      x: a.x + Math.sign(b.x - a.x),
      y: a.x === b.x ? a.y + Math.sign(b.y - a.y) : a.y,
    };
    p.push(a);
  }
  return p;
};
function setup() {
  const s = createMatch(["eagle_eyrie", "human_rohan"], 4),
    p = s.players.p1,
    base = s.units["p1:company:0"],
    origin = s.facilities["p1:core"];
  origin.kind = "ledge";
  const dest = { ...structuredClone(origin), id: "ledge2", x: origin.x + 3 };
  s.facilities[dest.id] = dest;
  s.units[p.hero.id] = {
    ...structuredClone(base),
    id: p.hero.id,
    kind: "hero",
    flying: true,
    x: origin.x,
    y: origin.y,
    move: 4,
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.stock = { P: 100, M: 100, K: 100, E: 100 };
  return {
    s,
    p,
    h: s.units[p.hero.id],
    origin,
    dest,
    a: {
      origin: origin.id,
      destination: dest.id,
      cargo: { P: 10, M: 0, K: 10, E: 0 },
    },
  };
}
it("escrows one bounded load, pays exact fee, flies physical normal route and delivers once", () => {
  const { s, p, h, dest, a } = setup();
  const c = startEyrieRelay(s, "p1", a, finder);
  expect(p.stock).toEqual({ P: 80, M: 95, K: 90, E: 100 });
  expect(p.hero.readiness).toBe(3);
  expect(h.x).not.toBe(dest.x);
  expect(() => validateConvoyState(s, c)).not.toThrow();
  progressConvoys(s, finder);
  expect(h.x).toBe(dest.x);
  expect(p.stock).toEqual({ P: 90, M: 95, K: 100, E: 100 });
  expect(s.convoys[c.id]).toBeUndefined();
  progressConvoys(s, finder);
  expect(p.stock.P).toBe(90);
});
it("rejects heavy cargo, excess, foreign ledges and routes beyond normal flight", () => {
  const { s, h, dest, a } = setup();
  expect(
    eyrieRelayReason(
      s,
      "p1",
      { ...a, cargo: { P: 1, M: 1, K: 0, E: 0 } },
      finder,
    ),
  ).toMatch(/P.*K/);
  expect(
    eyrieRelayReason(
      s,
      "p1",
      { ...a, cargo: { P: 21, M: 0, K: 0, E: 0 } },
      finder,
    ),
  ).toMatch(/20/);
  dest.owner = "p2";
  expect(eyrieRelayReason(s, "p1", a, finder)).toMatch(/owned/);
  dest.owner = "p1";
  h.move = 2;
  expect(eyrieRelayReason(s, "p1", a, finder)).toMatch(/movement/);
});
it("death retains the same lost cargo and blocked flight never refunds or teleports", () => {
  const { s, p, h, a } = setup();
  const c = startEyrieRelay(s, "p1", a, finder),
    stock = structuredClone(p.stock);
  progressConvoys(s, () => null);
  expect(c.index).toBe(0);
  expect(p.stock).toEqual(stock);
  h.alive = false;
  h.hp = 0;
  settleConvoyLosses(s);
  expect(c.phase).toBe("lost");
  expect(c.cargo).toEqual(a.cargo);
  expect(() => validateConvoyState(s, c)).not.toThrow();
});
it("threatened landing prevents launch and one hero cannot take a second load", () => {
  const { s, dest, a } = setup(),
    enemy = s.units["p2:company:0"];
  enemy.x = dest.x;
  enemy.y = dest.y;
  s.players.p1.relations.p2 = "war";
  expect(eyrieRelayReason(s, "p1", a, finder)).toMatch(/threat/);
  enemy.x += 10;
  startEyrieRelay(s, "p1", a, finder);
  expect(eyrieRelayReason(s, "p1", a, finder)).toMatch(/busy/);
});
