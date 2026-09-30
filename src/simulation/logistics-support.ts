import {hullStatistics} from '../content/naval-production';
import {secondaryCapabilities} from '../content/secondary-production';
import {fittingMovementPenalty} from "./equipment-service";
import { type Match, type Pos, type Stock, type Unit } from "./types";
import { effectiveRelation } from "./diplomacy";
import { movementPenalty } from "./conditions";
import { fatigueMovementPenalty } from "./fatigue";
import { activeEffects } from "./effects";
export type TransportClass = "light" | "standard" | "large";
/** Provisional carrying classes, not Tolkien lore or adopted mass values. */
export function transportClassFor(
  profile: string,
  kind: Unit["kind"],
): TransportClass {
  if (kind === "worker") return "light";
  if (
    kind === "company" &&
    ["elf_nandor", "elf_avari", "hobbit_shire"].includes(profile)
  )
    return "light";
  return [
    "construct",
    "beast",
    "drake",
    "dragon",
    "winged-dragon",
    "balrog",
  ].includes(kind)
    ? "large"
    : "standard";
}
export interface ShipLoad {
  ship: string;
  cargo: Stock;
  passenger: string | null;
}
export type LogisticsRequest =
  | {
      mode: "redistribute";
      method: "ordinary" | "power";
      harbor: string;
      loads: ShipLoad[];
    }
  | { mode: "lift"; unit: string; to: Pos }
  | { mode: "rescue-flight"; carrier: string; unit: string; to: Pos };
export type LogisticsJob =
  | {
      id: string;
      owner: string;
      kind: "ship-transfer";
      harbor: string;
      loads: ShipLoad[];
      before: ShipLoad[];
      remaining: number;
      createdTurn: number;
      lastProgress: number;
    }
  | {
      id: string;
      owner: string;
      kind: "eagle-lift";
      method?: "ordinary";
      hero: string;
      passenger: string;
      route: Pos[];
      index: number;
      phase: 0 | 1;
      status: "active" | "lost";
      createdTurn: number;
      createdRevision: number;
      lastProgress: number;
    };
export type LogisticsState = Match & {
  logisticsJobs: Record<string, LogisticsJob>;
};
export type LogisticsRoute = (
  s: LogisticsState,
  a: Pos,
  b: Pos,
  u?: Unit,
) => Pos[] | null;
const keys = ["P", "M", "K", "E"] as const;
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const validStock = (c: Stock) =>
  Object.keys(c).sort().join(",") === "E,K,M,P" &&
  keys.every((k) => Number.isSafeInteger(c[k]) && c[k] >= 0);
const bounded = (s: Match, p: Pos) =>
  Number.isInteger(p.x) &&
  Number.isInteger(p.y) &&
  p.x >= 0 &&
  p.y >= 0 &&
  p.x < s.map.width &&
  p.y < s.map.height;
const threatened = (s: Match, seat: string, pos: Pos) =>
  Object.values(s.units).some(
    (u) =>
      u.alive &&
      u.active &&
      effectiveRelation(s, seat, u.owner) === "war" &&
      distance(u, pos) <= 1,
  );
