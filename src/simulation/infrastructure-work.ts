import {shiftCanWork,markShiftWorked} from "./night-work";
import {recordPatrolMovement} from "./patrols";
import { stocks, type Match, type Pos, type Stock, type Unit } from "./types";
import { movementPenalty } from "./conditions";
import { fatigueMovementPenalty, travelFatigue } from "./fatigue";
import { activeEffects } from "./effects";
import { movementZonePenalty, crossZones } from "./zones";
export interface InfrastructureSite extends Pos {
  id: string;
  owner: string;
  kind: "shaft" | "haulway" | "channel" | "wreck";
  blocked: boolean;
  originalCapacity: number;
  material: "stone" | "timber" | "silt" | "debris";
  yield: Stock;
  claimedBy?: string;
  consumed: boolean;
}
export interface InfrastructureJob {
  id: string;
  owner: string;
  site: string;
  worker: string;
  facility: string;
  kind: "clear" | "salvage";
  remaining: number;
  started: number;
  lastProgress: number;
  cost: Stock;
  boost?: { turn: number; mode: "finish" | "advance" };
  accelerated: boolean;
  phase: "work" | "haul" | "lost";
  route: Pos[];
  index: number;
  cargo: Stock;
}
export type InfrastructureState = Match & {
  infrastructureSites: Record<string, InfrastructureSite>;
  infrastructureWork: Record<string, InfrastructureJob>;
};
export interface InfrastructureRequest {
  site: string;
  worker: string;
  facility: string;
}
export type InfrastructureRoute = (
  s: Match,
  a: Pos,
  b: Pos,
  u?: Unit,
) => Pos[] | null;
const keys = ["P", "M", "K", "E"] as const;
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const stockValid = (v: Stock) =>
  Object.keys(v).sort().join(",") === "E,K,M,P" &&
  keys.every((k) => Number.isSafeInteger(v[k]) && v[k] >= 0 && v[k] <= 10000);
const cost = () => stocks(5, 10);
export function isInfrastructureWorker(
  s: InfrastructureState,
  id: string,
): boolean {
  return Object.values(s.infrastructureWork ?? {}).some(
    (j) => j.worker === id && j.phase !== "lost",
  );
}
export function infrastructureBlocked(
  s: InfrastructureState,
  pos: Pos,
  mode: "land" | "sea",
): boolean {
  return Object.values(s.infrastructureSites ?? {}).some(
    (site) =>
      site.blocked &&
      site.kind !== "wreck" &&
      (mode === "sea" ? site.kind === "channel" : site.kind !== "channel") &&
      distance(site, pos) === 0,
  );
}
function usable(
  s: InfrastructureState,
  j: Pick<InfrastructureJob, "owner" | "site" | "worker" | "facility">,
  route: InfrastructureRoute,
): string {
  const site = s.infrastructureSites[j.site],
    u = s.units[j.worker],
    f = s.facilities[j.facility];
  if (
    !site ||
    site.owner !== j.owner ||
    !u?.alive ||
    !u.active ||
    !u.supplied ||
    u.owner !== j.owner ||
    u.kind !== "worker"
  )
    return "Existing owned site and supplied working crew required";
  if (!f || f.owner !== j.owner || f.hp <= 0 || f.workers < 1)
    return "Owned staffed receiving worksite required";
  if (!route(s, u, f, u))
    return "Safe return and material delivery route required";
  return "";
}
export function infrastructureReason(
  s: InfrastructureState,
  seat: string,
  a: InfrastructureRequest,
  route: InfrastructureRoute,
): string {
  const site = s.infrastructureSites?.[a.site],
    p = s.players[seat],
    u = s.units[a.worker],
    f = s.facilities[a.facility];
  if (!p || p.eliminated || !site)
    return "Existing authored infrastructure site required";
  if (site.consumed) return "Finite wreck already consumed";
  const reason = usable(s, { ...a, owner: seat }, route);
  if (reason) return reason;
  if (site.kind !== "wreck" && !site.blocked)
    return "Original route is already clear";
  if (distance(u, site) > 1)
    return "Worker must physically reach the existing worksite";
  if (site.claimedBy && site.claimedBy !== seat)
    return "Wreck is claimed by another owner";
  if (
    isInfrastructureWorker(s, u.id) ||
    Object.values(s.infrastructureWork).some((j) => j.site === site.id)
  )
    return "Existing project already reserves worker or site";
  if (site.kind === "wreck" && f.kind !== "foundry")
    return "Receiving staffed foundry queue required";
  if (site.kind === "channel" && f.kind !== "harbor")
    return "Existing staffed harbor required";
  if (
    f.job ||
    f.repair ||
    f.rest ||
    Object.values(s.infrastructureWork).some((j) => j.facility === f.id)
  )
    return "Receiving worksite queue occupied";
  if (site.kind !== "wreck" && keys.some((k) => site.yield[k] !== 0))
    return "Route debris must never create resource stocks";
  if (keys.some((k) => p.stock[k] < cost()[k]))
    return "Normal project requires 5P and 10M (provisional)";
  return "";
}
/** Ordinary two-week project recipe5P10M is provisional. Sites and yields must
 * already exist in authored scenario state; commands cannot create them. */
