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
