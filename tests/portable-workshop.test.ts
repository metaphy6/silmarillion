import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { recipe } from "../src/content/catalog";
import {
  applyPortable,
  portableReason,
  progressPortableWorkshops,
  settlePortableLosses,
  applyPortableWear,
  validatePortableState,
  type PortableState,
  type PortableChecks,
} from "../src/simulation/portable-workshop";
function setup() {
  const s = createMatch(["elf_avari", "human_gondor"], 17) as PortableState;
  s.portableWorkshops = {};
  s.portableConsents = {};
  const p = s.players.p1,
    w = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  Object.assign(w, { x: 4, y: 4, move: 4, active: true, supplied: true });
  s.units[p.hero.id] = { ...structuredClone(w), id: p.hero.id, kind: "hero" };
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.stock.P = 100;
  Object.assign(s.facilities["p1:core"], { x: 4, y: 4 });
  s.facilities.dest = { ...s.facilities["p1:core"], id: "dest", x: 7 };
  s.facilities.work = {
    ...s.facilities["p1:core"],
    id: "work",
    kind: "portable-workshop",
    workers: 2,
    job: {
      id: "paid",
      recipe: "equipment",
      remaining: 2,
      started: s.turn,
      cost: recipe("elf_avari", "equipment")!.cost,
      supply: 0,
      great: 0,
      binding: 0,
    },
  };
  const c: PortableChecks = {
    route: () => true,
    busy: () => false,
    connected: () => true,
    cost: (_s, _u, r) => r.length - 1,
  };
  for (const settlement of ["p1:core", "dest"])
    applyPortable(s, "p1", { mode: "consent", settlement, willing: true }, c);
  const a = {
    mode: "relocate" as const,
    workshop: "work",
    origin: "p1:core",
    destination: "dest",
    carrier: w.id,
    route: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
    ],
  };
  return { s, p, w, c, a };
}
it("escrows and delivers same paid queue, facility and workers without production or refunds", () => {
  const { s, p, c, a } = setup(),
    f = s.facilities.work;
  const id = applyPortable(s, "p1", a, c);
  expect(s.facilities.work).toBeUndefined();
  expect(s.portableWorkshops[id].workshop).toBe(f);
  expect(p.stock.P).toBe(94);
  expect(p.hero.readiness).toBe(3);
  progressPortableWorkshops(s, c);
  expect(s.facilities.work).toBe(f);
  expect(f.job?.remaining).toBe(2);
  expect(f.workers).toBe(2);
  expect(f.x).toBe(6);
  validatePortableState(s);
});
it('rejects unknown relocation carriers normally even when another physical heavy load exists',()=>{
 const{s,c,a,w}=setup();s.items.load={id:'load',name:'Heavy plate',owner:'p1',bearer:w.id,crafted:true,heavy:true,carried:true,bonus:0,durability:100,maxDurability:100,materials:['metal'],x:w.x,y:w.y};
 expect(()=>portableReason(s,'p1',{...a,carrier:'missing'},c)).not.toThrow();expect(portableReason(s,'p1',{...a,carrier:'missing'},c)).toMatch(/carrier/);
});
it('validates finite stranded escrow without consulting an absent former carrier or its unrelated new cargo',()=>{
 const{s,c,a,w}=setup(),id=applyPortable(s,'p1',a,c);s.portableWorkshops[id].phase='lost';
 s.items.load={id:'load',name:'Heavy plate',owner:'p1',bearer:w.id,crafted:true,heavy:true,carried:true,bonus:0,durability:100,maxDurability:100,materials:['metal'],x:4,y:4};
 expect(()=>validatePortableState(s)).not.toThrow();
 s.items.load.bearer='other-worker';
 delete s.units[w.id];expect(()=>validatePortableState(s)).not.toThrow();expect(()=>validatePortableState(s,'p1')).not.toThrow();
 s.portableWorkshops[id].workshop!.workers=11;expect(()=>validatePortableState(s)).toThrow(/conservation/);
});
it("rejects nonportable facilities, unconsented destinations, excessive capacity and travel", () => {
  const { s, c, a } = setup();
  s.facilities.work.kind = "workshop";
  expect(portableReason(s, "p1", a, c)).toMatch(/portable/);
  s.facilities.work.kind = "portable-workshop";
  s.facilities.work.workers = 11;
  expect(portableReason(s, "p1", a, c)).toMatch(/capacity/);
  s.facilities.work.workers = 2;
  c.cost = () => 99;
  expect(portableReason(s, "p1", a, c)).toMatch(/week/);
  c.cost = () => 2;
  applyPortable(
    s,
    "p1",
    { mode: "consent", settlement: "dest", willing: false },
    c,
  );
  expect(portableReason(s, "p1", a, c)).toMatch(/consent/);
});
it("interception retains finite escrow and explicit recovery preserves its identity", () => {
  const { s, p, w, c, a } = setup(),
    id = applyPortable(s, "p1", a, c),
    f = s.portableWorkshops[id].workshop;
  w.alive = false;
  settlePortableLosses(s);
  expect(s.portableWorkshops[id].phase).toBe("lost");
  w.alive = true;
  applyPortable(
    s,
    "p1",
    {
      mode: "recover",
      job: id,
      destination: "dest",
      carrier: w.id,
      route: a.route,
    },
    c,
  );
  progressPortableWorkshops(s, c);
  expect(s.facilities.work).toBe(f);
  expect(p.stock.P).toBe(93);
  expect(() =>
    applyPortable(
      s,
      "p1",
      {
        mode: "recover",
        job: id,
        destination: "dest",
        carrier: w.id,
        route: a.route,
      },
      c,
    ),
  ).toThrow();
});
it("destination revocation strands escrow without output and permits recovery only after consent", () => {
  const { s, c, a } = setup(),
    id = applyPortable(s, "p1", a, c);
  applyPortable(
    s,
    "p1",
    { mode: "consent", settlement: "dest", willing: false },
    c,
  );
  progressPortableWorkshops(s, c);
  expect(s.portableWorkshops[id].phase).toBe("lost");
  expect(s.facilities.work).toBeUndefined();
  expect(s.portableWorkshops[id].workshop?.job?.remaining).toBe(2);
});
it("first rough-road event gets exactly 25 percent reduction only with hero present", () => {
  const { s, c, a, p } = setup(),
    id = applyPortable(s, "p1", a, c),
    f = s.portableWorkshops[id].workshop!,
    hp = f.hp;
  applyPortableWear(s, id, 4, "rough-road");
  expect(f.hp).toBe(hp - 3);
  applyPortableWear(s, id, 4, "rough-road");
  expect(f.hp).toBe(hp - 7);
  applyPortableWear(s, id, 4, "combat");
  expect(f.hp).toBe(hp - 11);
  s.turn++;
  s.units[p.hero.id].x++;
  applyPortableWear(s, id, 4, "rough-road");
  expect(f.hp).toBe(hp - 15);
});
it("rejects duplicate escrow identities and impossible routes in saves", () => {
  const { s, c, a } = setup(),
    id = applyPortable(s, "p1", a, c);
  s.facilities.work = structuredClone(s.portableWorkshops[id].workshop!);
  expect(() => validatePortableState(s)).toThrow();
  delete s.facilities.work;
  s.portableWorkshops[id].route[1].x = 20;
  expect(() => validatePortableState(s)).toThrow();
});
it("a missed first rough-road event cannot be claimed after hero arrives", () => {
  const { s, c, a, p } = setup(),
    id = applyPortable(s, "p1", a, c),
    h = s.units[p.hero.id],
    f = s.portableWorkshops[id].workshop!,
    hp = f.hp;
  h.x++;
  applyPortableWear(s, id, 4, "rough-road");
  h.x--;
  applyPortableWear(s, id, 4, "rough-road");
  expect(f.hp).toBe(hp - 8);
});
it("paid equipment crew travels with the same queue and cannot serve as its carrier", () => {
  const { s, c, a, w } = setup();
  s.facilities.work.job!.crew = w.id;
  expect(portableReason(s, "p1", a, c)).toMatch(/crew/);
  const crew = { ...structuredClone(w), id: "paid-crew" };
  s.units[crew.id] = crew;
  s.facilities.work.job!.crew = crew.id;
  const id = applyPortable(s, "p1", a, c);
  progressPortableWorkshops(s, c);
  expect(s.facilities.work.job?.crew).toBe(crew.id);
  expect(crew.x).toBe(6);
  expect(s.portableWorkshops[id].phase).toBe("arrived");
});
it("changed movement budget strands workshop with paid work intact", () => {
  const { s, c, a, w } = setup(),
    id = applyPortable(s, "p1", a, c);
  w.move = 1;
  progressPortableWorkshops(s, c);
  expect(s.portableWorkshops[id].phase).toBe("lost");
  expect(s.portableWorkshops[id].workshop?.job?.remaining).toBe(2);
  expect(w.x).toBe(4);
});
it("actual woodland transit applies provisional wear at the physical rough tile", () => {
  for (const present of [false, true]) {
    const { s, c, a, p } = setup();
    s.map.terrain.fill("meadow");
    s.map.terrain[4 * s.map.width + 5] = "woodland";
    s.units[p.hero.id].x = present ? 5 : 4;
    const hp = s.facilities.work.hp;
    applyPortable(s, "p1", a, c);
    progressPortableWorkshops(s, c);
    expect(s.facilities.work.hp).toBe(hp - (present ? 3 : 4));
  }
});
