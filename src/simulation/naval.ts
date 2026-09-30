import {bindLanding,completeLanding} from "./shore-powers";
import { logisticsShipBusy } from "./logistics-support";
import { infrastructureBlocked } from "./infrastructure-work";
import { stocks, type Match, type Pos, type Stock } from "./types";
import { effectiveRelation } from "./diplomacy";
import {
  effectiveWave,
  navalSurfPenalty,
  consumeFogProtection,
} from "./naval-powers";
export interface SeaHazard {
  wave: 0 | 1 | 2 | 3;
  fog: boolean;
  handling: number;
}
export interface Vessel extends Pos {
  id: string;
  owner: string;
  name: string;
  hp: number;
  maxHp: number;
  move: number;
  crew: string;
  crewRescued?: boolean;
  passenger: string | null;
  aboardHero: string | null;
  cargo: Stock;
  phase: "idle" | "loading" | "sailing" | "unloading" | "wreck";
  route: Pos[];
  index: number;
  lastProgress: number;
  handlingRemaining: number;
  fogSpent: boolean;
  handling?: {
    kind: "load" | "unload" | "embark" | "disembark" | "rescue";
    unit?: string;
    cargo?: Stock;
    landing?: Pos;
  };
  repair?: {
    remaining: number;
    started: number;
    accelerated: boolean;
    cost: Stock;
  };
}
export type NavalAction =
  | { kind: "load-cargo" | "unload-cargo"; ship: string; cargo: Stock }
  | { kind: "embark" | "rescue-passenger"; ship: string; unit: string }
  | { kind: "disembark"; ship: string; unit: string; landing: Pos }
  | { kind: "sail"; ship: string; route: Pos[] }
  | { kind: "repair-ship"; ship: string };
/** Provisional ordinary hull, not an adopted faction recipe or hero power. */
export const navalRecipe = {
  cost: stocks(20, 60, 10),
  turns: 2,
  provisional: true,
};
const keys = ["P", "M", "K", "E"] as const;
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const bounded = (s: Match, p: Pos) =>
  Number.isInteger(p.x) &&
  Number.isInteger(p.y) &&
  p.x >= 0 &&
  p.y >= 0 &&
  p.x < s.map.width &&
  p.y < s.map.height;
const water = (s: Match, p: Pos) =>
  bounded(s, p) && s.map.terrain[p.y * s.map.width + p.x] === "water";
const hazard = (s: Match, p: Pos) => s.seaHazards?.[`${p.x},${p.y}`];
const validStock = (v: Stock) =>
  Object.keys(v).sort().join(",") === "E,K,M,P" &&
  keys.every((k) => Number.isSafeInteger(v[k]) && v[k] >= 0);
const total = (v: Stock) => keys.reduce((n, k) => n + v[k], 0);
const harbor = (s: Match, v: Vessel) =>
  Object.values(s.facilities).find(
    (f) =>
      f.owner === v.owner &&
      ["harbor", "rescue-yard"].includes(f.kind) &&
      f.hp > 0 &&
      f.workers > 0 &&
      distance(f, v) <= 1,
  );
const threatened = (s: Match, seat: string, p: Pos) =>
  Object.values(s.units).some(
    (u) =>
      u.alive &&
      u.active &&
      effectiveRelation(s, seat, u.owner) === "war" &&
      distance(u, p) <= 1,
  );
