import {companionRole} from "../content/companion-production";
import type { Match, Pos, Unit } from "./types";
import { conscious } from "./night-work";
export interface RelayVisit {
  station: string;
  turn: number;
  revision: number;
}
export interface RelayMessage {
  id: string;
  owner: string;
  report: string;
  courier: string;
  origin: string;
  primary: string;
  destination: string;
  route: Pos[];
  index: number;
  x: number;
  y: number;
  started: number;
  lastProgress: number;
  phase: "travel" | "delivered" | "lost";
  provenance: RelayVisit[];
}
export interface SecondSignal {
  id: string;
  owner: string;
  message: string;
  route: Pos[];
  turn: number;
  used: boolean;
}
export interface RelayDelivery {
  id: string;
  owner: string;
  message: string;
  report: string;
  destination: string;
  turn: number;
  revision: number;
  reportTurn: number;
  reportRevision: number;
  provenance: RelayVisit[];
}
export interface WitnessUse {
  turn: number;
  message: string;
}
export interface RelayRequest {
  report: string;
  courier: string;
  origin: string;
  primary: string;
  destination: string;
  route: Pos[];
}
export type RelayState = Match & {
  relayMessages: Record<string, RelayMessage>;
  secondSignals: Record<string, SecondSignal>;
  relayDeliveries: Record<string, RelayDelivery>;
  witnessChainUses: Record<string, WitnessUse>;
};
export type RelayRoute = (s: Match, u: Unit, route: Pos[]) => boolean;
const d = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const station = (s: Match, owner: string, id: string) => {
  const f = s.facilities[id];
  return (
    !!f &&
    f.owner === owner &&
    f.hp > 0 &&
    f.workers > 0 &&
    ["safehouse", "relay", "beacon"].includes(f.kind)
  );
};
export const relayBusy = (s: RelayState, id: string) =>
  Object.values(s.relayMessages).some(
    (q) => q.courier === id && q.phase === "travel",
  );
