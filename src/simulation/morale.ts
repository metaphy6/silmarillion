import type { Match, Unit, Pos } from "./types";
import { activeEffects, sightline } from "./effects";
import { effectiveRelation } from "./diplomacy";
import { factionProduction } from "../content/production";
import { zoneContains } from "./zones";
const near = (a: Pos, b: Pos, range = 3) =>
  Math.hypot(a.x - b.x, a.y - b.y) <= range;
const active = (s: Match, u: Unit) =>
  u.alive &&
  u.active &&
  u.hp > 0 &&
  !activeEffects(s, u).some((e) =>
    ["stunned", "incapacitated"].includes(e.kind),
  );
const mark = (s: Match, u: Unit, key: string) =>
  u.effects.push({
    kind: key,
    value: 1,
    until: 1000000,
    source: `morale:${s.turn}`,
  });
const used = (s: Match, u: Unit, key: string) =>
  u.effects.some((e) => e.kind === key && e.source === `morale:${s.turn}`);
function patrons(s: Match, u: Unit, id: string) {
  return Object.values(s.players)
    .filter(
      (p) =>
        p.profile === id &&
        p.hero.status === "living" &&
        effectiveRelation(s, p.seat, u.owner) === "alliance",
    )
    .map((p) => s.units[p.hero.id])
    .filter((h) => h && active(s, h) && near(h, u) && sightline(s, h, u))
    .sort((a, b) => a.id.localeCompare(b.id));
}
function amount(s: Match, u: Unit, kind: string) {
  return Math.max(
    0,
    ...activeEffects(s, u)
      .filter((e) => e.kind === kind)
      .map((e) => e.value),
  );
}
function ordinaryAmount(s: Match, u: Unit, kind: string) {
  return Math.max(
    0,
    ...activeEffects(s, u)
      .filter((e) => e.kind === kind && e.source.startsWith("morale:"))
      .map((e) => e.value),
  );
}
function set(s: Match, u: Unit, kind: string, value: number) {
  u.effects = u.effects.filter(
    (e) => e.kind !== kind || !e.source.startsWith("morale:"),
  );
  if (value > 0)
    u.effects.push({
      kind,
      value: Math.min(3, value),
      until: 1000000,
      source: `morale:${s.turn}`,
    });
}
/** Provisional ordinary pressure: >=25% maxHP nonfatal hit adds one fear and
 * coordination step; second fear step can rout. No movement/actions are granted.
 * Three-tile local passive range is provisional except Gandalf's adopted10m. */
export function damageMorale(
  s: Match,
  u: Unit,
  hit: number,
  routeOpen: (u: Unit, route: Pos[]) => boolean = () => false,
): void {
  if (
    u.kind !== "company" ||
    !active(s, u) ||
    !Number.isFinite(hit) ||
    hit < Math.ceil(u.maxHp * 0.25)
  )
    return;
  set(s, u, "fear", ordinaryAmount(s, u, "fear") + 1);
  const fear = amount(s, u, "fear");
  let loss = 1;
  const tulkas = patrons(s, u, "tulkas").find(
    (h) => !used(s, h, "stand-beside-used"),
  );
  if (tulkas) {
    loss--;
    mark(s, tulkas, "stand-beside-used");
  }
  set(s, u, "cohesion-loss", ordinaryAmount(s, u, "cohesion-loss") + loss);
  if (fear < 2 || amount(s, u, "fear-suppression") > 0) return;
  const p = s.players[u.owner],
    h = p && s.units[p.hero.id];
  const fallback = Object.values(s.tacticalOrders).find(
    (q) =>
      q.kind === "fallback" &&
      q.unit === u.id &&
      q.createdTurn === s.turn &&
      q.until >= s.revision,
  );
  if (
    p?.profile === "istari_gandalf" &&
    h &&
    p.hero.status === "living" &&
    active(s, h) &&
    near(h, u, 10 / 3) &&
    sightline(s, h, u) &&
    !used(s, h, "hope-rekindled-used") &&
    fallback?.kind === "fallback" &&
    routeOpen(u, fallback.route)
  ) {
    mark(s, h, "hope-rekindled-used");
    u.effects = u.effects.filter((e) => e.kind !== "rout");
    u.effects.push({
      kind: "orderly-fallback",
      value: 1,
      until: s.revision + 2,
      source: `morale:${s.turn}`,
    });
  } else set(s, u, "rout", 1);
}
export const moraleAttackPenalty = (s: Match, u: Unit) =>
  amount(s, u, "cohesion-loss");
