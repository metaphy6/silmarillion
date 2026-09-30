import { describe, expect, it } from "vitest";
import { createBasinScenario } from "../src/content/scenario";

describe("authored basin geography", () => {
  it("declares invented cross-era geography and no canonical artifact custody", () => {
    const s = createBasinScenario(32);
    expect(s.id).toBe("cross-era-basin-v1");
    expect(s.contract.chronology_mode).toBe("cross-era-sandbox");
    expect(s.contract.artifact_custody).toBe(
      "Unique canonical artifacts absent",
    );
    expect(s.contract.invented_connections.length).toBeGreaterThan(0);
    expect(createBasinScenario(32)).toEqual(s);
    s.map.terrain[0] = "water";
    expect(createBasinScenario(32).map.terrain[0]).not.toBe("water");
  });
  it("keeps every start, facility and landmark reachable at every supported size", () => {
    for (let size = 24; size <= 128; size++) {
      const s = createBasinScenario(size),
        { terrain } = s.map;
      expect(terrain).toHaveLength(size * size);
      const pass = (x: number, y: number) =>
        x >= 0 &&
        y >= 0 &&
        x < size &&
        y < size &&
        !["water", "cliff"].includes(terrain[y * size + x]);
      const visited = new Set<number>(),
        queue = [s.starts[0]];
      visited.add(queue[0].y * size + queue[0].x);
      for (let i = 0; i < queue.length; i++)
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const x = queue[i].x + dx,
            y = queue[i].y + dy,
            key = y * size + x;
          if (pass(x, y) && !visited.has(key)) {
            visited.add(key);
            queue.push({ x, y });
          }
        }
      for (const at of [
        ...s.starts,
        ...s.facilityFootprints,
        ...s.landmarks,
        ...s.roads,
      ])
        expect(
          visited.has(at.y * size + at.x),
          `${size}: ${at.x},${at.y}`,
        ).toBe(true);
      expect(s.cliffTiles.length).toBeGreaterThan(0);
      expect(s.riverTiles.length).toBeGreaterThan(0);
      for (const at of s.cliffTiles)
        expect(terrain[at.y * size + at.x]).toBe("cliff");
      for (const at of s.riverTiles)
        expect(terrain[at.y * size + at.x]).toBe("water");
      // Every traversable cell through the river is an explicitly authored crossing.
      const crossings = new Set(s.crossings.map((p) => `${p.x},${p.y}`));
      for (let y = 0; y < size; y++)
        expect(pass(Math.floor(size / 2), y)).toBe(
          crossings.has(`${Math.floor(size / 2)},${y}`),
        );
    }
  });
  it("rejects malformed sizes rather than emitting partial maps", () => {
    for (const size of [NaN, Infinity, 23, 129, 32.5])
      expect(() => createBasinScenario(size)).toThrow();
  });
});
