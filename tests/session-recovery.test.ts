import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { VERSION } from "../src/simulation/types";
import { guestSnapshot } from "../src/network/protocol";
const mocks = vi.hoisted(() => ({
  transports: [] as Array<{
    message: (peer: string, raw: string) => void;
    send: ReturnType<typeof vi.fn>;
    drop: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock("../src/network/star", () => ({
  LocalSignaling: class {},
  StarTransport: class {
    send = vi.fn();
    close = vi.fn();
    drop = vi.fn();
    async connect() {
      return { peerId: "guest", iceServers: [] };
    }
    async join() {}
    constructor(
      _provider: unknown,
      _host: boolean,
      public message: (peer: string, raw: string) => void,
    ) {
      mocks.transports.push(this);
    }
  },
}));
import { MatchSession } from "../src/network/session";
const s = createMatch(["human_rohan", "human_gondor"], 17);
const invite = JSON.stringify({
  room: "room",
  matchId: s.id,
  host: "host",
  cap: "private-invite-0123456789",
  dev: true,
  version: VERSION,
});
const welcome = () => ({
  type: "welcome",
  seat: "p2",
  token: "saved-token-012345678901234567890123456789",
  snapshot: guestSnapshot(s, "p2"),
});
const frameIds=new Map<string,string>();
const frame = (id: string, data: string, index = 0, count = 1) => {
  if(!id.startsWith('snapshot:')){if(!frameIds.has(id))frameIds.set(id,`snapshot:${frameIds.size+1}`);id=frameIds.get(id)!;}
  return JSON.stringify({ type: "chunk", id, data, index, count });
};
beforeEach(() => {
  mocks.transports.length = 0;
  frameIds.clear();
  const storage = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("snapshot recovery (mock transport)", () => {
  it.each([
    ["malformed", "{bad"],
    ["oversized", "x".repeat(17000)],
  ])(
    "never amplifies %s floods into snapshots or renders",
    async (_kind, raw) => {
      const changed = vi.fn(),
        session = new MatchSession(changed, vi.fn());
      await session.host(
        createMatch(["human_rohan", "human_gondor", "human_numenor"], 19),
        true,
      );
      session.authority!.assignments.p2 = "guest2";
      session.authority!.assignments.p3 = "guest3";
      const transport = mocks.transports[0];
      changed.mockClear();
      transport.send.mockClear();
      vi.spyOn(performance, "now").mockReturnValue(100);
      for (let n = 0; n < 1000; n++) transport.message("flooder", raw);
      expect(changed.mock.calls.length).toBe(0);
      expect(transport.send.mock.calls.length).toBe(30);
      expect(transport.drop).toHaveBeenCalledOnce();
      for (const [peer, raw] of transport.send.mock.calls) {
        expect(peer).toBe("flooder");
        expect(JSON.parse(JSON.parse(raw).data).type).toBe("error");
      }
      vi.restoreAllMocks();
      session.close();
    },
  );
  it("sends unchanged sync/duplicate receipts only to the requester and avoids extra renders", async () => {
    const changed = vi.fn(),
      session = new MatchSession(changed, vi.fn());
    await session.host(s, true);
    const authority = session.authority!;
    const cap = JSON.parse(session.invite).cap;
    authority.receive(
      "guest2",
      JSON.stringify({
        type: "hello",
        version: VERSION,
        invite: cap,
        seat: "p2",
        token: "",
      }),
      0,
    );
    const transport = mocks.transports[0];
    changed.mockClear();
    transport.send.mockClear();
    transport.message("guest2", JSON.stringify({ type: "sync" }));
    expect(transport.send).toHaveBeenCalledOnce();
    expect(changed).not.toHaveBeenCalled();
    const order = {
      id: "one",
      seat: "p2",
      seq: 1,
      turn: 1,
      revision: 0,
      action: { kind: "exchange" },
    };
    transport.message("guest2", JSON.stringify({ type: "order", order }));
    expect(changed).toHaveBeenCalledOnce();
    changed.mockClear();
    transport.send.mockClear();
    transport.message("guest2", JSON.stringify({ type: "order", order }));
    expect(transport.send).toHaveBeenCalledOnce();
    expect(changed).not.toHaveBeenCalled();
    session.close();
  });
  it("uses the documented provider channel namespace for hosted rooms", async () => {
    const session = new MatchSession(vi.fn(), vi.fn());
    const invitation = JSON.parse(await session.host(s, true));
    expect(invitation.room).toMatch(/^silmarillion-[a-f0-9-]{36}$/);
    session.close();
  });
  it("clears incomplete transfers on reconnect and ignores frames from retired transports", async () => {
    const changed = vi.fn(),
      status = vi.fn(),
      session = new MatchSession(changed, status);
    await session.join(invite, "p2");
    const old = mocks.transports[0];
    for (let n = 0; n < 4; n++)
      old.message("host", frame(`partial${n}`, "{", 0, 2));
    await session.reconnect();
    old.message("host", frame("late", JSON.stringify(welcome())));
    expect(changed).not.toHaveBeenCalled();
    mocks.transports[1].message(
      "host",
      frame("fresh", JSON.stringify(welcome())),
    );
    expect(changed).toHaveBeenCalledOnce();
    expect(status).toHaveBeenLastCalledWith(
      "Connected as p2; filtered snapshot synchronized",
    );
  });
  it("never stores a credential or accepts a view before validating its identity and state", async () => {
    const changed = vi.fn(),
      session = new MatchSession(changed, vi.fn());
    await session.join(invite, "p2");
    const originalToken = sessionStorage.getItem(`sm-seat-${s.id}-p2`);
    expect(originalToken?.length).toBeGreaterThanOrEqual(32);
    const message = mocks.transports[0].message;
    message(
      "host",
      frame("bad-state", JSON.stringify({ ...welcome(), snapshot: {} })),
    );
    expect(sessionStorage.getItem(`sm-seat-${s.id}-p2`)).toBe(originalToken);
    message(
      "host",
      frame("bad-seat", JSON.stringify({ ...welcome(), seat: "p3" })),
    );
    expect(sessionStorage.getItem(`sm-seat-${s.id}-p2`)).toBe(originalToken);
    message(
      "host",
      frame(
        "bad-match",
        JSON.stringify({
          ...welcome(),
          snapshot: { ...welcome().snapshot, id: "different-match" },
        }),
      ),
    );
    expect(changed).not.toHaveBeenCalled();
  });
  it("preserves an unacknowledged order and retries it only after a valid welcome", async () => {
    const changed = vi.fn(),
      session = new MatchSession(changed, vi.fn());
    await session.join(invite, "p2");
    const command = {
      id: "p2:1",
      seat: "p2",
      seq: 1,
      turn: s.turn,
      revision: s.revision,
      action: { kind: "exchange" as const },
    };
    session.order(command);
    await session.reconnect();
    mocks.transports[1].message(
      "host",
      frame("invalid", JSON.stringify({ ...welcome(), snapshot: {} })),
    );
    expect(mocks.transports[1].send).not.toHaveBeenCalled();
    mocks.transports[1].message(
      "host",
      frame("valid", JSON.stringify(welcome())),
    );
    expect(mocks.transports[1].send).toHaveBeenCalledWith(
      "host",
      JSON.stringify({ type: "order", order: command }),
    );
  });
});
it('never rolls a synchronized guest back when an older partial snapshot finishes later',async()=>{
 const changed=vi.fn(),status=vi.fn(),session=new MatchSession(changed,status);await session.join(invite,'p2');const send=mocks.transports[0].message;
 const old=JSON.stringify(welcome());send('host',frame('older',old.slice(0,old.length/2),0,2));
 const newer=structuredClone(s);newer.revision++;newer.turn++;
 send('host',frame('newer',JSON.stringify({...welcome(),snapshot:guestSnapshot(newer,'p2')})));
 expect(changed).toHaveBeenCalledOnce();expect(changed.mock.calls[0][0].revision).toBe(newer.revision);
 send('host',frame('older',old.slice(old.length/2),1,2));
 expect(changed).toHaveBeenCalledOnce();expect(status).toHaveBeenLastCalledWith(expect.stringMatching(/stale/i));session.close();
});
it('rejects an older assembled snapshot when only another seat readiness changed',async()=>{
 const changed=vi.fn(),status=vi.fn(),session=new MatchSession(changed,status);await session.join(invite,'p2');const send=mocks.transports[0].message;
 const old=JSON.stringify(welcome());send('host',frame('snapshot:10',old.slice(0,old.length/2),0,2));
 const newer=structuredClone(s);newer.players.p1.ready=true;
 send('host',frame('snapshot:11',JSON.stringify({...welcome(),snapshot:guestSnapshot(newer,'p2')})));
 expect(changed).toHaveBeenCalledOnce();expect(changed.mock.calls[0][0].players.p1.ready).toBe(true);
 send('host',frame('snapshot:10',old.slice(old.length/2),1,2));expect(changed).toHaveBeenCalledOnce();expect(status).toHaveBeenLastCalledWith(expect.stringMatching(/stale/i));session.close();
});

it('resets transfer ordinals on reconnect while preserving the revision fence',async()=>{
 const changed=vi.fn(),status=vi.fn(),session=new MatchSession(changed,status);await session.join(invite,'p2');const newer=structuredClone(s);newer.revision++;newer.turn++;
 const reply={...welcome(),snapshot:guestSnapshot(newer,'p2')};mocks.transports[0].message('host',frame('snapshot:100',JSON.stringify(reply)));expect(changed).toHaveBeenCalledOnce();
 await session.reconnect();const send=mocks.transports[1].message;send('host',frame('snapshot:1',JSON.stringify(welcome())));expect(changed).toHaveBeenCalledOnce();
 send('host',frame('snapshot:2',JSON.stringify(reply)));expect(changed).toHaveBeenCalledTimes(2);expect(status).toHaveBeenLastCalledWith('Connected as p2; filtered snapshot synchronized');session.close();
});
