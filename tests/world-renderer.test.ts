import { expect, it, vi } from "vitest";
vi.mock("phaser", () => ({ default: { Scene: class {} } }));
import {
  iso,
  chunkBounds,
  markerTargetSize,
  isEditingTarget,
  TERRAIN_CACHE_LIMIT,
  TERRAIN_CACHE_MAX_BYTES,
  displayedZones,
  zoneOutline,
  terrainPaint,
} from "../src/render/world";
import { createMatch } from "../src/simulation/engine";
it("does not draw hidden or expired enemy zones from a local authoritative state", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 6);
  const u = Object.values(s.units).find((u) => u.owner === "p2")!;
  s.zones.own = {
    id: "own",
    owner: "p2",
    kind: "web",
    x: 0,
    y: 0,
    dx: 2,
    dy: 0,
    radius: 0.35,
    until: 9,
    triggered: false,
  };
  s.zones.hidden = { ...s.zones.own, id: "hidden", owner: "p1" };
  s.zones.seen = { ...s.zones.hidden, id: "seen", x: u.x, y: u.y };
  s.zones.expired = { ...s.zones.seen, id: "expired", until: s.revision };
  expect(
    displayedZones(s, "p2")
      .map((z) => z.id)
      .sort(),
  ).toEqual(["own", "seen"]);
  for (const kind of [
    "web",
    "roots",
    "threshold",
    "flare",
    "bloomscreen",
  ] as const) {
    const points = zoneOutline({ ...s.zones.own, kind });
    expect(points.length).toBeLessThanOrEqual(26);
    expect(
      points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    ).toBe(true);
  }
});
it("keeps chunk bounds around every diamond corner including partial chunks", () => {
  const b = chunkBounds(8, 16, 3, 5);
  for (let y = 16; y < 21; y++)
    for (let x = 8; x < 11; x++) {
      const p = iso(x, y);
      expect(p.x - 68).toBeGreaterThanOrEqual(b.x);
      expect(p.x + 68).toBeLessThanOrEqual(b.x + b.width);
      expect(p.y - 34).toBeGreaterThanOrEqual(b.y);
      expect(p.y + 34).toBeLessThanOrEqual(b.y + b.height);
    }
});
it("keeps target geometry at least 44 screen pixels throughout supported zoom", () => {
  for (const z of [0.25, 0.5, 0.7, 1, 1.6])
    expect(markerTargetSize(z) * z).toBeGreaterThanOrEqual(44);
});
it("leaves arrows to focused DOM form controls and editable content", () => {
  expect(isEditingTarget({ closest: () => ({}) } as unknown as Element)).toBe(
    true,
  );
  expect(isEditingTarget({ closest: () => null } as unknown as Element)).toBe(
    false,
  );
  expect(isEditingTarget(null)).toBe(false);
});

it("bounds full-resolution chunk texture storage independently of world size", () => {
  expect(TERRAIN_CACHE_LIMIT).toBe(16);
  const bounds = chunkBounds(0, 0, 8, 8);
  expect(
    (bounds.width + 60) * (bounds.height + 90) * 4 * TERRAIN_CACHE_LIMIT,
  ).toBe(TERRAIN_CACHE_MAX_BYTES);
  expect(TERRAIN_CACHE_MAX_BYTES).toBeLessThan(48 * 1024 * 1024);
});

it("paints opaque distinct terrain with bounded deterministic strokes inside each footprint", () => {
  const kinds = ["meadow", "woodland", "water", "stone", "cliff"];
  expect(new Set(kinds.map((k) => terrainPaint(k, 3, 8).base)).size).toBe(5);
  for (const kind of kinds) {
    const p = terrainPaint(kind, 3, 8);
    expect(p).toEqual(terrainPaint(kind, 3, 8));
    expect(p.opacity).toBe(1);
    expect(p.strokes.length).toBeGreaterThan(3);
    expect(p.strokes.length).toBeLessThanOrEqual(12);
    for (const stroke of p.strokes)
      for (const point of stroke.points)
        expect(
          Math.abs(point.x) / 68 + Math.abs(point.y) / 34,
        ).toBeLessThanOrEqual(1);
  }
  expect(terrainPaint("cliff", 3, 8).feature).toBe("strata");
  expect(terrainPaint("water", 3, 8).feature).toBe("flow");
  expect(terrainPaint("woodland", 3, 8).feature).toBe("canopy");
});

