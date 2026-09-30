import {
  stocks,
  type Match,
  type Recipe,
  type Unit,
  type Item,
} from "../simulation/types";
/** r6 named ordinary products, not additions to the hero roster. Detailed
 * recipes, species interpretation and all numerical stats are provisional.
 * Normal faction queue/supply limits, access, payment and upkeep still apply. */
export const elvenProductionProfiles = [
  "elf_vanyar",
  "elf_feanor",
  "elf_fingolfin",
  "elf_finarfin",
  "elf_falmari",
  "elf_sindar",
  "elf_nandor",
  "elf_avari",
] as const;
export const extendedKeys = [
  "elven-defenders",
  "elven-archers",
  "woodland-mount",
  "clan-pack-animal",
  "masterwork-blade",
  "ceremonial-standard",
  "mounted-scout",
  "saddle",
  "mining-engine",
  "stone-porter",
  "protected-hauler",
  "pack-pony",
  "travel-kit",
] as const;
export type ExtendedKey = (typeof extendedKeys)[number];
export interface ExtendedCapabilities {
  ordinaryRanged?: true;
  convoyCapacity?: 20;
  miningWork?: true;
  mounted?: true;
}
export interface ExtendedProduction {
  profiles: readonly string[];
  source: string;
  recipe: Recipe;
  role: string;
  capabilities: ExtendedCapabilities;
  bearerClass?: "humanoid" | "mounted";
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
export type ExtendedUnit = Unit & { extended?: ExtendedKey };
function body(
  profiles: readonly string[],
  key: ExtendedKey,
  name: string,
  section: string,
  role: string,
  species: string,
  kind: "company" | "beast" | "construct",
  cost: ReturnType<typeof stocks>,
  turns: number,
  access: string[],
  hp: number,
  attack: number,
  armor: number,
  move: number,
  supply: number,
  upkeep: ReturnType<typeof stocks>,
  loadClass: Unit["loadClass"],
  capabilities: ExtendedCapabilities = {},
): ExtendedProduction {
  return {
    profiles,
    source: `docs/design/silmarillion-game-report.md §${section}: ${name}`,
    role,
    capabilities,
    recipe: {
      id: key,
      name,
      cost,
      turns,
      facility: kind === "construct" ? "workshop" : "training",
      access,
      supply,
      great: 0,
      binding: 0,
      kind: "unit",
      provisional: true,
    },
    stats: {
      name,
      kind,
      hp,
      maxHp: hp,
      attack,
      armor,
      move,
      supply,
      great: 0,
      binding: 0,
      upkeep,
      flying: false,
      landed: true,
      loadClass,
    },
    appearance: { species, materials: access.slice() },
  };
}
function gear(
  profile: string,
  key: ExtendedKey,
  name: string,
  section: string,
  materials: string[],
  cost: ReturnType<typeof stocks>,
  attack: number,
  armor: number,
  bearerClass: "humanoid" | "mounted" = "humanoid",
): ExtendedProduction {
  return {
    profiles: [profile],
    source: `docs/design/silmarillion-game-report.md §${section}: ${name}`,
    role: "equipment",
    capabilities: {},
    bearerClass,
    recipe: {
      id: key,
      name,
      cost,
      turns: 2,
      facility: "workshop",
      access: materials.slice(),
      supply: 0,
      great: 0,
      binding: 0,
      kind: "item",
      provisional: true,
    },
    item: {
      bonus: armor,
      attackBonus: attack,
      durability: 100,
      maxDurability: 100,
      materials: materials.slice(),
    },
    appearance: { species: "crafted equipment", materials: materials.slice() },
  };
}
const products: Record<ExtendedKey, ExtendedProduction> = {
  "elven-defenders": body(
    elvenProductionProfiles,
    "elven-defenders",
    "Elven defenders",
    "07",
    "defender",
    "Elves",
    "company",
    stocks(25, 25, 5),
    2,
    ["metal"],
    65,
    10,
    4,
    3,
    1,
    stocks(1),
    "standard",
  ),
  "elven-archers": body(
    elvenProductionProfiles,
    "elven-archers",
    "Elven archers",
    "07",
    "archer",
    "Elves",
    "company",
    stocks(25, 20, 10),
    2,
    ["timber", "textile"],
    42,
    12,
    1,
    4,
    1,
    stocks(1),
    "light",
    { ordinaryRanged: true },
  ),
  "woodland-mount": body(
    ["elf_nandor"],
    "woodland-mount",
    "Trained woodland mount",
    "07",
    "mount",
    "woodland stag (provisional species)",
    "beast",
    stocks(35, 10, 5),
    3,
    ["grove", "pasture"],
    45,
    4,
    1,
    5,
    2,
    stocks(2),
    "standard",
    { convoyCapacity: 20 },
  ),
  "clan-pack-animal": body(
    ["elf_avari"],
    "clan-pack-animal",
    "Clan pack animal",
    "07",
    "pack",
    "pack pony (provisional species)",
    "beast",
    stocks(30, 10, 5),
    3,
    ["pasture"],
    45,
    3,
    1,
    4,
    2,
    stocks(2),
    "standard",
    { convoyCapacity: 20 },
  ),
  "masterwork-blade": gear(
    "elf_feanor",
    "masterwork-blade",
    "Masterwork blade",
    "07",
    ["metal", "crystal"],
    stocks(0, 35, 15),
    5,
    0,
  ),
  "ceremonial-standard": gear(
    "elf_vanyar",
    "ceremonial-standard",
    "Ceremonial standard",
    "07",
    ["textile", "timber"],
    stocks(0, 20, 10),
    0,
    2,
  ),
  "mounted-scout": body(
    ["human_rohan"],
    "mounted-scout",
    "Mounted scouts",
    "08",
    "mounted scout",
    "Humans and trained horses",
    "company",
    stocks(40, 20, 10),
    3,
    ["pasture"],
    45,
    10,
    1,
    6,
    2,
    stocks(3),
    "standard",
    { mounted: true, ordinaryRanged: true },
  ),
  saddle: gear(
    "human_rohan",
    "saddle",
    "Riding saddle",
    "08",
    ["textile", "timber"],
    stocks(0, 15, 5),
    0,
    1,
    "mounted",
  ),
  "mining-engine": body(
    ["dwarf_khazad_dum"],
    "mining-engine",
    "Mining engine",
    "09",
    "mine worker",
    "ordinary mechanical engine",
    "construct",
    stocks(0, 45, 10),
    3,
    ["metal", "timber"],
    65,
    2,
    3,
    2,
    2,
    stocks(0, 2),
    "large",
    { miningWork: true },
  ),
  "stone-porter": body(
    ["dwarf_khazad_dum"],
    "stone-porter",
    "Stone porter",
    "09",
    "porter",
    "ordinary mechanical porter (provisional interpretation)",
    "construct",
    stocks(0, 40, 10),
    3,
    ["metal", "stone"],
    75,
    3,
    4,
    2,
    2,
    stocks(0, 2),
    "large",
    { convoyCapacity: 20 },
  ),
  "protected-hauler": body(
    ["dwarf_belegost"],
    "protected-hauler",
    "Protected haulers",
    "09",
    "armored hauler",
    "Dwarves with protected haulage",
    "company",
    stocks(35, 40, 10),
    3,
    ["metal", "timber"],
    75,
    6,
    5,
    2,
    2,
    stocks(2, 1),
    "large",
    { convoyCapacity: 20 },
  ),
  "pack-pony": body(
    ["hobbit_shire"],
    "pack-pony",
    "Pack ponies",
    "09",
    "pack",
    "ponies",
    "beast",
    stocks(30, 10, 5),
    3,
    ["pasture"],
    40,
    2,
    0,
    4,
    2,
    stocks(2),
    "standard",
    { convoyCapacity: 20 },
  ),
  "travel-kit": gear(
    "hobbit_shire",
    "travel-kit",
    "Travel kit",
    "09",
    ["textile", "timber"],
    stocks(0, 15, 5),
    0,
    1,
  ),
};
export function extendedProduction(
  profile: string,
  key: string,
): ExtendedProduction | undefined {
  if(!Object.hasOwn(products,key))return undefined;
  const q = products[key as ExtendedKey];
  return q?.profiles.includes(profile) ? structuredClone(q) : undefined;
}
/** Existing ordinary ranged action remains two tiles with normal action/cover.
 * Convoy capacities are normal paid loads, never supply increases. A mining
 * engine substitutes one physical mine worker, not unstaffed automatic income. */
export function extendedCapabilities(
  s: Match,
  u: Unit,
): ExtendedCapabilities | undefined {
  const key = (u as ExtendedUnit).extended,
    q = key && products[key];
  return q?.stats &&
    q.profiles.includes(s.players[u.owner]?.profile) &&
    u.kind === q.stats.kind &&
    u.flying === q.stats.flying
    ? { ...q.capabilities }
    : undefined;
}
