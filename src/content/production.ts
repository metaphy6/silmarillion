import factions from "./factions.json";
import { stocks, type Stock } from "../simulation/types";

/** Section 10 habitat trees. Shared storage, sources and route facilities are
 * provisional scenario equivalents, not permission to copy humanoid industry. */
export const civilianProfiles = [
  "nessa",
  "elf_vanyar",
  "elf_feanor",
  "elf_fingolfin",
  "elf_finarfin",
  "elf_falmari",
  "elf_sindar",
  "elf_nandor",
  "elf_avari",
  "human_gondor",
  "human_rohan",
  "human_numenor",
  "dwarf_khazad_dum",
  "dwarf_belegost",
  "dwarf_nogrod",
  "orc_fortress_clan",
  "hobbit_shire",
];

const habitatFacilities = ['core','training','workshop','research','farm','mine','archive','hold','refuge','depot','relay','safehouse','beacon','ledge','crossing-anchor'];
const habitatRecipes = ['hero','component','synthesis','essence','company','worker','equipment','technique','defenses'];
export const creatureCapabilities: Record<string,{facilities:readonly string[];recipes:readonly string[];workshop:string}> = {
 ent_grove:{facilities:[...habitatFacilities,'medicine-nursery','cover','barricade'],recipes:habitatRecipes,workshop:'Rootworks'},
 eagle_eyrie:{facilities:[...habitatFacilities],recipes:habitatRecipes,workshop:'Harness Perch'},
 wolf_pack:{facilities:[...habitatFacilities],recipes:habitatRecipes,workshop:'Pack Ground'},
 spider_brood:{facilities:[...habitatFacilities],recipes:habitatRecipes,workshop:'Brood Chamber'},
};

/** Every numerical value in this module is provisional ordinary-production tuning.
 * Hero kits and the adopted hero/monster recipes are owned by their existing sources. */
export interface FactionProduction {
  provisional: true;
  source: string;
  unit: {
    name: string;
    kind: "company" | "beast" | "construct";
    cost: Stock;
    turns: number;
    attack: number;
    hp: number;
    armor: number;
    move: number;
    supply: number;
    upkeep: Stock;
    access: string[];
    traits: string[];
    role: string;
    counter: string;
  };
  equipment: {
    name: string;
    cost: Stock;
    turns: number;
    armorBonus: number;
    attackBonus: number;
    access: string[];
    bearer: "humanoid" | "habitat";
    source: string;
  };
  income: Stock;
  trainingName: string;
  workshopName: string;
  researchName: string;
}
type Role =
  | "guard"
  | "scout"
  | "rider"
  | "healer"
  | "artisan"
  | "elite"
  | "marine"
  | "beast"
  | "flying"
  | "siege"
  | "construct"
  | "militia";
