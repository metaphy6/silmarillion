import { expect, it } from "vitest";
import {
  recipe,
  supportingSummon,
  sarumanSentinel,
  factionBuilding,
  profiles,
} from "../src/content/catalog";
it("does not teach unsupported bound bodies to every faction", () => {
  for (const id of [
    "human_gondor",
    "human_rohan",
    "human_numenor",
    "hobbit_shire",
    "sauron",
    "istari_saruman",
    "wolf_pack",
    "melkor_worldbreaker",
  ])
    expect(recipe(id, "summon")).toBeUndefined();
  for (const p of profiles)
    if (recipe(p.id, "summon"))
      expect(supportingSummon(p.id)?.source).toContain(
        "silmarillion-game-report",
      );
  expect(recipe("varda", "summon")?.name).toBe("lumen construct");
  expect(recipe("istari_forge", "summon")?.name).toBe("Bound Sparks");
});
it("keeps the paid Sentinel recipe unique to Saruman with exact source constraints", () => {
  expect(recipe("istari_saruman", "sentinel")).toMatchObject({
    cost: { P: 0, M: 40, K: 15, E: 20 },
    turns: 2,
    supply: 2,
    binding: 1,
    facility: "orthanc",
    provisional: false,
  });
  expect(recipe("human_gondor", "sentinel")).toBeUndefined();
  expect(sarumanSentinel).toMatchObject({
    readiness: 3,
    heroCommitment: 1,
    activeOrPendingLimit: 1,
    upkeep: { P: 0, M: 2, K: 0, E: 1 },
    attackOnCompletion: false,
    dismantleRefund: 0,
  });
  expect(factionBuilding("istari_saruman", "orthanc")?.name).toBe(
    "Orthanc Workshop",
  );
  expect(factionBuilding("human_rohan", "orthanc")).toBeUndefined();
});
it("equipment and facility access reflect materials instead of unit habitat", () => {
  expect(recipe("human_rohan", "equipment")?.access).not.toContain("pasture");
  expect(recipe("human_gondor", "equipment")?.access.length).toBeGreaterThan(0);
  expect(factionBuilding("human_rohan", "training")?.name).toContain("Horse");
});
it("uses explicit material interpretations for all profiles instead of equipment-name guesses", async () => {
  const { factionProduction } = await import("../src/content/production");
  expect(factionProduction("istari_radagast").equipment.access).toEqual([
    "grove",
  ]);
  expect(factionProduction("vana").equipment.access).toEqual(["grove"]);
  expect(factionProduction("ulmo").equipment.access).toEqual(["shore"]);
  expect(factionProduction("elf_nandor").equipment.access).toEqual([
    "timber",
    "textile",
  ]);
  expect(factionProduction("varda").equipment.access).toEqual(["glass"]);
  for (const p of profiles) {
    const eq = factionProduction(p.id).equipment;
    expect(eq.access.length).toBeGreaterThan(0);
    expect(new Set(eq.access).size).toBe(eq.access.length);
    expect(eq.source).toContain("explicit provisional material interpretation");
    const original = [...eq.access];
    eq.access.push("invalid");
    expect(factionProduction(p.id).equipment.access).toEqual(original);
  }
});
