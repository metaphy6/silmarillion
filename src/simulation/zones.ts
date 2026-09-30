import { effectiveRelation } from "./diplomacy";
import type { Match, Pos, Unit } from "./types";
export interface Zone extends Pos {
  id: string;
  owner: string;
  kind:
    | "web"
    | "roots"
    | "threshold"
    | "flare"
    | "bloomscreen"
    | "smoke"
    | "mist"
    | "light"
    | "clear-air";
  dx: number;
  dy: number;
  radius: number;
  until: number;
  triggered: boolean;
}
// Provisional discretization: a strongest-only one-tile movement penalty,
// 0.35-tile approach half-width and 30-degree flare cone half-angle.
const ground = (u: Unit) => !u.flying || u.landed;
function segmentDistance(p: Pos, a: Pos, b: Pos): number {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = dx * dx + dy * dy;
  const t = length
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length))
    : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function contains(z: Zone, p: Pos): boolean {
  if (z.kind === "roots" || z.kind === "bloomscreen")
    return Math.hypot(p.x - z.x, p.y - z.y) <= z.radius;
  if (z.kind === "flare") {
    const dx = p.x - z.x,
      dy = p.y - z.y,
      d = Math.hypot(dx, dy),
      direction = Math.hypot(z.dx, z.dy);
    return (
      d <= z.radius &&
      (d === 0 ||
        (direction > 0 &&
          (dx * z.dx + dy * z.dy) / (d * direction) >= Math.cos(Math.PI / 6)))
    );
  }
  return segmentDistance(p, z, { x: z.x + z.dx, y: z.y + z.dy }) <= z.radius;
}
export { contains as zoneContains };
const current = (s: Match) =>
  Object.values(s.zones).filter((z) => z.until > s.revision);
const hostile = (s: Match, u: Unit, z: Zone) =>
  u.owner !== z.owner && effectiveRelation(s, u.owner, z.owner) === "war";
const eligible = (s: Match, u: Unit, z: Zone) =>
  ground(u) &&
  u.alive &&
  (z.kind === "web" ||
    z.kind === "roots" ||
    (z.kind === "threshold" &&
      !z.triggered &&
      u.kind !== "hero" &&
      hostile(s, u, z)));
export function movementZonePenalty(s: Match, u: Unit, route: Pos[]): number {
  return current(s).some(
    (z) => eligible(s, u, z) && route.slice(1).some((p) => contains(z, p)),
  )
    ? 1
    : 0;
}
export function crossZones(s: Match, u: Unit, route: Pos[]): void {
  for (const z of current(s)) {
    if (!eligible(s, u, z)) continue;
    const p = route.slice(1).find((p) => contains(z, p));
    if (!p) continue;
    if (z.kind === "threshold") z.triggered = true;
    if (z.kind === "web")
      s.events.push({
        id: s.nextId++,
        turn: s.turn,
        audience: [z.owner],
        text: `Web crossing observed at ${p.x},${p.y} during week ${s.turn}, phase ${s.combatPhase}. This is a dated physical trace, not continuing surveillance.`,
      });
  }
  if (s.events.length > 400) s.events.splice(0, s.events.length - 400);
}
export function rangedZonePenalty(
  s: Match,
  attacker: Pos,
  target: Pos,
): number {
  // Sample at quarter-tile spacing, smaller than the adopted local grid's
  // narrowest approach width. Ownership intentionally does not exclude allies.
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(target.x - attacker.x, target.y - attacker.y) * 4),
  );
  return current(s).some(
    (z) =>
      z.kind === "flare" &&
      Array.from({ length: steps + 1 }, (_, i) => ({
        x: attacker.x + ((target.x - attacker.x) * i) / steps,
        y: attacker.y + ((target.y - attacker.y) * i) / steps,
      })).some((p) => contains(z, p)),
  )
    ? 25
    : 0;
}
export function clearableZone(
  s: Match,
  seat: string,
  unit: Unit,
  zone: Zone,
): string {
  if (!unit.alive || !unit.active || unit.owner !== seat)
    return "Owned living active unit required";
  if (unit.kind !== "company" || unit.attack <= 0)
    return "An ordinary armed company is required to cut this obstacle";
  if (zone.until <= s.revision || !s.zones[zone.id])
    return "Zone is no longer present";
  if (!["web", "roots", "bloomscreen"].includes(zone.kind))
    return "Only physical web, roots or bloomscreen can be cut";
  const distance = ["roots", "bloomscreen"].includes(zone.kind)
    ? Math.max(0, Math.hypot(unit.x - zone.x, unit.y - zone.y) - zone.radius)
    : segmentDistance(unit, zone, {
        x: zone.x + zone.dx,
        y: zone.y + zone.dy,
      });
  return distance <= 1 ? "" : "Move adjacent to the obstacle before clearing";
}
export function pruneZones(s: Match): void {
  for (const [id, z] of Object.entries(s.zones))
    if (z.until <= s.revision) delete s.zones[id];
}
