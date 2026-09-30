import {extendedCapabilities} from "../content/extended-production";
import {heavyCargoCapacity} from "./heavy-equipment";
import {consumeCurrentAtBank} from "./shore-powers";
import {trailConvoyReason} from "./habitat-works";
import {recordPatrolMovement} from "./patrols";
import { stocks, type Match, type Pos, type Stock, type Unit } from "./types";
import { activeEffects } from "./effects";
import { movementPenalty } from "./conditions";
import { travelFatigue, fatigueMovementPenalty } from "./fatigue";
import { woodlandMovementCost } from "./movement-plans";
import { effectiveRelation } from "./diplomacy";
import { movementZonePenalty, crossZones } from "./zones";

export interface ConvoyRequest {
  carrier: string;
  origin: string;
  destination: string;
  cargo: Stock;
}
export interface Convoy extends Pos {
  kind?: "eagle-relay";
  id: string;
  owner: string;
  carrier: string;
  origin: string;
  destination: string;
  cargo: Stock;
  capacity: number;
  route: Pos[];
  index: number;
  phase: "loading" | "travel" | "unloading" | "lost";
  started: number;
  lastProgress: number;
  supplies: Stock;
  pauseReason?: string;
  recovery?: boolean;
  rerouted?: boolean;
  alternate?: { route: Pos[]; prepared: number; used: boolean };
}
export type RouteFinder = (
  s: Match,
  start: Pos,
  end: Pos,
  carrier: Unit,
) => Pos[] | null;
const keys = ["P", "M", "K", "E"] as const;
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const ordinary = (s:Match,u: Unit) => ["worker", "company", "beast"].includes(u.kind)||extendedCapabilities(s,u)?.convoyCapacity===20;
function validRoute(
  s: Match,
  path: Pos[] | null,
  start: Pos,
  end: Pos,
): path is Pos[] {
  if (
    !path?.length ||
    path.length > s.map.width * s.map.height ||
    distance(path[0], start) !== 0 ||
    distance(path[path.length - 1], end) !== 0
  )
    return false;
  return path.every(
    (p, i) =>
      Number.isInteger(p.x) &&
      Number.isInteger(p.y) &&
      p.x >= 0 &&
      p.y >= 0 &&
      p.x < s.map.width &&
      p.y < s.map.height &&
      (i === 0 || distance(p, path[i - 1]) === 1),
  );
}
/** Capacity20 and a 1P loading fee are explicit provisional transport values.
 * Existing bank stock is escrowed as real cargo; delivery returns those same
 * stocks to availability. This does not simulate separate settlement inventories. */
export function validateConvoy(
  s: Match,
  seat: string,
  a: ConvoyRequest,
  route: RouteFinder,
): string {
  const p = s.players[seat],
    u = s.units[a.carrier],
    origin = s.facilities[a.origin],
    dest = s.facilities[a.destination];
  if (!p || p.eliminated) return "Active owner required";
  if (
    !u ||
    u.owner !== seat ||
    !u.alive ||
    u.hp <= 0 ||
    !u.active ||
    !u.supplied ||
    !ordinary(s,u)
  )
    return "Owned active supplied ordinary carrier required; no hero, construct, Dragon or Balrog";
  if (
    Object.values(s.convoys).some(
      (c) => c.carrier === u.id && c.phase !== "lost",
    )
  )
    return "Carrier is busy with another convoy";
  if (
    !origin ||
    !dest ||
    origin.owner !== seat ||
    dest.owner !== seat ||
    origin.hp <= 0 ||
    dest.hp <= 0 ||
    origin.workers < 1 ||
    dest.workers < 1
  )
    return "Two owned working staffed endpoints required";
  if (origin.id === dest.id) return "Choose a different destination";
  if (distance(u, origin) > 1) return "Carrier must be at the origin worksite";
  if (
    !a.cargo ||
    Object.keys(a.cargo).sort().join(",") !== "E,K,M,P" ||
    keys.some((k) => !Number.isSafeInteger(a.cargo[k]) || a.cargo[k] < 0)
  )
    return "Cargo must contain only nonnegative integer P/M/K/E";
  const total = keys.reduce((n, k) => n + a.cargo[k], 0);
  if (total < 1 || total > heavyCargoCapacity(s,u,20))
    return "Cargo capacity is 1–20 total stock units";
  if (keys.some((k) => p.stock[k] < a.cargo[k] + (k === "P" ? 1 : 0)))
    return "Existing cargo stocks plus 1P loading provisions required";
  if (!validRoute(s, route(s, { x: u.x, y: u.y }, dest, u), u, dest))
    return "No continuous traversable route";
  return trailConvoyReason(s,route(s,u,dest,u)!,total);
}
export function startConvoy(
  s: Match,
  seat: string,
  a: ConvoyRequest,
  route: RouteFinder,
): Convoy {
  const reason = validateConvoy(s, seat, a, route);
  if (reason) throw new Error(reason);
  const u = s.units[a.carrier],
    dest = s.facilities[a.destination];
  const path = route(s, { x: u.x, y: u.y }, dest, u);
  if (!validRoute(s, path, u, dest))
    throw new Error("Route changed before loading");
  const c: Convoy = {
    id: `convoy:${s.nextId++}`,
    owner: seat,
    carrier: u.id,
    origin: a.origin,
    destination: a.destination,
    cargo: { ...a.cargo },
    capacity: heavyCargoCapacity(s,s.units[a.carrier],20),
    route: path.map((p) => ({ ...p })),
    index: 0,
    phase: "loading",
    started: s.turn,
    lastProgress: s.turn - 1,
    supplies: stocks(1),
    x: u.x,
    y: u.y,
  };
  keys.forEach(
    (k) => (s.players[seat].stock[k] -= a.cargo[k] + (k === "P" ? 1 : 0)),
  );
  s.convoys[c.id] = c;
  return c;
}
/** Called once at weekly resolution, after ordinary upkeep. No animation clock.
 * A lost load keeps its physical position and contents until explicit recovery;
 * this module never turns death/capture/destruction into a refund. */
