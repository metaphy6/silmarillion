import { isOrdinarySiege } from "./siege";
import { restoreItemDurability } from "./equipment";
import {
  stocks,
  type Action,
  type Match,
  type Pos,
  type RepairWork,
} from "./types";

type RepairAction = Extract<Action, { kind: "repair" }> & { kit?: string };
type Connected = (a: Pos, b: Pos) => boolean;
const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const repairPowerProfiles = new Set([
  "aule",
  "elf_feanor",
  "human_gondor",
  "istari_forge",
]);
export function repairCost(
  s: Match,
  seat: string,
  method: RepairAction["method"],
) {
  if (method === "ordinary") return stocks(0, 20, 5);
  const id = s.players[seat].profile;
  return id === "aule"
    ? stocks(0, 20, 5)
    : id === "human_gondor"
      ? stocks(0, 10)
      : id === "istari_forge"
        ? stocks(0, 15, 5)
        : stocks(0, 10, 5);
}
export function repairTarget(s: Match, id: string) {
  const item = s.items[id];
  if (item)
    return {
      kind: "item" as const,
      target: item,
      pos: item.bearer ? s.units[item.bearer] : item,
      current: item.durability,
      max: item.maxDurability,
    };
  const u = s.units[id];
  if (u?.alive && isOrdinarySiege(s, u))
    return {
      kind: "siege" as const,
      target: u,
      pos: u,
      current: u.hp,
      max: u.maxHp,
    };
  if (u?.kind === "construct" && u.alive)
    return {
      kind: "construct" as const,
      target: u,
      pos: u,
      current: u.hp,
      max: u.maxHp,
    };
  const f = s.facilities[id];
  if (
    f?.hp > 0 &&
    ["cover", "barricade", "siege-brace", "hold", "core"].includes(f.kind)
  )
    return {
      kind: "structure" as const,
      target: f,
      pos: f,
      current: f.hp,
      max: f.maxHp,
    };
  return undefined;
}
export function repairMaterials(s: Match, id: string): string[] {
  if (s.items[id]) return s.items[id].materials;
  if (s.units[id]) return ["metal"];
  // Paid fieldworks retain their actual construction tag; no timber substitution.
  if (s.fieldworks[id]) return [s.fieldworks[id].material];
  return ["cover", "barricade", "siege-brace"].includes(s.facilities[id]?.kind)
    ? ["timber"]
    : ["stone"];
}
function kitReason(s: Match, seat: string, a: RepairAction) {
  const required =
    a.method === "ordinary" &&
    s.players[seat].profile === "istari_forge" &&
    repairTarget(s, a.target)?.kind === "construct";
  if (!required)
    return a.kit
      ? "Repair kit is only used for ordinary Forge construct repairs"
      : "";
  const i = s.items[a.kit ?? ""],
    m = s.toolMetadata[a.kit ?? ""],
    f = s.facilities[a.facility],
    at = i?.bearer ? s.units[i.bearer] : i;
  return !i ||
    i.owner !== seat ||
    m?.function !== "repair-kit" ||
    m.maker !== seat ||
    i.durability !== 1 ||
    !at ||
    !f ||
    distance(at, f) > 1
    ? "Local unused repair kit made by this Forge order required"
    : "";
}
export function repairReason(
  s: Match,
  seat: string,
  a: RepairAction,
  connected: Connected,
) {
  const p = s.players[seat],
    f = s.facilities[a.facility],
    t = repairTarget(s, a.target),
    h = s.units[p.hero.id];
  if (!f || f.owner !== seat || f.hp <= 0 || f.workers < 1)
    return "Owned staffed repair worksite required";
  // Master's Repair replaces the specialist workshop, not the worksite,
  // full normal recipe, crew or provisional two-week repair duration.
  const power = a.method === "power";
  if (power && !repairPowerProfiles.has(p.profile))
    return "This profile has no repair-queue support power";
  if (
    power &&
    (p.hero.status !== "living" ||
      !h?.active ||
      p.hero.readiness < 3 ||
      p.commitment < 1)
  )
    return "Living hero, 3 readiness and one personal commitment required";
  if (power && !connected(h, f))
    return "Hero must be present in the connected worksite region";
  if (
    !["workshop", "depot", "service-depot"].includes(f.kind) &&
    !(power && p.profile === "aule")
  )
    return "Staffed workshop or depot repair queue required (Aulë may substitute an existing staffed worksite)";
  if (
    power &&
    p.profile === "human_gondor" &&
    (f.kind !== "depot" || p.stock.P < 2)
  )
    return "Supplied depot and 2P normal worksite upkeep required";
  if (power && p.profile === "elf_feanor" && f.kind !== "workshop")
    return "Rework the Setting requires a staffed workshop";
  if (power && p.profile === "istari_forge" && f.kind !== "service-depot")
    return "Staffed Forge service depot required";
  if (!t || t.target.owner !== seat || !t.pos || t.current >= t.max)
    return "Owned damaged existing item, fortification or construct required";
  if (t.kind === "item" && !s.items[a.target].crafted)
    return "Only a compatible crafted item can be repaired";
  if (distance(f, t.pos) > 1)
    return "Bring the existing target to the worksite; no remote repair";
  if (repairMaterials(s, a.target).some((x) => !p.sources.includes(x)))
    return "Required compatible target material source access is missing";
  if (power && p.profile === "elf_feanor" && t.kind !== "item")
    return "Rework the Setting requires one existing crafted item";
  if (
    power &&
    p.profile === "human_gondor" &&
    t.kind !== "structure" &&
    t.kind !== "siege"
  )
    return "Supply Refit requires an existing fortification or ordinary siege engine";
  if (
    power &&
    p.profile === "aule" &&
    !Object.values(s.units).some(
      (u) =>
        u.owner === seat &&
        u.kind === "worker" &&
        u.alive &&
        u.active &&
        distance(u, t.pos) <= 1,
    )
  )
    return "The normal repair crew must be beside the target";
  if (power && p.profile === "istari_forge") {
    if (
      !f.repair ||
      f.repair.target !== a.target ||
      f.repair.started >= s.turn ||
      f.repair.accelerated
    )
      return "One older already-funded repair, not previously accelerated, required";
  } else if (f.job || f.repair || f.rest)
    return "Repair/production queue occupied";
  if (
    Object.values(s.facilities).some(
      (x) => x.id !== f.id && x.repair?.target === a.target,
    )
  )
    return "Target already occupies another repair queue";
  const cost = repairCost(s, seat, a.method);
  if (
    (Object.keys(cost) as (keyof typeof cost)[]).some(
      (k) => p.stock[k] < cost[k],
    )
  )
    return "Insufficient repair stocks";
  return kitReason(s, seat, a);
}
function completeRepair(s: Match, f: Match["facilities"][string]) {
  const j = f.repair!;
  if (j.kind === "item") restoreItemDurability(s, j.target, j.amount);
  else {
    const target = s.units[j.target] ?? s.facilities[j.target];
    target.hp = Math.min(target.maxHp, target.hp + j.amount);
  }
  delete f.repair;
}
export function startRepair(s: Match, seat: string, a: RepairAction) {
  const invalidKit = kitReason(s, seat, a);
  if (invalidKit) throw new Error(invalidKit);
  if (a.kit) {
    const i = s.items[a.kit];
    if (i.bearer)
      s.units[i.bearer].inventory = s.units[i.bearer].inventory.filter(
        (id) => id !== a.kit,
      );
    s.players[seat].hero.equipment = s.players[seat].hero.equipment.filter(
      (id) => id !== a.kit,
    );
    delete s.items[a.kit];
    delete s.toolMetadata[a.kit];
  }

  const p = s.players[seat],
    f = s.facilities[a.facility],
    cost = repairCost(s, seat, a.method);
  for (const k of ["P", "M", "K", "E"] as const) p.stock[k] -= cost[k];
  if (a.method === "power") p.hero.readiness -= 3;
  if (a.method === "power" && p.profile === "istari_forge") {
    f.repair!.accelerated = true;
    if (--f.repair!.remaining <= 0) completeRepair(s, f);
    return;
  }
  const t = repairTarget(s, a.target)!;
  f.repair = {
    id: `repair:${s.nextId++}`,
    target: a.target,
    kind: t.kind,
    remaining: a.method === "ordinary" || p.profile === "aule" ? 2 : 1,
    started: s.turn,
    cost,
    amount: Math.max(1, Math.floor(t.max * 0.25)),
    method: a.method,
    accelerated: false,
  };
}
export function repairInvariant(s: Match, f: Match["facilities"][string]) {
  const j = f.repair;
  if (!j) return;
  const t = repairTarget(s, j.target);
  const expected = repairCost(s, f.owner, j.method);
  if (
    f.job ||
    f.rest ||
    (!["workshop", "depot", "service-depot"].includes(f.kind) &&
      !(j.method === "power" && s.players[f.owner].profile === "aule")) ||
    f.hp <= 0 ||
    !t ||
    t.target.owner !== f.owner ||
    j.kind !== t.kind ||
    j.started > s.turn ||
    j.amount !== Math.max(1, Math.floor(t.max * 0.25)) ||
    j.remaining >
      (j.method === "ordinary" || s.players[f.owner].profile === "aule"
        ? 2
        : 1) ||
    (Object.keys(expected) as (keyof typeof expected)[]).some(
      (k) => j.cost[k] !== expected[k],
    )
  )
    throw new Error("Invalid funded repair queue");
}
export function pruneRepairs(s: Match) {
  for (const f of Object.values(s.facilities))
    if (f.repair) {
      const t = repairTarget(s, f.repair.target);
      if (
        f.hp <= 0 ||
        !t ||
        t.target.owner !== f.owner ||
        (f.repair.method === "power" &&
          s.players[f.owner].hero.status !== "living")
      )
        delete f.repair;
    }
}
export function progressRepairs(
  s: Match,
  connected: (a: Pos, b: Pos) => boolean,
  notify: (text: string, seat: string) => void,
) {
  for (const f of Object.values(s.facilities).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const j: RepairWork | undefined = f.repair;
    if (!j) continue;
    const p = s.players[f.owner],
      t = repairTarget(s, j.target);
    if (f.hp <= 0 || !t || t.target.owner !== f.owner) {
      delete f.repair;
      continue;
    }
    if (
      !t.pos ||
      f.workers < 1 ||
      distance(f, t.pos) > 1 ||
      repairMaterials(s, j.target).some((x) => !p.sources.includes(x))
    )
      continue;
    if (
      j.method === "power" &&
      (p.hero.status !== "living" || !connected(s.units[p.hero.id], f))
    )
      continue;
    if (
      j.method === "power" &&
      p.profile === "aule" &&
      !Object.values(s.units).some(
        (u) =>
          u.owner === p.seat &&
          u.kind === "worker" &&
          u.alive &&
          u.active &&
          distance(u, t.pos) <= 1,
      )
    )
      continue;
    if (f.kind === "depot") {
      if (p.stock.P < 2) continue;
      p.stock.P -= 2;
    }
    if (--j.remaining > 0) continue;
    completeRepair(s, f);
    notify(
      `${t.target.name}: paid repair completed; no new item, ammunition or unit created.`,
      f.owner,
    );
    delete f.repair;
  }
}
