import { describe, it, expect } from "vitest";
import {
  createRTS,
  stepRTS,
  commandRTS,
  serializeRTS,
  parseRTS,
} from "../src/simulation/rts";
describe("continuous skirmish", () => {
  it("moves without weekly operations and survives deterministic save continuation", () => {
    const s = createRTS(7);
    const u = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "soldier",
    )!;
    expect(
      commandRTS(s, "p1", {
        kind: "order",
        units: [u.id],
        order: { kind: "move", x: 10, y: 8 },
      }).ok,
    ).toBe(true);
    stepRTS(s, 40);
    expect(u.x).toBeGreaterThan(7);
    const c = parseRTS(serializeRTS(s));
    stepRTS(s, 20);
    stepRTS(c, 20);
    expect(c).toEqual(s);
  });
  it("pays once and rejects duplicate or foreign commands", () => {
    const s = createRTS();
    const b = Object.values(s.buildings).find(
      (b) => b.owner === "p1" && b.kind === "keep",
    )!;
    const before = s.players.p1.stock.P;
    expect(
      commandRTS(
        s,
        "p1",
        { kind: "produce", building: b.id, product: "worker" },
        1,
      ).ok,
    ).toBe(true);
    const paid = s.players.p1.stock.P;
    expect(paid).toBeLessThan(before);
    expect(
      commandRTS(
        s,
        "p1",
        { kind: "produce", building: b.id, product: "worker" },
        1,
      ).ok,
    ).toBe(false);
    expect(s.players.p1.stock.P).toBe(paid);
    expect(
      commandRTS(s, "p2", {
        kind: "produce",
        building: b.id,
        product: "worker",
      }).ok,
    ).toBe(false);
  });
});

describe("RTS economy and invariants", () => {
  it("gathers finite cargo then credits only physical delivery", () => {
    const s = createRTS();
    s.players.p2.ai = false;
    const u = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
    for (const v of Object.values(s.units)) v.orders = [];
    const r = Object.values(s.resources).find(
      (r) => r.kind === "M" && r.x < 20,
    )!;
    u.x = r.x;
    u.y = r.y;
    const stock = s.players.p1.stock.M,
      amount = r.amount;
    commandRTS(s, "p1", {
      kind: "order",
      units: [u.id],
      order: { kind: "gather", target: r.id },
    });
    stepRTS(s, 30);
    expect(r.amount).toBeLessThan(amount);
    expect(s.players.p1.stock.M).toBe(stock);
    expect(u.cargo.M).toBeGreaterThan(0);
    stepRTS(s, 200);
    expect(s.players.p1.stock.M).toBeGreaterThan(stock);
  });
  it("reserves hero slot and full recipe before production, recreates with new component", () => {
    const s = createRTS();
    s.players.p2.ai = false;
    const p = s.players.p1,
      b = Object.values(s.buildings).find(
        (b) => b.owner === "p1" && b.kind === "keep",
      )!;
    p.stock = { P: 9999, M: 9999, K: 9999, E: 9999 };
    expect(
      commandRTS(s, "p1", { kind: "produce", building: b.id, product: "hero" })
        .ok,
    ).toBe(false);
    p.component = 2;
    expect(
      commandRTS(s, "p1", { kind: "produce", building: b.id, product: "hero" })
        .ok,
    ).toBe(true);
    expect(p.hero.status).toBe("pending");
    expect(
      commandRTS(s, "p1", { kind: "produce", building: b.id, product: "hero" })
        .ok,
    ).toBe(false);
    const full = b.queue[0].cost;
    stepRTS(s, b.queue[0].remaining);
    expect(p.hero.status).toBe("living");
    p.hero.status = "captive";
    expect(
      commandRTS(s, "p1", { kind: "produce", building: b.id, product: "hero" })
        .ok,
    ).toBe(false);
    commandRTS(s, "p1", { kind: "surrender-hero" });
    const prior = p.stock.M;
    expect(
      commandRTS(s, "p1", { kind: "produce", building: b.id, product: "hero" })
        .ok,
    ).toBe(true);
    expect(prior - p.stock.M).toBe(full.M);
    expect(p.component).toBe(0);
  });
  it("routes an army across the river through the crossing", () => {
    const s = createRTS();
    s.players.p2.ai = false;
    for (const u of Object.values(s.units)) u.orders = [];
    const army = Object.values(s.units).filter(
      (u) => u.owner === "p1" && u.kind !== "worker",
    );
    commandRTS(s, "p1", {
      kind: "order",
      units: army.map((u) => u.id),
      order: { kind: "move", x: 29, y: 12 },
    });
    for (let i = 0; i < 220; i++) {
      stepRTS(s);
      for (const u of army)
        expect(s.terrain[Math.round(u.y) * s.width + Math.round(u.x)]).not.toBe(
          "water",
        );
    }
    expect(army.every((u) => u.x > 25)).toBe(true);
  });
  it("construction needs paid workers and completes over time", () => {
    const s = createRTS();
    s.players.p2.ai = false;
    const workers = Object.values(s.units)
      .filter((u) => u.owner === "p1" && u.kind === "worker")
      .slice(0, 2);
    const before = s.players.p1.stock.M;
    expect(
      commandRTS(s, "p1", {
        kind: "build",
        building: "tower",
        x: 11,
        y: 12,
        workers: workers.map((u) => u.id),
      }).ok,
    ).toBe(true);
    expect(s.players.p1.stock.M).toBeLessThan(before);
    const tower = Object.values(s.buildings).find((b) => b.kind === "tower")!;
    expect(tower.progress).toBe(0);
    stepRTS(s, 220);
    expect(tower.progress).toBe(1);
  });
  it("AI recruits, gathers and launches purposeful raids", () => {
    const s = createRTS();
    stepRTS(s, 700);
    expect(
      Object.values(s.units).filter(
        (u) => u.owner === "p2" && u.kind !== "worker",
      ).length,
    ).toBeGreaterThan(4);
    expect(
      Object.values(s.units).some((u) => u.owner === "p2" && u.x < 35),
    ).toBe(true);
  });
  it("rejects invalid saves and guest projections", () => {
    const s = createRTS();
    expect(() => parseRTS(JSON.stringify({ ...s, version: "weekly" }))).toThrow(
      /Incompatible/,
    );
    s.players.p1.stock.M = -1;
    expect(() => parseRTS(serializeRTS(s))).toThrow();
  });
});

