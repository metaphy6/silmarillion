import type { Match, Pos, Unit } from "./types";
import { activeEffects } from "./effects";
import { movementPenalty } from "./conditions";
import { movementZonePenalty } from "./zones";
import { terrainObserved } from "./visibility";
import { fatigueMovementPenalty } from "./fatigue";
import { crossingAllows } from "./crossings";
import { effectiveRelation } from "./diplomacy";
export interface MovementPowerRequest {
  members: { unit: string; to: Pos }[];
}
export interface MovementPlan {
  id: string;
  owner: string;
  profile: string;
  createdTurn: number;
  createdRevision: number;
  lastResolvedRevision: number;
  until: number;
  pace: number;
  members: {
    unit: string;
    route: Pos[];
    woodlandDiscount: number;
    complete: boolean;
  }[];
}
export type MovementRouteFinder = (
  s: Match,
  start: Pos,
  end: Pos,
  unit: Unit,
) => Pos[] | null;
export interface PlannedMove {
  unit: string;
  route: Pos[];
  to: Pos;
}
const distance = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y);
const terrain = (s: Match, p: Pos) => s.map.terrain[p.y * s.map.width + p.x];
/** Provisional normal terrain tuning: each entered woodland tile costs one
 * extra movement point for grounded units. Nandor discounts exactly one. */
