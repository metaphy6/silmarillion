import { describe, it, expect } from "vitest";
import {
  createMatch,
  resolveWeek,
  submit,
  kill,
} from "../src/simulation/engine";
import {
  decodeCheckpoint,
  encodeCheckpoint,
} from "../src/persistence/checkpoints";
import { recipe } from "../src/content/catalog";
import type { Match, Action, Unit } from "../src/simulation/types";

function order(s: Match, action: Action, seat = "p1") {
  return submit(s, {
    id: `${seat}:${s.nextSeq[seat]}`,
    seat,
    seq: s.nextSeq[seat],
    turn: s.turn,
    revision: s.revision,
    action,
  });
}
function act(s: Match, action: Action, seat = "p1") {
  const result = order(s, action, seat);
  expect(result.ok, result.reason).toBe(true);
  return result.state;
}
function caster(profile: string, opponent = "human_gondor"): Match {
  const s = createMatch([profile, opponent], 905);
  s.map.terrain.fill("meadow");s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
  const h: Unit = {
    ...structuredClone(s.units["p1:company:0"]),
    id: "p1:hero",
    kind: "hero",
    x: 4,
    y: 4,
    hp: 90,
    maxHp: 90,
    attack: 18,
    supply: 0,
    inventory: [],
    effects: [],
  };
  s.units[h.id] = h;
  s.players.p1.hero.status = "living";
  Object.assign(s.facilities["p1:training"], { x: 4, y: 8 });
  Object.assign(s.units["p2:company:0"], { x: 5, y: 4 });
  Object.assign(s.units["p2:company:1"], { x: 5, y: 4 });
  return s;
}

describe("warned area anchors", () => {
  it.each(["istari_gandalf", "istari_radagast"])(
    "%s keeps its original area when the selected target leaves",
    (profile) => {
      let s = caster(profile);
      if (profile === "istari_radagast") {
        s.map.terrain[4 * s.map.width + 5] = "woodland";
        s.map.terrain[5 * s.map.width + 5] = "woodland";
      }
      const escaped = s.units["p2:company:0"],
        remaining = s.units["p2:company:1"];
      const escapedHP = escaped.hp,
        remainingHP = remaining.hp;
      s = resolveWeek(
        act(s, { kind: "cast", power: "field", target: escaped.id }),
      );
      s = resolveWeek(
        act(s, { kind: "move", unit: escaped.id, x: 5, y: 5 }, "p2"),
      );
      expect(s.units[escaped.id].hp).toBe(escapedHP);
      expect(s.units[remaining.id].hp).toBeLessThan(remainingHP);
      expect(
        s.units[escaped.id].effects.some((e) => e.kind === "move-limit"),
      ).toBe(false);
    },
  );
  it("resolves against remaining area occupants when the original selected victim dies", () => {
    let s = caster("istari_gandalf");
    const target = "p2:company:0",
      remaining = "p2:company:1";
    const hp = s.units[remaining].hp;
    s = resolveWeek(act(s, { kind: "cast", power: "field", target }));
    kill(s, target);
    s = resolveWeek(s);
    expect(s.units[remaining].hp).toBeLessThan(hp);
  });
  it("does not transfer selected-victim interruption to another area occupant", () => {
    let s = caster("istari_gandalf");
    for (const id of ["p2:company:0", "p2:company:1"])
      s.units[id].effects.push({
        kind: "prepared-ranged",
        value: 1,
        until: 99,
        source: `attack:${id}`,
      });
    s = resolveWeek(
      act(s, { kind: "cast", power: "field", target: "p2:company:0" }),
    );
    s = resolveWeek(
      act(s, { kind: "move", unit: "p2:company:0", x: 5, y: 5 }, "p2"),
    );
    expect(
      s.units["p2:company:0"].effects.some((e) => e.kind === "prepared-ranged"),
    ).toBe(true);
    expect(
      s.units["p2:company:1"].effects.some((e) => e.kind === "prepared-ranged"),
    ).toBe(true);
  });
});

describe("Melkor exclusivity distinguishes commands from counterplay", () => {
  it.each(["manwe", "yavanna", "istari_alatar"])(
    "%s may physically obstruct or mark an enemy Dragon",
    (profile) => {
      const s = caster(profile, "melkor_worldbreaker"),
        u = s.units["remnant:0"];
      Object.assign(u, { owner: "p2", active: true, x: 5, y: 4 });
      if (profile === "yavanna")
        s.map.terrain[u.y * s.map.width + u.x] = "woodland";
      const result = order(s, {
        kind: "cast",
        power: profile === "istari_alatar" ? "support" : "field",
        target: u.id,
      });
      expect(result.ok, result.reason).toBe(true);
      expect(result.state.units[u.id].owner).toBe("p2");
    },
  );
  it("still rejects an allied command effect on Dragons", () => {
    const s = caster("sauron", "melkor_worldbreaker"),
      u = s.units["remnant:0"];
    Object.assign(u, { owner: "p2", active: true, x: 5, y: 4 });
    s.players.p1.relations.p2 = "alliance";
    s.players.p2.relations.p1 = "alliance";
    expect(order(s, { kind: "cast", power: "field", target: u.id }).ok).toBe(
      false,
    );
  });
});

function paidQueue() {
  let s = createMatch(["human_rohan", "human_gondor"], 906);
  s = resolveWeek(
    act(s, { kind: "produce", facility: "p1:training", recipe: "company" }),
  );
  expect(s.facilities["p1:training"].job).toBeTruthy();
  return s;
}
function importMutation(mutate: (s: Match) => void) {
  const data = JSON.parse(encodeCheckpoint(paidQueue())) as { state: Match };
  mutate(data.state);
  return () => decodeCheckpoint(JSON.stringify(data));
}
describe("committed queue recipe invariants", () => {
  it("preserves a genuine paid pending queue on export/import", () => {
    const s = paidQueue();
    expect(decodeCheckpoint(encodeCheckpoint(s)).state).toEqual(s);
  });
  it.each(["P", "M", "K", "E"] as const)(
    "rejects a forged %s refund cost",
    (stock) => {
      expect(
        importMutation((s) => {
          s.facilities["p1:training"].job!.cost[stock]++;
        }),
      ).toThrow();
    },
  );
  it.each(["supply", "great", "binding"] as const)(
    "rejects forged %s reservations",
    (field) => {
      expect(
        importMutation((s) => {
          s.facilities["p1:training"].job![field]++;
        }),
      ).toThrow();
    },
  );
  it("rejects a pending job in a destroyed facility", () => {
    expect(
      importMutation((s) => {
        s.facilities["p1:training"].hp = 0;
      }),
    ).toThrow();
  });
  it("rejects future or impossible remaining production times", () => {
    expect(
      importMutation((s) => {
        s.facilities["p1:training"].job!.started = s.turn + 1;
      }),
    ).toThrow();
    expect(
      importMutation((s) => {
        s.facilities["p1:training"].job!.remaining =
          recipe("human_rohan", "company")!.turns + 1;
      }),
    ).toThrow();
  });
});
