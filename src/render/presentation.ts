/** View-only observations. Never retain unseen entities or use animation time in rules. */
import type { Match, Pos } from "../simulation/types";
import { visible } from "../simulation/engine";
import { isAboard, isNavalCrew } from "../simulation/naval";

export const MAX_CUES = 32;
export type CueKind =
  | "travel"
  | "attack"
  | "impact"
  | "arrival"
  | "loss"
  | "work"
  | "capture"
  | "magic";
export interface VisualEntity extends Pos {
  id: string;
  owner: string;
  hp: number;
  alive: boolean;
  building: boolean;
  kind: string;
  working: boolean;
  remaining: number;
  workShape: "person" | "tree" | "bird" | "wolf" | "spider";
  hearth: boolean;
  profile: string;
  companion?: string;
  secondary?: string;
}
export interface ViewFrame {
  match: string;
  seat: string;
  turn: number;
  revision: number;
  lastEvent: number;
  entities: Record<string, VisualEntity>;
  sites: Record<string, { owner: string | null; x: number; y: number }>;
  zones: Record<string, Pos>;
  witnessedAttacks: string[];
  attackTargets: Record<string, Pos>;
}
export interface VisualCue extends Pos {
  kind: CueKind;
  entity: string;
  amount?: number;
  route?: Pos[];
  target?: Pos;
}
const workShapes: Record<string, VisualEntity["workShape"]> = {
  ent_grove: "tree",
  eagle_eyrie: "bird",
  wolf_pack: "wolf",
  spider_brood: "spider",
};
const workAppearance = (profile: string) => ({
  workShape: workShapes[profile] ?? "person",
  hearth:
    profile.startsWith("human_") ||
    profile.startsWith("dwarf_") ||
    profile === "istari_forge" ||
    profile === "sauron" ||
    profile === "melkor_dark_architect",
});
const same = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;
export function captureView(s: Match, seat: string): ViewFrame {
  const entities: ViewFrame["entities"] = {};
  for (const u of Object.values(s.units))
    if (visible(s, seat, u) && !isAboard(s, u.id) && !isNavalCrew(s, u.id))
      entities[u.id] = {
        id: u.id,
        x: u.x,
        y: u.y,
        owner: u.owner,
        hp: u.hp,
        alive: u.alive,
        building: false,
        kind: u.kind,
        companion: u.companion,
        secondary: u.secondary,
        working: false,
        remaining: 0,
        profile: s.players[u.owner]?.profile ?? "",
        ...workAppearance(s.players[u.owner]?.profile ?? ""),
      };
  for (const f of Object.values(s.facilities))
    if (visible(s, seat, f))
      entities[f.id] = {
        id: f.id,
        x: f.x,
        y: f.y,
        owner: f.owner,
        hp: f.hp,
        alive: f.hp > 0,
        building: true,
        kind: f.kind,
        working:
          f.owner === seat && f.workers > 0 && !!(f.job || f.repair || f.rest),
        remaining:
          f.owner === seat
            ? (f.job?.remaining ??
              f.repair?.remaining ??
              f.rest?.remaining ??
              0)
            : 0,
        profile: s.players[f.owner]?.profile ?? "",
        ...workAppearance(s.players[f.owner]?.profile ?? ""),
      };
  const zones: ViewFrame["zones"] = {};
  for (const z of Object.values(s.zones))
    if (z.until > s.revision && (z.owner === seat || visible(s, seat, z)))
      zones[z.id] = { x: z.x, y: z.y };
  return {
    match: s.id,
    seat,
    turn: s.turn,
    revision: s.revision,
    lastEvent: s.events.reduce((n, e) => Math.max(n, e.id), 0),
    entities,
    sites: Object.fromEntries(
      s.sites.map((v) => [v.id, { owner: v.owner, x: v.x, y: v.y }]),
    ),
    zones,
    witnessedAttacks: Object.values(s.witnessedAttacks)
      .filter((w) => w.owner === seat)
      .map((w) => w.id),
    attackTargets: Object.fromEntries(
      s.orders
        .filter((o) => o.seat === seat && o.action.kind === "attack")
        .flatMap((o) => {
          if (o.action.kind !== "attack") return [];
          const target = entities[o.action.target];
          return target ? [[o.action.unit, { x: target.x, y: target.y }]] : [];
        }),
    ),
  };
}
export function transitionCues(
  before: ViewFrame | undefined,
  after: ViewFrame,
  s: Match,
): VisualCue[] {
  if (
    !before ||
    before.match !== after.match ||
    before.seat !== after.seat ||
    after.revision < before.revision ||
    after.turn < before.turn ||
    (after.revision === before.revision && after.turn === before.turn)
  )
    return [];
  const cues: VisualCue[] = [];
  // A dated private identity-bearing combat observation is necessary. Injury
  // alone cannot name an attacker, and enemy orders never enter this view.
  for (const witness of Object.values(s.witnessedAttacks)) {
    const actor = after.entities[witness.attacker];
    if (
      witness.owner !== after.seat ||
      before.witnessedAttacks.includes(witness.id) ||
      !actor?.alive ||
      actor.owner !== after.seat
    )
      continue;
    cues.push({
      kind: "attack",
      entity: actor.id,
      x: actor.x,
      y: actor.y,
      target: before.attackTargets[actor.id],
    });
  }
  for (const e of Object.values(after.entities)) {
    const old = before.entities[e.id];
    if (!old) {
      if (e.owner === after.seat && e.alive)
        cues.push({ kind: "arrival", entity: e.id, x: e.x, y: e.y });
      continue;
    }
    if (old.alive && !e.alive) {
      cues.push({ kind: "loss", entity: e.id, x: e.x, y: e.y });
      continue;
    }
    if (!e.alive) continue;
    if (!old.alive && e.owner === after.seat)
      cues.push({ kind: "arrival", entity: e.id, x: e.x, y: e.y });
    if (e.hp < old.hp)
      cues.push({
        kind: "impact",
        entity: e.id,
        x: e.x,
        y: e.y,
        amount: old.hp - e.hp,
      });
    if (e.owner === after.seat && !e.building && !same(old, e)) {
      const moves = s.events
        .filter(
          (event) =>
            event.id > before.lastEvent &&
            event.audience !== "public" &&
            event.audience.length === 1 &&
            event.audience[0] === after.seat &&
            event.motion?.unit === e.id,
        )
        .map((event) => event.motion!);
      const routes = moves.filter(
        (m) =>
          m.route.length > 1 &&
          same(m.route[0], old) &&
          same(m.route.at(-1)!, e),
      );
      // Only a trusted identity-bearing own event proves travel. Unknown routes snap.
      if (routes.length === 1)
        cues.push({
          kind: "travel",
          entity: e.id,
          x: e.x,
          y: e.y,
          route: routes[0].route.map((p) => ({ ...p })),
        });
    }
    if (
      e.owner === after.seat &&
      old.working &&
      old.remaining === 1 &&
      !e.working &&
      after.turn > before.turn
    )
      cues.push({ kind: "work", entity: e.id, x: e.x, y: e.y });
  }
  for (const [id, site] of Object.entries(after.sites))
    if (before.sites[id] && site.owner !== before.sites[id].owner)
      cues.push({ kind: "capture", entity: id, x: site.x, y: site.y });
  for (const [id, zone] of Object.entries(after.zones))
    if (!before.zones[id]) cues.push({ kind: "magic", entity: id, ...zone });
  // Critical impacts first; thousands of simultaneous arrivals cannot allocate unbounded effects.
  return cues
    .sort(
      (a, b) =>
        Number(b.kind === "impact" || b.kind === "loss") -
        Number(a.kind === "impact" || a.kind === "loss"),
    )
    .slice(0, MAX_CUES);
}
export function walkPosition(route: Pos[], progress: number): Pos {
  const value = Math.max(0, Math.min(1, progress)) * (route.length - 1),
    index = Math.min(Math.floor(value), route.length - 1),
    a = route[index],
    b = route[Math.min(index + 1, route.length - 1)],
    t = value - index;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
export function visualSeed(id: string): number {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return n;
}
