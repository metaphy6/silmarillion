import {forestObservation} from "./forest-routes";
import {watchActive,watchConcealed} from './watch-posts';
import type { Match, Pos } from "./types";
import type { Zone } from "./zones";
import { sightline } from "./effects";
export type Observation = "hidden" | "silhouette" | "identified";
type Observer = Pos & { elevated: boolean };
const within = (z: Zone, p: Pos) =>
  Math.hypot(z.x - p.x, z.y - p.y) <= z.radius;
const activeZones = (s: Match, kind: string) =>
  Object.values(s.zones).filter((z) => z.kind === kind && z.until > s.revision);
function observers(s: Match, seat: string, p: Pos): Observer[] {
  return [
    ...Object.values(s.units)
      .filter(
        (u) =>
          u.owner === seat &&
          u.alive &&
          Math.abs(u.x - p.x) + Math.abs(u.y - p.y) <= 9,
      )
      .map((u) => ({ ...u, elevated: u.flying && !u.landed })),
    ...Object.values(s.facilities)
      .filter(
        (f) =>
          f.owner === seat &&
          f.hp > 0 && (f.kind!=="watch-post"||watchActive(s,f.id)) &&
          Math.abs(f.x - p.x) + Math.abs(f.y - p.y) <= 8,
      )
      .map((f) => ({ ...f, elevated: false })),
  ].filter((o) => sightline(s, o, p));
}
/** Terrain can remain observable while an occupant is concealed. */
export function terrainObserved(s: Match, seat: string, pos: Pos): boolean {
  return (
    Number.isFinite(pos.x) &&
    Number.isFinite(pos.y) &&
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x < s.map.width &&
    pos.y < s.map.height &&
    observers(s, seat, pos).length > 0
  );
}
/** Exact line/circle interval avoids revealing units through tiny smoke zones. */
function interval(a: Pos, b: Pos, z: Zone): [number, number] | null {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    ox = a.x - z.x,
    oy = a.y - z.y,
    A = dx * dx + dy * dy;
  if (A === 0) return within(z, a) ? [0, 1] : null;
  const B = 2 * (ox * dx + oy * dy),
    C = ox * ox + oy * oy - z.radius * z.radius,
    D = B * B - 4 * A * C;
  if (D < 0) return null;
  const lo = Math.max(0, (-B - Math.sqrt(D)) / (2 * A)),
    hi = Math.min(1, (-B + Math.sqrt(D)) / (2 * A));
  return lo <= hi ? [lo, hi] : null;
}
function obscuredRay(s: Match, a: Pos, b: Pos): "clear" | "thinned" | "opaque" {
  const smoke = [...activeZones(s, "smoke"), ...activeZones(s, "mist")]
    .map((z) => interval(a, b, z))
    .filter((x): x is [number, number] => !!x);
  if (!smoke.length) return "clear";
  const clear = activeZones(s, "clear-air")
    .map((z) => interval(a, b, z))
    .filter((x): x is [number, number] => !!x)
    .sort((x, y) => x[0] - y[0]);
  for (const [start, end] of smoke) {
    let reached = start;
    for (const [lo, hi] of clear) {
      if (lo > reached + 1e-9) break;
      if (hi >= reached) reached = hi;
    }
    if (
      reached < end - 1e-9 ||
      !clear.some(([lo, hi]) => lo <= start && hi >= start)
    )
      return "opaque";
  }
  return "thinned";
}
/** Never returns an identity or hidden contents: silhouette consumers must
 * project only coordinates into a separate contact DTO, not copy this Unit.
 * Provisional close/elevated observation counters a vegetated screen at one tile.
 */
export function observation(s: Match, seat: string, pos: Pos): Observation {
  const unit = "id" in pos ? s.units[String(pos.id)] : undefined;
  if (unit?.owner === seat) return "identified";
  if(unit&&forestObservation(s,seat,unit)==="hidden")return "hidden";
  const effects =
    unit?.effects.filter((e) => e.until > s.revision && e.value > 0) ?? [];
  if (effects.some((e) => ["tunnel", "roofed"].includes(e.kind)))
    return "hidden";
  let result: Observation = "hidden";
  for (const observer of observers(s, seat, pos)) {
    const smoke = obscuredRay(s, observer, pos);
    if (smoke === "opaque") continue;
    const screened =
      activeZones(s, "bloomscreen").some((z) => within(z, pos)) &&
      !observer.elevated &&
      Math.hypot(observer.x - pos.x, observer.y - pos.y) > 1;
    const concealed = screened || (watchConcealed(s,pos)&&!observer.elevated&&Math.hypot(observer.x-pos.x,observer.y-pos.y)>1) || effects.some((e) => e.kind === "concealed");
    if (concealed) {
      if (activeZones(s, "light").some((z) => within(z, pos)))
        result = "silhouette";
      continue;
    }
    if (smoke === "thinned") result = "silhouette";
    else return "identified";
  }
  return result;
}
