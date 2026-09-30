import { afterEach, expect, it, vi } from "vitest";
import { StarTransport, type Signaling } from "../src/network/star";
import type { Signal } from "../src/network/metered";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("does not allocate ICE queues for unknown host-side senders", async () => {
  let inbound: (signal: Signal) => void = () => {};
  const signaling: Signaling = {
    connect: async (_room, receive) => {
      inbound = receive;
      return { peerId: "host", iceServers: [] };
    },
    send: vi.fn(async () => {}),
    close: vi.fn(),
  };
  const transport = new StarTransport(
    signaling,
    true,
    vi.fn(),
    vi.fn(),
    vi.fn(),
    vi.fn(),
  );
  await transport.connect("room");
  try {
    for (let n = 0; n < 1000; n++)
      inbound({
        from: `stranger-${n}`,
        data: { type: "ice", candidate: { candidate: "ignored" } },
      });
    expect(
      (transport as unknown as { candidates: Map<string, unknown[]> })
        .candidates.size,
    ).toBe(0);
  } finally {
    transport.close();
  }
});
it("reserves one bounded handshake slot so full matches can authenticate a replacement peer", async () => {
  vi.stubGlobal(
    "RTCPeerConnection",
    class {
      close() {}
    },
  );
  const signaling: Signaling = {
    connect: async () => ({ peerId: "host", iceServers: [] }),
    send: vi.fn(async () => {}),
    close: vi.fn(),
  };
  const transport = new StarTransport(
    signaling,
    true,
    vi.fn(),
    vi.fn(),
    vi.fn(),
    vi.fn(),
  );
  const handshakes = transport as unknown as {
    make(peer: string): RTCPeerConnection;
  };
  try {
    for (const id of ["p2-old", "p3", "p4"]) handshakes.make(id);
    expect(() => handshakes.make("p2-replacement")).not.toThrow();
    expect(() => handshakes.make("overflow")).toThrow(/limit/);
  } finally {
    transport.close();
  }
});
it("accepts offers and early ICE only from the invited host, with a bounded queue", async () => {
  let inbound: (signal: Signal) => void = () => {};
  const addIceCandidate = vi.fn(async () => {}),
    setRemoteDescription = vi.fn(async () => {});
  const pcs: unknown[] = [];
  vi.stubGlobal(
    "RTCPeerConnection",
    class {
      remoteDescription = null;
      localDescription = { toJSON: () => ({ type: "answer", sdp: "answer" }) };
      addIceCandidate = addIceCandidate;
      setRemoteDescription = setRemoteDescription;
      setLocalDescription = vi.fn(async () => {});
      createAnswer = vi.fn(async () => ({ type: "answer", sdp: "answer" }));
      close = vi.fn();
      constructor() {
        pcs.push(this);
      }
    },
  );
  const signaling: Signaling = {
    connect: async (_room, receive) => {
      inbound = receive;
      return { peerId: "guest", iceServers: [] };
    },
    send: vi.fn(async () => {}),
    close: vi.fn(),
  };
  const transport = new StarTransport(
    signaling,
    false,
    vi.fn(),
    vi.fn(),
    vi.fn(),
    vi.fn(),
  );
  await transport.connect("room");
  await transport.join("expected-host");
  inbound({
    from: "attacker",
    data: { type: "offer", description: { type: "offer", sdp: "unexpected" } },
  });
  await Promise.resolve();
  expect(pcs).toHaveLength(0);
  for (let n = 0; n < 1000; n++)
    inbound({
      from: `unknown-${n}`,
      data: { type: "ice", candidate: { candidate: "candidate:fake" } },
    });
  // The private queue is inspected only as a resource-bound invariant.
  expect(
    (transport as unknown as { candidates: Map<string, unknown[]> }).candidates
      .size,
  ).toBe(0);
  for (let n = 0; n < 100; n++)
    inbound({
      from: "expected-host",
      data: { type: "ice", candidate: { candidate: `candidate:${n}` } },
    });
  expect(
    (
      transport as unknown as { candidates: Map<string, unknown[]> }
    ).candidates.get("expected-host"),
  ).toHaveLength(64);
  inbound({
    from: "expected-host",
    data: { type: "offer", description: { type: "offer", sdp: "expected" } },
  });
  await vi.waitFor(() => expect(addIceCandidate).toHaveBeenCalledTimes(64));
  expect(pcs).toHaveLength(1);
  transport.close();
});
