import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { situatedScenes } from "../src/content/narrative";
it("binds an original conversation to actual fatigue and normal paid rest without modifying state", () => {
  const s = createMatch(["human_rohan", "elf_finarfin"], 19),
    f = s.facilities["p1:core"],
    u = s.units["p1:company:0"];
  f.kind = "refuge";
  u.x = f.x;
  u.y = f.y;
  expect(situatedScenes(s, "p1", f.id)).toEqual([]);
  u.effects.push({
    kind: "fatigue",
    value: 2,
    source: "ordinary-travel",
    until: 1000000,
  });
  const before = structuredClone(s);
  const scene = situatedScenes(s, "p1", f.id)[0];
  expect(scene.action).toEqual({ kind: "rest", unit: u.id, facility: f.id });
  expect(scene.uncertainty).toContain("not what");
  expect(s).toEqual(before);
  expect(situatedScenes(s, "p2", f.id)).toEqual([]);
});
it("never invents a damaged boat or finite wreck merely to offer a dialogue reward", () => {
  const s = createMatch(["human_numenor", "human_rohan"], 20),
    f = s.facilities["p1:core"];
  f.kind = "harbor";
  expect(situatedScenes(s, "p1", f.id)).toEqual([]);
  f.kind = "foundry";
  s.infrastructureSites = {};
  expect(situatedScenes(s, "p1", f.id)).toEqual([]);
});