export function isAboard(s: Match, id: string): boolean {
  return Object.values(s.vessels ?? {}).some(
    (v) =>
      v.passenger === id ||
      v.aboardHero === id ||
      (v.phase === "wreck" && !v.crewRescued && v.crew === id),
  );
}
export function isNavalCrew(s: Match, id: string): boolean {
  return Object.values(s.vessels ?? {}).some(
    (v) => v.phase !== "wreck" && v.crew === id,
  );
}
/** Called only by completion of a paid hull production queue. No resources minted. */
export function spawnVessel(
  s: Match,
  seat: string,
  harborId: string,
  crewId: string,
  pos: Pos,
): Vessel {
  const f = s.facilities[harborId],
    u = s.units[crewId];
  if (
    !f ||
    f.owner !== seat ||
    f.kind !== "harbor" ||
    f.hp <= 0 ||
    f.workers < 1 ||
    !u?.alive ||
    !u.active ||
    u.owner !== seat ||
    u.kind !== "worker" ||
    distance(u, f) > 1 ||
    distance(f, pos) !== 1 ||
    !water(s, pos) ||
    isNavalCrew(s, u.id) ||
    isAboard(s, u.id)
  )
    throw new Error(
      "Existing staffed harbor, free own crew and adjacent water required",
    );
  s.vessels ??= {};
  s.seaHazards ??= {};
  const v: Vessel = {
    id: `vessel:${s.nextId++}`,
    owner: seat,
    name: "Ordinary coastal transport",
    hp: 80,
    maxHp: 80,
    move: 3,
    crew: crewId,
    passenger: null,
    aboardHero: null,
    cargo: stocks(),
    phase: "idle",
    route: [{ ...pos }],
    index: 0,
    lastProgress: s.turn - 1,
    handlingRemaining: 0,
    fogSpent: false,
    ...pos,
  };
  u.x = pos.x;
  u.y = pos.y;
  s.vessels[v.id] = v;
  return v;
}
function routeValid(s: Match, v: Vessel, route: Pos[]): boolean {
  return (
    route.length >= 2 &&
    route.length <= s.map.width * s.map.height &&
    distance(route[0], v) === 0 &&
    route.every(
      (p, i) =>
        water(s, p) &&
        (i === 0 || !infrastructureBlocked(s, p, "sea")) &&
        (i === 0 || distance(p, route[i - 1]) === 1),
    ) &&
    new Set(route.map((p) => `${p.x},${p.y}`)).size === route.length
  );
}
export function navalOrderReason(
  s: Match,
  seat: string,
  a: NavalAction,
): string {
  const p = s.players[seat],
    v = s.vessels?.[a.ship],
    crew = v && s.units[v.crew];
  if (
    !p ||
    p.eliminated ||
    !v ||
    v.owner !== seat ||
    v.hp <= 0 ||
    v.phase === "wreck"
  )
    return "Own surviving vessel required";
  if (!crew?.alive || !crew.active || crew.owner !== seat || !crew.supplied)
    return "Existing active supplied crew required";
  if (logisticsShipBusy(s, v.id))
    return "Hull is reserved by a physical cargo transfer";
  if (v.phase !== "idle" || v.repair)
    return "Vessel is busy with its existing order";
  if (a.kind === "sail")
    return routeValid(s, v, a.route)
      ? ""
      : "Declare one continuous simple water route from the vessel";
  if (a.kind === "load-cargo" || a.kind === "unload-cargo") {
    if (!harbor(s, v)) return "Owned staffed accessible harbor required";
    if (!validStock(a.cargo) || total(a.cargo) < 1)
      return "Positive integer four-stock cargo required";
    if (a.kind === "load-cargo" && total(v.cargo) + total(a.cargo) > 20)
      return "Vessel cargo capacity is 20";
    if (
      keys.some(
        (k) => (a.kind === "load-cargo" ? p.stock[k] : v.cargo[k]) < a.cargo[k],
      )
    )
      return "Existing cargo stocks insufficient";
    return "";
  }
  if (a.kind === "repair-ship")
    return !harbor(s, v)
      ? "Staffed harbor repair queue required"
      : v.hp >= v.maxHp
        ? "Hull is not damaged"
        : p.stock.M < 20 || p.stock.K < 5
          ? "Repair needs 20M and 5K"
          : "";
  if (!("unit" in a)) return "Passenger action required";
  const u = s.units[a.unit];
  if (
    !u?.alive ||
    !u.active ||
    u.owner !== seat ||
    !["worker", "company", "hero"].includes(u.kind)
  )
    return "Existing own active ordinary company or hero required";
  if (a.kind === "disembark") {
    if (v.passenger !== u.id && v.aboardHero !== u.id)
      return "Unit is not aboard this vessel";
    if (
      !bounded(s, a.landing) ||
      ["water", "cliff"].includes(
        s.map.terrain[a.landing.y * s.map.width + a.landing.x],
      ) ||
      distance(v, a.landing) !== 1 ||
      threatened(s, seat, a.landing)
    )
      return "Adjacent viable uncontested dry landing required";
    return "";
  }
  if ((u.kind === "hero" ? v.aboardHero : v.passenger) !== null)
    return "Passenger slot already occupied";
  if (distance(u, v) > 1) return "Passenger must physically reach the vessel";
  if (a.kind === "rescue-passenger") {
    const wreck = Object.values(s.vessels).find(
      (x) =>
        x.phase === "wreck" &&
        (x.passenger === u.id ||
          x.aboardHero === u.id ||
          (!x.crewRescued && x.crew === u.id)),
    );
    return wreck && distance(wreck, v) <= 1
      ? ""
      : "Existing stranded passenger at an adjacent wreck required";
  }
  if (
    isAboard(s, u.id) ||
    isNavalCrew(s, u.id) ||
    Object.values(s.convoys).some(
      (c) => c.carrier === u.id && c.phase !== "lost",
    )
  )
    return "Passenger already has a transport assignment";
  return "";
}
export function startNavalOrder(s: Match, seat: string, a: NavalAction): void {
  const reason = navalOrderReason(s, seat, a);
  if (reason) throw new Error(reason);
  const v = s.vessels[a.ship],
    p = s.players[seat];
  if (a.kind === "sail") {
    v.route = a.route.map((p) => ({ ...p }));
    v.index = 0;
    v.fogSpent = false;
    v.phase = "sailing";
    return;
  }
  if (a.kind === "repair-ship") {
    p.stock.M -= 20;
    p.stock.K -= 5;
    v.repair = {
      remaining: 2,
      started: s.turn,
      accelerated: false,
      cost: stocks(0, 20, 5),
    };
    return;
  }
  if (a.kind === "load-cargo") {
    keys.forEach((k) => {
      p.stock[k] -= a.cargo[k];
      v.cargo[k] += a.cargo[k];
    });
    v.handling = { kind: "load", cargo: { ...a.cargo } };
  } else if (a.kind === "unload-cargo")
    v.handling = { kind: "unload", cargo: { ...a.cargo } };
  else if (a.kind === "disembark")
    v.handling = { kind: "disembark", unit: a.unit, landing: { ...a.landing } };
  else {
    if (!("unit" in a)) throw new Error("Passenger action required");
    const u = s.units[a.unit];
    if (a.kind === "rescue-passenger")
      for (const wreck of Object.values(s.vessels)) {
        if (wreck.phase === "wreck" && wreck.crew === u.id)
          wreck.crewRescued = true;
        if (wreck.passenger === u.id) wreck.passenger = null;
        if (wreck.aboardHero === u.id) wreck.aboardHero = null;
      }
    if (u.kind === "hero") v.aboardHero = u.id;
    else v.passenger = u.id;
    u.x = v.x;
    u.y = v.y;
    v.handling = {
      kind: a.kind === "embark" ? "embark" : "rescue",
      unit: u.id,
    };
  }
  if(a.kind==="disembark")bindLanding(s,v.id,a.unit,a.landing);
  v.handlingRemaining = 1 + (hazard(s, v)?.handling ?? 0);
  v.phase =
    a.kind === "unload-cargo" || a.kind === "disembark"
      ? "unloading"
      : "loading";
}
export function damageVessel(s: Match, id: string, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("Invalid hull damage");
  const v = s.vessels[id];
  if (!v) throw new Error("Unknown vessel");
  v.hp = Math.max(0, v.hp - amount);
  if (v.hp === 0) {
    v.phase = "wreck";
    delete v.handling;
    delete v.repair;
    v.handlingRemaining = 0;
  }
}
function moveOccupants(s: Match, v: Vessel) {
  for (const id of [v.crew, v.passenger, v.aboardHero]) {
    const u = id && s.units[id];
    if (u) {
      u.x = v.x;
      u.y = v.y;
    }
  }
}
/** All numeric vessel/hazard values are explicit provisional baseline simulation. */
export function progressVessels(
  s: Match,
  phase: "weekly" | "sailing" = "weekly",
): void {
  for (const v of Object.values(s.vessels ?? {}).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    // Sailing resolves while tactical water effects are active. Its existing
    // stored weekly guard prevents extra movement/upkeep in later phases.
    if (
      phase === "sailing" &&
      (v.phase !== "sailing" || v.handling || v.repair)
    )
      continue;
    if (v.phase === "wreck" || v.lastProgress >= s.turn) continue;
    v.lastProgress = s.turn;
    const p = s.players[v.owner],
      u = s.units[v.crew];
    if (
      !u?.alive ||
      !u.active ||
      u.owner !== v.owner ||
      !u.supplied ||
      p.stock.P < 2 ||
      p.stock.M < 1
    )
      continue;
    p.stock.P -= 2;
    p.stock.M--;
    if (v.repair) {
      if (!harbor(s, v) || effectiveWave(s, v, v) > 0) continue;
      if (--v.repair.remaining === 0) {
        v.hp = Math.min(v.maxHp, v.hp + 20);
        delete v.repair;
      }
      continue;
    }
    if (v.handling) {
      const h = v.handling;
      if ((h.kind === "load" || h.kind === "unload") && !harbor(s, v)) continue;
      if (
        h.kind === "disembark" &&
        (!h.landing || threatened(s, v.owner, h.landing))
      )
        continue;
      if (--v.handlingRemaining > 0) continue;
      if (h.kind === "unload")
        keys.forEach((k) => {
          v.cargo[k] -= h.cargo![k];
          p.stock[k] += h.cargo![k];
        });
      if (h.kind === "disembark") {
        const unit = s.units[h.unit!];
        if (unit?.alive && h.landing) {
          completeLanding(s,v.id,unit,h.landing);
          unit.x = h.landing.x;
          unit.y = h.landing.y;
        }
        if (v.passenger === h.unit) v.passenger = null;
        if (v.aboardHero === h.unit) v.aboardHero = null;
      }
      delete v.handling;
      v.handlingRemaining = 0;
      v.phase = "idle";
      continue;
    }
    if (v.phase !== "sailing") continue;
    for (let step = 0; step < v.move && v.index < v.route.length - 1; step++) {
      const next = v.route[v.index + 1];
      if (
        !water(s, next) ||
        infrastructureBlocked(s, next, "sea") ||
        threatened(s, v.owner, next)
      )
        break;
      const h = hazard(s, next);
      if (h?.fog && !v.fogSpent) {
        v.fogSpent = true;
        if (!consumeFogProtection(s, v)) break;
      }
      const extra = navalSurfPenalty(s, next);
      if (step + 1 + extra > v.move) break;
      step += extra;
      v.index++;
      v.x = next.x;
      v.y = next.y;
      moveOccupants(s, v);
      const wave = effectiveWave(s, v, next);
      if (wave) damageVessel(s, v.id, wave * 2);
      if (v.hp === 0) break;
    }
    if (v.hp > 0 && v.index === v.route.length - 1) v.phase = "idle";
  }
}
export function validateVesselState(
  s: Match,
  v: Vessel,
  guestSeat?: string,
): void {
  const fail = (message = "Invalid vessel checkpoint") => {
    throw new Error(message);
  };
  const crew = s.units[v.crew];
  if (
    s.vessels[v.id] !== v ||
    !s.players[v.owner] ||
    !water(s, v) ||
    (!crew && !guestSeat) ||
    (crew && crew.kind !== "worker") ||
    (v.crewRescued !== undefined && typeof v.crewRescued !== "boolean") ||
    (v.crewRescued && v.phase !== "wreck") ||
    v.maxHp !== 80 ||
    v.move !== 3 ||
    !Number.isSafeInteger(v.hp) ||
    v.hp < 0 ||
    v.hp > 80 ||
    !["idle", "loading", "sailing", "unloading", "wreck"].includes(v.phase) ||
    (v.phase === "wreck") !== (v.hp === 0) ||
    !validStock(v.cargo) ||
    total(v.cargo) > 20 ||
    !Number.isInteger(v.lastProgress) ||
    v.lastProgress < 0 ||
    v.lastProgress > s.turn ||
    !v.route.length ||
    v.route.length > s.map.width * s.map.height ||
    !Number.isInteger(v.index) ||
    v.index < 0 ||
    v.index >= v.route.length ||
    !v.route.every(
      (p, i) => bounded(s, p) && (i === 0 || distance(p, v.route[i - 1]) === 1),
    ) ||
    distance(v, v.route[v.index]) !== 0
  )
    fail();
  const occupants = [
    ...(v.crewRescued ? [] : [v.crew]),
    v.passenger,
    v.aboardHero,
  ].filter((id): id is string => Boolean(id));
  if (new Set(occupants).size !== occupants.length)
    fail("Duplicate vessel occupancy");
  for (const id of occupants) {
    const u = s.units[id];
    const kinds =
      id === v.crew
        ? ["worker"]
        : id === v.aboardHero
          ? ["hero"]
          : ["worker", "company"];
    if (
      (!u && !guestSeat) ||
      (u &&
        (!kinds.includes(u.kind) ||
          u.owner !== v.owner ||
          distance(u, v) !== 0))
    )
      fail("Invalid vessel passenger identity");
    if (
      Object.values(s.vessels).some(
        (other) =>
          other.id !== v.id &&
          (other.passenger === id ||
            other.aboardHero === id ||
            (!other.crewRescued && other.crew === id)),
      )
    )
      fail("Duplicate vessel occupancy");
  }
  if (
    v.repair &&
    (!Number.isInteger(v.repair.remaining) ||
      v.repair.remaining < 1 ||
      v.repair.remaining > 2 ||
      !Number.isInteger(v.repair.started) ||
      v.repair.started < 1 ||
      v.repair.started > s.turn ||
      !validStock(v.repair.cost) ||
      keys.some((k) => v.repair!.cost[k] !== stocks(0, 20, 5)[k]) ||
      v.phase !== "idle" ||
      v.handling)
  )
    fail("Invalid funded vessel repair");
  const h = v.handling;
  if (
    Boolean(h) !== ["loading", "unloading"].includes(v.phase) ||
    !Number.isInteger(v.handlingRemaining) ||
    v.handlingRemaining < 0 ||
    v.handlingRemaining > 4 ||
    (!h && v.handlingRemaining !== 0)
  )
    fail("Invalid vessel handling phase");
  if (h) {
    if (v.handlingRemaining < 1) fail("Invalid vessel handling phase");
    if (h.kind === "load" || h.kind === "unload") {
      if (
        h.unit ||
        h.landing ||
        !h.cargo ||
        !validStock(h.cargo) ||
        total(h.cargo) < 1 ||
        total(h.cargo) > 20 ||
        keys.some((k) => h.cargo![k] > v.cargo[k]) ||
        v.phase !== (h.kind === "load" ? "loading" : "unloading")
      )
        fail("Invalid reserved hull cargo");
    } else {
      if (
        !["embark", "disembark", "rescue"].includes(h.kind) ||
        h.cargo ||
        !h.unit ||
        ![v.passenger, v.aboardHero].includes(h.unit)
      )
        fail("Invalid passenger handling");
      if (h.kind === "disembark") {
        if (
          v.phase !== "unloading" ||
          !h.landing ||
          !bounded(s, h.landing) ||
          ["water", "cliff"].includes(
            s.map.terrain[h.landing.y * s.map.width + h.landing.x],
          ) ||
          distance(h.landing, v) !== 1
        )
          fail("Invalid landing reservation");
      } else if (v.phase !== "loading" || h.landing)
        fail("Invalid passenger handling");
    }
  }
}
const navalPathCache = new WeakMap<
  Match,
  { signature: string; routes: Map<string, Pos[] | null> }
