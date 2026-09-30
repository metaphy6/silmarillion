import type { Match, Pos, Unit } from "./types";
import { effectiveRelation } from "./diplomacy";
export interface Crossing {
  id: string;
  owner: string;
  kind: "causeway" | "silk";
  from: string;
  to: string;
  crew: string;
  tiles: Pos[];
  hp: number;
  maxHp: number;
  phase: "building" | "ready" | "destroyed";
  started: number;
  lastProgress: number;
}
export interface CrossingRequest {
  from: string;
  to: string;
  crew: string;
}
type Connected = (a: Pos, b: Pos) => boolean;
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const terrain = (s: Match, p: Pos) => s.map.terrain[p.y * s.map.width + p.x];
function span(s: Match, a: CrossingRequest): Pos[] {
  const from = s.facilities[a.from],
    to = s.facilities[a.to];
  if (!from || !to || (from.x !== to.x && from.y !== to.y)) return [];
  const width = distance(from, to);
  if (width < 2 || width > 5) return [];
  return Array.from({ length: width + 1 }, (_, i) => ({
    x: from.x + Math.sign(to.x - from.x) * i,
    y: from.y + Math.sign(to.y - from.y) * i,
  }));
}
function anchorsIntact(s: Match, c: Pick<Crossing, "from" | "to" | "owner">) {
  return [s.facilities[c.from], s.facilities[c.to]].every(
    (f) =>
      f?.kind === "crossing-anchor" &&
      f.owner === c.owner &&
      f.hp > 0 &&
      f.workers > 0,
  );
}
export function isCrossingCrew(s: Match, id: string): boolean {
  return Object.values(s.crossings ?? {}).some(
    (c) => c.phase === "building" && c.crew === id,
  );
}
/** Conservative provisional grid geometry: 3m per tile, straight bank-to-bank
 * distance <=15m, at least one existing water/cliff tile. One weekly work step
 * and 60HP are provisional tuning, not adopted roster numeric rules. */
