import { activeEffects } from "./effects";
import type { Match, Unit, Pos, Stock } from "./types";
import { stocks } from "./types";
import { effectiveRelation } from "./diplomacy";
export interface CareQueue {
  id: string;
  owner: string;
  unit: string;
  facility?: string;
  shelter?: string;
  location: Pos;
  injury: string;
  remaining: number;
  started: number;
  lastProgress: number;
  cost: Stock;
  method: "ordinary" | "este";
  accelerated: boolean;
  treatedBy?: string;
  evacuationUsed?: boolean;
}
export type RecoveryState = Match;
export type CareConnection = (start: Pos, end: Pos) => boolean;
const noConnection: CareConnection = () => false;
const shelterKinds = ["core", "refuge", "medicine-nursery"];
export interface CareRequest {
  unit: string;
  facility?: string;
  method?: "ordinary" | "este";
}
export interface CarePower {
  mode: "finarfin" | "grove";
  facility: string;
  units: string[];
}
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const wound = (s: Match, u: Unit) =>
  u.effects.find((e) => e.kind === "recovery-wound" && e.until > s.revision);
/** Provisional: one noncritical persistent injury after a >=25% nonfatal hit.
 * Normal care takes two weekly advances, costs 5P/2M, never restores casualties. */
export function recordRecoverableInjury(
  s: RecoveryState,
  u: Unit,
  hit: number,
) {
  if (
    !u.alive ||
    u.hp <= 0 ||
    u.kind === "construct" ||
    !Number.isFinite(hit) ||
    hit <= 0
  )
    return;
  for (const [id, q] of Object.entries(s.recoveries))
    if (q.unit === u.id) delete s.recoveries[id];
  if (hit < Math.ceil(u.maxHp / 4) || wound(s, u)) return;
  u.effects.push({
    kind: "recovery-wound",
    value: 1,
    until: 1000000,
    source: `care-injury:${u.id}:${s.turn}:${s.revision}`,
  });
}
function threatened(s: Match, owner: string, p: Pos) {
  return Object.values(s.units).some(
    (u) =>
      u.alive &&
      u.active &&
      effectiveRelation(s, owner, u.owner) === "war" &&
      distance(u, p) <= 2,
  );
}
export function careReason(
  s: RecoveryState,
  seat: string,
  a: CareRequest,
  connected: CareConnection = noConnection,
): string {
  const p = s.players[seat],
    u = s.units[a.unit],
    f = a.facility ? s.facilities[a.facility] : undefined;
  if (
    !p ||
    !u?.alive ||
    !u.active ||
    u.owner !== seat ||
    u.kind === "construct" ||
    !u.supplied
  )
    return "Existing own supplied living patient required";
  if (!wound(s, u)) return "An existing recoverable injury is required";
  if (Object.values(s.recoveries).some((q) => q.unit === u.id))
    return "Patient already occupies a recovery queue";
  if (p.stock.P < 5 || p.stock.M < 2) return "Normal care requires 5P and 2M";
  if (threatened(s, seat, u)) return "Sheltered uninterrupted rest required";
  if (a.method === "este") {
    const h = s.units[p.hero.id];
    if (
      p.profile !== "este" ||
      p.hero.status !== "living" ||
      !h?.alive ||
      !h.active ||
      p.hero.readiness < 3 ||
      p.commitment < 1
    )
      return "Living Este, three readiness and personal commitment required";
    if (!connected(h, u))
      return "Hero and resting party need one connected region";
    if (
      !Object.values(s.facilities).some(
        (v) =>
          v.owner === seat &&
          v.hp > 0 &&
          shelterKinds.includes(v.kind) &&
          distance(v, u) <= 1,
      )
    )
      return "Existing shelter required even without a recovery facility";
  } else {
    if (
      !f ||
      f.owner !== seat ||
      f.hp <= 0 ||
      f.workers < 1 ||
      !["refuge", "medicine-nursery"].includes(f.kind) ||
      distance(f, u) > 1
    )
      return "Patient must reach a staffed recovery facility";
    if (
      f.job ||
      f.repair ||
      f.rest ||
      (Object.values(s.recoveries).some((q) => q.facility === f.id) &&
        f.kind !== "medicine-nursery")
    )
      return "Recovery facility occupied";
    if (
      Object.values(s.recoveries).filter((q) => q.facility === f.id).length >= 2
    )
      return "Nursery capacity occupied";
  }
  return "";
}
export function startCare(
  s: RecoveryState,
  seat: string,
  a: CareRequest,
  connected: CareConnection = noConnection,
) {
  const reason = careReason(s, seat, a, connected);
  if (reason) throw new Error(reason);
  const p = s.players[seat],
    u = s.units[a.unit];
  p.stock.P -= 5;
  p.stock.M -= 2;
  const method = a.method ?? "ordinary";
  if (method === "este") p.hero.readiness -= 3;
  const id = `care:${s.nextId++}`;
  s.recoveries[id] = {
    id,
    owner: seat,
    unit: u.id,
    ...(method === "ordinary" && a.facility ? { facility: a.facility } : {}),
    ...(method === "este"
      ? {
          shelter: Object.values(s.facilities).find(
            (v) =>
              v.owner === seat &&
              v.hp > 0 &&
              shelterKinds.includes(v.kind) &&
              distance(v, u) <= 1,
          )!.id,
        }
      : {}),
    location: { x: u.x, y: u.y },
    injury: wound(s, u)!.source,
    remaining: method === "este" ? 1 : 2,
    started: s.turn,
    lastProgress: s.turn - 1,
    cost: stocks(5, 2),
    method,
    accelerated: false,
    ...((p.profile === "este" ||
      (p.profile === "istari_grove" &&
        a.facility &&
        s.facilities[a.facility]?.kind === "medicine-nursery")) &&
    careHero(s, p.hero.id) &&
    distance(s.units[p.hero.id], u) <= 1
      ? { treatedBy: p.hero.id }
      : {}),
  };
}
export function carePowerReason(
  s: RecoveryState,
  seat: string,
  a: CarePower,
  connected: CareConnection = noConnection,
): string {
  const p = s.players[seat],
    f = s.facilities[a.facility];
  if (
    !p ||
    p.profile !== (a.mode === "grove" ? "istari_grove" : "elf_finarfin") ||
    p.hero.status !== "living" ||
    p.hero.readiness < 3 ||
    p.commitment < 1
  )
    return "Living matching hero, readiness and commitment required";
  if (
    !f ||
    f.owner !== seat ||
    f.hp <= 0 ||
    f.workers < 1 ||
    f.kind !== (a.mode === "grove" ? "medicine-nursery" : "refuge")
  )
    return "Matching staffed recovery site required";
  const h = s.units[p.hero.id];
  if (!h?.alive || !h.active || !connected(h, f))
    return "Living active hero and recovery site need one connected region";
  if (
    !a.units.length ||
    a.units.length > (a.mode === "grove" ? 2 : 1) ||
    new Set(a.units).size !== a.units.length
  )
    return "Select distinct existing patients within power limit";
  for (const id of a.units) {
    const u = s.units[id],
      q = Object.values(s.recoveries).find(
        (q) => q.unit === id && q.facility === f.id,
      );
    if (
      !u?.alive ||
      u.owner !== seat ||
      !u.supplied ||
      (a.mode === "finarfin"
        ? u.kind !== "company"
        : !["company", "worker"].includes(u.kind)) ||
      distance(u, f) > 1 ||
      !q ||
      q.accelerated ||
      q.remaining < 2
    )
      return "Own ordinary company needs an existing unaccelerated recovery schedule";
  }
  if (
    p.stock.P < (a.mode === "grove" ? 10 : 5) ||
    p.stock.M < (a.mode === "grove" ? 10 : 0) ||
    p.stock.K < (a.mode === "finarfin" ? 5 : 0)
  )
    return "Required care power stocks unavailable";
  return "";
}
export function accelerateCare(
  s: RecoveryState,
  seat: string,
  a: CarePower,
  connected: CareConnection = noConnection,
) {
  const reason = carePowerReason(s, seat, a, connected);
  if (reason) throw new Error(reason);
  const p = s.players[seat];
  p.hero.readiness -= 3;
  p.stock.P -= a.mode === "grove" ? 10 : 5;
  if (a.mode === "grove") p.stock.M -= 10;
  else p.stock.K -= 5;
  for (const q of Object.values(s.recoveries))
    if (a.units.includes(q.unit) && q.facility === a.facility)
      q.accelerated = true;
}
export function progressCare(s: RecoveryState) {
  for (const [id, q] of Object.entries(s.recoveries)) {
    const u = s.units[q.unit],
      f = q.facility ? s.facilities[q.facility] : undefined;
    if (
      !u?.alive ||
      !u.active ||
      u.owner !== q.owner ||
      distance(u, q.location) !== 0 ||
      !wound(s, u) ||
      wound(s, u)!.source !== q.injury
    ) {
      delete s.recoveries[id];
      continue;
    }
    if (q.lastProgress >= s.turn) continue;
    if (
      !u.supplied ||
      threatened(s, q.owner, u) ||
      (q.shelter &&
        (!s.facilities[q.shelter] ||
          s.facilities[q.shelter].owner !== q.owner ||
          s.facilities[q.shelter].hp <= 0 ||
          distance(s.facilities[q.shelter], u) > 1)) ||
      (q.facility && (!f || f.owner !== q.owner || f.hp <= 0 || f.workers < 1))
    ) {
      q.accelerated = false;
      continue;
    }
    q.lastProgress = s.turn;
    q.remaining -= q.accelerated ? 2 : 1;
    q.accelerated = false;
    if (q.remaining <= 0) {
      u.effects = u.effects.filter((e) => e.source !== q.injury);
      delete s.recoveries[id];
    }
  }
}

