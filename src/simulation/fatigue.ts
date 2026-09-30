import { completeDreamRest } from "./dream-preparation";
import {travelMounts,attachedMountFatigue,restAttachedMounts} from './remounts';
import type { Match, Unit, Pos, Facility } from "./types";
import { stocks } from "./types";
import { factionProduction } from "../content/production";

/** Provisional ordinary tuning: +1 per actual travel leg, cap6, -2 per paid
 * weekly rest (2P), movement penalty floor(fatigue/3); caller keeps min1 move. */
export const fatigue = (s: Match, u: Unit) =>
  Math.max(
    0,
    ...u.effects
      .filter((e) => e.kind === "fatigue" && e.until > s.revision)
      .map((e) => e.value),
  );
export const fatigueMovementPenalty = (s: Match, u: Unit) =>
  Math.floor(fatigue(s, u) / 3);
const near = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
function setFatigue(u: Unit, value: number) {
  u.effects = u.effects.filter((e) => e.kind !== "fatigue");
  if (value > 0)
    u.effects.push({
      kind: "fatigue",
      value: Math.min(6, value),
      until: 1000000,
      source: "ordinary-travel",
    });
}
function hero(s: Match, seat: string) {
  const p = s.players[seat],
    h = p && s.units[p.hero.id];
  return p?.hero.status === "living" && h?.alive && h.active && h.hp > 0
    ? h
    : undefined;
}
const used = (s: Match, h: Unit, kind: string) =>
  h.effects.some((e) => e.kind === kind && e.source === `week:${s.turn}`);
function mark(s: Match, h: Unit, kind: string) {
  h.effects = h.effects.filter((e) => e.kind !== kind);
  h.effects.push({ kind, value: 1, until: 1000000, source: `week:${s.turn}` });
}
/** Actual ordinary company travel only; not forced displacement or attacks.
 * Accompaniment uses adjacency to both endpoints (provisional local scale). */
export function travelFatigue(s: Match, u: Unit, from: Pos, to: Pos): void {
  travelMounts(s,u,from,to);
  if (
    !u.alive ||
    !u.active ||
    u.kind !== "company" ||
    (from.x === to.x && from.y === to.y)
  )
    return;
  const p = s.players[u.owner],
    h = hero(s, u.owner);
  let gain = 1;
  if (
    p?.profile === "human_rohan" &&
    factionProduction(p.profile).unit.traits.includes("rider") &&
    h &&
    near(h, from) &&
    near(h, to) &&
    !used(s, h, "careful-pacing-used")
  ) {
    gain = 0;
    mark(s, h, "careful-pacing-used");
  }
  setFatigue(u, fatigue(s, u) + gain);
}
export function restReason(
  s: Match,
  seat: string,
  unitId: string,
  facilityId: string,
): string {
  const p = s.players[seat],
    u = s.units[unitId],
    f = s.facilities[facilityId];
  if (
    !p ||
    p.eliminated ||
    !u ||
    u.owner !== seat ||
    u.kind !== "company" ||
    !u.alive ||
    !u.active ||
    !u.supplied
  )
    return "Owned active supplied ordinary company required";
  if (
    !f ||
    f.owner !== seat ||
    f.kind !== "refuge" ||
    f.hp <= 0 ||
    f.workers < 1
  )
    return "Owned staffed refuge required";
  if (!near(u, f)) return "Company must be at the refuge";
  if (f.job || f.repair || f.rest) return "Refuge queue occupied";
  if (Object.values(s.facilities).some((x) => x.rest?.unit === unitId))
    return "Company already has a paid rest assignment";
  if (
    Object.values(s.convoys).some(
      (c) => c.carrier === unitId && c.phase !== "lost",
    )
  )
    return "Finish the active convoy before resting";
  if (fatigue(s, u) < 1 && attachedMountFatigue(s,u)<1) return "Company has no fatigue to recover";
  return p.stock.P >= 2 ? "" : "Paid rest requires 2P";
}
export function startRest(
  s: Match,
  seat: string,
  unitId: string,
  facilityId: string,
): void {
  const reason = restReason(s, seat, unitId, facilityId);
  if (reason) throw new Error(reason);
  s.players[seat].stock.P -= 2;
  s.facilities[facilityId].rest = {
    id: `rest:${s.nextId++}`,
    unit: unitId,
    started: s.turn,
    remaining: 1,
    cost: stocks(2),
  };
}
export function pruneRest(s: Match): void {
  for (const f of Object.values(s.facilities)) {
    const u = f.rest && s.units[f.rest.unit];
    if (f.rest && (!u || !u.alive || u.owner !== f.owner || f.hp <= 0))
      delete f.rest;
  }
}
/** Once at the weekly queue-advance boundary. Absence/insufficient staffing or
 * ordinary supply pauses; death/capture destroys assignment without refund. */
export function progressRest(s: Match): void {
  pruneRest(s);
  for (const f of Object.values(s.facilities).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const j = f.rest,
      u = j && s.units[j.unit];
    if (!j || !u || !u.active || !u.supplied || f.workers < 1 || !near(u, f))
      continue;
    if (--j.remaining > 0) continue;
    const p = s.players[f.owner],
      h = hero(s, f.owner);
    let recovery = 2;
    if (
      ["elf_finarfin", "istari_ember"].includes(p.profile) &&
      h &&
      near(h, f) &&
      near(h, u) &&
      !used(s, h, "refuge-rest-used")
    ) {
      recovery++;
      mark(s, h, "refuge-rest-used");
    }
    setFatigue(u, Math.max(0, fatigue(s, u) - recovery));
    restAttachedMounts(s,u);
    completeDreamRest(s,f.id,j.id);
    delete f.rest;
  }
}
export function restInvariant(s: Match, f: Facility): void {
  const j = f.rest;
  if (!j) return;
  const u = s.units[j.unit];
  if (
    f.kind !== "refuge" ||
    f.hp <= 0 ||
    f.job ||
    f.repair ||
    !u ||
    !u.alive ||
    u.kind !== "company" ||
    u.owner !== f.owner ||
    j.started < 1 ||
    j.started > s.turn ||
    j.remaining !== 1 ||
    j.cost.P !== 2 ||
    j.cost.M !== 0 ||
    j.cost.K !== 0 ||
    j.cost.E !== 0 ||
    Object.values(s.facilities).some(
      (other) => other.id !== f.id && other.rest?.unit === j.unit,
    )
  )
    throw new Error("Invalid funded rest queue");
}