function routeValid(
  s: Match,
  u: Unit,
  route: Pos[],
  destination: Pos,
  check: RelayRoute,
) {
  return (
    route.length >= 2 &&
    route.length <= 128 &&
    d(u, route[0]) === 0 &&
    d(destination, route.at(-1)!) === 0 &&
    new Set(route.map((p) => `${p.x},${p.y}`)).size === route.length &&
    route.every(
      (p, i) =>
        Number.isInteger(p.x) &&
        Number.isInteger(p.y) &&
        p.x >= 0 &&
        p.y >= 0 &&
        p.x < s.map.width &&
        p.y < s.map.height &&
        (!i || d(p, route[i - 1]) === 1),
    ) &&
    check(s, u, route)
  );
}
export function relayReason(
  s: RelayState,
  seat: string,
  a: RelayRequest,
  check: RelayRoute,
) {
  const u = s.units[a.courier],
    r = s.intelligenceReports[a.report];
  if (
    !s.players[seat] ||
    !r ||
    r.owner !== seat ||
    !r.observations.length ||
    !r.observations.some((o) => o.source === a.origin)
  )
    return "Existing dated report physically held at its observed origin required";
  if (
    !conscious(s, u) ||
    u.owner !== seat ||
    !u.supplied ||
    (!["worker", "company"].includes(u.kind) && companionRole(s,u)!=="courier") ||
    relayBusy(s, u.id)
  )
    return "Free supplied ordinary physical courier required";
  if (
    new Set([a.origin, a.primary, a.destination]).size !== 3 ||
    ![a.origin, a.primary, a.destination].every((id) => station(s, seat, id))
  )
    return "Three distinct owned staffed physical link stations required";
  if (
    d(u, s.facilities[a.origin]) !== 0 ||
    !routeValid(s, u, a.route, s.facilities[a.destination], check) ||
    !a.route.some((p) => d(p, s.facilities[a.primary]) === 0)
  )
    return "Surveyed primary route through actual staffed station required";
  return "";
}
export function startRelayMessage(
  s: RelayState,
  seat: string,
  a: RelayRequest,
  check: RelayRoute,
) {
  const reason = relayReason(s, seat, a, check);
  if (reason) throw new Error(reason);
  const u = s.units[a.courier],
    id = `relay-message:${s.nextId++}`;
  s.relayMessages[id] = {
    ...structuredClone(a),
    id,
    owner: seat,
    index: 0,
    x: u.x,
    y: u.y,
    started: s.turn,
    lastProgress: s.turn - 1,
    phase: "travel",
    provenance: [],
  };
  return id;
}
export function secondSignalReason(
  s: RelayState,
  seat: string,
  message: string,
  route: Pos[],
  check: RelayRoute,
  connected: (a: Pos, b: Pos) => boolean,
) {
  const p = s.players[seat],
    h = p && s.units[p.hero.id],
    q = s.relayMessages[message],
    u = q && s.units[q.courier];
  if (
    !p ||
    p.profile !== "ilmare" ||
    p.hero.status !== "living" ||
    !conscious(s, h) ||
    p.hero.readiness < 3 ||
    p.commitment < 1
  )
    return "Living Ilmare,3readiness and weekly commitment required";
  if (
    !q ||
    q.owner !== seat ||
    q.phase !== "travel" ||
    !conscious(s, u) ||
    !u.supplied ||
    !station(s, seat, q.primary) ||
    !station(s, seat, q.destination) ||
    !connected(h, u)
  )
    return "Existing staffed communications link, message and available courier required";
  if (
    Object.values(s.secondSignals).some(
      (v) => v.message === message && v.turn === s.turn,
    )
  )
    return "This message already has a redundant relay";
  if (
    !routeValid(s, u, route, s.facilities[q.destination], check) ||
    route.some((p) => d(p, s.facilities[q.primary]) === 0)
  )
    return "Surveyed alternate route must physically bypass primary station";
  return p.stock.M < 15 || p.stock.K < 5 ? "Second Signal requires15M5K" : "";
}
export function prepareSecondSignal(
  s: RelayState,
  seat: string,
  message: string,
  route: Pos[],
  check: RelayRoute,
  connected: (a: Pos, b: Pos) => boolean,
) {
  const reason = secondSignalReason(s, seat, message, route, check, connected);
  if (reason) throw new Error(reason);
  const p = s.players[seat];
  p.stock.M -= 15;
  p.stock.K -= 5;
  p.hero.readiness -= 3;
  const id = `second-signal:${s.nextId++}`;
  s.secondSignals[id] = {
    id,
    owner: seat,
    message,
    route: structuredClone(route),
    turn: s.turn,
    used: false,
  };
  return id;
}
export function settleRelayLosses(s: RelayState) {
  for (const q of Object.values(s.relayMessages)) {
    const u = s.units[q.courier];
    if (
      q.phase === "travel" &&
      (!u?.alive || u.owner !== q.owner || d(u, q) !== 0)
    )
      q.phase = "lost";
  }
}
function witness(s: RelayState, q: RelayMessage, route: Pos[]) {
  const p = s.players[q.owner],
    h = s.units[p.hero.id];
  if (p.profile !== "ilmare" || p.hero.status !== "living" || !conscious(s, h))
    return;
  const used = s.witnessChainUses[q.owner];
  if (used?.turn === s.turn && used.message !== q.id) return;
  s.witnessChainUses[q.owner] = { turn: s.turn, message: q.id };
  for (const point of route)
    for (const f of Object.values(s.facilities).sort((a, b) =>
      a.id.localeCompare(b.id),
    ))
      if (
        station(s, q.owner, f.id) &&
        d(f, point) === 0 &&
        !q.provenance.some((v) => v.station === f.id)
      )
        q.provenance.push({
          station: f.id,
          turn: s.turn,
          revision: s.revision,
        });
}
export function progressRelayMessages(
  s: RelayState,
  check: RelayRoute,
  cost: (s: Match, u: Unit, r: Pos[]) => number,
  moved?: (u: Unit, route: Pos[]) => void,
) {
  settleRelayLosses(s);
  for (const q of Object.values(s.relayMessages).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (q.phase !== "travel" || q.lastProgress >= s.turn) continue;
    const u = s.units[q.courier];
    if (!conscious(s, u) || !u.supplied || !station(s, q.owner, q.destination))
      continue;
    const primaryIndex = q.route.findIndex(
      (p) => d(p, s.facilities[q.primary] ?? { x: -1, y: -1 }) === 0,
    );
    const bypassed = Object.values(s.secondSignals).some(
      (v) => v.message === q.id && v.used,
    );
    if (
      !station(s, q.owner, q.primary) &&
      !bypassed &&
      (primaryIndex < 0 || q.index <= primaryIndex)
    ) {
      const alt = Object.values(s.secondSignals).find(
        (v) => v.message === q.id && v.turn === s.turn && !v.used,
      );
      if (
        !alt ||
        !routeValid(s, u, alt.route, s.facilities[q.destination], check)
      )
        continue;
      q.route = structuredClone(alt.route);
      q.index = 0;
      alt.used = true;
    }
    const remaining = q.route.slice(q.index);
    if (!check(s, u, remaining)) continue;
    let steps = 0;
    for (let n = 1; n < remaining.length; n++) {
      if (cost(s, u, remaining.slice(0, n + 1)) > u.move) break;
      steps = n;
    }
    if (!steps) continue;
    const walked = remaining.slice(0, steps + 1);
    witness(s, q, walked);
    q.index += steps;
    q.x = u.x = q.route[q.index].x;
    q.y = u.y = q.route[q.index].y;
    q.lastProgress = s.turn;
    moved?.(u, walked);
    if (q.index !== q.route.length - 1) continue;
    q.phase = "delivered";
    const r = s.intelligenceReports[q.report],
      id = `relay-delivery:${s.nextId++}`;
    s.relayDeliveries[id] = {
      id,
      owner: q.owner,
      message: q.id,
      report: q.report,
      destination: q.destination,
      turn: s.turn,
      revision: s.revision,
      reportTurn: r.createdTurn,
      reportRevision: r.createdRevision,
      provenance: structuredClone(q.provenance),
    };
  }
}
export function validateRelayMessages(s: RelayState, guestSeat?: string) {
  const crews = new Set<string>();
  for (const [id, q] of Object.entries(s.relayMessages)) {
    if (
      id !== q.id ||
      !s.players[q.owner] ||
      !s.intelligenceReports[q.report] ||
      s.intelligenceReports[q.report].owner !== q.owner ||
      q.started > s.turn ||
      q.lastProgress > s.turn ||
      q.index < 0 ||
      q.index >= q.route.length ||
      q.route.length < 2 ||
      q.route.some((p, i) => i > 0 && d(p, q.route[i - 1]) !== 1) ||
      d(q, q.route[q.index]) !== 0 ||
      (guestSeat && q.owner !== guestSeat)
    )
      throw new Error("Invalid finite message");
    if (q.phase === "travel") {
      if (
        crews.has(q.courier) ||
        !s.units[q.courier] ||
        s.units[q.courier].owner !== q.owner
      )
        throw new Error("Invalid message courier");
      crews.add(q.courier);
    }
  }
  for (const [id, q] of Object.entries(s.secondSignals))
    if (
      id !== q.id ||
      s.players[q.owner]?.profile !== "ilmare" ||
      !s.relayMessages[q.message] ||
      s.relayMessages[q.message].owner !== q.owner ||
      q.turn > s.turn ||
      (guestSeat && q.owner !== guestSeat)
    )
      throw new Error("Invalid redundant relay");
  for (const [id, q] of Object.entries(s.relayDeliveries))
    if (
      id !== q.id ||
      !s.relayMessages[q.message] ||
      q.report !== s.relayMessages[q.message].report ||
      q.owner !== s.relayMessages[q.message].owner ||
      q.destination !== s.relayMessages[q.message].destination ||
      s.relayMessages[q.message].phase !== "delivered" ||
      q.reportTurn !== s.intelligenceReports[q.report]?.createdTurn ||
      q.reportRevision !== s.intelligenceReports[q.report]?.createdRevision ||
      q.turn > s.turn ||
      q.revision > s.revision ||
      q.reportTurn > s.turn ||
      q.reportRevision > s.revision ||
      (guestSeat && q.owner !== guestSeat)
    )
      throw new Error("Invalid relay receipt");
}

