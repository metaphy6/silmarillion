import figureAtlas from "../public/assets/world-figures.json";
import { describe, expect, it } from "vitest";
import { buildingFrame, figureFrame } from "../src/render/building-art";
import matrix from "../docs/design/art-direction/faction-matrix.json";
import atlas from "../public/assets/building-atlas.json";
describe("original building atlas", () => {
  it("maps every profile to a real bounded frame", () => {
    for (const p of matrix.profiles) {
      const key = buildingFrame(p.id, p.family, "core");
      expect(key).toBeTruthy();
      const f = atlas.frames[key as keyof typeof atlas.frames].frame;
      expect(f.x + f.w).toBeLessThanOrEqual(1254);
      expect(f.y + f.h).toBeLessThanOrEqual(1254);
    }
  });
  it("retains creature habitats and distinguishes physical earthworks", () => {
    expect(buildingFrame("wolf_pack", "embodied-wild", "core")).toBe(
      "wolf-den",
    );
    expect(buildingFrame("eagle_eyrie", "embodied-wild", "core")).toBe(
      "eagle-ledge",
    );
    expect(buildingFrame("spider_brood", "embodied-wild", "core")).toBe(
      "spider-lair",
    );
    for (const kind of [
      "cover",
      "barricade",
      "gate",
      "siege-brace",
      "crop-plot",
      "irrigation",
    ])
      expect(buildingFrame("manwe", "high-air", kind)).toBeUndefined();
    expect(buildingFrame("melkor_worldbreaker", "dominion-works", "core")).toBe(
      buildingFrame("melkor_dark_architect", "dominion-works", "core"),
    );
  });
});

it("world archetypes preserve creature anatomy and do not give grounded dragons wings", () => {
  for (const p of matrix.profiles)
    for (const kind of ["company", "hero", "worker"]) {
      const key = figureFrame(p.id, kind)!;
      expect(figureAtlas.frames).toHaveProperty(key);
    }
  expect(figureFrame("wolf_pack", "hero")).toBe("wolf");
  expect(figureFrame("spider_brood", "worker")).toBe("spider");
  expect(figureFrame("melkor_worldbreaker", "drake")).toBeUndefined();
  expect(figureFrame("melkor_dark_architect", "dragon")).toBeUndefined();
  expect(figureFrame("melkor_dark_architect", "winged-dragon")).toBe(
    "winged-dragon",
  );
});