export function progressConvoys(s: Match, route: RouteFinder): void {
  for (const c of Object.values(s.convoys).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (c.phase === "lost" || c.lastProgress >= s.turn) continue;
    c.lastProgress = s.turn;
    delete c.pauseReason;
    const u = s.units[c.carrier],
      origin = s.facilities[c.origin],
      dest = s.facilities[c.destination];
    if (!u || !u.alive || u.hp <= 0 || u.owner !== c.owner) {
      if (u) {
        c.x = u.x;
        c.y = u.y;
      }
      c.phase = "lost";
      c.pauseReason = "Carrier lost; cargo remains at its last position";
      continue;
    }
    if (u.x !== c.x || u.y !== c.y) {
      c.x = u.x;
      c.y = u.y;
      c.phase = "lost";
      c.pauseReason = "Carrier left its cargo; explicit recovery required";
      continue;
    }
    if (
      !dest ||
      (c.kind === "eagle-relay" ? !ledgeAccess(s,c.owner,c.destination) : dest.owner !== c.owner) ||
      dest.hp <= 0 ||
      (!c.recovery &&
        !c.rerouted &&
        (!origin || (c.kind === "eagle-relay" ? !ledgeAccess(s,c.owner,c.origin) : origin.owner !== c.owner) || origin.hp <= 0))
    ) {
      c.pauseReason = "Route endpoint destroyed, no longer owned or landing consent revoked";
      continue;
    }
    if (!u.active || !u.supplied) {
      c.pauseReason = "Carrier inactive or lacks normal upkeep";
      continue;
    }
    if (
      c.kind === "eagle-relay" &&
      (origin?.kind !== "ledge" ||
        dest.kind !== "ledge" ||
        origin.workers < 1 ||
        dest.workers < 1 ||
        threatenedLedge(s, c.owner, origin) ||
        threatenedLedge(s, c.owner, dest))
    ) {
      c.pauseReason =
        "Prepared staffed landing ledges must remain unthreatened";
      continue;
    }
    if (c.phase === "loading") {
      if (
        !c.recovery &&
        (!origin ||
          origin.owner !== c.owner ||
          origin.hp <= 0 ||
          origin.workers < 1)
      ) {
        c.pauseReason = "Origin needs loading staff";
        continue;
      }
      c.phase = "travel";
      continue;
    }
    if (c.phase === "unloading") {
      if (dest.workers < 1 || distance(c, dest) > 0) {
        c.pauseReason = "Destination needs unloading staff and actual arrival";
        continue;
      }
      keys.forEach((k) => (s.players[c.owner].stock[k] += c.cargo[k]));
      delete s.convoys[c.id];
      continue;
    }
    // Revalidate the original route, not an automatic alternate route. A changed
    // route pauses until a future explicit rerouting command is implemented.
    let remaining = c.route.slice(c.index);
    const available = route(s, { x: c.x, y: c.y }, dest, u);
    const open = (c.alternate||Object.values(s.currentCrossings).some(q=>q.convoy===c.id&&q.turn===s.turn&&!q.consumed))
      ? openRoute(s, remaining, u, route)
      : validRoute(s, available, c, dest) &&
        validRoute(s, remaining, c, dest) &&
        JSON.stringify(available) === JSON.stringify(remaining);
    if (!open) {
      const alternate = c.alternate;
      const at = alternate?.route.findIndex((p) => distance(p, c) === 0) ?? -1;
      const replacement = alternate && at >= 0 ? alternate.route.slice(at) : [];
      if (
        alternate &&
        !alternate.used &&
        alternate.prepared === s.turn &&
        origin?.kind === "depot" &&
        dest.kind === "depot" &&
        origin.owner === c.owner &&
        origin.hp > 0 &&
        origin.workers > 0 &&
        dest.workers > 0 &&
        validRoute(s, replacement, c, dest) &&
        openRoute(s, replacement, u, route)
      ) {
        c.route = replacement.map((p) => ({ ...p }));
        c.index = 0;
        alternate.used = true;
        remaining = c.route;
      } else {
        c.pauseReason = "Stored route blocked or changed; no automatic reroute";
        continue;
      }
    }
    const trailReason=trailConvoyReason(s,remaining,keys.reduce((n,k)=>n+c.cargo[k],0));if(c.kind!=="eagle-relay"&&trailReason){c.pauseReason=trailReason;continue;}
    const effects = activeEffects(s, u);
    if (effects.some((e) => e.kind === "root")) {
      c.pauseReason = "Carrier rooted";
      continue;
    }
    const budget = Math.max(
      0,
      Math.floor(
        Math.min(
          Math.max(
            1,
            u.move - movementPenalty(s, u) - fatigueMovementPenalty(s, u),
          ),
          ...effects.filter((e) => e.kind === "move-limit").map((e) => e.value),
        ),
      ),
    );
    let steps = Math.min(budget, c.route.length - 1 - c.index);
    while (
      steps > 0 &&
      steps +
        woodlandMovementCost(s, u, remaining.slice(0, steps + 1)) +
        movementZonePenalty(s, u, remaining.slice(0, steps + 1)) >
        budget
    )
      steps--;
    const currentPassage=Object.values(s.currentCrossings).find(q=>q.convoy===c.id&&q.turn===s.turn&&!q.consumed);
    if(currentPassage){
      const farBank=currentPassage.tiles.at(-1)!;
      const bankIndex=remaining.findIndex(p=>distance(p,farBank)===0);
      // The power authorizes one bank-to-bank passage in this week. Ordinary
      // movement, fatigue, terrain and live zone costs were all applied above.
      // If counterplay leaves too little budget, never strand cargo in water.
      if(bankIndex<1||steps<bankIndex){c.pauseReason="Insufficient ordinary movement for whole current passage; remain at near bank";continue;}
    }
    const travelled = remaining.slice(0, steps + 1);
    if (steps > 0) crossZones(s, u, travelled);
    c.index += steps;
    const next = c.route[c.index];
    c.x = next.x;
    c.y = next.y;
    travelFatigue(s, u, u, c);
    u.x = c.x;
    u.y = c.y;
    recordPatrolMovement(s,u,travelled);
    consumeCurrentAtBank(s,u,travelled);
    if (c.index === c.route.length - 1) {
      if (c.kind === "eagle-relay") {
        keys.forEach((k) => (s.players[c.owner].stock[k] += c.cargo[k]));
        delete s.convoys[c.id];
      } else c.phase = "unloading";
    }
  }
}

