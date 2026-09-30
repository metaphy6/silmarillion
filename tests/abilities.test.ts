import {declareTacticalOrder} from "../src/simulation/tactical-orders";
import { describe, it, expect, vi } from "vitest";
import {
  ability,
  abilityAvailability,
  resolveAbility,
  supportedAbilities,
} from "../src/simulation/abilities";
import { createMatch } from "../src/simulation/engine";
import { stocks, type Match, type Unit } from "../src/simulation/types";
import { factionProduction } from "../src/content/production";

function setup(profile: string): Match {
  const s = createMatch([profile, "human_gondor"], 81);
  s.players.p1.hero.status = "living";
  const h: Unit = {
    ...structuredClone(s.units["p1:company:0"]),
    id: "p1:hero",
    kind: "hero",
    x: 4,
    y: 4,
    hp: 90,
    maxHp: 90,
    attack: 18,
    supply: 0,
    effects: [],
    inventory: [],
  };
  s.units[h.id] = h;
  Object.assign(s.facilities["p1:training"], { x: 4, y: 7 });
  Object.assign(s.units["p2:company:0"], { x: 6, y: 4 });
  Object.assign(s.units["p2:company:1"], { x: 6, y: 5 });
  s.map.terrain.fill("meadow");s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
  return s;
}
const callbacks = () => ({ damage: vi.fn(), event: vi.fn() });