import { sightline } from "./effects";
export interface BeaconLink {
  owner: string;
  origin: string;
  destination: string;
  hero: string;
  route: Pos[];
  turn: number;
  revision: number;
}
export interface BeaconSignal {
  id: string;
  owner: string;
  origin: string;
  destination: string;
  report: string;
  started: number;
  lastProgress: number;
  phase: "pending" | "delivered";
  deliveredTurn?: number;
  deliveredRevision?: number;
  reportTurn: number;
  reportRevision: number;
  lightFogUsed: boolean;
}
export interface BeaconSurveyCandidate extends BeaconLink {
  trace: string;
}
export type BeaconState = Match & {
  beaconSurveyCandidates: Record<string, BeaconSurveyCandidate>;
  beaconLinks: Record<string, BeaconLink>;
  beaconSignals: Record<string, BeaconSignal>;
  beaconFogUses: Record<string, number>;
};
export interface BeaconRequest {
  origin: string;
  destination: string;
  report: string;
}
const beacon = (s: Match, seat: string, id: string) =>
  station(s, seat, id) && s.facilities[id].kind === "beacon";
function beaconEndpoints(
  s: Match,
  seat: string,
  origin: string,
  destination: string,
) {
  return (
    origin !== destination &&
    beacon(s, seat, origin) &&
    beacon(s, seat, destination) &&
    d(s.facilities[origin], s.facilities[destination]) <= 8
  );
}
export function recordBeaconSurveyCandidate(
  s: BeaconState,
  u: Unit,
  route: Pos[],
  trace: string,
) {
  const p = s.players[u.owner];
  if (
    !p ||
    p.profile !== "istari_star" ||
    u.id !== p.hero.id ||
    p.hero.status !== "living" ||
    !conscious(s, u) ||
    route.length < 2
  )
    return;
  const a = Object.values(s.facilities).find(
      (f) => beacon(s, u.owner, f.id) && d(f, route[0]) === 0,
    ),
    b = Object.values(s.facilities).find(
      (f) => beacon(s, u.owner, f.id) && d(f, route.at(-1)!) === 0,
    );
  if (!a || !b || !beaconEndpoints(s, u.owner, a.id, b.id)) return;
  s.beaconSurveyCandidates ??= {};
  s.beaconSurveyCandidates[u.owner] = {
    owner: u.owner,
    origin: a.id,
    destination: b.id,
    hero: u.id,
    route: structuredClone(route),
    turn: s.turn,
    revision: s.revision,
    trace,
  };
}
export function beaconSurveyReason(
  s: BeaconState,
  seat: string,
  origin: string,
  destination: string,
  trace: string,
) {
  const p = s.players[seat],
    h = p && s.units[p.hero.id],
    t = s.beaconSurveyCandidates[seat];
  if (
    p?.profile !== "istari_star" ||
    p.hero.status !== "living" ||
    !conscious(s, h)
  )
    return "Living Star hero required";
  if (
    !beaconEndpoints(s, seat, origin, destination) ||
    !t ||
    t.owner !== seat ||
    t.hero !== h.id ||
    t.trace !== trace ||
    t.origin !== origin ||
    t.destination !== destination ||
    d(t.route[0], s.facilities[origin]) !== 0 ||
    d(t.route.at(-1)!, s.facilities[destination]) !== 0 ||
    d(h, s.facilities[destination]) !== 0
  )
    return "Personal actual route trace between two staffed owned beacons required";
  return "";
}
export function surveyBeaconLink(
  s: BeaconState,
  seat: string,
  origin: string,
  destination: string,
  trace: string,
) {
  const reason = beaconSurveyReason(s, seat, origin, destination, trace);
  if (reason) throw new Error(reason);
  const t = s.beaconSurveyCandidates[seat];
  s.beaconLinks[seat] = {
    owner: seat,
    origin,
    destination,
    hero: s.players[seat].hero.id,
    route: structuredClone(t.route),
    turn: s.turn,
    revision: s.revision,
  };
}
export function beaconSignalReason(
  s: BeaconState,
  seat: string,
  a: BeaconRequest,
) {
  const r = s.intelligenceReports[a.report];
  if (!beaconEndpoints(s, seat, a.origin, a.destination))
    return "Two distinct owned staffed beacons within eight tiles required";
  if (
    !r ||
    r.owner !== seat ||
    !r.observations.some((o) => o.source === a.origin)
  )
    return "Existing dated report at origin required";
  if (s.beaconSignals[seat]?.phase === "pending")
    return "One pending visual signal per owner";
  return s.players[seat].stock.K < 2 ? "Two Lore supplies required" : "";
}
export function startBeaconSignal(
  s: BeaconState,
  seat: string,
  a: BeaconRequest,
) {
  const reason = beaconSignalReason(s, seat, a);
  if (reason) throw new Error(reason);
  const r = s.intelligenceReports[a.report];
  s.players[seat].stock.K -= 2;
  const id = `beacon-signal:${s.nextId++}`;
  s.beaconSignals[seat] = {
    ...a,
    id,
    owner: seat,
    started: s.turn,
    lastProgress: s.turn - 1,
    phase: "pending",
    reportTurn: r.createdTurn,
    reportRevision: r.createdRevision,
    lightFogUsed: false,
  };
  return id;
}
/** Provisional ordinary visual signal: 2K, one resolution, eight tile range.
 * Existing calm-water fog (wave0) is minor; fog with any wave is severe.
 * Light-fog reduction never crosses solid cover or changes the stored report. */
