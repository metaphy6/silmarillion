import {heavyCargoCapacity} from "./heavy-equipment";
import type { Facility, Match, Pos, Unit } from "./types";
import { recipe } from "../content/catalog";
import { activeEffects } from "./effects";
export interface PortableConsent {
  id: string;
  owner: string;
  settlement: string;
  willing: boolean;
}
export interface PortableWorkshop extends Pos {
  id: string;
  owner: string;
  origin: string;
  destination: string;
  carrier: string;
  route: Pos[];
  phase: "travel" | "lost" | "arrived";
  started: number;
  lastProgress: number;
  workshop?: Facility;
  workshopId: string;
  wearTurn?: number;
  roughTurn?: number;
}
export type PortableState = Match & {
  portableWorkshops: Record<string, PortableWorkshop>;
  portableConsents: Record<string, PortableConsent>;
};
export type PortableRequest =
  | { mode: "consent"; settlement: string; willing: boolean }
  | {
      mode: "relocate";
      workshop: string;
      origin: string;
      destination: string;
      carrier: string;
      route: Pos[];
    }
  | {
      mode: "recover";
      job: string;
      destination: string;
      carrier: string;
      route: Pos[];
    };
export interface PortableChecks {
  route: (s: Match, u: Unit, r: Pos[]) => boolean;
  busy: (id: string) => boolean;
  connected: (a: Pos, b: Pos) => boolean;
  cost: (s: Match, u: Unit, r: Pos[]) => number;
  moved?: (s: Match, u: Unit, r: Pos[]) => void;
}
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const bounded = (s: Match, p: Pos) =>
  Number.isSafeInteger(p.x) &&
  Number.isSafeInteger(p.y) &&
  p.x >= 0 &&
  p.y >= 0 &&
  p.x < s.map.width &&
  p.y < s.map.height;
const active = (s: Match, u: Unit | undefined): u is Unit =>
  !!u &&
  u.alive &&
  u.hp > 0 &&
  u.active &&
  u.supplied &&
  !activeEffects(s, u).some((e) =>
    ["stunned", "incapacitated", "rout", "root"].includes(e.kind),
  );
export const portableBusy = (s: PortableState, id: string) =>
  Object.values(s.portableWorkshops).some(
    (j) =>
      j.phase !== "arrived" &&
      ((j.phase === "travel" && j.carrier === id) ||
        j.workshop?.job?.crew === id),
  );