describe("untrusted realtime boundaries", () => {
  it("rejects enemy order and queue leakage in guest views", async () => {
    const { rtsSnapshot } = await import("../src/simulation/rts");
    const s = createRTS();
    const p2 = Object.values(s.units).find((u) => u.owner === "p2")!;
    p2.x = 7;
    p2.y = 8;
    p2.cargo.E = 12;
    p2.orders = [{ kind: "move", x: 42, y: 25 }];
    const view = rtsSnapshot(s, "p1");
    expect(view.units[p2.id].orders).toEqual([]);
    expect(view.units[p2.id].cargo.E).toBe(0);
    expect(view.players.p2.stock.M).toBe(0);
    expect(() => parseRTS(serializeRTS(view))).toThrow();
  });
  it("rejects malformed save queues, positions, duplicate heroes and unknown kinds", () => {
    for (const mutate of [
      (s: ReturnType<typeof createRTS>) => {
        Object.values(s.units)[0].hp = NaN;
      },
      (s: ReturnType<typeof createRTS>) => {
        Object.values(s.buildings)[0].queue = [
          {
            product: "worker",
            remaining: -1,
            total: 1,
            cost: { P: 0, M: 0, K: 0, E: 0 },
          },
        ];
      },
      (s: ReturnType<typeof createRTS>) => {
        s.players.p1.profile = "melkor_dark_architect";
      },
    ]) {
      const s = createRTS();
      mutate(s);
      expect(() => parseRTS(serializeRTS(s))).toThrow();
    }
  });
  it("rejects nonfinite commands without corrupting state", () => {
    const s = createRTS();
    expect(
      commandRTS(s, "p1", {
        kind: "build",
        building: "wall",
        x: NaN,
        y: 10,
        workers: [],
      }).ok,
    ).toBe(false);
    expect(
      commandRTS(s, "p1", {
        kind: "rally",
        building: Object.values(s.buildings)[0].id,
        x: Infinity,
        y: 0,
      }).ok,
    ).toBe(false);
  });
});