it("rules terrain uses five distinct color-independent marks and an explicit unknown fallback", async () => {
  const { rulesTerrainStyle, RULES_TERRAIN_LEGEND } =
    await import("../src/render/world");
  const kinds = ["meadow", "woodland", "water", "stone", "cliff"];
  expect(new Set(kinds.map((k) => rulesTerrainStyle(k).symbol)).size).toBe(5);
  expect(RULES_TERRAIN_LEGEND).toContain("Cliff");
  expect(rulesTerrainStyle("unrecognized").symbol).toBe("unknown");
});
it("rules terrain is opt-in and can be toggled safely before Phaser creates the scene", async () => {
  const { World } = await import("../src/render/world");
  const world = new World(
    () => {},
    () => {},
  );
  expect(world.getRulesTerrain()).toBe(false);
  world.setRulesTerrain(true);
  expect(world.getRulesTerrain()).toBe(true);
  world.setRulesTerrain(false);
  expect(world.getRulesTerrain()).toBe(false);
});
it("terrain changes in the same match invalidate baked tiles while unchanged snapshots reuse them", async () => {
  const { World } = await import("../src/render/world");
  const world = new World(
    () => {},
    () => {},
  );
  const internals = world as unknown as {
    loaded: boolean;
    drawTerrain: () => void;
    refresh: () => void;
  };
  internals.loaded = true;
  internals.drawTerrain = vi.fn();
  internals.refresh = vi.fn();
  const s = createMatch(["human_rohan", "human_gondor"], 6);
  world.setState(s, "p1", "");
  world.setState(structuredClone(s), "p1", "");
  expect(internals.drawTerrain).toHaveBeenCalledTimes(1);
  s.map.terrain[0] = s.map.terrain[0] === "water" ? "cliff" : "water";
  world.setState(s, "p1", "");
  expect(internals.drawTerrain).toHaveBeenCalledTimes(2);
  world.setRulesTerrain(true);
  expect(internals.drawTerrain).toHaveBeenCalledTimes(3);
  world.setRulesTerrain(true);
  expect(internals.drawTerrain).toHaveBeenCalledTimes(3);
});

import { rendererPreference, detectWorldRenderer } from "../src/render/world";
it("uses Canvas only for positively identified software WebGL implementations", () => {
  for (const gpu of [
    "ANGLE (Google, Vulkan SwiftShader Device (Subzero))",
    "Mesa llvmpipe (LLVM 18)",
    "softpipe",
    "Microsoft Basic Render Driver",
    "Software Rasterizer",
  ])
    expect(rendererPreference(gpu)).toBe("canvas");
  for (const gpu of [
    "",
    "WebKit WebGL",
    "ANGLE (NVIDIA GeForce)",
    "Intel Iris Xe",
    "Apple M3",
  ])
    expect(rendererPreference(gpu)).toBe("auto");
});
it("releases the temporary GPU probe and preserves AUTO when GPU identification is unavailable", () => {
  const loseContext = vi.fn();
  const getParameter = vi.fn(() => "ANGLE SwiftShader");
  const gl = {
    getParameter,
    getExtension: (name: string) =>
      name === "WEBGL_debug_renderer_info"
        ? { UNMASKED_RENDERER_WEBGL: 123 }
        : { loseContext },
  };
  const canvas = { width: 4, height: 4, getContext: () => gl };
  expect(
    detectWorldRenderer(() => canvas as unknown as HTMLCanvasElement),
  ).toBe("canvas");
  expect(loseContext).toHaveBeenCalledOnce();
  expect(canvas.width).toBe(0);
  expect(canvas.height).toBe(0);
  getParameter.mockImplementation(() => {
    throw Error("privacy restricted");
  });
  expect(
    detectWorldRenderer(() => canvas as unknown as HTMLCanvasElement),
  ).toBe("auto");
  expect(loseContext).toHaveBeenCalledTimes(2);
  expect(
    detectWorldRenderer(
      () =>
        ({
          width: 1,
          height: 1,
          getContext: () => null,
        }) as unknown as HTMLCanvasElement,
    ),
  ).toBe("auto");
});