export function isConvoyCarrier(s: Match, id: string): boolean {
  return Object.values(s.convoys).some(
    (c) => c.carrier === id && c.phase !== "lost",
  );
}
/** Structural committed-save invariants. A route can be blocked now without
 * invalidating its historical geometry; progress handles dynamic obstacles. */
export function validateConvoyState(
  s: Match,
  c: Convoy,
  projection = false,
): void {
  const fail = () => {
    throw new Error("Invalid convoy checkpoint invariant");
  };
  const bounded = (p: Pos) =>
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < s.map.width &&
    p.y < s.map.height;
  const stock = (v: Stock) =>
    v &&
    Object.keys(v).sort().join(",") === "E,K,M,P" &&
    keys.every((k) => Number.isSafeInteger(v[k]) && v[k] >= 0);
  const carrier = s.units[c.carrier],
    origin = s.facilities[c.origin],
    dest = s.facilities[c.destination];
  if (
    !c.id ||
    s.convoys[c.id] !== c ||
    !s.players[c.owner] ||
    (!carrier && !(projection && c.phase === "lost")) ||
    (carrier &&
      !(c.kind === "eagle-relay"
        ? carrier.kind === "hero" &&
          carrier.id === s.players[c.owner]?.hero.id &&
          s.players[c.owner]?.profile === "eagle_eyrie" &&
          carrier.flying
        : ordinary(s,carrier))) ||
    (!projection && (!origin || !dest)) ||
    c.origin === c.destination
  )
    fail();
  if (
    !["loading", "travel", "unloading", "lost"].includes(c.phase) ||
    !bounded(c)
  )
    fail();
  if (
    !stock(c.cargo) ||
    !stock(c.supplies) ||
    !Number.isInteger(c.capacity) ||
    c.capacity < 1 ||
    c.capacity > 20
  )
    fail();
  if (
    c.kind === "eagle-relay" &&
    (c.cargo.M !== 0 ||
      c.cargo.E !== 0 ||
      c.supplies.P !== 10 ||
      c.supplies.M !== 5 ||
      c.supplies.K !== 0 ||
      c.supplies.E !== 0 ||
      c.phase === "loading" ||
      c.phase === "unloading")
  )
    fail();
  const total = keys.reduce((n, k) => n + c.cargo[k], 0);
  if (total < 1 || total > c.capacity) fail();
  if (
    !Number.isInteger(c.started) ||
    c.started < 1 ||
    c.started > s.turn ||
    !Number.isInteger(c.lastProgress) ||
    c.lastProgress < c.started - 1 ||
    c.lastProgress > s.turn
  )
    fail();
  if (
    !c.route.length ||
    c.route.length > s.map.width * s.map.height ||
    !c.route.every(
      (p, i) => bounded(p) && (i === 0 || distance(p, c.route[i - 1]) === 1),
    ) ||
    (dest && distance(c.route[c.route.length - 1], dest) !== 0)
  )
    fail();
  if (!Number.isInteger(c.index) || c.index < 0 || c.index >= c.route.length)
    fail();
  if (c.alternate) {
    const a = c.alternate;
    if (
      !Number.isInteger(a.prepared) ||
      a.prepared < 1 ||
      a.prepared > s.turn ||
      typeof a.used !== "boolean" ||
      !a.route.length ||
      a.route.length > s.map.width * s.map.height ||
      new Set(a.route.map((p) => `${p.x},${p.y}`)).size !== a.route.length ||
      !a.route.every(
        (p, i) => bounded(p) && (i === 0 || distance(p, a.route[i - 1]) === 1),
      ) ||
      (dest && distance(a.route[a.route.length - 1], dest) !== 0)
    )
      fail();
  }
  if (c.phase !== "lost") {
    if (
      carrier.owner !== c.owner ||
      !carrier.alive ||
      carrier.hp <= 0 ||
      distance(c, carrier) !== 0 ||
      distance(c, c.route[c.index]) !== 0
    )
      fail();
    if (c.phase === "loading" && c.index !== 0) fail();
    if (c.phase === "unloading" && c.index !== c.route.length - 1) fail();
  }
}

