import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  spawnVessel,
  startNavalOrder,
  progressVessels,
  navalOrderReason,
  damageVessel,
  validateVesselState,
} from "../src/simulation/naval";
import type { NavalAction } from "../src/simulation/naval";
function fixture(profile = "elf_falmari") {
  const s = createMatch([profile, "human_rohan"], 77),
    p = s.players.p1,
    f = s.facilities["p1:core"],
    crew = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  Object.assign(f, { kind: "harbor", x: 4, y: 4 });
  Object.assign(crew, { x: 4, y: 4 });
  for (let x = 4; x <= 9; x++) s.map.terrain[5 * s.map.width + x] = "water";
  p.stock = { P: 100, M: 100, K: 100, E: 100 };
  const v = spawnVessel(s, "p1", f.id, crew.id, { x: 4, y: 5 });
  p.hero.status = "living";
  s.units[p.hero.id] = {
    ...structuredClone(s.units["p1:company:0"]),
    id: p.hero.id,
    kind: "hero",
    x: v.x,
    y: v.y,
    effects: [],
  };
  v.aboardHero = p.hero.id;
  return { s, p, v, f };
}
it("Falmari ignores only first accompanied cargo handling modifier, never the base action", () => {
  const { s, v } = fixture();
  s.seaHazards["4,5"] = { wave: 0, fog: false, handling: 2 };
  startNavalOrder(s, "p1", {
    kind: "load-cargo",
    ship: v.id,
    cargo: { P: 8, M: 0, K: 0, E: 0 },
  });
  expect(v.handlingRemaining).toBe(1);
  progressVessels(s);
  s.turn++;
  startNavalOrder(s, "p1", {
    kind: "unload-cargo",
    ship: v.id,
    cargo: { P: 4, M: 0, K: 0, E: 0 },
  });
  expect(v.handlingRemaining).toBe(1);
  progressVessels(s);
  startNavalOrder(s, "p1", {
    kind: "load-cargo",
    ship: v.id,
    cargo: { P: 2, M: 0, K: 0, E: 0 },
  });
  expect(v.handlingRemaining).toBe(3);
});
it("Falmari cannot waive delay remotely or consume the passive on a zero modifier", () => {
  const { s, v } = fixture();
  startNavalOrder(s, "p1", {
    kind: "load-cargo",
    ship: v.id,
    cargo: { P: 8, M: 0, K: 0, E: 0 },
  });
  expect(s.units[s.players.p1.hero.id].effects).toHaveLength(0);
  progressVessels(s);
  v.aboardHero = null;
  s.seaHazards["4,5"] = { wave: 0, fog: false, handling: 2 };
  startNavalOrder(s, "p1", {
    kind: "unload-cargo",
    ship: v.id,
    cargo: { P: 4, M: 0, K: 0, E: 0 },
  });
  expect(v.handlingRemaining).toBe(3);
});
it("actual minor storm consumes existing cargo; Numenor reduces only the first loss and not hull damage", () => {
  for (const accompanied of [true, false]) {
    const { s, v } = fixture("human_numenor");
    if (!accompanied) v.aboardHero = null;
    v.cargo.P = 12;
    s.seaHazards["5,5"] = { wave: 1, fog: false, handling: 0 };
    s.seaHazards["6,5"] = { wave: 1, fog: false, handling: 0 };
    const hp = v.hp;
    startNavalOrder(s, "p1", {
      kind: "sail",
      ship: v.id,
      route: [
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
      ],
    });
    progressVessels(s);
    expect(v.cargo.P).toBe(accompanied ? 5 : 4);
    expect(v.hp).toBe(hp - 4);
    validateVesselState(s, v);
  }
});
it("Uinen requires paid prepared rescue rig, skips one deployment and preserves ordinary handling", () => {
  const { s, p, v, f } = fixture("uinen");
  const secondCrew = { ...structuredClone(s.units[v.crew]), id: "second-crew" };
  s.units[secondCrew.id] = secondCrew;
  const wreck = spawnVessel(s, "p1", f.id, secondCrew.id, { x: 4, y: 5 });
  wreck.x = 5;
  secondCrew.x = 5;
  const passenger = s.units["p1:company:0"];
  Object.assign(passenger, { x: 5, y: 5 });
  wreck.passenger = passenger.id;
  damageVessel(s, wreck.id, wreck.hp);
  expect(
    navalOrderReason(s, "p1", {
      kind: "rescue-passenger",
      ship: v.id,
      unit: passenger.id,
    }),
  ).toMatch(/rig/i);
  const before = p.stock.P;
  startNavalOrder(s, "p1", {
    kind: "prepare-rescue-rig",
    ship: v.id,
  } as NavalAction);
  expect(p.stock.P).toBe(before - 1);
  startNavalOrder(s, "p1", {
    kind: "rescue-passenger",
    ship: v.id,
    unit: passenger.id,
  });
  expect(v.handlingRemaining).toBe(1);
  expect(v.passenger).toBe(passenger.id);
  progressVessels(s);
  expect(v.phase).toBe("idle");
});
it("storm protection cannot generate cargo or mitigate catastrophic waves", () => {
  const { s, v } = fixture("human_numenor");
  v.cargo = { P: 1, M: 1, K: 0, E: 0 };
  s.seaHazards["5,5"] = { wave: 1, fog: false, handling: 0 };
  s.seaHazards["6,5"] = { wave: 3, fog: false, handling: 0 };
  const hp = v.hp;
  startNavalOrder(s, "p1", {
    kind: "sail",
    ship: v.id,
    route: [
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
    ],
  });
  progressVessels(s);
  expect(v.cargo).toEqual({ P: 0, M: 0, K: 0, E: 0 });
  expect(v.hp).toBe(hp - 8);
});
it("prepared ordinary rescue spends its real deployment phase and malformed rig state fails validation", () => {
  const { s, v, f } = fixture("elf_falmari"),
    crew = {
      ...structuredClone(s.units[v.crew]),
      id: "rescue-source",
      x: f.x,
      y: f.y,
    };
  s.units[crew.id] = crew;
  const wreck = spawnVessel(s, "p1", f.id, crew.id, { x: 4, y: 5 });
  damageVessel(s, wreck.id, wreck.hp);
  startNavalOrder(s, "p1", { kind: "prepare-rescue-rig", ship: v.id });
  startNavalOrder(s, "p1", {
    kind: "rescue-passenger",
    ship: v.id,
    unit: crew.id,
  });
  expect(v.handlingRemaining).toBe(2);
  progressVessels(s);
  expect(v.phase).toBe("loading");
  s.turn++;
  progressVessels(s);
  expect(v.phase).toBe("idle");
  Object.assign(v, { rescueRigged: "forged" });
  expect(() => validateVesselState(s, v)).toThrow();
});
