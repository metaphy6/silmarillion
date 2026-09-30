/** Cross-era sandbox RTS. Fixed-step authority; all numbers except hero recipes are provisional. */
import { rtsStateSchema, rtsCommandSchema } from "./rts-schema";
import { heroRecipe, profile, limits } from "../content/catalog";
import { stocks, type Stock, type Pos, type HeroStatus } from "./types";
export const RTS_TICK_MS = 100,
  RTS_VERSION = "silmarillion-rts-1";
export type UnitKind = "worker" | "soldier" | "archer" | "siege" | "hero";
export type BuildingKind =
  "keep" | "barracks" | "farm" | "lore" | "tower" | "wall" | "workshop";
export type Terrain = "grass" | "forest" | "water" | "road" | "cliff" | "ford";
export interface RTSOrder {
  kind:
    | "move"
    | "attackMove"
    | "attack"
    | "gather"
    | "build"
    | "supply"
    | "stop"
    | "hold";
  x?: number;
  y?: number;
  target?: string;
}
export interface RTSUnit extends Pos {
  id: string;
  owner: string;
  kind: UnitKind;
  name: string;
  hp: number;
  maxHp: number;
  orders: RTSOrder[];
  state: "idle" | "moving" | "working" | "attacking" | "dead";
  facing: number;
  cargo: Stock;
  attackCooldown: number;
  work: number;
  path: Pos[];
  repath: number;
  hold: boolean;
  stalled: number;
  ammo: number;
  commitment?: {
    kind: "refit" | "voice" | "recover";
    target?: string;
    due: number;
    origin: Pos;
    point?: Pos;
  };
}
export interface RTSJob {
  product: UnitKind | "component";
  remaining: number;
  total: number;
  cost: Stock;
}
export interface RTSBuilding extends Pos {
  id: string;
  owner: string;
  kind: BuildingKind;
  name: string;
  hp: number;
  maxHp: number;
  progress: number;
  queue: RTSJob[];
  rally: Pos;
  cooldown: number;
}
export interface RTSResource extends Pos {
  id: string;
  kind: keyof Stock;
  name: string;
  amount: number;
}
export interface RTSPlayer {
  profile: string;
  stock: Stock;
  component: number;
  hero: {
    status: HeroStatus;
    id: string;
    level: number;
    perks: string[];
    readiness: number;
  };
  nextSeq: number;
  ai: boolean;
  abilityReady: number;
}
export interface RTSEvent extends Pos {
  id: number;
  tick: number;
  kind: "attack" | "death" | "complete" | "delivery" | "warning";
  audience: string[];
  target?: Pos;
  text: string;
}
export interface RTSState {
  version: string;
  tick: number;
  seed: number;
  width: number;
  height: number;
  terrain: Terrain[];
  players: Record<string, RTSPlayer>;
  units: Record<string, RTSUnit>;
  buildings: Record<string, RTSBuilding>;
  resources: Record<string, RTSResource>;
  events: RTSEvent[];
  winner: string | null;
  nextId: number;
  explored: Record<string, number[]>;
}
export type RTSCommand =
  | { kind: "order"; units: string[]; order: RTSOrder; queued?: boolean }
  | {
      kind: "build";
      building: BuildingKind;
      x: number;
      y: number;
      workers: string[];
    }
  | { kind: "produce"; building: string; product: UnitKind | "component" }
  | { kind: "rally"; building: string; x: number; y: number }
  | { kind: "cancel"; building: string }
  | { kind: "ability"; x: number; y: number }
  | { kind: "surrender-hero" }
  | { kind: "recover-hero" };
interface Spec {
  name: string;
  cost: Stock;
  seconds: number;
  hp: number;
  prerequisite?: BuildingKind;
}
const buildings: Record<BuildingKind, Spec> = {
  keep: { name: "Citadel", cost: stocks(0, 180, 30), seconds: 50, hp: 1800 },
  barracks: {
    name: "Mustering hall",
    cost: stocks(0, 90, 0),
    seconds: 22,
    hp: 700,
  },
  farm: { name: "Provision farm", cost: stocks(0, 50), seconds: 16, hp: 380 },
  lore: {
    name: "Lore workshop",
    cost: stocks(0, 70, 10),
    seconds: 22,
    hp: 420,
  },
  tower: {
    name: "Watch tower",
    cost: stocks(0, 85, 10),
    seconds: 25,
    hp: 700,
    prerequisite: "barracks",
  },
  wall: { name: "Curtain wall", cost: stocks(0, 16), seconds: 8, hp: 650 },
  workshop: {
    name: "Siege workshop",
    cost: stocks(0, 120, 35),
    seconds: 32,
    hp: 650,
    prerequisite: "barracks",
  },
};
export const buildingSpec = (k: BuildingKind) => buildings[k];
export function unitSpec(
  k: UnitKind,
  p = "human_gondor",
): Spec & {
  attack: number;
  range: number;
  speed: number;
  facility: BuildingKind;
} {
  const sar = p === "istari_saruman";
  const defs = {
    worker: {
      name: sar ? "Isengard laborer" : "Gondor mason",
      cost: stocks(25),
      seconds: 8,
      hp: 65,
      attack: 3,
      range: 1.1,
      speed: 2,
      facility: "keep" as const,
    },
    soldier: {
      name: sar ? "Iron pikeman" : "Gondor guardsman",
      cost: stocks(35, 20),
      seconds: 10,
      hp: sar ? 130 : 150,
      attack: 14,
      range: 1.25,
      speed: 1.8,
      facility: "barracks" as const,
    },
    archer: {
      name: sar ? "Crossbow company" : "Gondor ranger",
      cost: stocks(30, 30, 5),
      seconds: 12,
      hp: 80,
      attack: 11,
      range: 5.5,
      speed: 2,
      facility: "barracks" as const,
    },
    siege: {
      name: sar ? "Iron ram" : "Stone thrower",
      cost: stocks(50, 100, 20),
      seconds: 25,
      hp: 260,
      attack: 75,
      range: sar ? 1.7 : 6,
      speed: 1,
      facility: "workshop" as const,
    },
    hero: {
      name: profile(p).hero,
      cost: heroRecipe(p).cost,
      seconds: heroRecipe(p).turns * 25,
      hp: 450,
      attack: 27,
      range: 2.2,
      speed: 2.2,
      facility: "keep" as const,
    },
  };
  return defs[k];
}
const distance = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y),
  keys = ["P", "M", "K", "E"] as const;