describe("explicit adopted ability handlers", () => {
  it("retains source costs and tactical support commitments without mutation", () => {
    const a = ability("istari_radagast", "support");
    expect(a.cost.stocks).toEqual(stocks(10, 0, 0, 5));
    expect(a.commitment).toBe("tactical");
    a.cost.stocks.P = 999;
    expect(ability("istari_radagast", "support").cost.stocks.P).toBe(10);
  });
  it("reports unsupported domains and refuses execution without fake generic wards", () => {
    const s = setup("vaire"),
      before = structuredClone(s);
    expect(abilityAvailability(s, "p1", "support", "p1:training")).toMatch(
      /unavailable|not implemented/i,
    );
    expect(() =>
      resolveAbility(s, "p1", "support", "p1:training", callbacks()),
    ).toThrow();
    expect(s).toEqual(before);
    expect(supportedAbilities.has("vaire:support")).toBe(false);
  });
  it("pushes an exposed enemy one traversable tile without damage", () => {
    const s = setup("manwe"),
      c = callbacks();
    expect(abilityAvailability(s, "p1", "field", "p2:company:0")).toBe("");
    resolveAbility(s, "p1", "field", "p2:company:0", c);
    expect(s.units["p2:company:0"].x).toBe(7);
    expect(c.damage).not.toHaveBeenCalled();
  });
  it("cannot push a formation into cliffs or water", () => {
    for (const terrain of ["cliff", "water"]) {
      const s = setup("manwe");
      s.map.terrain[4 * s.map.width + 7] = terrain;
      expect(abilityAvailability(s, "p1", "field", "p2:company:0")).toMatch(
        /traversable|blocked/i,
      );
    }
  });
  it("uses explicit friendly/enemy and living-caster validation", () => {
    const s = setup("manwe");
    expect(abilityAvailability(s, "p1", "field", "p1:company:0")).toMatch(
      /enemy|hostile/i,
    );
    s.players.p1.hero.status = "dead";
    expect(abilityAvailability(s, "p1", "field", "p2:company:0")).toMatch(
      /living/i,
    );
  });
  it("Aule strikes an exposed structure, never a unit or capital", () => {
    const s = setup("aule"),
      c = callbacks();
    Object.assign(s.facilities["p2:training"], {
      x: 5,
      y: 4,
      kind: "barricade",
    });
    expect(abilityAvailability(s, "p1", "field", "p2:company:0")).toMatch(
      /structure|brace/i,
    );
    expect(abilityAvailability(s, "p1", "field", "p2:core")).not.toBe("");
    resolveAbility(s, "p1", "field", "p2:training", c);
    expect(c.damage).toHaveBeenCalledWith("p2:training", 36, true);
  });
  it("Gandalf burst selects at most three exposed enemies and interrupts only the selected prepared attack", () => {
    const s = setup("istari_gandalf"),
      c = callbacks();
    Object.assign(s.units["p1:company:0"],{x:4,y:4});
    Object.assign(s.units["p1:company:1"],{x:4,y:5});
    declareTacticalOrder(s,"p2",{kind:"ranged-attack",unit:"p2:company:0",target:"p1:company:0"},()=>null);
    declareTacticalOrder(s,"p2",{kind:"ranged-attack",unit:"p2:company:1",target:"p1:company:1"},()=>null);
    resolveAbility(s, "p1", "field", "p2:company:0", c);
    expect(c.damage).toHaveBeenCalledWith("p2:company:0", 36, true);
    expect(c.damage.mock.calls.length).toBeLessThanOrEqual(3);
    expect(
      Object.values(s.tacticalOrders).some(q=>q.unit==="p2:company:0"&&q.kind==="ranged-attack"),
    ).toBe(false);
    expect(
      Object.values(s.tacticalOrders).some(q=>q.unit==="p2:company:1"&&q.kind==="ranged-attack"),
    ).toBe(true);
  });
  it("Gandalf support gives one-hit wards and removes one fear step without healing", () => {
    const s = setup("istari_gandalf"),
      c = callbacks(),
      u = s.units["p1:company:0"];
    u.hp -= 10;
    const hp = u.hp;
    u.effects.push({ kind: "fear", value: 2, until: 20, source: "fear:test" });
    resolveAbility(s, "p1", "support", u.id, c);
    expect(u.hp).toBe(hp);
    expect(u.effects.find((e) => e.kind === "fear")?.value).toBe(1);
    expect(u.effects.find((e) => e.kind === "hit-ward")).toMatchObject({
      value: 18,
      until: s.revision + 2,
    });
  });
  it("Radagast heals a living patient up to missing HP and removes one poison", () => {
    const s = setup("istari_radagast"),
      u = s.units["p1:company:0"];
    Object.assign(u, { x: 4, y: 4 });
    u.hp = u.maxHp - 5;
    u.effects.push({ kind: "poison", value: 2, until: 20, source: "poison:1" });
    resolveAbility(s, "p1", "support", u.id, callbacks());
    expect(u.hp).toBe(u.maxHp);
    expect(u.effects.some((e) => e.kind === "poison")).toBe(false);
    expect(abilityAvailability(s, "p1", "support", u.id)).toMatch(
      /once|already/i,
    );
  });
  it("Radagast cannot heal constructs, dead targets, distant patients or enemies", () => {
    const s = setup("istari_radagast"),
      u = s.units["p1:company:0"];
    u.kind = "construct";
    expect(abilityAvailability(s, "p1", "support", u.id)).not.toBe("");
    u.kind = "company";
    u.alive = false;
    expect(abilityAvailability(s, "p1", "support", u.id)).not.toBe("");
    u.alive = true;
    u.x = 10;
    expect(abilityAvailability(s, "p1", "support", u.id)).not.toBe("");
    expect(abilityAvailability(s, "p1", "support", "p2:company:0")).not.toBe(
      "",
    );
  });
  it("Radagast root strike requires living vegetation and cannot root airborne targets", () => {
    const s = setup("istari_radagast"),
      u = s.units["p2:company:0"];
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/vegetation/i);
    s.map.terrain[u.y * s.map.width + u.x] = "woodland";
    u.flying = true;
    u.landed = false;
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/ground/i);
    u.landed = true;
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(u.effects.find((e) => e.kind === "move-limit")).toMatchObject({
      value: 1,
      until: s.revision + 1,
    });
  });
  it("accelerates only an older paid and staffed owned job without creating output", () => {
    const s = setup("melkor_dark_architect"),
      f = s.facilities["p1:training"];
    f.job = {
      id: "job:paid",
      recipe: "company",
      remaining: 3,
      started: s.turn - 1,
      cost: stocks(25, 20, 5),
      supply: 1,
      great: 0,
      binding: 0,
    };
    const count = Object.keys(s.units).length;
    resolveAbility(s, "p1", "support", f.id, callbacks());
    expect(f.job.remaining).toBe(2);
    expect(Object.keys(s.units)).toHaveLength(count);
  });
  it("rejects same-turn jobs, missing staff, foreign queues and unavailable recipe source access", () => {
    const s = setup("melkor_dark_architect"),
      f = s.facilities["p1:training"];
    f.job = {
      id: "job:paid",
      recipe: "company",
      remaining: 3,
      started: s.turn,
      cost: stocks(25, 20, 5),
      supply: 1,
      great: 0,
      binding: 0,
    };
    expect(abilityAvailability(s, "p1", "support", f.id)).toMatch(
      /earlier|started/i,
    );
    f.job.started--;
    f.workers = 0;
    expect(abilityAvailability(s, "p1", "support", f.id)).toMatch(/staff/i);
    f.workers = 1;
    f.owner = "p2";
    expect(abilityAvailability(s, "p1", "support", f.id)).toMatch(/owned/i);
    f.owner = "p1";
    s.players.p1.sources = [];
    expect(abilityAvailability(s, "p1", "support", f.id)).toMatch(/source/i);
  });
  it("rejects unhealthy prerequisites before mutating resources or effects", () => {
    const s = setup("melkor_dark_architect"),
      before = structuredClone(s);
    expect(() =>
      resolveAbility(s, "p1", "support", "p1:training", callbacks()),
    ).toThrow();
    expect(s).toEqual(before);
  });
  it("Alatar marks only the visible selected quarry for three phases and preserves allegiance", () => {
    const s = setup("istari_alatar"),
      u = s.units["p2:company:0"];
    resolveAbility(s, "p1", "support", u.id, callbacks());
    expect(u.effects.find((e) => e.kind === "quarry-mark")).toMatchObject({
      value: 8,
      until: s.revision + 3,
      source: "quarry:p1",
    });
    expect(u.owner).toBe("p2");
    expect(s.units["p2:company:1"].effects).toEqual([]);
  });
  it("Pallando suppresses an identified cast effect without deleting it or changing ownership", () => {
    const s = setup("istari_pallando"),
      u = s.units["p2:company:0"],
      c = callbacks();
    u.effects.push({
      kind: "hit-ward",
      value: 15,
      until: 12,
      source: "cast:p2:1:0:support",
    });
    resolveAbility(s, "p1", "field", u.id, c);
    expect(c.damage).toHaveBeenCalledWith(u.id, 36, true);
    expect(u.effects.find((e) => e.kind === "hit-ward")).toMatchObject({
      value: 15,
      until: 12,
    });
    expect(u.effects.find((e) => e.kind === "suppressed")).toMatchObject({
      source: "cast:p2:1:0:support",
      until: s.revision + 2,
    });
    expect(u.owner).toBe("p2");
  });
  it("Pallando cannot suppress innate traits, command allegiance or ambiguously choose multiple enchantments", () => {
    const s = setup("istari_pallando"),
      u = s.units["p2:company:0"];
    u.effects.push({
      kind: "hit-ward",
      value: 15,
      until: 12,
      source: "innate:armor",
    });
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(
      /identified|cast/i,
    );
    u.effects = [
      { kind: "hit-ward", value: 15, until: 12, source: "cast:one" },
      {
        kind: "spell-damage-reduction-percent",
        value: 50,
        until: 12,
        source: "cast:two",
      },
    ];
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(
      /multiple|select/i,
    );
  });
  it("Pallando circle grants spell-only resistance without healing or ownership changes", () => {
    const s = setup("istari_pallando"),
      u = s.units["p1:company:0"];
    Object.assign(u, { x: 4, y: 5 });
    u.hp -= 5;
    const hp = u.hp;
    resolveAbility(s, "p1", "support", u.id, callbacks());
    expect(u.hp).toBe(hp);
    expect(u.owner).toBe("p1");
    expect(
      u.effects.find((e) => e.kind === "spell-damage-reduction-percent"),
    ).toMatchObject({ value: 50, until: s.revision + 2, source: "circle:4:5" });
    expect(
      u.effects.find((e) => e.kind === "magic-duration-reduction")?.value,
    ).toBe(1);
  });
  it("Saruman hits at most two enemies in the narrow lane and never pushes through an obstacle", () => {
    const s = setup("istari_saruman"),
      c = callbacks();
    Object.assign(s.units["p2:company:1"], { x: 7, y: 4 });
    Object.assign(s.units["p2:company:2"], { x: 8, y: 4 });
    s.map.terrain[4 * s.map.width + 7] = "water";
    resolveAbility(s, "p1", "field", "p2:company:0", c);
    expect(c.damage).toHaveBeenCalledTimes(2);
    expect(c.damage).toHaveBeenCalledWith("p2:company:0", 36, true);
    expect(s.units["p2:company:0"].x).toBe(6);
    expect(s.units["p2:company:1"].x).toBe(8);
    expect(c.damage).not.toHaveBeenCalledWith(
      "p2:company:2",
      expect.anything(),
      expect.anything(),
    );
  });
  it("Alatar uses three ordinary-hit equivalents and stored RNG with a possible miss", () => {
    const s = setup("istari_alatar"),
      c = callbacks();
    s.rng = 1;
    resolveAbility(s, "p1", "field", "p2:company:0", c);
    expect(c.damage).toHaveBeenCalledWith("p2:company:0", 54, true);
    expect(s.rng).not.toBe(1);
    const miss = setup("istari_alatar"),
      missCallbacks = callbacks();
    miss.rng = 1600;
    resolveAbility(miss, "p1", "field", "p2:company:0", missCallbacks);
    expect(missCallbacks.damage).not.toHaveBeenCalled();
    expect(missCallbacks.event).toHaveBeenCalledWith(
      expect.stringContaining("misses"),
    );
  });
  it("physical Melkor damage cannot command or create a creature", () => {
    const s = setup("melkor_worldbreaker"),
      c = callbacks(),
      count = Object.keys(s.units).length;
    const target = s.units["remnant:0"];
    Object.assign(target, { x: 6, y: 4 });
    resolveAbility(s, "p1", "field", target.id, c);
    expect(c.damage).toHaveBeenCalledWith(target.id, 36, true);
    expect(target.owner).toBe("remnant");
    expect(Object.keys(s.units)).toHaveLength(count);
  });
  it("Vanyar acceleration cannot substitute equipment production for infantry training", () => {
    const s = setup("elf_vanyar"),
      f = s.facilities["p1:training"];
    s.players.p1.sources.push(
      ...factionProduction("elf_vanyar").equipment.access,
    );
    f.kind = "workshop";
    f.job = {
      id: "job:item",
      recipe: "equipment",
      remaining: 2,
      started: s.turn - 1,
      cost: stocks(0, 20, 10),
      supply: 0,
      great: 0,
      binding: 0,
    };
    expect(abilityAvailability(s, "p1", "support", f.id)).toMatch(
      /infantry training/i,
    );
  });
  it("roots slow instead of removing all movement and impose reapplication grace", () => {
    const s = setup("yavanna"),
      u = s.units["p2:company:0"];
    s.map.terrain[u.y * s.map.width + u.x] = "woodland";
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(
      u.effects.find((e) => e.kind === "move-limit")?.value,
    ).toBeGreaterThan(0);
    expect(u.effects.find((e) => e.kind === "disable-grace")?.until).toBe(
      s.revision + 5,
    );
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/grace/i);
  });
  it("Vanyar protects an owned infantry formation by 25 percent without healing or stacking", () => {
    const s = setup("elf_vanyar"),
      u = s.units["p1:company:0"];
    resolveAbility(s, "p1", "field", u.id, callbacks());
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(
      u.effects.filter((e) => e.kind === "formation-damage-reduction-percent"),
    ).toHaveLength(1);
    expect(
      u.effects.find((e) => e.kind === "formation-damage-reduction-percent"),
    ).toMatchObject({
      value: 25,
      until: s.revision + 1,
      source: `formation:p1:${u.x}:${u.y}`,
    });
    expect(abilityAvailability(s, "p1", "field", "p1:hero")).not.toBe("");
  });
  it("Finarfin suppresses one fear penalty temporarily and preserves its underlying source", () => {
    const s = setup("elf_finarfin"),
      u = s.units["p1:company:0"];
    u.effects.push({
      kind: "fear",
      value: 2,
      until: 20,
      source: "fear:source",
    });
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(u.effects.find((e) => e.kind === "fear")?.value).toBe(2);
    expect(u.effects.find((e) => e.kind === "fear-suppression")).toMatchObject({
      value: 1,
      until: s.revision + 2,
    });
  });
  it("Nienna removes exactly one current panic step rather than future fear or damage", () => {
    const s = setup("nienna"),
      u = s.units["p1:company:0"];
    u.hp -= 4;
    const hp = u.hp;
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/panic|fear/i);
    u.effects.push({
      kind: "fear",
      value: 2,
      until: 20,
      source: "fear:source",
    });
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(u.hp).toBe(hp);
    expect(u.effects.find((e) => e.kind === "fear")?.value).toBe(1);
    expect(u.effects).toHaveLength(1);
  });
  it("Sauron restores cohesion only to an ordinary owned company with a declared fallback", () => {
    const s = setup("sauron"),
      u = s.units["p1:company:0"];
    u.effects.push({
      kind: "cohesion-loss",
      value: 2,
      until: 20,
      source: "loss:1",
    });
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/fallback/i);
    u.effects.push({
      kind: "declared-fallback",
      value: 1,
      until: 20,
      source: "fallback:4:6",
    });
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(u.effects.find((e) => e.kind === "cohesion-loss")?.value).toBe(1);
    expect(
      u.effects.find((e) => e.kind === "fallback-authorized")?.source,
    ).toBe("fallback:4:6");
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(
      /active|stack/i,
    );
    const remnant = s.units["remnant:0"];
    Object.assign(remnant, { owner: "p1", active: true, x: 4, y: 5 });
    expect(abilityAvailability(s, "p1", "field", remnant.id)).not.toBe("");
  });
  it("Ember reduces at most two owned groups once each per encounter", () => {
    const s = setup("istari_ember");
    for (const id of ["p1:company:0", "p1:company:1", "p1:company:2"])
      s.units[id].effects.push({
        kind: "fear",
        value: 2,
        until: 20,
        source: "fear:test",
      });
    resolveAbility(s, "p1", "field", "p1:company:0", callbacks());
    expect(
      ["p1:company:0", "p1:company:1", "p1:company:2"].filter(
        (id) => s.units[id].effects.find((e) => e.kind === "fear")?.value === 1,
      ),
    ).toHaveLength(2);
    expect(abilityAvailability(s, "p1", "field", "p1:company:0")).toMatch(
      /once|already/i,
    );
  });
  it("Grove stabilization preserves injury and HP and requires an actual ordinary wound", () => {
    const s = setup("istari_grove"),
      u = s.units["p1:company:0"];
    u.hp -= 10;
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/wound/i);
    u.effects.push({
      kind: "deteriorating-wound",
      value: 1,
      until: 20,
      source: "injury:1",
    });
    const hp = u.hp;
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(u.hp).toBe(hp);
    expect(
      u.effects.find((e) => e.kind === "deteriorating-wound"),
    ).toBeTruthy();
    expect(u.effects.find((e) => e.kind === "stabilized-wound")?.source).toBe(
      "injury:1",
    );
  });
  it("Forge temporarily repairs one owned construct joint without health restoration", () => {
    const s = setup("istari_forge"),
      u = s.units["p1:company:0"];
    u.effects.push({
      kind: "movement-impairment",
      value: 1,
      until: 20,
      source: "joint:1",
    });
    u.hp -= 5;
    const hp = u.hp;
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(u.hp).toBe(hp);
    expect(
      u.effects.find((e) => e.kind === "movement-impairment"),
    ).toBeTruthy();
    expect(u.effects.find((e) => e.kind === "movement-repair")?.source).toBe(
      "joint:1",
    );
    u.kind = "company";
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/construct/i);
  });
  it("Troll breach empowers the next ordinary strike instead of delivering a free attack", () => {
    const s = setup("troll_hold"),
      c = callbacks(),
      f = s.facilities["p2:training"];
    Object.assign(f, { kind: "barricade", x: 5, y: 4 });
    resolveAbility(s, "p1", "field", f.id, c);
    expect(c.damage).not.toHaveBeenCalled();
    expect(
      s.units["p1:hero"].effects.find((e) => e.kind === "breach-bonus-percent"),
    ).toMatchObject({ value: 25, source: `breach:${f.id}` });
  });
  it("Nogrod requires owned engineers and an actual carried breach-tool set", () => {
    const s = setup("dwarf_nogrod"),
      u = s.units["p1:company:0"];
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/tool/i);
    s.items["item:tools"] = {
      id: "item:tools",
      name: factionProduction("dwarf_nogrod").equipment.name,
      owner: "p1",
      bearer: u.id,
      bonus: 3,
      durability: 100,
      maxDurability: 100,
      crafted: true,
      materials: ["metal"],
      x: u.x,
      y: u.y,
    };
    u.inventory.push("item:tools");
    resolveAbility(s, "p1", "field", u.id, callbacks());
    expect(
      u.effects.find((e) => e.kind === "breach-bonus-percent")?.value,
    ).toBe(25);
    expect(s.items["item:tools"]).toBeTruthy();
  });
  it.each(["elf_sindar", "hobbit_shire"])(
    "%s protection requires linked cover and changes targeting rather than incoming damage",
    (profile) => {
      const s = setup(profile),
        u = s.units["p1:company:0"];
      expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/cover/i);
      s.map.terrain[u.y * s.map.width + u.x] = "woodland";
      s.map.terrain[(u.y + 1) * s.map.width + u.x] = "woodland";
      resolveAbility(s, "p1", "field", u.id, callbacks());
      expect(
        u.effects.find((e) => e.kind === "ranged-accuracy-reduction-percent")
          ?.value,
      ).toBe(25);
      expect(u.effects.some((e) => e.kind.includes("damage-reduction"))).toBe(
        false,
      );
    },
  );
  it("Tilion intercepts only an actual prepared attack on a nearby ordinary ally", () => {
    const s = setup("tilion"),
      u = s.units["p2:company:0"],
      c = callbacks();
    expect(abilityAvailability(s, "p1", "field", u.id)).toMatch(/prepared/i);
    Object.assign(s.units["p1:company:0"],{x:5,y:4});
    declareTacticalOrder(s,"p2",{kind:"pursuit",unit:u.id,target:"p1:company:0"},()=>null);
    resolveAbility(s, "p1", "field", u.id, c);
    expect(c.damage).toHaveBeenCalledWith(u.id, 18, false);
    expect(Object.values(s.tacticalOrders).some(q=>q.unit===u.id)).toBe(false);
  });
  it("Belegost remains unavailable until typed protection kits and hazard selection exist", () => {
    const s = setup("dwarf_belegost");
    expect(abilityAvailability(s, "p1", "field", "p1:company:0")).toMatch(
      /unavailable/i,
    );
    expect(supportedAbilities.has("dwarf_belegost:field")).toBe(false);
  });
});

