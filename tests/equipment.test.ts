import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  wearEquipment,
  restoreItemDurability,
} from "../src/simulation/equipment";
import type { Unit } from "../src/simulation/types";
function setup(profile = "human_gondor") {
  const s = createMatch([profile, "human_rohan"], 123);
  const u = s.units["p1:company:0"];
  const h: Unit = {
    ...structuredClone(u),
    id: "p1:hero",
    kind: "hero",
    name: "Hero",
    inventory: [],
    effects: [],
    x: u.x,
    y: u.y,
  };
  s.units[h.id] = h;
  s.players.p1.hero.status = "living";
  s.players.p1.hero.id = h.id;
  s.items.gear = {
    id: "gear",
    name: "gear",
    owner: "p1",
    bearer: u.id,
    bonus: 3,
    attackBonus: 2,
    durability: 100,
    maxDurability: 100,
    crafted: true,
    materials: ["metal"],
    x: u.x,
    y: u.y,
  };
  u.inventory = ["gear"];
  u.armor += 3;
  u.attack += 2;
  return { s, u, h };
}
it("break removes bonuses once and repairing through zero restores once without stocks", () => {
  const { s, u } = setup();
  const a = u.attack,
    b = u.armor,
    stock = structuredClone(s.players.p1.stock);
  s.items.gear.durability = 1;
  wearEquipment(s, u, "attack");
  expect(s.items.gear.durability).toBe(0);
  expect(u.attack).toBe(a - 2);
  expect(u.armor).toBe(b - 3);
  wearEquipment(s, u, "attack");
  expect(u.attack).toBe(a - 2);
  restoreItemDurability(s, "gear", 10);
  restoreItemDurability(s, "gear", 10);
  expect(u.attack).toBe(a);
  expect(u.armor).toBe(b);
  expect(s.items.gear.durability).toBe(20);
  expect(s.players.p1.stock).toEqual(stock);
});
it("Feanor reduces only the first own crafted hero-carried item event each week", () => {
  const { s, u, h } = setup("elf_feanor");
  s.items.gear.bearer = h.id;
  h.inventory = ["gear"];
  u.inventory = [];
  wearEquipment(s, h, "attack");
  expect(s.items.gear.durability).toBe(97);
  wearEquipment(s, h, "attack");
  expect(s.items.gear.durability).toBe(93);
  s.turn++;
  wearEquipment(s, h, "attack");
  expect(s.items.gear.durability).toBe(90);
  s.items.gear.crafted = false;
  s.turn++;
  wearEquipment(s, h, "attack");
  expect(s.items.gear.durability).toBe(86);
});
it("Nogrod tools wear only on breach, first adjacent engineer use reduced once per week", () => {
  const { s, u, h } = setup("dwarf_nogrod");
  s.items.gear.name = "breach tools";
  u.name = "Engineers";
  wearEquipment(s, u, "attack");
  expect(s.items.gear.durability).toBe(100);
  wearEquipment(s, u, "breach");
  expect(s.items.gear.durability).toBe(97);
  wearEquipment(s, u, "breach");
  expect(s.items.gear.durability).toBe(93);
  s.turn++;
  h.x += 10;
  wearEquipment(s, u, "breach");
  expect(s.items.gear.durability).toBe(89);
});
it("Belegost protects one selected nearby company through the encounter, not others", () => {
  const { s, u, h } = setup("dwarf_belegost");
  wearEquipment(s, u, "armor");
  wearEquipment(s, u, "armor");
  expect(s.items.gear.durability).toBe(92);
  const other = {
    ...structuredClone(u),
    id: "other",
    inventory: ["othergear"],
  };
  s.units.other = other;
  s.items.othergear = {
    ...s.items.gear,
    id: "othergear",
    bearer: "other",
    durability: 100,
  };
  wearEquipment(s, other, "armor");
  expect(s.items.othergear.durability).toBe(95);
  h.alive = false;
  wearEquipment(s, u, "armor");
  expect(s.items.gear.durability).toBe(87);
});
it("invalid repair amounts cannot create durability or modify absent items", () => {
  const { s } = setup();
  for (const n of [-1, NaN, Infinity, 1.5])
    expect(() => restoreItemDurability(s, "gear", n)).toThrow();
  expect(() => restoreItemDurability(s, "missing", 2)).toThrow();
  restoreItemDurability(s, "gear", 200);
  expect(s.items.gear.durability).toBe(100);
});
it("duplicate inventory IDs do not multiply wear and uncrafted/foreign gear earns no passive", () => {
  const { s, u, h } = setup("elf_feanor");
  u.inventory = [];
  h.inventory = ["gear", "gear"];
  s.items.gear.bearer = h.id;
  s.items.gear.owner = "p2";
  wearEquipment(s, h, "attack");
  expect(s.items.gear.durability).toBe(96);
  expect(h.effects.some((e) => e.kind === "wear-feanor")).toBe(false);
});
it("repairing dropped broken equipment changes no former bearer statistics", () => {
  const { s, u } = setup();
  s.items.gear.durability = 1;
  wearEquipment(s, u, "attack");
  const before = { attack: u.attack, armor: u.armor };
  s.items.gear.bearer = null;
  u.inventory = [];
  restoreItemDurability(s, "gear", 100);
  expect({ attack: u.attack, armor: u.armor }).toEqual(before);
});
