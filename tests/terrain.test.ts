import { it, expect } from "vitest";
import { createMatch, path, submit } from "../src/simulation/engine";
it("water cannot become a free building plot via a zero-length route", () => {
  const s = createMatch(["human_gondor", "human_rohan"], 4),
    w = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  s.map.terrain[w.y * s.map.width + w.x] = "water";
  expect(path(s, w, w)).toBe(null);
  expect(
    submit(s, {
      id: "water-build",
      seat: "p1",
      seq: 1,
      turn: s.turn,
      revision: s.revision,
      action: { kind: "build", building: "farm", x: w.x, y: w.y },
    }).ok,
  ).toBe(false);
});