/** Run immediately after committed combat/forced displacement, not just upkeep. */
export function settleConvoyLosses(s: Match): void {
  for (const c of Object.values(s.convoys)) {
    if (c.phase === "lost") continue;
    const u = s.units[c.carrier];
    if (
      !u ||
      !u.alive ||
      u.hp <= 0 ||
      u.owner !== c.owner ||
      distance(u, c) > 0
    ) {
      if (u) {
        c.x = u.x;
        c.y = u.y;
      }
      c.phase = "lost";
      c.pauseReason =
        "Carrier lost or displaced; cargo requires explicit recovery";
    }
  }
}
export function recoverCargoReason(
  s: Match,
  seat: string,
  convoyId: string,
  carrierId: string,
  route: RouteFinder,
): string {
  const c = s.convoys[convoyId],
    p = s.players[seat],
    u = s.units[carrierId];
  if (!p || p.eliminated || !c || c.owner !== seat || c.phase !== "lost")
    return "Own lost cargo required";
  if (
    !u ||
    u.owner !== seat ||
    !u.alive ||
    u.hp <= 0 ||
    !u.active ||
    !u.supplied ||
    !ordinary(s,u) ||
    isConvoyCarrier(s, u.id)
  )
    return "Free owned active supplied ordinary carrier required";
  if (distance(u, c) !== 0)
    return "Reach the actual cargo tile before recovery";
  const dest = s.facilities[c.destination];
  if (!dest || dest.owner !== seat || dest.hp <= 0 || dest.workers < 1)
    return "Original destination must be owned and staffed";
  if (p.stock.P < 1) return "Recovery loading requires 1P";
  if (!validRoute(s, route(s, { x: u.x, y: u.y }, dest, u), u, dest))
    return "No traversable recovery route";
  return "";
}
export function recoverCargo(
  s: Match,
  seat: string,
  convoyId: string,
  carrierId: string,
  route: RouteFinder,
): Convoy {
  const reason = recoverCargoReason(s, seat, convoyId, carrierId, route);
  if (reason) throw new Error(reason);
  const c = s.convoys[convoyId],
    u = s.units[carrierId],
    dest = s.facilities[c.destination];
  delete c.alternate;
  delete c.kind;
  c.carrier = carrierId;
  c.route = route(s, { x: u.x, y: u.y }, dest, u)!.map((p) => ({ ...p }));
  c.index = 0;
  c.phase = "loading";
  c.recovery = true;
  c.started = s.turn;
  c.lastProgress = s.turn - 1;
  delete c.pauseReason;
  s.players[seat].stock.P--;
  c.supplies.P++;
  return c;
}
export interface RerouteRequest {
  convoy: string;
  destination: string;
  method: "ordinary" | "power";
  relay?: string;
}
export function rerouteConvoyReason(
  s: Match,
  seat: string,
  a: RerouteRequest,
  route: RouteFinder,
): string {
  const p = s.players[seat],
    c = s.convoys[a.convoy],
    u = c && s.units[c.carrier],
    dest = s.facilities[a.destination];
  if (
    !p ||
    p.eliminated ||
    !c ||
    c.owner !== seat ||
    c.phase === "lost" ||
    !u ||
    u.owner !== seat ||
    !u.alive ||
    !u.active ||
    !u.supplied ||
    !ordinary(s,u) ||
    distance(u, c) !== 0
  )
    return "Own existing active ordinary convoy required";
  if (
    !dest ||
    dest.owner !== seat ||
    dest.hp <= 0 ||
    dest.workers < 1 ||
    dest.id === c.origin
  )
    return "Different owned staffed destination required";
  if (!validRoute(s, route(s, { x: c.x, y: c.y }, dest, u), c, dest))
    return "No traversable revised route";
  if (a.method === "power") {
    const h = s.units[p.hero.id];
    if (
      p.profile !== "manwe" ||
      p.hero.status !== "living" ||
      !h?.alive ||
      !h.active ||
      h.hp <= 0 ||
      p.hero.readiness < 3 ||
      p.commitment < 1
    )
      return "Living Manwë, 3 readiness and one weekly hero commitment required";
    if (!route(s, { x: h.x, y: h.y }, c, h))
      return "Manwë must reach the connected convoy region";
  } else if (a.method === "ordinary") {
    const relay = a.relay ? s.facilities[a.relay] : undefined;
    if (
      !relay ||
      relay.kind !== "relay" ||
      relay.owner !== seat ||
      relay.hp <= 0 ||
      relay.workers < 1
    )
      return "Owned staffed relay required";
    if (!route(s, { x: relay.x, y: relay.y }, c, u))
      return "Relay must connect to the convoy region";
    if (p.stock.K < 2)
      return "Ordinary relay message requires 2K (provisional)";
  } else return "Unknown rerouting method";
  return "";
}
/** Manwë replaces the relay requirement, not cargo/movement/upkeep. Parent spends
 * the strategic operation or hero commitment; only costs below are paid here. */
