import {finalKeys,finalProduction} from "./final-production";
import {navalProductionKeys,navalProduction} from "./naval-production";
import {extendedKeys,extendedProduction} from "./extended-production";
import {militaryKeys,militaryProduction} from "./military-production";
import {companionKeys,companionProduction} from "./companion-production";
import {secondaryKeys,secondaryProduction} from "./secondary-production";
import {siegeRecipe} from "../simulation/siege";
import { civilianProfiles, creatureCapabilities, factionProduction } from "./production";
import factions from "./factions.json";
import roster from "../../hero-balance-roster.json";
import matrix from "../../docs/design/art-direction/faction-matrix.json";
import {
  stocks,
  type Profile,
  type Recipe,
  type Stock,
} from "../simulation/types";
export const profiles: Profile[] = roster.profiles;
export const profile = (id: string): Profile => {
  const p = profiles.find((p) => p.id === id);
  if (!p) throw new Error("Unknown profile identity");
  return p;
};
export const art = (id: string) => matrix.profiles.find((p) => p.id === id)!;
export function limits(id: string) {
  const p = profile(id),
    e = factions.profiles.find((p) => p.id === id)!;
  const divine = p.category === "Valar" || id === "melkor_worldbreaker";
  const maia = e.recipe.code === "A";
  return {
    queues: e.caps.ordinaryQueues ?? 4,
    supply: e.caps.supply ?? 24,
    great: e.caps.greatCreatures ?? 0,
    plots: e.caps.supportPlots ?? 8,
    cities: e.caps.cities ?? 4,
    binding: e.caps.binding,
    heroHp: divine
      ? 150
      : id === "melkor_dark_architect"
        ? 110
        : maia
          ? 90
          : 70,
    heroAttack: divine ? 25 : maia ? 18 : 12,
  };
}
export const economy = (id: string) =>
  factions.profiles.find((p) => p.id === id)!;
