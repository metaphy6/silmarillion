import type { Effect, Match, Pos, Unit } from "./types";

export function sightline(s: Match, a: Pos, b: Pos) {
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  for (let i = 1; i < steps; i++) {
    const x = Math.round(a.x + ((b.x - a.x) * i) / steps),
      y = Math.round(a.y + ((b.y - a.y) * i) / steps);
    if (
      s.map.terrain[y * s.map.width + x] === "cliff" ||
      Object.values(s.facilities).some(
        (f) => f.hp > 0 && f.x === x && f.y === y,
      )
    )
      return false;
  }
  return true;
}
/** Time and positional conditions are checked at use, including projected movement. */
export function activeEffects(s: Match, u: Unit): Effect[] {
  return u.effects.filter((e) => {
    if (e.until <= s.revision) return false;
    if (e.kind === "stabilized-wound") {
      const link = u.effects.find((x) => x.kind === "treatment-link");
      if (link) {
        const healer = s.units[link.source];
        if (
          link.until <= s.revision ||
          !healer?.alive ||
          !healer.active ||
          healer.hp <= 0 ||
          s.players[healer.owner]?.hero.status !== "living" ||
          Math.hypot(healer.x - u.x, healer.y - u.y) > 1 ||
          healer.effects.some(
            (x) =>
              x.until > s.revision &&
              x.value > 0 &&
              ["stunned", "incapacitated", "silenced", "rout"].includes(x.kind),
          )
        )
          return false;
      }
    }
    if (
      ["movement-impairment", "damaged-joint"].includes(e.kind) &&
      u.effects.some(
        (x) =>
          x.kind === "movement-repair" &&
          x.source === e.source &&
          x.until > s.revision,
      )
    )
      return false;
    if (
      e.kind !== "suppressed" &&
      u.effects.some(
        (x) =>
          x.kind === "suppressed" &&
          x.source === e.source &&
          x.until > s.revision,
      )
    )
      return false;
    if (e.source.startsWith("circle:")) {
      const [, x, y] = e.source.split(":").map(Number);
      if (Math.hypot(u.x - x, u.y - y) > 2.5 / 3) return false;
    }
    if (e.source.startsWith("formation:")) {
      const [, seat, x, y] = e.source.split(":");
      const h = s.units[s.players[seat]?.hero.id];
      if (
        u.x !== Number(x) ||
        u.y !== Number(y) ||
        !h?.alive ||
        Math.hypot(h.x - u.x, h.y - u.y) > 8
      )
        return false;
    }
    return true;
  });
}
export function protectedDamage(
  s: Match,
  u: Unit,
  hit: number,
  spell: boolean,
) {
  const effects = activeEffects(s, u);
  hit = Math.max(
    1,
    hit -
      Math.max(
        0,
        ...effects.filter((e) => e.kind === "ward").map((e) => e.value),
      ),
  );
  const percent = Math.max(
    0,
    ...effects
      .filter(
        (e) =>
          [
            "damage-reduction-percent",
            "formation-damage-reduction-percent",
          ].includes(e.kind) ||
          (spell && e.kind === "spell-damage-reduction-percent"),
      )
      .map((e) => e.value),
  );
  hit = Math.ceil(hit * (1 - Math.min(100, percent) / 100));
  const shield = effects
    .filter((e) => e.kind === "hit-ward")
    .sort((a, b) => b.value - a.value)[0];
  if (shield) {
    hit = Math.max(0, hit - shield.value);
    u.effects = u.effects.filter((e) => e !== shield);
  }
  return hit;
}