export function progressBeaconSignals(s: BeaconState) {
  for (const q of Object.values(s.beaconSignals)) {
    if (q.phase !== "pending" || q.lastProgress >= s.turn) continue;
    q.lastProgress = s.turn;
    if (!beaconEndpoints(s, q.owner, q.origin, q.destination)) continue;
    const a = s.facilities[q.origin],
      b = s.facilities[q.destination];
    if (!sightline(s, a, b)) continue;
    const steps = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    let fog = false,
      severe = false;
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(a.x + ((b.x - a.x) * i) / steps),
        y = Math.round(a.y + ((b.y - a.y) * i) / steps),
        v = s.seaHazards[`${x},${y}`];
      if(v&&v.wave>=2)severe=true;
      if (v?.fog) {
        fog = true;
        if (v.wave > 0) severe = true;
      }
    }
    if (severe) continue;
    if (fog) {
      const p = s.players[q.owner],
        h = s.units[p.hero.id],
        link = s.beaconLinks[q.owner];
      if (
        p.profile !== "istari_star" ||
        p.hero.status !== "living" ||
        !conscious(s, h) ||
        !link ||
        link.hero !== h.id ||
        link.origin !== q.origin ||
        link.destination !== q.destination || d(link.route[0],a)!==0 || d(link.route.at(-1)!,b)!==0 ||
        s.beaconFogUses[q.owner] === s.turn
      )
        continue;
      s.beaconFogUses[q.owner] = s.turn;
      q.lightFogUsed = true;
    }
    q.phase = "delivered";
    q.deliveredTurn = s.turn;
    q.deliveredRevision = s.revision;
  }
}
export function validateBeaconSignals(s: BeaconState, guestSeat?: string) {
  for (const [seat, l] of [...Object.entries(s.beaconSurveyCandidates),...Object.entries(s.beaconLinks)]) {
    if (
      seat !== l.owner ||
      s.players[seat]?.profile !== "istari_star" ||
      l.hero !== s.players[seat].hero.id ||
      l.origin === l.destination ||
      l.route.length < 2 ||
      ([l.origin,l.destination].some((id,index)=>{const f=s.facilities[id];return f&&f.owner===seat&&f.hp>0&&f.kind==='beacon'&&d(f,index===0?l.route[0]:l.route.at(-1)!)!==0;})) ||
      l.route.some(
        (p, i) =>
          !Number.isInteger(p.x) ||
          !Number.isInteger(p.y) ||
          p.x < 0 ||
          p.y < 0 ||
          p.x >= s.map.width ||
          p.y >= s.map.height ||
          (i > 0 && d(p, l.route[i - 1]) !== 1),
      ) ||
      l.turn > s.turn ||
      l.revision > s.revision ||
      (guestSeat && seat !== guestSeat)
    )
      throw new Error("Invalid personal beacon survey");
  }
  for (const [seat, q] of Object.entries(s.beaconSignals)) {
    const r = s.intelligenceReports[q.report];
    if (
      seat !== q.owner ||
      !s.players[seat] ||
      !r ||
      r.owner !== seat ||
      q.reportTurn !== r.createdTurn ||
      q.reportRevision !== r.createdRevision ||
      q.origin === q.destination ||
      q.started > s.turn ||
      q.lastProgress > s.turn ||
      (q.phase === "delivered" &&
        (q.deliveredTurn === undefined ||
          q.deliveredRevision === undefined ||
          q.deliveredTurn > s.turn ||
          q.deliveredRevision > s.revision)) ||
      (q.phase === "pending" &&
        (q.deliveredTurn !== undefined ||
          q.deliveredRevision !== undefined ||
          q.lightFogUsed)) ||
      (q.lightFogUsed && s.players[seat].profile !== "istari_star") ||
      (guestSeat && seat !== guestSeat)
    )
      throw new Error("Invalid dated beacon signal");
  }
  for (const [seat, turn] of Object.entries(s.beaconFogUses))
    if (
      s.players[seat]?.profile !== "istari_star" ||
      !Number.isInteger(turn) ||
      turn < 1 ||
      turn > s.turn ||
      (guestSeat && seat !== guestSeat)
    )
      throw new Error("Invalid weekly light fog use");
}
