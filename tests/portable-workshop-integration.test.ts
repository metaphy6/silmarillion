import { expect, it } from "vitest";
import {
  createMatch,
  submit,
  resolveWeek,
  preview,
} from "../src/simulation/engine";
import { parseMatch } from "../src/simulation/schema";
import { guestSnapshot } from "../src/network/protocol";
import {
  encodeCheckpoint,
  decodeCheckpoint,
} from "../src/persistence/checkpoints";
import { recipe, limits } from "../src/content/catalog";
import type { Match, Action } from "../src/simulation/types";
function send(s: Match, action: Action, seat = "p1") {
  return submit(s, {
    id: `${seat}-${s.revision}-${s.nextSeq[seat]}`,
    seat,
    seq: s.nextSeq[seat],
    turn: s.turn,
    revision: s.revision,
    action,
  });
}
function issue(s: Match, action: Action, seat = "p1") {
  const r = send(s, action, seat);
  expect(r.ok, r.reason).toBe(true);
  return r.state;
}
function tick(s: Match) {
  s = resolveWeek(s);
  while (s.combatPhase) s = resolveWeek(s);
  return s;
}
function setup() {
  let s = createMatch(["elf_avari", "human_gondor"], 127);
  for (const p of Object.values(s.players)) p.ai = false;
  // Explicit scenario preparation only: terrain, existing worker/hero position,
  // abundant paid-input stock and source access. Workshops are built by commands.
  for (let y = 3; y <= 4; y++)
    for (let x = 3; x <= 7; x++) {
      s.map.terrain[y * s.map.width + x] = "meadow";
      delete s.shallowWater[`${x},${y}`];
    }
  const p = s.players.p1,
    w = Object.values(s.units).find(
      (u) => u.owner === "p1" && u.kind === "worker",
    )!;
  Object.assign(w, { x: 4, y: 4, move: 5 });
  Object.assign(s.facilities["p1:core"], { x: 4, y: 3 });
  p.stock = { P: 1000, M: 1000, K: 1000, E: 1000 };
  p.sources.push(
    ...recipe(p.profile, "equipment")!.access.filter(
      (a) => !p.sources.includes(a),
    ),
  );
  p.hero.status = "living";
  p.hero.readiness = 6;
  s.units[p.hero.id] = {
    ...structuredClone(w),
    id: p.hero.id,
    kind: "hero",
    name: "Frontier Mediator",
  };
  s = tick(
    issue(
      issue(s, { kind: "build", building: "portable-workshop", x: 4, y: 4 }),
      { kind: "build", building: "depot", x: 7, y: 4 },
    ),
  );
  const workshop = Object.values(s.facilities).find(
      (f) => f.kind === "portable-workshop",
    )!.id,
    destination = Object.values(s.facilities).find(
      (f) => f.kind === "depot" && f.x === 7,
    )!.id;
  for (const settlement of ["p1:core", destination])
    s = issue(s, {
      kind: "portable",
      mode: "consent",
      settlement,
      willing: true,
    });
  const relocate: Action = {
    kind: "portable",
    mode: "relocate",
    workshop,
    origin: "p1:core",
    destination,
    carrier: w.id,
    route: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
    ],
  };
  return { s, workshop, destination, carrier: w.id, relocate };
}
it("normal construction and paid queue relocation spend both budgets and suspend the same job for transit", () => {
  const f = setup();
  let s = issue(f.s, {
    kind: "produce",
    facility: f.workshop,
    recipe: "equipment",
  });
  const before = preview(s, "p1"),
    job = structuredClone(before.facilities[f.workshop].job!);
  s = issue(s, f.relocate);
  const moving = preview(s, "p1");
  expect(moving.players.p1.operations).toBe(before.players.p1.operations - 1);
  expect(moving.players.p1.commitment).toBe(0);
  expect(moving.players.p1.stock.P).toBe(before.players.p1.stock.P - 6);
  expect(moving.players.p1.hero.readiness).toBe(
    before.players.p1.hero.readiness - 3,
  );
  expect(moving.facilities[f.workshop]).toBeUndefined();
  expect(Object.values(moving.portableWorkshops)[0].workshop?.job).toEqual(job);
  expect(send(s, { kind: "move", unit: f.carrier, x: 5, y: 4 }).ok).toBe(false);
  s = tick(s);
  expect(s.facilities[f.workshop].job).toEqual(job);
  expect(s.facilities[f.workshop].x).toBe(6);
  expect(parseMatch(s)).toEqual(s);
  expect(decodeCheckpoint(encodeCheckpoint(s)).state).toEqual(s);
});
it("private relocation and consent records stay owner-only in valid guest saves", () => {
  const f = setup();
  const s = tick(issue(f.s, f.relocate));
  expect(Object.keys(guestSnapshot(s, "p1").portableWorkshops)).toHaveLength(1);
  expect(guestSnapshot(s, "p2").portableWorkshops).toEqual({});
  expect(guestSnapshot(s, "p2").portableConsents).toEqual({});
  for (const seat of ["p1", "p2"])
    expect(() => parseMatch(guestSnapshot(s, seat), seat)).not.toThrow();
});
it("strict submissions reject forged cargo, foreign facilities and unavailable faction builds", () => {
  const f = setup();
  expect(send(f.s, { ...f.relocate, workers: 99 } as Action).ok).toBe(false);
  expect(send(f.s, { ...f.relocate, workshop: "p2:core" } as Action).ok).toBe(
    false,
  );
  expect(
    send(
      f.s,
      { kind: "build", building: "portable-workshop", x: 10, y: 10 },
      "p2",
    ).ok,
  ).toBe(false);
});
it("destination withdrawal before dispatch aborts relocation without charging compact costs", () => {
  const f = setup();
  let s = issue(
    issue(f.s, { kind: "produce", facility: f.workshop, recipe: "equipment" }),
    f.relocate,
  );
  s = issue(s, {
    kind: "portable",
    mode: "consent",
    settlement: f.destination,
    willing: false,
  });
  const control = tick(
    issue(
      issue(f.s, {
        kind: "produce",
        facility: f.workshop,
        recipe: "equipment",
      }),
      {
        kind: "portable",
        mode: "consent",
        settlement: f.destination,
        willing: false,
      },
    ),
  );
  s = tick(s);
  expect(s.portableWorkshops).toEqual({});
  expect(s.facilities[f.workshop]).toEqual(control.facilities[f.workshop]);
  expect(s.players.p1.stock).toEqual(control.players.p1.stock);
  expect(s.players.p1.hero.readiness).toBe(control.players.p1.hero.readiness);
  expect(parseMatch(s)).toEqual(s);
});
it("escrow paid queues continue reserving normal faction queue capacity", () => {
  const f = setup();
  const s = issue(
    issue(f.s, { kind: "produce", facility: f.workshop, recipe: "equipment" }),
    f.relocate,
  );
  const moving = preview(s, "p1"),
    base =
      moving.portableWorkshops[Object.keys(moving.portableWorkshops)[0]]
        .workshop!;
  // Explicit cap-boundary fixture: all other legal ordinary queues occupied.
  for (let i = 0; i < limits("elf_avari").queues - 1; i++) {
    const id = `busy-${i}`;
    s.facilities[id] = {
      ...structuredClone(base),
      id,
      kind: "workshop",
      job: { ...structuredClone(base.job!), id: `job-${i}` },
    };
  }
  s.facilities.free = {
    ...structuredClone(base),
    id: "free",
    kind: "workshop",
  };
  delete s.facilities.free.job;
  expect(
    send(s, { kind: "produce", facility: "free", recipe: "equipment" }).reason,
  ).toMatch(/queue limit/i);
});
it("ordinary enemy attack intercepts real carrier without duplicating or progressing its paid workshop", () => {
  const f = setup();
  let s = f.s;
  Object.assign(s.units["p2:company:0"], { x: 5, y: 4, attack: 100 });
  s.units[f.carrier].hp = 1;
  s = issue(
    issue(s, { kind: "produce", facility: f.workshop, recipe: "equipment" }),
    f.relocate,
  );
  const paid = structuredClone(
    Object.values(preview(s, "p1").portableWorkshops)[0].workshop!.job,
  );
  s = issue(
    s,
    { kind: "attack", unit: "p2:company:0", target: f.carrier },
    "p2",
  );
  s = tick(s);
  const j = Object.values(s.portableWorkshops)[0];
  expect(s.units[f.carrier].alive).toBe(false);
  expect(j.phase).toBe("lost");
  expect(j.workshop?.job).toEqual(paid);
  expect(s.facilities[f.workshop]).toBeUndefined();
  expect(parseMatch(s)).toEqual(s);
  s = tick(issue(s, { kind: "move", unit: "p1:company:0", x: 4, y: 4 }));
  s = issue(s, {
    kind: "portable",
    mode: "recover",
    job: j.id,
    destination: f.destination,
    carrier: "p1:company:0",
    route: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
    ],
  });
  expect(preview(s, "p1").players.p1.operations).toBe(2);
  expect(preview(s, "p1").players.p1.commitment).toBe(1);
  s = tick(s);
  expect(s.facilities[f.workshop].job).toEqual(paid);
  expect(s.portableWorkshops[j.id].phase).toBe("arrived");
  expect(parseMatch(s)).toEqual(s);
});
it("save parser rejects escrow paid-cost tampering and foreign workshop ownership", () => {
  const f = setup();
  Object.assign(f.s.units["p2:company:0"], { x: 5, y: 4, attack: 100 });
  f.s.units[f.carrier].hp = 1;
  let s = issue(
    issue(f.s, { kind: "produce", facility: f.workshop, recipe: "equipment" }),
    f.relocate,
  );
  s = issue(
    s,
    { kind: "attack", unit: "p2:company:0", target: f.carrier },
    "p2",
  );
  s = tick(s);
  const id = Object.keys(s.portableWorkshops)[0];
  expect(() => parseMatch(s)).not.toThrow();
  const cost = structuredClone(s);
  cost.portableWorkshops[id].workshop!.job!.cost.M++;
  expect(() => parseMatch(cost)).toThrow(/paid|portable/i);
  const owner = structuredClone(s);
  owner.portableWorkshops[id].owner = "p2";
  owner.portableWorkshops[id].workshop!.owner = "p2";
  expect(() => parseMatch(owner)).toThrow(/portable/i);
});
it('last consent choice wins when allowing and revoking the same settlement in one phase',()=>{for(const final of [false,true]){const f=setup();let s=issue(f.s,{kind:'portable',mode:'consent',settlement:f.destination,willing:!final});s=issue(s,{kind:'portable',mode:'consent',settlement:f.destination,willing:final});const projected=preview(s,'p1');expect(Object.values(projected.portableConsents).find(c=>c.settlement===f.destination)?.willing??false).toBe(final);const next=tick(s);expect(Object.values(next.portableConsents).find(c=>c.settlement===f.destination)?.willing??false).toBe(final);}});