const affordable = (p: RTSPlayer, c: Stock) =>
  keys.every((k) => p.stock[k] >= c[k]);
const pay = (p: RTSPlayer, c: Stock) => {
  for (const k of keys) p.stock[k] -= c[k];
};
function emit(
  s: RTSState,
  kind: RTSEvent["kind"],
  at: Pos,
  text: string,
  target?: Pos,
) {
  s.events.push({
    id: s.nextId++,
    tick: s.tick,
    kind,
    audience: Object.keys(s.players).filter((seat) => isVisible(s, seat, at)),
    x: at.x,
    y: at.y,
    text,
    ...(target ? { target: { x: target.x, y: target.y } } : {}),
  });
  if (s.events.length > 100) s.events.shift();
}
function addUnit(s: RTSState, owner: string, kind: UnitKind, at: Pos) {
  const spec = unitSpec(kind, s.players[owner].profile),
    id = kind === "hero" ? s.players[owner].hero.id : `u${s.nextId++}`;
  s.units[id] = {
    id,
    owner,
    kind,
    name: spec.name,
    x: at.x,
    y: at.y,
    hp: spec.hp,
    maxHp: spec.hp,
    orders: [],
    state: "idle",
    facing: 0,
    cargo: stocks(),
    attackCooldown: 0,
    work: 0,
    path: [],
    repath: 0,
    hold: false,
    stalled: 0,
    ammo: kind === "siege" ? 3 : 0,
  };
  if (kind === "hero") {
    s.players[owner].hero.status = "living";
    s.players[owner].hero.readiness = 6;
  }
  return s.units[id];
}
function addBuilding(
  s: RTSState,
  owner: string,
  kind: BuildingKind,
  at: Pos,
  progress = 1,
) {
  const spec = buildingSpec(kind),
    id = `b${s.nextId++}`;
  return (s.buildings[id] = {
    id,
    owner,
    kind,
    name:
      kind === "keep"
        ? s.players[owner].profile === "human_gondor"
          ? "Citadel Hall"
          : "Orthanc Workshop"
        : spec.name,
    x: at.x,
    y: at.y,
    hp: progress ? spec.hp : 80,
    maxHp: spec.hp,
    progress,
    queue: [],
    rally: { x: at.x + (owner === "p1" ? 2 : -2), y: at.y + 2 },
    cooldown: 0,
  });
}
export function createRTS(seed = 1): RTSState {
  const s: RTSState = {
    version: RTS_VERSION,
    tick: 0,
    seed,
    width: 48,
    height: 32,
    terrain: [],
    players: {},
    units: {},
    buildings: {},
    resources: {},
    events: [],
    winner: null,
    nextId: 1,
    explored: { p1: [], p2: [] },
  };
  for (let y = 0; y < s.height; y++)
    for (let x = 0; x < s.width; x++) {
      const river = 23 + Math.round(Math.sin(y * 0.27) * 2),
        crossing = (y >= 8 && y <= 11) || (y >= 22 && y <= 24);
      const forest = [
        [15, 4, 4],
        [7, 24, 5],
        [34, 5, 4],
        [42, 14, 3],
        [28, 28, 3],
      ].some(
        ([cx, cy, r]) =>
          Math.hypot(x - cx, (y - cy) * 0.9) < r + 0.6 * Math.sin(x + y),
      );
      const ridge =
        (x >= 17 && x <= 19 && y >= 16 && y <= 20) ||
        (x >= 31 && x <= 34 && y >= 15 && y <= 16);
      s.terrain.push(
        x >= river && x <= river + 1
          ? crossing
            ? "ford"
            : "water"
          : y === 10 || y === 23
            ? "road"
            : ridge
              ? "cliff"
              : forest
                ? "forest"
                : "grass",
      );
    }
  for (const [seat, p, x, y] of [
    ["p1", "human_gondor", 6, 9],
    ["p2", "istari_saruman", 41, 22],
  ] as const) {
    s.players[seat] = {
      profile: p,
      stock: stocks(220, 250, 80, 70),
      component: 0,
      hero: {
        status: "uncreated",
        id: `hero-${seat}`,
        level: 1,
        perks: [],
        readiness: 6,
      },
      nextSeq: 1,
      ai: seat === "p2",
      abilityReady: 0,
    };
    addBuilding(s, seat, "keep", { x, y });
    addBuilding(s, seat, "barracks", { x: x + 2, y: y + 3 });
    for (let i = 0; i < 5; i++)
      addUnit(s, seat, "worker", { x: x - 2 + i * 0.7, y: y + 2 });
    for (let i = 0; i < 4; i++)
      addUnit(s, seat, i === 3 ? "archer" : "soldier", {
        x: x + 2,
        y: y - 2 + i * 0.8,
      });
    for (const [k, dx, dy] of [
      ["P", -3, -3],
      ["M", 4, -3],
      ["K", -4, 5],
      ["E", 4, 5],
    ] as const) {
      const id = `r${s.nextId++}`;
      s.resources[id] = {
        id,
        kind: k,
        name: {
          P: "Orchard",
          M:
            seat === "p1"
              ? "Timber and stone quarry"
              : "Timber and metal salvage",
          K: "Lore salvage",
          E: "Essence spring",
        }[k],
        x: x + dx,
        y: y + dy,
        amount: 1400,
      };
    }
    const workers = Object.values(s.units).filter(
      (u) => u.owner === seat && u.kind === "worker",
    );
    const resources = Object.values(s.resources).filter(
      (r) => distance(r, { x, y }) < 9,
    );
    workers.forEach(
      (u, i) => (u.orders = [{ kind: "gather", target: resources[i % 4].id }]),
    );
  }
  updateVision(s);
  return s;
}
export function isVisible(s: RTSState, seat: string, p: Pos) {
  return (
    Object.values(s.units).some(
      (u) => u.owner === seat && u.hp > 0 && distance(u, p) < 8,
    ) ||
    Object.values(s.buildings).some(
      (b) => b.owner === seat && b.hp > 0 && distance(b, p) < 7,
    )
  );
}
function updateVision(s: RTSState) {
  for (const seat of Object.keys(s.players)) {
    const known = new Set(s.explored[seat]);
    for (const p of [...Object.values(s.units), ...Object.values(s.buildings)])
      if (p.owner === seat && p.hp > 0)
        for (
          let y = Math.max(0, Math.floor(p.y) - 7);
          y < Math.min(s.height, p.y + 8);
          y++
        )
          for (
            let x = Math.max(0, Math.floor(p.x) - 7);
            x < Math.min(s.width, p.x + 8);
            x++
          )
            if (distance(p, { x, y }) < 7) known.add(y * s.width + x);
    s.explored[seat] = [...known].sort((a, b) => a - b);
  }
}
export function walkable(s: RTSState, x: number, y: number, ignore?: string) {
  x = Math.round(x);
  y = Math.round(y);
  return (
    x >= 0 &&
    y >= 0 &&
    x < s.width &&
    y < s.height &&
    !["water", "cliff"].includes(s.terrain[y * s.width + x]) &&
    !Object.values(s.buildings).some(
      (b) =>
        b.id !== ignore &&
        b.hp > 0 &&
        Math.abs(b.x - x) < 0.8 &&
        Math.abs(b.y - y) < 0.8,
    )
  );
}
export function placementReason(
  s: RTSState,
  seat: string,
  kind: BuildingKind,
  x: number,
  y: number,
) {
  if (!buildings[kind]) return "Unknown building";
  const owned = Object.values(s.buildings).filter(
    (b) => b.owner === seat && b.hp > 0,
  );
  if (
    kind === "keep" &&
    owned.filter((b) => b.kind === "keep").length >=
      limits(s.players[seat].profile).cities
  )
    return "Faction city limit reached";
  if (
    kind !== "keep" &&
    kind !== "wall" &&
    owned.filter((b) => b.kind !== "keep" && b.kind !== "wall").length >=
      limits(s.players[seat].profile).plots
  )
    return "Faction support plot limit reached";
  if (!walkable(s, x, y)) return "Blocked terrain or building";
  if (!isVisible(s, seat, { x, y })) return "Scout this location first";
  if (
    Object.values(s.resources).some(
      (r) => r.amount > 0 && distance(r, { x, y }) < 1.2,
    )
  )
    return "Resource site occupied";
  if (
    !Object.values(s.buildings).some(
      (b) => b.owner === seat && b.hp > 0 && distance(b, { x, y }) < 12,
    )
  )
    return "Build within settlement supply reach";
  const spec = buildings[kind];
  if (
    spec.prerequisite &&
    !Object.values(s.buildings).some(
      (b) =>
        b.owner === seat &&
        b.kind === spec.prerequisite &&
        b.progress === 1 &&
        b.hp > 0,
    )
  )
    return `Requires completed ${spec.prerequisite}`;
  return "";
}
const navigationCache = new WeakMap<
  RTSState,
  { signature: string; mask: Uint8Array }