export function woodlandMovementCost(s: Match, u: Unit, route: Pos[]): number {
  return u.flying && !u.landed
    ? 0
    : route.slice(1).filter((p) => terrain(s, p) === "woodland").length;
}
function allowance(s: Match, u: Unit): number {
  return Math.min(
    Math.max(1, u.move - movementPenalty(s, u) - fatigueMovementPenalty(s, u)),
    ...activeEffects(s, u)
      .filter((e) => e.kind === "move-limit")
      .map((e) => e.value),
  );
}
function cost(s: Match, u: Unit, route: Pos[], discount: number): number {
  return (
    route.length -
    1 +
    Math.max(0, woodlandMovementCost(s, u, route) - discount) +
    movementZonePenalty(s, u, route)
  );
}
function inspect(
  s: Match,
  seat: string,
  request: MovementPowerRequest,
  path: MovementRouteFinder,
): { reason: string; routes: Pos[][]; pace: number } {
  const fail = (reason: string) => ({ reason, routes: [], pace: 0 });
  const p = s.players[seat],
    h = p && s.units[p.hero.id];
  if (!p || !h?.alive || !h.active || p.hero.status !== "living")
    return fail("Living active hero required");
  if (
    !["nessa", "elf_nandor", "eonwe", "melkor_dark_architect"].includes(
      p.profile,
    )
  )
    return fail("This profile has no movement-plan power");
  if (
    activeEffects(s, h).some(
      (e) =>
        ["stunned", "incapacitated", "silenced"].includes(e.kind) &&
        e.value > 0,
    )
  )
    return fail("Hero cannot prepare a coordinated movement");
  const count =
    p.profile === "eonwe" ? 2 : p.profile === "melkor_dark_architect" ? 3 : 1;
  if (
    request.members.length < 1 ||
    request.members.length > count ||
    new Set(request.members.map((m) => m.unit)).size !== request.members.length
  )
    return fail(`Choose one to ${count} distinct eligible formations`);
  const routes: Pos[][] = [],
    units: Unit[] = [];
  for (const m of request.members) {
    const u = s.units[m.unit];
    if (!u?.alive || !u.active) return fail("Living active formation required");
    if (p.profile === "nessa") {
      if (
        u.owner !== seat &&
        effectiveRelation(s, seat, u.owner) !== "alliance"
      )
        return fail("Own or mutually allied consenting formation required");
    } else if (u.owner !== seat) return fail("Owned formation required");
    if (p.profile === "melkor_dark_architect") {
      if (u.great <= 0 || u.kind === "hero")
        return fail("Owned great creature required");
      if (!u.supplied)
        return fail("Great creatures must retain normal supplied status");
    } else if (u.kind !== "company")
      return fail(
        "Ordinary infantry company required; heroes, Dragons and Balrogs excluded",
      );
    if (distance(h, u) > (p.profile === "eonwe" ? 10 / 3 : 8))
      return fail("Formation is outside the hero local command range");
    if (activeEffects(s, u).some((e) => e.kind === "root" && e.value > 0))
      return fail("Rooted formation cannot move");
    if (
      Object.values(s.convoys).some(
        (c) => c.carrier === u.id && c.phase !== "lost",
      )
    )
      return fail("An active convoy carrier cannot abandon its cargo route");
    // Nandor has exactly one ordinary company production line: Canopy Scouts
    // (trusted faction role scout). There is no heavy-company recipe or foreign
    // ordinary-company acquisition; owner+company currently identifies light infantry.
    if (!Number.isInteger(m.to.x) || !Number.isInteger(m.to.y))
      return fail("Integer route endpoint required");
    const route = path(s, u, m.to, u);
    if (
      !route ||
      route.length < 2 ||
      route[0].x !== u.x ||
      route[0].y !== u.y ||
      route.at(-1)!.x !== m.to.x ||
      route.at(-1)!.y !== m.to.y
    )
      return fail("A real nonempty traversable route is required");
    for (let i = 0; i < route.length; i++) {
      const at = route[i];
      if (
        at.x < 0 ||
        at.y < 0 ||
        at.x >= s.map.width ||
        at.y >= s.map.height ||
        !Number.isInteger(at.x) ||
        !Number.isInteger(at.y)
      )
        return fail("Route leaves the map");
      if (
        i &&
        Math.abs(at.x - route[i - 1].x) + Math.abs(at.y - route[i - 1].y) !== 1
      )
        return fail("Route cannot teleport between tiles");
      if (
        (!u.flying || u.landed) &&
        ["water", "cliff"].includes(terrain(s, at)) &&
        !crossingAllows(s, at, u)
      )
        return fail("Route is blocked or not traversable");
      if (
        i &&
        (!u.flying || u.landed) &&
        Object.values(s.facilities).some(
          (f) =>
            f.hp > 0 &&
            f.x === at.x &&
            f.y === at.y &&
            !(f.kind === "crossing-anchor" && crossingAllows(s, at, u)),
        )
      )
        return fail("Route is blocked by a standing structure");
      if (!terrainObserved(s, seat, at))
        return fail("Entire route must remain visible and surveyed");
    }
    if (p.profile === "nessa") {
      if (route.length - 1 > 2)
        return fail(
          "Rapid reposition requires a short path of at most two tiles",
        );
      if (
        Object.values(s.units).some(
          (enemy) =>
            enemy.alive &&
            enemy.active &&
            effectiveRelation(s, seat, enemy.owner) === "war" &&
            activeEffects(s, enemy).some(
              (e) => e.kind === "prepared-intercept",
            ) &&
            route.slice(1).some((at) => distance(enemy, at) <= 1),
        )
      )
        return fail("A prepared interceptor controls this route");
    }
    const discount = p.profile === "elf_nandor" ? 1 : 0;
    if (discount && !woodlandMovementCost(s, u, route))
      return fail("An actual ordinary woodland penalty is required");
    if (
      cost(s, u, route, discount) >
      allowance(s, u) * (p.profile === "eonwe" ? 2 : 1)
    )
      return fail("Route exceeds normal movement allowance");
    units.push(u);
    routes.push(route);
  }
  const pace = Math.min(...units.map((u) => allowance(s, u)));
  if (p.profile === "eonwe") {
    for (let a = 0; a < routes.length; a++)
      for (let b = a + 1; b < routes.length; b++) {
        const separation = distance(routes[a][0], routes[b][0]);
        for (let i = 1; i < Math.max(routes[a].length, routes[b].length); i++)
          if (
            distance(
              routes[a][Math.min(i, routes[a].length - 1)],
              routes[b][Math.min(i, routes[b].length - 1)],
            ) >
            separation + 1e-9
          )
            return fail(
              "Shared advance must not increase formation separation",
            );
      }
  }
  if (
    p.profile === "melkor_dark_architect" &&
    units.some(
      (u) => distance(units[0], u) > 8 || !path(s, units[0], u, units[0]),
    )
  )
    return fail("Great creatures require one connected front");
  return { reason: "", routes, pace };
}
export function validateMovementPower(
  s: Match,
  seat: string,
  request: MovementPowerRequest,
  path: MovementRouteFinder,
): string {
  return inspect(s, seat, request, path).reason;
}
/** Pure preparation: parent pays the source readiness/commitments and ordinary
 * operations, increments nextId and persists this plan. No coordinates change. */
