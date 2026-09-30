import { guestSnapshot } from "../src/network/protocol";
import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { parseMatch } from "../src/simulation/schema";
import {
  movementZonePenalty,
  crossZones,
  rangedZonePenalty,
  clearableZone,
  pruneZones,
  type Zone,
} from "../src/simulation/zones";
function fixture(kind: Zone["kind"] = "web") {
  const s = createMatch(["human_rohan", "human_gondor"], 8);
  const z: Zone = {
    id: "z1",
    owner: "p2",
    kind,
    x: 5,
    y: 4,
    dx: 0,
    dy: 2,
    radius: 0.35,
    until: s.revision + 3,
    triggered: false,
  };
  s.zones = { z1: z };
  const u = s.units["p1:company:0"];
  Object.assign(u, { x: 4, y: 4 });
  return {
    s,
    z,
    u,
    route: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
    ],
  };
}
it("diagonal approach geometry survives validated save and guest snapshots", () => {
  const { s, z } = fixture();
  Object.assign(z, {
    x: 5 + Math.SQRT1_2,
    y: 4 - Math.SQRT1_2,
    dx: -Math.SQRT2,
    dy: Math.SQRT2,
  });
  expect(parseMatch(JSON.parse(JSON.stringify(s))).zones.z1).toEqual(z);
  expect(parseMatch(guestSnapshot(s, "p1"), "p1").zones.z1).toEqual(z);
});
it("ground web slows actual passage and records a private physical crossing, without allegiance changes", () => {
  const { s, u, route } = fixture();
  expect(movementZonePenalty(s, u, route)).toBe(1);
  crossZones(s, u, route);
  expect(s.events.at(-1)?.audience).toEqual(["p2"]);
  expect(s.events.at(-1)?.text).toContain("5,4");
  expect(s.events.at(-1)?.text).not.toContain(u.id);
  expect(u.owner).toBe("p1");
  u.flying = true;
  u.landed = false;
  expect(movementZonePenalty(s, u, route)).toBe(0);
  const n = s.events.length;
  crossZones(s, u, route);
  expect(s.events).toHaveLength(n);
});
it("threshold slows only first hostile formation and never commands or teleports it", () => {
  const { s, u, z, route } = fixture("threshold");
  expect(movementZonePenalty(s, u, route)).toBe(1);
  crossZones(s, u, route);
  expect(z.triggered).toBe(true);
  expect(movementZonePenalty(s, u, route)).toBe(0);
  expect({ x: u.x, y: u.y }).toEqual({ x: 4, y: 4 });
  z.triggered = false;
  u.owner = "p2";
  expect(movementZonePenalty(s, u, route)).toBe(0);
  u.owner = "p1";
  u.kind = "hero";
  expect(movementZonePenalty(s, u, route)).toBe(0);
});
it("roots are bounded and overlapping movement effects use strongest penalty only", () => {
  const { s, u, z, route } = fixture("roots");
  z.radius = 1;
  s.zones.z2 = { ...z, id: "z2" };
  expect(movementZonePenalty(s, u, route)).toBe(1);
  expect(
    movementZonePenalty(s, u, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]),
  ).toBe(0);
});
it("flare affects rays through its directional cone including friendly fire, but not other angles", () => {
  const { s, z } = fixture("flare");
  Object.assign(z, { x: 5, y: 5, dx: 1, dy: 0, radius: 3 });
  expect(rangedZonePenalty(s, { x: 6, y: 3 }, { x: 6, y: 7 })).toBe(25);
  expect(rangedZonePenalty(s, { x: 3, y: 3 }, { x: 3, y: 7 })).toBe(0);
});
it("clearing requires adjacent owned active ordinary armed company and only physical roots/web; expiry prunes", () => {
  const { s, u, z } = fixture();
  expect(clearableZone(s, "p1", u, z)).toBe("");
  u.owner = "p2";
  expect(clearableZone(s, "p1", u, z)).toMatch(/owned/i);
  u.owner = "p1";
  u.kind = "hero";
  expect(clearableZone(s, "p1", u, z)).toMatch(/company/i);
  u.kind = "company";
  z.kind = "flare";
  expect(clearableZone(s, "p1", u, z)).toMatch(/web|root/i);
  z.until = s.revision;
  pruneZones(s);
  expect(s.zones).toEqual({});
});