const consent = (s: PortableState, seat: string, id: string) => {
  const f = s.facilities[id];
  return (
    !!f &&
    f.owner === seat &&
    f.hp > 0 &&
    f.workers > 0 &&
    ["core", "depot", "refuge"].includes(f.kind) &&
    s.portableConsents[`${seat}:${id}`]?.willing === true
  );
};
function routeReason(
  s: PortableState,
  u: Unit,
  r: Pos[],
  to: Pos,
  c: PortableChecks,
) {
  return r.length < 2 ||
    r.length > 128 ||
    distance(r[0], u) !== 0 ||
    distance(r.at(-1)!, to) > 1 ||
    Object.values(s.facilities).some(
      (f) => f.hp > 0 && distance(f, r.at(-1)!) === 0,
    ) ||
    r.some(
      (p, i) => !bounded(s, p) || (i > 0 && distance(p, r[i - 1]) !== 1),
    ) ||
    new Set(r.map((p) => `${p.x},${p.y}`)).size !== r.length ||
    !c.route(s, u, r) ||
    c.cost(s, u, r) > u.move
    ? "Open normal route fitting one week required"
    : "";
}
export function portableReason(
  s: PortableState,
  seat: string,
  a: PortableRequest,
  c: PortableChecks,
): string {
  const p = s.players[seat];
  if (!p || p.eliminated) return "Active owner required";
  if (a.mode === "consent") {
    const f = s.facilities[a.settlement];
    return !f ||
      f.owner !== seat ||
      f.hp <= 0 ||
      !["core", "depot", "refuge"].includes(f.kind)
      ? "Owned settlement required"
      : "";
  }
  const j = a.mode === "recover" ? s.portableWorkshops[a.job] : undefined,
    f = a.mode === "relocate" ? s.facilities[a.workshop] : j?.workshop,
    u = s.units[a.carrier];
  if (
    !f ||
    f.owner !== seat ||
    f.kind !== "portable-workshop" ||
    f.hp <= 0 ||
    f.workers < 1 ||
    f.repair ||
    f.rest ||
    (f.job && f.job.recipe !== "equipment")
  )
    return "Existing staffed eligible portable workshop with only an ordinary equipment queue required";
  if (a.mode === "recover" && (!j || j.owner !== seat || j.phase !== "lost"))
    return "Owned lost workshop required";
  if (
    !active(s, u) ||
    u.owner !== seat ||
    !["worker", "company", "beast"].includes(u.kind) ||
    c.busy(u.id) ||
    portableBusy(s, u.id) ||
    distance(u, j ?? f) !== 0
  )
    return "Free supplied ordinary carrier at the workshop required";
  if (10 + f.workers + (f.job?.crew ? 1 : 0) > heavyCargoCapacity(s,u,20))
    return "Portable equipment and staff exceed ordinary capacity20";
  if (!consent(s, seat, a.destination))
    return "Owned staffed destination consent required";
  if (f.job?.crew) {
    const crew = s.units[f.job.crew];
    if (
      !active(s, crew) ||
      crew.owner !== seat ||
      crew.id === u.id ||
      distance(crew, j ?? f) !== 0
    )
      return "Existing paid queue crew at workshop required";
  }
  const rr = routeReason(s, u, a.route, s.facilities[a.destination], c);
  if (rr) return rr;
  if (a.mode === "relocate") {
    if (
      !consent(s, seat, a.origin) ||
      a.origin === a.destination ||
      distance(s.facilities[a.origin], f) > 1
    )
      return "Distinct consenting own origin and destination required";
    const h = s.units[p.hero.id];
    if (
      p.profile !== "elf_avari" ||
      p.hero.status !== "living" ||
      !active(s, h) ||
      p.hero.readiness < 3 ||
      p.commitment < 1 ||
      !c.connected(h, f)
    )
      return "Active Avari hero in connected region, 3 readiness and commitment required";
  }
  return p.stock.P < (a.mode === "relocate" ? 6 : 1)
    ? "5P compact plus ordinary 1P loading (recovery 1P) required"
    : "";
}
/** Parent spends one transport operation and relocation's one hero commitment.
 * Capacity20/1P loading follow ordinary transport. Equipment mass10 is provisional. */