// hp, attack, armor, move, supply, turns, P, M, K, E
const roleStats: Record<Role, readonly number[]> = {
  guard: [65, 11, 4, 3, 1, 2, 25, 25, 5, 0],
  scout: [40, 10, 1, 5, 1, 2, 20, 15, 10, 0],
  rider: [55, 14, 2, 6, 2, 3, 40, 25, 5, 0],
  healer: [42, 7, 1, 3, 1, 2, 20, 15, 15, 0],
  artisan: [48, 10, 2, 3, 1, 3, 20, 35, 15, 0],
  elite: [75, 16, 4, 3, 2, 3, 35, 35, 15, 5],
  marine: [60, 13, 3, 4, 2, 3, 30, 35, 10, 0],
  beast: [60, 15, 1, 5, 3, 3, 45, 10, 5, 5],
  flying: [42, 12, 1, 6, 3, 3, 45, 15, 10, 5],
  siege: [90, 20, 3, 2, 3, 4, 40, 45, 10, 0],
  construct: [72, 14, 4, 2, 2, 3, 0, 45, 15, 15],
  militia: [38, 8, 1, 4, 1, 1, 20, 10, 5, 0],
};
// Profile-specific output names come from r6 tables. Role and material/habitat
// requirements translate that identity into a provisional playable ordinary unit.
// Each row explicitly chooses an economy emphasis; no numeric hash or index bonuses.
type Entry = readonly [
  unit: string,
  role: Role,
  access: string,
  equipment: string,
  emphasis: keyof Stock,
  trait: string,
];
const entries: Record<string, Entry> = {
  manwe: [
    "Spear herald",
    "scout",
    "crystal",
    "sapphire command sceptre",
    "K",
    "messenger",
  ],
  varda: ["Lantern guard", "guard", "glass", "star-glass lens", "K", "watch"],
  ulmo: ["Ford keeper", "marine", "shore", "shell horn", "P", "crossing"],
  aule: ["Smith-guard", "artisan", "metal", "maker's hammer", "M", "repair"],
  yavanna: [
    "Grove tender",
    "healer",
    "grove",
    "grafting staff",
    "P",
    "habitat",
  ],
  namo: [
    "Threshold sentinel",
    "guard",
    "stone",
    "judgment seal",
    "E",
    "threshold",
  ],
  irmo: ["Dream attendant", "scout", "glass", "dream lantern", "K", "decoy"],
  nienna: [
    "Mercy attendant",
    "healer",
    "textile",
    "grey mantle",
    "E",
    "refuge",
  ],
  orome: [
    "Mounted tracker",
    "rider",
    "pasture",
    "hunting horn",
    "P",
    "pursuit",
  ],
  tulkas: ["Wrestler", "elite", "pasture", "grip wraps", "P", "close-combat"],
  nessa: ["Runner", "scout", "pasture", "step-light anklets", "P", "courier"],
  vana: ["Garden tender", "healer", "grove", "renewal wreath", "P", "garden"],
  este: ["Field healer", "healer", "grove", "healing veil", "K", "care"],
  vaire: [
    "Recorder-guard",
    "guard",
    "textile",
    "memory shuttle",
    "K",
    "records",
  ],
  elf_vanyar: [
    "Banner Fellowship",
    "elite",
    "stone",
    "resonant instrument",
    "K",
    "formation",
  ],
  elf_feanor: [
    "Masterwork blade company",
    "elite",
    "crystal",
    "bound-light jewel",
    "M",
    "masterwork",
  ],
  elf_fingolfin: [
    "Mounted Warden",
    "rider",
    "metal",
    "protective banner",
    "M",
    "defender",
  ],
  elf_finarfin: [
    "Healing singers",
    "healer",
    "textile",
    "translation charm",
    "K",
    "diplomacy",
  ],
  elf_falmari: [
    "Swan-ship crew",
    "marine",
    "shore",
    "sea cloak",
    "P",
    "maritime",
  ],
  elf_sindar: [
    "Woodland company",
    "scout",
    "grove",
    "concealment mantle",
    "K",
    "woodland",
  ],
  elf_nandor: [
    "Canopy Scouts",
    "scout",
    "grove",
    "practical bow",
    "P",
    "canopy",
  ],
  elf_avari: [
    "Waymark company",
    "militia",
    "stone",
    "adaptable travel gear",
    "M",
    "mobile-camp",
  ],
  human_gondor: [
    "Shield Company",
    "guard",
    "metal",
    "defensive standard",
    "M",
    "fortification",
  ],
  human_rohan: [
    "Rider Company",
    "rider",
    "pasture",
    "rally horn",
    "P",
    "remount",
  ],
  human_numenor: [
    "Marines",
    "marine",
    "shore",
    "navigation tools",
    "K",
    "expedition",
  ],
  dwarf_khazad_dum: [
    "Tunnel Guards",
    "guard",
    "stone",
    "survey lens",
    "M",
    "tunnel",
  ],
  dwarf_belegost: [
    "Masked Vanguard",
    "elite",
    "metal",
    "hazard armor",
    "M",
    "hazard-protection",
  ],
  dwarf_nogrod: [
    "Engineers",
    "artisan",
    "metal",
    "breach tools",
    "M",
    "engineering",
  ],
  orc_fortress_clan: [
    "Tunnel Raiders",
    "militia",
    "metal",
    "scavenged arms",
    "M",
    "salvage",
  ],
  hobbit_shire: [
    "Bounders",
    "militia",
    "timber",
    "Hearthward Lantern",
    "P",
    "commons",
  ],
  troll_hold: [
    "Shield Trolls",
    "siege",
    "stone",
    "Stonehide Plate",
    "M",
    "breach",
  ],
  wolf_pack: ["Trackers", "beast", "hunting", "Moonfang Token", "P", "pursuit"],
  istari_gandalf: [
    "Free-company wardens",
    "guard",
    "timber",
    "resolve standard",
    "K",
    "refuge",
  ],
  istari_saruman: [
    "Uruk company",
    "guard",
    "metal",
    "wrought fittings",
    "M",
    "industrial",
  ],
  istari_radagast: [
    "Beast companions",
    "beast",
    "grove",
    "healing salves",
    "P",
    "woodland",
  ],
  istari_alatar: [
    "Outriders",
    "rider",
    "stone",
    "marked-shot equipment",
    "P",
    "hunter",
  ],
  istari_pallando: [
    "Resistance company",
    "guard",
    "crystal",
    "resistance charm",
    "K",
    "resistance",
  ],
  sauron: [
    "Armored overseers",
    "elite",
    "metal",
    "lesser binding ring",
    "M",
    "supply-network",
  ],
  istari_ember: [
    "Hearth Wardens",
    "guard",
    "metal",
    "Oath Lantern",
    "P",
    "shelter",
  ],
  istari_grove: [
    "Thornkeepers",
    "guard",
    "grove",
    "Renewal Charm",
    "P",
    "nursery",
  ],
  istari_veil: [
    "Quiet Envoys",
    "scout",
    "glass",
    "False-Signal Seal",
    "K",
    "safehouse",
  ],
  istari_forge: [
    "Wrought Sentinels",
    "construct",
    "metal",
    "Repair Matrix",
    "M",
    "maintenance",
  ],
  istari_star: ["Beacon Riders", "rider", "crystal", "Wayglass", "K", "beacon"],
  melian: [
    "Border attendants",
    "guard",
    "textile",
    "sanctuary mantle",
    "K",
    "sanctuary",
  ],
  osse: ["Shore guards", "marine", "shore", "tidebreaker charm", "P", "surf"],
  uinen: [
    "Rescue crews",
    "marine",
    "shore",
    "safe-passage token",
    "P",
    "rescue",
  ],
  arien: ["Dawn sentries", "guard", "crystal", "daylight lens", "E", "light"],
  tilion: ["Night scouts", "scout", "metal", "silver sight", "K", "nightwatch"],
  eonwe: [
    "Herald companies",
    "elite",
    "metal",
    "commission banner",
    "M",
    "expedition",
  ],
  ilmare: [
    "Beacon keepers",
    "scout",
    "crystal",
    "witness glass",
    "K",
    "signal",
  ],
  ent_grove: [
    "Sapling Guardians",
    "beast",
    "grove",
    "Rootward Totem",
    "P",
    "rooted",
  ],
  eagle_eyrie: ["Scout Flights", "flying", "eyrie", "Wind Knot", "P", "flight"],
  spider_brood: ["Weblayers", "beast", "silk", "Nightweb Snare", "P", "web"],
  melkor_worldbreaker: [
    "War Pens company",
    "guard",
    "metal",
    "black iron fittings",
    "E",
    "limited-sanctuary",
  ],
  melkor_dark_architect: [
    "War Pens company",
    "guard",
    "metal",
    "black iron fittings",
    "M",
    "fortress-industry",
  ],
};
const roles: Record<Role, readonly [string, string]> = {
  guard: [
    "Hold contested ground",
    "Flanks, concentrated attacks and supply denial",
  ],
  scout: [
    "Reach and observe objectives",
    "Prepared defenders and sustained combat",
  ],
  rider: [
    "Concentrate force rapidly",
    "Chokepoints, difficult ground and fodder loss",
  ],
  healer: [
    "Maintain a small supporting company",
    "Direct combat and pressure on its facility",
  ],
  artisan: [
    "Escort skilled work and equipment",
    "Faster raiders and scarce material access",
  ],
  elite: [
    "Preserve a costly strong formation",
    "Dispersed objectives and replacement cost",
  ],
  marine: [
    "Defend coastal approaches",
    "Inland pressure and loss of shore access",
  ],
  beast: [
    "Contest habitat and pursue openings",
    "Defended routes and food deprivation",
  ],
  flying: [
    "Scout and approach distant objectives; land to capture",
    "Anti-air defenses and threatened eyries",
  ],
  siege: [
    "Break defended positions",
    "Slow movement, isolation and supply loss",
  ],
  construct: [
    "Protect a supplied worksite",
    "Expensive upkeep and ranged pressure",
  ],
  militia: [
    "Affordable territorial presence",
    "Superior concentrated troops and attrition",
  ],
};