describe("skirmish completion and hero commitments", () => {
  it("a passive player eventually loses to economic AI siege pressure", () => {
    const s = createRTS(9);
    stepRTS(s, 6000);
    expect(s.winner).toBe("p2");
  }, 20000);
  it("destroying the enemy citadel ends the match and freezes simulation", () => {
    const s = createRTS();
    const keep = Object.values(s.buildings).find(
      (b) => b.owner === "p2" && b.kind === "keep",
    )!;
    keep.hp = 0;
    stepRTS(s);
    expect(s.winner).toBe("p1");
    const tick = s.tick;
    stepRTS(s, 100);
    expect(s.tick).toBe(tick);
  });
  it("keeps prisoners stationary and rejects forged instant hero queues", () => {
    const s = createRTS();
    s.players.p2.ai = false;
    const p = s.players.p1,
      b = Object.values(s.buildings).find(
        (b) => b.owner === "p1" && b.kind === "keep",
      )!;
    p.stock = { P: 1000, M: 1000, K: 1000, E: 1000 };
    p.component = 1;
    commandRTS(s, "p1", { kind: "produce", building: b.id, product: "hero" });
    const saved = structuredClone(s);
    saved.buildings[b.id].queue[0].remaining = 1;
    saved.buildings[b.id].queue[0].total = 1;
    expect(() => parseRTS(serializeRTS(saved))).toThrow();
    stepRTS(s, b.queue[0].remaining);
    const hero = s.units[p.hero.id];
    p.hero.status = "captive";
    const at = { x: hero.x, y: hero.y };
    commandRTS(s, "p1", {
      kind: "order",
      units: [hero.id],
      order: { kind: "move", x: 15, y: 12 },
    });
    stepRTS(s, 50);
    expect({ x: hero.x, y: hero.y }).toEqual(at);
  });
  it("Gondor repairs with physical worker and paid materials, never casts generic damage", () => {
    const s = createRTS();
    s.players.p2.ai = false;
    const p = s.players.p1,
      b = Object.values(s.buildings).find(
        (b) => b.owner === "p1" && b.kind === "keep",
      )!;
    p.stock = { P: 1000, M: 1000, K: 1000, E: 1000 };
    p.component = 1;
    commandRTS(s, "p1", { kind: "produce", building: b.id, product: "hero" });
    stepRTS(s, b.queue[0].remaining);
    const h = s.units[p.hero.id],
      w = Object.values(s.units).find(
        (u) => u.owner === "p1" && u.kind === "worker",
      )!;
    h.x = 7;
    h.y = 9;
    h.orders = [];
    w.x = 5;
    w.y = 9;
    w.orders = [];
    b.hp = 500;
    const m = p.stock.M;
    expect(commandRTS(s, "p1", { kind: "ability", x: b.x, y: b.y }).ok).toBe(
      true,
    );
    expect(p.stock.M).toBe(m - 10);
    stepRTS(s, 40);
    expect(b.hp).toBe(950);
  });
});

