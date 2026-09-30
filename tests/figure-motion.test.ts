import { expect, it } from "vitest";
import {
  FIGURE_FAMILIES,
  figurePose,
  directionFor,
  MOTION_ATLAS,
  motionFamily,
} from "../src/render/figure-motion";

it("authors distinct walk/work/attack articulation in four directions for every family", () => {
  for (const family of FIGURE_FAMILIES)
    for (const action of ["walk", "work", "attack"] as const) {
      const directions = [];
      for (const direction of ["north", "east", "south", "west"] as const) {
        const poses = Array.from({ length: 4 }, (_, frame) =>
          figurePose(family, action, direction, frame),
        );
        expect(new Set(poses.map((p) => JSON.stringify(p.parts))).size).toBe(4);
        for (const pose of poses) {
          expect(pose.anchor).toEqual({ x: 32, y: 54 });
          for (const part of pose.parts)
            for (const p of part.points) {
              expect(p.x).toBeGreaterThanOrEqual(0);
              expect(p.x).toBeLessThanOrEqual(64);
              expect(p.y).toBeGreaterThanOrEqual(0);
              expect(p.y).toBeLessThanOrEqual(64);
            }
        }
        directions.push(JSON.stringify(poses[0].parts));
      }
      expect(new Set(directions).size).toBe(4);
    }
  expect(MOTION_ATLAS.framesPerFamily).toBe(48);
  expect(MOTION_ATLAS.maxBytes).toBeLessThan(20 * 1024 * 1024);
});
it("preserves species body plans and dragon form exclusivity", () => {
  const eagle = figurePose("eagle", "walk", "east", 0),
    spider = figurePose("spider", "walk", "east", 0);
  expect(eagle.parts.filter((p) => p.role === "wing")).toHaveLength(2);
  expect(eagle.parts.filter((p) => p.role === "leg")).toHaveLength(2);
  expect(spider.parts.filter((p) => p.role === "leg")).toHaveLength(8);
  expect(
    figurePose("wolf", "walk", "east", 0).parts.filter((p) => p.role === "leg"),
  ).toHaveLength(4);
  expect(
    figurePose("dragon", "walk", "east", 0).parts.some(
      (p) => p.role === "wing",
    ),
  ).toBe(false);
  expect(
    figurePose("winged-dragon", "walk", "east", 0).parts.filter(
      (p) => p.role === "wing",
    ),
  ).toHaveLength(2);
  expect(motionFamily("melkor_dark_architect", "drake", "dominion-works")).toBe(
    "dragon",
  );
  expect(motionFamily("wolf_pack", "worker", "embodied-wild")).toBe("wolf");
  expect(directionFor({ x: 1, y: 0 }, { x: 0, y: 0 })).toBe("west");
});

import { paintedJoint, motionAppearance } from "../src/render/figure-motion";
it("painted rigs preserve the original archetype and independently articulate limbs across actions and directions", () => {
  for (const archetype of [
    "infantry",
    "porter",
    "rider",
    "elven-archer",
    "wizard",
    "dwarf-engineer",
    "orc-guard",
    "herald",
    "troll",
    "wolf",
    "eagle",
    "spider",
    "ent",
    "winged-dragon",
    "ember-creature",
    "construct",
    "aurochs",
    "stag",
    "hind",
    "songbirds",
    "moths",
    "ground-dragon",
  ]) {
    for (const action of ["walk", "work", "attack"] as const)
      for (const direction of ["north", "east", "south", "west"] as const) {
        const poses = Array.from({ length: 4 }, (_, frame) => [
          paintedJoint(archetype, action, direction, frame, 0.2, 0.8),
          paintedJoint(archetype, action, direction, frame, 0.8, 0.5),
          paintedJoint(archetype, action, direction, frame, 0.5, 0.18),
        ]);
        expect(new Set(poses.map((p) => JSON.stringify(p))).size).toBe(4);
        // The head never receives the leg stride or tool-arm swing.
        expect(poses[0][2]).toEqual(poses[2][2]);
        expect(poses[0][0]).not.toEqual(poses[2][0]);
      }
  }
  expect(motionAppearance("manwe", "company").frame).toBe("infantry");
  expect(motionAppearance("istari_gandalf", "hero").frame).toBe("wizard");
  expect(motionAppearance("orome", "beast", "hunting-hounds").frame).toBe(
    "wolf",
  );
  expect(motionAppearance("manwe", "beast", "courier-eagle").frame).toBe(
    "eagle",
  );
});

it("new companion species use their own painted frames rather than owner humanoids", () => {
  for (const [key, frame] of [
    ["pack-aurochs", "aurochs"],
    ["courier-stag", "stag"],
    ["rescue-hind", "hind"],
    ["songbird-swarm", "songbirds"],
    ["moth-clouds", "moths"],
  ])
    expect(motionAppearance("orome", "beast", key).frame).toBe(frame);
  expect(motionAppearance("melkor_dark_architect", "drake").frame).toBe(
    "ground-dragon",
  );
});

import {
  DIRECTIONAL_SHEETS,
  directionalMaster,
} from "../src/render/figure-motion";
it("maps every painted archetype to four separately authored directional master cells", () => {
  const names = DIRECTIONAL_SHEETS.flatMap((s) => s.archetypes);
  expect(new Set(names).size).toBe(22);
  for (const name of names) {
    const frames = ["north", "east", "south", "west"].map((d) =>
      directionalMaster(
        name,
        d as import("../src/render/figure-motion").FigureDirection,
      ),
    );
    expect(frames.every(Boolean)).toBe(true);
    expect(new Set(frames.map((f) => f!.frame)).size).toBe(4);
  }
  expect(directionalMaster("absent", "north")).toBeUndefined();
});

it("all four actual orthogonal map routes select the corresponding painted view",()=>{
 expect(directionFor({x:8,y:8},{x:8,y:7})).toBe("north");
 expect(directionFor({x:8,y:8},{x:9,y:8})).toBe("east");
 expect(directionFor({x:8,y:8},{x:8,y:9})).toBe("south");
 expect(directionFor({x:8,y:8},{x:7,y:8})).toBe("west");
});