export function crossingReason(
  s: Match,
  seat: string,
  a: CrossingRequest,
  connected: Connected,
  surveyed: (p: Pos) => boolean,
): string {
  const p = s.players[seat],
    h = p && s.units[p.hero.id],
    u = s.units[a.crew];
  if (!p || !["ent_grove", "spider_brood"].includes(p.profile) || p.eliminated)
    return "Ent Grove or Spider Brood required";
  if (
    p.hero.status !== "living" ||
    !h?.alive ||
    !h.active ||
    p.hero.readiness < 3 ||
    p.commitment < 1
  )
    return "Living hero, 3 readiness and weekly commitment required";
  if (!anchorsIntact(s, { ...a, owner: seat }))
    return "Two owned staffed prepared bank anchors required";
  const tiles = span(s, a);
  if (!tiles.length) return "Survey a straight gap of 6–15 metres (2–5 tiles)";
  if (
    ["water", "cliff"].includes(terrain(s, tiles[0])) ||
    ["water", "cliff"].includes(terrain(s, tiles.at(-1)!)) ||
    !tiles.slice(1, -1).every((p) => ["water", "cliff"].includes(terrain(s, p)))
  )
    return "Suitable dry banks around one actual water or cliff gap required";
  if (!tiles.every(surveyed)) return "Every crossing tile must be surveyed";
  if (
    !u?.alive ||
    !u.active ||
    !u.supplied ||
    u.owner !== seat ||
    u.kind !== "worker" ||
    distance(u, tiles[0]) > 1 ||
    isCrossingCrew(s, u.id) ||
    Object.values(s.convoys ?? {}).some(
      (c) => c.carrier === u.id && c.phase !== "lost",
    )
  )
    return "Free owned supplied working crew beside the near bank required";
  if (!connected(h, tiles[0]))
    return "Hero must reach the connected worksite region";
  if (
    p.profile === "ent_grove" &&
    (!p.sources.includes("timber") ||
      ![tiles[0], tiles.at(-1)!].some((p) => terrain(s, p) === "woodland"))
  )
    return "Existing woodland roots at a bank and timber source access required";
  if (
    Object.values(s.crossings ?? {}).some(
      (c) =>
        c.phase !== "destroyed" &&
        c.tiles.some((t) =>
          tiles.slice(1, -1).some((p) => distance(t, p) === 0),
        ),
    )
  )
    return "Crossing already occupies this gap";
  if (p.stock.M < 20 || p.stock.P < 10) return "Crossing requires 20M and 10P";
  return "";
}
export function startCrossing(
  s: Match,
  seat: string,
  a: CrossingRequest,
  connected: Connected,
  surveyed: (p: Pos) => boolean,
): Crossing {
  const reason = crossingReason(s, seat, a, connected, surveyed);
  if (reason) throw new Error(reason);
  s.crossings ??= {};
  const p = s.players[seat];
  const old = Object.values(s.crossings).find(
    (c) =>
      c.owner === seat &&
      c.phase === "destroyed" &&
      c.from === a.from &&
      c.to === a.to,
  );
  const c: Crossing = {
    id: old?.id ?? `crossing:${s.nextId++}`,
    owner: seat,
    kind: p.profile === "ent_grove" ? "causeway" : "silk",
    from: a.from,
    to: a.to,
    crew: a.crew,
    tiles: span(s, a),
    hp: 60,
    maxHp: 60,
    phase: "building",
    started: s.turn,
    lastProgress: s.turn - 1,
  };
  p.stock.M -= 20;
  p.stock.P -= 10;
  p.hero.readiness -= 3;
  s.crossings[c.id] = c;
  return c;
}
export function progressCrossings(s: Match): void {
  for (const c of Object.values(s.crossings ?? {}).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (c.phase !== "building" || c.lastProgress >= s.turn) continue;
    c.lastProgress = s.turn;
    const u = s.units[c.crew],
      p = s.players[c.owner];
    if (
      !anchorsIntact(s, c) ||
      !u?.alive ||
      !u.active ||
      !u.supplied ||
      u.owner !== c.owner ||
      u.kind !== "worker" ||
      distance(u, c.tiles[0]) > 1 ||
      p.hero.status !== "living" ||
      (c.kind === "causeway" &&
        (!p.sources.includes("timber") ||
          ![c.tiles[0], c.tiles.at(-1)!].some(
            (p) => terrain(s, p) === "woodland",
          )))
    )
      continue;
    c.phase = "ready";
  }
}
export function crossingAllows(s: Match, pos: Pos, u: Unit): boolean {
  return Object.values(s.crossings ?? {}).some(
    (c) =>
      c.phase === "ready" &&
      c.hp > 0 &&
      anchorsIntact(s, c) &&
      c.tiles.some((p) => distance(p, pos) === 0) &&
      (c.kind === "silk"
        ? u.owner === c.owner && ["worker", "company", "beast"].includes(u.kind)
        : u.owner === c.owner ||
          effectiveRelation(s, c.owner, u.owner) === "alliance"),
  );
}
export function damageCrossing(s: Match, id: string, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("Invalid crossing damage");
  const c = s.crossings[id];
  if (!c) throw new Error("Unknown crossing");
  c.hp = Math.max(0, c.hp - amount);
  if (c.hp === 0) c.phase = "destroyed";
}
export function validateCrossingState(
  s: Match,
  c: Crossing,
  guestSeat?: string,
): void {
  const expected = span(s, c),
    p = s.players[c.owner],
    u = s.units[c.crew];
  const from = s.facilities[c.from],
    to = s.facilities[c.to];
  // An owned crossing survives capture of an anchor. Guest projections may omit
  // that now-hostile unseen endpoint; validate observed geometry, never invent it.
  const partial = Boolean(guestSeat && c.owner === guestSeat && (!from || !to));
  const first = c.tiles[0],
    last = c.tiles.at(-1);
  const straight =
    c.tiles.length >= 3 &&
    c.tiles.length <= 6 &&
    first &&
    last &&
    (first.x === last.x || first.y === last.y) &&
    distance(first, last) === c.tiles.length - 1 &&
    c.tiles.every(
      (at, i) =>
        Number.isInteger(at.x) &&
        Number.isInteger(at.y) &&
        at.x >= 0 &&
        at.y >= 0 &&
        at.x < s.map.width &&
        at.y < s.map.height &&
        (i === 0 || distance(at, c.tiles[i - 1]) === 1),
    );
  const geometryValid = partial
    ? straight &&
      (!from || distance(from, first!) === 0) &&
      (!to || distance(to, last!) === 0)
    : expected.length > 0 &&
      JSON.stringify(expected) === JSON.stringify(c.tiles);
  if (
    s.crossings[c.id] !== c ||
    !p ||
    (!u && !guestSeat) ||
    (u && u.kind !== "worker") ||
    !["ent_grove", "spider_brood"].includes(p.profile) ||
    c.kind !== (p.profile === "ent_grove" ? "causeway" : "silk") ||
    !["building", "ready", "destroyed"].includes(c.phase) ||
    c.from === c.to ||
    !geometryValid ||
    c.maxHp !== 60 ||
    !Number.isSafeInteger(c.hp) ||
    c.hp < 0 ||
    c.hp > c.maxHp ||
    (c.phase === "destroyed") !== (c.hp === 0) ||
    !Number.isInteger(c.started) ||
    c.started < 1 ||
    c.started > s.turn ||
    !Number.isInteger(c.lastProgress) ||
    c.lastProgress < c.started - 1 ||
    c.lastProgress > s.turn
  )
    throw new Error("Invalid physical crossing checkpoint");
}