export function applyPortable(
  s: PortableState,
  seat: string,
  a: PortableRequest,
  c: PortableChecks,
): string {
  const reason = portableReason(s, seat, a, c);
  if (reason) throw new Error(reason);
  if (a.mode === "consent") {
    const id = `${seat}:${a.settlement}`;
    s.portableConsents[id] = {
      id,
      owner: seat,
      settlement: a.settlement,
      willing: a.willing,
    };
    return id;
  }
  const p = s.players[seat];
  p.stock.P -= a.mode === "relocate" ? 6 : 1;
  if (a.mode === "recover") {
    const j = s.portableWorkshops[a.job];
    Object.assign(j, {
      destination: a.destination,
      carrier: a.carrier,
      route: structuredClone(a.route),
      phase: "travel",
      started: s.turn,
      lastProgress: s.turn - 1,
    });
    return j.id;
  }
  p.hero.readiness -= 3;
  const f = s.facilities[a.workshop],
    id = `portable:${s.nextId++}`;
  s.portableWorkshops[id] = {
    id,
    owner: seat,
    origin: a.origin,
    destination: a.destination,
    carrier: a.carrier,
    route: structuredClone(a.route),
    phase: "travel",
    started: s.turn,
    lastProgress: s.turn - 1,
    workshop: f,
    workshopId: f.id,
    x: f.x,
    y: f.y,
  };
  delete s.facilities[f.id];
  return id;
}
export function settlePortableLosses(s: PortableState): void {
  for (const j of Object.values(s.portableWorkshops)) {
    if (j.phase !== "travel") continue;
    const u = s.units[j.carrier];
    if (
      !u?.alive ||
      u.hp <= 0 ||
      u.owner !== j.owner ||
      distance(u, j) !== 0 ||
      !consent(s, j.owner, j.destination)
    )
      j.phase = "lost";
  }
}
/** Finite escrow stays on its last tile; no refund or replacement on interception. */
export function progressPortableWorkshops(
  s: PortableState,
  c: PortableChecks,
): void {
  settlePortableLosses(s);
  for (const j of Object.values(s.portableWorkshops).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (j.phase !== "travel" || j.lastProgress >= s.turn) continue;
    j.lastProgress = s.turn;
    const u = s.units[j.carrier],
      f = j.workshop!,
      to = s.facilities[j.destination],
      crew = f.job?.crew ? s.units[f.job.crew] : undefined;
    if (
      !active(s, u) ||
      !to ||
      !!s.facilities[f.id] ||
      routeReason(s, u, j.route, to, c) ||
      f.hp <= 0 ||
      (f.job?.crew &&
        (!active(s, crew) || crew.owner !== j.owner || distance(crew, j) !== 0))
    ) {
      j.phase = "lost";
      continue;
    }
    // Provisional ordinary rough-track wear: four HP on the first entered
    // woodland tile. Roads are distinct terrain and incur no such wear.
    const rough = j.route
      .slice(1)
      .find((p) => s.map.terrain[p.y * s.map.width + p.x] === "woodland");
    if (rough) {
      u.x = j.x = f.x = rough.x;
      u.y = j.y = f.y = rough.y;
      if (crew) {
        crew.x = rough.x;
        crew.y = rough.y;
      }
      applyPortableWear(s, j.id, 4, "rough-road");
      if (f.hp <= 0) {
        c.moved?.(s, u, j.route.slice(0, j.route.indexOf(rough) + 1));
        continue;
      }
    }
    const end = j.route.at(-1)!;
    u.x = j.x = end.x;
    u.y = j.y = end.y;
    f.x = j.x;
    f.y = j.y;
    c.moved?.(s, u, j.route);
    if (
      !u.alive ||
      u.hp <= 0 ||
      u.owner !== j.owner ||
      f.hp <= 0 ||
      j.phase !== "travel"
    ) {
      j.phase = "lost";
      continue;
    }
    if (crew) {
      crew.x = end.x;
      crew.y = end.y;
    }
    f.x = end.x;
    f.y = end.y;
    s.facilities[f.id] = f;
    delete j.workshop;
    j.phase = "arrived";
  }
}
/** A real rough-road event only; never changes combat damage or transport fees. */
export function applyPortableWear(
  s: PortableState,
  id: string,
  amount: number,
  kind: "rough-road" | "combat",
): number {
  const j = s.portableWorkshops[id];
  if (
    !j?.workshop ||
    j.phase !== "travel" ||
    !Number.isFinite(amount) ||
    amount < 0
  )
    return 0;
  if (amount === 0) return 0;
  const p = s.players[j.owner],
    h = s.units[p.hero.id];
  let wear = amount;
  if (
    kind === "rough-road" &&
    j.roughTurn !== s.turn &&
    p.profile === "elf_avari" &&
    p.hero.status === "living" &&
    active(s, h) &&
    distance(h, j) === 0 &&
    !Object.values(s.portableWorkshops).some(
      (q) => q.owner === j.owner && q.wearTurn === s.turn,
    )
  ) {
    wear *= 0.75;
    j.wearTurn = s.turn;
  }
  if (kind === "rough-road" && amount > 0) j.roughTurn = s.turn;
  const actual = Math.min(j.workshop.hp, wear);
  j.workshop.hp -= actual;
  if (j.workshop.hp <= 0) j.phase = "lost";
  return actual;
}
export function validatePortableState(
  s: PortableState,
  guestSeat?: string,
): void {
  const fail = () => {
      throw new Error("Invalid portable workshop conservation");
    },
    identities = new Set<string>(),
    carriers = new Set<string>(),
    jobs = new Set<string>();
  for (const [id, c] of Object.entries(s.portableConsents)) {
    const f = s.facilities[c.settlement];
    if (
      id !== c.id ||
      id !== `${c.owner}:${c.settlement}` ||
      !s.players[c.owner] ||
      typeof c.willing !== "boolean" ||
      !f ||
      (guestSeat && c.owner !== guestSeat)
    )
      fail();
  }
  for (const [id, j] of Object.entries(s.portableWorkshops)) {
    if (
      id !== j.id ||
      !s.players[j.owner] ||
      s.players[j.owner].profile !== "elf_avari" ||
      (guestSeat && j.owner !== guestSeat) ||
      !bounded(s, j) ||
      !["travel", "lost", "arrived"].includes(j.phase) ||
      !Number.isSafeInteger(j.started) ||
      j.started < 1 ||
      j.started > s.turn ||
      !Number.isSafeInteger(j.lastProgress) ||
      j.lastProgress < j.started - 1 ||
      j.lastProgress > s.turn ||
      (j.wearTurn !== undefined &&
        (!Number.isSafeInteger(j.wearTurn) ||
          j.wearTurn < 1 ||
          j.wearTurn > s.turn)) ||
      (j.roughTurn !== undefined &&
        (!Number.isSafeInteger(j.roughTurn) ||
          j.roughTurn < 1 ||
          j.roughTurn > s.turn)) ||
      j.route.length < 2 ||
      j.route.length > 128 ||
      j.route.some(
        (p, i) =>
          !bounded(s, p) || (i > 0 && distance(p, j.route[i - 1]) !== 1),
      )
    )
      fail();
    const f = j.workshop,
      u = s.units[j.carrier];
    if (j.phase === "arrived") {
      if (f) fail();
      continue;
    }
    if (
      !f ||
      f.id !== j.workshopId ||
      f.owner !== j.owner ||
      f.kind !== "portable-workshop" ||
      s.facilities[f.id] ||
      identities.has(f.id) ||
      !Number.isSafeInteger(f.workers) ||
      f.workers < 1 ||
      // Stranded cargo has no current carrier. Its conserved mass must remain
      // bounded, independent of a former carrier's later load or disappearance.
      (j.phase === "travel" && !u) ||
      10 + f.workers + (f.job?.crew ? 1 : 0) >
        (j.phase === "travel" && u ? heavyCargoCapacity(s,u,20) : 20) ||
      distance(f, j) !== 0 ||
      !Number.isFinite(f.hp) ||
      f.hp < 0 ||
      f.hp > f.maxHp ||
      f.repair ||
      f.rest
    )
      fail();
    identities.add(j.workshopId);
    if (f?.job) {
      const r = recipe(s.players[j.owner].profile, "equipment")!;
      if (
        Object.keys(f.job.cost).sort().join(",") !== "E,K,M,P" ||
        (["P", "M", "K", "E"] as const).some(
          (k) => f.job!.cost[k] !== r.cost[k],
        ) ||
        f.job.supply !== r.supply ||
        f.job.great !== r.great ||
        f.job.binding !== r.binding ||
        !Number.isSafeInteger(f.job.started) ||
        f.job.started < 1 ||
        f.job.started > s.turn ||
        f.job.remaining > r.turns ||
        f.job.recipe !== "equipment" ||
        jobs.has(f.job.id) ||
        Object.values(s.facilities).some((q) => q.job?.id === f.job!.id) ||
        !Number.isSafeInteger(f.job.remaining) ||
        f.job.remaining < 1
      )
        fail();
      jobs.add(f.job.id);
    }
    if (j.phase === "travel") {
      if (
        !u ||
        !u.alive ||
        u.hp <= 0 ||
        u.owner !== j.owner ||
        distance(u, j) !== 0 ||
        distance(j, j.route[0]) !== 0 ||
        carriers.has(j.carrier) ||
        !["worker", "company", "beast"].includes(u.kind)
      )
        fail();
      carriers.add(j.carrier);
    }
  }
}
