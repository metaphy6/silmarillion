import type { Match, Unit, Pos } from "./types";
import { activeEffects } from "./effects";
export type DreamContingency = "fear" | "withdrawal" | "landing";
export interface DreamPlan {
  id: string;
  owner: string;
  unit: string;
  facility: string;
  rest: string;
  contingency: DreamContingency;
  phase: "resting" | "ready" | "spent";
  createdTurn: number;
  createdRevision: number;
  expiresTurn: number;
  replaced: boolean;
}
export type DreamState = Match & { dreamPlans: Record<string, DreamPlan> };
export interface DreamChecks {
  connected: (from: Pos, to: Pos, unit: Unit) => boolean;
  verifiedReport: (
    seat: string,
    id: string,
    afterTurn: number,
    afterRevision: number,
  ) => boolean;
}
const able = (s: Match, u: Unit | undefined) =>
  !!u?.alive &&
  u.active &&
  u.supplied &&
  !activeEffects(s, u).some((e) =>
    ["stunned", "incapacitated", "rout"].includes(e.kind),
  );
function hero(s: DreamState, seat: string) {
  const p = s.players[seat],
    h = p && s.units[p.hero.id];
  return p?.profile === "irmo" && p.hero.status === "living" && able(s, h)
    ? h
    : undefined;
}
export function dreamReason(
  s: DreamState,
  seat: string,
  unit: string,
  facility: string,
  c: DreamChecks,
): string {
  const h = hero(s, seat),
    p = s.players[seat],
    u = s.units[unit],
    f = s.facilities[facility];
  if (!h || p.hero.readiness < 3)
    return "Living active Irmo and three readiness required";
  if (!able(s, u) || u.owner !== seat || u.kind !== "company")
    return "Own living supplied ordinary company required";
  if (
    !f ||
    f.owner !== seat ||
    f.kind !== "refuge" ||
    f.hp <= 0 ||
    f.workers < 1 ||
    f.rest?.unit !== unit ||
    Math.abs(u.x - f.x) + Math.abs(u.y - f.y) > 1
  )
    return "Actual paid rest assignment at a staffed refuge required";
  if (!c.connected(h, f, h))
    return "Hero and rest assignment must share a connected region";
  if (
    Object.values(s.dreamPlans).some(
      (q) => q.unit === unit && q.expiresTurn >= s.turn,
    )
  )
    return "Company already has its single rehearsal";
  return "";
}
/** Ordinary rest has already paid its provisions and operation; caller reserves
 * the weekly hero commitment. Contingency categories and one-step reduction
 * are provisional ordinary integration values, not a redesign of the power. */
export function prepareDream(
  s: DreamState,
  seat: string,
  unit: string,
  facility: string,
  contingency: DreamContingency,
  c: DreamChecks,
): DreamPlan {
  const reason = dreamReason(s, seat, unit, facility, c);
  if (reason) throw new Error(reason);
  s.players[seat].hero.readiness -= 3;
  const id = `dream:${s.nextId++}`;
  const q: DreamPlan = {
    id,
    owner: seat,
    unit,
    facility,
    rest: s.facilities[facility].rest!.id,
    contingency,
    phase: "resting",
    createdTurn: s.turn,
    createdRevision: s.revision,
    expiresTurn: s.turn + 1,
    replaced: false,
  };
  s.dreamPlans[id] = q;
  return q;
}
/** Called by the actual paid-rest completion immediately before queue removal. */
export function completeDreamRest(
  s: DreamState,
  facility: string,
  rest: string,
): void {
  for (const q of Object.values(s.dreamPlans ?? {}))
    if (
      q.facility === facility &&
      q.rest === rest &&
      q.phase === "resting" &&
      q.expiresTurn >= s.turn
    )
      q.phase = "ready";
}
export function interruptDream(s: DreamState, unit: string): void {
  for (const [id, q] of Object.entries(s.dreamPlans ?? {}))
    if (q.unit === unit && q.phase === "resting") delete s.dreamPlans[id];
}
export function dreamMitigation(
  s: DreamState,
  u: Unit,
  contingency: DreamContingency,
  penalty: number,
): number {
  if (penalty <= 0) return penalty;
  const q = Object.values(s.dreamPlans ?? {}).find(
    (q) =>
      q.unit === u.id &&
      q.owner === u.owner &&
      q.phase === "ready" &&
      q.expiresTurn >= s.turn &&
      q.contingency === contingency,
  );
  if (!q) return penalty;
  q.phase = "spent";
  return Math.max(0, penalty - 1);
}
export function replacementReason(
  s: DreamState,
  seat: string,
  id: string,
  report: string,
  c: DreamChecks,
): string {
  const q = s.dreamPlans[id];
  if (
    !hero(s, seat) ||
    !q ||
    q.owner !== seat ||
    q.phase === "spent" ||
    q.expiresTurn < s.turn
  )
    return "Existing unspent Irmo preparation required";
  if (q.replaced)
    return "Contingency already replaced in this weekly preparation";
  return c.verifiedReport(seat, report, q.createdTurn, q.createdRevision)
    ? ""
    : "Fresh verified owned scouting report required";
}
export function replaceDream(
  s: DreamState,
  seat: string,
  id: string,
  contingency: DreamContingency,
  report: string,
  c: DreamChecks,
): void {
  const reason = replacementReason(s, seat, id, report, c);
  if (reason) throw new Error(reason);
  const q = s.dreamPlans[id];
  q.contingency = contingency;
  q.replaced = true;
}
export function pruneDreams(s: DreamState): void {
  for (const [id, q] of Object.entries(s.dreamPlans ?? {})) {
    const u = s.units[q.unit],
      f = s.facilities[q.facility];
    if (
      q.expiresTurn < s.turn ||
      !u?.alive ||
      u.owner !== q.owner ||
      (q.phase === "resting" &&
        (!f ||
          f.hp <= 0 ||
          f.owner !== q.owner ||
          f.rest?.id !== q.rest ||
          !able(s, u) ||
          Math.abs(u.x - f.x) + Math.abs(u.y - f.y) > 1))
    )
      delete s.dreamPlans[id];
  }
}
export function validateDreams(s: DreamState, guestSeat?: string): void {
  const units = new Set<string>();
  for (const [id, q] of Object.entries(s.dreamPlans)) {
    if (
      id !== q.id ||
      s.players[q.owner]?.profile !== "irmo" ||
      (guestSeat && q.owner !== guestSeat) ||
      !s.units[q.unit]?.alive || s.units[q.unit].owner!==q.owner || s.units[q.unit].kind!=="company" ||
      (q.phase==="resting" && (s.facilities[q.facility]?.rest?.id!==q.rest || s.facilities[q.facility]?.rest?.unit!==q.unit || s.facilities[q.facility]?.owner!==q.owner)) ||
      (q.createdTurn===s.turn && s.players[q.owner].commitment!==0) ||
      q.createdTurn < 1 ||
      q.createdTurn > s.turn ||
      q.createdRevision < 0 ||
      q.createdRevision > s.revision ||
      q.expiresTurn !== q.createdTurn + 1 ||
      units.has(q.unit)
    )
      throw new Error("Invalid single-use dream preparation");
    units.add(q.unit);
  }
}
