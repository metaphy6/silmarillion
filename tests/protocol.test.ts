import { it, expect } from "vitest";
import { createMatch, validate } from "../src/simulation/engine";
import { HostAuthority, guestSnapshot } from "../src/network/protocol";
import { VERSION } from "../src/simulation/types";
import { parseMatch } from "../src/simulation/schema";
it("validates an own crossing after an unseen endpoint is captured without trusting malformed spans", () => {
  const s = createMatch(["human_rohan", "spider_brood"], 6);
  const base = s.facilities["p2:core"];
  s.facilities.bankA = {
    ...base,
    id: "bankA",
    kind: "crossing-anchor",
    x: 1,
    y: 1,
  };
  s.facilities.bankB = {
    ...base,
    id: "bankB",
    kind: "crossing-anchor",
    owner: "p1",
    x: 4,
    y: 1,
  };
  for (let x = 2; x <= 3; x++) s.map.terrain[s.map.width + x] = "cliff";
  const worker = Object.values(s.units).find(
    (u) => u.owner === "p2" && u.kind === "worker",
  )!;
  s.crossings.bridge = {
    id: "bridge",
    owner: "p2",
    kind: "silk",
    from: "bankA",
    to: "bankB",
    crew: worker.id,
    tiles: [1, 2, 3, 4].map((x) => ({ x, y: 1 })),
    hp: 60,
    maxHp: 60,
    phase: "ready",
    started: 1,
    lastProgress: 1,
  };
  expect(() => parseMatch(s)).not.toThrow();
  const view = guestSnapshot(s, "p2");
  expect(view.facilities.bankA).toBeDefined();
  expect(view.facilities.bankB).toBeUndefined();
  expect(() => parseMatch(view, "p2")).not.toThrow();
  expect(() => parseMatch(view)).toThrow();
  for (const tiles of [
    [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ],
    [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
    ],
  ]) {
    const bad = structuredClone(view);
    bad.crossings.bridge.tiles = tiles;
    expect(() => parseMatch(bad, "p2")).toThrow();
  }
});
import {
  encodeCheckpoint,
  decodeCheckpoint,
} from "../src/persistence/checkpoints";
it("projects a silhouette without identity, allegiance, equipment or authoritative save access", () => {
  const s = createMatch(["varda", "human_gondor"], 6);
  s.map.terrain.fill("meadow");s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
  const enemy = s.units["p1:company:0"];
  const observer = s.units["p2:company:0"];
  Object.assign(observer, { x: 10, y: 10 });
  Object.assign(enemy, { x: 12, y: 10 });
  enemy.effects.push({
    kind: "concealed",
    value: 1,
    until: 10,
    source: "test",
  });
  s.zones.light = {
    id: "light",
    owner: "p1",
    kind: "light",
    x: 12,
    y: 10,
    dx: 0,
    dy: 0,
    radius: 1,
    until: 10,
    triggered: false,
  };
  const out = guestSnapshot(s, "p2");
  expect(out.units[enemy.id]).toBeUndefined();
  expect(out.contacts).toContainEqual({ x: 12, y: 10 });
  expect(Object.keys(out.contacts![0])).toEqual(["x", "y"]);
  s.warnings.push({
    id: "warn",
    seat: "p1",
    power: "field",
    target: enemy.id,
    x: 12,
    y: 10,
    due: s.revision + 1,
  });
  expect(guestSnapshot(s, "p2").warnings[0].target).toBe("unidentified");
  expect(() => parseMatch(out, "p2")).not.toThrow();
  expect(() => encodeCheckpoint(out)).toThrow("Guest observations");
  const command = {
    id: "attack-hidden",
    seat: "p2",
    seq: 1,
    turn: s.turn,
    revision: s.revision,
    action: { kind: "attack" as const, unit: observer.id, target: enemy.id },
  };
  expect(validate(s, command)).toContain("observed");
  expect(s.units[enemy.id].effects).toHaveLength(1);
});
it("reveals the guest's bilateral offers without exposing third-party relations", () => {
  const s = createMatch(["human_rohan", "human_gondor", "human_numenor"], 6);
  s.players.p1.relations = { p2: "peace", p3: "alliance" };
  s.players.p2.relations = { p1: "peace", p3: "war" };
  s.players.p3.relations = { p1: "alliance" };
  const view = guestSnapshot(s, "p2");
  expect(view.players.p1.relations).toEqual({ p2: "peace" });
  expect(view.players.p2.relations).toEqual(s.players.p2.relations);
  expect(view.players.p3.relations).toEqual({});
  expect(s.players.p1.relations.p3).toBe("alliance");
});
it("shows owned and observed enemy zones without leaking zones beyond sight", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 6);
  const own = Object.values(s.units).find((u) => u.owner === "p2")!;
  s.zones.own = {
    id: "own",
    owner: "p2",
    kind: "web",
    x: 0,
    y: 0,
    dx: 1,
    dy: 0,
    radius: 1,
    until: 3,
    triggered: false,
  };
  s.zones.observed = {
    ...s.zones.own,
    id: "observed",
    owner: "p1",
    x: own.x,
    y: own.y,
  };
  s.zones.hidden = { ...s.zones.own, id: "hidden", owner: "p1" };
  const view = guestSnapshot(s, "p2");
  expect(view.zones.own).toEqual(s.zones.own);
  expect(view.zones.observed).toEqual(s.zones.observed);
  expect(view.zones.hidden).toBeUndefined();
  expect(s.zones.hidden).toBeDefined();
});
it("keeps owned convoy plans private while leaving visible enemy carriers selectable", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 6);
  const own = Object.values(s.units).find((u) => u.owner === "p2")!;
  const enemy = Object.values(s.units).find((u) => u.owner === "p1")!;
  enemy.x = own.x;
  enemy.y = own.y;
  s.convoys.own = {
    id: "own",
    owner: "p2",
    carrier: own.id,
    origin: "own-origin",
    destination: "own-destination",
    cargo: { P: 1, M: 2, K: 3, E: 4 },
    supplies: { P: 2, M: 0, K: 0, E: 0 },
    capacity: 20,
    route: [{ x: own.x, y: own.y }],
    index: 0,
    phase: "loading",
    started: 1,
    lastProgress: 1,
    x: own.x,
    y: own.y,
  };
  s.convoys.enemy = {
    ...s.convoys.own,
    id: "enemy",
    owner: "p1",
    carrier: enemy.id,
    destination: "secret-enemy-destination",
    cargo: { P: 0, M: 0, K: 0, E: 19 },
    route: [{ x: 0, y: 0 }],
  };
  const view = guestSnapshot(s, "p2");
  expect(view.convoys.own).toEqual(s.convoys.own);
  expect(view.convoys.enemy).toBeUndefined();
  expect(view.units[enemy.id]).toBeDefined();
  expect(JSON.stringify(view)).not.toContain("secret-enemy-destination");
  expect(s.convoys.enemy.cargo.E).toBe(19);
});
it("hides visible enemy repair queues while retaining the guest's paid work", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 6);
  const own = Object.values(s.facilities).find((f) => f.owner === "p2")!;
  const enemy = Object.values(s.facilities).find((f) => f.owner === "p1")!;
  enemy.x = own.x;
  enemy.y = own.y;
  own.repair = {
    id: "paid-repair",
    target: "private-item",
    kind: "item",
    remaining: 1,
    started: 1,
    cost: { P: 1, M: 2, K: 3, E: 4 },
    amount: 10,
    method: "ordinary",
    accelerated: false,
  };
  enemy.repair = { ...own.repair, id: "enemy-repair", target: "enemy-secret" };
  const view = guestSnapshot(s, "p2");
  expect(view.facilities[enemy.id]).toBeDefined();
  expect(view.facilities[enemy.id].repair).toBeUndefined();
  expect(view.facilities[own.id].repair).toEqual(own.repair);
  expect(enemy.repair.target).toBe("enemy-secret");
});
it("shows reclaimable visible dropped equipment without leaking hidden or enemy-carried items", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 6);
  const u = Object.values(s.units).find((u) => u.owner === "p2")!;
  s.items.drop = {
    id: "drop",
    name: "Recovered sword",
    owner: null,
    bearer: null,
    x: u.x,
    y: u.y,
    durability: 100,
    maxDurability: 100,
    crafted: true,
    materials: ["metal"],
    bonus: 1,
  };
  s.items.enemy = {
    ...s.items.drop,
    id: "enemy",
    owner: "p1",
    bearer: "p1:company",
  };
  s.items.hidden = { ...s.items.drop, id: "hidden", x: 0, y: 0 };
  const view = guestSnapshot(s, "p2");
  expect(view.items.drop).toEqual(s.items.drop);
  expect(view.items.enemy).toBeUndefined();
  expect(view.items.hidden).toBeUndefined();
  const order = {
    id: "equip-drop",
    seat: "p2",
    seq: 1,
    turn: s.turn,
    revision: s.revision,
    action: { kind: "equip" as const, unit: u.id, item: "drop" },
  };
  expect(validate(view, order)).toBe("");
  expect(validate(s, order)).toBe("");
});
it("preserves guest-issued recovery credential when first welcome is interrupted", () => {
  const h = new HostAuthority(
    createMatch(["human_rohan", "human_gondor"], 4),
    "invite-capability-0123456789",
  );
  const token = "guest-issued-012345678901234567890123456789";
  const hello = JSON.stringify({
    type: "hello",
    version: VERSION,
    invite: "invite-capability-0123456789",
    seat: "p2",
    token,
  });
  expect(h.receive("first", hello, 0)).toMatchObject({
    type: "welcome",
    token,
  });
  // A transport-close event may lag behind the fresh authenticated reconnect.
  expect(h.receive("returning", hello, 1)).toMatchObject({
    type: "welcome",
    token,
  });
  expect(h.receive("first", JSON.stringify({ type: "sync" }), 2).type).toBe(
    "error",
  );
  h.disconnect("first");
  expect(h.assignments.p2).toBe("returning");
});
it("restores committed checkpoints with seat credentials and dedup across old revisions", () => {
  const h = new HostAuthority(
    createMatch(["human_rohan", "human_gondor"], 5),
    "invite-capability-0123456789",
  );
  const hello = (token: string) =>
    JSON.stringify({
      type: "hello",
      version: VERSION,
      invite: "invite-capability-0123456789",
      seat: "p2",
      token,
    });
  const joined = h.receive("peer", hello(""), 0);
  expect(joined.type).toBe("welcome");
  if (joined.type !== "welcome") throw new Error("No welcome");
  const order = {
    id: "ready-guest",
    seat: "p2",
    seq: 1,
    turn: 1,
    revision: 0,
    action: { kind: "ready" },
  };
  expect(
    h.receive("peer", JSON.stringify({ type: "order", order }), 1),
  ).toMatchObject({ type: "receipt", ok: true });
  h.local({
    ...order,
    id: "ready-host",
    seat: "p1",
    action: { kind: "ready" },
  });
  h.resolve();
  const saved = decodeCheckpoint(
    encodeCheckpoint(h.state, h.assignments, h.seatTokens),
  );
  const restored = new HostAuthority(
    saved.state,
    "invite-capability-0123456789",
    saved.seatTokens,
  );
  expect(restored.canResolve()).toBe(false);
  expect(restored.receive("impostor", hello(""), 2).type).toBe("error");
  expect(restored.receive("new-peer", hello(joined.token), 3).type).toBe(
    "welcome",
  );
  expect(
    restored.receive("new-peer", JSON.stringify({ type: "order", order }), 4),
  ).toMatchObject({ type: "receipt", ok: true, message: "Already accepted" });
  expect(restored.state.orders).toHaveLength(0);
  expect(restored.state.nextSeq.p2).toBe(2);
  expect(
    restored.receive(
      "new-peer",
      JSON.stringify({
        type: "order",
        order: { ...order, id: "stale-new", seq: 2 },
      }),
      5,
    ),
  ).toMatchObject({
    type: "receipt",
    ok: false,
    message: "Stale turn or revision; synchronize",
  });
});
it("rejects unauthorized identity, oversized/malformed and stale commands; retries are exactly once", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 1);
  const h = new HostAuthority(s, "invite-capability-0123456789");
  const join = h.receive(
    "peer-b",
    JSON.stringify({
      type: "hello",
      version: VERSION,
      invite: "invite-capability-0123456789",
      seat: "p2",
      token: "",
    }),
    0,
  );
  expect(join.type).toBe("welcome");
  const order = {
    id: "p2:1:1",
    seat: "p2",
    seq: 1,
    turn: 1,
    revision: 0,
    action: { kind: "exchange" },
  };
  const msg = JSON.stringify({ type: "order", order });
  expect(h.receive("stranger", msg, 1).type).toBe("error");
  expect(h.receive("peer-b", msg, 2).type).toBe("receipt");
  expect(h.receive("peer-b", msg, 3).type).toBe("receipt");
  expect(h.state.orders).toHaveLength(1);
  expect(
    h.receive(
      "peer-b",
      JSON.stringify({
        type: "order",
        order: { ...order, action: { kind: "ready" } },
      }),
      3.1,
    ),
  ).toMatchObject({
    type: "receipt",
    ok: false,
    message: "Command ID collision",
  });
  expect(h.state.orders).toHaveLength(1);
  expect(h.receive("peer-b", "x".repeat(17000), 4).type).toBe("error");
  expect(h.receive("peer-b", "{bad", 5).type).toBe("error");
  expect(
    h.receive(
      "peer-b",
      JSON.stringify({
        type: "order",
        order: { ...order, id: "next", seat: "p1" },
      }),
      6,
    ).type,
  ).toBe("error");
});
it("filters every guest channel and authenticates seat restoration", () => {
  const s = createMatch(["human_rohan", "human_gondor"], 2);
  s.events.push({ id: 9, turn: 1, text: "secret", audience: ["p1"] });
  s.players.p1.stock.E = 999;
  const h = new HostAuthority(s, "invite-capability-0123456789");
  const welcome = h.receive(
    "b",
    JSON.stringify({
      type: "hello",
      version: VERSION,
      invite: "invite-capability-0123456789",
      seat: "p2",
      token: "",
    }),
    0,
  );
  expect(welcome.type).toBe("welcome");
  if (welcome.type !== "welcome") return;
  const view = guestSnapshot(s, "p2");
  expect(JSON.stringify(view)).not.toContain("secret");
  expect(view.players.p1.stock.E).toBe(0);
  expect(view.rng).toBe(0);
  expect(Object.values(view.units).some((u) => u.owner === "p1")).toBe(false);
  h.disconnect("b");
  expect(
    h.receive(
      "evil",
      JSON.stringify({
        type: "hello",
        version: VERSION,
        invite: "invite-capability-0123456789",
        seat: "p2",
        token: "",
      }),
      1,
    ).type,
  ).toBe("error");
  expect(
    h.receive(
      "new-b",
      JSON.stringify({
        type: "hello",
        version: VERSION,
        invite: "invite-capability-0123456789",
        seat: "p2",
        token: welcome.token,
      }),
      2,
    ).type,
  ).toBe("welcome");
});
it('reserves a distinct returning capability per guest seat',()=>{
 const state=createMatch(['human_rohan','human_gondor','human_numenor'],8),invite='private-room-capability-0123456789',token='distinct-seat-capability-01234567890123456789',host=new HostAuthority(state,invite);
 const hello=(seat:string)=>JSON.stringify({type:'hello',version:VERSION,invite,seat,token});
 expect(host.receive('peer2',hello('p2'),0).type).toBe('welcome');expect(host.receive('peer3',hello('p3'),1)).toMatchObject({type:'error',message:'Rejoin credential already belongs to another seat'});expect(host.assignments.p2).toBe('peer2');expect(host.assignments.p3).toBeUndefined();
});
it('retains exactly-once receipt identity through repeated host restoration and stale-peer retries',()=>{
 const invite='restore-room-capability-0123456789',token='restore-seat-capability-01234567890123456789';let host=new HostAuthority(createMatch(['human_rohan','human_gondor'],31),invite);const hello=JSON.stringify({type:'hello',version:VERSION,invite,seat:'p2',token});expect(host.receive('original',hello,0).type).toBe('welcome');
 const guest={id:'committed-guest',seat:'p2',seq:1,turn:1,revision:0,action:{kind:'ready' as const}};expect(host.receive('original',JSON.stringify({type:'order',order:guest}),1)).toMatchObject({type:'receipt',ok:true});expect(host.local({...guest,id:'committed-host',seat:'p1'}).ok).toBe(true);host.resolve();const committed=structuredClone(host.state);
 for(let n=0;n<64;n++){
  const saved=decodeCheckpoint(encodeCheckpoint(host.state,host.assignments,host.seatTokens));host=new HostAuthority(saved.state,invite,saved.seatTokens);expect(host.canResolve()).toBe(false);expect(host.receive(`peer-${n}`,hello,n*1000).type).toBe('welcome');
  for(let retry=0;retry<3;retry++)expect(host.receive(`peer-${n}`,JSON.stringify({type:'order',order:guest}),n*1000+retry+1)).toMatchObject({type:'receipt',ok:true,message:'Already accepted'});
  expect(host.receive('stale-peer',JSON.stringify({type:'order',order:guest}),n*1000+5).type).toBe('error');expect(host.state).toEqual(committed);expect(host.state.orders).toHaveLength(0);
 }
});
