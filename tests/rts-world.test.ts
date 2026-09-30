import { describe, expect, it } from "vitest";
import {
  projectRTS,
  unprojectRTS,
  boxSelection,
  constructionStage,
  facingRTS,
} from "../src/render/rts-presentation";

describe("real-time battlefield presentation contracts", () => {
  it("projects continuous positions without snapping commands to the wrong tile", () => {
    for (const point of [
      { x: 0, y: 0 },
      { x: 47.7, y: 31.3 },
      { x: 12.25, y: 6.5 },
    ]) {
      const screen = projectRTS(point.x, point.y);
      expect(unprojectRTS(screen.x, screen.y)).toEqual(point);
    }
  });
  it("box-selects visible owned living units by their projected ground contact", () => {
    const entities = [
      { id: "own", x: 2, y: 2, owner: "p1", hp: 10 },
      { id: "enemy", x: 2, y: 2, owner: "p2", hp: 10 },
      { id: "dead", x: 2, y: 2, owner: "p1", hp: 0 },
      { id: "out", x: 20, y: 20, owner: "p1", hp: 10 },
    ];
    expect(
      boxSelection(entities, { x: -20, y: 80 }, { x: 20, y: 40 }, "p1"),
    ).toEqual(["own"]);
  });
  it("separates foundations, raised frames, completed buildings and wreckage", () => {
    expect([
      constructionStage(0, 100),
      constructionStage(0.4, 100),
      constructionStage(0.8, 100),
      constructionStage(1, 100),
      constructionStage(1, 0),
    ]).toEqual(["foundation", "frame", "roof", "complete", "destroyed"]);
  });
  it("uses independent directional views across all four travel axes", () => {
    expect([0, Math.PI / 2, Math.PI, -Math.PI / 2].map(facingRTS)).toEqual([
      "east",
      "south",
      "west",
      "north",
    ]);
  });
});