export function rerouteConvoy(
  s: Match,
  seat: string,
  a: RerouteRequest,
  route: RouteFinder,
): Convoy {
  const reason = rerouteConvoyReason(s, seat, a, route);
  if (reason) throw new Error(reason);
  const c = s.convoys[a.convoy],
    u = s.units[c.carrier],
    dest = s.facilities[a.destination];
  delete c.alternate;
  c.destination = a.destination;
  c.route = route(s, { x: c.x, y: c.y }, dest, u)!.map((p) => ({ ...p }));
  c.index = 0;
  c.rerouted = true;
  delete c.pauseReason;
  if (c.phase === "unloading") c.phase = "travel";
  if (a.method === "power") s.players[seat].hero.readiness -= 3;
  else s.players[seat].stock.K -= 2;
  return c;
}

export interface PrepareSupplyRequest {
  convoy: string;
  route: Pos[];
}
/** Each adjacent edge must itself remain traversable. Finding some alternate
 * global path is insufficient proof that a player-selected route is open. */
function openRoute(
  s: Match,
  points: Pos[],
  u: Unit,
  finder: RouteFinder,
): boolean {
  return (
    points.length > 0 &&
    points.every(
      (p, i) => i === 0 || finder(s, points[i - 1], p, u)?.length === 2,
    )
  );
}
export function prepareSupplyReason(
  s: Match,
  seat: string,
  a: PrepareSupplyRequest,
  finder: RouteFinder,
  surveyed: (pos: Pos) => boolean,
): string {
  const p = s.players[seat],
    c = s.convoys[a.convoy],
    u = c && s.units[c.carrier];
  if (
    !p ||
    p.profile !== "sauron" ||
    p.eliminated ||
    !c ||
    c.owner !== seat ||
    c.phase === "lost" ||
    c.phase === "unloading" ||
    !u?.alive ||
    !u.active ||
    !u.supplied ||
    u.owner !== seat ||
    !ordinary(s,u) ||
    distance(c, u) !== 0
  )
    return "Sauron's own funded active ordinary convoy required";
  if (c.alternate?.prepared === s.turn)
    return "Alternate route already prepared this week";
  const h = s.units[p.hero.id];
  if (
    p.hero.status !== "living" ||
    !h?.alive ||
    !h.active ||
    p.hero.readiness < 3 ||
    p.commitment < 1
  )
    return "Living Sauron, 3 readiness and one weekly commitment required";
  const origin = s.facilities[c.origin],
    dest = s.facilities[c.destination];
  if (
    ![origin, dest].every(
      (f) =>
        f?.kind === "depot" && f.owner === seat && f.hp > 0 && f.workers > 0,
    )
  )
    return "Two owned staffed working depots required";
  if (!finder(s, h, c, h)) return "Hero must be in the connected convoy region";
  if (
    !validRoute(s, a.route, c, dest) ||
    new Set(a.route.map((p) => `${p.x},${p.y}`)).size !== a.route.length ||
    !openRoute(s, a.route, u, finder)
  )
    return "A continuous open alternate route without loops is required";
  if (!a.route.every(surveyed))
    return "Every alternate route tile must be surveyed";
  if (JSON.stringify(a.route) === JSON.stringify(c.route.slice(c.index)))
    return "Choose a different alternate route";
  if (!openRoute(s, c.route.slice(c.index), u, finder))
    return "Prepare before the original route closes";
  if (p.stock.M < 10 || p.stock.K < 5)
    return "Redundant Supply requires 10M and 5K";
  return "";
}
/** Adopted Redundant Supply costs. Parent spends the weekly hero commitment. */
export function prepareSupply(
  s: Match,
  seat: string,
  a: PrepareSupplyRequest,
  finder: RouteFinder,
  surveyed: (pos: Pos) => boolean,
): Convoy {
  const reason = prepareSupplyReason(s, seat, a, finder, surveyed);
  if (reason) throw new Error(reason);
  const p = s.players[seat],
    c = s.convoys[a.convoy];
  p.stock.M -= 10;
  p.stock.K -= 5;
  p.hero.readiness -= 3;
  c.alternate = {
    route: a.route.map((p) => ({ x: p.x, y: p.y })),
    prepared: s.turn,
    used: false,
  };
  return c;
}