/** All 55 mappings are explicit provisional material interpretations of r6's
 * named ordinary equipment, not canonical recipes or additional stock types.
 * The Cross-era sandbox supplies matching regional access at setup; that is an
 * invented scenario connection, not simulated trade, convoys or source capture. */
const equipmentMaterials: Record<string, readonly string[]> = {
  manwe: ["crystal", "metal"], // sapphire sceptre and worked mount
  varda: ["glass"], // star-glass lens
  ulmo: ["shore"], // shell horn
  aule: ["metal", "timber"], // maker's hammer head and haft
  yavanna: ["grove", "timber"], // grafting staff
  namo: ["stone"], // judgment seal
  irmo: ["glass", "metal"], // dream lantern lens and frame
  nienna: ["textile"], // grey mantle
  orome: ["horn"], // hunting horn
  tulkas: ["textile"], // grip wraps
  nessa: ["metal"], // step-light anklets
  vana: ["grove"], // renewal wreath
  este: ["textile"], // healing veil
  vaire: ["timber"], // memory shuttle
  elf_vanyar: ["timber", "metal"], // resonant instrument
  elf_feanor: ["crystal", "metal"], // bound-light jewel and setting
  elf_fingolfin: ["textile", "timber"], // protective banner
  elf_finarfin: ["textile"], // inscribed translation charm
  elf_falmari: ["textile"], // sea cloak
  elf_sindar: ["textile"], // concealment mantle
  elf_nandor: ["timber", "textile"], // practical bow and bowstring
  elf_avari: ["textile", "timber"], // adaptable travel gear
  human_gondor: ["textile", "timber"], // defensive standard
  human_rohan: ["horn"], // rally horn
  human_numenor: ["metal", "timber"], // navigation tools
  dwarf_khazad_dum: ["glass", "metal"], // survey lens and mount
  dwarf_belegost: ["metal"], // hazard armor
  dwarf_nogrod: ["metal"], // breach tools
  orc_fortress_clan: ["metal", "timber"], // scavenged arms
  hobbit_shire: ["metal", "glass"], // Hearthward Lantern
  troll_hold: ["metal", "stone"], // Stonehide Plate
  wolf_pack: ["hunting"], // Moonfang Token; habitat-sourced existing material
  istari_gandalf: ["textile", "timber"], // resolve standard
  istari_saruman: ["metal"], // wrought fittings
  istari_radagast: ["grove"], // healing salves
  istari_alatar: ["timber", "metal"], // marked-shot equipment
  istari_pallando: ["crystal", "textile"], // resistance charm
  sauron: ["metal"], // ordinary lesser binding ring, never the One Ring
  istari_ember: ["metal", "glass"], // Oath Lantern
  istari_grove: ["grove"], // Renewal Charm
  istari_veil: ["glass"], // False-Signal Seal
  istari_forge: ["metal"], // Repair Matrix
  istari_star: ["glass", "crystal"], // Wayglass
  melian: ["textile"], // sanctuary mantle
  osse: ["shore"], // tidebreaker charm
  uinen: ["shore"], // safe-passage token
  arien: ["glass", "crystal"], // daylight lens
  tilion: ["metal", "glass"], // silver sight
  eonwe: ["textile", "timber"], // commission banner
  ilmare: ["glass"], // witness glass
  ent_grove: ["grove", "timber"], // Rootward Totem
  eagle_eyrie: ["eyrie", "textile"], // carried Wind Knot
  spider_brood: ["silk"], // Nightweb Snare
  melkor_worldbreaker: ["metal"], // ordinary black iron fittings
  melkor_dark_architect: ["metal"], // ordinary black iron fittings
};

