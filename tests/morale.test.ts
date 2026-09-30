import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {deployFinalDevice,finalProduction} from '../src/content/final-production';
import {movementZonePenalty,crossZones} from '../src/simulation/zones';
import {
  damageMorale,
  retreatMorale,
  verifiedOrderMorale,
  moraleAttackPenalty,
  finishMoraleEncounter,
  refreshOrderlyFallback,
} from "../src/simulation/morale";
function fixture(id = "human_rohan") {
  const s = createMatch([id, "human_gondor"], 85),
    p = s.players.p1,
    u = s.units["p1:company:0"];
  s.map.terrain.fill("meadow");
  s.seaHazards = {};
  s.shallowWater = {};
  s.infrastructureSites = {};
  Object.assign(u, { kind: "company", x: 8, y: 8, hp: 50, maxHp: 100 });
  p.hero.status = "living";
  s.units[p.hero.id] = {
    ...structuredClone(u),
    id: p.hero.id,
    kind: "hero",
    x: 8,
    y: 9,
  };
  return { s, p, u };
}
it("ordinary severe-hit pressure creates bounded fear and cohesion without moving or charging extra actions", () => {
  const { s, p, u } = fixture(),
    before = { x: u.x, y: u.y, operations: p.operations };
  damageMorale(s, u, 24);
  expect(moraleAttackPenalty(s, u)).toBe(0);
  damageMorale(s, u, 25);
  expect(moraleAttackPenalty(s, u)).toBe(1);
  damageMorale(s, u, 25);
  expect(u.effects.some((e) => e.kind === "rout")).toBe(true);
  expect({ x: u.x, y: u.y, operations: p.operations }).toEqual(before);
  finishMoraleEncounter(s);
  expect(moraleAttackPenalty(s, u)).toBe(0);
});
it("Tulkas reduces only the first fear-induced coordination loss and never cancels fear or later panic", () => {
  const { s, u } = fixture("tulkas");
  damageMorale(s, u, 25);
  expect(moraleAttackPenalty(s, u)).toBe(0);
  expect(u.effects.find((e) => e.kind === "fear")?.value).toBe(1);
  damageMorale(s, u, 25);
  expect(moraleAttackPenalty(s, u)).toBe(1);
  expect(u.effects.some((e) => e.kind === "rout")).toBe(true);
});
it("Manwe recovers existing coordination after a verified ordinary order once per formation", () => {
  const { s, u } = fixture("manwe");
  damageMorale(s, u, 25);
  verifiedOrderMorale(s, u);
  expect(moraleAttackPenalty(s, u)).toBe(0);
  damageMorale(s, u, 25);
  verifiedOrderMorale(s, u);
  expect(moraleAttackPenalty(s, u)).toBe(1);
});
it("Vanyar protects one nearby infantry formation from the first allied retreat penalty only", () => {
  const { s, u } = fixture("elf_vanyar"),
    departing = s.units["p1:company:1"];
  Object.assign(departing, { x: 8, y: 8, kind: "company" });
  retreatMorale(s, departing, [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
  ]);
  expect(moraleAttackPenalty(s, u)).toBe(0);
  retreatMorale(s, departing, [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
  ]);
  expect(moraleAttackPenalty(s, u)).toBe(1);
});
it("Gandalf preserves a real paid fallback on first panic but cannot invent movement or protect great creatures", () => {
  const { s, u } = fixture("istari_gandalf");
  s.tacticalOrders.retreat = {
    id: "retreat",
    owner: "p1",
    unit: u.id,
    kind: "fallback",
    route: [
      { x: 8, y: 8 },
      { x: 7, y: 8 },
    ],
    shielded: false,
    createdTurn: s.turn,
    createdRevision: s.revision,
    until: s.revision + 2,
  };
  damageMorale(s, u, 25, () => true);
  damageMorale(s, u, 25, () => true);
  expect(u.effects.some((e) => e.kind === "rout")).toBe(false);
  expect(u.effects.some((e) => e.kind === "orderly-fallback")).toBe(true);
  expect(u.x).toBe(8);
  damageMorale(s, u, 25, () => true);
  expect(u.effects.some((e) => e.kind === "rout")).toBe(true);
  const b = fixture("istari_gandalf");
  b.u.kind = "dragon";
  damageMorale(b.s, b.u, 99);
  expect(b.u.effects).toEqual([]);
});
it("Gandalf cannot protect a blocked fallback or an unconscious/displaced patron", () => {
  const { s, u } = fixture("istari_gandalf");
  s.tacticalOrders.retreat = {
    id: "retreat",
    owner: "p1",
    unit: u.id,
    kind: "fallback",
    route: [
      { x: 8, y: 8 },
      { x: 7, y: 8 },
    ],
    shielded: false,
    createdTurn: s.turn,
    createdRevision: s.revision,
    until: s.revision + 2,
  };
  damageMorale(s, u, 25, () => false);
  damageMorale(s, u, 25, () => false);
  expect(u.effects.some((e) => e.kind === "rout")).toBe(true);
});
it("Namo removes only the first actual threshold-withdrawal cohesion step and does not stop pursuit", () => {
  const { s, p, u } = fixture("namo");
  s.zones.threshold = {
    id: "threshold",
    owner: "p1",
    kind: "threshold",
    x: 8,
    y: 8,
    dx: 0,
    dy: 1,
    radius: 1,
    until: s.revision + 3,
    triggered: false,
  };
  const route = [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
  ];
  retreatMorale(s, u, route);
  expect(moraleAttackPenalty(s, u)).toBe(0);
  retreatMorale(s, u, route);
  expect(moraleAttackPenalty(s, u)).toBe(1);
  expect(p.operations).toBe(3);
  expect(u.x).toBe(8);
  expect(s.zones.threshold.triggered).toBe(false);
});
it.each([['dwarf_khazad_dum','passage-ward'],['elf_sindar','song-lure']]as const)('traded %s device preserves ordinary hesitation without becoming Namo declared threshold', (profile,key)=>{
 const{s,p,u}=fixture('namo'),q=finalProduction(profile,key)!;if(q.kind!=='item')throw Error('Item recipe required');
 const id=`traded:${key}`;s.items[id]={id,name:q.recipe.name,owner:'p1',bearer:u.id,crafted:true,...q.item,finalProduct:key,x:u.x,y:u.y};u.inventory.push(id);
 deployFinalDevice(s,'p1',u.id,id,{x:u.x,y:u.y});
 const route=[{x:8,y:8},{x:7,y:8}];retreatMorale(s,u,route);
 expect(moraleAttackPenalty(s,u)).toBe(1);expect(s.units[p.hero.id].effects.some(e=>e.kind==='shelter-threshold-used')).toBe(false);
 const enemy=s.units['p2:company:0'];s.players.p2.relations.p1='war';s.players.p1.relations.p2='war';
 const crossing=[{x:7,y:8},{x:8,y:8}];expect(movementZonePenalty(s,enemy,crossing)).toBe(1);crossZones(s,enemy,crossing);expect(s.zones[`device:${id}`].triggered).toBe(true);expect(movementZonePenalty(s,enemy,crossing)).toBe(0);
});
it("Gandalf orderly protection ends when he cannot remain conscious and nearby", () => {
  const { s, p, u } = fixture("istari_gandalf");
  u.effects.push({
    kind: "orderly-fallback",
    value: 1,
    until: s.revision + 2,
    source: `morale:${s.turn}`,
  });
  s.units[p.hero.id].active = false;
  refreshOrderlyFallback(s, u);
  expect(u.effects.some((e) => e.kind === "orderly-fallback")).toBe(false);
  expect(u.effects.some((e) => e.kind === "rout")).toBe(true);
});
it("ordinary pressure preserves external fear identity and expiry through encounter cleanup", () => {
  const { s, u } = fixture();
  const external = {
    kind: "fear",
    value: 2,
    source: "spell:enemy",
    until: s.revision + 3,
  };
  u.effects.push({ ...external });
  damageMorale(s, u, 25);
  expect(u.effects.find((e) => e.source === external.source)).toEqual(external);
  finishMoraleEncounter(s);
  expect(u.effects).toContainEqual(external);
});
it("verified signal reduces an actual strongest coordination effect without replacing its expiry", () => {
  const { s, u } = fixture("manwe");
  u.effects.push({
    kind: "cohesion-loss",
    value: 2,
    source: "landing:test",
    until: s.revision + 3,
  });
  verifiedOrderMorale(s, u);
  expect(u.effects.find((e) => e.source === "landing:test")).toEqual({
    kind: "cohesion-loss",
    value: 1,
    source: "landing:test",
    until: s.revision + 3,
  });
  finishMoraleEncounter(s);
  expect(moraleAttackPenalty(s, u)).toBe(1);
});
it('measured rearguard restores facing after one orderly retreat, never grants actions or removes rout',()=>{
 const {s,p,u}=fixture('elf_fingolfin');const ops=p.operations,origin={x:u.x,y:u.y};u.x++;
 retreatMorale(s,u,[origin,{x:u.x,y:u.y}]);expect(u.effects.some(e=>e.kind==='facing-unready')).toBe(false);expect(p.operations).toBe(ops);expect(s.units[p.hero.id].effects.some(e=>e.kind==='measured-rearguard-used')).toBe(true);
 retreatMorale(s,u,[origin,{x:u.x,y:u.y}]);expect(u.effects.some(e=>e.kind==='facing-unready')).toBe(true);
 const next=fixture('elf_fingolfin');next.u.effects.push({kind:'rout',value:1,until:999,source:'test'});next.u.x++;retreatMorale(next.s,next.u,[{x:8,y:8},{x:9,y:8}]);expect(next.u.effects.some(e=>e.kind==='facing-unready')).toBe(true);expect(next.u.effects.some(e=>e.kind==='rout')).toBe(true);
});
