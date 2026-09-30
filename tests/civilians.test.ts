import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  settleCivilianLosses,
  initializeHouseholds,
  civilianReason,
  applyCivilian,
  progressCivilians,
  validateCivilianState,
  type CivilianState,
  type CivilianChecks,
} from "../src/simulation/civilians";
function setup(profile = "hobbit_shire") {
  const s = createMatch([profile, profile === "human_gondor" ? "human_rohan" : "human_gondor"], 17) as CivilianState;
  s.households = {};
  s.civilianJobs = {};
  s.civilianConsents = {};
  const p = s.players.p1,
    worker = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  worker.x = 4;
  worker.y = 4;
  worker.move = 4;
  worker.active = true;
  worker.supplied = true;
  s.units[p.hero.id] = {
    ...structuredClone(worker),
    id: p.hero.id,
    kind: "hero",
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.stock.P = 100;
  s.facilities["p1:core"].x = 4;
  s.facilities["p1:core"].y = 4;
  s.facilities.ref = {
    ...s.facilities["p1:core"],
    id: "ref",
    kind: "refuge",
    x: 6,
    y: 4,
  };
  s.households.home = {
    id: "home",
    owner: "p1",
    home: "p1:core",
    population: 12,
    provisions: 0,
    willing: true,
    x: 4,
    y: 4,
  };
  const checks: CivilianChecks = {
    route: () => true,
    busy: () => false,
    connected: () => true,
    cost: (_s, _u, r) => r.length - 1,
  };
  const route = [
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 },
  ];
  return { s, p, worker, checks, route };
}
it("deposits existing P and transports without creating population or stocks", () => {
  const { s, p, worker, checks, route } = setup();
  applyCivilian(
    s,
    "p1",
    { mode: "deposit", household: "home", amount: 10, unit: worker.id },
    checks,
  );
  expect(p.stock.P).toBe(90);
  applyCivilian(
    s,
    "p1",
    {
      mode: "stores",
      household: "home",
      carrier: worker.id,
      destination: "ref",
      route,
      amount: 10,
      method: "hobbit",
    },
    checks,
  );
  expect(p.stock.P).toBe(88);
  expect(s.households.home.provisions).toBe(0);
  expect(p.hero.readiness).toBe(3);
  progressCivilians(s, checks);
  expect(Object.values(s.civilianJobs)[0].phase).toBe("arrived");
  expect(
    Object.values(s.households).reduce((n, h) => n + h.provisions, 0),
  ).toBe(10);
  expect(
    Object.values(s.households).reduce((n, h) => n + h.population, 0),
  ).toBe(12);
  progressCivilians(s, checks);
  expect(
    Object.values(s.households).reduce((n, h) => n + h.provisions, 0),
  ).toBe(10);
  validateCivilianState(s);
});
it("Nessa substitutes the stable only and pays normal rations for one existing group", () => {
  const { s, p, worker, checks, route } = setup("nessa");
  const a = {
    mode: "people" as const,
    household: "home",
    carrier: worker.id,
    destination: "ref",
    route,
    method: "nessa" as const,
  };
  expect(civilianReason(s, "p1", { ...a, method: "ordinary" }, checks)).toMatch(
    /stable/,
  );
  applyCivilian(s, "p1", a, checks);
  expect(p.stock.P).toBe(98);
  expect(s.households.home.population).toBe(0);
  progressCivilians(s, checks);
  expect(s.households.home.population).toBe(12);
  expect(s.households.home.home).toBe("ref");
});
it("requires explicit foreign refuge consent, even for allies", () => {
  const { s, worker, checks, route } = setup("nessa");
  s.facilities.ref.owner = "p2";
  s.players.p1.relations.p2 = "alliance";
  s.players.p2.relations.p1 = "alliance";
  const a = {
    mode: "people" as const,
    household: "home",
    carrier: worker.id,
    destination: "ref",
    route,
    method: "nessa" as const,
  };
  expect(civilianReason(s, "p1", a, checks)).toMatch(/consent/);
  applyCivilian(
    s,
    "p2",
    { mode: "consent", guest: "p1", refuge: "ref" },
    checks,
  );
  expect(civilianReason(s, "p1", a, checks)).toBe("");
});
it("carrier death strands finite cargo without refund or resurrection", () => {
  const { s, p, worker, checks, route } = setup();
  applyCivilian(
    s,
    "p1",
    { mode: "deposit", household: "home", amount: 10, unit: worker.id },
    checks,
  );
  applyCivilian(
    s,
    "p1",
    {
      mode: "stores",
      household: "home",
      carrier: worker.id,
      destination: "ref",
      route,
      amount: 10,
      method: "hobbit",
    },
    checks,
  );
  worker.alive = false;
  progressCivilians(s, checks);
  const j = Object.values(s.civilianJobs)[0];
  expect(j.phase).toBe("lost");
  expect(j.provisions).toBe(10);
  expect(p.stock.P).toBe(88);
  expect(j.x).toBe(4);
  validateCivilianState(s);
});
it("rejects over-capacity stores, unwilling households, blocked routes and forged cargo", () => {
  const { s, worker, checks, route } = setup();
  s.households.home.provisions = 20;
  const a = {
    mode: "stores" as const,
    household: "home",
    carrier: worker.id,
    destination: "ref",
    route,
    amount: 11,
    method: "hobbit" as const,
  };
  expect(civilianReason(s, "p1", a, checks)).toMatch(/10/);
  s.households.home.willing = false;
  expect(civilianReason(s, "p1", { ...a, amount: 10 }, checks)).toMatch(
    /willing/,
  );
  s.households.home.willing = true;
  expect(
    civilianReason(
      s,
      "p1",
      { ...a, amount: 10 },
      { ...checks, route: () => false },
    ),
  ).toMatch(/route/);
  applyCivilian(s, "p1", { ...a, amount: 10 }, checks);
  Object.values(s.civilianJobs)[0].provisions = 21;
  expect(() => validateCivilianState(s)).toThrow();
});
it("requires physical deposit/withdraw presence and preserves exact store accounting", () => {
  const { s, p, worker, checks } = setup();
  worker.x = 3;
  expect(
    civilianReason(
      s,
      "p1",
      { mode: "deposit", household: "home", amount: 10, unit: worker.id },
      checks,
    ),
  ).toMatch(/Local/);
  worker.x = 4;
  applyCivilian(
    s,
    "p1",
    { mode: "deposit", household: "home", amount: 10, unit: worker.id },
    checks,
  );
  applyCivilian(
    s,
    "p1",
    { mode: "withdraw", household: "home", amount: 4, unit: worker.id },
    checks,
  );
  expect(p.stock.P).toBe(94);
  expect(s.households.home.provisions).toBe(6);
});
it("pauses at revoked destination consent and recovers lost cargo once with the same ID", () => {
  const { s, p, worker, checks, route } = setup();
  applyCivilian(
    s,
    "p1",
    { mode: "deposit", household: "home", amount: 10, unit: worker.id },
    checks,
  );
  const id = applyCivilian(
    s,
    "p1",
    {
      mode: "stores",
      household: "home",
      carrier: worker.id,
      destination: "ref",
      route,
      amount: 10,
      method: "hobbit",
    },
    checks,
  );
  s.facilities.ref.workers = 0;
  progressCivilians(s, checks);
  expect(s.civilianJobs[id].index).toBe(0);
  s.facilities.ref.workers = 1;
  worker.alive = false;
  progressCivilians(s, checks);
  const replacement = {
    ...structuredClone(worker),
    id: "replacement",
    alive: true,
  };
  s.units[replacement.id] = replacement;
  applyCivilian(
    s,
    "p1",
    { mode: "recover", job: id, carrier: replacement.id, route },
    checks,
  );
  expect(Object.keys(s.civilianJobs)).toEqual([id]);
  expect(p.stock.P).toBe(86);
  progressCivilians(s, checks);
  expect(
    civilianReason(
      s,
      "p1",
      { mode: "recover", job: id, carrier: replacement.id, route },
      checks,
    ),
  ).toMatch(/lost/);
  expect(
    Object.values(s.households).reduce((n, h) => n + h.provisions, 0),
  ).toBe(10);
});
it("cannot carry household stores for free by moving its population identity", () => {
  const { s, worker, checks, route } = setup("nessa");
  s.households.home.provisions = 10;
  expect(
    civilianReason(
      s,
      "p1",
      {
        mode: "people",
        household: "home",
        carrier: worker.id,
        destination: "ref",
        route,
        method: "nessa",
      },
      checks,
    ),
  ).toMatch(/Withdraw/);
});

