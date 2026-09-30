import { describe, expect, it } from "vitest";
import { createMatch, resolveWeek, submit } from "../src/simulation/engine";
import {
  decodeCheckpoint,
  encodeCheckpoint,
} from "../src/persistence/checkpoints";
import type { Action, Match } from "../src/simulation/types";

function commit(s: Match, action: Action): Match {
  const result = submit(s, {
    id: `save-test:${s.turn}:${s.nextSeq.p1}`,
    seat: "p1",
    seq: s.nextSeq.p1,
    turn: s.turn,
    revision: s.revision,
    action,
  });
  expect(result.ok, result.reason).toBe(true);
  return resolveWeek(result.state);
}

function pendingHero(): Match {
  let s = createMatch(["human_rohan", "human_gondor"], 701);
  s = commit(s, { kind: "produce", facility: "p1:core", recipe: "component" });
  s = commit(s, { kind: "produce", facility: "p1:core", recipe: "hero" });
  expect(s.players.p1.hero.status).toBe("pending");
  return s;
}

function livingHero(): Match {
  const s = resolveWeek(pendingHero());
  expect(s.players.p1.hero.status).toBe("living");
  return s;
}

// Serialize a valid checkpoint first, then model corrupt imported state. This
// exercises the import boundary without encodeCheckpoint screening the defect.
function corruptedImport(
  s: Match,
  mutate: (state: Match) => void,
): () => unknown {
  const checkpoint = JSON.parse(encodeCheckpoint(s)) as { state: Match };
  mutate(checkpoint.state);
  return () => decodeCheckpoint(JSON.stringify(checkpoint));
}

describe("authoritative checkpoint gameplay invariants", () => {
  it("roundtrips genuine pending and living hero boundaries", () => {
    for (const s of [pendingHero(), livingHero()])
      expect(decodeCheckpoint(encodeCheckpoint(s)).state).toEqual(s);
  });

  it("rejects a second living hero unit outside the sole referenced hero slot", () => {
    expect(
      corruptedImport(livingHero(), (s) => {
        const original = s.units[s.players.p1.hero.id];
        s.units["p1:duplicate-hero"] = {
          ...structuredClone(original),
          id: "p1:duplicate-hero",
        };
      }),
    ).toThrow();
  });

  it("rejects a pending hero slot with no creation or recreation job", () => {
    expect(
      corruptedImport(pendingHero(), (s) => {
        delete s.facilities["p1:core"].job;
      }),
    ).toThrow();
  });

  it("rejects a zero-health living unit and an active corpse", () => {
    expect(
      corruptedImport(livingHero(), (s) => {
        s.units["p1:company:0"].hp = 0;
      }),
    ).toThrow();
    expect(
      corruptedImport(livingHero(), (s) => {
        const u = s.units["p1:company:0"];
        u.hp = 0;
        u.alive = false;
        u.active = true;
      }),
    ).toThrow();
  });

  it("rejects a pending creation job when the hero slot is unoccupied", () => {
    expect(
      corruptedImport(pendingHero(), (s) => {
        s.players.p1.hero.status = "uncreated";
      }),
    ).toThrow();
  });

  it("rejects two pending hero creation queues for the same faction", () => {
    expect(
      corruptedImport(pendingHero(), (s) => {
        s.facilities["p1:training"].job = {
          ...structuredClone(s.facilities["p1:core"].job!),
          id: "job:duplicate",
        };
      }),
    ).toThrow();
  });

  it("rejects an unknown pending recipe before restoration can crash completion", () => {
    expect(
      corruptedImport(pendingHero(), (s) => {
        s.facilities["p1:core"].job!.recipe = "missing-recipe";
      }),
    ).toThrow();
  });

  it("rejects a facility whose owner does not exist", () => {
    expect(
      corruptedImport(livingHero(), (s) => {
        s.facilities["p1:training"].owner = "missing-seat";
      }),
    ).toThrow();
  });

  it("rejects an active captive instead of allowing it to issue company orders", () => {
    expect(
      corruptedImport(livingHero(), (s) => {
        s.players.p1.hero.status = "captive";
        s.players.p1.hero.captor = "p2";
        // The serialized hero unit is still alive and active, an invalid pairing.
      }),
    ).toThrow();
  });

  it("preserves a valid living captive occupying the sole hero slot", () => {
    const s = livingHero();
    s.players.p1.hero.status = "captive";
    s.players.p1.hero.captor = "p2";
    s.units[s.players.p1.hero.id].active = false;
    expect(decodeCheckpoint(encodeCheckpoint(s)).state).toEqual(s);
  });
});
