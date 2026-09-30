import {councilVisible} from "../simulation/council";
import {surgeFootingPenalty} from "../simulation/shore-powers";
import {observation} from "../simulation/visibility";
import { localTraceSites } from "../simulation/patrols";
import { projectAttackPreparations,projectTacticalSignals } from "../simulation/tactical-orders";
import { terrainObserved } from "../simulation/visibility";
import { z } from "zod";
import { VERSION, stocks, type Match, type Order } from "../simulation/types";
import { parseOrder } from "../simulation/schema";
import {
  submit,
  visible,
  resolveWeek,
  silhouetteContacts,
} from "../simulation/engine";
const hello = z
  .object({
    type: z.literal("hello"),
    version: z.literal(VERSION),
    invite: z.string().min(20).max(256),
    seat: z.enum(["p2", "p3", "p4"]),
    token: z.string().max(256),
  })
  .strict();
export type Reply =
  | { type: "error"; message: string }
  | { type: "welcome"; seat: string; token: string; snapshot: Match }
  | {
      type: "receipt";
      ok: boolean;
      message: string;
      id: string;
      snapshot: Match;
    }
  | { type: "snapshot"; snapshot: Match };
export function guestSnapshot(s: Match, seat: string): Match {
  const out = structuredClone(s);
  for(const[id,q]of Object.entries(out.falseTrails))if(q.owner!==seat)delete out.falseTrails[id];
  for(const[id,q]of Object.entries(out.agentCaptivities))if(q.owner!==seat&&q.captor!==seat)delete out.agentCaptivities[id];
  for(const[id,q]of Object.entries(out.agentDisclosures))if(q.owner!==seat)delete out.agentDisclosures[id];
  for(const records of [out.beaconSurveyCandidates,out.beaconLinks,out.beaconSignals,out.loggingJobs])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const id of Object.keys(out.beaconFogUses))if(id!==seat)delete out.beaconFogUses[id];
  for(const[id,q]of Object.entries(out.waterChannels))if(!terrainObserved(s,seat,q))delete out.waterChannels[id];
  for(const id of Object.keys(out.loggedVegetation))if(!s.vegetation[id]||!terrainObserved(s,seat,s.vegetation[id]))delete out.loggedVegetation[id];
  for(const[id,q]of Object.entries(out.warbandAgreements))if(q.owner!==seat)delete out.warbandAgreements[id];
  out.localGroundTraces={};out.groveDisturbances={};
  for(const[id,q]of Object.entries(out.localKnowledgeReports))if(q.owner!==seat)delete out.localKnowledgeReports[id];
  for(const records of [out.routineInspections,out.routineWearUses,out.airflowWarnings])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const id of Object.keys(out.routineWorksiteWear))if(s.facilities[id]?.owner!==seat)delete out.routineWorksiteWear[id];
  for(const id of Object.keys(out.tunnelAir))if(s.infrastructureSites[id]?.owner!==seat)delete out.tunnelAir[id];
  for(const id of Object.keys(out.routineTravelEvents))if(s.units[id]?.owner!==seat)delete out.routineTravelEvents[id];
  for(const[id,q]of Object.entries(out.habitatWear))if(!s.vegetation[q.vegetation]||!terrainObserved(s,seat,s.vegetation[q.vegetation]))delete out.habitatWear[id];
  for(const u of Object.values(out.units))if(u.owner!==seat)delete u.reserveProvisions;
  for(const[id,q]of Object.entries(out.ledgeConsents))if(q.owner!==seat&&q.visitor!==seat)delete out.ledgeConsents[id];
  for(const[id,q]of Object.entries(out.landingSurveys))if(q.owner!==seat)delete out.landingSurveys[id];
  for(const[id,q]of Object.entries(out.grievances))if(!councilVisible(q,seat))delete out.grievances[id];
  for(const[id,q]of Object.entries(out.restitutions))if(q.owner!==seat)delete out.restitutions[id];
  for(const[id,q]of Object.entries(out.survivorMemories))if(q.owner!==seat)delete out.survivorMemories[id];
  for(const [id,q] of Object.entries(out.forestConsents))if(q.owner!==seat&&q.melian!==seat)delete out.forestConsents[id];
  for(const q of Object.values(out.forestVeils))if(s.units[q.unit]?.owner!==seat)q.trail=[];
  for(const records of [out.forestRoutes,out.forestVeils,out.forestReports,out.forestEntrances])for(const [id,q] of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const records of [out.portableWorkshops,out.portableConsents])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const [id,q] of Object.entries(out.productionPlans))if(q.owner!==seat){if(q.carrier!==null||!terrainObserved(s,seat,q))delete out.productionPlans[id];else{q.archive='undisclosed';delete q.workshop;delete q.committedTurn;}}
  for(const [id,q] of Object.entries(out.dreamPlans)) if(q.owner!==seat) delete out.dreamPlans[id];
  for(const records of [out.toolJobs,out.mountLots,out.mountJobs,out.watchGear,out.watchJobs,out.borderReports,out.borderSurveys])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const id of Object.keys(out.toolMetadata))if(s.items[id]?.owner!==seat)delete out.toolMetadata[id];
  for(const records of [out.darkShifts,out.dawnWatches,out.dawnReports,out.scoutCredentials,out.nightPatrols,out.nightReports,out.personalNightSurveys,out.relayMessages,out.secondSignals,out.relayDeliveries])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const id of Object.keys(out.nightBearingUses))if(id!==seat)delete out.nightBearingUses[id];for(const id of Object.keys(out.witnessChainUses))if(id!==seat)delete out.witnessChainUses[id];
  for(const records of [out.formationOrders,out.garrisonPosts,out.garrisonReports])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const records of [out.households,out.civilianJobs])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const[id,q]of Object.entries(out.civilianConsents))if((q.owner!==seat&&q.guest!==seat)||!s.facilities[q.refuge]||!visible(s,seat,s.facilities[q.refuge]))delete out.civilianConsents[id];
  for(const records of [out.shorePreparations,out.currentCrossings])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const key of Object.keys(out.shallowWater)){const[x,y]=key.split(",").map(Number);if(!terrainObserved(s,seat,{x,y}))delete out.shallowWater[key];}
  for(const u of Object.values(out.units))if(u.owner===seat&&surgeFootingPenalty(s,s.units[u.id]))u.effects.push({kind:"shore-footing",value:1,until:s.revision+1,source:`shallow:${u.x},${u.y}`});
  for(const records of [out.heroTrailSurveys,out.trailProjects])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const[id,q]of Object.entries(out.vegetation))if(!terrainObserved(s,seat,q))delete out.vegetation[id];
  for(const[id,q]of Object.entries(out.oldTrails))if(!q.tiles.every(at=>terrainObserved(s,seat,at)))delete out.oldTrails[id];
  for(const[id]of Object.entries(out.livingBarriers))if(!s.facilities[id]||!visible(s,seat,s.facilities[id]))delete out.livingBarriers[id];
  for(const records of [out.scoutShadows,out.witnessedAttacks,out.witnessFlares,out.huntingJobs,out.huntingReports])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const[id,q]of Object.entries(out.preySites))if(observation(s,seat,q)==="hidden")delete out.preySites[id];
  for(const records of [out.protectionKits,out.armorFittings,out.equipmentServices,out.fieldworkJobs,out.repairKits])for(const[id,q]of Object.entries(records))if(q.owner!==seat)delete records[id];
  for(const[id]of Object.entries(out.fieldworks))if(!s.facilities[id]||!visible(s,seat,s.facilities[id]))delete out.fieldworks[id];
  for(const[id,q]of Object.entries(out.faultMarks))if(q.owner!==seat)delete out.faultMarks[id];
  out.traceContacts = localTraceSites(s, seat);
  out.movementTraces = {};
  for (const records of [
    out.routeSurveys,
    out.patrolWatches,
    out.patrolReports,
  ])
    for (const [id, r] of Object.entries(records))
      if (r.owner !== seat) delete records[id];
  for (const [id, j] of Object.entries(out.logisticsJobs))
    if (
      j.owner !== seat &&
      (j.kind !== "eagle-lift" || s.units[j.passenger]?.owner !== seat)
    )
      delete out.logisticsJobs[id];
  for (const [id, q] of Object.entries(out.worksiteSupports))
    if (q.owner !== seat) delete out.worksiteSupports[id];
  out.contacts = silhouetteContacts(s, seat);
  out.tacticalSignals = projectTacticalSignals(s, seat);
  out.attackPreparations=projectAttackPreparations(s,seat);
  out.observedAttackers=Object.values(s.tacticalOrders).filter(q=>(q.kind==="pursuit"||q.kind==="ranged-attack")&&q.until>=s.revision&&s.units[q.unit]&&visible(s,seat,s.units[q.unit])).map(q=>q.unit);
  out.chargeWarnings=Object.values(s.charges).filter(q=>q.owner!==seat&&q.until>s.revision&&s.units[q.target]&&visible(s,seat,s.units[q.target])).map(q=>({id:q.id,target:q.target,origin:{...q.targetOrigin},until:q.until}));
  for(const[id,q]of Object.entries(out.charges))if(q.owner!==seat)delete out.charges[id];
  for (const [id, q] of Object.entries(out.tacticalOrders))
    if (q.owner !== seat) delete out.tacticalOrders[id];
  for (const [id, j] of Object.entries(out.infrastructureWork))
    if (j.owner !== seat) delete out.infrastructureWork[id];
  for (const [id, site] of Object.entries(out.infrastructureSites))
    if (site.owner !== seat) {
      if (!terrainObserved(s, seat, site)) delete out.infrastructureSites[id];
      else {
        site.yield = stocks();
        delete site.claimedBy;
      }
    }
  out.navalEffects = out.navalEffects.filter(
    (e) =>
      e.owner === seat ||
      (e.kind === "surf" && e.tiles.some((p) => terrainObserved(s, seat, p))),
  );
  for (const [id, c] of Object.entries(out.crops))
    if (c.owner !== seat) delete out.crops[id];
  for (const [id, q] of Object.entries(out.recoveries))
    if (q.owner !== seat) delete out.recoveries[id];
  out.vesselContacts = Object.values(s.vessels)
    .filter((v) => v.owner !== seat && visible(s, seat, v))
    .map((v) => ({
      id: v.id,
      name: v.name,
      owner: v.owner,
      x: v.x,
      y: v.y,
      hp: v.hp,
      maxHp: v.maxHp,
      phase: v.phase,
    }));
  for (const [id, v] of Object.entries(out.vessels))
    if (v.owner !== seat) delete out.vessels[id];
  for (const key of Object.keys(out.seaHazards)) {
    const [x, y] = key.split(",").map(Number);
    if (!terrainObserved(s, seat, { x, y })) delete out.seaHazards[key];
  }
  for (const [id, r] of Object.entries(out.intelligenceReports))
    if (r.owner !== seat) delete out.intelligenceReports[id];
  for (const [id, t] of Object.entries(out.intelligenceTasks))
    if (t.owner !== seat) delete out.intelligenceTasks[id];
  for (const [id, plan] of Object.entries(out.movementPlans))
    if (plan.owner !== seat) delete out.movementPlans[id];
  for (const [id, c] of Object.entries(out.crossings))
    if (
      c.owner !== seat &&
      ![s.facilities[c.from], s.facilities[c.to]].every(
        (f) => f && visible(s, seat, f),
      )
    )
      delete out.crossings[id];
  out.rng = 0;
  out.orders = out.orders.filter((o) => o.seat === seat);
  out.events = out.events.filter(
    (e) => e.audience === "public" || e.audience.includes(seat),
  );
  out.warnings = out.warnings.filter((w) => visible(s, seat, w));
  for (const warning of out.warnings)
    if (warning.seat !== seat) {
      const target = s.units[warning.target] ?? s.facilities[warning.target];
      if (!target || !visible(s, seat, target)) warning.target = "unidentified";
    }
  for (const [id, convoy] of Object.entries(out.convoys))
    if (convoy.owner !== seat) delete out.convoys[id];
  for (const [id, zone] of Object.entries(out.zones))
    if (zone.owner !== seat && !visible(s, seat, zone)) delete out.zones[id];
  for (const [id, p] of Object.entries(out.players)) {
    if (id === seat) continue;
    p.stock = stocks();
    p.component = 0;
    p.sources = [];
    p.research = [];
    p.memory = [];
    p.relations = p.relations[seat] ? { [seat]: p.relations[seat] } : {};
    p.hero = {
      id: p.hero.id,
      status: "uncreated",
      level: 1,
      xp: 0,
      perks: [],
      equipment: [],
      readiness: 0,
    };
    out.receipts[id] = [];
    out.nextSeq[id] = 1;
  }
  for (const [id, u] of Object.entries(out.units)) {
    if (!visible(s, seat, u)&&!Object.values(out.agentCaptivities).some(q=>q.unit===id&&q.captor===seat)) {
      delete out.units[id];
      continue;
    }
    if (u.owner !== seat) {
      u.inventory = [];
      u.effects = [];
    }
  }
  for (const j of Object.values(out.logisticsJobs))
    if (j.kind === "eagle-lift")
      for (const id of [j.hero, j.passenger]) {
        if (!out.units[id] && s.units[id])
          out.units[id] = structuredClone(s.units[id]);
        const u = out.units[id];
        if (u && u.owner !== seat) {
          u.inventory = [];
          u.effects = [];
        }
      }
  for (const [id, f] of Object.entries(out.facilities)) {
    if (!visible(s, seat, f)) {
      delete out.facilities[id];
      continue;
    }
    if (f.owner !== seat) {
      delete f.job;
      delete f.repair;
      delete f.rest;
    }
  }
  for (const [id, i] of Object.entries(out.items))
    if (
      i.owner !== seat &&
      !(i.owner === null && i.bearer === null && visible(s, seat, i))
    )
      delete out.items[id];
  out.nextId = 0;
  return out;
}
export class HostAuthority {
  state: Match;
  readonly assignments: Record<string, string> = {};
  readonly seatTokens: Record<string, string> = {};
  private rate = new Map<string, { at: number; count: number }>();
  private bindings = new Map<string, string>();
  constructor(
    state: Match,
    private invite: string,
    tokens: Record<string, string> = {},
  ) {
    this.state = state;
    Object.assign(this.seatTokens, tokens);
  }
  disconnect(peer: string) {
    const seat = this.bindings.get(peer);
    this.bindings.delete(peer);
    if (seat) delete this.assignments[seat];
  }
  receive(peer: string, raw: string, now: number): Reply {
    try {
      if (
        typeof raw !== "string" ||
        new TextEncoder().encode(raw).length > 16384
      )
        throw new Error("Payload exceeds 16 KiB");
      let rate = this.rate.get(peer);
      if (!rate || now - rate.at >= 1000) {
        rate = { at: now, count: 0 };
        this.rate.set(peer, rate);
      }
      if (++rate.count > 30) throw new Error("Rate limit: wait one second");
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== "object")
        throw new Error("Malformed message");
      if ("type" in value && value.type === "hello") {
        const h = hello.parse(value);
        if (h.invite !== this.invite)
          throw new Error("Invalid private invitation");
        if (!this.state.players[h.seat])
          throw new Error("Seat not in this match");
        const existing = this.seatTokens[h.seat];
        if (existing && h.token !== existing)
          throw new Error(
            "Returning seat requires its saved rejoin credential",
          );
        if(h.token&&Object.entries(this.seatTokens).some(([seat,token])=>seat!==h.seat&&token===h.token))throw new Error("Rejoin credential already belongs to another seat");
        const assigned = this.assignments[h.seat];
        if (this.bindings.has(peer) && this.bindings.get(peer) !== h.seat)
          throw new Error("Peer already bound to another seat");
        // Possession of the saved seat capability authenticates a replacement
        // before the old transport's close event necessarily reaches us.
        if (assigned && assigned !== peer) this.bindings.delete(assigned);
        // The guest already holds this capability before the first welcome,
        // so losing that snapshot cannot strand a reserved seat.
        const token =
          existing ??
          (h.token.length >= 32
            ? h.token
            : crypto.randomUUID() + crypto.randomUUID());
        this.seatTokens[h.seat] = token;
        this.assignments[h.seat] = peer;
        this.bindings.set(peer, h.seat);
        this.state.players[h.seat].ai = false;
        return {
          type: "welcome",
          seat: h.seat,
          token,
          snapshot: guestSnapshot(this.state, h.seat),
        };
      }
      const seat = this.bindings.get(peer);
      if (!seat) throw new Error("Authenticate seat before orders");
      if (
        "type" in value &&
        value.type === "sync" &&
        Object.keys(value).length === 1
      )
        return { type: "snapshot", snapshot: guestSnapshot(this.state, seat) };
      const packet = z
        .object({ type: z.literal("order"), order: z.unknown() })
        .strict()
        .parse(value);
      const order = parseOrder(packet.order);
      if (order.seat !== seat)
        throw new Error("Order identity differs from authenticated seat");
      const r = submit(this.state, order);
      this.state = r.state;
      return {
        type: "receipt",
        ok: r.ok,
        message: r.reason,
        id: order.id,
        snapshot: guestSnapshot(this.state, seat),
      };
    } catch (e) {
      return {
        type: "error",
        message:
          e instanceof z.ZodError
            ? "Malformed or incompatible protocol; use the same game version"
            : e instanceof Error
              ? e.message
              : "Invalid message",
      };
    }
  }
  local(order: Order) {
    const r = submit(this.state, order);
    this.state = r.state;
    return r;
  }
  canResolve() {
    return (
      Object.values(this.state.players).every((p) => p.eliminated || p.ready) &&
      Object.values(this.state.players)
        .filter((p) => !p.eliminated && p.seat !== "p1")
        .every((p) => Boolean(this.assignments[p.seat]))
    );
  }
  resolve() {
    if (!this.canResolve())
      throw new Error("Paused: all living seats must be connected and ready");
    this.state = resolveWeek(this.state);
    return this.state;
  }
}
