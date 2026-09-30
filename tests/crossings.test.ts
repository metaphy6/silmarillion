import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  startCrossing,
  crossingReason,
  progressCrossings,
  crossingAllows,
  damageCrossing,
  validateCrossingState,
} from "../src/simulation/crossings";
function setup(profile = "ent_grove") {
  const s = createMatch([profile, "melkor_worldbreaker"], 91),
    p = s.players.p1,
    base = s.facilities["p1:core"];
  s.facilities.a = {
    ...structuredClone(base),
    id: "a",
    kind: "crossing-anchor",
    x: 5,
    y: 5,
  };
  s.facilities.b = {
    ...structuredClone(base),
    id: "b",
    kind: "crossing-anchor",
    x: 8,
    y: 5,
  };
  for (let x = 5; x <= 8; x++)
    s.map.terrain[5 * s.map.width + x] =
      x === 5 ? "woodland" : x === 8 ? "plain" : "water";
  const crew = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  crew.x = 5;
  crew.y = 5;
  s.units[p.hero.id] = {
    ...structuredClone(crew),
    id: p.hero.id,
    kind: "hero",
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.stock = { P: 100, M: 100, K: 100, E: 100 };
  p.sources.push("timber");
  return { s, p, crew, a: { from: "a", to: "b", crew: crew.id } };
}
it("requires paid labor then creates a persistent physical route without altering terrain or ownership", () => {
  const { s, p, crew, a } = setup();
  const c = startCrossing(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  expect(p.stock).toEqual({ P: 90, M: 80, K: 100, E: 100 });
  expect(p.hero.readiness).toBe(3);
  expect(crossingAllows(s, { x: 6, y: 5 }, crew)).toBe(false);
  progressCrossings(s);
  expect(c.phase).toBe("ready");
  expect(crossingAllows(s, { x: 6, y: 5 }, crew)).toBe(true);
  expect(s.map.terrain[5 * s.map.width + 6]).toBe("water");
  expect(() => validateCrossingState(s, c)).not.toThrow();
  s.turn++;
  progressCrossings(s);
  expect(c.phase).toBe("ready");
});
it("denies unsurveyed, overwide or unrooted gaps and requires real existing crew", () => {
  const { s, a } = setup();
  expect(
    crossingReason(
      s,
      "p1",
      a,
      () => true,
      () => false,
    ),
  ).toMatch(/survey/i);
  s.facilities.b.x = 11;
  expect(
    crossingReason(
      s,
      "p1",
      a,
      () => true,
      () => true,
    ),
  ).toMatch(/15/);
  s.facilities.b.x = 8;
  s.map.terrain[5 * s.map.width + 5] = "plain";
  expect(
    crossingReason(
      s,
      "p1",
      a,
      () => true,
      () => true,
    ),
  ).toMatch(/roots|woodland/);
});
it("interrupted construction pauses; destroyed anchors immediately deny ready traversal", () => {
  const { s, crew, a } = setup();
  const c = startCrossing(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  crew.alive = false;
  progressCrossings(s);
  expect(c.phase).toBe("building");
  crew.alive = true;
  s.turn++;
  progressCrossings(s);
  expect(c.phase).toBe("ready");
  s.facilities.b.hp = 0;
  expect(crossingAllows(s, { x: 6, y: 5 }, crew)).toBe(false);
});
it("silk serves owned brood only; causeway allows allied grounded great creatures without control transfer", () => {
  const spider = setup("spider_brood"),
    silk = startCrossing(
      spider.s,
      "p1",
      spider.a,
      () => true,
      () => true,
    );
  progressCrossings(spider.s);
  expect(silk.kind).toBe("silk");
  expect(crossingAllows(spider.s, { x: 6, y: 5 }, spider.crew)).toBe(true);
  const foreign = { ...spider.crew, owner: "p2" };
  expect(crossingAllows(spider.s, { x: 6, y: 5 }, foreign)).toBe(false);
  const ent = setup();
  startCrossing(
    ent.s,
    "p1",
    ent.a,
    () => true,
    () => true,
  );
  progressCrossings(ent.s);
  ent.s.players.p1.relations.p2 = "alliance";
  ent.s.players.p2.relations.p1 = "alliance";
  const dragon = { ...ent.crew, owner: "p2", kind: "dragon" as const };
  expect(crossingAllows(ent.s, { x: 6, y: 5 }, dragon)).toBe(true);
  expect(dragon.owner).toBe("p2");
});
it("damage destroys crossing; paid rebuilding retains identity and creates no resources", () => {
  const { s, p, crew, a } = setup();
  const c = startCrossing(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  progressCrossings(s);
  damageCrossing(s, c.id, 999);
  expect(crossingAllows(s, { x: 6, y: 5 }, crew)).toBe(false);
  const before = p.stock.M;
  p.hero.readiness = 6;
  const rebuilt = startCrossing(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  expect(rebuilt.id).toBe(c.id);
  expect(p.stock.M).toBe(before - 20);
  expect(rebuilt.phase).toBe("building");
});

it("guest projection may omit hidden crew, but never malformed geometry", () => {
  const { s, a } = setup();
  const c = startCrossing(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  progressCrossings(s);
  delete s.units[c.crew];
  expect(() => validateCrossingState(s, c)).toThrow(/crossing/);
  expect(() => validateCrossingState(s, c, "p2")).not.toThrow();
  c.tiles[1].x += 4;
  expect(() => validateCrossingState(s, c, "p2")).toThrow(/crossing/);
});

it("unilateral alliance offer grants no causeway access", () => {
  const { s, a, crew } = setup();
  startCrossing(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  progressCrossings(s);
  const foreign = { ...crew, owner: "p2" };
  s.players.p1.relations.p2 = "alliance";
  expect(crossingAllows(s, { x: 6, y: 5 }, foreign)).toBe(false);
  s.players.p2.relations.p1 = "alliance";
  expect(crossingAllows(s, { x: 6, y: 5 }, foreign)).toBe(true);
});
