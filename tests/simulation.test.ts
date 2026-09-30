import { describe, it, expect } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  validate,
  planAI,
} from "../src/simulation/engine";
import { profiles } from "../src/content/catalog";
import type { Order, Match } from "../src/simulation/types";
const order = (s: Match, seat: string, action: Order["action"]): Order => ({
  id: `${seat}:${s.turn}:${s.nextSeq[seat]}`,
  seat,
  seq: s.nextSeq[seat],
  turn: s.turn,
  revision: s.revision,
  action,
});
function act(s: Match, action: Order["action"], seat = "p1") {
  const r = submit(s, order(s, seat, action));
  expect(r.ok, r.reason).toBe(true);
  return r.state;
}
function tick(s: Match) {
  return resolveWeek(s);
}
describe("r6 invariants", () => {
  it("contains exact 54 factions and 55 profiles", () => {
    expect(profiles).toHaveLength(55);
    expect(new Set(profiles.map((p) => p.faction)).size).toBe(54);
  });
  it("rejects duplicate Melkor identity", () => {
    expect(() =>
      createMatch(["melkor_worldbreaker", "melkor_dark_architect"], 1),
    ).toThrow(/identity/i);
  });
  it("Rohan chain reserves unique slot, pays exact inputs and takes three turns", () => {
    let s = createMatch(["human_rohan", "human_gondor"], 1);
    s = act(s, { kind: "produce", facility: "p1:core", recipe: "component" });
    s = tick(s);
    expect(s.players.p1.component).toBe(1);
    s = act(s, { kind: "produce", facility: "p1:core", recipe: "hero" });
    expect(
      validate(
        s,
        order(s, "p1", {
          kind: "produce",
          facility: "p1:core",
          recipe: "hero",
        }),
      ),
    ).toMatch(/occupied|queue/i);
    s = tick(s);
    expect(s.players.p1.hero.status).toBe("pending");
    s = tick(s);
    expect(s.players.p1.hero.status).toBe("living");
    expect(s.players.p1.hero.id).toBe("p1:hero");
  });
  it("deduplicates retries exactly and rejects stale order", () => {
    const s = createMatch(["human_rohan", "human_gondor"], 2);
    const o = order(s, "p1", { kind: "exchange" });
    const r = submit(s, o);
    expect(r.ok).toBe(true);
    expect(submit(r.state, o).state).toEqual(r.state);
    expect(submit(tick(r.state), { ...o, id: "new" }).ok).toBe(false);
  });
  it("rejects negative resources, foreign commands and operation exhaustion", () => {
    let s = createMatch(["human_rohan", "human_gondor"], 3);
    expect(
      submit(
        s,
        order(s, "p1", { kind: "move", unit: "p2:company:0", x: 5, y: 5 }),
      ).ok,
    ).toBe(false);
    for (let i = 0; i < 3; i++) s = act(s, { kind: "exchange" });
    expect(submit(s, order(s, "p1", { kind: "exchange" })).ok).toBe(false);
    s.players.p2.stock.M = 0;
    expect(
      submit(
        s,
        order(s, "p2", {
          kind: "produce",
          facility: "p2:core",
          recipe: "component",
        }),
      ).ok,
    ).toBe(false);
  });
  it("produces deterministic replay independent of cross-seat arrival", () => {
    const s = createMatch(["human_rohan", "human_gondor"], 4);
    const a = order(s, "p1", { kind: "exchange" }),
      b = order(s, "p2", { kind: "exchange" });
    const x = resolveWeek(submit(submit(s, a).state, b).state);
    const y = resolveWeek(submit(submit(s, b).state, a).state);
    expect(x).toEqual(y);
  });
  it("AI submits legal commands for every starting profile", () => {
    for (const p of profiles) {
      const opponent = p.id === "human_rohan" ? "human_gondor" : "human_rohan";
      let s = createMatch([p.id, opponent], 9);
      for (const a of planAI(s, "p1")) {
        const r = submit(s, order(s, "p1", a));
        expect(r.ok, `${p.id}: ${r.reason}`).toBe(true);
        s = r.state;
      }
    }
  });
  it("Worldbreaker cannot manufacture creatures and Sauron cannot call them", () => {
    for (const id of ["melkor_worldbreaker", "sauron"]) {
      const s = createMatch([id, "human_rohan"], 5);
      expect(
        submit(
          s,
          order(s, "p1", {
            kind: "produce",
            facility: "p1:core",
            recipe: "balrog",
          }),
        ).ok,
      ).toBe(false);
    }
  });
});
