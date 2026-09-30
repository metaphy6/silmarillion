import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  queueTool,
  progressTools,
  refitTool,
  validateTools,
  type ToolFunction,
} from "../src/simulation/tool-services";
import {
  repairReason,
  startRepair,
  progressRepairs,
} from "../src/simulation/repair";
import type { Action } from "../src/simulation/types";
function setup() {
  const s = createMatch(["istari_forge", "human_rohan"], 11),
    p = s.players.p1,
    f = s.facilities["p1:core"],
    u = s.units["p1:company:0"];
  f.kind = "workshop";
  Object.assign(u, { kind: "construct", hp: 20, x: f.x, y: f.y });
  p.stock = { P: 100, M: 100, K: 100, E: 100 };
  p.sources.push("metal");
  p.research.push("tool-repair");
  return { s, p, f, u };
}
it("paid Forge kit fits an existing own construct and is consumed with full repair inputs and time", () => {
  const { s, p, f, u } = setup();
  queueTool(s, "p1", f.id, "repair-kit" as ToolFunction);
  progressTools(s, () => true);
  const kit = Object.keys(s.toolMetadata)[0];
  expect(s.items[kit]).toMatchObject({ durability: 1, maxDurability: 1 });
  const a = {
    kind: "repair",
    facility: f.id,
    target: u.id,
    method: "ordinary",
    kit,
  } as Extract<Action, { kind: "repair" }>;
  expect(repairReason(s, "p1", a, () => true)).toBe("");
  startRepair(s, "p1", a);
  expect(s.items[kit]).toBeUndefined();
  expect(s.toolMetadata[kit]).toBeUndefined();
  expect(p.stock).toMatchObject({ M: 65, K: 90 });
  expect(f.repair?.remaining).toBe(2);
  const hp = u.hp;
  progressRepairs(
    s,
    () => true,
    () => {},
  );
  expect(u.hp).toBe(hp);
  s.turn++;
  progressRepairs(
    s,
    () => true,
    () => {},
  );
  expect(u.hp).toBeGreaterThan(hp);
  expect(repairReason(s, "p1", a, () => true)).toMatch(/kit/i);
});
it("Forge kit cannot be refitted, used remotely, or laundered through a foreign owner", () => {
  const { s, f, u } = setup();
  queueTool(s, "p1", f.id, "repair-kit" as ToolFunction);
  progressTools(s, () => true);
  const kit = Object.keys(s.toolMetadata)[0],
    a = {
      kind: "repair",
      facility: f.id,
      target: u.id,
      method: "ordinary",
      kit,
    } as Extract<Action, { kind: "repair" }>;
  s.items[kit].x += 5;
  expect(repairReason(s, "p1", a, () => true)).toMatch(/kit/i);
  s.items[kit].x = f.x;
  s.toolMetadata[kit].maker = "p2";
  expect(repairReason(s, "p1", a, () => true)).toMatch(/kit/i);
  expect(() => validateTools(s)).toThrow();
  expect(() => refitTool(s, "p1", kit, f.id, "repair", () => true)).toThrow();
});
