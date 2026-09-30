import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  spawnVessel,
  startNavalOrder,
  navalOrderReason,
  progressVessels,
  damageVessel,
  validateVesselState,
} from "../src/simulation/naval";
function setup() {
  const s = createMatch(["elf_falmari", "human_rohan"], 12),
    p = s.players.p1,
    harbor = s.facilities["p1:core"];
  harbor.kind = "harbor";
  harbor.x = 4;
  harbor.y = 4;
  for (let x = 4; x <= 9; x++) s.map.terrain[5 * s.map.width + x] = "water";
  s.map.terrain[4 * s.map.width + 7] = "plain";
  const crew = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  crew.x = 4;
  crew.y = 4;
  const company = s.units["p1:company:0"];
  company.x = 4;
  company.y = 4;
  p.stock = { P: 500, M: 500, K: 500, E: 500 };
  const ship = spawnVessel(s, "p1", harbor.id, crew.id, { x: 4, y: 5 });
  return { s, p, ship, company, harbor };
}
it("embarks existing company, sails water by budget, disembarks after normal handling", () => {
  const { s, ship, company } = setup();
  startNavalOrder(s, "p1", { kind: "embark", ship: ship.id, unit: company.id });
  progressVessels(s);
  expect(ship.passenger).toBe(company.id);
  s.turn++;
  startNavalOrder(s, "p1", {
    kind: "sail",
    ship: ship.id,
    route: [
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
    ],
  });
  progressVessels(s);
  expect(ship.x).toBe(7);
  expect(company.x).toBe(7);
  s.turn++;
  startNavalOrder(s, "p1", {
    kind: "disembark",
    ship: ship.id,
    unit: company.id,
    landing: { x: 7, y: 4 },
  });
  expect(company.y).toBe(5);
  progressVessels(s);
  expect(company.y).toBe(4);
  expect(ship.passenger).toBeNull();
});
it("escrows only existing four stocks and returns unloaded cargo once minus actual upkeep", () => {
  const { s, p, ship } = setup();
  startNavalOrder(s, "p1", {
    kind: "load-cargo",
    ship: ship.id,
    cargo: { P: 5, M: 4, K: 3, E: 2 },
  });
  expect(p.stock.P).toBe(495);
  progressVessels(s);
  expect(ship.cargo).toEqual({ P: 5, M: 4, K: 3, E: 2 });
  s.turn++;
  startNavalOrder(s, "p1", {
    kind: "unload-cargo",
    ship: ship.id,
    cargo: { P: 5, M: 4, K: 3, E: 2 },
  });
  progressVessels(s);
  expect(ship.cargo.P).toBe(0);
  expect(p.stock.P).toBe(496);
  progressVessels(s);
  expect(p.stock.P).toBe(496);
});
it("rejects excess loads, nonwater routes, foreign passengers and extra occupied slots", () => {
  const { s, ship, company } = setup();
  expect(
    navalOrderReason(s, "p1", {
      kind: "load-cargo",
      ship: ship.id,
      cargo: { P: 21, M: 0, K: 0, E: 0 },
    }),
  ).toMatch(/capacity/);
  expect(
    navalOrderReason(s, "p1", {
      kind: "sail",
      ship: ship.id,
      route: [
        { x: 4, y: 5 },
        { x: 4, y: 4 },
      ],
    }),
  ).toMatch(/water/);
  company.owner = "p2";
  expect(
    navalOrderReason(s, "p1", {
      kind: "embark",
      ship: ship.id,
      unit: company.id,
    }),
  ).toMatch(/own/);
});
it("wreck preserves living stranded passengers and cargo, with no refunds", () => {
  const { s, p, ship, company } = setup();
  startNavalOrder(s, "p1", { kind: "embark", ship: ship.id, unit: company.id });
  progressVessels(s);
  ship.cargo.P = 3;
  const stock = structuredClone(p.stock);
  damageVessel(s, ship.id, 999);
  expect(ship.phase).toBe("wreck");
  expect(company.alive).toBe(true);
  expect(ship.passenger).toBe(company.id);
  expect(ship.cargo.P).toBe(3);
  expect(p.stock).toEqual(stock);
  expect(() => validateVesselState(s, ship)).not.toThrow();
});
it("fog delays once per voyage and waves damage the actual hull", () => {
  const { s, ship } = setup();
  s.seaHazards["5,5"] = { wave: 1, fog: true, handling: 0 };
  startNavalOrder(s, "p1", {
    kind: "sail",
    ship: ship.id,
    route: [
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
    ],
  });
  progressVessels(s);
  expect(ship.x).toBe(4);
  s.turn++;
  progressVessels(s);
  expect(ship.x).toBe(6);
  expect(ship.hp).toBe(78);
});
it("rescues an existing wreck passenger into an adjacent real vessel without copying identity", () => {
  const { s, ship, company, harbor } = setup();
  startNavalOrder(s, "p1", { kind: "embark", ship: ship.id, unit: company.id });
  progressVessels(s);
  damageVessel(s, ship.id, 99);
  const extra = {
    ...structuredClone(s.units[ship.crew]),
    id: "crew:rescue",
    x: harbor.x,
    y: harbor.y,
  };
  s.units[extra.id] = extra;
  const rescue = spawnVessel(s, "p1", harbor.id, extra.id, { x: 4, y: 5 });
  startNavalOrder(s, "p1", { kind: "prepare-rescue-rig", ship: rescue.id });
  startNavalOrder(s, "p1", {
    kind: "rescue-passenger",
    ship: rescue.id,
    unit: company.id,
  });
  expect(ship.passenger).toBeNull();
  expect(rescue.passenger).toBe(company.id);
  expect(
    Object.values(s.units).filter((u) => u.id === company.id),
  ).toHaveLength(1);
});
it("funded hull repair takes two real weekly steps and malformed save repair is rejected", () => {
  const { s, p, ship } = setup();
  damageVessel(s, ship.id, 40);
  startNavalOrder(s, "p1", { kind: "repair-ship", ship: ship.id });
  expect(p.stock.M).toBe(480);
  expect(p.stock.K).toBe(495);
  progressVessels(s);
  expect(ship.hp).toBe(40);
  expect(ship.repair?.remaining).toBe(1);
  expect(() => validateVesselState(s, ship)).not.toThrow();
  s.turn++;
  progressVessels(s);
  expect(ship.hp).toBe(60);
  expect(ship.repair).toBeUndefined();
  ship.repair = {
    remaining: 0,
    started: s.turn,
    accelerated: false,
    cost: { P: 0, M: 0, K: 0, E: 0 },
  };
  expect(() => validateVesselState(s, ship)).toThrow(/repair/i);
});
it("rescues finite stranded wreck crew into the ordinary slot and releases historical occupancy", async () => {
  const { isAboard, isNavalCrew } = await import("../src/simulation/naval");
  const { s, ship, harbor } = setup(),
    worker = s.units[ship.crew];
  damageVessel(s, ship.id, 999);
  expect(isNavalCrew(s, worker.id)).toBe(false);
  expect(isAboard(s, worker.id)).toBe(true);
  const replacement = {
    ...structuredClone(worker),
    id: "replacement",
    x: harbor.x,
    y: harbor.y,
  };
  s.units[replacement.id] = replacement;
  const rescue = spawnVessel(s, "p1", harbor.id, replacement.id, {
    x: 4,
    y: 5,
  });
  startNavalOrder(s, "p1", { kind: "prepare-rescue-rig", ship: rescue.id });
  startNavalOrder(s, "p1", {
    kind: "rescue-passenger",
    ship: rescue.id,
    unit: worker.id,
  });
  expect(ship.crewRescued).toBe(true);
  expect(rescue.passenger).toBe(worker.id);
  expect(() => validateVesselState(s, ship)).not.toThrow();
  expect(() => validateVesselState(s, rescue)).not.toThrow();
  progressVessels(s);
  s.turn++;
  progressVessels(s);
  s.turn++;
  startNavalOrder(s, "p1", {
    kind: "disembark",
    ship: rescue.id,
    unit: worker.id,
    landing: { x: 4, y: 4 },
  });
  progressVessels(s);
  expect(isAboard(s, worker.id)).toBe(false);
  expect(worker.y).toBe(4);
  expect(() => validateVesselState(s, ship)).not.toThrow();
});
it("rejects forged unload quantities and duplicate occupancy", () => {
  const { s, ship, company } = setup();
  ship.phase = "unloading";
  ship.handlingRemaining = 1;
  ship.handling = { kind: "unload", cargo: { P: 10, M: 0, K: 0, E: 0 } };
  expect(() => validateVesselState(s, ship)).toThrow(/cargo/);
  delete ship.handling;
  ship.phase = "idle";
  ship.handlingRemaining = 0;
  ship.passenger = company.id;
  company.x = ship.x;
  company.y = ship.y;
  const duplicate = { ...structuredClone(ship), id: "duplicate" };
  s.vessels[duplicate.id] = duplicate;
  expect(() => validateVesselState(s, ship)).toThrow(/Duplicate/);
});
it("water BFS returns independent routes and invalidates cache on terrain change", async () => {
  const { navalRoute } = await import("../src/simulation/naval");
  const { s, ship } = setup();
  const route = navalRoute(s, ship, { x: 7, y: 5 })!;
  expect(route).toHaveLength(4);
  route[0].x = 99;
  expect(navalRoute(s, ship, { x: 7, y: 5 })![0].x).toBe(4);
  s.map.terrain[5 * s.map.width + 5] = "plain";
  expect(navalRoute(s, ship, { x: 7, y: 5 })).toBeNull();
});
