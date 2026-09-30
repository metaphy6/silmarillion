import { effectiveRelation } from "./diplomacy";
import type { Match, Unit, Pos, Stock } from "./types";
import { activeEffects, sightline } from "./effects";
export interface Grievance extends Pos {
  id: string;
  offender: string;
  claimant: string;
  offenderSeat: string;
  claimantSeat: string;
  turn: number;
  revision: number;
  injury: number;
  payment: Stock | null;
  termsVersion: number;
  consents: string[];
  delivered: boolean;
  resolved: boolean;
  mediator: string | null;
}
export interface Restitution extends Pos {
  id: string;
  grievance: string;
  owner: string;
  carrier: string;
  origin: string;
  destination: string;
  route: Pos[];
  index: number;
  cargo: Stock;
  phase: "travel" | "arrived" | "lost";
}
export type CouncilState = Match & {
  grievances: Record<string, Grievance>;
  restitutions: Record<string, Restitution>;
};
export interface CouncilChecks {
  allowance?: (s: Match, u: Unit) => number;
  connected: (a: Pos, b: Pos, u: Unit) => boolean;
  route: (s: Match, u: Unit, route: Pos[]) => boolean;
  cost: (s: Match, u: Unit, route: Pos[]) => number;
  moved: (u: Unit, route: Pos[]) => void;
}
const keys = ["P", "M", "K", "E"] as const;
const zero = (): Stock => ({ P: 0, M: 0, K: 0, E: 0 });
const d = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const able = (s: Match, u: Unit | undefined) =>
  !!u?.alive &&
  u.active &&
  u.supplied &&
  !activeEffects(s, u).some((e) =>
    ["stunned", "incapacitated", "rout"].includes(e.kind),
  );
const parties = (q: Grievance) => [
  ...new Set([q.offenderSeat, q.claimantSeat]),
];
const willing = (q: Grievance) =>
  parties(q).every((p) => q.consents.includes(p));
/** Actual injury only. Bounded oldest resolved records may be retired; active
 * deliveries and unresolved grievances are never discarded to hide a dispute. */