it("wins through paid economy, fortification, recruitment, scouting and siege", () => {
  const s = createRTS(42);
  const own = () =>
    Object.values(s.units).filter((u) => u.owner === "p1" && u.hp > 0);
  const keep = Object.values(s.buildings).find(
    (b) => b.owner === "p1" && b.kind === "keep",
  )!;
  let attacked = false,
    builtWorkshop = false,
    builtTower = false,
    producedSiege = false;
  const ps = Object.values(s.resources).find(
      (r) => r.kind === "P" && r.x < 20,
    )!,
    ms = Object.values(s.resources).find((r) => r.kind === "M" && r.x < 20)!;
  for (let t = 0; t < 9000 && !s.winner; t++) {
    if (t % 50 === 0) {
      const workers = own().filter((u) => u.kind === "worker"),
        army = own().filter((u) => u.kind !== "worker");
      if (workers.length < 8 && keep.queue.length < 2)
        commandRTS(s, "p1", {
          kind: "produce",
          building: keep.id,
          product: "worker",
        });
      for (let i = 0; i < workers.length; i++)
        if (!workers[i].orders.length || workers[i].orders[0].kind === "gather")
          commandRTS(s, "p1", {
            kind: "order",
            units: [workers[i].id],
            order: {
              kind: "gather",
              target:
                i === 6
                  ? Object.values(s.resources).find(
                      (r) => r.kind === "K" && r.x < 20,
                    )!.id
                  : i % 2 === 0
                    ? ps.id
                    : ms.id,
            },
          });
      const buildings = Object.values(s.buildings).filter(
        (b) => b.owner === "p1" && b.hp > 0,
      );
      if (!builtTower && workers[0])
        builtTower = commandRTS(s, "p1", {
          kind: "build",
          building: "tower",
          x: 11,
          y: 10,
          workers: [workers[0].id, workers[1].id],
        }).ok;
      if (t > 250 && !builtWorkshop && workers[2])
        builtWorkshop = commandRTS(s, "p1", {
          kind: "build",
          building: "workshop",
          x: 8,
          y: 15,
          workers: [workers[2].id, workers[3].id],
        }).ok;
      for (const b of buildings)
        if (b.progress === 1 && b.queue.length < 2) {
          if (
            b.kind === "barracks" &&
            army.filter((u) => u.kind !== "siege").length < 10
          )
            commandRTS(s, "p1", {
              kind: "produce",
              building: b.id,
              product: army.length % 3 === 0 ? "archer" : "soldier",
            });
          if (
            b.kind === "workshop" &&
            army.filter((u) => u.kind === "siege").length < 2
          )
            producedSiege =
              commandRTS(s, "p1", {
                kind: "produce",
                building: b.id,
                product: "siege",
              }).ok || producedSiege;
        }
      if (army.length >= 12 || attacked) {
        attacked = true;
        const idle = army.filter((u) => !u.orders.length);
        if (idle.length)
          commandRTS(s, "p1", {
            kind: "order",
            units: idle.map((u) => u.id),
            order: { kind: "attackMove", x: 40, y: 21 },
          });
        for (const siege of army.filter(
          (u) => u.kind === "siege" && u.ammo === 0,
        )) {
          const worker = workers.find((w) => w.orders[0]?.kind === "gather");
          if (worker)
            commandRTS(s, "p1", {
              kind: "order",
              units: [worker.id],
              order: { kind: "supply", target: siege.id },
            });
        }
      }
    }
    stepRTS(s);
  }
  expect(builtTower).toBe(true);
  expect(builtWorkshop).toBe(true);
  expect(
    producedSiege,
    JSON.stringify({
      tick: s.tick,
      stocks: s.players.p1.stock,
      buildings: Object.values(s.buildings).filter((b) => b.owner === "p1"),
    }),
  ).toBe(true);
  expect(s.explored.p1.some((n) => n % 48 > 35)).toBe(true);
  expect(
    s.winner,
    JSON.stringify({
      tick: s.tick,
      stock: s.players.p1.stock,
      army: own().map((u) => ({ k: u.kind, x: u.x, y: u.y, h: u.hp })),
      keeps: Object.values(s.buildings)
        .filter((b) => b.kind === "keep")
        .map((b) => b.hp),
    }),
  ).toBe("p1");
  expect(parseRTS(serializeRTS(s))).toEqual(s);
}, 30000);

it("rejects unreachable ground orders and reports routes obstructed after acceptance", () => {
  const s = createRTS();
  s.players.p2.ai = false;
  const u = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "soldier",
  )!;
  for (const [x, y] of [
    [14, 10],
    [16, 10],
    [15, 9],
    [15, 11],
  ])
    s.terrain[y * s.width + x] = "cliff";
  expect(
    commandRTS(s, "p1", {
      kind: "order",
      units: [u.id],
      order: { kind: "move", x: 15, y: 10 },
    }),
  ).toMatchObject({ ok: false, reason: expect.stringMatching(/route|reach/i) });
  const d = createRTS();
  d.players.p2.ai = false;
  const du = Object.values(d.units).find(
    (u) => u.owner === "p1" && u.kind === "soldier",
  )!;
  expect(
    commandRTS(d, "p1", {
      kind: "order",
      units: [du.id],
      order: { kind: "move", x: 15, y: 10 },
    }).ok,
  ).toBe(true);
  const template = Object.values(d.buildings)[0];
  for (const [x, y] of [
    [14, 10],
    [16, 10],
    [15, 9],
    [15, 11],
  ]) {
    const id = `b${d.nextId++}`;
    d.buildings[id] = { ...structuredClone(template), id, kind: "wall", x, y };
  }
  stepRTS(d, 80);
  expect(du.orders).toEqual([]);
  expect(
    d.events.some(
      (e) => e.text.includes("Route blocked") && e.audience.includes("p1"),
    ),
  ).toBe(true);
});