export function recoveryInvariant(s: Match, guestSeat?: string): void {
  const used = new Set<string>(),
    sites: Record<string, number> = {};
  for (const [id, q] of Object.entries(s.recoveries)) {
    const u = s.units[q.unit],
      p = s.players[q.owner],
      f = q.facility ? s.facilities[q.facility] : undefined;
    if (
      id !== q.id ||
      !p ||
      (guestSeat && q.owner !== guestSeat) ||
      !u ||
      u.owner !== q.owner ||
      used.has(u.id) ||
      q.remaining < 1 ||
      q.remaining > 2 ||
      q.started < 1 ||
      q.started > s.turn ||
      q.lastProgress < q.started - 1 ||
      q.lastProgress > s.turn ||
      q.location.x < 0 ||
      q.location.y < 0 ||
      q.location.x >= s.map.width ||
      q.location.y >= s.map.height ||
      JSON.stringify(q.cost) !== JSON.stringify(stocks(5, 2)) ||
      !q.injury.startsWith("care-injury:")
    )
      throw new Error("Invalid recovery checkpoint");
    if (u.alive && (!wound(s, u) || wound(s, u)!.source !== q.injury))
      throw new Error("Recovery patient lacks the recorded injury");
    used.add(u.id);
    if (q.method === "ordinary") {
      if (
        !f ||
        !["refuge", "medicine-nursery"].includes(f.kind) ||
        f.job ||
        f.repair ||
        f.rest ||
        q.shelter
      )
        throw new Error("Invalid recovery facility reservation");
      sites[f.id] = (sites[f.id] ?? 0) + 1;
      if (sites[f.id] > (f.kind === "medicine-nursery" ? 2 : 1))
        throw new Error("Recovery capacity exceeded");
    } else if (
      q.method !== "este" ||
      p.profile !== "este" ||
      !q.shelter ||
      !s.facilities[q.shelter] ||
      !shelterKinds.includes(s.facilities[q.shelter].kind) ||
      q.facility ||
      q.remaining !== 1 ||
      q.accelerated
    )
      throw new Error("Invalid Este care");
    if (
      q.treatedBy &&
      (q.treatedBy !== p.hero.id ||
        !["este", "istari_grove"].includes(p.profile) ||
        !s.units[q.treatedBy])
    )
      throw new Error("Invalid personal treatment provenance");
    if (
      q.evacuationUsed !== undefined &&
      (q.evacuationUsed !== true ||
        !q.treatedBy ||
        !u.effects.some(
          (e) => e.kind === "care-evacuated" && e.source === q.injury,
        ))
    )
      throw new Error("Invalid retained evacuation step");
    if (q.accelerated && !["istari_grove", "elf_finarfin"].includes(p.profile))
      throw new Error("Invalid accelerated care");
  }
}