export function recordGrievance(
  s: CouncilState,
  attacker: Unit,
  victim: Unit,
  injury: number,
): Grievance | undefined {
  if (
    !Number.isFinite(injury) ||
    injury <= 0 ||
    !s.players[attacker.owner] ||
    !s.players[victim.owner] ||
    attacker.id === victim.id ||
    !["worker", "company", "beast"].includes(victim.kind)
  )
    return;
  const duplicate = Object.values(s.grievances ?? {}).find(
    (q) =>
      q.offender === attacker.id &&
      q.claimant === victim.id &&
      q.revision === s.revision &&
      !q.resolved,
  );
  if (duplicate) {
    duplicate.injury += injury;
    return duplicate;
  }
  if (Object.keys(s.grievances).length >= 128) {
    const old = Object.values(s.grievances).find(
      (q) =>
        q.resolved &&
        !Object.values(s.restitutions).some(
          (j) =>
            j.grievance === q.id &&
            (j.phase !== "arrived" || keys.some((k) => j.cargo[k] !== 0)),
        ),
    );
    if (old) {
      for (const [id, j] of Object.entries(s.restitutions))
        if (j.grievance === old.id) delete s.restitutions[id];
      delete s.grievances[old.id];
    } else return;
  }
  const id = `grievance:${s.nextId++}`;
  const q: Grievance = {
    id,
    offender: attacker.id,
    claimant: victim.id,
    offenderSeat: attacker.owner,
    claimantSeat: victim.owner,
    x: victim.x,
    y: victim.y,
    turn: s.turn,
    revision: s.revision,
    injury,
    payment: null,
    termsVersion: 0,
    consents: [],
    delivered: false,
    resolved: false,
    mediator: null,
  };
  s.grievances[id] = q;
  return q;
}
export function termsReason(
  s: CouncilState,
  seat: string,
  id: string,
  payment: Stock,
): string {
  const q = s.grievances[id];
  if (!q || q.resolved || !parties(q).includes(seat))
    return "An unresolved recorded grievance involving your party is required";
  if (
    q.delivered ||
    Object.values(s.restitutions).some((j) => j.grievance === id)
  )
    return "Existing delivered or escrowed terms cannot be rewritten";
  if (
    keys.some((k) => !Number.isSafeInteger(payment[k]) || payment[k] < 0) ||
    keys.reduce((n, k) => n + payment[k], 0) < 1 ||
    keys.reduce((n, k) => n + payment[k], 0) > 20
  )
    return "Agree one to twenty existing stocks, within provisional courier capacity";
  return "";
}
export function offerTerms(
  s: CouncilState,
  seat: string,
  id: string,
  payment: Stock,
  mediator?: string,
): void {
  const reason = termsReason(s, seat, id, payment);
  if (reason) throw new Error(reason);
  const q = s.grievances[id];
  const chosen =
    mediator ??
    parties(q).find((p) => s.players[p].profile === "nienna") ??
    null;
  if (chosen && s.players[chosen]?.profile !== "nienna")
    throw new Error("Mediator must be an existing Nienna player");
  q.termsVersion++;
  q.payment = { ...payment };
  q.consents = [seat];
  q.mediator = chosen;
}
export function consentTerms(
  s: CouncilState,
  seat: string,
  id: string,
  accept: boolean,
): void {
  const q = s.grievances[id];
  if (consentReason(s, seat, id))
    throw new Error(
      "Actual participating party and offered exact terms required",
    );
  q.consents = q.consents.filter((p) => p !== seat);
  if (accept) q.consents.push(seat);
}
export function restitutionBusy(s: CouncilState, unit: string): boolean {
  return Object.values(s.restitutions ?? {}).some(
    (j) => j.carrier === unit && j.phase === "travel",
  );
}
export function deliveryReason(
  s: CouncilState,
  seat: string,
  id: string,
  carrier: string,
  origin: string,
  destination: string,
  route: Pos[],
  c: CouncilChecks,
): string {
  const q = s.grievances[id],
    u = s.units[carrier],
    f = s.facilities[origin],
    to = s.facilities[destination];
  if (
    !q ||
    q.resolved ||
    !q.payment ||
    q.delivered ||
    !willing(q) ||
    q.offenderSeat !== seat
  )
    return "Exact restitution terms and both parties consent required";
  if (Object.values(s.restitutions).some((j) => j.grievance === id))
    return "Restitution already escrowed; recover its existing cargo";
  if (
    !able(s, u) ||
    u.owner !== seat ||
    !["worker", "company"].includes(u.kind) ||
    restitutionBusy(s, u.id)
  )
    return "Available supplied ordinary physical courier required";
  if (
    !f ||
    f.owner !== seat ||
    f.hp <= 0 ||
    f.workers < 1 ||
    d(f, u) > 1 ||
    !to ||
    to.owner !== q.claimantSeat ||
    to.hp <= 0 ||
    to.workers < 1
  )
    return "Existing staffed payer depot and recipient site required";
  if (
    !route.length ||
    route.length > 256 ||
    d(route[0], u) !== 0 ||
    d(route.at(-1)!, to) > 1 ||
    route.some((p, i) => i > 0 && d(p, route[i - 1]) !== 1) ||
    !c.route(s, u, route) ||
    c.cost(s, u, route) > (c.allowance?.(s, u) ?? u.move)
  )
    return "Actual open surveyed delivery route within ordinary carrying pace required";
  if (keys.some((k) => s.players[seat].stock[k] < q.payment![k]))
    return "Agreed actual stocks unavailable";
  return "";
}
export function deliverRestitution(
  s: CouncilState,
  seat: string,
  id: string,
  carrier: string,
  origin: string,
  destination: string,
  route: Pos[],
  c: CouncilChecks,
): Restitution {
  const reason = deliveryReason(
    s,
    seat,
    id,
    carrier,
    origin,
    destination,
    route,
    c,
  );
  if (reason) throw new Error(reason);
  const q = s.grievances[id],
    u = s.units[carrier];
  for (const k of keys) s.players[seat].stock[k] -= q.payment![k];
  const key = `restitution:${s.nextId++}`;
  const j: Restitution = {
    id: key,
    grievance: id,
    owner: seat,
    carrier,
    origin,
    destination,
    route: structuredClone(route),
    index: 0,
    cargo: { ...q.payment! },
    phase: "travel",
    x: u.x,
    y: u.y,
  };
  s.restitutions[key] = j;
  return j;
}
export function progressRestitution(s: CouncilState, c: CouncilChecks): void {
  for (const j of Object.values(s.restitutions)) {
    if (j.phase !== "travel") continue;
    const q = s.grievances[j.grievance],
      u = s.units[j.carrier],
      f = s.facilities[j.destination];
    if (!u?.alive || u.owner !== j.owner) {
      j.phase = "lost";
      continue;
    }
    if (
      !able(s, u) ||
      !q ||
      !willing(q) ||
      !f ||
      f.owner !== q.claimantSeat ||
      f.hp <= 0 ||
      f.workers < 1 ||
      d(u, j) !== 0
    )
      continue;
    const traveled: Pos[] = [{ x: u.x, y: u.y }];
    let steps = 0;
    for (let i = j.index + 1; i < j.route.length; i++) {
      const segment = [j.route[i - 1], j.route[i]],
        cost = c.cost(s, u, segment);
      if (
        !c.route(s, u, segment) ||
        steps + cost > (c.allowance?.(s, u) ?? u.move)
      )
        break;
      steps += cost;
      j.index = i;
      u.x = j.x = j.route[i].x;
      u.y = j.y = j.route[i].y;
      traveled.push({ x: u.x, y: u.y });
    }
    if (traveled.length > 1) c.moved(u, traveled);
    if (j.index === j.route.length - 1 && d(u, f) <= 1) {
      for (const k of keys) s.players[q.claimantSeat].stock[k] += j.cargo[k];
      j.cargo = zero();
      j.phase = "arrived";
      q.delivered = true;
    }
  }
}
export function councilReason(
  s: CouncilState,
  seat: string,
  id: string,
  c: CouncilChecks,
): string {
  const q = s.grievances[id],
    p = s.players[seat],
    h = p && s.units[p.hero.id];
  if (
    !q ||
    q.resolved ||
    q.mediator !== seat ||
    p?.profile !== "nienna" ||
    p.hero.status !== "living" ||
    !able(s, h) ||
    p.hero.readiness < 3
  )
    return "Living Nienna invited to an unresolved council and three readiness required";
  if (!willing(q) || !q.delivered)
    return "Both parties must remain willing and agreed restitution must actually be delivered";
  const a = s.units[q.offender],
    b = s.units[q.claimant];
  if (
    !a?.alive ||
    !b?.alive ||
    a.owner !== q.offenderSeat ||
    b.owner !== q.claimantSeat ||
    !c.connected(h!, a, h!) ||
    !c.connected(h!, b, h!)
  )
    return "Existing participating groups and mediator must share one connected region";
  return "";
}
export function settleCouncil(
  s: CouncilState,
  seat: string,
  id: string,
  c: CouncilChecks,
): void {
  const reason = councilReason(s, seat, id, c);
  if (reason) throw new Error(reason);
  s.players[seat].hero.readiness -= 3;
  s.grievances[id].resolved = true;
}
export function validateCouncils(s: CouncilState, guestSeat?: string): void {
  const bounded = (p: Pos) =>
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < s.map.width &&
    p.y < s.map.height;
  for (const [id, q] of Object.entries(s.grievances)) {
    if (
      id !== q.id ||
      !s.players[q.offenderSeat] ||
      !s.players[q.claimantSeat] ||
      !bounded(q) ||
      q.turn < 1 ||
      q.turn > s.turn ||
      q.revision < 0 ||
      q.revision > s.revision ||
      q.injury <= 0 ||
      (q.payment ? q.termsVersion < 1 : q.termsVersion !== 0) ||
      (q.mediator !== null && s.players[q.mediator]?.profile !== "nienna") ||
      (q.payment !== null &&
        (keys.some(
          (k) => !Number.isSafeInteger(q.payment![k]) || q.payment![k] < 0,
        ) ||
          keys.reduce((n, k) => n + q.payment![k], 0) < 1 ||
          keys.reduce((n, k) => n + q.payment![k], 0) > 20)) ||
      (!q.payment && (q.consents.length > 0 || q.delivered || q.resolved)) ||
      (q.resolved && (!q.delivered || !willing(q))) ||
      (!guestSeat &&
        q.delivered !==
          Object.values(s.restitutions).some(
            (j) => j.grievance === id && j.phase === "arrived",
          )) ||
      new Set(q.consents).size !== q.consents.length ||
      q.consents.some((p) => !parties(q).includes(p)) ||
      (guestSeat &&
        !parties(q).includes(guestSeat) &&
        !(q.mediator === guestSeat && willing(q)))
    )
      throw new Error("Invalid recorded grievance");
  }
  for (const [id, m] of Object.entries(s.survivorMemories))
    if (
      id !== m.id ||
      s.players[m.owner]?.profile !== "nienna" ||
      !s.players[m.knownOwner] ||
      !bounded(m) ||
      m.turn > s.turn ||
      m.revision > s.revision ||
      (guestSeat && m.owner !== guestSeat)
    )
      throw new Error("Invalid dated survivor memory");
  const ids = new Set<string>();
  for (const [id, j] of Object.entries(s.restitutions)) {
    const q = s.grievances[j.grievance];
    if (
      id !== j.id ||
      !q ||
      j.owner !== q.offenderSeat ||
      !bounded(j) ||
      !q.payment ||
      d(j, j.route[j.index] ?? { x: -1, y: -1 }) !== 0 ||
      (j.phase !== "arrived" &&
        keys.some((k) => j.cargo[k] !== q.payment![k])) ||
      (j.phase === "arrived" && !q.delivered) ||
      j.index < 0 ||
      j.index >= j.route.length ||
      j.route.some(
        (p, i) => !bounded(p) || (i > 0 && d(p, j.route[i - 1]) !== 1),
      ) ||
      keys.some((k) => !Number.isSafeInteger(j.cargo[k]) || j.cargo[k] < 0) ||
      (j.phase === "arrived" && keys.some((k) => j.cargo[k] !== 0)) ||
      ids.has(j.grievance) ||
      (guestSeat && j.owner !== guestSeat)
    )
      throw new Error("Invalid conserved restitution");
    ids.add(j.grievance);
  }
}