describe("Orc formation rally", () => {
  it("removes one active rout condition without healing, extra movement or deleting unrelated conditions", () => {
    const s = setup("orc_fortress_clan"),
      t = s.units["p1:company:0"];
    Object.assign(t, { x: 5, y: 4, hp: 7 });
    t.effects = [
      {
        kind: "rout",
        value: 1,
        until: s.revision + 2,
        source: "pressure:first",
      },
      {
        kind: "rout",
        value: 1,
        until: s.revision + 3,
        source: "pressure:second",
      },
      { kind: "fear", value: 2, until: s.revision + 2, source: "enemy" },
    ];
    expect(abilityAvailability(s, "p1", "field", t.id)).toBe("");
    resolveAbility(s, "p1", "field", t.id, callbacks());
    expect(t.effects.filter((e) => e.kind === "rout")).toHaveLength(1);
    expect(t.effects.find((e) => e.kind === "fear")?.value).toBe(2);
    expect({ x: t.x, y: t.y, hp: t.hp }).toEqual({ x: 5, y: 4, hp: 7 });
  });
  it("requires an actual active rout and own ordinary infantry", () => {
    const s = setup("orc_fortress_clan"),
      t = s.units["p1:company:0"];
    Object.assign(t, { x: 5, y: 4 });
    expect(abilityAvailability(s, "p1", "field", t.id)).toMatch(/rout/i);
    t.effects = [{ kind: "rout", value: 1, until: s.revision, source: "old" }];
    expect(abilityAvailability(s, "p1", "field", t.id)).toMatch(/rout/i);
    t.effects[0].until++;
    t.kind = "dragon";
    expect(abilityAvailability(s, "p1", "field", t.id)).toMatch(/infantry/i);
    t.kind = "company";
    t.owner = "p2";
    s.players.p1.relations.p2 = "alliance";
    s.players.p2.relations.p1 = "alliance";
    expect(abilityAvailability(s, "p1", "field", t.id)).toMatch(/owned/i);
  });
});

