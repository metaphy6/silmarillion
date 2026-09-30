import {isFieldEngineer} from "./fieldworks";
import { effectiveRelation } from "./diplomacy";
import { rangedZonePenalty } from "./zones";
import descriptors from "../content/abilities.json";
import type { Match, Stock, Unit, Facility, Pos } from "./types";
import { recipe } from "../content/catalog";
import { factionProduction } from "../content/production";
export class AbilityValidationError extends Error {}
export type Power = "field" | "support";
export interface AbilityDescriptor {
  source: {
    name: string;
    effect: string;
    cost: string;
    range: string;
    duration: string;
    counter: string;
  };
  categories: string[];
  operation: string;
  target: { kind: string; maxCount: number; scopeText: string };
  cost: { readiness: number; stocks: Stock; additionalRequirements: string };
  commitment: "tactical" | "weekly-hero";
  timing: { text: string; phases: number | null; warningPhases: number | null };
  parameters: Record<string, unknown>;
  restrictions: string[];
  unspecified: string;
}
export function ability(id: string, which: Power): AbilityDescriptor {
  const profiles = descriptors.profiles as unknown as Record<
    string,
    Record<Power, AbilityDescriptor>
  >;
  if (!profiles[id]) throw new Error("Unknown ability profile");
  return structuredClone(profiles[id][which]);
}
// Three metres per tile, one-tile short push and two-hit "heavy" strikes are
// provisional discretization/tuning, not additional adopted roster numbers.
const METRES_PER_TILE = 3;
export const zonePowerProfiles = new Set([
  "varda",
  "arien",
  "vana",
  "spider_brood",
  "namo",
  "ent_grove",
  "elf_feanor",
]);
export const supportedAbilities = new Set([
  ...Array.from(zonePowerProfiles, (id) => `${id}:field`),
  "este:field",
  "manwe:field",
  "aule:field",
  "yavanna:field",
  "elf_vanyar:support",
  "istari_gandalf:field",
  "istari_gandalf:support",
  "istari_saruman:field",
  "istari_radagast:field",
  "istari_radagast:support",
  "istari_alatar:field",
  "istari_alatar:support",
  "istari_pallando:field",
  "istari_pallando:support",
  "melkor_worldbreaker:field",
  "melkor_dark_architect:support",
  "elf_vanyar:field",
  "elf_finarfin:field",
  "nienna:field",
  "sauron:field",
  "istari_ember:field",
  "istari_grove:field",
  "istari_forge:field",
  "troll_hold:field",
  "dwarf_nogrod:field",
  "elf_sindar:field",
  "hobbit_shire:field",
  "tilion:field",
  "orc_fortress_clan:field",
]);
type Target = Unit | Facility;
const dist = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y);
const living = (t: Target | undefined): t is Unit =>
  !!t && "alive" in t && t.alive && t.hp > 0;
const entity = (s: Match, id: string): Target | undefined =>
  s.units[id] ?? s.facilities[id];
const terrain = (s: Match, p: Pos) => s.map.terrain[p.y * s.map.width + p.x];
const ordinary = (u: Unit) =>
  !["hero", "drake", "dragon", "winged-dragon", "balrog"].includes(u.kind);
const activeEffect = (s: Match, u: Unit, kind: string) =>
  u.effects.find((e) => e.kind === kind && e.until > s.revision);
const friendly = (s: Match, seat: string, owner: string) =>
  owner === seat ||
  (s.players[seat].relations[owner] === "alliance" &&
    s.players[owner]?.relations[seat] === "alliance");
const hostile = (s: Match, seat: string, owner: string) =>
  seat !== owner && effectiveRelation(s, seat, owner) === "war";