export function recoveryReason(
  s: CouncilState,
  seat: string,
  id: string,
  carrier: string,
  route: Pos[],
  c: CouncilChecks,
): string {
  const j = s.restitutions[id],
    u = s.units[carrier],
    q = j && s.grievances[j.grievance],
    f = j && s.facilities[j.destination];
  if (
    !j ||
    j.owner !== seat ||
    j.phase !== "lost" ||
    !q ||
    !willing(q) ||
    !f ||
    f.hp <= 0 ||
    f.owner !== q.claimantSeat
  )
    return "Existing lost restitution and continuing recipient consent required";
  if (
    !able(s, u) ||
    u.owner !== seat ||
    !["worker", "company"].includes(u.kind) ||
    restitutionBusy(s, u.id) ||
    d(u, j) !== 0
  )
    return "Available owned courier must reach the actual lost cargo";
  return !route.length ||
    d(route[0], u) !== 0 ||
    d(route.at(-1)!, f) > 1 ||
    !c.route(s, u, route) ||
    c.cost(s, u, route) > (c.allowance?.(s, u) ?? u.move)
    ? "Open normal recovery route required"
    : "";
}
export function recoverRestitution(
  s: CouncilState,
  seat: string,
  id: string,
  carrier: string,
  route: Pos[],
  c: CouncilChecks,
): void {
  const reason = recoveryReason(s, seat, id, carrier, route, c);
  if (reason) throw new Error(reason);
  const j = s.restitutions[id];
  j.carrier = carrier;
  j.route = structuredClone(route);
  j.index = 0;
  j.phase = "travel";
}

