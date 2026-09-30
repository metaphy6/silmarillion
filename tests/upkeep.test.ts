import { it, expect } from "vitest";
import { createMatch, resolveWeek } from "../src/simulation/engine";
it("a first missed creature upkeep stalls an established great-creature queue in that same week", () => {
  let s = createMatch(["melkor_dark_architect", "human_rohan"], 5);
  s.players.p1.stock = { P: 0, M: 0, K: 0, E: 0 };
  s.facilities["p1:core"].hp = 0;
  const u = s.units["remnant:1"];
  u.owner = "p1";
  u.active = true;
  u.supplied = true;
  s.facilities.vault = {
    ...s.facilities["p1:training"],
    id: "vault",
    name: "Vault",
    kind: "vault",
    job: {
      id: "job:drake",
      recipe: "drake",
      remaining: 2,
      started: 0,
      cost: { P: 40, M: 35, K: 10, E: 20 },
      supply: 3,
      great: 1,
      binding: 0,
    },
  };
  s = resolveWeek(s);
  expect(s.units[u.id].supplied).toBe(false);
  expect(s.facilities.vault.job?.remaining).toBe(2);
});