>();
export function navalRoute(s: Match, start: Pos, end: Pos): Pos[] | null {
  if (!water(s, start) || !water(s, end)) return null;
  const signature = `${s.map.width}:${s.map.height}:${s.map.terrain.join(",")}:${JSON.stringify(s.infrastructureSites)}`;
  let cache = navalPathCache.get(s);
  if (!cache || cache.signature !== signature) {
    cache = { signature, routes: new Map() };
    navalPathCache.set(s, cache);
  }
  const key = `${start.x},${start.y}:${end.x},${end.y}`,
    copy = (p: Pos[] | null) => p?.map((x) => ({ ...x })) ?? null;
  if (cache.routes.has(key)) return copy(cache.routes.get(key)!);
  const q: Pos[] = [{ x: start.x, y: start.y }],
    previous = new Map<string, Pos | null>([[`${start.x},${start.y}`, null]]);
  let result: Pos[] | null = null;
  for (let i = 0; i < q.length && i < 16384; i++) {
    const p = q[i];
    if (distance(p, end) === 0) {
      result = [];
      let at: Pos | null = p;
      while (at) {
        result.push(at);
        at = previous.get(`${at.x},${at.y}`) ?? null;
      }
      result.reverse();
      break;
    }
    for (const n of [
      { x: p.x + 1, y: p.y },
      { x: p.x, y: p.y + 1 },
      { x: p.x - 1, y: p.y },
      { x: p.x, y: p.y - 1 },
    ]) {
      const k = `${n.x},${n.y}`;
      if (
        !water(s, n) ||
        infrastructureBlocked(s, n, "sea") ||
        previous.has(k) ||
        previous.size >= 16384
      )
        continue;
      previous.set(k, p);
      q.push(n);
    }
  }
  if (cache.routes.size >= 64)
    cache.routes.delete(cache.routes.keys().next().value!);
  cache.routes.set(key, copy(result));
  return copy(result);
}
