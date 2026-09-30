import { describe, it, expect } from "vitest";
import factions from "../src/content/factions.json";
import { factionProduction } from "../src/content/production";

describe("provisional ordinary production content", () => {
  it("covers every authoritative profile with bounded paid production and provenance", () => {
    for (const p of factions.profiles) {
      const f = factionProduction(p.id);
      expect(f.provisional).toBe(true);
      expect(f.source).toContain(p.sourceSection);
      expect(f.unit.name.length).toBeGreaterThan(3);
      expect(f.unit.supply).toBeGreaterThan(0);
      expect(f.unit.turns).toBeGreaterThan(0);
      expect(f.unit.hp).toBeGreaterThan(f.unit.attack);
      expect(f.unit.role).toBeTruthy();
      expect(f.unit.counter).toBeTruthy();
      expect(f.trainingName).toBeTruthy();
      expect(f.workshopName).toBeTruthy();
      expect(f.researchName).toBeTruthy();
      for (const cost of [
        f.unit.cost,
        f.unit.upkeep,
        f.equipment.cost,
        f.income,
      ]) {
        expect(Object.keys(cost).sort()).toEqual(["E", "K", "M", "P"]);
        for (const n of Object.values(cost))
          expect(Number.isInteger(n) && n >= 0).toBe(true);
      }
      expect(
        Object.values(f.unit.cost).reduce((a, b) => a + b),
      ).toBeGreaterThan(0);
      expect(f.unit.name).not.toMatch(/Balrog|Dragon|Drake/i);
    }
  });
  it("keeps supply-poor sanctuaries and distinct kingdom economies", () => {
    const god = factionProduction("manwe"),
      gondor = factionProduction("human_gondor"),
      rohan = factionProduction("human_rohan"),
      numenor = factionProduction("human_numenor");
    expect(Object.values(god.income).reduce((a, b) => a + b)).toBeLessThan(
      Object.values(gondor.income).reduce((a, b) => a + b),
    );
    expect(rohan.unit.move).toBeGreaterThan(gondor.unit.move);
    expect(gondor.unit.armor).toBeGreaterThan(rohan.unit.armor);
    expect(numenor.unit.access).toContain("shore");
    expect(rohan.unit.access).toContain("pasture");
  });
  it("makes realm specialties and creatures materially different", () => {
    expect(factionProduction("dwarf_belegost").unit.armor).toBeGreaterThan(
      factionProduction("dwarf_nogrod").unit.armor,
    );
    expect(factionProduction("wolf_pack").unit.kind).toBe("beast");
    expect(factionProduction("eagle_eyrie").unit.traits).toContain("flight");
    expect(factionProduction("hobbit_shire").income.P).toBeGreaterThan(
      factionProduction("sauron").income.P,
    );
    expect(factionProduction("melkor_worldbreaker").income.M).toBeLessThan(
      factionProduction("melkor_dark_architect").income.M,
    );
  });
  it("rejects unknown identities and prevents caller mutation of content", () => {
    expect(() => factionProduction("missing")).toThrow("Unknown profile");
    const a = factionProduction("manwe");
    a.unit.cost.P = 999;
    a.unit.traits.push("fake");
    expect(factionProduction("manwe").unit.cost.P).not.toBe(999);
    expect(factionProduction("manwe").unit.traits).not.toContain("fake");
  });
});
