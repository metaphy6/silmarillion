import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  prepareSupply,
  prepareSupplyReason,
  progressConvoys,
  startConvoy,
  type RouteFinder,
} from "../src/simulation/transport";
const finder: RouteFinder = (_s, a, b) => {
  const points = [{ x: a.x, y: a.y }];
  while (a.x !== b.x || a.y !== b.y) {
    a = {
      x: a.x + Math.sign(b.x - a.x),
      y: a.x === b.x ? a.y + Math.sign(b.y - a.y) : a.y,
    };
    points.push(a);
  }
  return points;
};
function fixture() {
  const s = createMatch(["sauron", "human_rohan"], 42),
    p = s.players.p1;
  const u = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  const origin = s.facilities["p1:core"];
  origin.kind = "depot";
  const dest = { ...structuredClone(origin), id: "dest", x: origin.x + 3 };
  s.facilities.dest = dest;
  u.x = origin.x;
  u.y = origin.y;
  u.move = 2;
  s.units[p.hero.id] = { ...structuredClone(u), id: p.hero.id, kind: "hero" };
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.stock = { P: 100, M: 100, K: 100, E: 100 };
  const c = startConvoy(
    s,
    "p1",
    {
      carrier: u.id,
      origin: origin.id,
      destination: dest.id,
      cargo: { P: 5, M: 2, K: 0, E: 0 },
    },
    finder,
  );
  c.phase = "travel";
  const route = [
    { x: u.x, y: u.y },
    { x: u.x, y: u.y + 1 },
    { x: u.x + 1, y: u.y + 1 },
    { x: u.x + 2, y: u.y + 1 },
    { x: dest.x, y: u.y + 1 },
    { x: dest.x, y: dest.y },
  ];
  return { s, p, u, c, route, request: { convoy: c.id, route } };
}
it("prepares paid surveyed supply without moving, cloning, or refunding cargo", () => {
  const { s, p, u, c, request } = fixture(),
    before = structuredClone(p.stock),
    pos = { x: u.x, y: u.y },
    cargo = structuredClone(c.cargo);
  expect(prepareSupplyReason(s, "p1", request, finder, () => true)).toBe("");
  prepareSupply(s, "p1", request, finder, () => true);
  expect(p.stock).toEqual({ ...before, M: before.M - 10, K: before.K - 5 });
  expect(p.hero.readiness).toBe(3);
  expect(c.cargo).toEqual(cargo);
  expect({ x: u.x, y: u.y }).toEqual(pos);
  expect(c.alternate?.used).toBe(false);
  expect(prepareSupplyReason(s, "p1", request, finder, () => true)).toMatch(
    /already/i,
  );
});
it("switches once only when original closes, with ordinary movement and no teleport", () => {
  const { s, u, c, request } = fixture();
  prepareSupply(s, "p1", request, finder, () => true);
  const blocked: RouteFinder = (state, a, b, unit) =>
    a.y === c.y && b.y === c.y && a.x !== b.x
      ? null
      : finder(state, a, b, unit);
  const before = { x: u.x, y: u.y };
  progressConvoys(s, blocked);
  expect(c.alternate?.used).toBe(true);
  expect(c.index).toBe(2);
  expect(u.x).toBe(before.x + 1);
  expect(u.y).toBe(before.y + 1);
  expect(c.cargo.P).toBe(5);
  progressConvoys(s, blocked);
  expect(c.index).toBe(2);
});
it("does not use blocked or expired alternatives and requires surveyed owned depots", () => {
  for (const mode of ["blocked", "expired"] as const) {
    const { s, c, request } = fixture();
    prepareSupply(s, "p1", request, finder, () => true);
    if (mode === "expired") s.turn++;
    progressConvoys(s, () => null);
    expect(c.index).toBe(0);
    expect(c.alternate?.used).toBe(false);
  }
  const { s, c, request } = fixture();
  expect(prepareSupplyReason(s, "p1", request, finder, () => false)).toMatch(
    /survey/i,
  );
  s.facilities[c.origin].kind = "core";
  expect(prepareSupplyReason(s, "p1", request, finder, () => true)).toMatch(
    /depot/i,
  );
});
it("rejects loops, nonphysical routes, unauthorized identities and damage to depots", () => {
  const { s, c, request } = fixture();
  expect(prepareSupplyReason(s, "p2", request, finder, () => true)).not.toBe(
    "",
  );
  expect(
    prepareSupplyReason(
      s,
      "p1",
      { ...request, route: [request.route[0], request.route.at(-1)!] },
      finder,
      () => true,
    ),
  ).toMatch(/route/i);
  expect(
    prepareSupplyReason(
      s,
      "p1",
      { ...request, route: [...request.route, request.route[0]] },
      finder,
      () => true,
    ),
  ).toMatch(/route/i);
  prepareSupply(s, "p1", request, finder, () => true);
  s.facilities[c.destination].hp = 0;
  progressConvoys(s, finder);
  expect(c.index).toBe(0);
});
it("retains the original while open and rejects corrupt alternate save geometry", async () => {
  const { validateConvoyState } = await import("../src/simulation/transport");
  const { s, c, request } = fixture();
  prepareSupply(s, "p1", request, finder, () => true);
  progressConvoys(s, finder);
  expect(c.alternate?.used).toBe(false);
  expect(c.index).toBe(2);
  expect(() => validateConvoyState(s, c)).not.toThrow();
  c.alternate!.prepared = s.turn + 1;
  expect(() => validateConvoyState(s, c)).toThrow(/convoy/);
});
it("an expired preparation cannot use an otherwise open alternate", () => {
  const { s, c, request } = fixture();
  prepareSupply(s, "p1", request, finder, () => true);
  const y = c.y;
  s.turn++;
  progressConvoys(s, (state, a, b, u) =>
    a.y === y && b.y === y && a.x !== b.x ? null : finder(state, a, b, u),
  );
  expect(c.index).toBe(0);
  expect(c.alternate?.used).toBe(false);
});