export interface EyrieRelayRequest {
  origin: string;
  destination: string;
  cargo: Stock;
}
function threatenedLedge(s: Match, seat: string, pos: Pos): boolean {
  return Object.values(s.units).some(
    (u) =>
      u.alive &&
      u.active &&
      u.owner !== seat &&
      effectiveRelation(s, seat, u.owner) === "war" &&
      distance(u, pos) <= 1,
  );
}
export function eyrieRelayReason(
  s: Match,
  seat: string,
  a: EyrieRelayRequest,
  finder: RouteFinder,
): string {
  const p = s.players[seat],
    h = p && s.units[p.hero.id],
    origin = s.facilities[a.origin],
    dest = s.facilities[a.destination];
  if (
    !p ||
    p.profile !== "eagle_eyrie" ||
    p.eliminated ||
    p.hero.status !== "living" ||
    !h?.alive ||
    !h.active ||
    !h.flying ||
    h.hp <= 0 ||
    !h.supplied
  )
    return "Living active supplied Skywarden required";
  if (isConvoyCarrier(s, h.id))
    return "Skywarden is busy carrying another load";
  if (p.hero.readiness < 3 || p.commitment < 1)
    return "3 readiness and one weekly hero commitment required";
  if (
    a.origin === a.destination ||
    ![origin, dest].every(
      (f) =>
        f?.kind === "ledge" && ledgeAccess(s,seat,f.id) && f.hp > 0 && f.workers > 0,
    )
  )
    return "Two distinct owned or explicitly consenting staffed prepared ledges required";
  if (distance(h, origin) !== 0)
    return "Skywarden must reach the loading ledge first";
  if (threatenedLedge(s, seat, origin) || threatenedLedge(s, seat, dest))
    return "A landing ledge is threatened";
  if (
    Object.keys(a.cargo).sort().join(",") !== "E,K,M,P" ||
    !keys.every((k) => Number.isSafeInteger(a.cargo[k]) && a.cargo[k] >= 0) ||
    a.cargo.M !== 0 ||
    a.cargo.E !== 0 ||
    a.cargo.P + a.cargo.K < 1 ||
    a.cargo.P + a.cargo.K > 20
  )
    return "One load of 1–20 existing P or K only; no M, E or troops";
  if (p.stock.P < a.cargo.P + 10 || p.stock.M < 5 || p.stock.K < a.cargo.K)
    return "Existing cargo plus 10P and 5M flight supplies required";
  const route = finder(s, h, dest, h),
    effects = activeEffects(s, h);
  if (!validRoute(s, route, h, dest))
    return "An open physical flight route is required";
  const budget = Math.max(
    0,
    Math.floor(
      Math.min(
        Math.max(1, h.move - movementPenalty(s, h)),
        ...effects.filter((e) => e.kind === "move-limit").map((e) => e.value),
      ),
    ),
  );
  if (
    effects.some((e) => e.kind === "root") ||
    route.length - 1 + movementZonePenalty(s, h, route) > budget
  )
    return "Delivery must fit normal available flight movement; no extra speed";
  return "";
}
/** Skywarden carries one ordinary flight; loading/delivery share weekly resolution.
 * Explicit foreign landing consent is rechecked before every progress step. */
