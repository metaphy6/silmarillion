import type { Match, Unit } from "./types";
import { activeEffects } from "./effects";

/** Companion's Vigil, hero-balance-roster.json / istari_radagast.passive.
 * Call only while resolving a committed attack against its actual target,
 * never during preview/validation. A returned existing beast consumes the
 * one interception; caller redirects normal damage without free movement.
 * The runtime models one encounter per week (s.turn), not per network packet.
 */
export function radagastInterceptor(s: Match, target: Unit): Unit | undefined {
  const p = s.players[target.owner];
  if (
    !p ||
    p.profile !== "istari_radagast" ||
    p.hero.id !== target.id ||
    p.hero.status !== "living" ||
    target.kind !== "hero" ||
    !target.alive ||
    !target.active ||
    target.hp <= 0
  )
    return;
  const source = `encounter:${s.turn}`;
  if (
    target.effects.some(
      (e) => e.kind === "companions-vigil-used" && e.source === source,
    )
  )
    return;
  const beast = Object.values(s.units)
    .filter(
      (u) =>
        u.id !== target.id &&
        u.owner === target.owner &&
        u.kind === "beast" &&
        u.alive &&
        u.active &&
        u.hp > 0 &&
        !activeEffects(s, u).some(
          (e) => e.value > 0 && ["incapacitated", "stunned"].includes(e.kind),
        ) &&
        Math.hypot(u.x - target.x, u.y - target.y) <= 1,
    )
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (!beast) return;
  // Replace historical usage, keeping the serialized effect ledger bounded.
  target.effects = target.effects.filter(
    (e) => e.kind !== "companions-vigil-used",
  );
  target.effects.push({
    kind: "companions-vigil-used",
    value: 1,
    until: 1000000,
    source,
  });
  return beast;
}
