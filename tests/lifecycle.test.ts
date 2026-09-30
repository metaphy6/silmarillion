import { it, expect } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  kill,
  capacities,
} from "../src/simulation/engine";
import type { Match, Action } from "../src/simulation/types";
const act = (s: Match, action: Action, seat = "p1") =>
  submit(s, {
    id: `${seat}:${s.turn}:${s.nextSeq[seat]}`,
    seq: s.nextSeq[seat],
    seat,
    turn: s.turn,
    revision: s.revision,
    action,
  });
function hero(s: Match) {
  s = resolveWeek(
    act(s, { kind: "produce", facility: "p1:core", recipe: "component" }).state,
  );
  s = act(s, { kind: "produce", facility: "p1:core", recipe: "hero" }).state;
  for (let i = 0; i < 4; i++) s = resolveWeek(s);
  return s;
}
it("death drops equipment once and full recreation retains level, perks and doctrine", () => {
  let s = hero(createMatch(["melkor_worldbreaker", "human_rohan"], 1));
  const h = s.players.p1.hero;
  h.level = 3;
  h.perks = ["guard"];
  s.items.gear = {
    id: "gear",
    name: "fitting",
    owner: "p1",
    bearer: h.id,
    durability: 100,
    maxDurability: 100,
    crafted: true,
    materials: ["metal"],
    bonus: 2,
    x: 4,
    y: 4,
  };
  s.units[h.id].inventory = ["gear"];
  h.equipment = ["gear"];
  kill(s, h.id);
  kill(s, h.id);
  expect(Object.keys(s.items)).toHaveLength(1);
  expect(s.items.gear.bearer).toBe(null);
  expect(s.players.p1.profile).toBe("melkor_worldbreaker");
  s.players.p1.stock = { P: 999, M: 999, K: 999, E: 999 };
  s = hero(s);
  expect(s.players.p1.hero.level).toBe(3);
  expect(s.players.p1.hero.perks).toEqual(["guard"]);
  expect(s.players.p1.hero.equipment).toEqual([]);
  expect(s.units[h.id].inventory).toEqual([]);
});
it("living captivity blocks recreation and surrender opens paid return", () => {
  let s = hero(createMatch(["human_rohan", "human_gondor"], 2));
  s.players.p1.hero.status = "captive";
  s.units["p1:hero"].active = false;
  s.players.p1.component = 1;
  expect(
    act(s, { kind: "produce", facility: "p1:core", recipe: "hero" }).ok,
  ).toBe(false);
  s = resolveWeek(act(s, { kind: "surrender" }).state);
  expect(s.players.p1.hero.status).toBe("dead");
});
it("divine annexation cannot expand productive city/plot caps", () => {
  const s = createMatch(["melkor_worldbreaker", "human_rohan"], 3);
  const f = s.facilities["p2:training"];
  f.hp = 1;
  s.units["p1:company:0"].x = f.x;
  s.units["p1:company:0"].y = f.y;
  expect(
    act(s, { kind: "annex", facility: f.id, unit: "p1:company:0" }).ok,
  ).toBe(false);
});
it("called creatures reserve exact capacity and remain loyal through Melkor death", () => {
  let s = hero(createMatch(["melkor_worldbreaker", "human_rohan"], 4));
  const u = s.units["remnant:0"];
  u.x = 5;
  u.y = 4;
  const before = Object.keys(s.units).length;
  s = resolveWeek(act(s, { kind: "call", unit: u.id }).state);
  expect(s.units[u.id].owner).toBe("p1");
  expect(s.units[u.id].supply).toBe(3);
  expect(Object.keys(s.units)).toHaveLength(before);
  expect(capacities(s, "p1").great).toBe(1);
  kill(s, "p1:hero");
  expect(s.units[u.id].owner).toBe("p1");
  expect(s.units[u.id].active).toBe(true);
});