export function prepareMovementPower(
  s: Match,
  seat: string,
  request: MovementPowerRequest,
  path: MovementRouteFinder,
): MovementPlan {
  const result = inspect(s, seat, request, path);
  if (result.reason) throw new Error(result.reason);
  const profile = s.players[seat].profile;
  return {
    id: `movement:${s.nextId}`,
    owner: seat,
    profile,
    createdTurn: s.turn,
    createdRevision: s.revision,
    lastResolvedRevision: s.revision,
    until: s.revision + (profile === "eonwe" ? 3 : 2),
    pace: result.pace,
    members: request.members.map((m, i) => ({
      unit: m.unit,
      route: result.routes[i],
      woodlandDiscount: profile === "elf_nandor" ? 1 : 0,
      complete: false,
    })),
  };
}
export function resolveMovementPlan(
  s: Match,
  plan: MovementPlan,
  path: MovementRouteFinder,
): { reason: string; moves: PlannedMove[] } {
  const fail = (reason: string) => ({ reason, moves: [] });
  if (s.turn !== plan.createdTurn || s.revision >= plan.until)
    return fail("Movement plan expired");
  if (s.revision <= plan.createdRevision)
    return fail("Movement preparation needs one response phase");
  if (s.revision <= plan.lastResolvedRevision)
    return fail("This movement plan already advanced this tactical phase");
  if (s.players[plan.owner]?.profile !== plan.profile)
    return fail("Movement plan profile mismatch");
  const pending = plan.members.filter((m) => !m.complete);
  if (!pending.length) return fail("Movement plan already completed");
  for (const m of pending) {
    const u = s.units[m.unit];
    if (!u || u.x !== m.route[0].x || u.y !== m.route[0].y)
      return fail("A planned formation was displaced from its declared route");
  }
  const request = {
    members: pending.map((m) => ({ unit: m.unit, to: m.route.at(-1)! })),
  };
  const check = inspect(s, plan.owner, request, path);
  if (check.reason) return fail(check.reason);
  for (const [i, m] of pending.entries())
    if (JSON.stringify(check.routes[i]) !== JSON.stringify(m.route))
      return fail(
        "The declared route changed or was blocked; no automatic rerouting",
      );
  const moves: PlannedMove[] = [];
  for (const [i, m] of pending.entries()) {
    const u = s.units[m.unit],
      route = check.routes[i];
    const budget = Math.min(
      allowance(s, u),
      plan.profile === "eonwe" ? plan.pace : Infinity,
    );
    let length = 1;
    while (
      length < route.length &&
      cost(s, u, route.slice(0, length + 1), m.woodlandDiscount) <= budget
    )
      length++;
    if (length === 1)
      return fail(
        "No paid ordinary movement is possible along the remaining route",
      );
    const leg = route.slice(0, length);
    moves.push({ unit: u.id, route: leg, to: leg.at(-1)! });
  }
  if (plan.profile === "eonwe") {
    const sharedSteps = Math.min(...moves.map((m) => m.route.length));
    for (const move of moves) {
      move.route = move.route.slice(0, sharedSteps);
      move.to = move.route.at(-1)!;
    }
  }
  return { reason: "", moves };
}
/** Call only after every returned normal move has executed successfully. */
export function consumeMovementPlanStep(
  plan: MovementPlan,
  moves: PlannedMove[],
  revision: number,
): void {
  plan.lastResolvedRevision = revision;
  for (const move of moves) {
    const member = plan.members.find((m) => m.unit === move.unit);
    if (!member) continue;
    const end = member.route.at(-1)!;
    member.complete = end.x === move.to.x && end.y === move.to.y;
    if (!member.complete) {
      const index = member.route.findIndex(
        (p) => p.x === move.to.x && p.y === move.to.y,
      );
      if (index >= 0) member.route = member.route.slice(index);
    }
    member.woodlandDiscount = 0;
  }
}

/** Cross-field checkpoint checks complement the structural save schema. The
 * host remains trusted; these are consistency checks, not anti-cheat proofs. */