export function heroRecipe(id: string): Recipe {
  const p = economy(id);
  return {
    id: "hero",
    name: `Create / recreate ${p.hero}`,
    cost: p.recipe.cost,
    turns: p.recipe.turns,
    facility: "core",
    access: [],
    supply: 0,
    great: 0,
    binding: 0,
    kind: "hero",
    provisional: false,
  };
}
export function recipe(id: string, key: string): Recipe | undefined {
  const final=finalProduction(id,key);if(final)return final.recipe;
  const naval=navalProduction(id,key);if(naval)return naval.recipe;
  const extended=extendedProduction(id,key);if(extended)return extended.recipe;
  const military=militaryProduction(id,key);if(military)return military.recipe;
  const companion=companionProduction(id,key);if(companion)return companion.recipe;
  const secondary=secondaryProduction(id,key);if(secondary)return secondary.recipe;
  if (creatureCapabilities[id] && !creatureCapabilities[id].recipes.includes(key)) return undefined;
  if (key === "hero") return heroRecipe(id);
  const production = factionProduction(id);
  if (key === "summon") {
    const summon = supportingSummon(id);
    if (!summon) return undefined;
    return {
      id: key,
      name: summon.name,
      cost: { ...summon.cost },
      turns: summon.turns,
      facility: "workshop",
      kind: "unit",
      supply: 2,
      great: 0,
      binding: 1,
      access: [...summon.access],
      provisional: true,
    };
  }
  if (key === "sentinel") {
    if (id !== "istari_saruman") return undefined;
    return {
      id: key,
      name: "Resonant Sentinel",
      cost: { ...sarumanSentinel.cost },
      turns: 2,
      facility: "orthanc",
      kind: "unit",
      supply: 2,
      great: 0,
      binding: 1,
      access: [],
      provisional: false,
    };
  }
  const make = (
    name: string,
    cost: Stock,
    turns: number,
    facility: string,
    kind: Recipe["kind"],
    supply = 0,
    great = 0,
    binding = 0,
    access: string[] = [],
    provisional = true,
  ): Recipe => ({
    id: key,
    name,
    cost,
    turns,
    facility,
    kind,
    supply,
    great,
    binding,
    access,
    provisional,
  });
  const common: Record<string, Recipe | undefined> = {
    siege:siegeRecipe.profiles.includes(id)?make("Ordinary siege engine",siegeRecipe.cost,siegeRecipe.turns,siegeRecipe.facility,'unit',siegeRecipe.supply,0,0,['timber','metal']):undefined,
    hull: make(
      "Ordinary coastal transport",
      stocks(20, 60, 10),
      2,
      "harbor",
      "vessel",
    ),
    component: make(
      "Signature component",
      stocks(0, 10, 5),
      1,
      "core",
      "component",
      0,
      0,
      0,
      [economy(id).component.access],
      false,
    ),
    synthesis: make(
      "Synthesize component (no source access)",
      stocks(0, 30, 20, 10),
      3,
      "core",
      "component",
      0,
      0,
      0,
      [],
      false,
    ),
    essence: make(
      "Core essence ritual",
      stocks(0, 20, 10),
      2,
      "core",
      "ritual",
      0,
      0,
      0,
      [],
      false,
    ),
    company: make(
      production.unit.name,
      production.unit.cost,
      production.unit.turns,
      "training",
      "unit",
      production.unit.supply,
      0,
      production.unit.kind === "construct" ? 1 : 0,
      production.unit.access,
    ),
    engineers: production.unit.kind === "company" ? make("Field Engineers", stocks(30,20,10),2,"training","unit",1) : undefined,
    "field-tools": make("Field breach tools",stocks(0,15,5),1,"workshop","item",0,0,0,["metal"]),
    worker: make("Worker", stocks(20, 5), 1, "training", "unit"),
    equipment: make(
      production.equipment.name,
      production.equipment.cost,
      production.equipment.turns,
      "workshop",
      "item",
      0,
      0,
      0,
      production.equipment.access,
    ),
    "plan-equipment": id==='vaire'?make("Unlock owned equipment plan",stocks(0,10,10),1,"archive","research"):undefined,
    "tool-breach":make("Tool breach",stocks(0,10,10),1,"research","research"),
    "tool-repair":make("Tool repair",stocks(0,10,10),1,"research","research"),
    technique: make(
      "Prepared magic",
      stocks(0, 20, 30, 10),
      2,
      "research",
      "research",
    ),
    defenses: make(
      "Fieldworks and counter-magic",
      stocks(0, 30, 20),
      2,
      "research",
      "research",
    ),
    brood: make(
      "Brood Discipline",
      stocks(0, 60, 40, 30),
      3,
      "spire",
      "research",
      0,
      0,
      0,
      [],
      false,
    ),
    brute: make(
      "Siege brute",
      stocks(40, 50, 10, 5),
      3,
      "pens",
      "unit",
      3,
      0,
      0,
      [],
      false,
    ),
    drake: make(
      "Lesser Drake",
      stocks(40, 35, 10, 20),
      3,
      "vault",
      "unit",
      3,
      1,
      0,
      [],
      false,
    ),
    dragon: make(
      "Ground Dragon",
      stocks(120, 100, 40, 80),
      6,
      "vault",
      "unit",
      6,
      1,
      0,
      [],
      false,
    ),
    "winged-dragon": make(
      "Winged Dragon",
      stocks(160, 140, 60, 120),
      8,
      "sky-vault",
      "unit",
      8,
      2,
      0,
      [],
      false,
    ),
    balrog: make(
      "Balrog",
      stocks(0, 100, 60, 100),
      6,
      "crucible",
      "unit",
      6,
      1,
      0,
      [],
      false,
    ),
  };
  return common[key];
}
export const recipeKeys = [
  ...secondaryKeys,...companionKeys,...extendedKeys,...militaryKeys,...navalProductionKeys,...finalKeys,
  "siege",
  "hull",
  "component",
  "synthesis",
  "hero",
  "essence",
  "company",
  "worker",
  "engineers",
  "field-tools",
  "equipment",
  "technique",
  "defenses",
  "plan-equipment",
  "tool-breach",
  "tool-repair",
  "summon",
  "sentinel",
  "brood",
  "brute",
  "drake",
  "dragon",
  "winged-dragon",
  "balrog",
];
export const buildings: Record<
  string,
  { name: string; cost: Stock; income: Stock }
