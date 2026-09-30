import { expect, it } from "vitest";
import {
  createMatch,
  resolveWeek,
  submit,
  preview,
} from "../src/simulation/engine";
import {
  decodeCheckpoint,
  encodeCheckpoint,
} from "../src/persistence/checkpoints";
import { factionProduction } from "../src/content/production";
import type { Action, Match } from "../src/simulation/types";

function fixture(profile = "elf_feanor") {
  const s = createMatch([profile, "human_rohan"], 31);
  const p = s.players.p1,
    core = s.facilities["p1:core"];
  p.sources.push(...factionProduction(profile).equipment.access, "metal");
  p.stock = { P: 999, M: 999, K: 999, E: 999 };
  s.facilities.work = { ...core, id: "work", kind: "workshop" };
  s.items.gear = {
    id: "gear",
    name: "Existing crafted tool",
    owner: "p1",
    bearer: null,
    bonus: 2,
    attackBonus: 1,
    durability: 20,
    maxDurability: 100,
    crafted: true,
    materials: ["metal"],
    x: core.x,
    y: core.y,
  };
  s.units[p.hero.id] = {
    ...s.units["p1:company:0"],
    id: p.hero.id,
    kind: "hero",
    x: core.x,
    y: core.y,
    inventory: [],
    effects: [],
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  return s;
}
function order(s: Match, a: Action) {
  return submit(s, {
    id: `order:${s.nextSeq.p1}`,
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action: a,
  });
}
it("a paid ordinary repair occupies its workshop, takes two weeks, and preserves item identity", () => {
  let s = fixture();
  const r = order(s, {
    kind: "repair",
    facility: "work",
    target: "gear",
    method: "ordinary",
  });
  expect(r.ok).toBe(true);
  expect(
    order(r.state, { kind: "produce", facility: "work", recipe: "equipment" })
      .reason,
  ).toMatch(/queue/i);
  s = resolveWeek(r.state);
  expect(s.items.gear.durability).toBe(20);
  expect(s.facilities.work.repair?.remaining).toBe(1);
  s = decodeCheckpoint(encodeCheckpoint(s)).state;
  s = resolveWeek(s);
  expect(s.items.gear.durability).toBe(45);
  expect(Object.keys(s.items)).toEqual(["gear"]);
});
it("Feanor's paid setting repair consumes commitment and exact10M5K for one week, capped at max", () => {
  const s = fixture();
  s.items.gear.durability = 90;
  const r = order(s, {
    kind: "repair",
    facility: "work",
    target: "gear",
    method: "power",
  });
  expect(r.ok).toBe(true);
  expect(preview(r.state, "p1").players.p1.stock).toEqual({
    ...s.players.p1.stock,
    M: s.players.p1.stock.M - 10,
    K: s.players.p1.stock.K - 5,
  });
  expect(preview(r.state, "p1").players.p1.commitment).toBe(0);
  const next = resolveWeek(r.state);
  expect(next.items.gear.durability).toBe(100);
  expect(next.players.p1.hero.readiness).toBe(3);
  // The exact paid cost is visible in the reserved preview and unchanged by completion.
  expect(next.events.some((e) => e.text.includes("repair"))).toBe(true);
});
it("repair compatibility follows the target, not the repairing faction's equipment theme", () => {
  const s = fixture("human_gondor");
  s.players.p1.sources = ["metal"];
  const a: Action = {
    kind: "repair",
    facility: "work",
    target: "gear",
    method: "ordinary",
  };
  expect(order(s, a).ok).toBe(true);
  s.items.gear.materials = ["glass"];
  expect(order(s, a).reason).toMatch(/target material/);
});
it("Aule substitutes his worksite but must retain a real repair crew", () => {
  let s = fixture("aule");
  const worker =
    s.units["p1:worker"] ??
    Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  worker.x = s.facilities["p1:core"].x;
  worker.y = s.facilities["p1:core"].y;
  const a: Action = {
    kind: "repair",
    facility: "p1:core",
    target: "gear",
    method: "power",
  };
  expect(order(s, a).ok).toBe(true);
  const reserved = preview(order(s, a).state, "p1");
  worker.x += 5;
  expect(order(s, a).reason).toMatch(/crew/);
  // Simulate the already-started worksite losing its crew before progress.
  s = reserved;
  const w = s.units[worker.id];
  w.x += 5;
  s = resolveWeek(s);
  expect(s.items.gear.durability).toBe(20);
  expect(s.facilities["p1:core"].repair).toBeTruthy();
});
it("checkpoint rejects forged repair costs and simultaneous production reservations", () => {
  let s = fixture();
  s = resolveWeek(
    order(s, {
      kind: "repair",
      facility: "work",
      target: "gear",
      method: "ordinary",
    }).state,
  );
  s.facilities.work.repair!.cost.M = 0;
  expect(() => encodeCheckpoint(s)).toThrow(/repair/);
});
it("repair refuses enemy gear, missing compatible sources, busy queue and absent hero", () => {
  const s = fixture();
  const a: Action = {
    kind: "repair",
    facility: "work",
    target: "gear",
    method: "power",
  };
  s.items.gear.owner = "p2";
  expect(order(s, a).ok).toBe(false);
  s.items.gear.owner = "p1";
  s.players.p1.sources = [];
  expect(order(s, a).reason).toMatch(/source/i);
  s.players.p1.sources = fixture().players.p1.sources;
  s.players.p1.hero.status = "captive";
  expect(order(s, a).reason).toMatch(/Living/);
});
it("a queued repair pauses when its target leaves, and destruction never recreates a target", () => {
  let s = fixture();
  s = resolveWeek(
    order(s, {
      kind: "repair",
      facility: "work",
      target: "gear",
      method: "ordinary",
    }).state,
  );
  s.items.gear.x += 6;
  s = resolveWeek(s);
  expect(s.items.gear.durability).toBe(20);
  expect(s.facilities.work.repair?.remaining).toBe(1);
  delete s.items.gear;
  s = resolveWeek(s);
  expect(s.facilities.work.repair).toBeUndefined();
  expect(s.items.gear).toBeUndefined();
});
it("Forge overhaul advances one older paid repair once, excludes new production", () => {
  let s = fixture("istari_forge");
  s.facilities.work.kind = "service-depot";
  s = resolveWeek(
    order(s, {
      kind: "repair",
      facility: "work",
      target: "gear",
      method: "ordinary",
    }).state,
  );
  const a: Action = {
    kind: "repair",
    facility: "work",
    target: "gear",
    method: "power",
  };
  const r = order(s, a);
  expect(r.ok).toBe(true);
  expect(order(r.state, a).ok).toBe(false);
  const reserved = preview(r.state, "p1");
  expect(reserved.items.gear.durability).toBe(45);
  expect(reserved.facilities.work.repair).toBeUndefined();
  expect(reserved.players.p1.stock.M).toBe(s.players.p1.stock.M - 15);
  expect(reserved.players.p1.stock.K).toBe(s.players.p1.stock.K - 5);
  expect(reserved.players.p1.hero.readiness).toBe(
    s.players.p1.hero.readiness - 3,
  );
  expect(reserved.players.p1.commitment).toBe(0);
  expect(Object.keys(reserved.items)).toEqual(["gear"]);
  s = resolveWeek(r.state);
  expect(s.items.gear.durability).toBe(45);
});
it("Gondor depot refit restores existing fortification only, not a destroyed structure", () => {
  const s = fixture("human_gondor");
  s.facilities.work.kind = "depot";
  s.facilities.gate = {
    ...s.facilities.work,
    id: "gate",
    kind: "barricade",
    hp: 40,
    maxHp: 100,
  };
  const a: Action = {
    kind: "repair",
    facility: "work",
    target: "gate",
    method: "power",
  };
  expect(order(s, a).ok).toBe(true);
  expect(resolveWeek(order(s, a).state).facilities.gate.hp).toBe(65);
  s.facilities.gate.hp = 0;
  expect(order(s, a).ok).toBe(false);
});

it("Forge cannot accelerate a repair in its starting week", () => {
  const s = fixture("istari_forge");
  s.facilities.work.kind = "service-depot";
  const r = order(s, {
    kind: "repair",
    facility: "work",
    target: "gear",
    method: "ordinary",
  });
  expect(r.ok).toBe(true);
  expect(
    order(r.state, {
      kind: "repair",
      facility: "work",
      target: "gear",
      method: "power",
    }).reason,
  ).toMatch(/older/i);
});
it("Feanor requires the adopted workshop rather than a generic depot", () => {
  const s = fixture();
  s.facilities.work.kind = "depot";
  expect(
    order(s, {
      kind: "repair",
      facility: "work",
      target: "gear",
      method: "power",
    }).reason,
  ).toMatch(/workshop/i);
  s.facilities.work.kind = "service-depot";
  expect(
    order(s, {
      kind: "repair",
      facility: "work",
      target: "gear",
      method: "power",
    }).reason,
  ).toMatch(/workshop/i);
});
it("Aule substitutes the workshop without accelerating the ordinary two-week recipe", () => {
  let s = fixture("aule");
  const core = s.facilities["p1:core"];
  const worker = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  worker.x = core.x;
  worker.y = core.y;
  const result = order(s, {
    kind: "repair",
    facility: core.id,
    target: "gear",
    method: "power",
  });
  expect(result.ok).toBe(true);
  const reserved = preview(result.state, "p1");
  expect(reserved.facilities[core.id].repair?.remaining).toBe(2);
  s = resolveWeek(result.state);
  expect(s.items.gear.durability).toBe(20);
  expect(s.facilities[core.id].repair?.remaining).toBe(1);
  s = decodeCheckpoint(encodeCheckpoint(s)).state;
  s = resolveWeek(s);
  expect(s.items.gear.durability).toBe(45);
});
