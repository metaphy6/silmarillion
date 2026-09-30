import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  validateConvoy,
  startConvoy,
  progressConvoys,
  type RouteFinder,
} from "../src/simulation/transport";
const route: RouteFinder = (_s, a, b) => {
  const points = [{ ...a }];
  while (a.x !== b.x || a.y !== b.y) {
    a = {
      x: a.x + Math.sign(b.x - a.x),
      y: a.x === b.x ? a.y + Math.sign(b.y - a.y) : a.y,
    };
    points.push(a);
  }
  return points;
};
function setup() {
  const s = createMatch(["human_rohan", "human_gondor"], 12);
  const carrier = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  );
  if (!carrier) throw Error("worker fixture identity");
  carrier.move = 2;
  const origin = s.facilities["p1:core"];
  carrier.x = origin.x;
  carrier.y = origin.y;
  const destination = {
    ...structuredClone(origin),
    id: "p1:destination",
    x: origin.x + 4,
  };
  s.facilities[destination.id] = destination;
  return {
    s,
    carrier,
    origin,
    destination,
    request: {
      carrier: carrier.id,
      origin: origin.id,
      destination: destination.id,
      cargo: { P: 3, M: 4, K: 2, E: 1 },
    },
  };
}
it("pays existing cargo and provision then physically loads travels and unloads without copies", () => {
  const { s, carrier, request, destination } = setup(),
    before = structuredClone(s.players.p1.stock);
  const c = startConvoy(s, "p1", request, route);
  expect(s.players.p1.stock.P).toBe(before.P - 4);
  expect(c.cargo).toEqual(request.cargo);
  progressConvoys(s, route);
  expect(c.phase).toBe("travel");
  expect(carrier.x).toBe(4);
  progressConvoys(s, route);
  expect(carrier.x).toBe(4);
  s.turn++;
  progressConvoys(s, route);
  expect(carrier.x).toBe(6);
  s.turn++;
  progressConvoys(s, route);
  expect(carrier.x).toBe(destination.x);
  expect(c.phase).toBe("unloading");
  expect(s.players.p1.stock.M).toBe(before.M - 4);
  s.turn++;
  progressConvoys(s, route);
  expect(s.players.p1.stock).toEqual({ ...before, P: before.P - 1 });
  expect(s.convoys[c.id]).toBeUndefined();
  progressConvoys(s, route);
  expect(s.players.p1.stock.P).toBe(before.P - 1);
});
it("validates capacity, payment, staff and exclusive carrier identity before any mutation", () => {
  const { s, request, carrier, destination } = setup();
  const before = JSON.stringify(s);
  expect(
    validateConvoy(
      s,
      "p1",
      { ...request, cargo: { P: 21, M: 0, K: 0, E: 0 } },
      route,
    ),
  ).toContain("capacity");
  expect(JSON.stringify(s)).toBe(before);
  destination.workers = 0;
  expect(validateConvoy(s, "p1", request, route)).toContain("staffed");
  destination.workers = 1;
  for (const kind of ["hero", "construct", "dragon", "balrog"] as const) {
    carrier.kind = kind;
    expect(validateConvoy(s, "p1", request, route)).toContain("ordinary");
  }
  carrier.kind = "worker";
  s.players.p1.stock.P = 3;
  expect(validateConvoy(s, "p1", request, route)).toContain("1P");
});
it("dead or captured carriers leave irreversibly lost cargo at actual location", () => {
  for (const cause of ["dead", "captured"]) {
    const { s, carrier, request } = setup();
    const c = startConvoy(s, "p1", request, route);
    progressConvoys(s, route);
    s.turn++;
    progressConvoys(s, route);
    const at = { x: c.x, y: c.y };
    if (cause === "dead") carrier.alive = false;
    else carrier.owner = "p2";
    s.turn++;
    progressConvoys(s, route);
    expect(c.phase).toBe("lost");
    expect({ x: c.x, y: c.y }).toEqual(at);
    carrier.alive = true;
    carrier.owner = "p1";
    s.turn++;
    progressConvoys(s, route);
    expect(c.phase).toBe("lost");
    expect(c.cargo.M).toBe(4);
  }
});
it("destroyed endpoints and blocked paths stop cargo without rerouting or refund", () => {
  const { s, request, carrier, destination } = setup();
  const c = startConvoy(s, "p1", request, route);
  progressConvoys(s, route);
  s.turn++;
  destination.hp = 0;
  progressConvoys(s, route);
  expect(carrier.x).toBe(4);
  expect(c.pauseReason).toContain("endpoint");
  destination.hp = 10;
  s.turn++;
  progressConvoys(s, () => null);
  expect(carrier.x).toBe(4);
  expect(c.pauseReason).toContain("route");
});
it("reserves carrier and replays identically with serialized progress state", () => {
  const { s, request } = setup();
  startConvoy(s, "p1", request, route);
  expect(validateConvoy(s, "p1", request, route)).toContain("busy");
  const other = structuredClone(s);
  for (let i = 0; i < 4; i++) {
    progressConvoys(s, route);
    progressConvoys(other, route);
    s.turn++;
    other.turn++;
  }
  expect(s).toEqual(other);
});
it("rejects discontinuous routes and respects movement impairment instead of extra movement", () => {
  const { s, request, carrier, destination } = setup();
  expect(validateConvoy(s, "p1", request, (_s, a, b) => [a, b])).toContain(
    "continuous",
  );
  const c = startConvoy(s, "p1", request, route);
  progressConvoys(s, route);
  s.turn++;
  carrier.effects.push({
    kind: "root",
    value: 1,
    until: 99,
    source: "cast:test",
  });
  progressConvoys(s, route);
  expect(carrier.x).toBe(4);
  carrier.effects = [];
  s.turn++;
  carrier.effects.push({
    kind: "move-limit",
    value: 1,
    until: 99,
    source: "cast:test",
  });
  progressConvoys(s, route);
  expect(carrier.x).toBe(5);
  expect(c.x).toBe(carrier.x);
  expect(carrier.x).toBeLessThan(destination.x);
});
it("rejects corrupted saved cargo/progress but accepts a currently blocked historical route", async () => {
  const { validateConvoyState, isConvoyCarrier } =
    await import("../src/simulation/transport");
  const { s, request, carrier } = setup();
  const c = startConvoy(s, "p1", request, route);
  expect(() => validateConvoyState(s, c)).not.toThrow();
  expect(isConvoyCarrier(s, carrier.id)).toBe(true);
  for (const corrupt of [
    (x: typeof c) => (x.cargo.P = -1),
    (x: typeof c) => (x.lastProgress = s.turn + 1),
    (x: typeof c) => (x.index = 99),
    (x: typeof c) => (x.route[1].x += 5),
  ]) {
    const clone = structuredClone(s),
      bad = clone.convoys[c.id];
    corrupt(bad);
    expect(() => validateConvoyState(clone, bad)).toThrow();
  }
  s.map.terrain[c.route[1].y * s.map.width + c.route[1].x] = "cliff";
  expect(() => validateConvoyState(s, c)).not.toThrow();
  carrier.alive = false;
  progressConvoys(s, route);
  expect(c.phase).toBe("lost");
  expect(isConvoyCarrier(s, carrier.id)).toBe(false);
  expect(() => validateConvoyState(s, c)).not.toThrow();
});
it("settles immediate death and field recovery conserves the lost load identity", async () => {
  const { settleConvoyLosses, recoverCargoReason, recoverCargo } =
    await import("../src/simulation/transport");
  const { s, request, carrier } = setup();
  const c = startConvoy(s, "p1", request, route);
  carrier.alive = false;
  settleConvoyLosses(s);
  expect(c.phase).toBe("lost");
  const rescue = {
    ...structuredClone(carrier),
    id: "rescue",
    alive: true,
    hp: 20,
  };
  s.units.rescue = rescue;
  expect(recoverCargoReason(s, "p1", c.id, rescue.id, route)).toBe("");
  const before = structuredClone(s.players.p1.stock);
  recoverCargo(s, "p1", c.id, rescue.id, route);
  expect(c.id).toBe(Object.keys(s.convoys)[0]);
  expect(c.phase).toBe("loading");
  expect(c.cargo).toEqual(request.cargo);
  expect(s.players.p1.stock).toEqual({ ...before, P: before.P - 1 });
});
it("rerouting requires a paid staffed relay or Manwe and never moves cargo immediately", async () => {
  const { rerouteConvoyReason, rerouteConvoy } =
    await import("../src/simulation/transport");
  const { s, request } = setup();
  const c = startConvoy(s, "p1", request, route);
  const a = {
    convoy: c.id,
    destination: c.destination,
    method: "ordinary" as const,
    relay: c.origin,
  };
  expect(rerouteConvoyReason(s, "p1", a, route)).toContain("relay");
  s.facilities[c.origin].kind = "relay";
  const before = s.players.p1.stock.K;
  const pos = { x: c.x, y: c.y };
  rerouteConvoy(s, "p1", a, route);
  expect(s.players.p1.stock.K).toBe(before - 2);
  expect({ x: c.x, y: c.y }).toEqual(pos);
  expect(c.cargo).toEqual(request.cargo);
});
it("Manwe replaces only the relay without supplying free cargo or extra movement", async () => {
  const { rerouteConvoyReason, rerouteConvoy } =
    await import("../src/simulation/transport");
  const { s, request, carrier } = setup();
  const c = startConvoy(s, "p1", request, route);
  s.players.p1.profile = "manwe";
  s.players.p1.hero.status = "living";
  const h = {
    ...structuredClone(carrier),
    id: s.players.p1.hero.id,
    kind: "hero" as const,
  };
  s.units[h.id] = h;
  s.players.p1.hero.readiness = 6;
  const a = {
    convoy: c.id,
    destination: c.destination,
    method: "power" as const,
  };
  const stocks = structuredClone(s.players.p1.stock),
    pos = { x: c.x, y: c.y };
  expect(rerouteConvoyReason(s, "p1", a, route)).toBe("");
  rerouteConvoy(s, "p1", a, route);
  expect(s.players.p1.hero.readiness).toBe(3);
  expect(s.players.p1.stock).toEqual(stocks);
  expect({ x: c.x, y: c.y }).toEqual(pos);
  expect(c.cargo).toEqual(request.cargo);
  s.players.p1.hero.status = "captive";
  expect(rerouteConvoyReason(s, "p1", a, route)).toContain("Living Manwë");
});
it("filtered lost-cargo views can omit foreign references without weakening authoritative saves", async () => {
  const { settleConvoyLosses, validateConvoyState } =
    await import("../src/simulation/transport");
  const { s, request, carrier } = setup();
  const c = startConvoy(s, "p1", request, route);
  carrier.owner = "p2";
  settleConvoyLosses(s);
  delete s.units[carrier.id];
  delete s.facilities[c.destination];
  expect(() => validateConvoyState(s, c, true)).not.toThrow();
  expect(() => validateConvoyState(s, c)).toThrow();
});
it("charges web/threshold movement costs and emits observations only for actually traveled tiles", () => {
  const { s, request, carrier } = setup();
  carrier.move = 3;
  startConvoy(s, "p1", request, route);
  s.zones.web = {
    id: "web",
    owner: "p2",
    kind: "web",
    x: 5,
    y: 4,
    dx: 0,
    dy: 1,
    radius: 0.35,
    until: 99,
    triggered: false,
  };
  s.zones.threshold = {
    id: "threshold",
    owner: "p2",
    kind: "threshold",
    x: 5,
    y: 4,
    dx: 0,
    dy: 1,
    radius: 0.35,
    until: 99,
    triggered: false,
  };
  const events = s.events.length;
  progressConvoys(s, route);
  expect(s.events).toHaveLength(events);
  expect(s.zones.threshold.triggered).toBe(false);
  s.turn++;
  progressConvoys(s, route);
  expect(carrier.x).toBe(6);
  expect(s.zones.threshold.triggered).toBe(true);
  expect(s.events.some((e) => e.text.includes("Web crossing observed"))).toBe(
    true,
  );
});
it("treats movement impairment as a penalty rather than a one-tile cap", () => {
  const { s, request, carrier } = setup();
  carrier.move = 4;
  carrier.effects.push({
    kind: "movement-impairment",
    value: 1,
    until: 99,
    source: "injury:test",
  });
  startConvoy(s, "p1", request, route);
  progressConvoys(s, route);
  s.turn++;
  progressConvoys(s, route);
  expect(carrier.x).toBe(7);
});
