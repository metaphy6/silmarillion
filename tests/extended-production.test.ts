import { expect, it } from "vitest";
import {
  extendedKeys,
  extendedProduction,
  extendedCapabilities,
  elvenProductionProfiles,
} from "../src/content/extended-production";
import { createMatch } from "../src/simulation/engine";
it("all eight exact Elven profiles independently train defenders and archers with paid distinct recipes", () => {
  expect(elvenProductionProfiles).toHaveLength(8);
  for (const p of elvenProductionProfiles) {
    const d = extendedProduction(p, "elven-defenders")!,
      a = extendedProduction(p, "elven-archers")!;
    expect(d.stats?.armor).toBeGreaterThan(a.stats!.armor);
    expect(a.capabilities.ordinaryRanged).toBe(true);
    expect(a.recipe.supply).toBeGreaterThan(0);
    expect(a.recipe.cost.P).toBeGreaterThan(0);
    expect(a.recipe.turns).toBeGreaterThan(0);
  }
  expect(extendedProduction("human_rohan", "elven-archers")).toBeUndefined();
  expect(extendedProduction("elf_invented", "elven-defenders")).toBeUndefined();
});
it("faction specialties are source restricted finite ordinary output, not copied hero or creature recipes", () => {
  const pairs = [
    ["elf_nandor", "woodland-mount"],
    ["elf_avari", "clan-pack-animal"],
    ["elf_feanor", "masterwork-blade"],
    ["elf_vanyar", "ceremonial-standard"],
    ["human_rohan", "mounted-scout"],
    ["human_rohan", "saddle"],
    ["dwarf_khazad_dum", "mining-engine"],
    ["dwarf_khazad_dum", "stone-porter"],
    ["dwarf_belegost", "protected-hauler"],
    ["hobbit_shire", "pack-pony"],
    ["hobbit_shire", "travel-kit"],
  ];
  expect(extendedKeys).toHaveLength(13);
  for (const [p, k] of pairs) {
    const q = extendedProduction(p, k)!;
    expect(q).toBeDefined();
    expect(q.recipe.provisional).toBe(true);
    expect(q.recipe.great).toBe(0);
    expect(q.recipe.binding).toBe(0);
    expect(q.recipe.access.length).toBeGreaterThan(0);
    expect(
      Object.values(q.recipe.cost).reduce((a, b) => a + b, 0),
    ).toBeGreaterThan(0);
    expect(extendedProduction("melkor_dark_architect", k)).toBeUndefined();
    expect(q.source).toContain("silmarillion-game-report.md");
  }
});
it("real logistics and mining roles have physical finite bodies and every weapon/kit has consumable durability", () => {
  for (const [p, k] of [
    ["elf_avari", "clan-pack-animal"],
    ["dwarf_khazad_dum", "stone-porter"],
    ["dwarf_belegost", "protected-hauler"],
    ["hobbit_shire", "pack-pony"],
  ]) {
    const q = extendedProduction(p, k)!;
    expect(q.stats?.supply).toBeGreaterThan(0);
    expect(
      Object.values(q.stats!.upkeep).reduce((a, b) => a + b, 0),
    ).toBeGreaterThan(0);
    expect(q.capabilities.convoyCapacity).toBe(20);
  }
  const engine = extendedProduction("dwarf_khazad_dum", "mining-engine")!;
  expect(engine.stats?.kind).toBe("construct");
  expect(engine.capabilities.miningWork).toBe(true);
  for (const [p, k] of [
    ["elf_feanor", "masterwork-blade"],
    ["elf_vanyar", "ceremonial-standard"],
    ["human_rohan", "saddle"],
    ["hobbit_shire", "travel-kit"],
  ]) {
    const q = extendedProduction(p, k)!;
    expect(q.recipe.kind).toBe("item");
    expect(q.item?.durability).toBe(100);
    expect(q.stats).toBeUndefined();
  }
});
it("producer metadata, owner and locomotion gate utility, while returned descriptors are isolated", () => {
  const q = extendedProduction("hobbit_shire", "pack-pony")!,
    s = createMatch(["hobbit_shire", "human_rohan"], 3),
    u = s.units["p1:company:0"];
  Object.assign(u, q.stats, { extended: "pack-pony" });
  expect(extendedCapabilities(s, u)?.convoyCapacity).toBe(20);
  u.owner = "p2";
  expect(extendedCapabilities(s, u)).toBeUndefined();
  u.owner = "p1";
  u.flying = true;
  expect(extendedCapabilities(s, u)).toBeUndefined();
  q.recipe.cost.P = 0;
  expect(
    extendedProduction("hobbit_shire", "pack-pony")!.recipe.cost.P,
  ).toBeGreaterThan(0);
});
it('unknown or inherited object keys never become production descriptors',()=>{for(const key of ['missing','constructor','toString','__proto__'])expect(extendedProduction('elf_vanyar',key)).toBeUndefined();});
