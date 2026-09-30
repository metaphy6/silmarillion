import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  prepareMovementPower,
  validateMovementPower,
  woodlandMovementCost,
  resolveMovementPlan,
  consumeMovementPlanStep,
  type MovementRouteFinder,
} from "../src/simulation/movement-plans";
import type { Unit } from "../src/simulation/types";
function fixture(profile = "nessa") {
  const s = createMatch([profile, "human_gondor"], 84);
  s.map.terrain.fill("meadow");s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
  const p = s.players.p1;
  const hero: Unit = {
    ...structuredClone(s.units["p1:company:0"]),
    id: p.hero.id,
    kind: "hero",
    x: 10,
    y: 10,
    effects: [],
  };
  s.units[hero.id] = hero;
  p.hero.status = "living";
  const a = s.units["p1:company:0"],
    b = s.units["p1:company:1"];
  Object.assign(a, { x: 11, y: 10, move: 4 });
  Object.assign(b, { x: 11, y: 11, move: 3 });
  const path: MovementRouteFinder = (_s, start, end) => {
    const route = [{ x: start.x, y: start.y }];
    let { x, y } = start;
    while (x !== end.x) {
      x += Math.sign(end.x - x);
      route.push({ x, y });
    }
    while (y !== end.y) {
      y += Math.sign(end.y - y);
      route.push({ x, y });
    }
    return route;
  };
  return {
    s,
    a,
    b,
    hero,
    path,
    request: { members: [{ unit: a.id, to: { x: 13, y: 10 } }] },
  };
}
it("Nessa prepares one real short route without moving units, creating actions or refunding resources", () => {
  const { s, a, path, request } = fixture(),
    before = structuredClone(s);
  expect(validateMovementPower(s, "p1", request, path)).toBe("");
  const plan = prepareMovementPower(s, "p1", request, path);
  expect(plan.members[0].route).toEqual([
    { x: 11, y: 10 },
    { x: 12, y: 10 },
    { x: 13, y: 10 },
  ]);
  expect(s).toEqual(before);
  expect(a.x).toBe(11);
});
it("Nessa forbids exclusive creatures, blocked or long routes and loaded convoy carriers", () => {
  const { s, a, path, request } = fixture();
  a.kind = "dragon";
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/ordinary/i);
  a.kind = "company";
  s.map.terrain[10 * s.map.width + 12] = "cliff";
  expect(validateMovementPower(s, "p1", request, path)).toMatch(
    /blocked|traversable/i,
  );
  s.map.terrain.fill("meadow");s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
  request.members[0].to.x = 14;
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/short|two|2/i);
});
it("Nandor removes exactly one actual woodland entry penalty, without creating impassable routes", () => {
  const { s, a, path, request } = fixture("elf_nandor");
  const route = path(s, a, request.members[0].to, a)!;
  s.map.terrain[10 * s.map.width + 12] = "woodland";
  s.map.terrain[10 * s.map.width + 13] = "woodland";
  expect(woodlandMovementCost(s, a, route)).toBe(2);
  const plan = prepareMovementPower(s, "p1", request, path);
  expect(plan.members[0].woodlandDiscount).toBe(1);
  s.map.terrain.fill("meadow");s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/woodland/i);
});
it("Eonwe shared pace never grants a faster company extra movement or permits a split advance", () => {
  const { s, a, b, path } = fixture("eonwe");
  const request = {
    members: [
      { unit: a.id, to: { x: 13, y: 10 } },
      { unit: b.id, to: { x: 13, y: 11 } },
    ],
  };
  const plan = prepareMovementPower(s, "p1", request, path);
  expect(plan.pace).toBe(3);
  expect(plan.until).toBe(s.revision + 3);
  request.members[1].to = { x: 11, y: 13 };
  expect(validateMovementPower(s, "p1", request, path)).toMatch(
    /separation|shared/i,
  );
});
it("Architect accepts only supplied owned great creatures and preserves normal movement/supply", () => {
  const { s, a, path, request } = fixture("melkor_dark_architect");
  a.kind = "balrog";
  a.great = 1;
  const before = structuredClone(a);
  expect(validateMovementPower(s, "p1", request, path)).toBe("");
  prepareMovementPower(s, "p1", request, path);
  expect(a).toEqual(before);
  a.supplied = false;
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/supplied/i);
  a.supplied = true;
  a.owner = "p2";
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/owned/i);
});

