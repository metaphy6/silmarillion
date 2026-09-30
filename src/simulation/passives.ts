import type { Match, Unit, Facility } from "./types";
import { activeEffects } from "./effects";

const conscious = (s: Match, u: Unit) =>
  u.alive &&
  u.active &&
  u.hp > 0 &&
  !activeEffects(s, u).some((e) =>
    ["stunned", "incapacitated"].includes(e.kind),
  );
function write(u: Unit, kind: string, value: number, source: string) {
  u.effects = u.effects.filter((e) => e.kind !== kind);
  u.effects.push({ kind, value, source, until: 1000000 });
}
const used = (s: Match, u: Unit, kind: string) =>
  u.effects.some((e) => e.kind === kind && e.source === `encounter:${s.turn}`);

/** At start of committed tactical resolution, before movement/attacks. */
export function beginPassivePhase(s: Match): void {
  for (const p of Object.values(s.players)) {
    const h = s.units[p.hero.id];
    if (
      p.profile === "istari_alatar" &&
      p.hero.status === "living" &&
      h &&
      conscious(s, h)
    )
      write(h, "ambush-phase-start", s.revision, `${h.x}:${h.y}`);
  }
}
/** Every executed move or ordinary attack, including a miss, invalidates waiting.
 * Call after computing an ordinary hit's bonus, never for rejected orders. */
export function passiveActivity(s: Match, u: Unit): void {
  if (s.players[u.owner]?.profile !== "istari_alatar" || u.kind !== "hero")
    return;
  write(u, "ambush-activity", s.revision, `encounter:${s.turn}`);
  u.effects = u.effects.filter((e) => e.kind !== "ambush-prepared");
}
/** Only after one real tactical phase, before incrementing revision. */
export function endPassivePhase(s: Match): void {
  for (const p of Object.values(s.players)) {
    const h = s.units[p.hero.id];
    if (
      p.profile !== "istari_alatar" ||
      p.hero.status !== "living" ||
      !h ||
      !conscious(s, h)
    )
      continue;
    const start = h.effects.find((e) => e.kind === "ambush-phase-start");
    const acted = h.effects.some(
      (e) =>
        e.kind === "ambush-activity" &&
        e.value === s.revision &&
        e.source === `encounter:${s.turn}`,
    );
    if (
      start?.value === s.revision &&
      start.source === `${h.x}:${h.y}` &&
      !acted
    )
      write(
        h,
        "ambush-prepared",
        s.revision + 1,
        `encounter:${s.turn}:${h.x}:${h.y}`,
      );
  }
}

/** Called once AFTER hit/miss validation on an actual ordinary hit, before armor.
 * Adds one ordinary pre-armor hit equivalent; caller applies normal defenses once.
 * isOrdinarySiege is a trusted content classification, never a client assertion.
 * Only the authorized ordinary siege producer supplies this classification. */
export function passiveOrdinaryHit(
  s: Match,
  attacker: Unit,
  target: Unit | Facility,
  amount: number,
  isOrdinarySiege = false,
): number {
  if (amount <= 0 || !conscious(s, attacker)) return amount;
  const p = s.players[attacker.owner],
    h = p && s.units[p.hero.id];
  if (!p || p.hero.status !== "living" || !h || !conscious(s, h)) return amount;
  if (
    p.profile === "istari_saruman" &&
    isOrdinarySiege &&
    attacker.kind === "company" &&
    !("alive" in target) &&
    ["core", "hold", "cover", "barricade", "gate", "siege-brace"].includes(
      target.kind,
    ) &&
    Math.hypot(attacker.x - h.x, attacker.y - h.y) <= 12 / 3 &&
    !used(s, h, "demolition-used")
  ) {
    write(h, "demolition-used", 1, `encounter:${s.turn}`);
    const enhanced = amount * 2;
    return target.kind === "core" && target.hp === target.maxHp
      ? Math.min(enhanced, target.hp - 1)
      : enhanced;
  }
  if (
    p.profile === "istari_alatar" &&
    attacker.id === h.id &&
    Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y) > 1 &&
    h.effects.some(
      (e) =>
        e.kind === "ambush-prepared" &&
        e.value <= s.revision &&
        e.source === `encounter:${s.turn}:${h.x}:${h.y}`,
    ) &&
    !used(s, h, "ambush-used")
  ) {
    write(h, "ambush-used", 1, `encounter:${s.turn}`);
    return "alive" in target &&
      target.kind === "hero" &&
      target.hp === target.maxHp
      ? Math.min(amount * 2, target.hp - 1)
      : amount * 2;
  }
  return amount;
}