export interface SurvivorMemory {
  id: string;
  owner: string;
  party: string;
  knownOwner: string;
  x: number;
  y: number;
  turn: number;
  revision: number;
}
/** Dated recovery planning only; never changes fog-of-war or revives casualties. */
export function rememberSurvivors(
  s: Match & { survivorMemories: Record<string, SurvivorMemory> },
  u: Unit,
  route: Pos[],
): void {
  if (
    u.kind !== "company" ||
    !u.alive ||
    u.hp >= u.maxHp ||
    route.length < 2 ||
    d(u, route.at(-1)!) !== 0
  )
    return;
  if (
    Object.values(s.units).some(
      (v) =>
        v.id !== u.id &&
        v.alive &&
        v.kind === "company" &&
        effectiveRelation(s, u.owner, v.owner) === "alliance" &&
        d(v, u) <= 2,
    )
  )
    return;
  for (const p of Object.values(s.players)) {
    const h = s.units[p.hero.id];
    if (
      p.profile !== "nienna" ||
      p.hero.status !== "living" ||
      !able(s, h) ||
      effectiveRelation(s, p.seat, u.owner) !== "alliance" ||
      d(h, u) > 3 ||
      !sightline(s, h, u)
    )
      continue;
    const id = `survivor:${p.seat}:${u.id}`;
    s.survivorMemories[id] = {
      id,
      owner: p.seat,
      party: u.id,
      knownOwner: u.owner,
      x: u.x,
      y: u.y,
      turn: s.turn,
      revision: s.revision,
    };
    const rows = Object.values(s.survivorMemories)
      .filter((q) => q.owner === p.seat)
      .sort((a, b) => a.revision - b.revision || a.id.localeCompare(b.id));
    while (rows.length > 64) delete s.survivorMemories[rows.shift()!.id];
  }
}

export type CouncilAction =
  | { kind: "council-drop"; restitution: string }
  | {
      kind: "council-terms";
      grievance: string;
      payment: Stock;
      mediator: string;
    }
  | {
      kind: "council-consent";
      grievance: string;
      accept: boolean;
      termsVersion: number;
    }
  | {
      kind: "council-deliver";
      grievance: string;
      carrier: string;
      origin: string;
      destination: string;
      route: Pos[];
    }
  | {
      kind: "council-recover";
      restitution: string;
      carrier: string;
      route: Pos[];
    }
  | { kind: "council-settle"; grievance: string };
export function consentReason(
  s: CouncilState,
  seat: string,
  id: string,
): string {
  const q = s.grievances[id];
  return !q || q.resolved || !q.payment || !parties(q).includes(seat)
    ? "Actual participating party and offered exact terms required"
    : "";
}
export function councilVisible(q: Grievance, seat: string): boolean {
  return parties(q).includes(seat) || (q.mediator === seat && willing(q));
}