export function logisticsShipBusy(s: LogisticsState, id: string): boolean {
  return Object.values(s.logisticsJobs ?? {}).some(
    (j) => j.kind === "ship-transfer" && j.loads.some((l) => l.ship === id),
  );
}
export function logisticsUnitBusy(s: LogisticsState, id: string): boolean {
  return Object.values(s.logisticsJobs ?? {}).some(
    (j) =>
      (j.kind === "eagle-lift" &&
        ((j.status === "active" && j.hero === id) || j.passenger === id)) ||
      (j.kind === "ship-transfer" && j.before.some((l) => l.passenger === id)),
  );
}
function compatibleLoads(
  s: LogisticsState,
  seat: string,
  harbor: string,
  loads: ShipLoad[],
): string {
  const f = s.facilities[harbor];
  if (
    !f ||
    f.owner !== seat ||
    f.kind !== "harbor" ||
    f.hp <= 0 ||
    f.workers < 1
  )
    return "Owned staffed rendezvous harbor required";
  if (
    loads.length < 2 ||
    loads.length > 3 ||
    new Set(loads.map((l) => l.ship)).size !== loads.length
  )
    return "Two or three distinct own ships required";
  for (const l of loads) {
    const v = s.vessels[l.ship];
    if (
      !v ||
      v.owner !== seat ||
      v.hp <= 0 ||
      v.phase !== "idle" ||
      v.repair ||
      distance(v, f) > 1 ||
      !s.units[v.crew]?.alive ||
      !s.units[v.crew]?.supplied ||
      threatened(s, seat, v)
    )
      return "Existing own crewed idle ships at unblocked harbor required";
    if (!validStock(l.cargo)||keys.reduce((n,k)=>n+l.cargo[k],0)>(hullStatistics(s.players[v.owner].profile,v.hullClass)?.capacity??0)) return "Cargo exceeds this existing hull class capacity";
    if (l.passenger) {
      const u = s.units[l.passenger];
      if (!u?.alive || u.owner !== seat || u.kind !== "company")
        return "Only existing owned company escorts may be reassigned";
    }
  }
  const current = loads.map((l) => s.vessels[l.ship]);
  if (
    keys.some(
      (k) =>
        loads.reduce((n, l) => n + l.cargo[k], 0) !==
        current.reduce((n, v) => n + v.cargo[k], 0),
    )
  )
    return "Cargo conservation requires exactly the same existing stocks";
  const before = current
      .map((v) => v.passenger)
      .filter(Boolean)
      .sort(),
    after = loads
      .map((l) => l.passenger)
      .filter(Boolean)
      .sort();
  if (
    JSON.stringify(before) !== JSON.stringify(after) ||
    new Set(after).size !== after.length
  )
    return "Escort conservation requires the same existing company identities exactly once";
  return "";
}
export function logisticsReason(
  s: LogisticsState,
  seat: string,
  a: LogisticsRequest,
  route: LogisticsRoute,
): string {
  const p = s.players[seat],
    h = p && s.units[a.mode === "rescue-flight" ? a.carrier : p.hero.id];
  if (!p || p.eliminated) return "Active owner required";
  if (a.mode === "redistribute") {
    const reason = compatibleLoads(s, seat, a.harbor, a.loads);
    if (reason) return reason;
    if (a.loads.some((l) => logisticsShipBusy(s, l.ship)))
      return "A hull already has a handling assignment";
    if (a.method === "ordinary") return "";
    if (
      p.profile !== "human_numenor" ||
      p.hero.status !== "living" ||
      !h?.alive ||
      !h.active ||
      p.hero.readiness < 3 ||
      p.commitment < 1
    )
      return "Living Ocean Warden, 3 readiness and weekly commitment required";
    if (!route(s, h, s.facilities[a.harbor], h))
      return "Hero must share the connected rendezvous region";
    return p.stock.P >= 5 ? "" : "Handling crews require5P";
  }
  const u = s.units[a.unit];
  if(a.mode === "rescue-flight") {
    if(!h?.alive||!h.active||!h.supplied||h.owner!==seat||h.landed||!secondaryCapabilities(s,h)?.rescuePassengers||activeEffects(s,h).some(e=>["stunned","incapacitated","rout"].includes(e.kind)))return "Existing active supplied airborne Rescue Flight required";
    if(p.stock.P<2||p.operations<1)return "Ordinary rescue needs two Provisions and one operation";
    if(Object.values(s.convoys).some(q=>q.carrier===h.id&&q.phase!=="lost")||Object.values(s.vessels).some(q=>q.phase!=="wreck"&&(q.crew===h.id||q.passenger===h.id||q.aboardHero===h.id)))return "Rescue carrier already assigned";
  } else if (
    p.profile !== "eagle_eyrie" ||
    p.hero.status !== "living" ||
    !h?.alive ||
    !h.active ||
    !h.flying ||
    h.landed ||
    p.hero.readiness < 2 ||
    (p.commitment < 1 && !p.encounter)
  )
    return "Living flying Skywarden,2readiness and encounter commitment required";
  const load =
    (u as (Unit & { loadClass?: TransportClass }) | undefined)?.loadClass ??
    (u?.kind === "worker" ? "light" : "standard");
  if (
    !u?.alive ||
    !u.active ||
    u.kind === "hero" ||
    !["worker", "company"].includes(u.kind) ||
    load !== "light" || fittingMovementPenalty(s,u.id)>0 ||
    effectiveRelation(s, seat, u.owner) !== "alliance"
  )
    return "Willing own or mutually allied existing light nonhero required";
  const stranded = Object.values(s.logisticsJobs ?? {}).some(
    (j) =>
      j.kind === "eagle-lift" && j.status === "lost" && j.passenger === u.id,
  );
  if ((logisticsUnitBusy(s, u.id) && !stranded) || logisticsUnitBusy(s, h.id))
    return "Party already has a logistics assignment";
  if (distance(h, u) > 1) return "Pickup requires physical contact";
  if (
    !bounded(s, a.to) ||
    ["water", "cliff"].includes(s.map.terrain[a.to.y * s.map.width + a.to.x]) ||
    threatened(s, seat, a.to)
  )
    return "Safe dry viable landing required";
  const r = route(s, h, a.to, h),
    budget = Math.min(
      6,
      Math.max(
        1,
        h.move - movementPenalty(s, h) - fatigueMovementPenalty(s, h),
      ),
      ...activeEffects(s, h)
        .filter((e) => e.kind === "move-limit")
        .map((e) => e.value),
    );
  if (
    !r ||
    r.length < 2 ||
    r.length - 1 > budget ||
    activeEffects(s, h).some((e) => e.kind === "root")
  )
    return "Flight must fit actual normal movement and20metre maximum";
  return "";
}
export function startLogistics(
  s: LogisticsState,
  seat: string,
  a: LogisticsRequest,
  route: LogisticsRoute,
): LogisticsJob {
  const reason = logisticsReason(s, seat, a, route);
  if (reason) throw new Error(reason);
  s.logisticsJobs ??= {};
  const p = s.players[seat],
    id = `logistics:${s.nextId++}`;
  let job: LogisticsJob;
  if (a.mode === "redistribute") {
    job = {
      id,
      owner: seat,
      kind: "ship-transfer",
      harbor: a.harbor,
      loads: structuredClone(a.loads),
      before: a.loads.map((l) => {
        const v = s.vessels[l.ship];
        return { ship: v.id, cargo: { ...v.cargo }, passenger: v.passenger };
      }),
      remaining: a.method === "power" ? 1 : 2,
      createdTurn: s.turn,
      lastProgress: s.turn - 1,
    };
    if (a.method === "power") {
      p.stock.P -= 5;
      p.hero.readiness -= 3;
    }
  } else {
    const h = s.units[a.mode === "rescue-flight" ? a.carrier : p.hero.id];
    if(a.mode === "rescue-flight"){p.stock.P-=2;p.operations--;}else p.hero.readiness -= 2;
    for (const [oldId, old] of Object.entries(s.logisticsJobs))
      if (
        old.kind === "eagle-lift" &&
        old.status === "lost" &&
        old.passenger === a.unit
      )
        delete s.logisticsJobs[oldId];
    job = {
      id,
      owner: seat,
      kind: "eagle-lift",
      ...(a.mode === "rescue-flight" ? {method:"ordinary" as const} : {}),
      hero: h.id,
      passenger: a.unit,
      route: route(s, h, a.to, h)!.map((p) => ({ x: p.x, y: p.y })),
      index: 0,
      phase: 0,
      status: "active",
      createdTurn: s.turn,
      createdRevision: s.revision,
      lastProgress: s.revision - 1,
    };
  }
  s.logisticsJobs[id] = job;
  return job;
}
/** Call at every tactical resolution; transfer work advances once weekly only.
 * Caller may pass weekly=false to defer ship handling during response phases. */
