import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  startIntelligence,
  progressIntelligence,
  recordObservedAttack,
} from "../src/simulation/intelligence";
import { recordPatrolMovement } from "../src/simulation/patrols";
import {
  surveyBeaconLink,
  recordBeaconSurveyCandidate,
  startBeaconSignal,
  progressBeaconSignals,
  validateBeaconSignals,
  type BeaconState,
} from "../src/simulation/relay-messages";
function fixture() {
  const s = createMatch(["istari_star", "human_rohan"], 1) as BeaconState;
  Object.assign(s, {
    beaconLinks: {},
    beaconSurveyCandidates: {},
    beaconSignals: {},
    beaconFogUses: {},
  });
  s.map.terrain.fill("meadow");
  const p = s.players.p1,
    h = (s.units[p.hero.id] = {
      ...structuredClone(s.units["p1:company:0"]),
      id: p.hero.id,
      kind: "hero",
    }),
    f = s.facilities["p1:core"];
  Object.assign(f, { kind: "beacon", x: 4, y: 4 });
  for (const site of Object.values(s.facilities))
    if (site.id !== f.id) {
      site.x = 20;
      site.y = 20;
    }
  s.facilities.dest = { ...f, id: "dest", x: 6 };
  p.hero.status = "living";
  Object.assign(h, { x: 6, y: 4 });
  const route = [
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 },
  ];
  recordPatrolMovement(s, h, route);
  const trace = Object.values(s.movementTraces).find((t) => t.unit === h.id)!;
  recordBeaconSurveyCandidate(s, h, route, trace.id);
  const e = s.units["p2:company:0"];
  Object.assign(e, { x: 4, y: 3 });
  s.facilities.third = { ...f, id: "third", x: 6, y: 6 };
  p.hero.readiness = 6;
  p.stock.M = 100;
  p.stock.K = 100;
  startIntelligence(
    s,
    "p1",
    { mode: "beacon-concord", stations: [f.id, "dest", "third"] },
    () => [
      { x: 4, y: 4 },
      { x: 6, y: 4 },
    ],
  );
  recordObservedAttack(s, e);
  progressIntelligence(s, () => []);
  const r = Object.values(s.intelligenceReports).find(
    (r) => r.owner === "p1" && r.observations.some((o) => o.source === f.id),
  )!;
  p.stock.K = 100;
  return {
    s,
    p,
    h,
    f,
    trace,
    r,
    a: { origin: f.id, destination: "dest", report: r.id },
  };
}
it("personally walked link carries first light-fog visual signal once per week, retaining dated report", () => {
  const { s, p, trace, r, a } = fixture();
  surveyBeaconLink(s, "p1", a.origin, a.destination, trace.id);
  s.map.terrain[4 * s.map.width + 5] = "water";
  s.seaHazards["5,4"] = { fog: true, wave: 0, handling: 0 };
  const before = JSON.stringify(r);
  s.movementTraces = {}; // Owner candidate survives guest trace redaction.
  startBeaconSignal(s, "p1", a);
  progressBeaconSignals(s);
  expect(s.beaconSignals.p1).toMatchObject({
    phase: "delivered",
    lightFogUsed: true,
    reportTurn: r.createdTurn,
  });
  expect(p.stock.K).toBe(98);
  expect(JSON.stringify(r)).toBe(before);
  startBeaconSignal(s, "p1", a);
  progressBeaconSignals(s);
  expect(s.beaconSignals.p1.phase).toBe("pending");
  s.turn++;
  progressBeaconSignals(s);
  expect(s.beaconSignals.p1.phase).toBe("delivered");
  validateBeaconSignals(s);
});
it("ordinary clear signal needs no personal survey; fog, storm and solid cover remain real blockers", () => {
  const { s, trace, a } = fixture();
  startBeaconSignal(s, "p1", a);
  s.seaHazards["5,4"] = { fog: true, wave: 0, handling: 0 };
  progressBeaconSignals(s);
  expect(s.beaconSignals.p1.phase).toBe("pending");
  surveyBeaconLink(s, "p1", a.origin, a.destination, trace.id);
  s.turn++;
  s.seaHazards["5,4"].wave = 2;
  progressBeaconSignals(s);
  expect(s.beaconSignals.p1.phase).toBe("pending");
  s.turn++;
  s.seaHazards["5,4"].fog = false;
  progressBeaconSignals(s);
  expect(s.beaconSignals.p1.phase).toBe("pending");
  s.turn++;s.seaHazards["5,4"].wave=0;
  s.map.terrain[4 * s.map.width + 5] = "cliff";
  progressBeaconSignals(s);
  expect(s.beaconSignals.p1.phase).toBe("pending");
  s.turn++;
  s.map.terrain[4 * s.map.width + 5] = "meadow";
  progressBeaconSignals(s);
  expect(s.beaconSignals.p1).toMatchObject({
    phase: "delivered",
    lightFogUsed: false,
  });
  const bad = structuredClone(s);
  bad.beaconSignals.p1.reportTurn++;
  expect(() => validateBeaconSignals(bad)).toThrow();
});
it("rejects a company survey substituted for personal Star travel", () => {
  const { s, trace, a } = fixture();
  s.beaconSurveyCandidates.p1.hero = "p1:company:0";
  expect(() =>
    surveyBeaconLink(s, "p1", a.origin, a.destination, trace.id),
  ).toThrow(/Personal/);
});
it('saved survey cannot substitute another real beacon endpoint and captured history stays inert',()=>{const{s,trace,a}=fixture();surveyBeaconLink(s,'p1',a.origin,a.destination,trace.id);const bad=structuredClone(s);bad.beaconLinks.p1.destination='third';expect(()=>validateBeaconSignals(bad)).toThrow(/survey/);s.facilities.dest.owner='p2';expect(()=>validateBeaconSignals(s)).not.toThrow();expect(()=>startBeaconSignal(s,'p1',a)).toThrow(/beacons/);});
