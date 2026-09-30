import { stocks, type Match, type Pos, type Stock } from "./types";
import { navalRoute, type Vessel } from "./naval";
export interface NavalEffect {
  id: string;
  owner: string;
  kind: "calm" | "surf" | "unload-shield" | "beacon";
  ship?: string;
  tiles: Pos[];
  until: number;
  turn: number;
  used: boolean;
}
export interface NavalPowerAction {
  kind: "naval-power";
  power: "field" | "support";
  ship?: string;
  x?: number;
  y?: number;
}
type Observed = (p: Pos) => boolean;
type Connected = (a: Pos, b: Pos) => boolean;
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const active = (s: Match, e: NavalEffect) =>
  e.until > s.revision && e.turn === s.turn;
const coastal = (s: Match, p: Pos) =>
  Number.isInteger(p.x) &&
  Number.isInteger(p.y) &&
  p.x >= 0 &&
  p.y >= 0 &&
  p.x < s.map.width &&
  p.y < s.map.height &&
  s.map.terrain[p.y * s.map.width + p.x] === "water" &&
  [
    { x: p.x + 1, y: p.y },
    { x: p.x - 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x, y: p.y - 1 },
  ].some(
    (q) =>
      q.x >= 0 &&
      q.y >= 0 &&
      q.x < s.map.width &&
      q.y < s.map.height &&
      !["water", "cliff"].includes(s.map.terrain[q.y * s.map.width + q.x]),
  );