export function startInfrastructureWork(
  s: InfrastructureState,
  seat: string,
  a: InfrastructureRequest,
  route: InfrastructureRoute,
): InfrastructureJob {
  const reason = infrastructureReason(s, seat, a, route);
  if (reason) throw new Error(reason);
  const p = s.players[seat],
    site = s.infrastructureSites[a.site],
    u = s.units[a.worker];
  for (const k of keys) p.stock[k] -= cost()[k];
  site.claimedBy = seat;
  const j: InfrastructureJob = {
    id: `work:${s.nextId++}`,
    owner: seat,
    site: a.site,
    worker: a.worker,
    facility: a.facility,
    kind: site.kind === "wreck" ? "salvage" : "clear",
    remaining: 2,
    started: s.turn,
    lastProgress: s.turn - 1,
    cost: cost(),
    accelerated: false,
    phase: "work",
    route: route(s, u, s.facilities[a.facility], u)!.map((p) => ({
      x: p.x,
      y: p.y,
    })),
    index: 0,
    cargo: stocks(),
  };
  s.infrastructureWork[j.id] = j;
  return j;
}
export function infrastructurePowerReason(
  s: InfrastructureState,
  seat: string,
  job: string,
  route: InfrastructureRoute,
): string {
  const j = s.infrastructureWork[job],
    p = s.players[seat],
    h = p && s.units[p.hero.id],
    site = j && s.infrastructureSites[j.site];
  if (!j || j.owner !== seat || j.phase !== "work" || !site)
    return "Existing funded worker project required";
  const reason = usable(s, j, route);
  if (reason) return reason;
  if (
    p.hero.status !== "living" ||
    !h?.alive ||
    !h.active ||
    p.hero.readiness < 3 ||
    p.commitment < 1
  )
    return "Living hero, 3 readiness and weekly commitment required";
  if (!route(s, h, s.units[j.worker], h))
    return "Hero and project must share safe connected access";
  const mapping: Record<string, string> = {
    dwarf_khazad_dum: "shaft",
    troll_hold: "haulway",
    osse: "channel",
    orc_fortress_clan: "wreck",
  };
  const expected = mapping[p.profile];
  if (site.kind !== expected)
    return "This power does not apply to this authored project";
  if (
    p.profile === "troll_hold" &&
    (distance(h, site) > 1 || !["stone", "timber"].includes(site.material))
  )
    return "Troll must be in physical contact with the ordinary stone or timber obstruction";
  if (p.profile === "osse" && !["silt", "debris"].includes(site.material))
    return "Existing silted or debris-blocked harbor channel required";
  if (
    p.profile === "orc_fortress_clan" &&
    (j.started >= s.turn || j.accelerated)
  )
    return "One older salvage job not previously advanced required";
  if (j.boost?.turn === s.turn)
    return "Project already has a weekly power assignment";
  const payment = powerCost(p.profile);
  if (keys.some((k) => p.stock[k] < payment[k]))
    return "Insufficient adopted project power supplies";
  return "";
}
function powerCost(profile: string): Stock {
  return profile === "dwarf_khazad_dum"
    ? stocks(0, 10)
    : profile === "troll_hold"
      ? stocks(5, 5)
      : profile === "osse"
        ? stocks(0, 20)
        : stocks(5);
}
export function applyInfrastructurePower(
  s: InfrastructureState,
  seat: string,
  job: string,
  route: InfrastructureRoute,
): void {
  const reason = infrastructurePowerReason(s, seat, job, route);
  if (reason) throw new Error(reason);
  const p = s.players[seat],
    j = s.infrastructureWork[job];
  for (const k of keys) p.stock[k] -= powerCost(p.profile)[k];
  p.hero.readiness -= 3;
  j.boost = {
    turn: s.turn,
    mode: ["dwarf_khazad_dum", "troll_hold"].includes(p.profile)
      ? "finish"
      : "advance",
  };
  if (p.profile === "orc_fortress_clan") j.accelerated = true;
}
export function progressInfrastructureWork(
  s: InfrastructureState,
  route: InfrastructureRoute,
): void {
  for (const j of Object.values(s.infrastructureWork).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (j.phase === "lost" || j.lastProgress >= s.turn) continue;
    j.lastProgress = s.turn;
    const site = s.infrastructureSites[j.site],
      u = s.units[j.worker],
      f = s.facilities[j.facility];
    if (!u?.alive || u.owner !== j.owner) {
      j.phase = "lost";
      continue;
    }
    if (usable(s, j, route)) continue;
    if (j.phase === "work") {
      if (distance(u, site) > 1 || site.consumed || !shiftCanWork(s,j.id)) continue;
      markShiftWorked(s,j.id);
      const hero = s.units[s.players[j.owner].hero.id];
      const supported =
        s.players[j.owner].hero.status === "living" &&
        hero?.alive &&
        hero.active &&
        Boolean(route(s, hero, u, hero)) &&
        (s.players[j.owner].profile !== "troll_hold" ||
          distance(hero, site) <= 1);
      const boost = j.boost?.turn === s.turn && supported ? j.boost : undefined;
      if (boost?.mode === "finish") j.remaining = 0;
      else j.remaining -= boost?.mode === "advance" ? 2 : 1;
      if (j.remaining > 0) continue;
      j.remaining = 0;
      if (j.kind === "clear") {
        site.blocked = false;
        delete s.infrastructureWork[j.id];
        continue;
      }
      site.consumed = true;
      j.cargo = { ...site.yield };
      j.phase = "haul";
      j.route = route(s, u, f, u)!.map((p) => ({ x: p.x, y: p.y }));
      j.index = 0;
      continue;
    }
    const remaining = j.route.slice(j.index),
      open = route(s, u, f, u);
    if (
      !open ||
      JSON.stringify(open) !== JSON.stringify(remaining) ||
      activeEffects(s, u).some((e) => e.kind === "root")
    )
      continue;
    const budget = Math.max(
      0,
      Math.floor(
        Math.min(
          Math.max(
            1,
            u.move - movementPenalty(s, u) - fatigueMovementPenalty(s, u),
          ),
          ...activeEffects(s, u)
            .filter((e) => e.kind === "move-limit")
            .map((e) => e.value),
        ),
      ),
    );
    let steps = Math.min(budget, remaining.length - 1);
    while (
      steps > 0 &&
      steps + movementZonePenalty(s, u, remaining.slice(0, steps + 1)) > budget
    )
      steps--;
    if (steps) {
      crossZones(s, u, remaining.slice(0, steps + 1));
      const next = remaining[steps];
      travelFatigue(s, u, u, next);
      u.x = next.x;
      u.y = next.y;
      recordPatrolMovement(s,u,remaining.slice(0,steps+1));
      j.index += steps;
    }
    if (j.index === j.route.length - 1) {
      for (const k of keys) s.players[j.owner].stock[k] += j.cargo[k];
      delete s.infrastructureWork[j.id];
    }
  }
}
export function validateInfrastructureState(s: InfrastructureState): void {
  const bounded = (p: Pos) =>
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < s.map.width &&
    p.y < s.map.height;
  for (const [id, site] of Object.entries(s.infrastructureSites))
    if (
      id !== site.id ||
      !s.players[site.owner] ||
      !bounded(site) ||
      !["shaft", "haulway", "channel", "wreck"].includes(site.kind) ||
      !stockValid(site.yield) ||
      !Number.isInteger(site.originalCapacity) ||
      site.originalCapacity < 1 ||
      site.originalCapacity > 20 ||
      (site.kind !== "wreck" && keys.some((k) => site.yield[k] !== 0))
    )
      throw new Error("Invalid authored infrastructure site");
  const workers = new Set<string>(),
    sites = new Set<string>();
  for (const [id, j] of Object.entries(s.infrastructureWork)) {
    const site = s.infrastructureSites[j.site];
    if (
      id !== j.id ||
      !site ||
      !s.players[j.owner] ||
      !s.units[j.worker] ||
      !s.facilities[j.facility] ||
      site.owner !== j.owner ||
      site.claimedBy !== j.owner ||
      !stockValid(j.cargo) ||
      !stockValid(j.cost) ||
      keys.some((k) => j.cost[k] !== cost()[k]) ||
      !Number.isInteger(j.remaining) ||
      j.remaining < 0 ||
      j.remaining > 2 ||
      !Number.isInteger(j.started) ||
      !Number.isInteger(j.lastProgress) ||
      j.started < 1 ||
      j.started > s.turn ||
      j.lastProgress < j.started - 1 ||
      j.lastProgress > s.turn ||
      workers.has(j.worker) ||
      sites.has(j.site) ||
      !j.route.length ||
      !Number.isInteger(j.index) ||
      j.index < 0 ||
      j.index >= j.route.length ||
      !j.route.every(
        (p, i) => bounded(p) && (i === 0 || distance(p, j.route[i - 1]) === 1),
      ) ||
      j.kind !== (site.kind === "wreck" ? "salvage" : "clear") ||
      (j.phase === "work" && keys.some((k) => j.cargo[k] !== 0)) ||
      (j.phase === "haul" &&
        (!site.consumed || keys.some((k) => j.cargo[k] !== site.yield[k])))
    )
      throw new Error("Invalid funded infrastructure project");
    if (
      !["work", "haul", "lost"].includes(j.phase) ||
      (j.boost &&
        (!Number.isInteger(j.boost.turn) ||
          j.boost.turn < j.started ||
          j.boost.turn > s.turn ||
          j.boost.mode !==
            (["dwarf_khazad_dum", "troll_hold"].includes(
              s.players[j.owner].profile,
            )
              ? "finish"
              : "advance"))) ||
      (j.phase === "haul" &&
        distance(s.units[j.worker], j.route[j.index]) !== 0) ||
      (j.phase === "lost" &&
        keys.some((k) => j.cargo[k] !== (site.consumed ? site.yield[k] : 0)))
    )
      throw new Error("Invalid infrastructure progress state");
    workers.add(j.worker);
    sites.add(j.site);
  }
}