export function refreshOrderlyFallback(s: Match, u: Unit): void {
  if (!activeEffects(s, u).some((e) => e.kind === "orderly-fallback")) return;
  const p = s.players[u.owner],
    h = p && s.units[p.hero.id];
  if (
    p?.profile !== "istari_gandalf" ||
    p.hero.status !== "living" ||
    !h ||
    !active(s, h) ||
    !near(h, u, 10 / 3) ||
    !sightline(s, h, u)
  ) {
    u.effects = u.effects.filter((e) => e.kind !== "orderly-fallback");
    set(s, u, "rout", 1);
  }
}
/** Call only for an actually accepted/executed ordinary order, not preview. */
export function verifiedOrderMorale(s: Match, u: Unit): void {
  if (
    u.kind !== "company" ||
    !active(s, u) ||
    amount(s, u, "cohesion-loss") < 1 ||
    used(s, u, "clear-signals-used") ||
    !patrons(s, u, "manwe").length
  )
    return;
  const effect = activeEffects(s, u)
    .filter((e) => e.kind === "cohesion-loss")
    .sort((a, b) => b.value - a.value || a.source.localeCompare(b.source))[0];
  if (effect) {
    const actual = u.effects.find(
      (e) =>
        e.kind === effect.kind &&
        e.source === effect.source &&
        e.until === effect.until,
    );
    if (actual) actual.value--;
    u.effects = u.effects.filter((e) => e !== actual || e.value > 0);
  }
  mark(s, u, "clear-signals-used");
}
/** Physical declared withdrawal, not any movement. Nearby ordinary allied
 * companies lose one coordination step; no additional fear is invented. */
export function retreatMorale(s: Match, departing: Unit, route: Pos[]): void {
  if (departing.kind !== "company" || route.length < 2) return;
  const origin = route[0];
  for (const u of Object.values(s.units).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (
      u.id === departing.id ||
      u.kind !== "company" ||
      !active(s, u) ||
      effectiveRelation(s, u.owner, departing.owner) !== "alliance" ||
      !near(u, origin) ||
      !sightline(s, u, origin)
    )
      continue;
    // Avari signal synchronizes only the two declared withdrawals; it cannot
    // suppress coordination loss on uninvolved neighbors or later retreats.
    const coordinated=activeEffects(s,departing).find(e=>e.kind==="rendezvous"&&activeEffects(s,u).some(other=>other.kind==="rendezvous"&&other.source===e.source));
    if(coordinated)continue;
    const traits = factionProduction(s.players[u.owner].profile).unit.traits;
    const standard = patrons(s, u, "elf_vanyar").find(
      (h) => h.owner === u.owner && !used(s, h, "keep-standard-used"),
    );
    if (
      standard &&
      !u.flying &&
      !traits.includes("rider") &&
      !traits.includes("siege")
    )
      mark(s, standard, "keep-standard-used");
    else set(s, u, "cohesion-loss", ordinaryAmount(s, u, "cohesion-loss") + 1);
  }
  const thresholds = Object.values(s.zones)
    .filter(
      (z) =>
        z.kind === "threshold" &&
        z.until > s.revision &&
        effectiveRelation(s, z.owner, departing.owner) === "alliance" &&
        route.some((p) => zoneContains(z, p)),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const z of thresholds) {
    const p = s.players[z.owner],
      h = p && s.units[p.hero.id];
    if (
      p?.profile === "namo" &&
      p.hero.status === "living" &&
      h &&
      active(s, h) &&
      !used(s, h, "shelter-threshold-used")
    ) {
      // Ordinary withdrawal itself costs one cohesion; the threshold removes one.
      mark(s, h, "shelter-threshold-used");
      return;
    }
  }
  refreshOrderlyFallback(s, departing);
  const synchronized=activeEffects(s,departing).some(e=>e.kind==="rendezvous"&&Object.values(s.units).some(other=>other.id!==departing.id&&active(s,other)&&near(other,departing,4)&&activeEffects(s,other).some(v=>v.kind==="rendezvous"&&v.source===e.source)));
  if (!synchronized&&!activeEffects(s, departing).some((e) => e.kind === "orderly-fallback"))
    set(
      s,
      departing,
      "cohesion-loss",
      ordinaryAmount(s, departing, "cohesion-loss") + 1,
    );
}
export function finishMoraleEncounter(s: Match): void {
  for (const u of Object.values(s.units))
    u.effects = u.effects.filter((e) => !e.source.startsWith("morale:"));
}
