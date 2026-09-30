import {
  stocks,
  type Match,
  type Recipe,
  type Unit,
  type Item,
} from "../simulation/types";
/** Named outputs are r6 §04/05/06. All prices, species interpretation, stats,
 * materials and physical utility classifications are provisional ordinary tuning.
 * These are separately paid finite identities, never hero powers or free bodies. */
export const companionKeys = [
  "courier-eagle",
  "root-guardian",
  "memory-lantern",
  "hunting-hounds",
  "pack-aurochs",
  "courier-stag",
  "songbird-swarm",
  "rescue-hind",
  "moth-clouds",
] as const;
export type CompanionKey = (typeof companionKeys)[number];
export type CompanionRole =
  | "courier"
  | "guardian"
  | "tracker"
  | "pack"
  | "songbird"
  | "rescue"
  | "swarm"
  | "keepsake";
export interface CompanionProduction {
  profile: string;
  source: string;
  recipe: Recipe;
  role: CompanionRole;
  stats?: Pick<
    Unit,
    | "name"
    | "kind"
    | "hp"
    | "maxHp"
    | "attack"
    | "armor"
    | "move"
    | "supply"
    | "great"
    | "binding"
    | "upkeep"
    | "flying"
    | "landed"
    | "loadClass"
  >;
  item?: Pick<
    Item,
    "bonus" | "attackBonus" | "durability" | "maxDurability" | "materials"
  >;
  appearance: { species: string; materials: string[] };
}
export type CompanionUnit = Unit & { companion?: CompanionKey };
function body(
  profile: string,
  key: CompanionKey,
  name: string,
  section: string,
  role: CompanionRole,
  species: string,
  cost: ReturnType<typeof stocks>,
  turns: number,
  access: string[],
  hp: number,
  attack: number,
  armor: number,
  move: number,
  supply: number,
  upkeep: number,
  flying = false,
  loadClass: Unit["loadClass"] = "light",
): CompanionProduction {
  return {
    profile,
    source: `docs/design/silmarillion-game-report.md §${section}: ${name}`,
    role,
    recipe: {
      id: key,
      name,
      cost,
      turns,
      facility: "training",
      access,
      supply,
      great: 0,
      binding: 0,
      kind: "unit",
      provisional: true,
    },
    stats: {
      name,
      kind: "beast",
      hp,
      maxHp: hp,
      attack,
      armor,
      move,
      supply,
      great: 0,
      binding: 0,
      upkeep: stocks(upkeep),
      flying,
      landed: true,
      loadClass,
    },
    appearance: { species, materials: access.slice() },
  };
}
const products: Record<CompanionKey, CompanionProduction> = {
  "courier-eagle": body(
    "manwe",
    "courier-eagle",
    "courier-eagle",
    "04",
    "courier",
    "eagle",
    stocks(30, 10, 10),
    3,
    ["pasture", "textile"],
    30,
    4,
    0,
    6,
    2,
    2,
    true,
  ),
  "root-guardian": body(
    "yavanna",
    "root-guardian",
    "root guardian",
    "04",
    "guardian",
    "living rooted tree",
    stocks(30, 30, 10),
    3,
    ["grove"],
    90,
    12,
    4,
    2,
    3,
    2,
    false,
    "large",
  ),
  "memory-lantern": {
    profile: "nienna",
    source:
      "docs/design/silmarillion-game-report.md §05: memory lantern; provisional crafted keepsake interpretation, not a second living body",
    role: "keepsake",
    recipe: {
      id: "memory-lantern",
      name: "memory lantern",
      cost: stocks(0, 20, 15),
      turns: 2,
      facility: "workshop",
      access: ["metal", "glass"],
      supply: 0,
      great: 0,
      binding: 0,
      kind: "item",
      provisional: true,
    },
    item: {
      bonus: 0,
      attackBonus: 0,
      durability: 100,
      maxDurability: 100,
      materials: ["metal", "glass"],
    },
    appearance: { species: "crafted lantern", materials: ["metal", "glass"] },
  },
  "hunting-hounds": body(
    "orome",
    "hunting-hounds",
    "hunting-hound pack",
    "05",
    "tracker",
    "hounds",
    stocks(35, 10, 5),
    3,
    ["pasture"],
    45,
    10,
    1,
    5,
    2,
    2,
  ),
  "pack-aurochs": body(
    "tulkas",
    "pack-aurochs",
    "pack aurochs",
    "05",
    "pack",
    "aurochs",
    stocks(45, 15, 5),
    3,
    ["pasture", "textile"],
    75,
    6,
    2,
    3,
    3,
    3,
    false,
    "large",
  ),
  "courier-stag": body(
    "nessa",
    "courier-stag",
    "courier stag",
    "05",
    "courier",
    "stag",
    stocks(30, 10, 5),
    3,
    ["pasture"],
    40,
    3,
    0,
    6,
    2,
    2,
  ),
  "songbird-swarm": body(
    "vana",
    "songbird-swarm",
    "songbird swarm",
    "05",
    "songbird",
    "songbirds",
    stocks(25, 5, 10),
    2,
    ["grove"],
    22,
    2,
    0,
    5,
    1,
    1,
    true,
  ),
  "rescue-hind": body(
    "este",
    "rescue-hind",
    "rescue hind",
    "05",
    "rescue",
    "hind",
    stocks(35, 15, 10),
    3,
    ["pasture", "textile"],
    45,
    3,
    1,
    4,
    2,
    2,
  ),
  "moth-clouds": body(
    "istari_grove",
    "moth-clouds",
    "Moth Clouds",
    "06",
    "swarm",
    "moths",
    stocks(25, 5, 10),
    2,
    ["grove"],
    20,
    2,
    0,
    4,
    1,
    1,
    true,
  ),
};
export function companionProduction(
  profile: string,
  key: string,
): CompanionProduction | undefined {
  const q = products[key as CompanionKey];
  return q?.profile === profile ? structuredClone(q) : undefined;
}
/** Caller still enforces normal actions, routes, load and prices. No name-based
 * role grant, ownership transfer, concealment, healing or capacity increase. */
export function companionRole(s: Match, u: Unit): CompanionRole | undefined {
  const key = (u as CompanionUnit).companion,
    q = key && products[key];
  return q?.stats &&
    s.players[u.owner]?.profile === q.profile &&
    u.kind === q.stats.kind &&
    u.flying === q.stats.flying
    ? q.role
    : undefined;
}
