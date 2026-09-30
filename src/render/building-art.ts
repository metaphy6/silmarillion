/** Original reusable material studies; exact facility identity stays in the DOM. */
export function buildingFrame(
  profile: string,
  family: string,
  kind: string,
): string | undefined {
  // These physical surfaces must not look like occupied houses.
  if (
    [
      "cover",
      "barricade",
      "gate",
      "siege-brace",
      "crop-plot",
      "irrigation",
    ].includes(kind)
  )
    return undefined;
  const habitats: Record<string, string> = {
    wolf_pack: "wolf-den",
    eagle_eyrie: "eagle-ledge",
    spider_brood: "spider-lair",
    ent_grove: "grove-refuge",
    human_rohan: "horse-hall",
    human_numenor: "sea-storehouse",
    orc_fortress_clan: "orc-workhall",
    hobbit_shire: "provision-cellar",
  };
  if (habitats[profile]) return habitats[profile];
  if (profile.startsWith("dwarf_")) return "dwarf-foundry";
  if (profile.startsWith("istari_")) return "wizard-workshop";
  const families: Record<string, string> = {
    "high-air": "wind-sanctuary",
    "river-sea": "boat-yard",
    "living-refuge": "grove-refuge",
    "memory-threshold": "archive-house",
    "elven-house": "elven-workshop",
    "worked-stone": "elven-workshop",
    "mortal-works": "muster-house",
    "path-and-pursuit": "grove-refuge",
    commons: "provision-cellar",
    "veiled-path": "wizard-workshop",
    "dominion-works": "binding-workshop",
    "embodied-wild": "dwarf-foundry",
  };
  return families[family];
}

/** Shared tiny world archetypes; identity-specific detail lives in portraits. */
export function figureFrame(profile: string, kind: string): string | undefined {
  if (["dragon", "drake"].includes(kind)) return undefined; // Never draw wings on a grounded dragon form.
  if (kind === "winged-dragon") return "winged-dragon";
  if (kind === "balrog") return "ember-creature";
  if (kind === "construct") return "construct";
  const creatures: Record<string, string> = {
    wolf_pack: "wolf",
    eagle_eyrie: "eagle",
    spider_brood: "spider",
    ent_grove: "ent",
    troll_hold: "troll",
  };
  if (creatures[profile]) return creatures[profile];
  if (kind === "worker") return "porter";
  if (profile.startsWith("istari_"))
    return kind === "hero" ? "wizard" : "infantry";
  if (profile.startsWith("dwarf_")) return "dwarf-engineer";
  if (profile === "orc_fortress_clan") return "orc-guard";
  if (profile === "human_rohan") return "rider";
  if (
    profile.startsWith("elf_") &&
    !["elf_fingolfin", "elf_feanor"].includes(profile)
  )
    return "elven-archer";
  if (kind === "hero") return "herald";
  if (kind === "beast") return "wolf";
  return "infantry";
}
