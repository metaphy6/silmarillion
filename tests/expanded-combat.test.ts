import { expect, it } from "vitest";
import { createMatch, submit, resolveWeek } from "../src/simulation/engine";
import {
  encodeCheckpoint,
  decodeCheckpoint,
} from "../src/persistence/checkpoints";
import type { Match, Action } from "../src/simulation/types";
import { path, validate } from "../src/simulation/engine";
import { parseMatch } from "../src/simulation/schema";
function act(s: Match, seat: string, action: Action) {
  const r = submit(s, {
    id: `${seat}:${s.nextSeq[seat]}`,
    seat,
    seq: s.nextSeq[seat],
    turn: s.turn,
    revision: s.revision,
    action,
  });
  expect(r.ok, r.reason).toBe(true);
  return r.state;
}
function livingProfile(id: string) {
  const s = createMatch([id, "human_gondor"], 81);
  s.map.terrain.fill("meadow");s.waterChannels={};
  s.seaHazards = {};
  s.shallowWater = {};
  s.infrastructureSites = {};
  s.preySites = {};
  s.vegetation = {};
  s.oldTrails = {};
  const p = s.players.p1,
    u = s.units["p1:company:0"];
  s.units[p.hero.id] = {
    ...structuredClone(u),
    id: p.hero.id,
    kind: "hero",
    x: 4,
    y: 4,
    inventory: [],
    effects: [],
  };
  p.hero.status = "living";
  p.hero.readiness = 6;
  return s;
}
it("a response-phase injury interrupts a declared move before any formation advances", () => {
  let s = livingProfile("nessa");
  const h = s.units[s.players.p1.hero.id];
  Object.assign(s.units["p1:company:0"], { x: 5, y: 4 });
  Object.assign(s.units["p2:company:0"], { x: 4, y: 3, attack: 10 });
  s = resolveWeek(
    act(s, "p1", {
      kind: "movement-power",
      members: [{ unit: "p1:company:0", to: { x: 6, y: 4 } }],
    }),
  );
  expect(s.combatPhase).toBe(1);
  s = resolveWeek(
    act(s, "p2", { kind: "attack", unit: "p2:company:0", target: h.id }),
  );
  expect(s.units["p1:company:0"].x).toBe(5);
  expect(s.movementPlans).toEqual({});
  expect(s.players.p1.operations).toBe(2);
});
it("declared Nessa movement pays normal operations, exposes preparation and advances the same company", () => {
  let s = livingProfile("nessa");
  Object.assign(s.units["p1:company:0"], { x: 5, y: 4 });
  s = resolveWeek(
    act(s, "p1", {
      kind: "movement-power",
      members: [{ unit: "p1:company:0", to: { x: 6, y: 4 } }],
    }),
  );
  expect(s.units["p1:company:0"].x).toBe(5);
  expect(s.players.p1.operations).toBe(2);
  expect(s.players.p1.commitment).toBe(0);
  expect(() => parseMatch(s)).not.toThrow();
  s = resolveWeek(s);
  expect(s.units["p1:company:0"].x).toBe(6);
  expect(s.players.p1.operations).toBe(2);
  expect(s.movementPlans).toEqual({});
});
it("a paid causeway creates a real traversable route and destruction removes that route", () => {
  let s = livingProfile("ent_grove");
  s.players.p1.sources.push("timber");
  s.map.terrain[4 * s.map.width + 4] = "woodland";
  // A complete river blocks any alternative path.
  for (let y = 0; y < s.map.height; y++)
    s.map.terrain[y * s.map.width + 5] = "water";
  const base = s.facilities["p1:core"];
  s.facilities.a = { ...base, id: "a", kind: "crossing-anchor", x: 4, y: 4 };
  s.facilities.b = { ...base, id: "b", kind: "crossing-anchor", x: 6, y: 4 };
  const worker = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  Object.assign(worker, { x: 4, y: 4 });
  const company = s.units["p1:company:0"];
  Object.assign(company, { x: 4, y: 4 });
  expect(path(s, company, { x: 6, y: 4 }, false, company)).toBeNull();
  s = resolveWeek(
    act(s, "p1", { kind: "crossing", from: "a", to: "b", crew: worker.id }),
  );
  const c = Object.values(s.crossings)[0];
  expect(c.phase).toBe("ready");
  expect(
    path(s, s.units[company.id], { x: 6, y: 4 }, false, s.units[company.id]),
  ).toHaveLength(3);
  expect(() => decodeCheckpoint(encodeCheckpoint(s))).not.toThrow();
  const enemy = s.units["p2:company:0"];
  Object.assign(enemy, { x: 6, y: 5, attack: 100 });
  s = resolveWeek(
    act(s, "p2", { kind: "break-crossing", unit: enemy.id, crossing: c.id }),
  );
  expect(s.crossings[c.id].phase).toBe("destroyed");
  expect(
    path(s, s.units[company.id], { x: 6, y: 4 }, false, s.units[company.id]),
  ).toBeNull();
});
it("empty observed terrain can be illuminated without inventing a target identity", () => {
  let s = livingProfile("varda");
  s = resolveWeek(
    act(s, "p1", {
      kind: "cast",
      power: "field",
      target: "terrain",
      x: 4,
      y: 2,
    }),
  );
  expect(
    Object.values(s.zones).some(
      (z) => z.kind === "light" && z.x === 4 && z.y === 2,
    ),
  ).toBe(true);
  expect(() => parseMatch(s)).not.toThrow();
});
it("paid rest consumes one operation and restores existing fatigue without healing health", () => {
  let s = livingProfile("istari_ember");
  const u = s.units["p1:company:0"];
  Object.assign(u, { x: 4, y: 4, hp: u.hp - 1 });
  const hp = u.hp;
  u.effects.push({
    kind: "fatigue",
    value: 4,
    until: 1000000,
    source: "ordinary-travel",
  });
  s.facilities.refuge = {
    ...s.facilities["p1:core"],
    id: "refuge",
    kind: "refuge",
  };
  const pending = act(s, "p1", {
    kind: "rest",
    unit: u.id,
    facility: "refuge",
  });
  const duplicate = {
    id: "dup",
    seat: "p1",
    seq: pending.nextSeq.p1,
    turn: pending.turn,
    revision: pending.revision,
    action: { kind: "rest" as const, unit: u.id, facility: "refuge" },
  };
  expect(validate(pending, duplicate)).toContain("occupied");
  s = resolveWeek(pending);
  expect(s.units[u.id].effects.find((e) => e.kind === "fatigue")?.value).toBe(
    1,
  );
  expect(s.units[u.id].hp).toBe(hp);
  expect(s.facilities.refuge.rest).toBeUndefined();
  expect(() => decodeCheckpoint(encodeCheckpoint(s))).not.toThrow();
});
it("ordinary combat opens a response phase without spending an unused hero commitment", () => {
  let s = createMatch(["human_rohan", "human_gondor"], 91);
  const a = s.units["p1:company:0"],
    t = s.units["p2:company:0"];
  a.x = 8;
  a.y = 8;
  t.x = 9;
  t.y = 8;
  a.attack = 20;
  t.maxHp = 100;
  t.hp = 100;
  s = resolveWeek(act(s, "p1", { kind: "attack", unit: a.id, target: t.id }));
  expect(s.turn).toBe(1);
  expect(s.combatPhase).toBe(1);
  expect(s.players.p1.commitment).toBe(1);
  s = resolveWeek(s);
  expect(s.combatPhase).toBe(2);
  s = resolveWeek(s);
  expect(s.turn).toBe(2);
});
it("Radagast's existing beast takes the actual attack without injury or cast interruption transferring to him", () => {
  let s = createMatch(["istari_radagast", "human_rohan"], 33);
  const p = s.players.p1,
    base = s.units["p1:company:0"],
    attacker = s.units["p2:company:0"];
  const h = {
    ...structuredClone(base),
    id: p.hero.id,
    kind: "hero" as const,
    name: "Radagast",
    x: 8,
    y: 8,
    inventory: [],
    effects: [],
  };
  s.units[h.id] = h;
  p.hero.status = "living";
  base.x = 9;
  base.y = 8;
  base.kind = "beast";
  attacker.x = 8;
  attacker.y = 9;
  s = resolveWeek(
    act(s, "p2", { kind: "attack", unit: attacker.id, target: h.id }),
  );
  expect(s.units[h.id].hp).toBe(h.hp);
  expect(s.units[base.id].hp).toBeLessThan(base.hp);
  expect(
    s.units[h.id].effects.some((e) => e.kind === "companions-vigil-used"),
  ).toBe(true);
});
it("a convoy carrier killed during a tactical response drops cargo before state serialization", () => {
  let s = createMatch(["human_rohan", "human_gondor"], 8);
  const u = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!,
    f = s.facilities["p1:core"];
  u.x = f.x;
  u.y = f.y;
  s.facilities.dest = { ...f, id: "dest", x: f.x + 4 };
  s = resolveWeek(
    act(s, "p1", {
      kind: "convoy",
      carrier: u.id,
      origin: f.id,
      destination: "dest",
      cargo: { P: 0, M: 10, K: 0, E: 0 },
    }),
  );
  const enemy = s.units["p2:company:0"];
  enemy.x = u.x + 1;
  enemy.y = u.y;
  enemy.attack = 999;
  s = resolveWeek(
    act(s, "p2", { kind: "attack", unit: enemy.id, target: u.id }),
  );
  expect(Object.values(s.convoys)[0].phase).toBe("lost");
  // A host checkpoint is committed only after the encounter's response phases.
  s = resolveWeek(resolveWeek(s));
  expect(decodeCheckpoint(encodeCheckpoint(s)).state.convoys).toEqual(
    s.convoys,
  );
});
it("a prepared area losing caster range interrupts safely without placing a zone", () => {
  const s = createMatch(["spider_brood", "human_rohan"], 6),
    p = s.players.p1,
    u = s.units["p1:company:0"];
  s.units[p.hero.id] = {
    ...structuredClone(u),
    id: p.hero.id,
    kind: "hero",
    x: 4,
    y: 4,
    effects: [],
    inventory: [],
  };
  p.hero.status = "living";
  u.x = 20;
  u.y = 4;
  s.warnings.push({
    id: "warning:range",
    seat: "p1",
    power: "field",
    target: u.id,
    x: 20,
    y: 4,
    due: 0,
  });
  const next = resolveWeek(s);
  expect(Object.keys(next.zones)).toHaveLength(0);
  expect(
    next.events.some((e) => e.text.includes("Prepared power interrupted")),
  ).toBe(true);
});
