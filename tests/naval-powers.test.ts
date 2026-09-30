import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  spawnVessel,
  startNavalOrder,
  progressVessels,
} from "../src/simulation/naval";
import {
  applyNavalPower,
  navalPowerReason,
  effectiveWave,
  unloadingDamage,
} from "../src/simulation/naval-powers";
function setup(profile = "uinen") {
  const s = createMatch([profile, "human_rohan"], 12),
    p = s.players.p1,
    f = s.facilities["p1:core"];
  f.kind = "harbor";
  f.x = 4;
  f.y = 4;
  for (let x = 4; x <= 8; x++) s.map.terrain[5 * s.map.width + x] = "water";
  s.map.terrain[4 * s.map.width + 5] = "plain";
  const crew = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  crew.x = 4;
  crew.y = 4;
  p.stock = { P: 500, M: 500, K: 500, E: 500 };
  s.units[p.hero.id] = {
    ...structuredClone(crew),
    id: p.hero.id,
    kind: "hero",
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  const v = spawnVessel(s, "p1", f.id, crew.id, { x: 4, y: 5 });
  return { s, p, v, f, h: s.units[p.hero.id] };
}
it("Uinen calm reduces one wave severity for two phases only on a damaged existing vessel", () => {
  const { s, p, v } = setup();
  s.seaHazards["4,5"] = { wave: 2, fog: false, handling: 0 };
  const a = {
    kind: "naval-power" as const,
    power: "field" as const,
    ship: v.id,
  };
  expect(
    navalPowerReason(
      s,
      "p1",
      a,
      () => true,
      () => true,
    ),
  ).toMatch(/damaged/);
  v.hp = 40;
  applyNavalPower(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  expect(p.hero.readiness).toBe(4);
  expect(effectiveWave(s, v, v)).toBe(1);
  s.revision += 2;
  expect(effectiveWave(s, v, v)).toBe(2);
});
it("Uinen advances one existing paid repair at a staffed rescue yard for exact adopted supplies", () => {
  const { s, p, v, f } = setup();
  v.hp = 40;
  startNavalOrder(s, "p1", { kind: "repair-ship", ship: v.id });
  const a = {
    kind: "naval-power" as const,
    power: "support" as const,
    ship: v.id,
  };
  expect(
    navalPowerReason(
      s,
      "p1",
      a,
      () => true,
      () => true,
    ),
  ).toMatch(/rescue yard/);
  f.kind = "rescue-yard";
  const before = structuredClone(p.stock);
  applyNavalPower(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  expect(p.stock).toEqual({ ...before, P: before.P - 10, M: before.M - 15 });
  expect(p.hero.readiness).toBe(3);
  expect(v.repair?.remaining).toBe(1);
  expect(
    navalPowerReason(
      s,
      "p1",
      a,
      () => true,
      () => true,
    ),
  ).toMatch(/already advanced/);
});
it("Falmari beacon consumes exact5M and skips one actual fog delay while sailing normally", () => {
  const { s, p, v, f } = setup("elf_falmari");
  s.facilities.beacon = { ...f, id: "beacon", kind: "beacon" };
  s.seaHazards["5,5"] = { wave: 0, fog: true, handling: 0 };
  startNavalOrder(s, "p1", {
    kind: "sail",
    ship: v.id,
    route: [
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
    ],
  });
  applyNavalPower(
    s,
    "p1",
    { kind: "naval-power", power: "support", ship: v.id },
    () => true,
    () => true,
  );
  expect(p.stock.M).toBe(495);
  progressVessels(s);
  expect(v.x).toBe(6);
  expect(s.navalEffects[0].used).toBe(true);
});
it("Falmari shields only actual unloading ranged damage with hero at landing", () => {
  const { s, v, h } = setup("elf_falmari"),
    unit = s.units["p1:company:0"];
  unit.x = 4;
  unit.y = 4;
  startNavalOrder(s, "p1", { kind: "embark", ship: v.id, unit: unit.id });
  progressVessels(s);
  s.turn++;
  startNavalOrder(s, "p1", {
    kind: "disembark",
    ship: v.id,
    unit: unit.id,
    landing: { x: 4, y: 4 },
  });
  h.x = 4;
  h.y = 4;
  applyNavalPower(
    s,
    "p1",
    { kind: "naval-power", power: "field", ship: v.id },
    () => true,
    () => true,
  );
  expect(unloadingDamage(s, v, 20, true)).toBe(15);
  expect(unloadingDamage(s, v, 20, false)).toBe(20);
  s.revision++;
  expect(unloadingDamage(s, v, 20, true)).toBe(20);
});
it("Osse surf affects friendly hulls and expires, requires observed nearby coastal water", () => {
  const { s, p, v } = setup("osse");
  const a = {
    kind: "naval-power" as const,
    power: "field" as const,
    x: 5,
    y: 5,
  };
  expect(
    navalPowerReason(
      s,
      "p1",
      a,
      () => false,
      () => true,
    ),
  ).not.toBe("");
  applyNavalPower(
    s,
    "p1",
    a,
    () => true,
    () => true,
  );
  expect(p.hero.readiness).toBe(4);
  expect(effectiveWave(s, v, { x: 5, y: 5 })).toBe(1);
  startNavalOrder(s, "p1", {
    kind: "sail",
    ship: v.id,
    route: [
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
    ],
  });
  progressVessels(s);
  expect(v.x).toBe(6);
  expect(v.hp).toBe(78);
  s.revision += 2;
  expect(effectiveWave(s, v, { x: 5, y: 5 })).toBe(0);
});
it("naval effect checkpoints reject forged source identity, vessel ownership, duplicate and excessive duration", async () => {
  const { validateNavalEffects } =
    await import("../src/simulation/naval-powers");
  const { s, v } = setup();
  v.hp = 40;
  applyNavalPower(
    s,
    "p1",
    { kind: "naval-power", power: "field", ship: v.id },
    () => true,
    () => true,
  );
  expect(() => validateNavalEffects(s)).not.toThrow();
  const original = structuredClone(s.navalEffects[0]);
  s.navalEffects[0].owner = "p2";
  expect(() => validateNavalEffects(s)).toThrow(/naval/);
  s.navalEffects = [structuredClone(original)];
  s.navalEffects[0].until = s.revision + 3;
  expect(() => validateNavalEffects(s)).toThrow(/naval/);
  s.navalEffects = [structuredClone(original), structuredClone(original)];
  expect(() => validateNavalEffects(s)).toThrow(/naval/);
  s.navalEffects = [original];
  v.owner = "p2";
  expect(() => validateNavalEffects(s)).toThrow(/vessel/);
});
it("coastal connectivity needs a real accessible harbor and continuous water instead of flight over land", async () => {
  const { connectedCoastal } = await import("../src/simulation/naval-powers");
  const { s, h, v, f } = setup();
  v.x = 7;
  expect(connectedCoastal(s, h, v, () => true)).toBe(true);
  expect(connectedCoastal(s, h, v, () => false)).toBe(false);
  s.map.terrain[5 * s.map.width + 6] = "plain";
  expect(connectedCoastal(s, h, v, () => true)).toBe(false);
  s.map.terrain[5 * s.map.width + 6] = "water";
  f.workers = 0;
  expect(connectedCoastal(s, h, v, () => true)).toBe(false);
  h.x = 4;
  h.y = 5;
  expect(connectedCoastal(s, h, v, () => false)).toBe(true);
});
