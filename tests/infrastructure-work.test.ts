import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  startInfrastructureWork,
  infrastructurePowerReason,
  applyInfrastructurePower,
  progressInfrastructureWork,
  infrastructureBlocked,
  validateInfrastructureState,
  type InfrastructureState,
  type InfrastructureRoute,
} from "../src/simulation/infrastructure-work";
const route: InfrastructureRoute = (_s, a, b) => {
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
function setup(
  profile = "troll_hold",
  kind: "haulway" | "shaft" | "channel" | "wreck" = "haulway",
) {
  const s = createMatch([profile, "human_rohan"], 7) as InfrastructureState;
  s.infrastructureSites = {};
  s.infrastructureWork = {};
  const p = s.players.p1,
    core = s.facilities["p1:core"],
    worker = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  worker.x = core.x;
  worker.y = core.y;
  s.units[p.hero.id] = {
    ...structuredClone(worker),
    id: p.hero.id,
    kind: "hero",
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  p.stock = { P: 500, M: 500, K: 500, E: 500 };
  core.kind =
    kind === "wreck" ? "foundry" : kind === "channel" ? "harbor" : "workshop";
  s.infrastructureSites.site = {
    id: "site",
    owner: "p1",
    kind,
    x: worker.x,
    y: worker.y,
    blocked: kind !== "wreck",
    originalCapacity: 1,
    material: kind === "channel" ? "silt" : "stone",
    yield:
      kind === "wreck"
        ? { P: 1, M: 7, K: 2, E: 0 }
        : { P: 0, M: 0, K: 0, E: 0 },
    consumed: false,
  };
  return {
    s,
    p,
    worker,
    core,
    a: { site: "site", worker: worker.id, facility: core.id },
  };
}
it("Troll clears only an existing funded obstruction with exactcost and no salvage yield", () => {
  const { s, p, a, worker } = setup();
  const j = startInfrastructureWork(s, "p1", a, route);
  const before = structuredClone(p.stock);
  applyInfrastructurePower(s, "p1", j.id, route);
  expect(p.stock).toEqual({ ...before, P: before.P - 5, M: before.M - 5 });
  expect(infrastructureBlocked(s, worker, "land")).toBe(true);
  progressInfrastructureWork(s, route);
  expect(s.infrastructureSites.site.blocked).toBe(false);
  expect(p.stock).toEqual({ ...before, P: before.P - 5, M: before.M - 5 });
});
it("Khazad restores originalcapacity after one week but pauses without real crew", () => {
  const { s, p, a, worker } = setup("dwarf_khazad_dum", "shaft");
  const j = startInfrastructureWork(s, "p1", a, route);
  const m = p.stock.M;
  applyInfrastructurePower(s, "p1", j.id, route);
  expect(p.stock.M).toBe(m - 10);
  worker.active = false;
  progressInfrastructureWork(s, route);
  expect(s.infrastructureSites.site.blocked).toBe(true);
  worker.active = true;
  s.turn++;
  applyInfrastructurePower(s, "p1", j.id, route);
  progressInfrastructureWork(s, route);
  expect(s.infrastructureSites.site.blocked).toBe(false);
  expect(s.infrastructureSites.site.originalCapacity).toBe(1);
});
it("Orc advances only older salvage and finite wreck is consumed once with physical return", () => {
  const { s, p, a, core } = setup("orc_fortress_clan", "wreck");
  core.x += 4;
  const j = startInfrastructureWork(s, "p1", a, route);
  expect(infrastructurePowerReason(s, "p1", j.id, route)).toMatch(/older/);
  progressInfrastructureWork(s, route);
  s.turn++;
  applyInfrastructurePower(s, "p1", j.id, route);
  const before = structuredClone(p.stock);
  progressInfrastructureWork(s, route);
  expect(j.phase).toBe("haul");
  expect(p.stock).toEqual(before);
  expect(s.infrastructureSites.site.consumed).toBe(true);
  s.turn++;
  progressInfrastructureWork(s, route);
  s.turn++;
  progressInfrastructureWork(s, route);
  expect(p.stock.M).toBe(before.M + 7);
  expect(Object.keys(s.infrastructureWork)).toHaveLength(0);
  expect(() => startInfrastructureWork(s, "p1", a, route)).toThrow(/consumed/);
});
it("Osse advances funded channel work only while harborcrew and physicalroute remain", () => {
  const { s, a, core, p } = setup("osse", "channel");
  const j = startInfrastructureWork(s, "p1", a, route);
  core.workers = 0;
  expect(infrastructurePowerReason(s, "p1", j.id, route)).toMatch(/staff/);
  core.workers = 1;
  const m = p.stock.M;
  applyInfrastructurePower(s, "p1", j.id, route);
  progressInfrastructureWork(s, route);
  expect(p.stock.M).toBe(m - 20);
  expect(s.infrastructureSites.site.blocked).toBe(false);
  expect(() => validateInfrastructureState(s)).not.toThrow();
});
it("a dead or departed Troll cannot finish the work by prepared power", () => {
  const { s, p, a } = setup();
  const j = startInfrastructureWork(s, "p1", a, route);
  applyInfrastructurePower(s, "p1", j.id, route);
  s.units[p.hero.id].x += 2;
  progressInfrastructureWork(s, route);
  expect(s.infrastructureSites.site.blocked).toBe(true);
  expect(j.remaining).toBe(1);
});
it("lost salvage crew retains finite cargo without stocks or duplicate consumption; corrupted work is rejected", () => {
  const { s, p, a, worker, core } = setup("orc_fortress_clan", "wreck");
  core.x += 4;
  const j = startInfrastructureWork(s, "p1", a, route);
  progressInfrastructureWork(s, route);
  s.turn++;
  progressInfrastructureWork(s, route);
  const stock = structuredClone(p.stock);
  worker.alive = false;
  s.turn++;
  progressInfrastructureWork(s, route);
  expect(j.phase).toBe("lost");
  expect(j.cargo.M).toBe(7);
  expect(p.stock).toEqual(stock);
  expect(() => validateInfrastructureState(s)).not.toThrow();
  j.cargo.M++;
  expect(() => validateInfrastructureState(s)).toThrow(/infrastructure/);
});
