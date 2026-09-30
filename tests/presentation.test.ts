import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  captureView,
  transitionCues,
  MAX_CUES,
  walkPosition,
} from "../src/render/presentation";
it("initial, repeated and backwards snapshots do not replay action", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 8),
    v = captureView(s, "p1");
  expect(transitionCues(undefined, v, s)).toEqual([]);
  expect(transitionCues(v, v, s)).toEqual([]);
  s.revision--;
  expect(transitionCues(v, captureView(s, "p1"), s)).toEqual([]);
});
it("retains immutable visible values and animates only an actual identity-bearing own event", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 8),
    u = s.units["p1:company:0"];
  const from = { x: u.x, y: u.y },
    v = captureView(s, "p1");
  s.revision++;
  u.x++;
  s.events.push({
    id: s.nextId++,
    turn: s.turn,
    audience: ["p1"],
    text: "Actual movement",
    motion: { unit: u.id, route: [from, { x: u.x, y: u.y }] },
  });
  const cues = transitionCues(v, captureView(s, "p1"), s);
  expect(cues.find((c) => c.kind === "travel")?.route).toEqual([
    from,
    { x: u.x, y: u.y },
  ]);
  expect(v.entities[u.id].x).toBe(from.x);
  s.events.pop();
  expect(
    transitionCues(v, captureView(s, "p1"), s).some((c) => c.kind === "travel"),
  ).toBe(false);
});
it("hidden enemy damage, arrivals and vanished observations create no effects", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 8),
    v = captureView(s, "p1");
  const u = s.units["p2:company:0"];
  u.x = 31;
  u.y = 31;
  u.hp -= 10;
  s.revision++;
  expect(
    transitionCues(v, captureView(s, "p1"), s).filter((c) => c.entity === u.id),
  ).toEqual([]);
  const own = s.units["p1:company:0"];
  delete s.units[own.id];
  s.revision++;
  expect(
    transitionCues(v, captureView(s, "p1"), s).filter(
      (c) => c.entity === own.id,
    ),
  ).toEqual([]);
});
it("observed damage, a real birth, work change and public objective change get bounded cues", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 8),
    f = s.facilities["p1:core"];
  f.job = {
    id: "job",
    recipe: "component",
    remaining: 1,
    started: 1,
    supply: 0,
    great: 0,
    binding: 0,
    cost: { P: 0, M: 10, K: 5, E: 0 },
  };
  const v = captureView(s, "p1");
  s.revision++;
  s.turn++;
  s.units["p1:company:0"].hp -= 7;
  delete f.job;
  s.units.born = { ...structuredClone(s.units["p1:company:0"]), id: "born" };
  s.sites[0].owner = "p1";
  const cues = transitionCues(v, captureView(s, "p1"), s);
  expect(cues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: "impact", amount: 7 }),
      expect.objectContaining({ kind: "arrival", entity: "born" }),
      expect.objectContaining({ kind: "work", entity: f.id }),
      expect.objectContaining({ kind: "capture" }),
    ]),
  );
  for (let i = 0; i < 100; i++)
    s.units["born" + i] = { ...s.units.born, id: "born" + i };
  expect(transitionCues(v, captureView(s, "p1"), s).length).toBeLessThanOrEqual(
    MAX_CUES,
  );
});
it("walking follows each route corner without advancing the world or cutting a diagonal", () => {
  const route = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ];
  expect(walkPosition(route, 0)).toEqual(route[0]);
  expect(walkPosition(route, 0.5)).toEqual(route[1]);
  expect(walkPosition(route, 1)).toEqual(route[2]);
  expect(walkPosition(route, 0.25)).toEqual({ x: 0.5, y: 0 });
});
it("visible enemy buildings never expose their private queue activity", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 8),
    f = s.facilities["p2:core"];
  Object.assign(f, { x: 4, y: 4 });
  f.job = {
    id: "secret",
    recipe: "hero",
    remaining: 1,
    started: 1,
    supply: 0,
    great: 0,
    binding: 0,
    cost: { P: 0, M: 0, K: 0, E: 0 },
  };
  const v = captureView(s, "p1");
  expect(v.entities[f.id]).toBeDefined();
  expect(v.entities[f.id].working).toBe(false);
  expect(v.entities[f.id].remaining).toBe(0);
});

it("anonymous or foreign movement evidence cannot animate an own actor", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 8),
    u = s.units["p1:company:0"],
    from = { x: u.x, y: u.y },
    v = captureView(s, "p1");
  s.revision++;
  u.x++;
  s.movementTraces.t = {
    id: "t",
    owner: "p1",
    route: [from, { x: u.x, y: u.y }],
    turn: s.turn,
    revision: s.revision,
    erased: false,
  };
  s.events.push({
    id: s.nextId++,
    turn: s.turn,
    audience: ["p2"],
    text: "Foreign",
    motion: { unit: u.id, route: [from, { x: u.x, y: u.y }] },
  });
  expect(
    transitionCues(v, captureView(s, "p1"), s).some((c) => c.kind === "travel"),
  ).toBe(false);
});
it("living habitats retain nonhuman working silhouettes rather than tiny human labourers", () => {
  for (const [profile, shape] of [
    ["ent_grove", "tree"],
    ["eagle_eyrie", "bird"],
    ["wolf_pack", "wolf"],
    ["spider_brood", "spider"],
  ] as const) {
    const s = createMatch([profile, "human_gondor"], 8),
      f = s.facilities["p1:core"];
    f.job = {
      id: "job",
      recipe: "component",
      remaining: 1,
      started: 1,
      supply: 0,
      great: 0,
      binding: 0,
      cost: { P: 0, M: 0, K: 0, E: 0 },
    };
    expect(captureView(s, "p1").entities[f.id]).toMatchObject({
      workShape: shape,
      hearth: false,
    });
  }
});