export interface CareEvacuationRequest {
  care: string;
  destination: string;
  route: Pos[];
}
export interface CareEvacuationChecks {
  route: (s: Match, u: Unit, route: Pos[]) => boolean;
  cost: (s: Match, u: Unit, route: Pos[]) => number;
  moved?: (s: Match, u: Unit, route: Pos[]) => void;
}
const careHero = (s: Match, id: string) => {
  const h = s.units[id],
    p = h && s.players[h.owner];
  return (
    !!h &&
    h.alive &&
    h.active &&
    h.hp > 0 &&
    p.hero.status === "living" &&
    p.hero.id === id &&
    !activeEffects(s, h).some((e) =>
      ["stunned", "incapacitated"].includes(e.kind),
    )
  );
};
export function careEvacuationReason(
  s: Match,
  seat: string,
  a: CareEvacuationRequest,
  c: CareEvacuationChecks,
): string {
  const q = s.recoveries[a.care],
    p = s.players[seat],
    u = q && s.units[q.unit],
    f = s.facilities[a.destination];
  if (
    !p ||
    p.eliminated ||
    !q ||
    q.owner !== seat ||
    !u?.alive ||
    !u.active ||
    !u.supplied ||
    u.owner !== seat ||
    !["company", "worker"].includes(u.kind) ||
    distance(u, q.location) !== 0 ||
    wound(s, u)?.source !== q.injury
  )
    return "Existing ordinary patient at its paid care location required";
  if (
    !f ||
    f.owner !== seat ||
    f.hp <= 0 ||
    f.workers < 1 ||
    !["refuge", "medicine-nursery"].includes(f.kind) ||
    a.destination === (q.facility ?? q.shelter)
  )
    return "Different staffed owned receiving care facility required";
  if (
    f.job ||
    f.repair ||
    f.rest ||
    Object.values(s.recoveries).filter((v) => v.facility === f.id).length >=
      (f.kind === "medicine-nursery" ? 2 : 1)
  )
    return "Receiving care facility occupied";
  const r = a.route;
  if (
    r.length < 2 ||
    r.length > 128 ||
    distance(r[0], u) !== 0 ||
    distance(r.at(-1)!, f) > 1 ||
    r.some(
      (p, i) =>
        !Number.isSafeInteger(p.x) ||
        !Number.isSafeInteger(p.y) ||
        p.x < 0 ||
        p.y < 0 ||
        p.x >= s.map.width ||
        p.y >= s.map.height ||
        (i > 0 && distance(p, r[i - 1]) !== 1),
    ) ||
    !c.route(s, u, r) ||
    c.cost(s, u, r) > u.move ||
    activeEffects(s, u).some((e) =>
      ["root", "stunned", "incapacitated", "rout"].includes(e.kind),
    )
  )
    return "Ordinary open evacuation route within available movement required";
  return p.stock.P < 2 ? "Normal evacuation requires 2P travel provisions" : "";
}
/** Parent spends one normal operation and supplies normal movement/fatigue hooks.
 * Paid care remains reserved; travel performs no healing or readiness recovery.
 * Provisional ordinary relocation costs2P and loses one existing recovery step. */
