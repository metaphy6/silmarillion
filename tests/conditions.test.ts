import { describe, expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  afterOrdinaryDamage,
  attackPenalty,
  movementPenalty,
  endEncounterConditions,
} from "../src/simulation/conditions";
function fixture() {
  const s = createMatch(["human_rohan", "human_gondor"], 95);
  const u = s.units["p1:company:0"];
  u.maxHp = 100;
  u.hp = 70;
  return { s, u };
}
describe("provisional physical combat conditions", () => {
  it("creates an actual nonfatal wound only at the explicit severe injury threshold", () => {
    const { s, u } = fixture();
    afterOrdinaryDamage(s, u, 24);
    expect(u.effects).toEqual([]);
    afterOrdinaryDamage(s, u, 25);
    expect(u.effects[0]).toMatchObject({
      kind: "wound",
      value: 1,
      source: `injury:${u.id}:${s.turn}:${s.revision}`,
    });
    expect(attackPenalty(s, u)).toBe(1);
    expect(movementPenalty(s, u)).toBe(1);
    afterOrdinaryDamage(s, u, 30);
    expect(u.effects.filter((e) => e.kind === "wound")).toHaveLength(1);
    expect(u.hp).toBe(70);
  });
  it("records construct joint impairment rather than a living wound", () => {
    const { s, u } = fixture();
    u.kind = "construct";
    afterOrdinaryDamage(s, u, 25);
    expect(u.effects[0].kind).toBe("movement-impairment");
    expect(attackPenalty(s, u)).toBe(0);
    expect(movementPenalty(s, u)).toBe(1);
    u.effects.push({
      kind: "movement-repair",
      value: 1,
      source: u.effects[0].source,
      until: u.effects[0].until,
    });
    expect(movementPenalty(s, u)).toBe(0);
  });
  it("never wounds corpses, creates damage from invalid input or changes allegiance", () => {
    const { s, u } = fixture();
    for (const hit of [0, -4, NaN, Infinity]) afterOrdinaryDamage(s, u, hit);
    expect(u.effects).toEqual([]);
    u.alive = false;
    u.hp = 0;
    afterOrdinaryDamage(s, u, 50);
    expect(u.effects).toEqual([]);
    expect(u.owner).toBe("p1");
  });
  it("renewed actual injury invalidates stabilization while preserving other effects", () => {
    const { s, u } = fixture();
    afterOrdinaryDamage(s, u, 25);
    u.effects.push({
      kind: "stabilized-wound",
      value: 1,
      source: u.effects[0].source,
      until: s.revision + 4,
    });
    u.effects.push({
      kind: "ward",
      value: 3,
      source: "other",
      until: s.revision + 4,
    });
    afterOrdinaryDamage(s, u, 1);
    expect(u.effects.some((e) => e.kind === "stabilized-wound")).toBe(false);
    expect(u.effects.some((e) => e.kind === "ward")).toBe(true);
  });
  it("clears encounter physical penalties without healing or erasing unrelated spells", () => {
    const { s, u } = fixture();
    afterOrdinaryDamage(s, u, 25);
    u.effects.push({
      kind: "ward",
      value: 3,
      source: "other",
      until: s.revision + 4,
    });
    endEncounterConditions(s);
    expect(attackPenalty(s, u)).toBe(0);
    expect(movementPenalty(s, u)).toBe(0);
    expect(u.hp).toBe(69);
    expect(u.effects.some((e) => e.kind === "ward")).toBe(true);
  });
});

it("stabilization prevents deterioration without removing impairment; deterioration is never fatal", () => {
  const { s, u } = fixture();
  afterOrdinaryDamage(s, u, 25);
  u.effects.push({
    kind: "stabilized-wound",
    value: 1,
    source: u.effects[0].source,
    until: s.revision + 4,
  });
  expect(attackPenalty(s, u)).toBe(1);
  expect(movementPenalty(s, u)).toBe(1);
  endEncounterConditions(s);
  expect(u.hp).toBe(70);
  afterOrdinaryDamage(s, u, 25);
  u.hp = 1;
  endEncounterConditions(s);
  expect(u.hp).toBe(1);
  expect(u.alive).toBe(true);
  endEncounterConditions(s);
  expect(u.hp).toBe(1);
});
it("an explicit actual-hit interruption cancels treatment even when no ordinary wound is generated", async () => {
  const { interruptTreatments } = await import("../src/simulation/conditions");
  const { s, u } = fixture();
  const healer = s.units["p2:company:0"];
  u.effects = [
    { kind: "wound", value: 1, until: 1000000, source: "injury:w" },
    { kind: "stabilized-wound", value: 1, until: 1000000, source: "injury:w" },
    { kind: "treatment-link", value: 1, until: 1000000, source: healer.id },
  ];
  interruptTreatments(s, healer);
  expect(u.effects.map((e) => e.kind)).toEqual(["wound"]);
  expect(healer.effects).toEqual([]);
  expect(u.hp).toBe(70);
});
it("physical wounds persist through extended tactical phases until explicit encounter cleanup", () => {
  const { s, u } = fixture();
  afterOrdinaryDamage(s, u, 25);
  s.revision += 10;
  expect(attackPenalty(s, u)).toBe(1);
  expect(movementPenalty(s, u)).toBe(1);
  endEncounterConditions(s);
  expect(u.hp).toBe(69);
  expect(attackPenalty(s, u)).toBe(0);
});
