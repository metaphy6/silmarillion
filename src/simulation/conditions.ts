import {heavyMovementLimit} from "./heavy-equipment";
import {mountPenalty} from './remounts';
import {surgeFootingPenalty} from "./shore-powers";
import {fittingMovementPenalty} from "./equipment-service";
import type { Match, Unit } from "./types";
import { activeEffects } from "./effects";

/** Call only for an actual positive hit, whether ordinary or magical. Idempotent. */
export function interruptTreatments(s: Match, target: Unit): void {
  target.effects = target.effects.filter(
    (e) => !["stabilized-wound", "treatment-link"].includes(e.kind),
  );
  for (const patient of Object.values(s.units)) {
    if (
      patient.effects.some(
        (e) => e.kind === "treatment-link" && e.source === target.id,
      )
    )
      patient.effects = patient.effects.filter(
        (e) => !["stabilized-wound", "treatment-link"].includes(e.kind),
      );
  }
}

/** Provisional normal-combat tuning, not adopted roster numbers: a nonfatal
 * ordinary hit >=25% maximum HP leaves one wound/joint impairment. Wounds
 * reduce attack and movement by one; callers preserve a minimum of one.
 * Unstabilized living wounds deteriorate by one HP at encounter end, never
 * below one. No morale, fear, rout, loyalty or automatic movement is invented.
 */
export function afterOrdinaryDamage(s: Match, target: Unit, hit: number): void {
  if (!target.alive || target.hp <= 0 || !Number.isFinite(hit) || hit <= 0)
    return;
  interruptTreatments(s, target);
  if (hit < Math.ceil(target.maxHp * 0.25)) return;
  const kind = target.kind === "construct" ? "movement-impairment" : "wound";
  const existing = target.effects.find(
    (e) => e.kind === kind && e.until > s.revision,
  );
  if (existing) return; // Severe hits never accumulate multiplicative penalties.
  target.effects.push({
    kind,
    value: 1,
    until: 1000000, // Explicit encounter cleanup, including extended response phases.
    source: `injury:${target.id}:${s.turn}:${s.revision}`,
  });
}

export function attackPenalty(s: Match, unit: Unit): number {
  return activeEffects(s, unit).some((e) => e.kind === "wound" && e.value > 0)
    ? 1
    : 0;
}

/** Includes construct impairment; do not subtract that effect again in engine. */
export function movementPenalty(s: Match, unit: Unit): number {
  return Math.max(0,unit.move-heavyMovementLimit(s,unit))+mountPenalty(s,unit)+surgeFootingPenalty(s,unit)+fittingMovementPenalty(s,unit.id)+Math.max(
    0,
    ...activeEffects(s, unit)
      .filter((e) =>
        ["wound", "movement-impairment", "damaged-joint"].includes(e.kind),
      )
      .map((e) => (e.kind === "wound" ? 1 : e.value)),
  );
}

/** Call once at weekly encounter end, before effect expiry. Never heals HP. */
export function endEncounterConditions(s: Match): void {
  for (const unit of Object.values(s.units)) {
    const wounds = activeEffects(s, unit).filter(
      (e) =>
        e.kind === "wound" && e.source.startsWith("injury:") && e.value > 0,
    );
    const unstable = wounds.some(
      (wound) =>
        !activeEffects(s, unit).some(
          (e) =>
            e.kind === "stabilized-wound" &&
            e.source === wound.source &&
            e.value > 0,
        ),
    );
    if (unstable && unit.alive && unit.hp > 0)
      unit.hp = Math.max(1, unit.hp - 1);
    unit.effects = unit.effects.filter(
      (e) =>
        e.kind !== "treatment-link" &&
        !(
          e.source.startsWith("injury:") &&
          [
            "wound",
            "movement-impairment",
            "movement-repair",
            "stabilized-wound",
          ].includes(e.kind)
        ),
    );
  }
}
