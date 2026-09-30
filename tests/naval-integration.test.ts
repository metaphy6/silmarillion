import { expect, it } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  preview,
} from "../src/simulation/engine";
import {
  encodeCheckpoint,
  decodeCheckpoint,
} from "../src/persistence/checkpoints";
import type { Action, Match } from "../src/simulation/types";
function order(s: Match, a: Action) {
  return submit(s, {
    id: `n:${s.nextSeq.p1}`,
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action: a,
  });
}
it("paid hull production reserves existing crew, completes after two weeks and survives checkpoint with actual fleet orders", () => {
  let s = createMatch(["elf_falmari", "human_rohan"], 71);
  const p = s.players.p1,
    core = s.facilities["p1:core"];
  p.stock = { P: 500, M: 500, K: 500, E: 500 };
  p.sources.push("timber", "shore");
  const harbor = {
    ...structuredClone(core),
    id: "harbor",
    kind: "harbor",
    x: 4,
    y: 4,
  };
  s.facilities.harbor = harbor;
  for (let x = 4; x <= 7; x++) s.map.terrain[5 * s.map.width + x] = "water";
  const worker = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  worker.x = 4;
  worker.y = 4;
  const paid = order(s, {
    kind: "produce",
    facility: "harbor",
    recipe: "hull",
  });
  expect(paid.ok, paid.reason).toBe(true);
  const planned = preview(paid.state, "p1");
  expect(planned.players.p1.stock.M).toBe(440);
  expect(planned.facilities.harbor.job?.crew).toBe(worker.id);
  expect(
    order(paid.state, { kind: "move", unit: worker.id, x: 3, y: 4 }).reason,
  ).toMatch(/crew|vessel|committed/);
  s = resolveWeek(paid.state);
  expect(Object.keys(s.vessels)).toHaveLength(0);
  s = decodeCheckpoint(encodeCheckpoint(s)).state;
  s = resolveWeek(s);
  expect(Object.keys(s.vessels)).toHaveLength(1);
  const ship = Object.values(s.vessels)[0];
  expect(ship.crew).toBe(worker.id);
  const cargo = order(s, {
    kind: "load-cargo",
    ship: ship.id,
    cargo: { P: 4, M: 0, K: 0, E: 0 },
  });
  expect(cargo.ok, cargo.reason).toBe(true);
  s = resolveWeek(cargo.state);
  s = decodeCheckpoint(encodeCheckpoint(s)).state;
  expect(s.vessels[ship.id].cargo.P).toBe(4);
});