export function factionProduction(id: string): FactionProduction {
  const p = factions.profiles.find((p) => p.id === id),
    entry = entries[id];
  if (!p || !entry) throw new Error(`Unknown profile: ${id}`);
  const [name, role, access, equipment, emphasis, trait] = entry;
  const [hp, attack, armor, move, supply, turns, P, M, K, E] = roleStats[role];
  const divine = p.category === "Valar" || id === "melkor_worldbreaker";
  const populous =
    id.startsWith("human_") ||
    id === "orc_fortress_clan" ||
    id === "melkor_dark_architect" ||
    id === "sauron";
  const income = divine
    ? stocks(6, 5, 4, 3)
    : populous
      ? stocks(12, 12, 6, 2)
      : stocks(9, 8, 6, 3);
  income[emphasis] += divine ? 2 : 5;
  if (id === "hobbit_shire") income.P += 6;
  const protectedUnit =
    id === "dwarf_belegost" || id === "human_gondor" || id === "elf_fingolfin";
  const crafted = id === "elf_feanor" || id === "dwarf_nogrod" || id === "aule";
  const rooted = id === "ent_grove";
  const kind: FactionProduction["unit"]["kind"] =
    role === "construct"
      ? "construct"
      : ["beast", "flying"].includes(role)
        ? "beast"
        : "company";
  const training: Record<string, string> = {
    human_rohan: "Horse-breeding Steads",
    human_gondor: "Fortified Supply Depots",
    human_numenor: "Deep-water Shipyards",
    ent_grove: "Living Nursery",
    eagle_eyrie: "Training Ledge",
    troll_hold: "Drill Yard",
    wolf_pack: "Scent Den",
    spider_brood: "Silk Nursery",
  };
  const facility = training[id] ?? p.facilities[1] ?? p.heroBuilding;
  const habitat = [
    "ent_grove",
    "eagle_eyrie",
    "wolf_pack",
    "spider_brood",
  ].includes(id);
  const equipmentAccess = equipmentMaterials[id];
  if (!equipmentAccess)
    throw new Error(`Missing explicit equipment material mapping: ${id}`);
  const equipmentArmor =
    protectedUnit || role === "guard"
      ? 3
      : role === "scout" || role === "rider"
        ? 1
        : 2;
  return {
    provisional: true,
    source: `docs/design/silmarillion-game-report.md §${p.sourceSection}; runtime-content-notes.md ordinary-production ledger`,
    unit: {
      name,
      kind,
      cost: stocks(P, M + (crafted ? 10 : 0), K + (crafted ? 5 : 0), E),
      turns,
      attack: attack + (crafted ? 2 : 0),
      hp: hp + (rooted ? 30 : 0),
      armor: armor + (protectedUnit ? 2 : rooted ? 3 : 0),
      move: rooted ? 2 : move,
      supply,
      upkeep:
        role === "construct"
          ? stocks(0, 2, 0, 1)
          : stocks(
              role === "rider" || role === "siege" || role === "beast"
                ? 3
                : role === "elite"
                  ? 2
                  : 1,
            ),
      access: [access],
      traits: [trait, role],
      role: roles[role][0],
      counter: roles[role][1],
    },
    equipment: {
      name: equipment,
      cost: stocks(0, crafted ? 35 : 20, crafted ? 15 : 10, divine ? 5 : 0),
      turns: crafted ? 3 : 2,
      armorBonus: equipmentArmor,
      attackBonus: crafted ? 4 : role === "rider" || role === "siege" ? 3 : 2,
      access: [...equipmentAccess],
      bearer: habitat ? "habitat" : "humanoid",
      source: `r6 §${p.sourceSection}; explicit provisional material interpretation; numerical bonuses provisional`,
    },
    income,
    trainingName: facility,
    workshopName: creatureCapabilities[id]?.workshop ?? (crafted ? facility : `${p.heroBuilding} craft benches`),
    researchName: `${p.heroBuilding} study`,
  };
}
