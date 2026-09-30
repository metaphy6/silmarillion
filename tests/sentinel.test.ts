import { it, expect } from "vitest";
import {
  encodeCheckpoint,
  decodeCheckpoint,
} from "../src/persistence/checkpoints";
import { createMatch, submit, resolveWeek } from "../src/simulation/engine";
import type { Match, Action } from "../src/simulation/types";
function order(s: Match, action: Action, seat = "p1") {
  return submit(s, {
    id: `${seat}:${s.nextSeq[seat]}`,
    seq: s.nextSeq[seat],
    turn: s.turn,
    revision: s.revision,
    seat,
    action,
  });
}
function fixture() {
  let s = createMatch(["istari_saruman", "human_rohan"], 33);
  s = resolveWeek(
    order(s, { kind: "produce", facility: "p1:core", recipe: "component" })
      .state,
  );
  s = order(s, { kind: "produce", facility: "p1:core", recipe: "hero" }).state;
  for (let i = 0; i < 3; i++) s = resolveWeek(s);
  s.facilities.orthanc = {
    ...s.facilities["p1:core"],
    id: "orthanc",
    kind: "orthanc",
    name: "Orthanc Workshop",
  };
  s.players.p1.stock = { P: 999, M: 999, K: 999, E: 999 };
  return s;
}
it("Sentinel reserves one paid berth and personal commitment for exactly two production turns", () => {
  let s = fixture();
  const ready = s.players.p1.hero.readiness;
  s = order(s, {
    kind: "produce",
    facility: "orthanc",
    recipe: "sentinel",
  }).state;
  s = resolveWeek(s);
  expect(s.facilities.orthanc.job?.remaining).toBe(1);
  expect(s.players.p1.hero.readiness).toBe(ready - 3);
  s = resolveWeek(s);
  const u = Object.values(s.units).find((u) => u.name === "Resonant Sentinel");
  expect(u?.kind).toBe("construct");
  expect(u?.binding).toBe(1);
  expect(u?.upkeep).toEqual({ P: 0, M: 2, K: 0, E: 1 });
  expect(decodeCheckpoint(encodeCheckpoint(s)).state.units[u!.id].name).toBe(
    "Resonant Sentinel",
  );
  expect(
    order(s, { kind: "produce", facility: "orthanc", recipe: "sentinel" }).ok,
  ).toBe(false);
});
it("cannot commission a Sentinel with captive hero or without personal commitment", () => {
  const s = fixture();
  s.players.p1.commitment = 0;
  expect(
    order(s, { kind: "produce", facility: "orthanc", recipe: "sentinel" }).ok,
  ).toBe(false);
  s.players.p1.commitment = 1;
  s.players.p1.hero.status = "captive";
  s.units["p1:hero"].active = false;
  expect(
    order(s, { kind: "produce", facility: "orthanc", recipe: "sentinel" }).ok,
  ).toBe(false);
});