it("authors finite zero-stock civilian households without inventing creature families", () => {
  for (const id of [
    "nessa",
    "hobbit_shire",
    "human_gondor",
    "wolf_pack",
    "eagle_eyrie",
    "spider_brood",
    "ent_grove",
  ]) {
    const { s } = setup(id);
    s.households = {};
    initializeHouseholds(s);
    initializeHouseholds(s);
    const h = s.households["household:p1"];
    if (["nessa", "hobbit_shire", "human_gondor"].includes(id)) {
      expect(h.population).toBe(12);
      expect(h.provisions).toBe(0);
    } else expect(h).toBeUndefined();
  }
});

it('cannot refill an origin household while its identity is in transit',()=>{
 const {s,worker,checks,route}=setup('nessa');applyCivilian(s,'p1',{mode:'people',household:'home',carrier:worker.id,destination:'ref',route,method:'nessa'},checks);const helper={...structuredClone(worker),id:'helper'};s.units.helper=helper;expect(civilianReason(s,'p1',{mode:'deposit',household:'home',amount:10,unit:'helper'},checks)).toMatch(/reserved/);
});
it('invalidates consent on refuge capture so legitimate checkpoints remain serializable',()=>{
 const {s,checks}=setup('nessa');s.facilities.ref.owner='p2';s.players.p1.relations.p2='alliance';s.players.p2.relations.p1='alliance';applyCivilian(s,'p2',{mode:'consent',guest:'p1',refuge:'ref'},checks);s.facilities.ref.owner='p1';settleCivilianLosses(s);expect(Object.keys(s.civilianConsents)).toHaveLength(0);expect(()=>validateCivilianState(s)).not.toThrow();
});
