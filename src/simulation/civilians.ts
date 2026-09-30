import {civilianProfiles} from "../content/production";
export {civilianProfiles} from "../content/production";
import type { Match, Pos, Unit } from "./types";
import { activeEffects } from "./effects";
import { effectiveRelation } from "./diplomacy";
export interface Household extends Pos {
  id: string;
  owner: string;
  home: string;
  population: number;
  provisions: number;
  willing: boolean;
}
export interface CivilianConsent {
  id: string;
  owner: string;
  guest: string;
  refuge: string;
  turn: number;
}
export interface CivilianJob extends Pos {
  id: string;
  owner: string;
  mode: "people" | "stores";
  household: string;
  carrier: string;
  destination: string;
  route: Pos[];
  index: number;
  population: number;
  provisions: number;
  phase: "travel" | "arrived" | "lost";
  started: number;
  lastProgress: number;
}
export type CivilianState = Match & {
  households: Record<string, Household>;
  civilianJobs: Record<string, CivilianJob>;
  civilianConsents: Record<string, CivilianConsent>;
};
export type CivilianRequest =
  | { mode: "deposit"; household: string; amount: number; unit: string }
  | { mode: "withdraw"; household: string; amount: number; unit: string }
  | { mode: "consent"; guest: string; refuge: string }
  | {
      mode: "people";
      household: string;
      carrier: string;
      destination: string;
      route: Pos[];
      method: "ordinary" | "nessa";
    }
  | {
      mode: "stores";
      household: string;
      carrier: string;
      destination: string;
      route: Pos[];
      amount: number;
      method: "ordinary" | "hobbit";
    }
  | { mode: "recover"; job: string; carrier: string; route: Pos[] };
export interface CivilianChecks {
  route: (s: Match, u: Unit, route: Pos[]) => boolean;
  busy: (id: string) => boolean;
  connected: (a: Pos, b: Pos) => boolean;
  cost: (s: Match, u: Unit, route: Pos[]) => number;
  moved?: (s: Match, u: Unit, route: Pos[]) => void;
}
/** Provisional scenario population, only explicit people/community settlements
 * plus Nessa's adopted civilian relay domain. No animal/habitat households. */
export function initializeHouseholds(s: CivilianState): void {
  for (const p of Object.values(s.players)) {
    if (!civilianProfiles.includes(p.profile)) continue;
    const f = s.facilities[`${p.seat}:core`],
      id = `household:${p.seat}`;
    if (f && !s.households[id])
      s.households[id] = {
        id,
        owner: p.seat,
        home: f.id,
        x: f.x,
        y: f.y,
        population: 12,
        provisions: 0,
        willing: true,
      };
  }
}
const d = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const integer = (n: number) => Number.isSafeInteger(n) && n >= 0;
const active = (s: Match, u: Unit | undefined): u is Unit =>
  !!u &&
  u.alive &&
  u.hp > 0 &&
  u.active &&
  !activeEffects(s, u).some((e) =>
    ["stunned", "incapacitated", "rout"].includes(e.kind),
  );
const carrier = (s: Match, u: Unit | undefined, seat: string) =>
  active(s, u) &&
  u.owner === seat &&
  u.supplied &&
  ["worker", "company"].includes(u.kind);
export const civilianBusy = (s: CivilianState, id: string) =>
  Object.values(s.civilianJobs).some(
    (j) => j.carrier === id && j.phase === "travel",
  );