export function navalPowerCost(
  profile: string,
  power: "field" | "support",
): Stock {
  return power === "field"
    ? stocks()
    : profile === "elf_falmari"
      ? stocks(0, 5)
      : stocks(10, 15);
}
export function navalPowerReason(
  s: Match,
  seat: string,
  a: NavalPowerAction,
  observed: Observed,
  connected: Connected,
): string {
  const p = s.players[seat],
    h = p && s.units[p.hero.id],
    v = a.ship ? s.vessels[a.ship] : undefined;
  if (!p || p.hero.status !== "living" || !h?.alive || !h.active || h.hp <= 0)
    return "Living conscious hero required";
  if (!(
    ["elf_falmari", "uinen"].includes(p.profile) ||
    (p.profile === "osse" && a.power === "field")
  ))
    return "This naval power requires a separate unsupported domain";
  if (
    p.hero.readiness < (a.power === "field" ? 2 : 3) ||
    (p.commitment < 1 && (a.power === "support" || !p.encounter))
  )
    return "Required readiness and hero commitment missing";
  const cost = navalPowerCost(p.profile, a.power);
  if ((["P", "M", "K", "E"] as const).some((k) => p.stock[k] < cost[k]))
    return "Insufficient adopted naval power stocks";
  if (p.profile === "osse") {
    const pos = { x: a.x ?? -1, y: a.y ?? -1 };
    return coastal(s, pos) && distance(h, pos) <= 5 && observed(pos)
      ? ""
      : "Visible coastal water strip within 15 metres required";
  }
  if (!v || v.owner !== seat || v.hp <= 0 || v.phase === "wreck")
    return "Own existing surviving vessel required";
  if (a.power === "field") {
    if (p.profile === "uinen")
      return v.hp < v.maxHp && distance(h, v) <= 5 && observed(v)
        ? ""
        : "One visible damaged vessel within 15 metres required";
    const landing = v.handling?.landing;
    return v.phase === "unloading" &&
      v.handling?.kind === "disembark" &&
      landing &&
      coastal(s, v) &&
      (v.aboardHero === h.id || distance(h, landing) <= 1)
      ? ""
      : "One actual coastal unloading with hero aboard or at its landing required";
  }
  if (!connected(h, v)) return "Hero must be in the connected coastal region";
  if (p.profile === "elf_falmari") {
    if (
      v.phase !== "sailing" ||
      !v.route.every(observed) ||
      !v.route.some((p) => coastal(s, p))
    )
      return "Existing observed coastal voyage required";
    if (
      !Object.values(s.facilities).some(
        (f) =>
          f.owner === seat &&
          f.kind === "beacon" &&
          f.hp > 0 &&
          f.workers > 0 &&
          v.route.some((p) => distance(f, p) <= 3),
      )
    )
      return "Existing staffed beacon along the coastal route required";
    if (
      (s.navalEffects ?? []).some(
        (e) => e.kind === "beacon" && e.ship === v.id && active(s, e),
      )
    )
      return "Voyage already has this week’s beacon assignment";
    if (s.players[seat].stock.P < 2 || !s.units[v.crew]?.supplied)
      return "Existing voyage provisions and supplied crew required";
    return "";
  }
  if (!v.repair || v.repair.accelerated)
    return "One funded repair not already advanced required";
  if (
    !Object.values(s.facilities).some(
      (f) =>
        f.owner === seat &&
        f.kind === "rescue-yard" &&
        f.hp > 0 &&
        f.workers > 0 &&
        distance(f, v) <= 1,
    )
  )
    return "Staffed rescue yard beside the existing transport required";
  if (
    !s.units[v.crew]?.alive ||
    !s.units[v.crew]?.supplied ||
    effectiveWave(s, v, v) > 0
  )
    return "Supplied crew and workable water required";
  return "";
}
export function applyNavalPower(
  s: Match,
  seat: string,
  a: NavalPowerAction,
  observed: Observed,
  connected: Connected,
): void {
  const reason = navalPowerReason(s, seat, a, observed, connected);
  if (reason) throw new Error(reason);
  const p = s.players[seat],
    v = a.ship ? s.vessels[a.ship] : undefined,
    cost = navalPowerCost(p.profile, a.power);
  for (const k of ["P", "M", "K", "E"] as const) p.stock[k] -= cost[k];
  p.hero.readiness -= a.power === "field" ? 2 : 3;
  if (p.profile === "uinen" && a.power === "support") {
    v!.repair!.accelerated = true;
    if (--v!.repair!.remaining === 0) {
      v!.hp = Math.min(v!.maxHp, v!.hp + 20);
      delete v!.repair;
    }
    return;
  }
  const kind: NavalEffect["kind"] =
    p.profile === "osse"
      ? "surf"
      : p.profile === "uinen"
        ? "calm"
        : a.power === "field"
          ? "unload-shield"
          : "beacon";
  s.navalEffects ??= [];
  s.navalEffects = s.navalEffects.filter(
    (e) =>
      active(s, e) &&
      !(
        e.owner === seat &&
        e.kind === kind &&
        e.ship === v?.id &&
        (kind !== "surf" || e.tiles.some((p) => p.x === a.x && p.y === a.y))
      ),
  );
  s.navalEffects.push({
    id: `naval-effect:${s.nextId++}`,
    owner: seat,
    kind,
    ...(v ? { ship: v.id } : {}),
    tiles: kind === "surf" ? [{ x: a.x!, y: a.y! }] : [],
    until:
      a.power === "field"
        ? s.revision + (kind === "unload-shield" ? 1 : 2)
        : 1000000,
    turn: s.turn,
    used: false,
  });
}
export function effectiveWave(s: Match, v: Vessel, pos: Pos): number {
  const effects = (s.navalEffects ?? []).filter((e) => active(s, e));
  const base = s.seaHazards?.[`${pos.x},${pos.y}`]?.wave ?? 0;
  const surf = effects.some(
    (e) => e.kind === "surf" && e.tiles.some((p) => distance(p, pos) === 0),
  )
    ? 1
    : 0;
  const calm = effects.some((e) => e.kind === "calm" && e.ship === v.id)
    ? 1
    : 0;
  return Math.max(0, Math.min(3, base + surf) - calm);
}
/** Surf severity+1 and one movement step lost are provisional numeric tuning. */
export function navalSurfPenalty(s: Match, pos: Pos): number {
  return (s.navalEffects ?? []).some(
    (e) =>
      active(s, e) &&
      e.kind === "surf" &&
      e.tiles.some((p) => distance(p, pos) === 0),
  )
    ? 1
    : 0;
}
export function consumeFogProtection(s: Match, v: Vessel): boolean {
  const e = (s.navalEffects ?? []).find(
    (e) => active(s, e) && !e.used && e.kind === "beacon" && e.ship === v.id,
  );
  if (
    !e ||
    !Object.values(s.facilities).some(
      (f) =>
        f.owner === e.owner &&
        f.kind === "beacon" &&
        f.hp > 0 &&
        f.workers > 0 &&
        v.route.some((p) => distance(f, p) <= 3),
    )
  )
    return false;
  e.used = true;
  return true;
}
export function unloadingDamage(
  s: Match,
  v: Vessel,
  amount: number,
  ranged: boolean,
): number {
  return ranged &&
    v.phase === "unloading" &&
    (s.navalEffects ?? []).some(
      (e) => active(s, e) && e.kind === "unload-shield" && e.ship === v.id,
    )
    ? Math.ceil(amount * 0.75)
    : amount;
}
export function expireNavalEffects(s: Match): void {
  s.navalEffects = (s.navalEffects ?? []).filter((e) => active(s, e));
}

