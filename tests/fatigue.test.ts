import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  fatigue,
  fatigueMovementPenalty,
  travelFatigue,
  restReason,
  startRest,
  progressRest,
  pruneRest,
  restInvariant,
} from "../src/simulation/fatigue";
function fixture(profile = "human_rohan") {
  const s = createMatch([profile, "human_gondor"], 8),
    p = s.players.p1,
    u = s.units["p1:company:0"],
    core = s.facilities["p1:core"];
  u.x = core.x;
  u.y = core.y;
  const h = { ...structuredClone(u), id: p.hero.id, kind: "hero" as const };
  s.units[h.id] = h;
  p.hero.status = "living";
  const f = { ...structuredClone(core), id: "rest-site", kind: "refuge" };
  s.facilities[f.id] = f;
  return { s, p, u, h, f };
}
it("ordinary travel adds bounded meaningful fatigue and Rohan saves only the first accompanied rider leg", () => {
  const { s, u, h } = fixture(),
    from = { x: u.x, y: u.y },
    to = { x: u.x + 1, y: u.y };
  travelFatigue(s, u, from, to);
  expect(fatigue(s, u)).toBe(0);
  travelFatigue(s, u, from, to);
  expect(fatigue(s, u)).toBe(1);
  for (let i = 0; i < 10; i++) travelFatigue(s, u, from, to);
  expect(fatigue(s, u)).toBe(6);
  expect(fatigueMovementPenalty(s, u)).toBe(2);
  s.turn++;
  h.x += 20;
  travelFatigue(s, u, from, to);
  expect(fatigue(s, u)).toBe(6);
});
it("rest escrows real P once, shares the worksite queue, pauses when absent and never heals", () => {
  const { s, p, u, f } = fixture();
  u.effects.push({
    kind: "fatigue",
    value: 4,
    until: 1000000,
    source: "travel",
  });
  u.hp--;
  const hp = u.hp,
    before = p.stock.P;
  expect(restReason(s, "p1", u.id, f.id)).toBe("");
  startRest(s, "p1", u.id, f.id);
  expect(p.stock.P).toBe(before - 2);
  expect(restReason(s, "p1", u.id, f.id)).not.toBe("");
  expect(() => startRest(s, "p1", u.id, f.id)).toThrow();
  expect(p.stock.P).toBe(before - 2);
  u.x += 3;
  progressRest(s);
  expect(fatigue(s, u)).toBe(4);
  expect(f.rest).toBeDefined();
  u.x = f.x;
  progressRest(s);
  expect(fatigue(s, u)).toBe(2);
  expect(f.rest).toBeUndefined();
  expect(u.hp).toBe(hp);
  progressRest(s);
  expect(fatigue(s, u)).toBe(2);
});
it.each(["elf_finarfin", "istari_ember"])(
  "%s adds exactly one fatigue recovery once weekly without touching injury",
  (profile) => {
    const { s, u, f } = fixture(profile);
    u.effects.push(
      { kind: "fatigue", value: 6, until: 1000000, source: "travel" },
      { kind: "wound", value: 1, until: 1000000, source: "injury:test" },
    );
    startRest(s, "p1", u.id, f.id);
    progressRest(s);
    expect(fatigue(s, u)).toBe(3);
    startRest(s, "p1", u.id, f.id);
    progressRest(s);
    expect(fatigue(s, u)).toBe(1);
    expect(u.effects.some((e) => e.kind === "wound")).toBe(true);
  },
);
it("rejects unfunded, supplied-status, phantom-target and forged queue states; death discards paid rest", () => {
  const { s, p, u, f } = fixture();
  u.effects.push({
    kind: "fatigue",
    value: 3,
    until: 1000000,
    source: "travel",
  });
  p.stock.P = 1;
  expect(restReason(s, "p1", u.id, f.id)).not.toBe("");
  p.stock.P = 10;
  u.supplied = false;
  expect(restReason(s, "p1", u.id, f.id)).not.toBe("");
  u.supplied = true;
  expect(restReason(s, "p1", "missing", f.id)).not.toBe("");
  startRest(s, "p1", u.id, f.id);
  expect(() => restInvariant(s, f)).not.toThrow();
  f.rest!.cost.P = 99;
  expect(() => restInvariant(s, f)).toThrow();
  f.rest!.cost.P = 2;
  u.alive = false;
  u.hp = 0;
  pruneRest(s);
  expect(f.rest).toBeUndefined();
  expect(p.stock.P).toBe(8);
});
it("prevents duplicate queues at another site and pauses lost staffing without extra charges", () => {
  const { s, p, u, f, h } = fixture("elf_finarfin");
  u.effects.push({
    kind: "fatigue",
    value: 4,
    until: 1000000,
    source: "travel",
  });
  const second = { ...structuredClone(f), id: "second" };
  s.facilities[second.id] = second;
  startRest(s, "p1", u.id, f.id);
  const paid = p.stock.P;
  expect(restReason(s, "p1", u.id, second.id)).not.toBe("");
  f.workers = 0;
  progressRest(s);
  expect(fatigue(s, u)).toBe(4);
  expect(p.stock.P).toBe(paid);
  f.workers = 1;
  h.x += 10;
  progressRest(s);
  expect(fatigue(s, u)).toBe(2);
  expect(p.stock.P).toBe(paid);
});