export function startEyrieRelay(
  s: Match,
  seat: string,
  a: EyrieRelayRequest,
  finder: RouteFinder,
): Convoy {
  const reason = eyrieRelayReason(s, seat, a, finder);
  if (reason) throw new Error(reason);
  const p = s.players[seat],
    h = s.units[p.hero.id],
    dest = s.facilities[a.destination];
  const c: Convoy = {
    kind: "eagle-relay",
    id: `convoy:${s.nextId++}`,
    owner: seat,
    carrier: h.id,
    origin: a.origin,
    destination: a.destination,
    cargo: { ...a.cargo },
    capacity: 20,
    route: finder(s, h, dest, h)!.map((p) => ({ x: p.x, y: p.y })),
    index: 0,
    phase: "travel",
    started: s.turn,
    lastProgress: s.turn - 1,
    supplies: stocks(10, 5),
    x: h.x,
    y: h.y,
  };
  p.stock.P -= a.cargo.P + 10;
  p.stock.M -= 5;
  p.stock.K -= a.cargo.K;
  p.hero.readiness -= 3;
  s.convoys[c.id] = c;
  return c;
}

export interface LedgeConsent { ledge:string; owner:string; visitor:string; grantedTurn:number }
export interface LandingSurvey { owner:string; destination:Pos; turn:number; revision:number; terrain:string; spaceAvailable:boolean }
export type EyrieState = Match & {ledgeConsents?:Record<string,LedgeConsent>;landingSurveys?:Record<string,LandingSurvey>};
const consentKey = (ledge:string,visitor:string) => `ledge-consent:${ledge}:${visitor}`;
/** Permission grants use of a landing site, never its owner's stocks or ownership. */
export function ledgeConsentReason(s:EyrieState,owner:string,ledge:string,visitor:string,allow:boolean):string {
  const f=s.facilities[ledge],p=s.players[owner];
  if(!p||p.eliminated||!f||f.owner!==owner||f.kind!=="ledge"||f.hp<=0)return "Live owned prepared ledge required";
  if(owner===visitor||s.players[visitor]?.profile!=="eagle_eyrie"||s.players[visitor].eliminated)return "Active foreign Eagle visitor required";
  if(allow&&f.workers<1)return "Staffed ledge required before granting consent";
  return "";
}
export function setLedgeConsent(s:EyrieState,owner:string,ledge:string,visitor:string,allow:boolean):void {
  const reason=ledgeConsentReason(s,owner,ledge,visitor,allow);if(reason)throw new Error(reason);
  const key=consentKey(ledge,visitor);s.ledgeConsents??={};
  if(!allow){delete s.ledgeConsents[key];return;}
  s.ledgeConsents[key]={ledge,owner,visitor,grantedTurn:s.turn};
}
function ledgeAccess(s:EyrieState,seat:string,id:string):boolean {
  const f=s.facilities[id];
  if(!f||f.kind!=="ledge"||f.hp<=0)return false;
  if(f.owner===seat)return true;
  const q=s.ledgeConsents?.[consentKey(id,seat)];
  return !!q&&q.owner===f.owner&&q.visitor===seat&&q.ledge===id&&!s.players[q.owner]?.eliminated;
}
/** Caller supplies actual current line of sight and observation-filtered space.
 * Never consult hidden occupants in the space callback. No remote information,
 * unit IDs, improved movement or future weather is inferred from this record. */