export function validateNavalEffects(s: Match, guestSeat?: string): void {
  const seen = new Set<string>();
  for (const e of s.navalEffects ?? []) {
    const p = s.players[e.owner],
      ship = e.ship ? s.vessels[e.ship] : undefined;
    const profile =
      e.kind === "surf" ? "osse" : e.kind === "calm" ? "uinen" : "elf_falmari";
    const signature = `${e.owner}:${e.kind}:${e.ship ?? JSON.stringify(e.tiles)}`;
    if (
      !e.id ||
      !p ||
      p.profile !== profile ||
      !["surf", "calm", "beacon", "unload-shield"].includes(e.kind) ||
      !Number.isInteger(e.turn) ||
      e.turn < 1 ||
      e.turn > s.turn ||
      !Number.isInteger(e.until) ||
      e.until < 1 ||
      (e.kind === "beacon"
        ? e.until !== 1000000
        : e.until > s.revision + (e.kind === "unload-shield" ? 1 : 2)) ||
      typeof e.used !== "boolean" ||
      (e.kind !== "beacon" && e.used) ||
      seen.has(signature)
    )
      throw new Error("Invalid naval power checkpoint");
    seen.add(signature);
    if (e.kind === "surf") {
      if (e.ship || e.tiles.length !== 1 || !coastal(s, e.tiles[0]))
        throw new Error("Invalid physical surf effect");
    } else if (
      !e.ship ||
      e.tiles.length ||
      (!ship && !guestSeat) ||
      (ship && ship.owner !== e.owner)
    )
      throw new Error("Invalid naval effect vessel");
  }
}
/** Connected sea region requires a physical water route; inland reach must pass
 * an actual staffed owned harbor. Caller supplies ordinary dry path validation. */
export function connectedCoastal(
  s: Match,
  from: Pos,
  to: Pos,
  landConnected: Connected,
): boolean {
  const owner = "owner" in from ? String(from.owner) : undefined;
  const starts: Pos[] = [];
  if (s.map.terrain[from.y * s.map.width + from.x] === "water")
    starts.push(from);
  else
    for (const f of Object.values(s.facilities)) {
      if (
        !["harbor", "rescue-yard"].includes(f.kind) ||
        f.hp <= 0 ||
        f.workers < 1 ||
        (owner && f.owner !== owner) ||
        !landConnected(from, f)
      )
        continue;
      for (const pos of [
        { x: f.x + 1, y: f.y },
        { x: f.x - 1, y: f.y },
        { x: f.x, y: f.y + 1 },
        { x: f.x, y: f.y - 1 },
      ])
        if (
          pos.x >= 0 &&
          pos.y >= 0 &&
          pos.x < s.map.width &&
          pos.y < s.map.height &&
          s.map.terrain[pos.y * s.map.width + pos.x] === "water"
        )
          starts.push(pos);
    }
  return starts.some((start) => Boolean(navalRoute(s, start, to)));
}
