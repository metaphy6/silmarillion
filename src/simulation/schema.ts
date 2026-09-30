import {validateTools} from './tool-services';
import {validateMounts} from './remounts';
import {validateWatches} from './watch-posts';
import {validateNightWork} from './night-work';
import {validateNightPatrols} from './night-patrol';
import {validateRelayMessages} from './relay-messages';
import {validateFormations} from "./formation-orders";
import {validateCivilianState} from "./civilians";
import {validateShoreState} from "./shore-powers";
import {validateHabitat} from "./habitat-works";
import {validateEquipmentServices} from "./equipment-service";
import {validateScouting} from "./scouting";
import {validateHunting} from "./hunting";
import {validateFieldworkState} from "./fieldworks";
import { validateChargeState } from "./charges";
import { validateLogisticsState } from "./logistics-support";
import { validatePatrolState } from "./patrols";
import { validateInfrastructureState } from "./infrastructure-work";
import { validateWorksiteSupport } from "./worksite-support";
import { validateTacticalOrders } from "./tactical-orders";
import { validateNavalEffects } from "./naval-powers";
import { validateCrop } from "./crops";
import { recoveryInvariant } from "./recovery";
import { validateIntelligenceState } from "./intelligence";
import { validateConvoyState } from "./transport";
import { repairInvariant } from "./repair";
import { restInvariant } from "./fatigue";
import { validateCrossingState } from "./crossings";
import { validateMovementPlanState } from "./movement-plans";
import { validateVesselState } from "./naval";
import { z } from "zod";
import type { Order, Match } from "./types";
import { VERSION } from "./types";
import { profiles, recipe, buildings } from "../content/catalog";
const id = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9:_-]+$/);
const n = z.number().int().min(0).max(1000000);
const point = {
  x: z.number().int().min(0).max(127),
  y: z.number().int().min(0).max(127),
};
const unit = { unit: id };
const stock = z.object({ P: n, M: n, K: n, E: n }).strict();
const observationFact = z
  .object({
    ...point,
    eventKey: id,
    turn: n.min(1),
    revision: n,
    kind: z.literal("attack"),
    certainty: z.enum(["observed", "silhouette"]),
    source: id,
  })
  .strict();
