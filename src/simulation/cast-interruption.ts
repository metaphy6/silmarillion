import type { Match, Unit } from "./types";
import { activeEffects } from "./effects";

/** The supplied hit is actual post-protection damage, before HP subtraction.
 * Pallando's adopted Unbroken Incantation converts only the first nonlethal
 * magical interruption of an active cast per encounter into a one-phase delay.
 * Physical displacement, range and sight remain the caller's validation duties.
 */
export function interruptCastOnDamage(
  s: Match,
  target: Unit,
  hit: number,
  magical: boolean,
): void {
  if (!Number.isFinite(hit) || hit <= 0 || target.kind !== "hero") return;
  const p = s.players[target.owner];
  if (!p || p.hero.id !== target.id) return;
  const pending = s.warnings.filter((w) => w.seat === target.owner);
  if (!pending.length) return;
  const source = `encounter:${s.turn}`;
  const used = target.effects.some(
    (e) => e.kind === "unbroken-incantation-used" && e.source === source,
  );
  const unable =
    !target.alive ||
    !target.active ||
    p.hero.status !== "living" ||
    activeEffects(s, target).some(
      (e) =>
        e.value > 0 &&
        ["stunned", "incapacitated", "silenced"].includes(e.kind),
    );
  if (
    p.profile === "istari_pallando" &&
    magical &&
    !unable &&
    hit < target.hp &&
    !used
  ) {
    for (const warning of pending) warning.due++;
    // Retain only the current encounter's marker; no unbounded encounter history.
    target.effects = target.effects.filter(
      (e) => e.kind !== "unbroken-incantation-used",
    );
    target.effects.push({
      kind: "unbroken-incantation-used",
      value: 1,
      until: 1000000,
      source,
    });
    return;
  }
  s.warnings = s.warnings.filter((w) => w.seat !== target.owner);
}
