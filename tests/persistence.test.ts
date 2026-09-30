import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { createMatch, resolveWeek } from "../src/simulation/engine";
import {
  encodeCheckpoint,
  decodeCheckpoint,
  saveCheckpoint,
  loadCheckpoint,
} from "../src/persistence/checkpoints";
describe("committed checkpoints", () => {
  it("preserves the exact prior checkpoint when metadata or export size cannot roundtrip", async () => {
    const original = createMatch(["human_rohan", "human_gondor"], 113);
    const assignments = { p2: "known-peer" },
      seatTokens = { p2: "rejoin-credential-012345678901234567890123456789" };
    await saveCheckpoint(original, assignments, seatTokens);
    const before = await loadCheckpoint();
    await expect(
      saveCheckpoint(original, { unknown: "invalid-peer" }, seatTokens),
    ).rejects.toThrow(/seat/);
    expect(await loadCheckpoint()).toEqual(before);
    const large = structuredClone(original);
    large.receipts.p1 = Array.from({ length: 1100 }, (_, i) => ({
      id: `old-${i}`,
      seq: i + 1,
      turn: 1,
      accepted: true,
      reason: "Accepted",
      fingerprint: "x".repeat(8192),
    }));
    large.nextSeq.p1 = 1101;
    await expect(
      saveCheckpoint(large, assignments, seatTokens),
    ).rejects.toThrow(/8 MB/);
    expect(await loadCheckpoint()).toEqual(before);
  });
  it("roundtrips and rejects incompatible/tampered exports", () => {
    const s = createMatch(["human_rohan", "human_gondor"], 1);
    const text = encodeCheckpoint(s);
    expect(decodeCheckpoint(text).state).toEqual(s);
    expect(() =>
      decodeCheckpoint(
        JSON.stringify({
          ...JSON.parse(text),
          version: "incompatible-future-rules",
        }),
      ),
    ).toThrow();
    expect(() => decodeCheckpoint(text.replace('"P":230', '"P":-1'))).toThrow();
  });
  it("keeps last committed IndexedDB checkpoint when later validation fails", async () => {
    const s = resolveWeek(createMatch(["human_rohan", "human_gondor"], 2));
    await saveCheckpoint(s);
    const bad = structuredClone(s);
    bad.players.p1.stock.P = -1;
    await expect(saveCheckpoint(bad)).rejects.toThrow();
    expect((await loadCheckpoint())?.state).toEqual(s);
  });
  it("rejects uncommitted planning orders", () => {
    const s = createMatch(["human_rohan", "human_gondor"], 3);
    s.orders.push({
      id: "x",
      seq: 1,
      seat: "p1",
      turn: 1,
      revision: 0,
      action: { kind: "exchange" },
    });
    expect(() => encodeCheckpoint(s)).toThrow(/boundary/);
  });
});
it('rejects ambiguous or unusable returning-seat credentials without replacing the last checkpoint',async()=>{
 const s=createMatch(['human_rohan','human_gondor','human_numenor'],15),token='seat-secret-012345678901234567890123456789';await saveCheckpoint(s,{p2:'peer2'},{p2:token});const before=await loadCheckpoint();
 for(const[assignments,tokens]of [
  [{p2:'peer2'},{p2:''}],
  [{p2:'peer2'},{}],
  [{p2:'peer2',p3:'peer3'},{p2:token,p3:token}],
  [{p2:'same-peer',p3:'same-peer'},{p2:token,p3:token+'x'}],
 ] as Array<[Record<string,string>,Record<string,string>]>)await expect(saveCheckpoint(s,assignments,tokens)).rejects.toThrow(/seat|credential|assignment/i);
 expect(await loadCheckpoint()).toEqual(before);
});