const chargeMembers=z.array(z.object({unit:id,route:z.array(z.object(point).strict()).min(2).max(128)}).strict()).min(1).max(2);
const chargeMode=z.enum(["hunter-interception","relief-charge","split-pursuit"]);
const huntRoute=z.array(z.object(point).strict()).min(2).max(128);
const huntingBase={id,owner:id,unit:id,turn:n,revision:n,origin:z.object(point).strict(),route:huntRoute};
const formationMembers=z.array(z.object({unit:id,route:huntRoute}).strict()).min(2).max(3);
const formationBase={id,owner:id,hero:id,origin:z.object(point).strict(),turn:n,revision:n,until:n,communicationsCut:z.boolean(),members:formationMembers};
const action = z.discriminatedUnion("kind", [
 z.discriminatedUnion('mode',[
 z.object({kind:z.literal('tool-service'),mode:z.literal('make'),facility:id,function:z.enum(['breach','repair'])}).strict(),
 z.object({kind:z.literal('tool-service'),mode:z.literal('refit'),facility:id,item:id,function:z.enum(['breach','repair'])}).strict(),
 z.object({kind:z.literal('tool-service'),mode:z.literal('repair'),unit:id,tool:id,target:id}).strict()]),
 z.discriminatedUnion('mode',[
 z.object({kind:z.literal('mounts'),mode:z.literal('breed'),facility:id}).strict(),
 z.object({kind:z.literal('mounts'),mode:z.literal('recover'),lot:id}).strict(),
 z.object({kind:z.literal('mounts'),mode:z.literal('exchange'),rider:id,lot:id,crew:id,route:huntRoute.max(32)}).strict()]),
 z.discriminatedUnion('mode',[
 z.object({kind:z.literal('watch-gear'),mode:z.literal('make'),facility:id}).strict(),
 z.object({kind:z.literal('watch-gear'),mode:z.literal('relocate'),facility:id,worker:id,route:huntRoute.max(7)}).strict()]),
 z.discriminatedUnion('mode',[
 z.object({kind:z.literal('night'),mode:z.literal('assign-shift'),job:id}).strict(),
 z.object({kind:z.literal('night'),mode:z.literal('light-shift'),shift:id,method:z.enum(['lamps','dawn']),mirror:id.optional()}).strict(),
 z.object({kind:z.literal('night'),mode:z.literal('dawn-watch'),post:id,approach:huntRoute.max(4)}).strict(),
 z.object({kind:z.literal('night'),mode:z.literal('train-scout'),unit:id}).strict(),
 z.object({kind:z.literal('night'),mode:z.literal('patrol'),unit:id,route:huntRoute,method:z.enum(['ordinary','moon']),companion:id.optional()}).strict(),
 z.object({kind:z.literal('night'),mode:z.literal('message'),report:id,courier:id,origin:id,primary:id,destination:id,route:huntRoute}).strict(),
 z.object({kind:z.literal('night'),mode:z.literal('second-signal'),message:id,route:huntRoute}).strict()
 ]),
 z.discriminatedUnion("mode",[z.object({kind:z.literal("formation-power"),mode:z.literal("rendezvous"),movement:z.enum(["advance","retreat"]),members:formationMembers}).strict(),z.object({kind:z.literal("formation-power"),mode:z.literal("rotation"),members:formationMembers}).strict(),z.object({kind:z.literal("formation-power"),mode:z.literal("muster"),relay:id,objective:id,members:formationMembers,commission:z.object({unit:id,route:huntRoute}).strict().optional()}).strict()]),
 z.object({kind:z.literal("post-garrison"),unit:id,post:id,survey:id}).strict(),z.object({kind:z.literal("release-post"),unit:id}).strict(),
 z.discriminatedUnion("mode",[
 z.object({kind:z.literal("civilian"),mode:z.literal("deposit"),household:id,amount:n.min(1),unit:id}).strict(),
 z.object({kind:z.literal("civilian"),mode:z.literal("withdraw"),household:id,amount:n.min(1),unit:id}).strict(),
 z.object({kind:z.literal("civilian"),mode:z.literal("consent"),guest:id,refuge:id}).strict(),
 z.object({kind:z.literal("civilian"),mode:z.literal("people"),household:id,carrier:id,destination:id,route:huntRoute,method:z.enum(["ordinary","nessa"])}).strict(),
 z.object({kind:z.literal("civilian"),mode:z.literal("stores"),household:id,carrier:id,destination:id,route:huntRoute,amount:n.min(1).max(20),method:z.enum(["ordinary","hobbit"])}).strict(),
 z.object({kind:z.literal("civilian"),mode:z.literal("recover"),job:id,carrier:id,route:huntRoute}).strict()
 ]),
 z.discriminatedUnion("mode",[z.object({kind:z.literal("habitat-power"),mode:z.literal("living-buttress"),vegetation:id,facility:id}).strict(),z.object({kind:z.literal("habitat-power"),mode:z.literal("shoulder-burden"),job:id}).strict(),z.object({kind:z.literal("habitat-power"),mode:z.literal("old-trail"),trail:id,worker:id}).strict()]),
 z.object({kind:z.literal("assign-lifter"),job:id,unit:id}).strict(),z.object({kind:z.literal("block-trail"),trail:id,unit:id}).strict(),
 z.discriminatedUnion("mode",[z.object({kind:z.literal("scout-power"),mode:z.literal("borrowed-shadow"),point:z.object(point).strict()}).strict(),z.object({kind:z.literal("scout-power"),mode:z.literal("witness-flare"),target:id}).strict()]),
 z.discriminatedUnion("mode",[z.object({kind:z.literal("hunting"),mode:z.literal("hunt"),unit:id,prey:id,amount:n.min(1).max(2),route:huntRoute.min(1)}).strict(),z.object({kind:z.literal("hunting"),mode:z.literal("survey"),unit:id,route:huntRoute}).strict()]),
 z.object({kind:z.literal("examine-contact"),unit:id,point:z.object(point).strict()}).strict(),
 z.object({kind:z.literal("fieldwork"),worker:id,facility:id,form:z.enum(["cover","barricade","gate","siege-brace"]),material:z.enum(["timber","stone","metal"]),...point}).strict(),
 z.object({kind:z.literal("load-repair-kit"),unit:id,facility:id,material:z.enum(["timber","stone","metal"])}).strict(),
 z.object({kind:z.literal("brace-breach"),unit:id,target:id}).strict(),z.object({kind:z.literal("read-fault"),target:id}).strict(),
 z.object({kind:z.literal("charge-power"),mode:chargeMode,target:id,members:chargeMembers}).strict(),
  z.discriminatedUnion("mode", [
    z
      .object({
        kind: z.literal("logistics"),
        mode: z.literal("lift"),
        unit: id,
        to: z.object(point).strict(),
      })
      .strict(),
    z
      .object({
        kind: z.literal("logistics"),
        mode: z.literal("redistribute"),
        method: z.enum(["ordinary", "power"]),
        harbor: id,
        loads: z
          .array(
            z
              .object({ ship: id, cargo: stock, passenger: id.nullable() })
              .strict(),
          )
          .min(2)
          .max(3),
      })
      .strict(),
  ]),
  z.object({ kind: z.literal("inspect-trace"), ...point }).strict(),
  z.object({ kind: z.literal("prepare-starwatch"), survey: id }).strict(),
  z
    .object({
      kind: z.literal("infrastructure-work"),
      site: id,
      worker: id,
      facility: id,
    })
    .strict(),
  z.object({ kind: z.literal("infrastructure-power"), job: id }).strict(),
  z
    .object({
      kind: z.literal("care"),
      unit: id,
      facility: id.optional(),
      method: z.enum(["ordinary", "este"]).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("care-power"),
      mode: z.enum(["finarfin", "grove"]),
      facility: id,
      units: z.array(id).min(1).max(2),
    })
    .strict(),
  z.object({ kind: z.literal("cancel-care"), unit: id }).strict(),
  z
    .object({
      kind: z.literal("worksite-support"),
      site: id,
      refuge: id,
      route: z.array(z.object(point).strict()).min(2).max(9),
    })
    .strict(),
  z.object({ kind: z.literal("evacuate-worksite"), id }).strict(),
  z
    .object({ kind: z.literal("plant-crop"), plot: id, irrigation: id })
    .strict(),
  z.object({ kind: z.literal("advance-crop"), crop: id }).strict(),
  z
    .object({
      kind: z.literal("declare-tactical"),
      order: z.discriminatedUnion("kind", [
        z
          .object({
            kind: z.literal("fallback"),
            unit: id,
            route: z.array(z.object(point).strict()).min(2).max(128),
          })
          .strict(),
        z.object({ kind: z.literal("pursuit"), unit: id, target: id }).strict(),
        z.object({kind:z.literal("ranged-attack"),unit:id,target:id}).strict(),
      ]),
    })
    .strict(),
  z.discriminatedUnion("mode", [
    z
      .object({
        kind: z.literal("tactical-power"),
        mode: z.literal("signal-flash"),
        unit: id,
        route: z.array(z.object(point).strict()).min(2).max(128),
      })
      .strict(),
    z
      .object({
        kind: z.literal("tactical-power"),
        mode: z.literal("shielded-withdrawal"),
        unit: id,
      })
      .strict(),
    z
      .object({
        kind: z.literal("tactical-power"),
        mode: z.literal("grapple"),
        target: id,
      })
      .strict(),
    z
      .object({
        kind: z.literal("tactical-power"),
        mode: z.literal("drowsing-veil"),
        target: id,
      })
      .strict(),
  ]),
  z.object({kind:z.literal("surge-passage"),unit:id,tile:z.object(point).strict()}).strict(),
  z.object({kind:z.literal("coastal-landing"),ship:id,unit:id,tile:z.object(point).strict()}).strict(),
  z.object({kind:z.literal("current-crossing"),convoy:id,tiles:z.array(z.object(point).strict()).min(3).max(6)}).strict(),
  z.object({kind:z.literal("make-protection-kit"),unit:id,facility:id,hazard:z.enum(["arrows","impact"])}).strict(),
  z.object({kind:z.literal("fit-guard"),unit:id,hazard:z.enum(["arrows","impact"])}).strict(),
  z.object({kind:z.literal("temper-armor"),unit:id,facility:id,hazard:z.enum(["arrows","impact"])}).strict(),
  z.object({ kind: z.literal("cancel-tactical"), unit: id }).strict(),
  z
    .object({ kind: z.literal("tactical-alarm"), unit: id, target: id })
    .strict(),
  z
    .object({
      kind: z.literal("naval-power"),
      power: z.enum(["field", "support"]),
      ship: id.optional(),
      x: point.x.optional(),
      y: point.y.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("intelligence-power"),
      mode: z.enum(["quiet-exchange", "beacon-concord"]),
      stations: z.array(id).min(2).max(3),
      report: id.optional(),
      carrier: id.optional(),
    })
    .strict(),
  ...(["load-cargo", "unload-cargo"] as const).map((kind) =>
    z.object({ kind: z.literal(kind), ship: id, cargo: stock }).strict(),
  ),
  ...(["embark", "rescue-passenger", "attack-ship"] as const).map((kind) =>
    z.object({ kind: z.literal(kind), ship: id, ...unit }).strict(),
  ),
  z
    .object({
      kind: z.literal("disembark"),
      ship: id,
      ...unit,
      landing: z.object(point).strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("sail"),
      ship: id,
      route: z.array(z.object(point).strict()).min(2).max(256),
    })
    .strict(),
  z.object({ kind: z.literal("repair-ship"), ship: id }).strict(),
  z
    .object({ kind: z.literal("crossing"), from: id, to: id, crew: id })
    .strict(),
  z
    .object({ kind: z.literal("break-crossing"), ...unit, crossing: id })
    .strict(),
  z
    .object({
      kind: z.literal("movement-power"),
      members: z
        .array(z.object({ unit: id, to: z.object(point).strict() }).strict())
        .min(1)
        .max(3),
    })
    .strict(),
  z.object({ kind: z.literal("rest"), ...unit, facility: id }).strict(),
  z
    .object({
      kind: z.literal("eyrie-relay"),
      origin: id,
      destination: id,
      cargo: stock,
    })
    .strict(),
  z
    .object({
      kind: z.literal("prepare-supply"),
      convoy: id,
      route: z.array(z.object(point).strict()).min(2).max(256),
    })
    .strict(),
  z
    .object({ kind: z.literal("recover-cargo"), convoy: id, carrier: id })
    .strict(),
  z
    .object({
      kind: z.literal("reroute-convoy"),
      convoy: id,
      destination: id,
      method: z.enum(["ordinary", "power"]),
      relay: id.optional(),
    })
    .strict(),
  z.object({ kind: z.literal("clear-zone"), ...unit, zone: id }).strict(),
  z
    .object({
      kind: z.literal("convoy"),
      carrier: id,
      origin: id,
      destination: id,
      cargo: stock,
    })
    .strict(),
  z.object({ kind: z.literal("produce"), facility: id, recipe: id }).strict(),
  z.object({ kind: z.literal("cancel"), facility: id }).strict(),
  z
    .object({
      kind: z.literal("repair"),
      facility: id,
      target: id,
      method: z.enum(["ordinary", "power"]),
    })
    .strict(),
  z.object({ kind: z.literal("build"), building: id, ...point }).strict(),
  z.object({ kind: z.literal("move"), ...unit, ...point }).strict(),
  ...(["attack", "capture", "rescue"] as const).map((kind) =>
    z.object({ kind: z.literal(kind), ...unit, target: id }).strict(),
  ),
  ...(["recover", "exchange", "surrender", "ready"] as const).map((kind) =>
    z.object({ kind: z.literal(kind) }).strict(),
  ),
  z.object({ kind: z.literal("call"), ...unit }).strict(),
  z
    .object({
      kind: z.literal("cast"),
      power: z.enum(["field", "support"]),
      target: id,
      x: point.x.optional(),
      y: point.y.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("diplomacy"),
      target: id,
      relation: z.enum(["peace", "alliance", "war"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("trade"),
      target: id,
      resource: z.enum(["P", "M", "K", "E"]),
      amount: n.min(1),
    })
    .strict(),
  z.object({ kind: z.literal("equip"), ...unit, item: id }).strict(),
  z.object({ kind: z.literal("annex"), ...unit, facility: id }).strict(),
  z
    .object({
      kind: z.literal("perk"),
      branch: z.enum(["craft", "guard", "path"]),
    })
    .strict(),
  z.object({ kind: z.literal("land"), ...unit }).strict(),
]);
export const orderSchema = z
  .object({ id, seat: id, seq: n.min(1), turn: n.min(1), revision: n, action })
  .strict();
export function parseOrder(value: unknown): Order {
  return orderSchema.parse(value);
}
const effect = z.object({ kind: id, value: n, until: n, source: id }).strict();
const hero = z
  .object({
    id,
    status: z.enum(["uncreated", "pending", "living", "captive", "dead"]),
    level: n.min(1),
    xp: n,
    perks: z.array(z.string().max(80)).max(3),
    readiness: n.max(12),
    equipment: z.array(id).max(100),
    captor: id.optional(),
  })
  .strict();
const player = z
  .object({
    seat: id,
    profile: z.string().refine((v) => profiles.some((p) => p.id === v)),
    stock,
    component: n,
    hero,
    operations: n.max(3),
    commitment: n.max(1),
    ready: z.boolean(),
    ai: z.boolean(),
    encounter: z.boolean(),
    tacticalUsed: z.boolean(),
    eliminated: z.boolean(),
    streak: n,
    research: z
      .array(id)
      .max(100)
      .refine((v) => new Set(v).size === v.length, "Duplicate research"),
    sources: z.array(z.string().max(80)).max(100),
    relations: z.record(id, z.enum(["peace", "alliance", "war"])),
    memory: z.array(z.string().max(500)).max(100),
  })
  .strict();
const unitSchema = z
  .object({
    id,
    owner: id,
    name: z.string().max(200),
    kind: z.enum([
      "company",
      "hero",
      "worker",
      "drake",
      "dragon",
      "winged-dragon",
      "balrog",
      "construct",
      "beast",
    ]),
    ...point,
    hp: n,
    maxHp: n.min(1),
    attack: n,
    armor: n,
    move: n,
    supply: n,
    great: n,
    binding: n,
    upkeep: stock,
    flying: z.boolean(),
    landed: z.boolean(),
    engineer:z.enum(["trained","nogrod"]).optional(),
    loadClass: z.enum(["light", "standard", "large"]),
    active: z.boolean(),
    alive: z.boolean(),
    supplied: z.boolean(),
    effects: z.array(effect).max(100),
    inventory: z.array(id).max(100),
  })
  .strict();
const job = z
  .object({
    id,
    recipe: id,
    remaining: n.min(1),
    started: n,
    cost: stock,
    supply: n,
    great: n,
    binding: n,
    crew: id.optional(),
  })
  .strict();
const facility = z
  .object({
    id,
    owner: id,
    name: z.string().max(200),
    kind: id,
    tier: n,
    hp: n,
    maxHp: n.min(1),
    workers: n,
    ...point,
    job: job.optional(),
    rest: z
      .object({
        id,
        unit: id,
        started: n.min(1),
        remaining: z.literal(1),
        cost: stock,
      })
      .strict()
      .optional(),
    repair: z
      .object({
        id,
        target: id,
        kind: z.enum(["item", "structure", "construct"]),
        remaining: n.min(1).max(2),
        started: n.min(1),
        cost: stock,
        amount: n.min(1),
        method: z.enum(["ordinary", "power"]),
        accelerated: z.boolean(),
      })
      .strict()
      .optional(),
  })
  .strict();
const receipt = z
  .object({
    id,
    seq: n,
    turn: n,
    accepted: z.boolean(),
    reason: z.string().max(500),
    fingerprint: z.string().max(8192),
  })
  .strict();
export const matchSchema = z
  .object({
    version: z.literal(VERSION),
    id,
    scenario: z.literal("Cross-era sandbox"),
    revision: n,
    turn: n.min(1),
    combatPhase: n.max(12),
    rng: n.max(4294967295).or(z.number().int().min(0).max(4294967295)),
    phase: z.enum(["planning", "finished"]),
    players: z.record(id, player),
    units: z.record(id, unitSchema),
    facilities: z.record(id, facility),
    items: z.record(
      id,
      z
        .object({
          id,
          name: z.string().max(200),
          owner: id.nullable(),
          bearer: id.nullable(),
          bonus: n,
          attackBonus: n.optional(),
          durability: n,
          maxDurability: n.min(1),
          crafted: z.boolean(),
          materials: z.array(id).min(1).max(8),
          ...point,
        })
        .strict(),
    ),
    sites: z
      .array(
        z
          .object({
            id,
            name: z.string().max(200),
            owner: id.nullable(),
            ...point,
          })
          .strict(),
      )
      .length(3),
    map: z
      .object({
        width: n.min(24).max(128),
        height: n.min(24).max(128),
        terrain: z
          .array(z.enum(["meadow", "woodland", "water", "stone", "cliff"]))
          .max(16384),
      })
      .strict(),
    orders: z.array(orderSchema).max(1000),
    receipts: z.record(id, z.array(receipt).max(100000)),
    nextSeq: z.record(id, n),
    events: z
      .array(
        z
          .object({
            id: n,
            turn: n,
            text: z.string().max(1000),
            audience: z.union([z.literal("public"), z.array(id).max(4)]),
            motion:z.object({unit:id,route:z.array(z.object(point).strict()).min(2).max(256)}).strict().optional(),
          })
          .strict(),
      )
      .max(400),
    nextId: n,
    winner: id.nullable(),
    seaHazards: z.record(
      z.string().regex(/^\d{1,3},\d{1,3}$/),
      z
        .object({
          wave: z.union([
            z.literal(0),
            z.literal(1),
            z.literal(2),
            z.literal(3),
          ]),
          fog: z.boolean(),
          handling: n.max(3),
        })
        .strict(),
    ),
    vessels: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          name: z.string().max(200),
          ...point,
          hp: n.max(80),
          maxHp: z.literal(80),
          move: z.literal(3),
          crew: id,
          crewRescued: z.boolean().optional(),
          passenger: id.nullable(),
          aboardHero: id.nullable(),
          cargo: stock,
          phase: z.enum(["idle", "loading", "sailing", "unloading", "wreck"]),
          route: z.array(z.object(point).strict()).min(1).max(256),
          index: n,
          lastProgress: n,
          handlingRemaining: n.max(4),
          fogSpent: z.boolean(),
          handling: z
            .object({
              kind: z.enum(["load", "unload", "embark", "disembark", "rescue"]),
              unit: id.optional(),
              cargo: stock.optional(),
              landing: z.object(point).strict().optional(),
            })
            .strict()
            .optional(),
          repair: z
            .object({
              remaining: n.min(1).max(2),
              started: n.min(1),
              accelerated: z.boolean(),
              cost: stock,
            })
            .strict()
            .optional(),
        })
        .strict(),
    ),
    crossings: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          kind: z.enum(["causeway", "silk"]),
          from: id,
          to: id,
          crew: id,
          tiles: z.array(z.object(point).strict()).min(3).max(6),
          hp: n.max(60),
          maxHp: z.literal(60),
          phase: z.enum(["building", "ready", "destroyed"]),
          started: n.min(1),
          lastProgress: n,
        })
        .strict(),
    ),
    tacticalSignals: z
      .array(
        z
          .object({
            id,
            kind: z.enum(["grapple", "drowsing"]),
            target: id,
            phase: z.enum(["warning", "holding", "active"]),
            origin: z.object(point).strict(),
            until: n,
          })
          .strict(),
      )
      .max(128)
      .optional(),
    formationOrders:z.record(id,z.discriminatedUnion("mode",[z.object({...formationBase,mode:z.literal("rendezvous"),movement:z.enum(["advance","retreat"])}).strict(),z.object({...formationBase,mode:z.literal("rotation")}).strict(),z.object({...formationBase,mode:z.literal("muster"),relay:id,objective:id,commission:z.object({unit:id,route:huntRoute}).strict().optional()}).strict()])),
    garrisonPosts:z.record(id,z.object({unit:id,owner:id,post:id,survey:id}).strict()),
    garrisonReports:z.record(id,z.object({id,owner:id,point:z.object(point).strict(),turn:n,revision:n,uncertainty:z.string().max(300)}).strict()),
    vegetation:z.record(id,z.object({id,...point,mature:z.boolean(),altered:z.boolean()}).strict()),
    livingBarriers:z.record(id,z.object({id,owner:id,vegetation:id,facility:id,expires:n}).strict()),
    oldTrails:z.record(id,z.object({id,tiles:z.array(z.object(point).strict()).min(2).max(128),blocked:z.boolean(),waystation:id}).strict()),
    heroTrailSurveys:z.record(id,z.object({id,owner:id,hero:id,trail:id,turn:n}).strict()),
    trailProjects:z.record(id,z.object({id,owner:id,hero:id,worker:id,trail:id,started:n,lastProgress:n}).strict()),
    scoutShadows:z.record(id,z.object({id,owner:id,...point,createdRevision:n,until:n}).strict()),
    witnessedAttacks:z.record(id,z.object({id,owner:id,attacker:id,...point,turn:n,revision:n}).strict()),
    witnessFlares:z.record(id,z.object({id,owner:id,point:z.object(point).strict(),turn:n,revision:n,until:n}).strict()),
    preySites:z.record(id,z.object({id,...point,habitat:z.enum(["woodland","meadow"]),initial:n,remaining:n,harvested:n,yieldP:n}).strict()),
    huntingJobs:z.record(id,z.discriminatedUnion("mode",[z.object({...huntingBase,route:huntRoute.min(1),mode:z.literal("hunt"),prey:id,amount:n.min(1).max(2)}).strict(),z.object({...huntingBase,mode:z.literal("survey")}).strict()])),
    huntingReports:z.record(id,z.object({id,owner:id,turn:n,revision:n,route:huntRoute,prey:z.array(z.object({site:id,...point,remaining:n}).strict()).max(64),danger:z.array(z.object(point).strict()).max(10000),uncertainty:z.string().max(300)}).strict()),
    charges:z.record(id,z.object({id,owner:id,hero:id,mode:chargeMode,target:id,members:chargeMembers,origin:z.object(point).strict(),targetOrigin:z.object(point).strict(),createdTurn:n,createdRevision:n,until:n}).strict()),
    attackPreparations:z.array(z.object({unit:id,target:id,kind:z.enum(["pursuit","ranged-attack"]),until:n}).strict()).max(10000).optional(),
    observedAttackers:z.array(id).max(10000).optional(),
    chargeWarnings:z.array(z.object({id,target:id,origin:z.object(point).strict(),until:n}).strict()).max(10000).optional(),
    tacticalOrders: z.record(
      id,
      z.discriminatedUnion("kind", [
        z
          .object({
            id,
            owner: id,
            unit: id,
            createdTurn: n,
            createdRevision: n,
            until: n,
            kind: z.literal("fallback"),
            route: z.array(z.object(point).strict()).min(2).max(128),
            shielded: z.boolean(),
          })
          .strict(),
        z
          .object({
            id,
            owner: id,
            unit: id,
            createdTurn: n,
            createdRevision: n,
            until: n,
            kind: z.enum(["pursuit","ranged-attack"]),
            target: id,
            origin: z.object(point).strict(),
          })
          .strict(),
        z
          .object({
            id,
            owner: id,
            unit: id,
            createdTurn: n,
            createdRevision: n,
            until: n,
            kind: z.literal("grapple"),
            target: id,
            origin: z.object(point).strict(),
            targetOrigin: z.object(point).strict(),
            phase: z.enum(["warning", "holding"]),
          })
          .strict(),
        z
          .object({
            id,
            owner: id,
            unit: id,
            createdTurn: n,
            createdRevision: n,
            until: n,
            kind: z.literal("drowsing"),
            target: id,
            origin: z.object(point).strict(),
            targetOrigin: z.object(point).strict(),
            phase: z.enum(["warning", "active"]),
          })
          .strict(),
      ]),
    ),
    infrastructureSites: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          kind: z.enum(["shaft", "haulway", "channel", "wreck"]),
          ...point,
          blocked: z.boolean(),
          originalCapacity: n.min(1).max(20),
          material: z.enum(["stone", "timber", "silt", "debris"]),
          yield: stock,
          claimedBy: id.optional(),
          consumed: z.boolean(),
        })
        .strict(),
    ),
    infrastructureWork: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          site: id,
          worker: id,
          facility: id,
          kind: z.enum(["clear", "salvage"]),
          remaining: n.max(2),
          started: n.min(1),
          lastProgress: n,
          cost: stock,
          boost: z
            .object({ turn: n.min(1), mode: z.enum(["finish", "advance"]) })
            .strict()
            .optional(),
          accelerated: z.boolean(),
          phase: z.enum(["work", "haul", "lost"]),
          route: z.array(z.object(point).strict()).min(1).max(16384),
          index: n,
          cargo: stock,
        })
        .strict(),
    ),
    nightRegions:z.record(id,z.object({id,owner:id,...point,radius:z.literal(6),period:z.enum(['night','dawn','day'])}).strict()),
    darkShifts:z.record(id,z.object({id,owner:id,job:id,site:id,week:n,light:z.enum(['dark','lamps','dawn']),mirror:id.optional(),worked:z.boolean()}).strict()),
    dawnWatches:z.record(id,z.object({id,owner:id,post:id,approach:huntRoute.max(4),week:n}).strict()),
    dawnReports:z.record(id,z.object({id,owner:id,post:id,...point,turn:n,revision:n,direction:z.enum(['north','south','east','west'])}).strict()),
    scoutCredentials:z.record(id,z.object({unit:id,owner:id,started:n,ready:z.boolean()}).strict()),
    nightPatrols:z.record(id,z.object({id,owner:id,unit:id,companion:id.optional(),method:z.enum(['ordinary','moon']),route:huntRoute,started:n,createdRevision:n,lastRevision:z.number().int().min(-1).max(1000000),delay:n.max(1),phase:z.enum(['waiting','observing','interrupted']),observations:z.array(z.object({...point,direction:z.enum(['north','south','east','west']),turn:n,revision:n}).strict()).max(64)}).strict()),
    nightReports:z.record(id,z.object({id,owner:id,patrol:id,createdTurn:n,createdRevision:n,verified:z.literal(true),observations:z.array(z.object({...point,direction:z.enum(['north','south','east','west']),turn:n,revision:n}).strict()).max(64)}).strict()),
    personalNightSurveys:z.record(id,z.object({id,owner:id,hero:id,route:huntRoute,turn:n}).strict()),nightBearingUses:z.record(id,n),
    relayMessages:z.record(id,z.object({id,owner:id,report:id,courier:id,origin:id,primary:id,destination:id,route:huntRoute,index:n,...point,started:n,lastProgress:z.number().int().min(-1).max(1000000),phase:z.enum(['travel','delivered','lost']),provenance:z.array(z.object({station:id,turn:n,revision:n}).strict()).max(128)}).strict()),
    secondSignals:z.record(id,z.object({id,owner:id,message:id,route:huntRoute,turn:n,used:z.boolean()}).strict()),
    relayDeliveries:z.record(id,z.object({id,owner:id,message:id,report:id,destination:id,turn:n,revision:n,reportTurn:n,reportRevision:n,provenance:z.array(z.object({station:id,turn:n,revision:n}).strict()).max(128)}).strict()),
    witnessChainUses:z.record(id,z.object({turn:n,message:id}).strict()),
    households:z.record(id,z.object({id,owner:id,home:id,population:n.max(12),provisions:n,willing:z.boolean(),...point}).strict()),
    civilianConsents:z.record(id,z.object({id,owner:id,guest:id,refuge:id,turn:n}).strict()),
    civilianJobs:z.record(id,z.object({id,owner:id,mode:z.enum(["people","stores"]),household:id,carrier:id,destination:id,route:huntRoute,index:n,population:n.max(12),provisions:n.max(20),phase:z.enum(["travel","arrived","lost"]),started:n,lastProgress:z.number().int().min(-1).max(1000000),...point}).strict()),
    logisticsJobs: z.record(
      id,
      z.discriminatedUnion("kind", [
        z
          .object({
            id,
            owner: id,
            kind: z.literal("ship-transfer"),
            harbor: id,
            loads: z
              .array(
                z
                  .object({ ship: id, cargo: stock, passenger: id.nullable() })
                  .strict(),
              )
              .min(2)
              .max(3),
            before: z
              .array(
                z
                  .object({ ship: id, cargo: stock, passenger: id.nullable() })
                  .strict(),
              )
              .min(2)
              .max(3),
            remaining: n.min(1).max(2),
            createdTurn: n.min(1),
            lastProgress: n,
          })
          .strict(),
        z
          .object({
            id,
            owner: id,
            kind: z.literal("eagle-lift"),
            hero: id,
            passenger: id,
            route: z.array(z.object(point).strict()).min(2).max(7),
            index: n,
            phase: z.union([z.literal(0), z.literal(1)]),
            status: z.enum(["active", "lost"]),
            createdTurn: n.min(1),
            createdRevision: n,
            lastProgress: z.number().int().min(-1).max(1000000),
          })
          .strict(),
      ]),
    ),
    navalEffects: z
      .array(
        z
          .object({
            id,
            owner: id,
            kind: z.enum(["calm", "surf", "unload-shield", "beacon"]),
            ship: id.optional(),
            tiles: z.array(z.object(point).strict()).max(16),
            until: n,
            turn: n,
            used: z.boolean(),
          })
          .strict(),
      )
      .max(128),
    movementTraces: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          route: z.array(z.object(point).strict()).min(2).max(256),
          turn: n.min(1),
          revision: n,
          erased: z.boolean(),
        })
        .strict(),
    ),
    routeSurveys: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          route: z.array(z.object(point).strict()).min(2).max(256),
          turn: n.min(1),
          revision: n,
        })
        .strict(),
    ),
    patrolWatches: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          survey: id,
          route: z.array(z.object(point).strict()).min(2).max(256),
          turn: n.min(1),
          lastReportRevision: z.number().int().min(-1),
        })
        .strict(),
    ),
    patrolReports: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          kind: z.enum(["track", "route"]),
          points: z.array(z.object(point).strict()).min(1).max(256),
          turn: n.min(1),
          revision: n,
          reportedTurn: n.min(1),
          reportedRevision: n,
          uncertainty: z.array(z.string().max(500)).max(8),
        })
        .strict(),
    ),
    traceContacts: z.array(z.object(point).strict()).max(1).optional(),
    shallowWater:z.record(z.string().regex(/^\d+,\d+$/),z.literal(true)),
    shorePreparations:z.record(id,z.object({id,owner:id,kind:z.enum(["surge","landing"]),hero:id,unit:id,tile:z.object(point).strict(),until:n,ship:id.optional(),committed:z.boolean().optional()}).strict()),
    currentCrossings:z.record(id,z.object({id,owner:id,hero:id,convoy:id,carrier:id,tiles:z.array(z.object(point).strict()).min(3).max(6),turn:n,consumed:z.boolean().optional()}).strict()),
    protectionKits:z.record(id,z.object({unit:id,owner:id,hazard:z.enum(["arrows","impact"]),materials:z.literal(5)}).strict()),
    armorFittings:z.record(id,z.object({unit:id,owner:id,item:id,hazard:z.enum(["arrows","impact"]),percent:z.union([z.literal(20),z.literal(25)]),until:n.nullable(),burden:n.max(1)}).strict()),
    toolMetadata:z.record(id,z.object({id,function:z.enum(['breach','repair']),standard:z.boolean(),material:z.literal('metal'),salvageM:n.max(15),salvageK:n.max(5)}).strict()),
    toolJobs:z.record(id,z.object({id,owner:id,mode:z.enum(['make','refit','repair']),facility:id.optional(),unit:id.optional(),tool:id.optional(),target:id.optional(),function:z.enum(['breach','repair']),remaining:n.min(1).max(2),started:n,lastProgress:z.number().int().min(-1),phase:z.enum(['working','lost']),cost:stock,input:z.object({id,name:z.string().max(200),owner:id.nullable(),bearer:id.nullable(),bonus:n,attackBonus:n.optional(),durability:n,maxDurability:n.min(1),crafted:z.boolean(),materials:z.array(id).min(1).max(8),...point}).strict().optional(),ceiling:z.object({id,function:z.enum(['breach','repair']),standard:z.boolean(),material:z.literal('metal'),salvageM:n.max(15),salvageK:n.max(5)}).strict().optional()}).strict()),
    mountLots:z.record(id,z.object({id,owner:id,count:z.literal(12),fatigue:n.max(6),stable:id.nullable(),unit:id.nullable()}).strict()),
    mountJobs:z.record(id,z.object({id,owner:id,kind:z.enum(['breed','recover','exchange']),facility:id,phase:z.enum(['working','outbound','returning','lost']),remaining:n.min(0).max(3),started:n,lastProgress:z.number().int().min(-1),cost:stock,lot:id.optional(),crew:id.optional(),rider:id.optional(),tired:id.optional(),route:z.array(z.object(point).strict()).max(32),index:n.max(31)}).strict()),
    watchGear:z.record(id,z.object({id,owner:id,facility:id,active:z.boolean()}).strict()),
    watchJobs:z.record(id,z.object({id,owner:id,facility:id,kind:z.enum(['make','move']),phase:z.enum(['working','lost']),remaining:z.literal(1),started:n,lastProgress:z.number().int().min(-1),cost:stock,worker:id.optional(),gear:id.optional(),staff:n,route:z.array(z.object(point).strict()).max(7),index:n.max(6)}).strict()),
    borderReports:z.record(id,z.object({id,owner:id,turn:n,revision:n,points:z.array(z.object(point).strict()).max(256),text:z.string().max(500)}).strict()),
    borderSurveys:z.record(id,z.object({id,owner:id,turn:n,revision:n,points:z.array(z.object(point).strict()).max(256)}).strict()),
    equipmentServices:z.record(id,z.object({id,owner:id,unit:id,item:id,facility:id,hazard:z.enum(["arrows","impact"]),started:n.min(1),lastProgress:n,status:z.enum(["working","lost"])}).strict()),
    fieldworkJobs:z.record(id,z.object({id,owner:id,worker:id,facility:id,kind:z.enum(["cover","barricade","gate","siege-brace"]),material:z.enum(["timber","stone","metal"]),...point,remaining:z.literal(1),started:n.min(1),lastProgress:n,cost:stock,status:z.enum(["working","lost"]),lifting:z.object({unit:id.optional(),method:z.enum(["worker","hero"]).optional(),turn:n.optional()}).strict().optional()}).strict()),
    fieldworks:z.record(id,z.object({id,owner:id,kind:z.enum(["cover","barricade","gate","siege-brace"]),material:z.enum(["timber","stone","metal"])}).strict()),
    repairKits:z.record(id,z.object({unit:id,owner:id,material:z.enum(["timber","stone","metal"]),stock}).strict()),
    faultMarks:z.record(id,z.object({id,owner:id,target:id,until:n}).strict()),
    worksiteSupports: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          profile: z.enum(["namo", "istari_ember"]),
          site: id,
          refuge: id,
          route: z.array(z.object(point).strict()).min(2).max(9),
          prepared: n.min(1),
          until: n.min(1),
          staff: n.min(1),
          used: z.boolean(),
        })
        .strict(),
    ),
    crops: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          plot: id,
          irrigation: id,
          stage: n.max(3),
          harvest: z.literal(30),
          remainingCare: n.max(3),
          advanced: z.boolean(),
          status: z.enum(["growing", "harvested", "failed"]),
          started: n.min(1),
          lastProgress: n,
          seed: stock,
        })
        .strict(),
    ),
    recoveries: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          unit: id,
          facility: id.optional(),
          shelter: id.optional(),
          location: z.object(point).strict(),
          injury: id,
          remaining: n.min(1).max(2),
          started: n.min(1),
          lastProgress: n,
          cost: stock,
          method: z.enum(["ordinary", "este"]),
          accelerated: z.boolean(),
        })
        .strict(),
    ),
    intelligenceReports: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          createdTurn: n.min(1),
          createdRevision: n,
          kind: z.enum(["attack", "cross-check", "relay"]),
          observations: z.array(observationFact).max(64),
          sourceReportIds: z.array(id).max(64),
          uncertainty: z.array(z.string().max(300)).max(8),
          status: z.enum([
            "dated",
            "corroborated",
            "contradictory",
            "unverified",
          ]),
        })
        .strict(),
    ),
    intelligenceTasks: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          kind: z.enum(["quiet-exchange", "beacon-concord"]),
          startedTurn: n.min(1),
          dueTurn: n.min(1),
          stationIds: z.array(id).min(2).max(3),
          reportIds: z.array(id).max(64),
          route: z.array(z.object(point).strict()).max(256),
          carrier: id.optional(),
          observations: z.array(observationFact).max(64),
        })
        .strict(),
    ),
    movementPlans: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          profile: id,
          createdTurn: n.min(1),
          createdRevision: n,
          lastResolvedRevision: n,
          until: n,
          pace: n.min(1),
          members: z
            .array(
              z
                .object({
                  unit: id,
                  route: z.array(z.object(point).strict()).min(1).max(256),
                  woodlandDiscount: n.max(1),
                  complete: z.boolean(),
                })
                .strict(),
            )
            .min(1)
            .max(3),
        })
        .strict(),
    ),
    vesselContacts: z
      .array(
        z
          .object({
            ...point,
            id,
            name: z.string().max(200),
            owner: id,
            hp: n.max(80),
            maxHp: z.literal(80),
            phase: z.enum(["idle", "loading", "sailing", "unloading", "wreck"]),
          })
          .strict(),
      )
      .max(10000)
      .optional(),
    contacts: z.array(z.object(point).strict()).max(10000).optional(),
    zones: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          kind: z.enum([
            "web",
            "roots",
            "threshold",
            "flare",
            "bloomscreen",
            "smoke",
            "mist",
            "light",
            "clear-air",
          ]),
          // Approach endpoints and normalized directions use sub-tile geometry.
          x: z.number().min(-8).max(135),
          y: z.number().min(-8).max(135),
          dx: z.number().min(-8).max(8),
          dy: z.number().min(-8).max(8),
          radius: z.number().min(0).max(8),
          until: n,
          triggered: z.boolean(),
        })
        .strict(),
    ),
    convoys: z.record(
      id,
      z
        .object({
          id,
          owner: id,
          carrier: id,
          origin: id,
          destination: id,
          cargo: stock,
          capacity: n.min(1).max(20),
          route: z.array(z.object(point).strict()).min(1).max(16384),
          index: n,
          phase: z.enum(["loading", "travel", "unloading", "lost"]),
          started: n.min(1),
          lastProgress: n,
          supplies: stock,
          recovery: z.boolean().optional(),
          rerouted: z.boolean().optional(),
          alternate: z
            .object({
              route: z.array(z.object(point).strict()).min(2).max(256),
              prepared: n,
              used: z.boolean(),
            })
            .strict()
            .optional(),
          kind: z.literal("eagle-relay").optional(),
          pauseReason: z.string().max(500).optional(),
          ...point,
        })
        .strict(),
    ),
    warnings: z
      .array(
        z
          .object({
            id,
            seat: id,
            power: z.enum(["field", "support"]),
            target: id,
            ...point,
            due: n,
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
export function parseMatch(value: unknown, guestSeat?: string): Match {
  const s = matchSchema.parse(value) as Match;
  for(const e of s.events)if(e.motion){
    // Historical actors may be dead, captured or omitted from a later guest view.
    // Ownership is asserted at emission; do not rewrite history from current owner.
    if(e.audience==='public'||e.audience.length!==1||!s.players[e.audience[0]]||(guestSeat&&e.audience[0]!==guestSeat)||e.turn>s.turn||e.motion.route.some((p,i)=>p.x<0||p.y<0||p.x>=s.map.width||p.y>=s.map.height||i>0&&Math.abs(p.x-e.motion!.route[i-1].x)+Math.abs(p.y-e.motion!.route[i-1].y)!==1))throw new Error('Invalid private completed movement event');
  }
  if (
    !guestSeat &&
    (s.attackPreparations !== undefined || s.observedAttackers !== undefined || s.chargeWarnings !== undefined || s.traceContacts !== undefined ||
      s.contacts !== undefined ||
      s.vesselContacts !== undefined ||
      s.tacticalSignals !== undefined)
  )
    throw new Error(
      "Guest observations cannot restore an authoritative checkpoint",
    );
  if (s.contacts?.some((p) => p.x >= s.map.width || p.y >= s.map.height))
    throw new Error("Invalid observation position");
  if(s.attackPreparations?.some(q=>!s.units[q.unit]||!s.units[q.target]||q.until<=s.revision||q.until>s.revision+2))throw new Error("Invalid observed attack preparation");
  validateFormations(s,guestSeat);
  validateHabitat(s,guestSeat);
  validateScouting(s,guestSeat);
  validateHunting(s,guestSeat);
  validateChargeState(s,guestSeat);
  if(s.observedAttackers?.some(id=>!s.units[id])||s.chargeWarnings?.some(w=>!s.units[w.target]||w.origin.x>=s.map.width||w.origin.y>=s.map.height||w.until<=s.revision))throw new Error("Invalid charge observations");
  if(s.tacticalSignals&&(new Set(s.tacticalSignals.map(q=>q.id)).size!==s.tacticalSignals.length||s.tacticalSignals.some(q=>!s.units[q.target]||q.origin.x>=s.map.width||q.origin.y>=s.map.height||q.until<=s.revision)))throw new Error("Invalid tactical observations");
  validateShoreState(s,guestSeat);
  validateTools(s,guestSeat);validateMounts(s,guestSeat);validateWatches(s,guestSeat);
  validateEquipmentServices(s,guestSeat);
  validateFieldworkState(s,guestSeat);
  validatePatrolState(s, guestSeat);
  const ps = Object.values(s.players);
  for (const [key, h] of Object.entries(s.seaHazards)) {
    const [x, y] = key.split(",").map(Number);
    if (
      x >= s.map.width ||
      y >= s.map.height ||
      s.map.terrain[y * s.map.width + x] !== "water" ||
      h.handling > 3
    )
      throw new Error("Invalid authored sea hazard");
  }
  for (const [id, v] of Object.entries(s.vessels)) {
    if (id !== v.id) throw new Error("Invalid vessel identity");
    validateVesselState(s, v, guestSeat);
  }
  if (s.vesselContacts?.some((p) => p.x >= s.map.width || p.y >= s.map.height))
    throw new Error("Invalid vessel contact bounds");
  if (guestSeat && Object.values(s.vessels).some((v) => v.owner !== guestSeat))
    throw new Error("Guest vessel identity leak");
  const reservedHullCrew = new Set<string>();
  for (const f of Object.values(s.facilities))
    if (f.job?.recipe === "hull") {
      const u = f.job.crew ? s.units[f.job.crew] : undefined;
      if (
        !u ||
        u.owner !== f.owner ||
        u.kind !== "worker" ||
        reservedHullCrew.has(u.id) ||
        Object.values(s.vessels).some((v) => v.crew === u.id) ||
        Object.values(s.intelligenceTasks).some((t) => t.carrier === u.id) ||
        Object.values(s.convoys).some(
          (c) => c.carrier === u.id && c.phase !== "lost",
        )
      )
        throw new Error("Invalid reserved hull crew");
      reservedHullCrew.add(u.id);
    }
  if (
    guestSeat &&
    Object.values(s.infrastructureWork).some((j) => j.owner !== guestSeat)
  )
    throw new Error("Guest infrastructure queue leak");
  validateInfrastructureState(s);
  validateNightWork(s,guestSeat);validateNightPatrols(s,guestSeat);validateRelayMessages(s,guestSeat);
  validateCivilianState(s,guestSeat);
  validateLogisticsState(s);
  if (
    guestSeat &&
    Object.values(s.logisticsJobs).some(
      (j) =>
        j.owner !== guestSeat &&
        (j.kind !== "eagle-lift" || s.units[j.passenger]?.owner !== guestSeat),
    )
  )
    throw new Error("Guest logistics leak");
  for (const q of Object.values(s.worksiteSupports)) {
    if (guestSeat && q.owner !== guestSeat)
      throw new Error("Guest worksite preparation leak");
    validateWorksiteSupport(s, q, guestSeat);
  }
  for (const c of Object.values(s.crops)) {
    if (guestSeat && c.owner !== guestSeat) throw new Error("Guest crop leak");
    validateCrop(s, c);
  }
  validateTacticalOrders(s, guestSeat);
  validateNavalEffects(s, guestSeat);
  recoveryInvariant(s, guestSeat);
  validateIntelligenceState(s, guestSeat);
  for (const plan of Object.values(s.movementPlans))
    validateMovementPlanState(s, plan, guestSeat);
  for (const [id, c] of Object.entries(s.crossings)) {
    if (id !== c.id) throw new Error("Invalid crossing identity");
    validateCrossingState(s, c, guestSeat);
  }
  if (
    ps.length < 2 ||
    ps.length > 4 ||
    new Set(ps.map((p) => profiles.find((f) => f.id === p.profile)!.faction))
      .size !== ps.length
  )
    throw new Error("Invalid or duplicate player identities");
  if (s.map.terrain.length !== s.map.width * s.map.height)
    throw new Error("Invalid map dimensions");
  for (const [key, p] of Object.entries(s.players)) {
    if (p.seat !== key || !s.nextSeq[key] || !s.receipts[key])
      throw new Error("Invalid seat sequence");
    if (
      (!guestSeat || guestSeat === key) &&
      (p.hero.status === "living" || p.hero.status === "captive")
    ) {
      const u = s.units[p.hero.id];
      if (!u || u.owner !== key || !u.alive || u.kind !== "hero")
        throw new Error("Hero slot mismatch");
    }
  }
  for (const [key, u] of Object.entries(s.units)) {
    if (
      u.id !== key ||
      u.hp > u.maxHp ||
      u.alive !== u.hp > 0 ||
      (!u.alive && u.active) ||
      u.x >= s.map.width ||
      u.y >= s.map.height
    )
      throw new Error("Invalid unit");
    if (u.owner !== "remnant" && !s.players[u.owner])
      throw new Error("Unknown owner");
    if (
      ["drake", "dragon", "winged-dragon", "balrog"].includes(u.kind) &&
      u.owner !== "remnant" &&
      !s.players[u.owner].profile.startsWith("melkor")
    )
      throw new Error("Exclusive creature owner");
  }
  for (const [key, f] of Object.entries(s.facilities)) {
    if (
      f.id !== key ||
      !s.players[f.owner] ||
      !buildings[f.kind] ||
      f.hp > f.maxHp ||
      f.x >= s.map.width ||
      f.y >= s.map.height
    )
      throw new Error("Invalid facility reference");
    repairInvariant(s, f);
    restInvariant(s, f);
    if (f.job) {
      const r = recipe(s.players[f.owner].profile, f.job.recipe);
      if (!r || r.facility !== f.kind)
        throw new Error("Invalid facility recipe");
      const j = f.job;
      if (f.hp <= 0)
        throw new Error("Destroyed facility cannot retain a production job");
      if (
        (["P", "M", "K", "E"] as const).some(
          (stock) => j.cost[stock] !== r.cost[stock],
        )
      )
        throw new Error(
          "Pending job paid cost does not match its versioned recipe",
        );
      if (
        j.supply !== r.supply ||
        j.great !== r.great ||
        j.binding !== r.binding
      )
        throw new Error(
          "Pending job capacity reservations do not match its recipe",
        );
      // Acceleration/research may shorten a job, never extend its base duration.
      // Lost staff or source access can pause it, so elapsed time is not progress.
      if (j.started < 1 || j.started > s.turn || j.remaining > r.turns)
        throw new Error("Invalid pending production timeline");
    }
  }
  for (const p of ps) {
    if (guestSeat && p.seat !== guestSeat) continue;
    const live = Object.values(s.units).filter(
      (u) => u.owner === p.seat && u.kind === "hero" && u.alive,
    );
    const jobs = Object.values(s.facilities).filter(
      (f) => f.owner === p.seat && f.job?.recipe === "hero",
    );
    const occupied = ["living", "captive"].includes(p.hero.status);
    if (
      live.length !== (occupied ? 1 : 0) ||
      jobs.length !== (p.hero.status === "pending" ? 1 : 0)
    )
      throw new Error("Hero slot and queue invariant");
    if (
      (p.hero.status === "captive" && live[0].active) ||
      (p.hero.status === "living" && !live[0].active)
    )
      throw new Error("Invalid captive/living activity");
    if (
      occupied &&
      JSON.stringify([...live[0].inventory].sort()) !==
        JSON.stringify([...p.hero.equipment].sort())
    )
      throw new Error("Hero inventory mismatch");
  }
  const activeCarriers = new Set<string>();
  for (const [id, c] of Object.entries(s.convoys)) {
    if (c.id !== id) throw new Error("Invalid convoy identity");
    validateConvoyState(s, c, Boolean(guestSeat));
    if (c.phase !== "lost") {
      if (activeCarriers.has(c.carrier))
        throw new Error("Duplicate convoy carrier");
      activeCarriers.add(c.carrier);
    }
  }
  for (const [id, zone] of Object.entries(s.zones))
    if (
      id !== zone.id ||
      !s.players[zone.owner] ||
      zone.x < -zone.radius - Math.abs(zone.dx) ||
      zone.y < -zone.radius - Math.abs(zone.dy) ||
      zone.x > s.map.width - 1 + zone.radius + Math.abs(zone.dx) ||
      zone.y > s.map.height - 1 + zone.radius + Math.abs(zone.dy)
    )
      throw new Error("Invalid terrain zone");
  const carried = new Set<string>();
  for (const u of Object.values(s.units)) {
    for (const id of u.inventory) {
      if (carried.has(id) || !s.items[id] || s.items[id].bearer !== u.id)
        throw new Error("Duplicate or invalid inventory");
      carried.add(id);
    }
  }
  for (const [id, item] of Object.entries(s.items)) {
    if (
      item.id !== id ||
      item.durability > item.maxDurability ||
      (item.bearer && !carried.has(id)) ||
      (item.owner && !s.players[item.owner])
    )
      throw new Error("Invalid equipment custody");
  }
  return s;
}