export function validateMovementPlanState(
  s: Match,
  plan: MovementPlan,
  guestSeat?: string,
): void {
  const fail = () => {
    throw new Error("Invalid movement plan checkpoint invariant");
  };
  const p = s.players[plan.owner],
    group =
      plan.profile === "eonwe"
        ? 2
        : plan.profile === "melkor_dark_architect"
          ? 3
          : 1;
  if (
    !p ||
    p.profile !== plan.profile ||
    !["nessa", "elf_nandor", "eonwe", "melkor_dark_architect"].includes(
      plan.profile,
    ) ||
    s.movementPlans[plan.id] !== plan ||
    (guestSeat && plan.owner !== guestSeat)
  )
    fail();
  if (
    !Number.isSafeInteger(plan.createdTurn) ||
    plan.createdTurn !== s.turn ||
    !Number.isSafeInteger(plan.createdRevision) ||
    plan.createdRevision < 0 ||
    plan.createdRevision > s.revision ||
    !Number.isSafeInteger(plan.lastResolvedRevision) ||
    plan.lastResolvedRevision < plan.createdRevision ||
    plan.lastResolvedRevision > s.revision ||
    plan.until !== plan.createdRevision + (plan.profile === "eonwe" ? 3 : 2) ||
    s.revision >= plan.until
  )
    fail();
  if (
    !Number.isSafeInteger(plan.pace) ||
    plan.pace < 1 ||
    plan.pace > 100 ||
    plan.members.length < 1 ||
    plan.members.length > group ||
    new Set(plan.members.map((m) => m.unit)).size !== plan.members.length
  )
    fail();
  const operationCost = plan.profile === "eonwe" ? plan.members.length : 1;
  if (
    p.commitment !== 0 ||
    p.operations > 3 - operationCost ||
    (plan.profile !== "melkor_dark_architect" && !p.encounter)
  )
    fail();
  for (const member of plan.members) {
    const u = s.units[member.unit];
    if (!u && !guestSeat) fail();
    if (u) {
      if (plan.profile !== "nessa" && u.owner !== plan.owner) fail();
      if (
        plan.profile === "melkor_dark_architect"
          ? u.great <= 0 || u.kind === "hero"
          : u.kind !== "company"
      )
        fail();
      if (plan.pace > u.move) fail();
    }
    if (
      ![0, 1].includes(member.woodlandDiscount) ||
      (member.woodlandDiscount === 1 && plan.profile !== "elf_nandor") ||
      !member.route.length ||
      member.route.length > 256
    )
      fail();
    if (member.complete && plan.lastResolvedRevision === plan.createdRevision)
      fail();
    for (const [i, at] of member.route.entries()) {
      if (
        !Number.isInteger(at.x) ||
        !Number.isInteger(at.y) ||
        at.x < 0 ||
        at.y < 0 ||
        at.x >= s.map.width ||
        at.y >= s.map.height
      )
        fail();
      if (
        i &&
        Math.abs(at.x - member.route[i - 1].x) +
          Math.abs(at.y - member.route[i - 1].y) !==
          1
      )
        fail();
    }
  }
}

/** Reserve the complete declared advance at preparation time. No additional
 * action is created and unused reservations are not refunded after interruption.
 * A two-company advance needing two full phases costs four, so the engine must
 * reject it against the existing three-operation weekly budget.
 */
export function movementOperationCost(s: Match, plan: MovementPlan): number {
  if (plan.profile === "melkor_dark_architect") return 1;
  if (plan.profile !== "eonwe") return plan.members.length;
  const pending = plan.members.filter((member) => !member.complete);
  if (!pending.length) return 0;
  let sharedLength = Infinity;
  for (const member of pending) {
    const unit = s.units[member.unit];
    if (!unit) return Number.POSITIVE_INFINITY;
    const budget = Math.min(allowance(s, unit), plan.pace);
    let length = 1;
    while (
      length < member.route.length &&
      cost(
        s,
        unit,
        member.route.slice(0, length + 1),
        member.woodlandDiscount,
      ) <= budget
    )
      length++;
    if (length === 1) return Number.POSITIVE_INFINITY;
    sharedLength = Math.min(sharedLength, length);
  }
  return (
    pending.length +
    pending.filter((member) => member.route.length > sharedLength).length
  );
}