it("prepared movement waits for response then resolves once, preserving coordinates until normal move execution", () => {
  const { s, a, path, request } = fixture();
  const plan = prepareMovementPower(s, "p1", request, path);
  expect(resolveMovementPlan(s, plan, path).reason).toMatch(/response/i);
  s.revision++;
  const result = resolveMovementPlan(s, plan, path);
  expect(result.reason).toBe("");
  expect(a.x).toBe(11);
  Object.assign(a, result.moves[0].to);
  consumeMovementPlanStep(plan, result.moves, s.revision);
  expect(resolveMovementPlan(s, plan, path).reason).toMatch(
    /completed|already advanced/i,
  );
});
it("prepared route interruption, displacement, death and expiry fail without teleport or automatic rerouting", () => {
  for (const cause of ["block", "displace", "death", "expiry"]) {
    const { s, a, hero, path, request } = fixture();
    const plan = prepareMovementPower(s, "p1", request, path);
    s.revision++;
    if (cause === "block") s.map.terrain[10 * s.map.width + 12] = "cliff";
    if (cause === "displace") a.y++;
    if (cause === "death") hero.alive = false;
    if (cause === "expiry") s.revision = plan.until;
    expect(resolveMovementPlan(s, plan, path).reason).not.toBe("");
  }
});
it("Eonwe pays for the slower terrain pace by advancing both companies the same number of steps", () => {
  const { s, a, b, path } = fixture("eonwe");
  s.map.terrain[11 * s.map.width + 12] = "woodland";
  s.map.terrain[11 * s.map.width + 13] = "woodland";
  const request = {
    members: [
      { unit: a.id, to: { x: 13, y: 10 } },
      { unit: b.id, to: { x: 13, y: 11 } },
    ],
  };
  const plan = prepareMovementPower(s, "p1", request, path);
  s.revision++;
  const result = resolveMovementPlan(s, plan, path);
  expect(result.reason).toBe("");
  expect(result.moves[0].route.length).toBe(result.moves[1].route.length);
  expect(result.moves[0].route.length).toBe(2);
});
it("Nessa respects loaded cargo and actual hostile prepared interception", () => {
  const { s, a, path, request } = fixture();
  s.convoys.c = {
    id: "c",
    owner: "p1",
    carrier: a.id,
    origin: "p1:core",
    destination: "p1:training",
    cargo: { P: 1, M: 0, K: 0, E: 0 },
    capacity: 20,
    route: [{ x: a.x, y: a.y }],
    index: 0,
    phase: "travel",
    started: s.turn,
    lastProgress: s.turn,
    supplies: { P: 1, M: 0, K: 0, E: 0 },
    x: a.x,
    y: a.y,
  };
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/cargo/i);
  delete s.convoys.c;
  const enemy = s.units["p2:company:0"];
  Object.assign(enemy, { x: 12, y: 11 });
  enemy.effects.push({
    kind: "prepared-intercept",
    value: 1,
    until: s.revision + 2,
    source: "prepared",
  });
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/interceptor/i);
});
it("checkpoint invariants reject forged unspent budgets, duplicate or nonadjacent routes and invalid phase clocks", async () => {
  const { validateMovementPlanState } =
    await import("../src/simulation/movement-plans");
  const { s, path, request } = fixture();
  const plan = prepareMovementPower(s, "p1", request, path);
  s.movementPlans[plan.id] = plan;
  expect(() => validateMovementPlanState(s, plan)).toThrow();
  s.players.p1.commitment = 0;
  s.players.p1.operations = 2;
  s.players.p1.encounter = true;
  expect(() => validateMovementPlanState(s, plan)).not.toThrow();
  for (const mutation of [
    () => (plan.lastResolvedRevision = s.revision + 1),
    () => (plan.members[0].route[1].x += 5),
    () => plan.members.push(structuredClone(plan.members[0])),
  ]) {
    const before = structuredClone(plan);
    mutation();
    expect(() => validateMovementPlanState(s, plan)).toThrow();
    Object.assign(plan, before);
  }
  s.units[plan.members[0].unit].alive = false;
  expect(() => validateMovementPlanState(s, plan)).not.toThrow();
});

it("movement plans respect fatigue and existing intact crossing access", () => {
  const { s, a, path, request } = fixture();
  a.move = 2;
  a.effects.push({
    kind: "fatigue",
    value: 3,
    until: 1000000,
    source: "ordinary-travel",
  });
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/allowance/i);
  a.effects = [];
  a.move = 4;
  const base = s.facilities["p1:core"];
  s.facilities.left = {
    ...structuredClone(base),
    id: "left",
    kind: "crossing-anchor",
    x: 11,
    y: 10,
  };
  s.facilities.right = {
    ...structuredClone(base),
    id: "right",
    kind: "crossing-anchor",
    x: 13,
    y: 10,
  };
  s.map.terrain[10 * s.map.width + 12] = "water";
  s.crossings.bridge = {
    id: "bridge",
    owner: "p1",
    kind: "causeway",
    from: "left",
    to: "right",
    crew: "unused",
    tiles: [
      { x: 11, y: 10 },
      { x: 12, y: 10 },
      { x: 13, y: 10 },
    ],
    hp: 60,
    maxHp: 60,
    phase: "ready",
    started: s.turn,
    lastProgress: s.turn,
  };
  expect(validateMovementPower(s, "p1", request, path)).toBe("");
  s.crossings.bridge.phase = "destroyed";
  s.crossings.bridge.hp = 0;
  expect(validateMovementPower(s, "p1", request, path)).toMatch(/blocked/i);
});
it('Eonwe operation reservation counts both actual shared phases and never invents a fourth weekly operation',async()=>{
 const {movementOperationCost}=await import('../src/simulation/movement-plans');
 const {s,a,b,path}=fixture('eonwe');
 for(const y of [10,11])for(const x of [12,13])s.map.terrain[y*s.map.width+x]='woodland';
 const plan=prepareMovementPower(s,'p1',{members:[{unit:a.id,to:{x:13,y:10}},{unit:b.id,to:{x:13,y:11}}]},path);
 expect(movementOperationCost(s,plan)).toBe(4);expect(movementOperationCost(s,plan)).toBeGreaterThan(s.players.p1.operations);
});
it('Eonwe charges three operations when one company completes the first shared leg',async()=>{
 const {movementOperationCost}=await import('../src/simulation/movement-plans');
 const {s,a,b,path}=fixture('eonwe');
 const plan=prepareMovementPower(s,'p1',{members:[{unit:a.id,to:{x:12,y:10}},{unit:b.id,to:{x:12,y:10}}]},path);
 expect(movementOperationCost(s,plan)).toBe(3);
});