function clearSight(s: Match, a: Pos, b: Pos) {
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  for (let i = 1; i < steps; i++) {
    const p = {
      x: Math.round(a.x + ((b.x - a.x) * i) / steps),
      y: Math.round(a.y + ((b.y - a.y) * i) / steps),
    };
    if (
      terrain(s, p) === "cliff" ||
      Object.values(s.facilities).some(
        (f) => f.hp > 0 && f.x === p.x && f.y === p.y,
      )
    )
      return false;
  }
  return true;
}
function pushDestination(s: Match, h: Pos, t: Unit): Pos | null {
  const dx = t.x - h.x,
    dy = t.y - h.y;
  if (dx === 0 && dy === 0) return null;
  const p = {
    x: t.x + (Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) : 0),
    y: t.y + (Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0),
  };
  if (
    p.x < 0 ||
    p.y < 0 ||
    p.x >= s.map.width ||
    p.y >= s.map.height ||
    ["cliff", "water"].includes(terrain(s, p)) ||
    Object.values(s.facilities).some(
      (f) => f.hp > 0 && f.x === p.x && f.y === p.y,
    )
  )
    return null;
  return p;
}
function connected(s: Match, start: Pos, end: Pos) {
  const queue = [start],
    seen = new Set([`${start.x},${start.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === end.x && p.y === end.y) return true;
    for (const n of [
      { x: p.x + 1, y: p.y },
      { x: p.x - 1, y: p.y },
      { x: p.x, y: p.y + 1 },
      { x: p.x, y: p.y - 1 },
    ]) {
      const key = `${n.x},${n.y}`;
      if (
        n.x < 0 ||
        n.y < 0 ||
        n.x >= s.map.width ||
        n.y >= s.map.height ||
        seen.has(key) ||
        ["water", "cliff"].includes(terrain(s, n))
      )
        continue;
      seen.add(key);
      queue.push(n);
    }
  }
  return false;
}
const rangeByKey: Record<string, number> = {
  "este:field": 1,
  "manwe:field": 8,
  "aule:field": 1.5,
  "yavanna:field": 8,
  "istari_gandalf:field": 18 / 3,
  "istari_gandalf:support": 10 / 3,
  "istari_saruman:field": 16 / 3,
  "istari_radagast:field": 14 / 3,
  "istari_radagast:support": 1,
  "istari_alatar:field": 24 / 3,
  "istari_alatar:support": 24 / 3,
  "istari_pallando:field": 18 / 3,
  "istari_pallando:support": 8 / 3,
  "melkor_worldbreaker:field": 8,
};
Object.assign(rangeByKey, {
  "sauron:field": 12 / 3,
  "istari_ember:field": 8 / 3,
  "istari_grove:field": 1,
  "istari_forge:field": 1,
  "troll_hold:field": 1.5,
  "dwarf_nogrod:field": 1.5,
  "tilion:field": 15 / 3,
});
const ownUnitFields = new Set([
  "orc_fortress_clan:field",
  "elf_vanyar:field",
  "elf_finarfin:field",
  "sauron:field",
  "istari_ember:field",
  "istari_grove:field",
  "istari_forge:field",
  "dwarf_nogrod:field",
  "elf_sindar:field",
  "hobbit_shire:field",
]);
function preparedAttack(s: Match, u: Unit, seat: string, h: Unit) {
  const actual=Object.values(s.tacticalOrders).filter(q=>(q.kind==='pursuit'||q.kind==='ranged-attack')&&q.unit===u.id&&q.until>s.revision&&q.createdTurn===s.turn).map(q=>q);
  const known=s.attackPreparations?.filter(q=>q.unit===u.id&&q.until>s.revision)??[];
  return [...actual,...known].find(q=>{if(!('target'in q))return false;const victim=s.units[q.target];return victim?.alive&&ordinary(victim)&&friendly(s,seat,victim.owner)&&dist(h,victim)<=15/METRES_PER_TILE;});
}

function enchantmentSources(s: Match, u: Unit) {
  const allowed = [
    "hit-ward",
    "ward",
    "damage-reduction-percent",
    "spell-damage-reduction-percent",
    "magic-duration-reduction",
    "move-limit",
  ];
  return [
    ...new Set(
      u.effects
        .filter(
          (e) =>
            e.until > s.revision &&
            allowed.includes(e.kind) &&
            (e.source.startsWith("cast:") || e.source.startsWith("circle:")) &&
            !u.effects.some(
              (suppressed) =>
                suppressed.kind === "suppressed" &&
                suppressed.source === e.source &&
                suppressed.until > s.revision,
            ),
        )
        .map((e) => e.source),
    ),
  ];
}

/** Validation is repeated at resolution. Caller owns payment and commitments. */
export function abilityAvailability(
  s: Match,
  seat: string,
  which: Power,
  targetId: string,
  anchor?: Pos,
): string {
  const p = s.players[seat];
  if (!p) return "Unknown seat";
  const key = `${p.profile}:${which}`,
    a = ability(p.profile, which);
  if (key === "istari_saruman:support")
    return "Commission the Iron Servant uses Produce → Resonant Sentinel at a staffed Orthanc Workshop; its paid two-turn queue is the ability route";
  if (key === "dwarf_belegost:field")
    return "Fit the Guard unavailable: typed consumable protection kits and explicit hazard selection are not implemented";
  if (!supportedAbilities.has(key))
    return `${a.source.name} unavailable: ${a.operation} requires its dedicated ${a.target.kind} rules; not implemented in this runtime.`;
  const h = s.units[p.hero.id];
  if (p.hero.status !== "living" || !h?.alive || !h.active || h.hp <= 0)
    return "Living active hero required";
  if (
    key === "este:field" &&
    h.effects.some(
      (e) =>
        e.until > s.revision &&
        e.value > 0 &&
        ["stunned", "incapacitated", "silenced", "rout"].includes(e.kind),
    )
  )
    return "Uninterrupted treatment requires an able healer";
  const t =
    which === "field" && zonePowerProfiles.has(p.profile) && anchor
      ? ({ ...anchor, id: targetId, owner: seat, hp: 1 } as Facility)
      : entity(s, targetId);
  if (!t || t.hp <= 0 || ("alive" in t && !t.alive))
    return "Existing living target required";
  if (which === "field" && zonePowerProfiles.has(p.profile)) {
    const centre = anchor ?? t;
    if (
      centre.x < 0 ||
      centre.y < 0 ||
      centre.x >= s.map.width ||
      centre.y >= s.map.height
    )
      return "Zone centre must be on the map";
    const limit = ["namo", "varda", "vana"].includes(p.profile)
      ? 8
      : p.profile === "arien"
        ? 15 / METRES_PER_TILE
        : p.profile === "elf_feanor"
          ? 3
          : 10 / METRES_PER_TILE;
    if (dist(h, centre) > limit || !clearSight(s, h, centre))
      return "Zone requires a visible local approach within range";
    if (p.profile === "ent_grove" && terrain(s, centre) !== "woodland")
      return "Existing woodland roots are required";
    if (p.profile === "vana" && terrain(s, centre) !== "woodland")
      return "Existing woodland vegetation is required";
    if (
      p.profile === "arien" &&
      !Object.values(s.zones).some(
        (z) =>
          ["smoke", "mist"].includes(z.kind) &&
          z.until > s.revision &&
          Math.hypot(z.x - centre.x, z.y - centre.y) <= z.radius + 1,
      )
    )
      return "An actual ordinary smoke or mist patch is required";
    if (p.profile === "namo") {
      const blocked = (x: number, y: number) =>
        x < 0 ||
        y < 0 ||
        x >= s.map.width ||
        y >= s.map.height ||
        ["water", "cliff"].includes(terrain(s, { x, y })) ||
        Object.values(s.facilities).some(
          (f) => f.hp > 0 && f.x === x && f.y === y,
        );
      if (
        !(blocked(centre.x - 1, centre.y) && blocked(centre.x + 1, centre.y)) &&
        !(blocked(centre.x, centre.y - 1) && blocked(centre.x, centre.y + 1))
      )
        return "A real narrow threshold between opposite blocked flanks is required";
    }
    if (
      !["varda", "arien"].includes(p.profile) &&
      ["water", "cliff"].includes(terrain(s, centre))
    )
      return "A passable ground approach is required";
    if (p.profile === "elf_feanor" && dist(h, centre) === 0)
      return "Select a direction away from the hero for the flare";
    return "";
  }
  if (a.commitment === "weekly-hero") {
    if (!("workers" in t) || t.owner !== seat)
      return "Owned production facility required";
    if (!t.job) return "Existing fully paid queue job required";
    if (t.workers < 1) return "Staff must remain at the worksite";
    if (t.job.started >= s.turn)
      return "Job must have started in an earlier turn";
    if (t.job.remaining < 2)
      return "Job already completes at the next ordinary production step";
    const r = recipe(p.profile, t.job.recipe);
    if (!r || r.facility !== t.kind)
      return "Valid matching recipe and facility required";
    if (r.access.some((access) => !p.sources.includes(access)))
      return "Required recipe source access is unavailable";
    if (r.kind === "hero")
      return "Hero creation and recreation retain their full prescribed time";
    if (
      key === "elf_vanyar:support" &&
      (t.kind !== "training" || t.job.recipe !== "company")
    )
      return "An existing paid infantry training job is required";
    if (
      t.job.great &&
      Object.values(s.units).some(
        (u) => u.owner === seat && u.alive && !u.supplied,
      )
    )
      return "Unpaid creature upkeep stalls production";
    if (p.memory.includes(`accelerated:${s.turn}:${t.job.id}`))
      return "Job already accelerated this week";
    return connected(s, h, t)
      ? ""
      : "No connected traversable route to the worksite";
  }
  if (key === "troll_hold:field") {
    if ("alive" in t || !["gate", "barricade"].includes(t.kind))
      return "An existing gate or barricade is required";
  } else if (key === "aule:field") {
    if ("alive" in t || !["cover", "barricade", "siege-brace"].includes(t.kind))
      return "An exposed cover structure or siege brace is required, not a unit or settlement";
  } else if (key !== "melkor_worldbreaker:field" && !living(t))
    return "Living unit target required";
  const support =
    key === "istari_gandalf:support" ||
    key === "istari_radagast:support" ||
    key === "istari_pallando:support" ||
    key === "nienna:field" ||
    key === "este:field" ||
    ownUnitFields.has(key);
  if (ownUnitFields.has(key) && t.owner !== seat)
    return "Owned unit required; this power does not command allies";
  if (support ? !friendly(s, seat, t.owner) : !hostile(s, seat, t.owner))
    return support
      ? "Friendly consenting target required"
      : "Hostile enemy target required";
  const aimedPosition =
    anchor &&
    which === "field" &&
    ["istari_gandalf", "istari_radagast"].includes(p.profile)
      ? anchor
      : t;
  if (dist(h, aimedPosition) > (rangeByKey[key] ?? 8))
    return "Outside ability range";
  if (!clearSight(s, h, aimedPosition) || !clearSight(s, h, t))
    return "Solid cover blocks the ability sightline";
  if (living(t)) {
    if (
      [
        "elf_vanyar:field",
        "elf_finarfin:field",
        "sauron:field",
        "orc_fortress_clan:field",
        "dwarf_nogrod:field",
        "elf_sindar:field",
      ].includes(key) &&
      t.kind !== "company"
    )
      return "Owned ordinary infantry company required";
    if (
      [
        "nienna:field",
        "istari_ember:field",
        "istari_grove:field",
        "hobbit_shire:field",
      ].includes(key) &&
      !ordinary(t)
    )
      return "Ordinary formation required; heroes, Dragons and Balrogs are excluded";
    if (
      ["elf_finarfin:field", "nienna:field", "istari_ember:field"].includes(
        key,
      ) &&
      !activeEffect(s, t, "fear")?.value
    )
      return "Existing panic or fear penalty required";
    if (
      key === "istari_ember:field" &&
      t.effects.some(
        (e) =>
          e.kind === "ember-used" && e.source === `encounter:${s.turn}:ember`,
      )
    )
      return "This group already received its once-per-encounter panic recovery";
    if (key === "orc_fortress_clan:field" && !activeEffect(s, t, "rout")?.value)
      return "An existing temporary rout condition is required";
    if (key === "sauron:field") {
      if (activeEffect(s, t, "fallback-authorized"))
        return "The existing Black Command is active; identical effects cannot stack";
      if (!activeEffect(s, t, "cohesion-loss")?.value)
        return "One existing lost cohesion step is required";
      const fallback = activeEffect(s, t, "declared-fallback")?.source.match(
        /^fallback:(\d+):(\d+)$/,
      );
      if (!fallback)
        return "An existing declared fallback route is required; no extra order is created";
      const destination = { x: Number(fallback[1]), y: Number(fallback[2]) };
      if (
        destination.x >= s.map.width ||
        destination.y >= s.map.height ||
        !connected(s, t, destination)
      )
        return "The declared fallback route is blocked";
    }
    if (key === "istari_grove:field" || key === "este:field") {
      if (t.kind === "construct")
        return "An ordinary living patient is required, not a construct";
      if (
        !t.effects.some(
          (e) =>
            ["wound", "deteriorating-wound"].includes(e.kind) &&
            e.value > 0 &&
            e.until > s.revision,
        )
      )
        return "An actual nonfatal wound condition is required; missing HP alone is not a wound record";
    }
    if (key === "istari_forge:field") {
      if (t.kind !== "construct")
        return "Owned nonhero construct made by this order required";
      if (
        !t.effects.some(
          (e) =>
            ["movement-impairment", "damaged-joint"].includes(e.kind) &&
            e.value > 0 &&
            e.until > s.revision,
        )
      )
        return "An existing movement impairment is required; destroyed parts are not recreated";
    }
    if (key === "dwarf_nogrod:field") {
      if(!isFieldEngineer(t))return "An actual engineer company is required";
      const name = factionProduction("dwarf_nogrod").equipment.name;
      if (
        !t.inventory.some((id) => {
          const item = s.items[id];
          return (
            item?.name === name &&
            item.owner === seat &&
            item.bearer === t.id &&
            item.durability > 0
          );
        })
      )
        return "Engineers must carry their existing owned breach-tool set";
    }
    if (key === "elf_sindar:field" || key === "hobbit_shire:field") {
      if (
        key === "hobbit_shire:field" &&
        !["company", "worker"].includes(t.kind)
      )
        return "Own civilian or light-infantry group required";
      if (
        terrain(s, t) !== "woodland" ||
        ![
          { x: t.x + 1, y: t.y },
          { x: t.x - 1, y: t.y },
          { x: t.x, y: t.y + 1 },
          { x: t.x, y: t.y - 1 },
        ].some(
          (n) =>
            n.x >= 0 &&
            n.y >= 0 &&
            n.x < s.map.width &&
            n.y < s.map.height &&
            terrain(s, n) === "woodland",
        )
      )
        return "Existing linked cover and a covered exit are required";
    }
    if (key === "tilion:field" && !preparedAttack(s, t, seat, h))
      return "An actual prepared attack against a nearby ordinary ally is required";
  }
  if (key === "manwe:field" && living(t)) {
    if (t.kind === "hero") return "An exposed formation is required";
    if (activeEffect(s, t, "braced"))
      return "Anchored cover prevents this push";
    if (!pushDestination(s, h, t))
      return "Push destination is blocked or not traversable";
  }
  if (
    (key === "yavanna:field" || key === "istari_radagast:field") &&
    living(t)
  ) {
    if (terrain(s, t) !== "woodland")
      return "Existing living vegetation is required";
    if (t.flying && !t.landed) return "Grounded target required";
    if (activeEffect(s, t, "disable-grace"))
      return "Target has two-phase disable reapplication grace";
  }
  if (key === "istari_radagast:support" && living(t)) {
    if (t.kind === "construct")
      return "Living flesh required; constructs cannot be healed";
    if (
      t.effects.some(
        (e) =>
          e.kind === "healing-used" &&
          e.source === `encounter:${s.turn}:radagast`,
      )
    )
      return "Patient already received this healing once this encounter";
    if (t.hp === t.maxHp && !activeEffect(s, t, "poison"))
      return "Patient has no missing health or ordinary poison";
  }
  if (key === "istari_pallando:field" && living(t)) {
    const sources = enchantmentSources(s, t);
    if (sources.length === 0)
      return "One identified active cast ward or enchantment is required; inherent traits and allegiance are ineligible";
    if (sources.length > 1)
      return "Multiple enchantments need explicit selection; this target interface currently supports exactly one identified cast source";
  }
  return "";
}

function effect(
  s: Match,
  u: Unit,
  kind: string,
  value: number,
  phases: number,
  source: string,
) {
  // Identical protection uses the strongest source; no additive recasting.
  const old = u.effects.find((e) => e.kind === kind && e.until > s.revision);
  if (old) {
    const stronger =
      kind === "move-limit" ? value <= old.value : value >= old.value;
    if (stronger) {
      old.value = value;
      old.source = source;
    }
    old.until = Math.max(old.until, s.revision + phases);
    return;
  }
  u.effects.push({ kind, value, until: s.revision + phases, source });
}
function victims(
  s: Match,
  seat: string,
  h: Unit,
  centre: Pos & { id?: string },
  max: number,
  radius: number,
  filter: (u: Unit) => boolean,
) {
  return Object.values(s.units)
    .filter(
      (u) =>
        u.alive &&
        u.hp > 0 &&
        hostile(s, seat, u.owner) &&
        dist(u, centre) <= radius &&
        clearSight(s, h, u) &&
        filter(u),
    )
    .sort((a, b) =>
      a.id === centre.id
        ? -1
        : b.id === centre.id
          ? 1
          : dist(a, centre) - dist(b, centre) || a.id.localeCompare(b.id),
    )
    .slice(0, max);
}
export function resolveAbility(
  s: Match,
  seat: string,
  which: Power,
  targetId: string,
  callbacks: {
    damage: (target: string, amount: number, ability?: boolean) => void;
    event: (text: string) => void;
  },
  anchor?: Pos,
): void {
  const p = s.players[seat];
  if (!p) throw new Error("Unknown seat");
  const key = `${p.profile}:${which}`,
    a = ability(p.profile, which),
    h = s.units[p.hero.id];
  const anchoredArea =
    anchor &&
    which === "field" &&
    ["istari_gandalf", "istari_radagast"].includes(p.profile);
  let validationTarget = targetId;
  if (anchoredArea) {
    if (p.hero.status !== "living" || !h?.alive || !h.active || h.hp <= 0)
      throw new AbilityValidationError("Living active hero required");
    const candidates = victims(
      s,
      seat,
      h,
      { ...anchor, id: targetId },
      Number.MAX_SAFE_INTEGER,
      2.5 / METRES_PER_TILE,
      () => true,
    );
    const eligible = candidates.find(
      (u) => !abilityAvailability(s, seat, which, u.id, anchor),
    );
    if (!eligible) {
      callbacks.event(
        `${a.source.name} finds no eligible target in its original warned area.`,
      );
      return;
    }
    validationTarget = eligible.id;
  }
  const reason = abilityAvailability(
    s,
    seat,
    which,
    validationTarget,
    anchoredArea || zonePowerProfiles.has(p.profile) ? anchor : undefined,
  );
  if (reason) throw new AbilityValidationError(reason);
  const t = entity(s, validationTarget)!;
  const centre = anchoredArea ? { ...anchor, id: targetId } : t;
  if (which === "field" && zonePowerProfiles.has(p.profile)) {
    const at = anchor ?? t;
    const flare = p.profile === "elf_feanor",
      roots = p.profile === "ent_grove",
      optical = ["varda", "arien", "vana"].includes(p.profile),
      circle = roots || optical;
    const length = Math.hypot(at.x - h.x, at.y - h.y) || 1;
    const approachLength = p.profile === "spider_brood" ? 2 : 1;
    const dx = flare
      ? (at.x - h.x) / length
      : (-(at.y - h.y) / length) * approachLength;
    const dy = flare
      ? (at.y - h.y) / length
      : at.x === h.x && at.y === h.y
        ? approachLength
        : ((at.x - h.x) / length) * approachLength;
    const id = `zone:${s.nextId++}`;
    s.zones[id] = {
      id,
      owner: seat,
      kind:
        p.profile === "varda"
          ? "light"
          : p.profile === "arien"
            ? "clear-air"
            : p.profile === "vana"
              ? "bloomscreen"
              : flare
                ? "flare"
                : roots
                  ? "roots"
                  : p.profile === "namo"
                    ? "threshold"
                    : "web",
      x: flare ? h.x : circle ? at.x : at.x - dx / 2,
      y: flare ? h.y : circle ? at.y : at.y - dy / 2,
      dx: circle ? 0 : dx,
      dy: circle ? 0 : dy,
      radius: flare ? 3 : circle ? 1 : 0.35,
      until: s.revision + (flare ? 1 : p.profile === "arien" ? 2 : 3),
      triggered: false,
    };
    callbacks.event(
      `${a.source.name} establishes a bounded visible approach zone.`,
    );
    return;
  }
  const source = `cast:${seat}:${s.turn}:${s.revision}:${which}`;
  switch (key) {
    case "elf_vanyar:field":
      effect(
        s,
        t as Unit,
        "formation-damage-reduction-percent",
        25,
        1,
        `formation:${seat}:${t.x}:${t.y}`,
      );
      break;
    case "elf_finarfin:field":
      effect(s, t as Unit, "fear-suppression", 1, 2, source);
      break;
    case "nienna:field": {
      const fear = activeEffect(s, t as Unit, "fear")!;
      fear.value = Math.max(0, fear.value - 1);
      break;
    }
    case "orc_fortress_clan:field": {
      const u = t as Unit;
      const rout = activeEffect(s, u, "rout")!;
      u.effects.splice(u.effects.indexOf(rout), 1);
      break;
    }
    case "sauron:field": {
      const u = t as Unit;
      activeEffect(s, u, "cohesion-loss")!.value--;
      effect(
        s,
        u,
        "fallback-authorized",
        1,
        2,
        activeEffect(s, u, "declared-fallback")!.source,
      );
      break;
    }
    case "istari_ember:field": {
      const recipients = Object.values(s.units)
        .filter(
          (u) =>
            u.owner === seat &&
            u.alive &&
            ordinary(u) &&
            dist(h, u) <= 8 / METRES_PER_TILE &&
            clearSight(s, h, u) &&
            activeEffect(s, u, "fear")?.value &&
            !u.effects.some(
              (e) =>
                e.kind === "ember-used" &&
                e.source === `encounter:${s.turn}:ember`,
            ),
        )
        .sort((x, y) =>
          x.id === t.id
            ? -1
            : y.id === t.id
              ? 1
              : dist(x, t) - dist(y, t) || x.id.localeCompare(y.id),
        )
        .slice(0, 2);
      for (const u of recipients) {
        activeEffect(s, u, "fear")!.value--;
        u.effects.push({
          kind: "ember-used",
          value: 1,
          until: s.revision + 4,
          source: `encounter:${s.turn}:ember`,
        });
      }
      break;
    }
    case "este:field":
    case "istari_grove:field": {
      const u = t as Unit,
        wound = u.effects.find(
          (e) =>
            ["wound", "deteriorating-wound"].includes(e.kind) &&
            e.value > 0 &&
            e.until > s.revision,
        )!;
      if (key === "este:field") {
        for (const patient of Object.values(s.units)) {
          if (
            patient.effects.some(
              (e) => e.kind === "treatment-link" && e.source === h.id,
            )
          )
            patient.effects = patient.effects.filter(
              (e) => !["treatment-link", "stabilized-wound"].includes(e.kind),
            );
        }
      }
      // Replacing a treatment must not retain a different healer's stale link.
      u.effects = u.effects.filter((e) => e.kind !== "treatment-link");
      if (key === "este:field")
        u.effects.push({
          kind: "treatment-link",
          value: 1,
          until: s.revision + Math.max(1, 3 - s.combatPhase),
          source: h.id,
        });
      effect(
        s,
        u,
        "stabilized-wound",
        1,
        Math.max(1, 3 - s.combatPhase),
        wound.source,
      );
      break;
    }
    case "istari_forge:field": {
      const u = t as Unit,
        joint = u.effects.find(
          (e) =>
            ["movement-impairment", "damaged-joint"].includes(e.kind) &&
            e.value > 0 &&
            e.until > s.revision,
        )!;
      effect(
        s,
        u,
        "movement-repair",
        joint.value,
        Math.max(1, 3 - s.combatPhase),
        joint.source,
      );
      break;
    }
    case "troll_hold:field":
      effect(
        s,
        h,
        "breach-bonus-percent",
        25,
        Math.max(1, 3 - s.combatPhase),
        `breach:${t.id}`,
      );
      break;
    case "dwarf_nogrod:field":
      effect(
        s,
        t as Unit,
        "breach-bonus-percent",
        25,
        Math.max(1, 3 - s.combatPhase),
        "breach:ordinary-obstacle",
      );
      break;
    case "elf_sindar:field":
    case "hobbit_shire:field":
      effect(
        s,
        t as Unit,
        "ranged-accuracy-reduction-percent",
        25,
        1,
        `covered:${t.x}:${t.y}`,
      );
      break;
    case "tilion:field": {
      const u = t as Unit,
        prepared = preparedAttack(s, u, seat, h)!;
      callbacks.damage(u.id, h.attack, false);
      if("id"in prepared)delete s.tacticalOrders[prepared.id];
      break;
    }
    case "manwe:field": {
      const at = pushDestination(s, h, t as Unit)!;
      Object.assign(t, at);
      break;
    }
    case "aule:field":
    case "melkor_worldbreaker:field":
      callbacks.damage(t.id, h.attack * 2, true);
      break;
    case "yavanna:field": {
      const u = t as Unit;
      effect(s, u, "move-limit", Math.max(1, u.move - 1), 3, source);
      effect(s, u, "disable-grace", 1, 5, source);
      break;
    }
    case "istari_gandalf:field": {
      const hits = victims(
        s,
        seat,
        h,
        centre,
        3,
        2.5 / METRES_PER_TILE,
        () => true,
      );
      for (const u of hits) callbacks.damage(u.id, h.attack * 2, true);
      const selected = s.units[targetId];
      if (hits.some((u) => u.id === targetId) && living(selected)) {
        const order=Object.values(s.tacticalOrders).find(q=>q.kind==='ranged-attack'&&q.unit===selected.id&&q.createdTurn===s.turn&&q.until>s.revision);
        if(order)delete s.tacticalOrders[order.id];
      }
      break;
    }
    case "istari_gandalf:support": {
      const recipients = Object.values(s.units)
        .filter(
          (u) =>
            u.alive &&
            u.hp > 0 &&
            friendly(s, seat, u.owner) &&
            dist(h, u) <= 10 / METRES_PER_TILE &&
            clearSight(s, h, u),
        )
        .sort((x, y) =>
          x.id === t.id
            ? -1
            : y.id === t.id
              ? 1
              : dist(x, t) - dist(y, t) || x.id.localeCompare(y.id),
        )
        .slice(0, 2);
      for (const u of recipients) {
        const fear = activeEffect(s, u, "fear");
        if (fear) fear.value = Math.max(0, fear.value - 1);
        effect(s, u, "hit-ward", h.attack, 2, source);
      }
      break;
    }
    case "istari_saruman:field": {
      const dx = t.x - h.x,
        dy = t.y - h.y,
        len = Math.hypot(dx, dy);
      const hits = Object.values(s.units)
        .filter((u) => {
          const projection = ((u.x - h.x) * dx + (u.y - h.y) * dy) / (len || 1),
            offset = Math.abs((u.x - h.x) * dy - (u.y - h.y) * dx) / (len || 1);
          return (
            u.alive &&
            u.hp > 0 &&
            hostile(s, seat, u.owner) &&
            projection > 0 &&
            projection <= 16 / METRES_PER_TILE &&
            offset <= 1.5 / METRES_PER_TILE &&
            clearSight(s, h, u)
          );
        })
        .sort((x, y) => dist(h, x) - dist(h, y) || x.id.localeCompare(y.id))
        .slice(0, 2);
      for (const u of hits) {
        callbacks.damage(u.id, h.attack * 2, true);
        const at = pushDestination(s, h, u);
        if (u.alive && at && !activeEffect(s, u, "braced"))
          Object.assign(u, at);
      }
      break;
    }
    case "istari_radagast:field": {
      for (const u of victims(
        s,
        seat,
        h,
        centre,
        2,
        2.5 / METRES_PER_TILE,
        (u) =>
          terrain(s, u) === "woodland" &&
          (!u.flying || u.landed) &&
          !activeEffect(s, u, "disable-grace"),
      )) {
        callbacks.damage(u.id, h.attack * 2, true);
        effect(s, u, "move-limit", 1, 1, source);
        effect(s, u, "disable-grace", 1, 3, source);
      }
      break;
    }
    case "istari_radagast:support": {
      const u = t as Unit;
      u.hp = Math.min(u.maxHp, u.hp + h.attack * 2);
      const index = u.effects.findIndex(
        (e) => e.kind === "poison" && e.until > s.revision,
      );
      if (index >= 0) u.effects.splice(index, 1);
      u.effects.push({
        kind: "healing-used",
        value: 1,
        until: s.revision + 4,
        source: `encounter:${s.turn}:radagast`,
      });
      break;
    }
    case "istari_alatar:field": {
      // Provisional ordinary ranged hit chance; cover blocks above, armor is in callback.
      s.rng = (Math.imul(1664525, s.rng) + 1013904223) >>> 0;
      const chance = 0.85 * (1 - rangedZonePenalty(s, h, t) / 100);
      if (s.rng / 4294967296 < chance)
        callbacks.damage(t.id, h.attack * 3, true);
      else callbacks.event(`${a.source.name} misses its exposed target.`);
      break;
    }
    case "istari_alatar:support": {
      const u = t as Unit;
      u.effects = u.effects.filter(
        (e) => !(e.kind === "quarry-mark" && e.source === `quarry:${seat}`),
      );
      u.effects.push({
        kind: "quarry-mark",
        value: 24 / METRES_PER_TILE,
        until: s.revision + 3,
        source: `quarry:${seat}`,
      });
      break;
    }
    case "istari_pallando:field": {
      const u = t as Unit,
        selected = enchantmentSources(s, u)[0];
      callbacks.damage(u.id, h.attack * 2, true);
      u.effects.push({
        kind: "suppressed",
        value: 1,
        until: s.revision + 2,
        source: selected,
      });
      break;
    }
    case "istari_pallando:support": {
      const centre = `circle:${t.x}:${t.y}`;
      const recipients = Object.values(s.units)
        .filter(
          (u) =>
            u.alive &&
            u.hp > 0 &&
            friendly(s, seat, u.owner) &&
            dist(u, t) <= 2.5 / METRES_PER_TILE &&
            clearSight(s, h, u),
        )
        .sort((x, y) =>
          x.id === t.id ? -1 : y.id === t.id ? 1 : x.id.localeCompare(y.id),
        )
        .slice(0, 2);
      for (const u of recipients) {
        effect(s, u, "spell-damage-reduction-percent", 50, 2, centre);
        effect(s, u, "magic-duration-reduction", 1, 2, centre);
      }
      break;
    }
    case "elf_vanyar:support":
    case "melkor_dark_architect:support": {
      const f = t as Facility;
      f.job!.remaining = Math.max(1, f.job!.remaining - 1);
      p.memory.push(`accelerated:${s.turn}:${f.job!.id}`);
      if (p.memory.length > 100) p.memory.shift();
      break;
    }
    default:
      throw new Error("No explicit handler exists");
  }
  callbacks.event(
    `${a.source.name} resolves under its explicit adopted effect.`,
  );
}