> = {
  "portable-workshop":{name:"Portable clan workshop",cost:stocks(15,40,10),income:stocks()},
  // Provisional ordinary construction prices; ability activation prices are adopted.
  "mirror-station":{name:"Maintained mirror station",cost:stocks(0,10,5),income:stocks()},
  "dawn-watch":{name:"Occupied dawn watchpost",cost:stocks(5,15,5),income:stocks()},
  "relay-stable":{name:"Civilian relay stable",cost:stocks(10,30,5),income:stocks()},
  "medicine-nursery": {
    name: "Staffed medicine nursery",
    cost: stocks(15, 30, 10),
    income: stocks(),
  },
  "crop-plot": {
    name: "Cultivated plot",
    cost: stocks(5, 20),
    income: stocks(),
  },
  irrigation: {
    name: "Irrigation works",
    cost: stocks(5, 25),
    income: stocks(),
  },
  safehouse: {
    name: "Staffed safehouse",
    cost: stocks(10, 25, 10),
    income: stocks(),
  },
  beacon: {
    name: "Staffed observation beacon",
    cost: stocks(5, 25, 10),
    income: stocks(),
  },
  foundry: {
    name: "Staffed salvage foundry",
    cost: stocks(10, 40, 10),
    income: stocks(),
  },
  harbor: {
    name: "Staffed harbor",
    cost: stocks(15, 40, 10),
    income: stocks(),
  },
  "rescue-yard": {
    name: "Sheltered rescue yard",
    cost: stocks(15, 35, 10),
    income: stocks(),
  },
  ledge: {
    name: "Prepared landing ledge",
    cost: stocks(10, 25, 5),
    income: stocks(),
  },
  "crossing-anchor": {
    name: "Prepared crossing anchor",
    cost: stocks(5, 15, 0),
    income: stocks(),
  },
  refuge: {
    name: "Staffed recovery refuge",
    cost: stocks(15, 30, 5),
    income: stocks(),
  },
  relay: {
    name: "Staffed signal relay",
    cost: stocks(5, 25, 10),
    income: stocks(),
  },
  depot: {
    name: "Supplied repair depot",
    cost: stocks(10, 35, 5),
    income: stocks(),
  },
  "service-depot": {
    name: "Forge Order service depot",
    cost: stocks(10, 40, 10),
    income: stocks(),
  },
  gate: {name:"Field gate",cost:stocks(10,30),income:stocks()},
  cover: { name: "Exposed field cover", cost: stocks(5, 10), income: stocks() },
  barricade: {
    name: "Timber barricade",
    cost: stocks(10, 15),
    income: stocks(),
  },
  "siege-brace": {
    name: "Exposed siege brace",
    cost: stocks(0, 20, 5),
    income: stocks(),
  },
  core: {
    name: "Recovery core",
    cost: stocks(0, 50, 20, 10),
    income: stocks(10, 8, 5, 3),
  },
  farm: {
    name: "Habitat / provision works",
    cost: stocks(0, 30),
    income: stocks(15),
  },
  mine: { name: "Material works", cost: stocks(10, 30), income: stocks(0, 12) },
  archive: {
    name: "Scribes and lore supplies",
    cost: stocks(0, 25, 10),
    income: stocks(0, 0, 8),
  },
  training: {
    name: "Company training",
    cost: stocks(20, 30),
    income: stocks(),
  },
  workshop: {
    name: "Equipment workshop",
    cost: stocks(0, 40, 10),
    income: stocks(),
  },
  research: {
    name: "Research station",
    cost: stocks(0, 30, 20),
    income: stocks(),
  },
  hold: {
    name: "Fortress Hold",
    cost: stocks(40, 100, 30, 20),
    income: stocks(5, 5, 2),
  },
  spire: {
    name: "Command Spire",
    cost: stocks(0, 60, 30, 10),
    income: stocks(),
  },
  vault: {
    name: "Dragon Brood Vault (tier 2)",
    cost: stocks(40, 80, 20, 20),
    income: stocks(),
  },
  "watch-post":{name:"Woodland watch-post",cost:stocks(10,20),income:stocks()},
  "stable":{name:"Mount stable",cost:stocks(20,30),income:stocks()},
  "sky-vault": {
    name: "Sky Brood Vault (tier 3)",
    cost: stocks(60, 100, 40, 30),
    income: stocks(),
  },
  crucible: {
    name: "Black Crucible (tier 2)",
    cost: stocks(0, 80, 30, 30),
    income: stocks(),
  },
  orthanc: {
    name: "Orthanc Workshop",
    cost: stocks(0, 40, 15),
    income: stocks(),
  },
  pens: { name: "War Pens", cost: stocks(30, 40), income: stocks() },
};

