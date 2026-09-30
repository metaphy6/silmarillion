import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { observation, terrainObserved } from "../src/simulation/visibility";
import type { Zone } from "../src/simulation/zones";
function fixture() {
  const s = createMatch(["varda", "human_gondor"], 77);
  s.map.terrain.fill("meadow");s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
  for (const u of Object.values(s.units))
    if (u.owner === "p1") Object.assign(u, { x: 0, y: 0 });
  for (const f of Object.values(s.facilities))
    if (f.owner === "p1") Object.assign(f, { x: 0, y: 0 });
  const viewer = s.units["p1:company:0"],
    target = s.units["p2:company:0"];
  Object.assign(viewer, { x: 10, y: 10 });
  Object.assign(target, { x: 12, y: 10 });
  const zone = (kind: Zone["kind"], id = kind) =>
    (s.zones[id] = {
      id,
      owner: "p1",
      kind,
      x: 12,
      y: 10,
      dx: 0,
      dy: 0,
      radius: 1,
      until: s.revision + 3,
      triggered: false,
    });
  return { s, viewer, target, zone };
}
it("bloomscreen hides distant silhouettes but own units and close/elevated observers retain identification", () => {
  const { s, viewer, target, zone } = fixture();
  zone("bloomscreen");
  expect(observation(s, "p1", target)).toBe("hidden");
  expect(terrainObserved(s, "p1", target)).toBe(true);
  expect(observation(s, "p2", target)).toBe("identified");
  viewer.x = 11;
  expect(observation(s, "p1", target)).toBe("identified");
  viewer.x = 10;
  viewer.flying = true;
  viewer.landed = false;
  expect(observation(s, "p1", target)).toBe("identified");
});
it("Varda light reveals silhouettes only, smoke and walls still hide them", () => {
  const { s, target, zone } = fixture();
  zone("bloomscreen");
  zone("light");
  expect(observation(s, "p1", target)).toBe("silhouette");
  zone("smoke");
  expect(observation(s, "p1", target)).toBe("hidden");
  delete s.zones.smoke;
  s.map.terrain[10 * s.map.width + 11] = "cliff";
  expect(observation(s, "p1", target)).toBe("hidden");
});
it("Arien clearance exposes ordinary smoke silhouettes, not roofs or fresh smoke outside the patch", () => {
  const { s, target, zone } = fixture();
  zone("smoke");
  expect(observation(s, "p1", target)).toBe("hidden");
  zone("clear-air");
  expect(observation(s, "p1", target)).toBe("silhouette");
  target.effects.push({
    kind: "roofed",
    value: 1,
    until: s.revision + 3,
    source: "roof",
  });
  expect(observation(s, "p1", target)).toBe("hidden");
  target.effects = [];
  s.zones.smoke.x = 11;
  s.zones.smoke.radius = 0.25;
  s.zones["clear-air"].radius = 0.25;
  expect(observation(s, "p1", target)).toBe("hidden");
});
it("light never reveals inventory or contact identity and expiry removes its observation benefit", () => {
  const { s, target, zone } = fixture();
  target.effects.push({
    kind: "concealed",
    value: 1,
    until: s.revision + 4,
    source: "cover",
  });
  zone("light");
  expect(observation(s, "p1", target)).toBe("silhouette");
  s.zones.light.until = s.revision;
  expect(observation(s, "p1", target)).toBe("hidden");
});