function consent(s: CivilianState, seat: string, destination: string) {
  const f = s.facilities[destination];
  return (
    !!f &&
    f.hp > 0 &&
    f.workers > 0 &&
    f.kind === "refuge" &&
    (f.owner === seat ||
      (effectiveRelation(s, seat, f.owner) === "alliance" &&
        Object.values(s.civilianConsents).some(
          (c) =>
            c.owner === f.owner &&
            c.guest === seat &&
            c.refuge === f.id &&
            c.turn === s.turn,
        )))
  );
}
function routeReason(
  s: CivilianState,
  u: Unit,
  route: Pos[],
  to: Pos,
  c: CivilianChecks,
) {
  return route.length < 2 ||
    route.length > 128 ||
    d(route[0], u) !== 0 ||
    d(route.at(-1)!, to) !== 0 ||
    route.some(
      (p, i) =>
        !integer(p.x) ||
        !integer(p.y) ||
        p.x >= s.map.width ||
        p.y >= s.map.height ||
        (i > 0 && d(p, route[i - 1]) !== 1),
    ) ||
    !c.route(s, u, route) ||
    c.cost(s, u, route) > u.move
    ? "Open known route within ordinary carrying pace required"
    : "";
}
export function civilianReason(
  s: CivilianState,
  seat: string,
  a: CivilianRequest,
  c: CivilianChecks,
): string {
  const p = s.players[seat];
  if (!p) return "Unknown household owner";
  if (a.mode === "consent") {
    const f = s.facilities[a.refuge];
    return !s.players[a.guest] ||
      a.guest === seat ||
      !f ||
      f.owner !== seat ||
      f.kind !== "refuge" ||
      f.hp <= 0 ||
      f.workers < 1 ||
      effectiveRelation(s, seat, a.guest) !== "alliance"
      ? "Owned staffed refuge and mutual alliance required"
      : "";
  }
  if (a.mode === "recover") {
    const j = s.civilianJobs[a.job],
      u = s.units[a.carrier];
    if (
      !j ||
      j.owner !== seat ||
      j.phase !== "lost" ||
      !carrier(s, u, seat) ||
      c.busy(u.id) ||
      civilianBusy(s, u.id) ||
      d(j, u) !== 0
    )
      return "Existing lost cargo and free owned carrier at its exact position required";
    if (!consent(s, seat, j.destination)) return "Destination consent required";
    return (
      routeReason(s, u, a.route, s.facilities[j.destination], c) ||
      (p.stock.P < 2 ? "Two P recovery transport rations required" : "")
    );
  }
  const h = s.households[a.household];
  if (!h || h.owner !== seat || !h.willing)
    return "Existing willing own household required";
  if (a.mode === "deposit" || a.mode === "withdraw") {
    if (Object.values(s.civilianJobs).some(j=>j.household===h.id&&j.mode==="people"&&j.phase!=="arrived")) return "Civilian group stores are reserved during transfer or loss";
    const u = s.units[a.unit],
      f = s.facilities[h.home];
    if (
      !carrier(s, u, seat) ||
      c.busy(u.id) ||
      civilianBusy(s, u.id) ||
      d(u, h) !== 0 ||
      !f ||
      f.owner !== seat ||
      f.hp <= 0 ||
      f.workers < 1 ||
      d(f, h) !== 0
    )
      return "Local free carrier and owned staffed household supply site required";
    if (
      !integer(a.amount) ||
      a.amount < 1 ||
      (a.mode === "deposit" ? p.stock.P : h.provisions) < a.amount || (a.mode === "deposit" && h.provisions + a.amount > 1000000)
    )
      return "Existing positive provisions required";
    return "";
  }
  const u = s.units[a.carrier],
    f = s.facilities[a.destination];
  if (
    !carrier(s, u, seat) ||
    c.busy(u.id) ||
    civilianBusy(s, u.id) ||
    d(u, h) !== 0
  )
    return "Free supplied ordinary carrier at household required";
  if (!consent(s, seat, a.destination))
    return "Explicit destination refuge consent required";
  const reason = routeReason(s, u, a.route, f, c);
  if (reason) return reason;
  const power = a.method !== "ordinary";
  if (power) {
    const hero = s.units[p.hero.id];
    if (
      p.profile !== (a.mode === "people" ? "nessa" : "hobbit_shire") ||
      p.hero.status !== "living" ||
      !active(s, hero) ||
      p.hero.readiness < 3 ||
      p.commitment < 1 ||
      !c.connected(hero, h)
    )
      return "Matching active hero, connected region, readiness and commitment required";
  }
  if (a.mode === "people") {
    if (h.provisions > 0)
      return "Withdraw stored provisions before moving this whole civilian group";
    if (
      h.population < 1 ||
      h.population > 12 ||
      Object.values(s.civilianJobs).some(
        (j) =>
          j.household === h.id && j.mode === "people" && j.phase !== "arrived",
      )
    )
      return "Existing whole civilian group within capacity12 required";
    if (
      !power &&
      !Object.values(s.facilities).some(
        (f) =>
          f.kind === "relay-stable" &&
          f.owner === seat &&
          f.hp > 0 &&
          f.workers > 0 &&
          d(f, h) <= 1,
      )
    )
      return "Staffed relay stable required";
    if (p.stock.P < Math.ceil(h.population / 6))
      return "Normal travel rations required";
  } else if (
    !integer(a.amount) ||
    a.amount < 1 ||
    a.amount > (power ? 10 : 20) ||
    h.provisions < a.amount
  )
    return "Existing stores within capacity (power10, ordinary20) required";
  return a.mode === "stores" && p.stock.P < 2
    ? "Two P transport fee required"
    : "";
}
/** Parent charges one ordinary operation and the power's weekly commitment. */
export function applyCivilian(
  s: CivilianState,
  seat: string,
  a: CivilianRequest,
  c: CivilianChecks,
): string {
  const reason = civilianReason(s, seat, a, c);
  if (reason) throw new Error(reason);
  const p = s.players[seat];
  if (a.mode === "consent") {
    const id = `consent:${seat}:${a.guest}:${a.refuge}`;
    s.civilianConsents[id] = {
      id,
      owner: seat,
      guest: a.guest,
      refuge: a.refuge,
      turn: s.turn,
    };
    return id;
  }
  if (a.mode === "recover") {
    const j = s.civilianJobs[a.job];
    p.stock.P -= 2;
    Object.assign(j, {
      carrier: a.carrier,
      route: structuredClone(a.route),
      index: 0,
      phase: "travel",
      lastProgress: s.turn - 1,
    });
    return j.id;
  }
  const h = s.households[a.household];
  if (a.mode === "deposit" || a.mode === "withdraw") {
    const amount = a.mode === "deposit" ? a.amount : -a.amount;
    p.stock.P -= amount;
    h.provisions += amount;
    return h.id;
  }
  const people = a.mode === "people" ? h.population : 0,
    provisions = a.mode === "stores" ? a.amount : 0;
  p.stock.P -= people ? Math.ceil(people / 6) : 2;
  if (a.method !== "ordinary") p.hero.readiness -= 3;
  h.population -= people;
  h.provisions -= provisions;
  const id = `civilian:${s.nextId++}`;
  s.civilianJobs[id] = {
    id,
    owner: seat,
    mode: a.mode,
    household: h.id,
    carrier: a.carrier,
    destination: a.destination,
    route: structuredClone(a.route),
    index: 0,
    x: h.x,
    y: h.y,
    population: people,
    provisions,
    phase: "travel",
    started: s.turn,
    lastProgress: s.turn - 1,
  };
  return id;
}
/** Settle before tactical snapshots; lost cargo stays at its last physical cell. */
export function settleCivilianLosses(s:CivilianState):void{for(const[id,c]of Object.entries(s.civilianConsents)){const f=s.facilities[c.refuge];if(!f||f.owner!==c.owner||f.hp<=0||c.turn<s.turn)delete s.civilianConsents[id];}for(const j of Object.values(s.civilianJobs)){if(j.phase!=="travel")continue;const u=s.units[j.carrier];if(!u?.alive||u.owner!==j.owner||d(j,u)!==0)j.phase="lost";}}
export function progressCivilians(s: CivilianState, c: CivilianChecks): void {
  for (const j of Object.values(s.civilianJobs).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (j.phase !== "travel" || j.lastProgress >= s.turn) continue;
    const u = s.units[j.carrier];
    if (!u?.alive || u.owner !== j.owner || d(j, u) !== 0) {
      j.phase = "lost";
      continue;
    }
    if (!carrier(s, u, j.owner) || !consent(s, j.owner, j.destination))
      continue;
    const remaining = j.route.slice(j.index);
    if (!c.route(s, u, remaining)) continue;
    let count = 0;
    for (let n = 1; n < remaining.length; n++) {
      if (c.cost(s, u, remaining.slice(0, n + 1)) > u.move) break;
      count = n;
    }
    if (!count) continue;
    const moved = remaining.slice(0, count + 1);
    j.index += count;
    j.lastProgress = s.turn;
    j.x = u.x = j.route[j.index].x;
    j.y = u.y = j.route[j.index].y;
    c.moved?.(s, u, moved);
    if (j.index !== j.route.length - 1) continue;
    if (j.mode === "people") {
      const h = s.households[j.household];
      h.population += j.population;
      h.x = j.x;
      h.y = j.y;
      h.home = j.destination;
      j.population = 0;
    } else {
      let h = Object.values(s.households).find(
        (h) => h.owner === j.owner && h.home === j.destination && d(h, j) === 0,
      );
      if (!h) {
        const id = `household:${s.nextId++}`;
        h = {
          id,
          owner: j.owner,
          home: j.destination,
          x: j.x,
          y: j.y,
          population: 0,
          provisions: 0,
          willing: true,
        };
        s.households[id] = h;
      }
      h.provisions += j.provisions;
      j.provisions = 0;
    }
    j.phase = "arrived";
  }
}
export function validateCivilianState(
  s: CivilianState,
  guestSeat?: string,
): void {
  const bounded = (p: Pos) =>
    integer(p.x) && integer(p.y) && p.x < s.map.width && p.y < s.map.height;
  for (const [id, h] of Object.entries(s.households))
    if (
      id !== h.id ||
      !s.players[h.owner] ||
      !bounded(h) ||
      !integer(h.population) ||
      h.population > 12 ||
      !integer(h.provisions) ||
      (!guestSeat && !s.facilities[h.home]) ||
      (guestSeat && h.owner !== guestSeat)
    )
      throw new Error("Invalid conserved household");
  for (const [id, q] of Object.entries(s.civilianConsents))
    if (
      id !== q.id ||
      !s.players[q.owner] ||
      !s.players[q.guest] ||
      q.turn > s.turn ||
      !s.facilities[q.refuge] ||
      s.facilities[q.refuge].owner !== q.owner ||
      (guestSeat && q.owner !== guestSeat && q.guest !== guestSeat)
    )
      throw new Error("Invalid refuge consent");
  const groups = new Set<string>();
  const busy = new Set<string>();
  for (const [id, j] of Object.entries(s.civilianJobs)) {
    if (
      id !== j.id ||
      !s.players[j.owner] ||
      !s.households[j.household] ||
      s.households[j.household].owner !== j.owner ||
      !bounded(j) ||
      !integer(j.population) ||
      j.population > 12 ||
      !integer(j.provisions) ||
      j.provisions > 20 ||
      j.started > s.turn ||
      j.lastProgress > s.turn ||
      !integer(j.index) ||
      j.index >= j.route.length ||
      j.route.length < 2 ||
      j.route.length > 128 ||
      j.route.some(
        (p, i) => !bounded(p) || (i > 0 && d(p, j.route[i - 1]) !== 1),
      ) ||
      d(j, j.route[j.index]) !== 0 ||
      !["travel", "lost", "arrived"].includes(j.phase) ||
      !["people", "stores"].includes(j.mode) ||
      (j.mode === "people" ? j.provisions > 0 : j.population > 0) ||
      (j.phase === "arrived" && (j.population || j.provisions)) ||
      (!guestSeat && (!s.units[j.carrier] || !s.facilities[j.destination])) ||
      (guestSeat && j.owner !== guestSeat)
    )
      throw new Error("Invalid conserved civilian transfer");
    if (j.mode === "people" && j.phase !== "arrived") {
      if (
        groups.has(j.household) ||
        s.households[j.household].population !== 0 ||
        j.population < 1
      )
        throw new Error("Duplicated civilian population");
      groups.add(j.household);
    }
    if (j.phase === "travel") {
      const u = s.units[j.carrier];
      if (
        !u ||
        u.owner !== j.owner ||
        !["worker", "company"].includes(u.kind) ||
        d(u, j) !== 0
      )
        throw new Error("Invalid active civilian carrier");
      if(Object.values(s.convoys).some(q=>q.carrier===j.carrier&&q.phase!=="lost")||Object.values(s.vessels).some(v=>v.phase!=="wreck"&&(v.crew===j.carrier||v.passenger===j.carrier||v.aboardHero===j.carrier))||Object.values(s.facilities).some(f=>f.job?.crew===j.carrier)||Object.values(s.infrastructureWork).some(q=>q.worker===j.carrier&&q.phase!=="lost")||Object.values(s.fieldworkJobs).some(q=>q.worker===j.carrier&&q.status==="working")||Object.values(s.recoveries).some(q=>q.unit===j.carrier))throw new Error("Civilian carrier has incompatible assignment");
      if (busy.has(j.carrier)) throw new Error("Duplicate civilian carrier");
      busy.add(j.carrier);
    }
  }
}
