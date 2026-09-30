import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  trainScout,
  finishScoutTraining,
  startNightPatrol,
  advanceNightPatrols,
} from "../src/simulation/night-patrol";
import {
  recordPatrolMovement,
  traceFresh,
  validatePatrolState,
} from "../src/simulation/patrols";
import { observation } from "../src/simulation/visibility";
function setup(profile: string) {
  const s = createMatch([profile, "vaire"], 37),
    p = s.players.p1,
    u = s.units["p1:company:0"];
  Object.assign(u, { x: 4, y: 4, move: 5 });
  p.hero.status = "living";
  p.stock = { P: 100, M: 100, K: 100, E: 100 };
  s.units[p.hero.id] = {
    ...structuredClone(u),
    id: p.hero.id,
    kind: "hero",
    effects: [],
  };
  const h = s.units[p.hero.id];
  for (let x = 3; x <= 7; x++) s.map.terrain[4 * s.map.width + x] = "woodland";
  const route = [
    { x: 4, y: 4 },
    { x: 5, y: 4 },
  ];
  return { s, p, u, h, route };
}
it("Varda resists the existing ordinary navigation delay only on a genuinely surveyed route", () => {
  const { s, p, u, h, route } = setup("varda");
  trainScout(s, "p1", u.id);
  s.turn++;
  finishScoutTraining(s);
  Object.assign(u, route.at(-1));
  Object.assign(h, route.at(-1));
  recordPatrolMovement(s, u, route);
  const before = p.stock.P;
  const id = startNightPatrol(
    s,
    "p1",
    { unit: u.id, method: "ordinary", route: [...route].reverse() },
    () => true,
    () => 1,
  );
  expect(s.nightPatrols[id].delay).toBe(0);
  expect(p.stock.P).toBe(before - 3);
  advanceNightPatrols(
    s,
    () => false,
    () => 1,
  );
  expect(u.x).toBe(5);
  expect(s.nightPatrols[id].phase).toBe("interrupted");
});
it("nearby Varda grants neither unsurveyed navigation nor remote delay removal", () => {
  for (const remote of [false, true]) {
    const { s, u, h, route } = setup("varda");
    trainScout(s, "p1", u.id);
    s.turn++;
    finishScoutTraining(s);
    if (remote) {
      Object.assign(u, route.at(-1));
      recordPatrolMovement(s, u, route);
      h.x = 20;
    }
    const actual = remote ? [...route].reverse() : route;
    const id = startNightPatrol(
      s,
      "p1",
      { unit: u.id, method: "ordinary", route: actual },
      () => true,
      () => 1,
    );
    expect(s.nightPatrols[id].delay).toBe(1);
  }
});
it("Nandor shortens only an actually accompanied light-company trace by one phase without concealing the unit", () => {
  const { s, u, h, route } = setup("elf_nandor");
  Object.assign(h, route.at(-1));
  recordPatrolMovement(s, h, route);
  Object.assign(u, route.at(-1));
  recordPatrolMovement(s, u, route);
  const traces = Object.values(s.movementTraces),
    heroTrace = traces.find((t) => t.unit === h.id)!,
    companyTrace = traces.find((t) => t.unit === u.id)!;
  expect(heroTrace.expiresRevision).toBe(s.revision + 2);
  expect(companyTrace.expiresRevision).toBe(s.revision + 1);
  expect(companyTrace.erased).toBe(false);
  const visible = observation(s, "p1", u);
  s.revision++;
  expect(traceFresh(s, companyTrace)).toBe(true);
  s.revision++;
  expect(traceFresh(s, companyTrace)).toBe(false);
  expect(traceFresh(s, heroTrace)).toBe(true);
  expect(observation(s, "p1", u)).toBe(visible);
  validatePatrolState(s);
});
it("remote hero, heavy company, different path and wagon carriers receive no shortened tracks", () => {
  for (const mode of ["remote", "heavy", "different", "wagon"]) {
    const { s, u, h, route } = setup("elf_nandor");
    if (mode === "remote") h.x = 20;
    else {
      Object.assign(h, route.at(-1));
      recordPatrolMovement(
        s,
        h,
        mode === "different"
          ? [
              { x: 5, y: 3 },
              { x: 5, y: 4 },
            ]
          : route,
      );
    }
    if (mode === "heavy") u.loadClass = "large";
    if (mode === "wagon") u.kind = "worker";
    Object.assign(u, route.at(-1));
    recordPatrolMovement(s, u, route);
    const t = Object.values(s.movementTraces).find((t) => t.unit === u.id)!;
    expect(t.expiresRevision).toBe(s.revision + 2);
  }
});