it("rejects swapped faction identities and missing captive bodies in saves", () => {
  const s = createRTS();
  s.players.p1.profile = "istari_saruman";
  expect(() => parseRTS(serializeRTS(s))).toThrow();
  const c = createRTS();
  c.players.p1.hero.status = "captive";
  expect(() => parseRTS(serializeRTS(c))).toThrow();
});

it("refuses undiscovered resource orders and malformed saved commitments", () => {
  const s = createRTS();
  const worker = Object.values(s.units).find(
    (u) => u.owner === "p1" && u.kind === "worker",
  )!;
  const unseen = Object.values(s.resources).find((r) => r.x > 30)!;
  expect(
    commandRTS(s, "p1", {
      kind: "order",
      units: [worker.id],
      order: { kind: "gather", target: unseen.id },
    }).ok,
  ).toBe(false);
  worker.commitment = {
    kind: "voice",
    due: 20,
    origin: { x: worker.x, y: worker.y },
  };
  expect(() => parseRTS(serializeRTS(s))).toThrow();
});
it("actual combat damage interrupts a paid hero recovery commitment", () => {
  const s = createRTS();
  s.players.p2.ai = false;
  const p = s.players.p1,
    b = Object.values(s.buildings).find(
      (b) => b.owner === "p1" && b.kind === "keep",
    )!;
  p.stock = { P: 1000, M: 1000, K: 1000, E: 1000 };
  p.component = 1;
  commandRTS(s, "p1", { kind: "produce", building: b.id, product: "hero" });
  stepRTS(s, b.queue[0].remaining);
  const h = s.units[p.hero.id];
  h.orders = [];
  h.x = 15;
  h.y = 10;
  p.hero.readiness = 0;
  expect(commandRTS(s, "p1", { kind: "recover-hero" }).ok).toBe(true);
  const enemy = Object.values(s.units).find(
    (u) => u.owner === "p2" && u.kind === "soldier",
  )!;
  enemy.x = 16;
  enemy.y = 10;
  enemy.orders = [{ kind: "attack", target: h.id }];
  const hp = h.hp;
  stepRTS(s);
  expect(h.hp).toBeLessThan(hp);
  expect(h.commitment).toBeUndefined();
  expect(p.hero.readiness).toBe(0);
  expect(s.events.some((e) => e.text.includes("interrupted"))).toBe(true);
});

it("acquisition preserves hidden-range, worker, move-only and stable nearest-target behavior", () => {
  const isolate = (kind: "worker" | "soldier") => {
    const s = createRTS();
    s.players.p2.ai = false;
    const u = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === kind,
    )!;
    const enemies = Object.values(s.units)
      .filter((v) => v.owner === "p2" && v.kind === "soldier")
      .slice(0, 2);
    for (const v of Object.values(s.units))
      if (v !== u && !enemies.includes(v)) v.hp = 0;
    u.x = 15;
    u.y = 10;
    u.orders = [];
    enemies.forEach((v, i) => {
      v.x = 24 + i;
      v.y = 10;
      v.orders = [];
    });
    return { s, u, enemies };
  };
  const hidden = isolate("soldier");
  stepRTS(hidden.s);
  expect(hidden.u.state).toBe("idle");
  expect(hidden.enemies.every((e) => e.hp === e.maxHp)).toBe(true);
  const worker = isolate("worker");
  worker.enemies[0].x = 16;
  stepRTS(worker.s);
  expect(worker.enemies[0].hp).toBe(worker.enemies[0].maxHp);
  const moving = isolate("soldier");
  moving.enemies[0].x = 16;
  moving.u.orders = [{ kind: "move", x: 15, y: 8 }];
  stepRTS(moving.s);
  expect(moving.u.y).toBeLessThan(10);
  expect(moving.enemies[0].hp).toBe(moving.enemies[0].maxHp);
  const ties = isolate("soldier");
  ties.enemies[0].x = 14;
  ties.enemies[1].x = 16;
  stepRTS(ties.s);
  expect(ties.enemies[0].hp).toBeLessThan(ties.enemies[0].maxHp);
  expect(ties.enemies[1].hp).toBe(ties.enemies[1].maxHp);
});
