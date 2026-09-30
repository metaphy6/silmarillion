import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { spawnVessel } from "../src/simulation/naval";
import {
  startLogistics,
  logisticsReason,
  progressLogistics,
  type LogisticsState,
} from "../src/simulation/logistics-support";
function setup(profile = "human_numenor") {
  const s = createMatch([profile, "human_rohan"], 17) as LogisticsState;
  s.logisticsJobs = {};
  const p = s.players.p1,
    f = s.facilities["p1:core"];
  f.kind = "harbor";
  f.x = 4;
  f.y = 4;
  s.map.terrain[5 * s.map.width + 4] = "water";
  s.map.terrain[5 * s.map.width + 5] = "water";
  const worker = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  worker.x = 4;
  worker.y = 4;
  s.units[p.hero.id] = {
    ...structuredClone(worker),
    id: p.hero.id,
    kind: "hero",
    flying: profile === "eagle_eyrie",
    landed: false,
    move: 4,
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.stock = { P: 500, M: 500, K: 500, E: 500 };
  return { s, p, f, worker, h: s.units[p.hero.id] };
}
const path = (
  _s: LogisticsState,
  a: { x: number; y: number },
  b: { x: number; y: number },
) => {
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
it("Numenor moves the same finite cargo between at most3 hulls after normal handling, skips only organization", () => {
  const { s, p, f, worker } = setup();
  const v = spawnVessel(s, "p1", f.id, worker.id, { x: 4, y: 5 }),
    crew = { ...structuredClone(worker), id: "crew2", x: 4, y: 4 };
  s.units[crew.id] = crew;
  const other = spawnVessel(s, "p1", f.id, crew.id, { x: 4, y: 5 });
  v.cargo = { P: 10, M: 3, K: 0, E: 0 };
  const a = {
    mode: "redistribute" as const,
    method: "power" as const,
    harbor: f.id,
    loads: [
      { ship: v.id, cargo: { P: 0, M: 0, K: 0, E: 0 }, passenger: null },
      { ship: other.id, cargo: { P: 10, M: 3, K: 0, E: 0 }, passenger: null },
    ],
  };
  startLogistics(s, "p1", a, path);
  expect(v.cargo.P).toBe(10);
  expect(p.stock.P).toBe(495);
  progressLogistics(s, path);
  expect(v.cargo.P).toBe(0);
  expect(other.cargo.P).toBe(10);
  expect(Object.keys(s.logisticsJobs)).toHaveLength(0);
});
it("rejects cargo creation, oversized hulls, and changed receiving capacities", () => {
  const { s, f, worker } = setup();
  const v = spawnVessel(s, "p1", f.id, worker.id, { x: 4, y: 5 }),
    crew = { ...structuredClone(worker), id: "crew2", x: 4, y: 4 };
  s.units[crew.id] = crew;
  const other = spawnVessel(s, "p1", f.id, crew.id, { x: 4, y: 5 });
  const a = {
    mode: "redistribute" as const,
    method: "ordinary" as const,
    harbor: f.id,
    loads: [
      { ship: v.id, cargo: { P: 1, M: 0, K: 0, E: 0 }, passenger: null },
      { ship: other.id, cargo: { P: 0, M: 0, K: 0, E: 0 }, passenger: null },
    ],
  };
  expect(logisticsReason(s, "p1", a, path)).toMatch(/conserv/);
});
it("Eagle carries one existing light worker along actual flight over two phases without free movement", () => {
  const { s, p, worker, h } = setup("eagle_eyrie");
  h.x = 3;
  h.y = 3;
  worker.x = 3;
  worker.y = 3;
  const a = { mode: "lift" as const, unit: worker.id, to: { x: 7, y: 3 } };
  startLogistics(s, "p1", a, path);
  expect(p.hero.readiness).toBe(4);
  progressLogistics(s, path);
  expect(h.x).toBe(5);
  expect(worker.x).toBe(5);
  progressLogistics(s, path);
  expect(h.x).toBe(5);
  s.revision++;
  progressLogistics(s, path);
  expect(h.x).toBe(7);
  expect(worker.x).toBe(7);
  expect(Object.keys(s.logisticsJobs)).toHaveLength(0);
});
it("Eagle excludes heroes, great creatures and movement beyond the actual budget", () => {
  const { s, worker, h } = setup("eagle_eyrie");
  h.x = 3;
  h.y = 3;
  worker.x = 3;
  worker.y = 3;
  worker.kind = "dragon";
  expect(
    logisticsReason(
      s,
      "p1",
      { mode: "lift", unit: worker.id, to: { x: 4, y: 3 } },
      path,
    ),
  ).toMatch(/light/);
  worker.kind = "worker";
  expect(
    logisticsReason(
      s,
      "p1",
      { mode: "lift", unit: worker.id, to: { x: 9, y: 3 } },
      path,
    ),
  ).toMatch(/movement/);
});
it("ordinary transfer retains its extra organization step and power never bypasses actual handling", () => {
  const { s, f, worker } = setup();
  const v = spawnVessel(s, "p1", f.id, worker.id, { x: 4, y: 5 });
  const crew = { ...structuredClone(worker), id: "organizer", x: 4, y: 4 };
  s.units[crew.id] = crew;
  const other = spawnVessel(s, "p1", f.id, crew.id, { x: 4, y: 5 });
  v.cargo.P = 3;
  startLogistics(
    s,
    "p1",
    {
      mode: "redistribute",
      method: "ordinary",
      harbor: f.id,
      loads: [
        { ship: v.id, cargo: { P: 0, M: 0, K: 0, E: 0 }, passenger: null },
        { ship: other.id, cargo: { P: 3, M: 0, K: 0, E: 0 }, passenger: null },
      ],
    },
    path,
  );
  progressLogistics(s, path);
  expect(v.cargo.P).toBe(3);
  s.turn++;
  progressLogistics(s, path);
  expect(other.cargo.P).toBe(3);
});
it("explicit provisional light class admits only the configured company identities", async () => {
  const { transportClassFor } =
    await import("../src/simulation/logistics-support");
  expect(transportClassFor("elf_nandor", "company")).toBe("light");
  expect(transportClassFor("human_rohan", "company")).toBe("standard");
  expect(transportClassFor("hobbit_shire", "dragon")).toBe("large");
  const { s, worker, h } = setup("eagle_eyrie");
  h.x = 3;
  h.y = 3;
  worker.x = 3;
  worker.y = 3;
  worker.kind = "company";
  (worker as typeof worker & { loadClass?: string }).loadClass = "light";
  expect(
    logisticsReason(
      s,
      "p1",
      { mode: "lift", unit: worker.id, to: { x: 4, y: 3 } },
      path,
    ),
  ).toBe("");
});
it("contested Eagle destination pauses both existing identities without granting movement", () => {
  const { s, worker, h } = setup("eagle_eyrie");
  h.x = 3;
  h.y = 3;
  worker.x = 3;
  worker.y = 3;
  startLogistics(
    s,
    "p1",
    { mode: "lift", unit: worker.id, to: { x: 7, y: 3 } },
    path,
  );
  progressLogistics(s, path);
  s.revision++;
  const enemy = s.units["p2:company:0"];
  enemy.x = 7;
  enemy.y = 3;
  progressLogistics(s, path);
  expect(h.x).toBe(5);
  expect(worker.x).toBe(5);
});
it("carrier death releases recreated hero and a new physical pickup can recover the same stranded identity", async () => {
  const { logisticsUnitBusy } =
    await import("../src/simulation/logistics-support");
  const { s, worker, h } = setup("eagle_eyrie");
  h.x = 3;
  h.y = 3;
  worker.x = 3;
  worker.y = 3;
  startLogistics(
    s,
    "p1",
    { mode: "lift", unit: worker.id, to: { x: 7, y: 3 } },
    path,
  );
  progressLogistics(s, path);
  h.alive = false;
  s.revision++;
  progressLogistics(s, path);
  expect(logisticsUnitBusy(s, h.id)).toBe(false);
  expect(logisticsUnitBusy(s, worker.id)).toBe(true);
  h.alive = true;
  startLogistics(
    s,
    "p1",
    { mode: "lift", unit: worker.id, to: { x: 7, y: 3 } },
    path,
  );
  expect(Object.keys(s.logisticsJobs)).toHaveLength(1);
  expect(worker.x).toBe(5);
});
