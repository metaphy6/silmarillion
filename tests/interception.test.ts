import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { radagastInterceptor } from "../src/simulation/interception";
import type { Unit } from "../src/simulation/types";
function setup() {
  const s = createMatch(["istari_radagast", "human_rohan"], 123);
  const base = s.units["p1:company:0"];
  const h: Unit = {
    ...structuredClone(base),
    id: "p1:hero",
    name: "Radagast",
    kind: "hero",
    inventory: [],
    effects: [],
    x: 8,
    y: 8,
  };
  s.units[h.id] = h;
  s.players.p1.hero.status = "living";
  const beast: Unit = {
    ...structuredClone(base),
    id: "beast:b",
    kind: "beast",
    x: 9,
    y: 8,
    inventory: [],
    effects: [],
  };
  s.units[beast.id] = beast;
  return { s, h, beast };
}
it("interposes an existing adjacent beast once per weekly encounter without movement or creation", () => {
  const { s, h, beast } = setup(),
    before = Object.keys(s.units),
    pos = { x: beast.x, y: beast.y },
    stocks = structuredClone(s.players.p1.stock);
  expect(radagastInterceptor(s, h)).toBe(beast);
  expect(radagastInterceptor(s, h)).toBeUndefined();
  expect(Object.keys(s.units)).toEqual(before);
  expect({ x: beast.x, y: beast.y }).toEqual(pos);
  expect(s.players.p1.stock).toEqual(stocks);
  s.turn++;
  expect(radagastInterceptor(s, h)).toBe(beast);
});
it("does not consume the passive when no eligible beast is adjacent", () => {
  const { s, h, beast } = setup();
  beast.x = 10;
  expect(radagastInterceptor(s, h)).toBeUndefined();
  expect(h.effects).toHaveLength(0);
  beast.x = 9;
  expect(radagastInterceptor(s, h)).toBe(beast);
});
it("uses stable ID priority without borrowing an allied or exclusive creature", () => {
  const { s, h, beast } = setup();
  const first = { ...structuredClone(beast), id: "beast:a" };
  s.units[first.id] = first;
  const allied = { ...structuredClone(beast), id: "beast:0", owner: "p2" };
  s.units[allied.id] = allied;
  s.players.p1.relations.p2 = "alliance";
  expect(radagastInterceptor(s, h)).toBe(first);
  const next = setup();
  next.beast.kind = "dragon";
  expect(radagastInterceptor(next.s, next.h)).toBeUndefined();
});
it("requires conscious active Radagast and an active living beast", () => {
  for (const state of ["captive", "dead"] as const) {
    const { s, h } = setup();
    s.players.p1.hero.status = state;
    expect(radagastInterceptor(s, h)).toBeUndefined();
  }
  for (const field of ["alive", "active"] as const) {
    const { s, h, beast } = setup();
    beast[field] = false;
    expect(radagastInterceptor(s, h)).toBeUndefined();
  }
  const { s, h } = setup();
  h.hp = 0;
  expect(radagastInterceptor(s, h)).toBeUndefined();
});
it("does not trigger for another target or a mismatched hero identity", () => {
  const { s, h, beast } = setup();
  expect(radagastInterceptor(s, beast)).toBeUndefined();
  s.players.p1.hero.id = "other";
  expect(radagastInterceptor(s, h)).toBeUndefined();
});

it("incapacitated and stunned beasts cannot interpose until the condition expires", () => {
  for (const kind of ["incapacitated", "stunned"]) {
    const { s, h, beast } = setup();
    beast.effects.push({
      kind,
      value: 1,
      source: "injury",
      until: s.revision + 1,
    });
    expect(radagastInterceptor(s, h)).toBeUndefined();
    expect(h.effects).toHaveLength(0);
    s.revision++;
    expect(radagastInterceptor(s, h)).toBe(beast);
  }
});