export function applyCareEvacuation(
  s: Match,
  seat: string,
  a: CareEvacuationRequest,
  c: CareEvacuationChecks,
): void {
  const reason = careEvacuationReason(s, seat, a, c);
  if (reason) throw new Error(reason);
  const q = s.recoveries[a.care],
    u = s.units[q.unit],
    p = s.players[seat],
    h = q.treatedBy ? s.units[q.treatedBy] : undefined;
  const first = !u.effects.some(
    (e) => e.kind === "care-evacuated" && e.source === q.injury,
  );
  const retain =
    q.method === "ordinary" &&
    q.remaining === 1 &&
    first &&
    !!h &&
    careHero(s, h.id) &&
    !h.effects.some(
      (e) => e.kind === "care-evacuation-used" && e.source === `care:${s.turn}`,
    ) &&
    (p.profile === "este" ||
      (p.profile === "istari_grove" &&
        s.facilities[q.facility!]?.kind === "medicine-nursery"));
  p.stock.P -= 2;
  if (retain) {
    q.evacuationUsed = true;
    h!.effects = h!.effects.filter((e) => e.kind !== "care-evacuation-used");
    h!.effects.push({
      kind: "care-evacuation-used",
      value: 1,
      source: `care:${s.turn}`,
      until: 1000000,
    });
  } else q.remaining = 2;
  u.effects = u.effects.filter((e) => e.kind !== "care-evacuated");
  u.effects.push({
    kind: "care-evacuated",
    value: 1,
    source: q.injury,
    until: 1000000,
  });
  q.method = "ordinary";
  q.facility = a.destination;
  delete q.shelter;
  q.accelerated = false;
  q.location = { ...a.route.at(-1)! };
  q.lastProgress = s.turn;
  u.x = q.location.x;
  u.y = q.location.y;
  c.moved?.(s, u, a.route);
}