>();
function navigation(s: RTSState) {
  const bs = Object.values(s.buildings).filter((b) => b.hp > 0),
    signature = bs.map((b) => `${b.id}:${b.x}:${b.y}`).join("|");
  let cache = navigationCache.get(s);
  if (!cache || cache.signature !== signature) {
    const mask = new Uint8Array(
      s.terrain.map((t) => (["water", "cliff"].includes(t) ? 1 : 0)),
    );
    for (const b of bs) mask[Math.round(b.y) * s.width + Math.round(b.x)] = 1;
    cache = { signature, mask };
    navigationCache.set(s, cache);
  }
  return cache.mask;
}
function route(s: RTSState, start: Pos, end: Pos, knownSeat?: string): Pos[] {
  const mask = knownSeat ? navigation(s).slice() : navigation(s);
  if (knownSeat)
    for (const b of Object.values(s.buildings))
      if (
        b.owner !== knownSeat &&
        !isVisible(s, knownSeat, b) &&
        !["water", "cliff"].includes(
          s.terrain[Math.round(b.y) * s.width + Math.round(b.x)],
        )
      )
        mask[Math.round(b.y) * s.width + Math.round(b.x)] = 0;
  const open = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < s.width &&
    y < s.height &&
    mask[y * s.width + x] === 0;
  const sx = Math.round(start.x),
    sy = Math.round(start.y);
  let ex = Math.round(end.x),
    ey = Math.round(end.y);
  if (!open(ex, ey)) {
    const options: Pos[] = [];
    for (let y = ey - 2; y <= ey + 2; y++)
      for (let x = ex - 2; x <= ex + 2; x++)
        if (open(x, y)) options.push({ x, y });
    options.sort(
      (a, b) =>
        distance(a, end) - distance(b, end) ||
        distance(a, start) - distance(b, start),
    );
    if (!options.length) return [];
    ex = options[0].x;
    ey = options[0].y;
  }
  const first = sy * s.width + sx,
    goal = ey * s.width + ex,
    prev = new Int32Array(s.width * s.height).fill(-2),
    q = [first];
  prev[first] = -1;
  for (let i = 0; i < q.length; i++) {
    const v = q[i];
    if (v === goal) break;
    const x = v % s.width,
      y = Math.floor(v / s.width);
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        n = ny * s.width + nx;
      if (open(nx, ny) && prev[n] === -2) {
        prev[n] = v;
        q.push(n);
      }
    }
  }
  if (prev[goal] === -2) return [];
  const out: Pos[] = [];
  for (let v = goal; v !== first; v = prev[v])
    out.push({ x: v % s.width, y: Math.floor(v / s.width) });
  return out.reverse();
}
export function commandRTS(
  s: RTSState,
  seat: string,
  c: RTSCommand,
  seq?: number,
): { ok: boolean; reason: string } {
  const p = s.players[seat];
  const fail = (reason: string) => ({ ok: false, reason });
  if (!rtsCommandSchema.safeParse(c).success) return fail("Malformed command");
  if (!p || s.winner) return fail("Match is finished or seat unknown");
  if (seq !== undefined && seq !== p.nextSeq)
    return fail("Duplicate or out-of-order command");
  if (seq !== undefined) p.nextSeq++;
  if (c.kind === "order") {
    const us = c.units.map((id) => s.units[id]);
    if (c.queued && us.some((u) => u?.orders.length >= 20))
      return fail("Order queue full");
    if (new Set(c.units).size !== c.units.length)
      return fail("Duplicate selected unit");
    if (
      !us.length ||
      us.some(
        (u) =>
          !u ||
          u.owner !== seat ||
          u.hp <= 0 ||
          (u.kind === "hero" && p.hero.status !== "living"),
      )
    )
      return fail("Select your living units");
    const o = c.order;
    if (
      ["move", "attackMove"].includes(o.kind) &&
      (!Number.isFinite(o.x) ||
        !Number.isFinite(o.y) ||
        ["water", "cliff"].includes(
          s.terrain[Math.round(o.y!) * s.width + Math.round(o.x!)],
        ) ||
        Object.values(s.buildings).some(
          (b) =>
            b.hp > 0 &&
            (b.owner === seat || isVisible(s, seat, b)) &&
            Math.abs(b.x - Math.round(o.x!)) < 0.8 &&
            Math.abs(b.y - Math.round(o.y!)) < 0.8,
        ))
    )
      return fail("Destination blocked");
    if (
      ["move", "attackMove"].includes(o.kind) &&
      us.some(
        (u) =>
          distance(u, { x: o.x!, y: o.y! }) > 0.75 &&
          !route(s, u, { x: o.x!, y: o.y! }, seat).length,
      )
    )
      return fail("No reachable route; choose another approach");
    if (o.kind === "attack") {
      const t = s.units[o.target!] ?? s.buildings[o.target!];
      if (!t || t.owner === seat || t.hp <= 0 || !isVisible(s, seat, t))
        return fail("Visible hostile target required");
    }
    if (
      o.kind === "supply" &&
      (!s.units[o.target!] ||
        s.units[o.target!].owner !== seat ||
        s.units[o.target!].kind !== "siege" ||
        us.some((u) => u.kind !== "worker"))
    )
      return fail("Workers and your siege engine required");
    if (
      o.kind === "gather" &&
      (!s.resources[o.target!] ||
        !isVisible(s, seat, s.resources[o.target!]) ||
        us.some((u) => u.kind !== "worker"))
    )
      return fail("Workers and a visible resource site required");
    if (
      o.kind === "build" &&
      (!s.buildings[o.target!] ||
        s.buildings[o.target!].owner !== seat ||
        us.some((u) => u.kind !== "worker"))
    )
      return fail("Workers and your construction required");
    us.forEach((u, i) => {
      const order = { ...o };
      if (["move", "attackMove"].includes(o.kind) && us.length > 1) {
        const dx = ((i % 5) - 2) * 0.65,
          dy = Math.floor(i / 5) * 0.65;
        if (walkable(s, o.x! + dx, o.y! + dy)) {
          order.x = o.x! + dx;
          order.y = o.y! + dy;
        }
      }
      if (o.kind === "stop" || o.kind === "hold") {
        u.orders = [];
        u.path = [];
        u.hold = o.kind === "hold";
        u.state = "idle";
        delete u.commitment;
      } else {
        u.hold = false;
        delete u.commitment;
        if (c.queued && u.orders.length < 20) u.orders.push(order);
        else {
          u.orders = [order];
          u.path = [];
        }
      }
    });
    return { ok: true, reason: "Orders acknowledged" };
  }
  if (c.kind === "build") {
    const why = placementReason(s, seat, c.building, c.x, c.y);
    if (why) return fail(why);
    const workers = c.workers.map((id) => s.units[id]);
    if (
      !workers.length ||
      workers.some(
        (u) => !u || u.owner !== seat || u.kind !== "worker" || u.hp <= 0,
      )
    )
      return fail("Select living workers");
    const spec = buildings[c.building];
    if (!affordable(p, spec.cost)) return fail("Insufficient P / M / K / E");
    pay(p, spec.cost);
    const b = addBuilding(
      s,
      seat,
      c.building,
      { x: Math.round(c.x), y: Math.round(c.y) },
      0,
    );
    workers.forEach((u) => {
      u.orders = [{ kind: "build", target: b.id }];
      u.path = [];
    });
    return { ok: true, reason: "Construction paid and assigned" };
  }
  if (c.kind === "surrender-hero") {
    if (p.hero.status !== "captive") return fail("Hero is not captive");
    const h = s.units[p.hero.id];
    if (h) {
      h.hp = 0;
      h.state = "dead";
      h.orders = [];
      h.cargo = stocks();
    }
    p.hero.status = "dead";
    return { ok: true, reason: "Hero slot released; full recreation required" };
  }
  if (c.kind === "ability" || c.kind === "recover-hero") {
    const h = s.units[p.hero.id];
    if (p.hero.status !== "living" || !h || h.hp <= 0)
      return fail("Living hero required");
    if (s.tick < p.abilityReady) return fail("Hero commitment cooling down");
    if (c.kind === "recover-hero") {
      if (
        Object.values(s.units).some(
          (u) => u.owner !== seat && u.hp > 0 && distance(u, h) < 8,
        )
      )
        return fail("Recover away from enemies");
      h.orders = [];
      h.path = [];
      h.commitment = {
        kind: "recover",
        due: s.tick + 100,
        origin: { x: h.x, y: h.y },
      };
      p.abilityReady = s.tick + 250;
      return {
        ok: true,
        reason: "Hero rests for 10 seconds to restore 3 readiness",
      };
    }
    if (!isVisible(s, seat, c) || distance(h, c) > 7)
      return fail("Visible target within hero reach required");
    if (p.profile === "human_gondor") {
      const t = [
        ...Object.values(s.buildings),
        ...Object.values(s.units).filter((u) => u.kind === "siege"),
      ].find(
        (t) =>
          t.owner === seat && t.hp > 0 && t.hp < t.maxHp && distance(t, c) < 2,
      );
      if (!t)
        return fail("Target a damaged owned fortification or siege engine");
      if (
        !Object.values(s.units).some(
          (w) =>
            w.owner === seat &&
            w.kind === "worker" &&
            w.hp > 0 &&
            distance(w, t) < 2.5,
        )
      )
        return fail("Bring a worker beside the repair target");
      if (p.stock.M < 10) return fail("Supply refit requires 10 Materials");
      p.stock.M -= 10;
      h.commitment = {
        kind: "refit",
        target: t.id,
        due: s.tick + 40,
        origin: { x: h.x, y: h.y },
      };
      emit(
        s,
        "warning",
        t,
        "Supply refit: keep hero and worker nearby for four seconds",
      );
    } else {
      if (p.hero.readiness < 3 || p.stock.K < 5 || p.stock.E < 5)
        return fail("Shattering Voice requires 3 readiness + 5K + 5E");
      p.hero.readiness -= 3;
      p.stock.K -= 5;
      p.stock.E -= 5;
      h.commitment = {
        kind: "voice",
        due: s.tick + 20,
        origin: { x: h.x, y: h.y },
        point: { x: c.x, y: c.y },
      };
      emit(
        s,
        "warning",
        c,
        "Shattering Voice: two-second warning — disperse, brace behind walls, or interrupt Saruman",
      );
    }
    p.abilityReady = s.tick + 250;
    h.orders = [];
    h.path = [];
    return { ok: true, reason: "Hero committed; movement or death interrupts" };
  }
  const b = s.buildings[c.building];
  if (!b || b.owner !== seat || b.hp <= 0)
    return fail("Owned living building required");
  if (c.kind === "rally") {
    if (!walkable(s, c.x, c.y)) return fail("Rally point blocked");
    b.rally = { x: c.x, y: c.y };
    return { ok: true, reason: "Rally point set" };
  }
  if (c.kind === "cancel") {
    const j = b.queue.pop();
    if (!j) return fail("Queue is empty");
    keys.forEach((k) => (p.stock[k] += Math.floor(j.cost[k] / 2)));
    if (j.product === "hero") p.hero.status = "dead";
    return {
      ok: true,
      reason: "Cancelled; half stocks refunded; component consumed",
    };
  }
  if (b.progress < 1) return fail("Finish construction first");
  if (b.queue.length >= 5) return fail("Queue full");
  const product = c.product,
    spec =
      product === "component"
        ? {
            name: "Signature component",
            cost: stocks(0, 10, 5),
            seconds: 25,
            facility: "keep",
          }
        : unitSpec(product, p.profile);
  if (
    product === "component" &&
    !Object.values(s.resources).some(
      (r) =>
        r.kind === "M" &&
        r.name.includes(p.profile === "human_gondor" ? "stone" : "metal") &&
        distance(r, b) < 12,
    )
  )
    return fail("Component requires connected stone or metal source access");
  if (b.kind !== spec.facility) return fail(`Requires ${spec.facility}`);
  if (product === "hero" && !["uncreated", "dead"].includes(p.hero.status))
    return fail("Hero slot occupied: living, captive or pending");
  if (product === "hero" && p.component < 1)
    return fail("New signature component required");
  if (!affordable(p, spec.cost)) return fail("Insufficient P / M / K / E");
  const reserved =
    Object.values(s.units).filter(
      (u) => u.owner === seat && u.hp > 0 && u.kind !== "hero",
    ).length +
    Object.values(s.buildings)
      .filter((f) => f.owner === seat)
      .reduce(
        (n, f) =>
          n +
          f.queue.filter(
            (j) => j.product !== "hero" && j.product !== "component",
          ).length,
        0,
      );
  if (
    product !== "hero" &&
    product !== "component" &&
    reserved >= limits(p.profile).supply
  )
    return fail("Supply cap reached");
  pay(p, spec.cost);
  b.queue.push({
    product,
    remaining: spec.seconds * 10,
    total: spec.seconds * 10,
    cost: { ...spec.cost },
  });
  if (product === "hero") {
    p.component--;
    p.hero.status = "pending";
  }
  return { ok: true, reason: "Paid production queued" };
}
function move(s: RTSState, u: RTSUnit, to: Pos, range = 0.2) {
  if (distance(u, to) <= range) return true;
  if (!u.path.length || s.tick >= u.repath) {
    u.path = route(s, u, to);
    u.repath = s.tick + 20;
  }
  const p = u.path[0];
  if (!p) {
    u.stalled++;
    if (distance(u, to) > Math.max(range, 0.72) && u.stalled > 30) {
      emit(
        s,
        "warning",
        u,
        "Route blocked; choose another destination or clear the obstruction",
      );
      u.orders.shift();
      u.path = [];
      u.stalled = 0;
    }
    return distance(u, to) <= Math.max(range, 0.72);
  }
  const d = distance(u, p),
    speed = unitSpec(u.kind, s.players[u.owner].profile).speed * 0.1;
  u.facing = Math.atan2(p.y - u.y, p.x - u.x);
  const next = {
    x: u.x + ((p.x - u.x) / Math.max(d, 0.0001)) * Math.min(d, speed),
    y: u.y + ((p.y - u.y) / Math.max(d, 0.0001)) * Math.min(d, speed),
  };
  const blocker = Object.values(s.units).find(
    (v) => v.id !== u.id && v.hp > 0 && distance(v, next) < 0.38,
  );
  if (!blocker) {
    u.stalled = 0;
    u.x = next.x;
    u.y = next.y;
    u.state = "moving";
    if (d <= speed) u.path.shift();
  } else {
    u.stalled++;
    if (s.tick % 10 === Number(u.id.replace(/\D/g, "")) % 10) {
      for (const side of [-1, 1]) {
        const n = {
          x: u.x + Math.cos(u.facing + (side * Math.PI) / 2) * 0.45,
          y: u.y + Math.sin(u.facing + (side * Math.PI) / 2) * 0.45,
        };
        if (
          walkable(s, n.x, n.y) &&
          !Object.values(s.units).some(
            (v) => v.id !== u.id && v.hp > 0 && distance(v, n) < 0.4,
          )
        ) {
          u.x = n.x;
          u.y = n.y;
          break;
        }
      }
    }
  }
  return distance(u, to) <= range;
}
function hurt(s: RTSState, t: RTSUnit | RTSBuilding, n: number) {
  if (n > 0 && "commitment" in t && t.commitment) {
    delete t.commitment;
    emit(
      s,
      "warning",
      t,
      "Hero commitment interrupted by damage; paid resources remain spent",
    );
  }
  t.hp = Math.max(0, t.hp - n);
  if (t.hp === 0) {
    emit(s, "death", t, `${t.name} destroyed`);
    if ("orders" in t) {
      t.state = "dead";
      t.orders = [];
      t.cargo = stocks();
      if (t.kind === "hero") s.players[t.owner].hero.status = "dead";
    } else {
      if (t.queue.some((j) => j.product === "hero"))
        s.players[t.owner].hero.status = "dead";
      t.queue = [];
    }
  }
}
function attack(s: RTSState, u: RTSUnit, t: RTSUnit | RTSBuilding) {
  const spec = unitSpec(u.kind, s.players[u.owner].profile);
  if (distance(u, t) > spec.range) {
    if (!u.hold) move(s, u, t, spec.range);
    return;
  }
  u.state = "attacking";
  u.facing = Math.atan2(t.y - u.y, t.x - u.x);
  if (u.kind === "siege" && u.ammo === 0) {
    u.state = "idle";
    return;
  }
  if (u.attackCooldown <= 0) {
    if (u.kind === "siege") u.ammo--;
    hurt(s, t, spec.attack * (u.kind === "siege" && "orders" in t ? 0.35 : 1));
    u.attackCooldown = u.kind === "siege" ? 28 : 12;
    emit(s, "attack", u, `${u.name} attacks`, t);
  }
}
function ai(s: RTSState, seat: string) {
  const p = s.players[seat],
    bs = Object.values(s.buildings).filter((b) => b.owner === seat && b.hp > 0),
    us = Object.values(s.units).filter((u) => u.owner === seat && u.hp > 0);
  for (const b of bs)
    if (b.queue.length < 2) {
      if (b.kind === "keep" && us.filter((u) => u.kind === "worker").length < 8)
        commandRTS(s, seat, {
          kind: "produce",
          building: b.id,
          product: "worker",
        });
      if (b.kind === "barracks")
        commandRTS(s, seat, {
          kind: "produce",
          building: b.id,
          product: s.tick % 60 === 0 ? "archer" : "soldier",
        });
      if (b.kind === "workshop")
        commandRTS(s, seat, {
          kind: "produce",
          building: b.id,
          product: "siege",
        });
    }
  if (s.tick > 500 && !bs.some((b) => b.kind === "workshop")) {
    const worker = us.find((u) => u.kind === "worker");
    if (worker)
      commandRTS(s, seat, {
        kind: "build",
        building: "workshop",
        x: 38,
        y: 25,
        workers: [worker.id],
      });
  }
  for (const u of us.filter((u) => u.kind === "worker" && !u.orders.length)) {
    const r = Object.values(s.resources)
      .filter((r) => r.amount > 0)
      .sort((a, b) => distance(a, u) - distance(b, u))[0];
    if (r) u.orders = [{ kind: "gather", target: r.id }];
  }
  const empty = us.find((u) => u.kind === "siege" && u.ammo === 0);
  if (
    empty &&
    !us.some((u) =>
      u.orders.some((o) => o.kind === "supply" && o.target === empty.id),
    )
  ) {
    const w = us.find((u) => u.kind === "worker");
    if (w) {
      w.orders = [{ kind: "supply", target: empty.id }];
      w.path = [];
    }
  }
  const army = us.filter((u) => u.kind !== "worker");
  const threat = Object.values(s.units).find(
    (u) => u.owner !== seat && u.hp > 0 && bs.some((b) => distance(b, u) < 9),
  );
  if (threat) {
    commandRTS(s, seat, {
      kind: "order",
      units: army.map((u) => u.id),
      order: { kind: "attackMove", x: threat.x, y: threat.y },
    });
  } else if (s.tick > 250 && army.length >= 5) {
    const target = s.tick < 800 ? { x: 11, y: 6 } : { x: 7, y: 10 };
    commandRTS(s, seat, {
      kind: "order",
      units: army.filter((u) => u.orders.length === 0).map((u) => u.id),
      order: { kind: "attackMove", ...target },
    });
  }
  if (p.stock.M > 100 && s.tick > 300 && !bs.some((b) => b.kind === "tower")) {
    const w = us.find((u) => u.kind === "worker");
    if (w)
      commandRTS(s, seat, {
        kind: "build",
        building: "tower",
        x: 35,
        y: 22,
        workers: [w.id],
      });
  }
}
export function stepRTS(s: RTSState, ticks = 1) {
  for (let tick = 0; tick < ticks && !s.winner; tick++) {
    s.tick++;
    for (const b of Object.values(s.buildings)) {
      if (b.hp <= 0 || b.progress < 1) continue;
      const j = b.queue[0];
      const active = Object.values(s.buildings)
        .filter(
          (f) =>
            f.owner === b.owner &&
            f.hp > 0 &&
            f.progress === 1 &&
            f.queue.length &&
            f.queue[0].product !== "hero" &&
            f.queue[0].product !== "component",
        )
        .slice(0, limits(s.players[b.owner].profile).queues);
      if (
        j &&
        (j.product === "hero" ||
          j.product === "component" ||
          active.includes(b)) &&
        --j.remaining <= 0
      ) {
        b.queue.shift();
        if (j.product === "component") s.players[b.owner].component++;
        else {
          const u = addUnit(s, b.owner, j.product, { x: b.x + 1, y: b.y + 1 });
          u.orders = [{ kind: "move", ...b.rally }];
        }
        emit(s, "complete", b, `${j.product} completed`);
      }
      if (b.kind === "farm" && s.tick % 40 === 0) {
        const r = Object.values(s.resources).find(
          (r) => r.id === `farm-${b.id}`,
        );
        if (!r)
          s.resources[`farm-${b.id}`] = {
            id: `farm-${b.id}`,
            name: "Cultivated provisions",
            kind: "P",
            x: b.x + 1,
            y: b.y,
            amount: 500,
          };
      }
      if (
        b.kind === "lore" &&
        s.tick % 50 === 0 &&
        s.players[b.owner].stock.M >= 1 &&
        Object.values(s.units).some(
          (u) =>
            u.owner === b.owner &&
            u.kind === "worker" &&
            u.hp > 0 &&
            distance(u, b) < 2.5,
        )
      ) {
        s.players[b.owner].stock.M--;
        s.players[b.owner].stock.K += 2;
      }
      if (b.cooldown > 0) b.cooldown--;
      if (["tower", "keep"].includes(b.kind) && !b.cooldown) {
        const t = Object.values(s.units).find(
          (u) =>
            u.owner !== b.owner &&
            u.hp > 0 &&
            distance(u, b) < (b.kind === "tower" ? 7 : 5),
        );
        if (t) {
          hurt(s, t, 13);
          b.cooldown = 15;
          emit(s, "attack", b, "Defensive volley", t);
        }
      }
    }
    const tickUnits = Object.values(s.units);
    for (const u of tickUnits) {
      if (
        u.hp <= 0 ||
        (u.kind === "hero" && s.players[u.owner].hero.status === "captive")
      )
        continue;
      if (u.attackCooldown > 0) u.attackCooldown--;
      u.state = "idle";
      const o = u.orders[0];
      if (u.commitment) {
        const c = u.commitment;
        u.state = "working";
        if (distance(u, c.origin) > 0.5) {
          delete u.commitment;
          continue;
        }
        if (c.kind === "refit") {
          const t = s.buildings[c.target!] ?? s.units[c.target!];
          if (
            !t ||
            t.hp <= 0 ||
            distance(u, t) > 7 ||
            !Object.values(s.units).some(
              (w) =>
                w.owner === u.owner &&
                w.kind === "worker" &&
                w.hp > 0 &&
                distance(w, t) < 2.5,
            )
          ) {
            delete u.commitment;
            continue;
          }
        }
        if (s.tick >= c.due) {
          if (c.kind === "recover")
            s.players[u.owner].hero.readiness = Math.min(
              6,
              s.players[u.owner].hero.readiness + 3,
            );
          if (c.kind === "refit") {
            const t = s.buildings[c.target!] ?? s.units[c.target!];
            t.hp = Math.min(t.maxHp, t.hp + t.maxHp * 0.25);
            emit(s, "complete", t, "Supply refit completed");
          }
          if (c.kind === "voice") {
            const p = c.point!,
              dx = p.x - u.x,
              dy = p.y - u.y,
              len = Math.max(0.01, Math.hypot(dx, dy));
            const victims = Object.values(s.units)
              .filter((t) => {
                const along = ((t.x - u.x) * dx + (t.y - u.y) * dy) / len,
                  across = Math.abs((t.x - u.x) * dy - (t.y - u.y) * dx) / len;
                return (
                  t.owner !== u.owner &&
                  t.hp > 0 &&
                  along >= 0 &&
                  along <= 7 &&
                  across <= 1.2 &&
                  isVisible(s, u.owner, t)
                );
              })
              .sort((a, b) => distance(a, u) - distance(b, u))
              .slice(0, 2);
            for (const t of victims) {
              const covered = Object.values(s.buildings).some(
                (b) =>
                  b.owner === t.owner &&
                  b.hp > 0 &&
                  ["wall", "tower", "keep"].includes(b.kind) &&
                  distance(b, t) < 2,
              );
              hurt(
                s,
                t,
                unitSpec(u.kind, s.players[u.owner].profile).attack *
                  2 *
                  (covered ? 0.5 : 1),
              );
              const at = { x: t.x + dx / len, y: t.y + dy / len };
              if (!covered && walkable(s, at.x, at.y)) {
                t.x = at.x;
                t.y = at.y;
                t.path = [];
              }
            }
            emit(s, "attack", u, "Shattering Voice", p);
          }
          delete u.commitment;
        }
        continue;
      }
      // Acquisition stays inside this living observer's eight-tile sight.
      // Scanning visibility for every candidate would add an unnecessary third
      // unit loop. Strictly nearer replacement preserves insertion-order ties.
      let enemy: RTSUnit | undefined;
      if (u.kind !== "worker" && (!o || o.kind === "attackMove" || u.hold)) {
        let nearest = u.hold ? unitSpec(u.kind).range : 6;
        for (const candidate of tickUnits) {
          if (candidate.owner === u.owner || candidate.hp <= 0) continue;
          const range = distance(candidate, u);
          if (
            range < nearest &&
            (range < 8 || isVisible(s, u.owner, candidate))
          ) {
            enemy = candidate;
            nearest = range;
          }
        }
        if (enemy) {
          attack(s, u, enemy);
          continue;
        }
      }
      if (!o) continue;
      if (o.kind === "move" || o.kind === "attackMove") {
        if (
          move(s, u, { x: o.x!, y: o.y! }, 0.75) ||
          (u.stalled > 30 && distance(u, { x: o.x!, y: o.y! }) < 3)
        ) {
          u.orders.shift();
          u.path = [];
        }
        if (u.kind !== "worker" && o.kind === "attackMove" && !enemy) {
          const b = Object.values(s.buildings).find(
            (b) => b.owner !== u.owner && b.hp > 0 && distance(b, u) < 7,
          );
          if (b) attack(s, u, b);
        }
        continue;
      }
      if (o.kind === "attack") {
        const t = s.units[o.target!] ?? s.buildings[o.target!];
        if (!t || t.hp <= 0 || !isVisible(s, u.owner, t)) {
          u.orders.shift();
          u.path = [];
        } else attack(s, u, t);
        continue;
      }
      if (o.kind === "build") {
        const b = s.buildings[o.target!];
        if (!b || b.hp <= 0 || b.progress >= 1) {
          u.orders.shift();
          continue;
        }
        if (move(s, u, b, 1.7)) {
          u.state = "working";
          b.progress = Math.min(
            1,
            b.progress + 1 / (buildingSpec(b.kind).seconds * 10),
          );
          b.hp = Math.min(
            b.maxHp,
            b.hp + b.maxHp / (buildingSpec(b.kind).seconds * 10),
          );
          if (b.progress === 1) {
            b.hp = b.maxHp;
            emit(s, "complete", b, `${b.name} completed`);
          }
        }
        continue;
      }
      if (o.kind === "supply") {
        const target = s.units[o.target!];
        if (!target || target.hp <= 0) {
          u.orders.shift();
          continue;
        }
        if (target.ammo > 0) {
          u.state = "idle";
          continue;
        }
        if (u.cargo.M < 6) {
          const depot = Object.values(s.buildings)
            .filter(
              (b) =>
                b.owner === u.owner &&
                b.hp > 0 &&
                b.progress === 1 &&
                ["keep", "workshop"].includes(b.kind),
            )
            .sort((a, b) => distance(a, u) - distance(b, u))[0];
          if (depot && move(s, u, depot, 1.6)) {
            for (const k of keys) {
              s.players[u.owner].stock[k] += u.cargo[k];
              u.cargo[k] = 0;
            }
            if (s.players[u.owner].stock.M >= 6) {
              s.players[u.owner].stock.M -= 6;
              u.cargo.M = 6;
              u.path = [];
            }
          }
        } else if (move(s, u, target, 1.5)) {
          u.cargo.M -= 6;
          target.ammo = 3;
          u.path = [];
          emit(s, "delivery", target, "Paid ammunition delivered: three shots");
        }
        continue;
      }
      if (o.kind === "gather") {
        const r = s.resources[o.target!],
          load = keys.reduce((n, k) => n + u.cargo[k], 0);
        if (load >= 10 || ((!r || r.amount <= 0) && load)) {
          const depot = Object.values(s.buildings)
            .filter(
              (b) =>
                b.owner === u.owner &&
                b.hp > 0 &&
                b.progress === 1 &&
                ["keep", "farm", "lore"].includes(b.kind),
            )
            .sort((a, b) => distance(a, u) - distance(b, u))[0];
          if (depot && move(s, u, depot, 1.6)) {
            for (const k of keys) {
              s.players[u.owner].stock[k] += u.cargo[k];
              u.cargo[k] = 0;
            }
            emit(s, "delivery", depot, "Resources delivered");
            u.path = [];
          }
          continue;
        }
        if (!r || r.amount <= 0) {
          u.orders.shift();
          continue;
        }
        if (move(s, u, r, 1.1)) {
          u.state = "working";
          if (++u.work >= 10) {
            const n = Math.min(2, r.amount);
            r.amount -= n;
            u.cargo[r.kind] += n;
            u.work = 0;
            u.path = [];
          }
        }
      }
    }
    if (s.tick % 20 === 0)
      for (const [seat, p] of Object.entries(s.players)) if (p.ai) ai(s, seat);
    if (s.tick % 5 === 0) updateVision(s);
    for (const seat of Object.keys(s.players))
      if (
        !Object.values(s.buildings).some(
          (b) => b.owner === seat && b.kind === "keep" && b.hp > 0,
        )
      ) {
        s.winner = Object.keys(s.players).find((p) => p !== seat)!;
        emit(
          s,
          "complete",
          { x: 24, y: 16 },
          `${s.winner} wins: citadel destroyed`,
        );
      }
  }
}
export function serializeRTS(s: RTSState) {
  return JSON.stringify(s);
}
export function parseRTS(text: string): RTSState {
  if (text.length > 4_000_000) throw new Error("RTS save exceeds size limit");
  const raw = JSON.parse(text) as RTSState;
  if (raw.version !== RTS_VERSION)
    throw new Error(
      "Incompatible save: weekly campaigns remain in their original mode; automatic migration is unavailable",
    );
  const s = rtsStateSchema.parse(raw) as RTSState;
  if (
    !Number.isSafeInteger(s.tick) ||
    s.tick < 0 ||
    s.width !== 48 ||
    s.height !== 32 ||
    s.terrain?.length !== 1536 ||
    !s.players?.p1 ||
    !s.players?.p2
  )
    throw new Error("Invalid RTS state");
  for (const [seat, p] of Object.entries(s.players)) {
    if (
      p.profile !== (seat === "p1" ? "human_gondor" : "istari_saruman") ||
      p.hero.id !== `hero-${seat}` ||
      !keys.every((k) => Number.isFinite(p.stock[k]) && p.stock[k] >= 0)
    )
      throw new Error("Invalid faction or stocks");
    const heroes = Object.values(s.units).filter(
        (u) => u.owner === seat && u.kind === "hero" && u.hp > 0,
      ),
      pending = Object.values(s.buildings)
        .filter((b) => b.owner === seat)
        .flatMap((b) => b.queue)
        .filter((j) => j.product === "hero").length;
    if (
      (pending > 0 && p.hero.status !== "pending") ||
      heroes.length + pending > 1 ||
      (p.hero.status === "pending" && pending !== 1) ||
      (["living", "captive"].includes(p.hero.status) && heroes.length !== 1) ||
      (["dead", "uncreated"].includes(p.hero.status) && heroes.length > 0) ||
      heroes.some((h) => h.id !== p.hero.id)
    )
      throw new Error("Hero slot invariant violated");
  }
  for (const [id, e] of [
    ...Object.entries(s.units),
    ...Object.entries(s.buildings),
    ...Object.entries(s.resources),
  ])
    if (
      e.id !== id ||
      (/^([ub]|r)[0-9]+$/.test(id) && Number(id.slice(1)) >= s.nextId)
    )
      throw new Error("Entity identity mismatch");
  for (const u of Object.values(s.units))
    if (u.commitment) {
      const c = u.commitment;
      if (
        u.kind !== "hero" ||
        s.players[u.owner].hero.status !== "living" ||
        (c.kind === "voice" &&
          s.players[u.owner].profile !== "istari_saruman") ||
        (c.kind === "refit" && s.players[u.owner].profile !== "human_gondor")
      )
        throw new Error("Invalid hero commitment");
    }
  for (const b of Object.values(s.buildings))
    for (const j of b.queue) {
      const expected =
        j.product === "component"
          ? stocks(0, 10, 5)
          : unitSpec(j.product, s.players[b.owner].profile).cost;
      const definition =
        j.product === "component"
          ? { seconds: 25, facility: "keep" }
          : unitSpec(j.product, s.players[b.owner].profile);
      if (
        b.kind !== definition.facility ||
        j.total !== definition.seconds * 10 ||
        keys.some((k) => j.cost[k] !== expected[k])
      )
        throw new Error("Queue payment invariant violated");
    }
  for (const e of [
    ...Object.values(s.units),
    ...Object.values(s.buildings),
    ...Object.values(s.resources),
  ])
    if (
      !Number.isFinite(e.x) ||
      !Number.isFinite(e.y) ||
      e.x < 0 ||
      e.y < 0 ||
      e.x >= s.width ||
      e.y >= s.height
    )
      throw new Error("Invalid entity position");
  return s;
}
/** Public RTS observation DTO: never suitable for authoritative restoration. */
export function rtsSnapshot(s: RTSState, seat: string) {
  const out = structuredClone(s);
  out.version = RTS_VERSION + "-observation";
  for (const [id, u] of Object.entries(out.units)) {
    if (u.owner !== seat) {
      if (!isVisible(s, seat, u)) delete out.units[id];
      else {
        u.orders = [];
        u.path = [];
        u.cargo = stocks();
        delete u.commitment;
        u.work = 0;
        u.ammo = 0;
      }
    }
  }
  for (const [id, b] of Object.entries(out.buildings))
    if (b.owner !== seat) {
      if (!isVisible(s, seat, b)) delete out.buildings[id];
      else {
        b.queue = [];
        b.rally = { x: b.x, y: b.y };
      }
    }
  for (const [id, p] of Object.entries(out.players))
    if (id !== seat) {
      p.stock = stocks();
      p.component = 0;
      p.hero = {
        status: "uncreated",
        id: "private",
        level: 1,
        perks: [],
        readiness: 6,
      };
      p.nextSeq = 1;
      p.abilityReady = 0;
    }
  out.events = out.events.filter((e) => e.audience.includes(seat));
  for (const [id, r] of Object.entries(out.resources))
    if (!isVisible(s, seat, r)) delete out.resources[id];
  out.explored = { [seat]: out.explored[seat] };
  return out;
}