/** Exact adopted hero-power production constraints. Construct combat statistics
 * and Workshop construction prices remain provisional, not part of this recipe. */
export const sarumanSentinel = {
  ...factions.resonantSentinel,
  requiresLivingHero: true,
  requiresStaffedFacility: true,
  requiresPaidBerth: true,
  cannotTargetCreatureFamilies: ["dragon", "balrog"],
} as const;

const summonNames: Record<string, string> = {
  varda: "lumen construct",
  ulmo: "current-spirit",
  aule: "articulated stone porter",
  namo: "oath-echo",
  irmo: "phantom hound",
  vaire: "threadward effigy",
  istari_ember: "Ashlight spirits",
  istari_veil: "Mist Doubles",
  istari_forge: "Bound Sparks",
  istari_star: "Star Motes",
  melian: "veil wisps",
  osse: "surf constructs",
  arien: "sun-motes",
  tilion: "moon-motes",
  ilmare: "signal motes",
};
/** Source grants a product identity, not its detailed numbers. A bound-body
 * interpretation is disclosed as provisional for these non-biological outputs. */
export function supportingSummon(id: string) {
  const name = summonNames[id];
  if (!name) return undefined;
  const e = economy(id);
  return {
    name,
    cost: stocks(0, 30, 20, 20),
    turns: 3,
    upkeep: stocks(0, 1, 0, 1),
    access: [e.component.access],
    kind: "construct" as const,
    source: `docs/design/silmarillion-game-report.md §${e.sourceSection}: ${e.production}`,
    provisional: true as const,
  };
}

export interface FactionBuilding {
  name: string;
  cost: Stock;
  income: Stock;
  access: string[];
  provisional: boolean;
}
/** Contextual catalog. Callers must use this guard to prevent foreign Workshop
 * construction; generic `buildings` remains available for backwards compatibility. */
export function factionBuilding(
  id: string,
  key: string,
): FactionBuilding | undefined {
  const b = buildings[key];
  if(key==="portable-workshop"&&id!=="elf_avari")return undefined;
  if (key === "relay-stable" && !civilianProfiles.includes(id)) return undefined;
  if (!b || (creatureCapabilities[id] && !creatureCapabilities[id].facilities.includes(key))) return undefined;
  if (key === "service-depot" && id !== "istari_forge") return undefined;
  if (key === "orthanc" && id !== "istari_saruman") return undefined;
  const p = factionProduction(id),
    e = economy(id);
  const habitatNames: Record<string,string> = creatureCapabilities[id] ? {farm:"Habitat provision grounds",mine:"Habitat material gathering",archive:"Habitat lore keeping",hold:"Defended habitat",depot:"Habitat stores",refuge:"Sheltered habitat",safehouse:"Concealed shelter",relay:"Habitat signal point",beacon:"Habitat lookout"} : {};
  const names: Record<string, string> = {
    ...habitatNames,
    core: e.heroBuilding,
    training: p.trainingName,
    workshop: p.workshopName,
    research: p.researchName,
  };
  return {
    name: names[key] ?? b.name,
    cost: { ...b.cost },
    income: key === "core" ? { ...p.income } : { ...b.income },
    access:
      key === "training"
        ? [...p.unit.access]
        : key === "workshop"
          ? [...p.equipment.access]
          : [],
    provisional: true,
  };
}