export function landingSurveyReason(s:EyrieState,seat:string,destination:Pos,visible:(p:Pos)=>boolean):string {
  const p=s.players[seat],h=p&&s.units[p.hero.id];
  if(!p||p.profile!=="eagle_eyrie"||p.hero.status!=="living"||!h?.alive||!h.active||!h.supplied||activeEffects(s,h).some(e=>["stunned","incapacitated"].includes(e.kind)))return "Living conscious Skywarden required";
  if(!Number.isSafeInteger(destination.x)||!Number.isSafeInteger(destination.y)||destination.x<0||destination.y<0||destination.x>=s.map.width||destination.y>=s.map.height||!visible(destination))return "Current line of sight to inspected destination required";
  if(isConvoyCarrier(s,h.id))return "Inspect before starting rescue or delivery";
  if(s.landingSurveys?.[seat]?.turn===s.turn)return "One landing survey per week";
  return "";
}
export function inspectLanding(s:EyrieState,seat:string,destination:Pos,visible:(p:Pos)=>boolean,spaceAvailable:(p:Pos)=>boolean):LandingSurvey {
  const reason=landingSurveyReason(s,seat,destination,visible);if(reason)throw new Error(reason);
  const q:LandingSurvey={owner:seat,destination:{x:destination.x,y:destination.y},turn:s.turn,revision:s.revision,terrain:s.map.terrain[destination.y*s.map.width+destination.x],spaceAvailable:spaceAvailable(destination)};
  s.landingSurveys??={};s.landingSurveys[seat]=q;return q;
}
export function pruneEyrieState(s:EyrieState):void {
  for(const [id,q] of Object.entries(s.ledgeConsents??{})){const f=s.facilities[q.ledge];if(!f||f.hp<=0||f.owner!==q.owner||f.kind!=="ledge"||s.players[q.owner]?.eliminated||s.players[q.visitor]?.eliminated)delete s.ledgeConsents![id];}
  for(const [id,q] of Object.entries(s.landingSurveys??{}))if(q.turn<s.turn)delete s.landingSurveys![id];
}
export function validateEyrieState(s:EyrieState,guestSeat?:string):void {
  for(const [id,q] of Object.entries(s.ledgeConsents??{})){
    const f=s.facilities[q.ledge];
    if(id!==consentKey(q.ledge,q.visitor)||!s.players[q.owner]||q.owner===q.visitor||s.players[q.visitor]?.profile!=="eagle_eyrie"||!Number.isSafeInteger(q.grantedTurn)||q.grantedTurn<1||q.grantedTurn>s.turn||(guestSeat&&q.owner!==guestSeat&&q.visitor!==guestSeat)||(!guestSeat&&(!f||f.owner!==q.owner||f.kind!=="ledge")))throw new Error("Invalid ledge consent");
  }
  for(const [id,q] of Object.entries(s.landingSurveys??{}))if(id!==q.owner||s.players[q.owner]?.profile!=="eagle_eyrie"||(guestSeat&&q.owner!==guestSeat)||!Number.isSafeInteger(q.turn)||q.turn<1||q.turn>s.turn||!Number.isSafeInteger(q.revision)||q.revision<0||q.revision>s.revision||!Number.isSafeInteger(q.destination.x)||!Number.isSafeInteger(q.destination.y)||q.destination.x<0||q.destination.y<0||q.destination.x>=s.map.width||q.destination.y>=s.map.height||typeof q.terrain!=="string"||typeof q.spaceAvailable!=="boolean")throw new Error("Invalid landing survey");
}