it("Este treats an adjacent allied living wound without healing or removing its impairment", async () => {
  const { activeEffects } = await import("../src/simulation/effects");
  const { afterOrdinaryDamage, attackPenalty, endEncounterConditions } =
    await import("../src/simulation/conditions");
  const s = setup("este"),
    t = s.units["p2:company:0"];
  Object.assign(t, { x: 5, y: 4, hp: 40, maxHp: 100 });
  s.players.p1.relations.p2 = "alliance";
  s.players.p2.relations.p1 = "alliance";
  afterOrdinaryDamage(s, t, 25);
  expect(abilityAvailability(s, "p1", "field", t.id)).toBe("");
  resolveAbility(s, "p1", "field", t.id, callbacks());
  expect(t.hp).toBe(40);
  expect(attackPenalty(s, t)).toBe(1);
  expect(activeEffects(s, t).some((e) => e.kind === "stabilized-wound")).toBe(
    true,
  );
  s.units["p1:hero"].x = 1;
  expect(activeEffects(s, t).some((e) => e.kind === "stabilized-wound")).toBe(
    false,
  );
  endEncounterConditions(s);
  expect(t.hp).toBe(39);
  expect(t.effects.some((e) => e.kind === "treatment-link")).toBe(false);
});
it("Este cannot treat constructs, missing wound records, distant patients or incapacitated healing", async () => {
  const { activeEffects } = await import("../src/simulation/effects");
  const { afterOrdinaryDamage } = await import("../src/simulation/conditions");
  const s = setup("este"),
    t = s.units["p1:company:0"];
  Object.assign(t, { x: 5, y: 4, hp: 40, maxHp: 100 });
  expect(abilityAvailability(s, "p1", "field", t.id)).toMatch(/wound/i);
  afterOrdinaryDamage(s, t, 25);
  t.kind = "construct";
  expect(abilityAvailability(s, "p1", "field", t.id)).toMatch(
    /living|construct/i,
  );
  t.kind = "company";
  resolveAbility(s, "p1", "field", t.id, callbacks());
  const h = s.units["p1:hero"];
  h.effects.push({
    kind: "stunned",
    value: 1,
    until: s.revision + 3,
    source: "enemy",
  });
  expect(activeEffects(s, t).some((e) => e.kind === "stabilized-wound")).toBe(
    false,
  );
  h.effects = [];
  afterOrdinaryDamage(s, h, 1);
  expect(t.effects.some((e) => e.kind === "stabilized-wound")).toBe(false);
});