export function progressLogistics(
  s: LogisticsState,
  route: LogisticsRoute,
  weekly = true,
): void {
  for (const j of Object.values(s.logisticsJobs ?? {}).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (j.kind === "ship-transfer") {
      if (!weekly || j.lastProgress >= s.turn) continue;
      j.lastProgress = s.turn;
      if (compatibleLoads(s, j.owner, j.harbor, j.loads)) continue;
      if (
        j.before.some((l) => {
          const v = s.vessels[l.ship];
          return (
            v.passenger !== l.passenger ||
            keys.some((k) => v.cargo[k] !== l.cargo[k])
          );
        })
      )
        continue;
      if (--j.remaining > 0) continue;
      for (const l of j.loads) {
        const v = s.vessels[l.ship];
        v.cargo = { ...l.cargo };
        v.passenger = l.passenger;
        if (l.passenger) {
          s.units[l.passenger].x = v.x;
          s.units[l.passenger].y = v.y;
        }
      }
      delete s.logisticsJobs[j.id];
      continue;
    }
    if (j.status === "lost" || j.lastProgress >= s.revision) continue;
    j.lastProgress = s.revision;
    const h = s.units[j.hero],
      u = s.units[j.passenger];
    if (
      !h?.alive ||
      !h.active ||
      h.owner!==j.owner ||
      (j.method === "ordinary" && (!h.supplied||!secondaryCapabilities(s,h)?.rescuePassengers)) ||
      !u?.alive ||
      distance(h, j.route[j.index]) !== 0 ||
      (j.phase === 1 && distance(u, h) !== 0) ||
      effectiveRelation(s, j.owner, u.owner) !== "alliance"
    ) {
      j.status = "lost";
      continue;
    }
    const end = j.route.at(-1)!;
    if (
      threatened(s, j.owner, end) ||
      (j.method === "ordinary" && (h.landed||activeEffects(s,h).some(e=>["stunned","incapacitated","rout"].includes(e.kind)))) ||
      !route(s, h, end, h) ||
      activeEffects(s, h).some((e) => e.kind === "root")
    )
      continue;
    const index =
      j.phase === 0 ? Math.ceil((j.route.length - 1) / 2) : j.route.length - 1;
    h.x = j.route[index].x;
    h.y = j.route[index].y;
    u.x = h.x;
    u.y = h.y;
    j.index = index;
    if (j.phase === 1) delete s.logisticsJobs[j.id];
    else j.phase = 1;
  }
}
export function validateLogisticsState(s: LogisticsState): void {
  const ids = new Set<string>();
  for (const [id, j] of Object.entries(s.logisticsJobs)) {
    if (
      id !== j.id ||
      !s.players[j.owner] ||
      !Number.isInteger(j.createdTurn) ||
      j.createdTurn < 1 ||
      j.createdTurn > s.turn ||
      !Number.isInteger(j.lastProgress)
    )
      throw new Error("Invalid logistics identity");
    if (j.kind === "ship-transfer") {
      if (
        !s.facilities[j.harbor] ||
        j.remaining < 1 ||
        j.remaining > 2 ||
        j.lastProgress < j.createdTurn - 1 ||
        j.lastProgress > s.turn ||
        j.loads.length < 2 ||
        j.loads.length > 3 ||
        j.before.length !== j.loads.length
      )
        throw new Error("Invalid ship handling queue");
      for (const l of j.loads) {
        if (ids.has(l.ship) || !s.vessels[l.ship] || !validStock(l.cargo)||keys.reduce((n,k)=>n+l.cargo[k],0)>(hullStatistics(s.players[j.owner].profile,s.vessels[l.ship]?.hullClass)?.capacity??0))
          throw new Error("Invalid hull reservation");
        ids.add(l.ship);
      }
      if (
        keys.some(
          (k) =>
            j.loads.reduce((n, l) => n + l.cargo[k], 0) !==
            j.before.reduce((n, l) => n + l.cargo[k], 0),
        ) ||
        JSON.stringify(
          j.loads
            .map((l) => l.passenger)
            .filter(Boolean)
            .sort(),
        ) !==
          JSON.stringify(
            j.before
              .map((l) => l.passenger)
              .filter(Boolean)
              .sort(),
          )
      )
        throw new Error("Invalid logistics conservation");
    } else {
      if (
        !s.units[j.hero] ||
        !s.units[j.passenger] ||
        s.players[j.owner].profile !== "eagle_eyrie" ||
        (j.method === "ordinary" ? !secondaryCapabilities(s,s.units[j.hero])?.rescuePassengers : (s.players[j.owner].hero.id !== j.hero || s.units[j.hero].kind !== "hero")) ||
        s.units[j.hero].owner !== j.owner ||
        !["worker", "company"].includes(s.units[j.passenger].kind) ||
        s.units[j.passenger].loadClass !== "light" || fittingMovementPenalty(s,j.passenger)>0 ||
        (j.status === "active" &&
          effectiveRelation(s, j.owner, s.units[j.passenger].owner) !==
            "alliance") ||
        ids.has(j.hero) ||
        ids.has(j.passenger) ||
        j.route.length < 2 ||
        j.route.length > 7 ||
        !j.route.every(
          (p, i) =>
            bounded(s, p) && (i === 0 || distance(p, j.route[i - 1]) === 1),
        ) ||
        j.index < 0 ||
        j.index >= j.route.length ||
        j.lastProgress > s.revision ||
        j.createdRevision > s.revision
      )
        throw new Error("Invalid existing rescue flight");
      ids.add(j.hero);
      ids.add(j.passenger);
    }
  }
}
