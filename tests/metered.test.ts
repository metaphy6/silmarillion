import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({
  instances: [] as Array<{
    handlers: Record<string, (value: unknown) => void>;
    connect: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  }>,
  welcome: {} as unknown,
  hang: false,
}));
vi.mock("@metered-ca/realtime", () => ({
  SignallingClient: class {
    handlers: Record<string, (value: unknown) => void> = {};
    connect = vi.fn(async () => {
      if (sdk.hang) return new Promise<void>(() => {});
      this.handlers.connected(sdk.welcome);
    });
    subscribe = vi.fn(async () => {});
    send = vi.fn(async () => {});
    close = vi.fn(async () => {});
    on(event: string, handler: (value: unknown) => void) {
      this.handlers[event] = handler;
      return this;
    }
    constructor() {
      sdk.instances.push(this);
    }
  },
}));
import { MeteredSignaling } from "../src/network/metered";
const welcome = () => ({
  peerId: "peer-a",
  iceServers: [
    { urls: "stun:stun.example.test:3478" },
    {
      urls: "turns:turn.example.test:5349",
      username: "temporary",
      credential: "temporary",
    },
  ],
});
const open = () => {
  const transport = new MeteredSignaling("pk_live_test");
  const receive = vi.fn();
  const status = vi.fn();
  return {
    transport,
    receive,
    status,
    ready: transport.connect("silmarillion-room1", receive, status),
  };
};
beforeEach(() => {
  sdk.instances.length = 0;
  sdk.welcome = welcome();
  sdk.hang = false;
});
afterEach(() => {
  vi.useRealTimers();
});
describe("managed signaling adapter (mock SDK, no service evidence)", () => {
  it("subscribes after welcome, preserves provider identity, and uses direct signaling", async () => {
    const { transport, receive, ready } = open();
    expect(await ready).toEqual(welcome());
    const client = sdk.instances[0];
    expect(client.subscribe).toHaveBeenCalledWith("silmarillion-room1");
    client.handlers.direct({ from: "peer-b", data: { kind: "offer" } });
    expect(receive).toHaveBeenCalledWith({
      from: "peer-b",
      data: { kind: "offer" },
    });
    await transport.send("peer-b", { kind: "answer" });
    expect(client.send).toHaveBeenCalledWith("peer-b", { kind: "answer" });
    transport.close();
    expect(client.close).toHaveBeenCalledOnce();
    client.handlers.direct({ from: "peer-b", data: { kind: "late" } });
    expect(receive).toHaveBeenCalledTimes(1);
    await expect(transport.send("peer-b", {})).rejects.toThrow(/connected/i);
  });
  it("rejects private keys before initializing SDK", async () => {
    await expect(
      new MeteredSignaling("sk_secret_never").connect("room", vi.fn(), vi.fn()),
    ).rejects.toThrow(/publishable/i);
    expect(sdk.instances).toHaveLength(0);
  });
  it.each([
    undefined,
    [],
    [{ urls: "https://example.test" }],
    [{ urls: "turn:example.test", username: "", credential: "" }],
    Array(17).fill({ urls: "stun:example.test" }),
  ])("rejects missing or unsafe ICE credentials: %j", async (iceServers) => {
    sdk.welcome = { peerId: "peer-a", iceServers };
    const { ready } = open();
    await expect(ready).rejects.toThrow(/TURN|ICE/i);
    expect(sdk.instances[0].close).toHaveBeenCalledOnce();
  });
  it("rejects malformed welcome identity and oversized payloads", async () => {
    sdk.welcome = { ...welcome(), peerId: "" };
    await expect(open().ready).rejects.toThrow(/identity/i);
    sdk.welcome = welcome();
    const { transport, receive, ready } = open();
    await ready;
    sdk.instances[1].handlers.direct({ from: "", data: {} });
    expect(receive).not.toHaveBeenCalled();
    await expect(transport.send("peer-b", "x".repeat(65537))).rejects.toThrow(
      /size/i,
    );
    transport.close();
  });
  it("times out stalled connections and closes the client", async () => {
    vi.useFakeTimers();
    sdk.hang = true;
    const { ready } = open();
    const rejection = expect(ready).rejects.toThrow(/timed out/i);
    await vi.waitFor(() => expect(sdk.instances).toHaveLength(1));
    await vi.advanceTimersByTimeAsync(15001);
    await rejection;
    expect(sdk.instances[0].close).toHaveBeenCalledOnce();
  });
  it("cancels an in-flight connection without allowing a late welcome", async () => {
    sdk.hang = true;
    const { transport, ready } = open();
    const rejection = expect(ready).rejects.toThrow(/closed/i);
    await vi.waitFor(() => expect(sdk.instances).toHaveLength(1));
    transport.close();
    await rejection;
    expect(sdk.instances[0].close).toHaveBeenCalledOnce();
  });
});