it.each([
  ["spider_brood", "web"],
  ["namo", "threshold"],
  ["ent_grove", "roots"],
  ["elf_feanor", "flare"],
])(
  "%s creates an anchored bounded %s zone rather than attaching an effect to its target",
  (profile, kind) => {
    const s = setup(profile),
      t = s.units["p2:company:0"];
    s.zones = {};
    s.map.terrain[t.y * s.map.width + t.x] = "woodland";
    if (profile === "namo") {
      s.map.terrain[(t.y - 1) * s.map.width + t.x] = "cliff";
      s.map.terrain[(t.y + 1) * s.map.width + t.x] = "cliff";
    }
    const before = structuredClone(t);
    expect(abilityAvailability(s, "p1", "field", t.id)).toBe("");
    resolveAbility(s, "p1", "field", t.id, callbacks());
    const zone = Object.values(s.zones)[0];
    expect(zone.kind).toBe(kind);
    expect(zone.owner).toBe("p1");
    expect(t).toEqual(before);
    expect(zone.until).toBeGreaterThan(s.revision);
  },
);
it("Rooted Screen requires actual existing roots rather than creating vegetation", () => {
  const s = setup("ent_grove");
  expect(abilityAvailability(s, "p1", "field", "p2:company:0")).toMatch(
    /woodland|roots/i,
  );
});

