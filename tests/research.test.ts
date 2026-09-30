import { it, expect } from "vitest";
import { createMatch, submit, resolveWeek } from "../src/simulation/engine";
it("completed provisional combat research affects ordinary companies and refuses a duplicate", () => {
  let s = createMatch(["human_gondor", "human_rohan"], 71);
  const before = s.units["p1:company:0"].attack;
  s.facilities.lab = {
    ...s.facilities["p1:core"],
    id: "lab",
    kind: "research",
    name: "Test research",
    job: {
      id: "job:test",
      recipe: "technique",
      remaining: 1,
      started: 0,
      cost: { P: 0, M: 20, K: 30, E: 10 },
      supply: 0,
      great: 0,
      binding: 0,
    },
  };
  s = resolveWeek(s);
  expect(s.units["p1:company:0"].attack).toBe(before + 2);
  const result = submit(s, {
    id: "duplicate",
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action: { kind: "produce", facility: "lab", recipe: "technique" },
  });
  expect(result.ok).toBe(false);
  expect(result.reason).toMatch(/Already researched/);
});
it("the same research cannot reserve two concurrent queues", () => {
  let s = createMatch(["human_gondor", "human_rohan"], 72);
  s.players.p1.stock = { P: 999, M: 999, K: 999, E: 999 };
  for (const id of ["lab1", "lab2"])
    s.facilities[id] = {
      ...s.facilities["p1:core"],
      id,
      kind: "research",
      name: id,
    };
  const order = (facility: string) => ({
    id: facility,
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action: { kind: "produce" as const, facility, recipe: "technique" },
  });
  s = submit(s, order("lab1")).state;
  expect(submit(s, order("lab2")).ok).toBe(false);
});
