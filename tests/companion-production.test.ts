import { expect, it } from "vitest";
import {
  companionKeys,
  companionProduction,
  companionRole,
} from "../src/content/companion-production";
import { createMatch } from "../src/simulation/engine";
const profiles = [
  "manwe",
  "yavanna",
  "nienna",
  "orome",
  "tulkas",
  "nessa",
  "vana",
  "este",
  "istari_grove",
];
it("provides nine exact paid source identities only to their source profile", () => {
  const names = [
    "courier-eagle",
    "root guardian",
    "memory lantern",
    "hunting-hound pack",
    "pack aurochs",
    "courier stag",
    "songbird swarm",
    "rescue hind",
    "Moth Clouds",
  ];
  expect(companionKeys).toHaveLength(9);
  for (let n = 0; n < 9; n++) {
    const q = companionProduction(profiles[n], companionKeys[n])!;
    expect(q.recipe.name).toBe(names[n]);
    expect(q.source).toContain("silmarillion-game-report.md");
    expect(q.recipe.provisional).toBe(true);
    expect(q.recipe.turns).toBeGreaterThan(0);
    expect(
      Object.values(q.recipe.cost).reduce((a, b) => a + b, 0),
    ).toBeGreaterThan(0);
    expect(q.recipe.access.length).toBeGreaterThan(0);
    expect(q.recipe.great).toBe(0);
    expect(q.recipe.binding).toBe(0);
    for (const foreign of profiles.filter((p) => p !== profiles[n]))
      expect(companionProduction(foreign, companionKeys[n])).toBeUndefined();
  }
});
it("models biological companions with finite upkeep and distinct locomotion, never magical invisibility or extra heroes", () => {
  for (const profile of profiles) {
    for (const key of companionKeys) {
      const q = companionProduction(profile, key);
      if (!q || !q.stats) continue;
      expect(q.stats.kind).toBe("beast");
      expect(q.stats.supply).toBeGreaterThan(0);
      expect(q.stats.upkeep.P).toBeGreaterThan(0);
      expect(q.stats.move).toBeGreaterThan(0);
      expect(q.stats.hp).toBeGreaterThan(0);
      expect(q.appearance.species).toBeTruthy();
    }
  }
  expect(companionProduction("manwe", "courier-eagle")!.stats?.flying).toBe(
    true,
  );
  expect(companionProduction("nessa", "courier-stag")!.stats?.flying).toBe(
    false,
  );
  expect(companionProduction("tulkas", "pack-aurochs")!.stats?.loadClass).toBe(
    "large",
  );
  expect(
    companionProduction("istari_grove", "moth-clouds")!.stats?.flying,
  ).toBe(true);
});
it("memory lantern is a single crafted item rather than a duplicate spirit/body or combat bonus", () => {
  const q = companionProduction("nienna", "memory-lantern")!;
  expect(q.recipe.kind).toBe("item");
  expect(q.recipe.supply).toBe(0);
  expect(q.stats).toBeUndefined();
  expect(q.item).toMatchObject({
    bonus: 0,
    attackBonus: 0,
    durability: 100,
    maxDurability: 100,
    materials: ["metal", "glass"],
  });
});
it("content copies and physical role provenance cannot grant foreign abilities through names", () => {
  const q = companionProduction("manwe", "courier-eagle")!;
  q.recipe.cost.P = 0;
  expect(
    companionProduction("manwe", "courier-eagle")!.recipe.cost.P,
  ).toBeGreaterThan(0);
  const s = createMatch(["manwe", "human_rohan"], 7),
    u = s.units["p1:company:0"];
  Object.assign(u, q.stats, { companion: "courier-eagle" });
  expect(companionRole(s, u)).toBe("courier");
  u.owner = "p2";
  expect(companionRole(s, u)).toBeUndefined();
  delete (u as typeof u & { companion?: string }).companion;
  u.owner = "p1";
  u.name = "courier-eagle";
  expect(companionRole(s, u)).toBeUndefined();
});