it("warned terrain zone remains at its anchor after the originally selected company dies", () => {
  const s = setup("spider_brood");
  s.zones = {};
  const t = s.units["p2:company:0"];
  const anchor = { x: t.x, y: t.y };
  t.alive = false;
  t.hp = 0;
  t.x = 20;
  resolveAbility(s, "p1", "field", t.id, callbacks(), anchor);
  const z = Object.values(s.zones)[0];
  expect(z.x + z.dx / 2).toBe(anchor.x);
  expect(z.y + z.dy / 2).toBe(anchor.y);
});

it("Namo cannot declare an arbitrary open field a narrow threshold", () => {
  const s = setup("namo");
  expect(abilityAvailability(s, "p1", "field", "p2:company:0")).toMatch(
    /narrow threshold/i,
  );
});
it("Spider casting at its own position still creates a full six-metre approach", () => {
  const s = setup("spider_brood");
  resolveAbility(s, "p1", "field", "p1:hero", callbacks());
  const z = Object.values(s.zones)[0];
  expect(Math.hypot(z.dx, z.dy)).toBe(2);
});
it("a missing warned entity still allows anchored terrain resolution, while invalid range rejects before mutation", () => {
  const s = setup("spider_brood");
  delete s.units["p2:company:0"];
  resolveAbility(s, "p1", "field", "p2:company:0", callbacks(), { x: 6, y: 4 });
  expect(Object.keys(s.zones)).toHaveLength(1);
  const before = structuredClone(s);
  expect(() =>
    resolveAbility(s, "p1", "field", "p2:company:0", callbacks(), {
      x: 25,
      y: 25,
    }),
  ).toThrow(/range/i);
  expect(s).toEqual(before);
});
it("Este switches continuous treatment to one patient without curing the previous wound", () => {
  const s = setup("este"),
    a = s.units["p1:company:0"],
    b = s.units["p1:company:1"];
  for (const [i, u] of [a, b].entries()) {
    Object.assign(u, { x: i ? 4 : 5, y: i ? 5 : 4, hp: 20 });
    u.effects = [
      { kind: "wound", value: 1, until: 1000000, source: `injury:${u.id}` },
    ];
  }
  resolveAbility(s, "p1", "field", a.id, callbacks());
  resolveAbility(s, "p1", "field", b.id, callbacks());
  expect(a.effects.map((e) => e.kind)).toEqual(["wound"]);
  expect(a.hp).toBe(20);
  expect(b.effects.some((e) => e.kind === "stabilized-wound")).toBe(true);
});
it("Alatar flare penalty modifies one stored RNG hit roll for either caster ownership", () => {
  for (const owner of ["p1", "p2"]) {
    const s = setup("istari_alatar"),
      c = callbacks();
    s.rng = 1000;
    s.zones = {
      flare: {
        id: "flare",
        owner,
        kind: "flare",
        x: 4,
        y: 4,
        dx: 1,
        dy: 0,
        radius: 3,
        until: s.revision + 2,
        triggered: false,
      },
    };
    // seed1000 produces approximately0.6236, below.6375; choose seed1200 ->.7011.
    s.rng = 1200;
    const expected = (Math.imul(1664525, s.rng) + 1013904223) >>> 0;
    expect(expected / 4294967296).toBeGreaterThan(0.85 * 0.75);
    expect(expected / 4294967296).toBeLessThan(0.85);
    resolveAbility(s, "p1", "field", "p2:company:0", c);
    expect(c.damage).not.toHaveBeenCalled();
    expect(s.rng).toBe(expected);
  }
});
it.each([
  ["varda", "light", 3],
  ["vana", "bloomscreen", 3],
  ["arien", "clear-air", 2],
])("%s creates its actual visibility zone (%s)", (profile, kind, duration) => {
  const s = setup(String(profile)),
    t = s.units["p2:company:0"];
  s.map.terrain[t.y * s.map.width + t.x] = "woodland";
  if (profile === "arien")
    s.zones.smoke = {
      id: "smoke",
      owner: "p2",
      kind: "smoke",
      x: t.x,
      y: t.y,
      dx: 0,
      dy: 0,
      radius: 1,
      until: s.revision + 3,
      triggered: false,
    };
  expect(abilityAvailability(s, "p1", "field", t.id)).toBe("");
  resolveAbility(s, "p1", "field", t.id, callbacks());
  const z = Object.values(s.zones).find((z) => z.kind === kind)!;
  expect(z.until).toBe(s.revision + Number(duration));
  expect(z.radius).toBe(1);
});
it("Vana requires actual shrubs and Arien requires actual ordinary smoke or mist", () => {
  const s = setup("vana");
  expect(abilityAvailability(s, "p1", "field", "p2:company:0")).toMatch(
    /vegetation|woodland/i,
  );
  const a = setup("arien");
  expect(abilityAvailability(a, "p1", "field", "p2:company:0")).toMatch(
    /smoke|mist/i,
  );
});
