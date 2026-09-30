import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { effectiveRelation } from "../src/simulation/diplomacy";

it("requires matching mutual consent; either party can end a treaty", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 6);
  expect(effectiveRelation(s, "p1", "p1")).toBe("alliance");
  expect(effectiveRelation(s, "p1", "p2")).toBe("war");
  s.players.p1.relations.p2 = "peace";
  expect(effectiveRelation(s, "p1", "p2")).toBe("war");
  expect(effectiveRelation(s, "p2", "p1")).toBe("war");
  s.players.p2.relations.p1 = "peace";
  expect(effectiveRelation(s, "p1", "p2")).toBe("peace");
  s.players.p1.relations.p2 = "alliance";
  expect(effectiveRelation(s, "p1", "p2")).toBe("war");
  s.players.p2.relations.p1 = "alliance";
  expect(effectiveRelation(s, "p1", "p2")).toBe("alliance");
  s.players.p2.relations.p1 = "war";
  expect(effectiveRelation(s, "p1", "p2")).toBe("war");
  expect(effectiveRelation(s, "p2", "p1")).toBe("war");
  expect(effectiveRelation(s, "p1", "unknown")).toBe("war");
});
