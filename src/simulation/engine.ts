import {finalProduction,finalDeviceReason,deployFinalDevice} from "../content/final-production";
import {extendedProduction,extendedCapabilities} from "../content/extended-production";
import {militaryProduction,militaryCapabilities} from "../content/military-production";
import {companionProduction} from "../content/companion-production";
import {secondaryProduction,secondaryCapabilities,secondaryVenomHit,progressSecondaryVenom} from "../content/secondary-production";
import {carryHeavy,heavyCarryReason,dropHeavy,heavyDropReason,heavyLoad,settleHeavyEquipment} from "./heavy-equipment";
import {captureAgentReason,captureAgent,freeAgentReason,freeAgent,settleAgentCaptivities} from "./agent-captivity";
import {initializeWaterChannels,loggingReason,startLogging,loggingWorkerBusy,progressLogging} from "./ordinary-environment";
import {beaconSurveyReason,surveyBeaconLink,beaconSignalReason,startBeaconSignal,progressBeaconSignals} from "./relay-messages";
import {agreeWarbandRewardReason,agreeWarbandReward,payWarbandRewardReason,payWarbandReward,recordWarbandParticipation,progressWarbandRewards} from "./warband-rewards";
import {localKnowledgeReason,inspectLocalKnowledge,pruneLocalKnowledge} from "./local-knowledge";
import {inspectWorksiteReason,inspectWorksite,progressRoutineEnvironment,tunnelProductionPenalty,pruneRoutineEnvironment} from "./routine-environment";
import {reserveReason,packRations,payReservedUpkeep} from "./reserved-rations";
import {createBasinScenario} from "../content/scenario";
import {siegeRecipe,isOrdinarySiege,siegeAttackReason,consumeSiegeShot,siegeReloadReason,reloadSiege} from "./siege";
import {ledgeConsentReason,landingSurveyReason,setLedgeConsent,inspectLanding,pruneEyrieState} from "./transport";
import {portableReason,applyPortable,progressPortableWorkshops,settlePortableLosses,portableBusy} from "./portable-workshop";
import {preserveReason,preservePlan,rememberReason,rememberWorkshop,planAllowsProduction,dropPlans,planRecoveryReason,recoverPlan,refreshPlans} from "./preserved-plan";
import { recordGrievance, termsReason, offerTerms, consentReason, consentTerms, deliveryReason, deliverRestitution, recoveryReason as restitutionRecoveryReason, recoverRestitution, councilReason, settleCouncil, restitutionBusy, progressRestitution, type CouncilChecks } from "./council";
import { falseTrailReason,layFalseTrail,forestReason, consentVeilReason, consentVeil, prepareForest, resolveForestPatrols, forestAttack, harassmentReason, harassConvoy, releaseForest, forestWeekly, entranceReason, assignForestEntrance, inspectForestReason, inspectForestTrail, settleForest } from "./forest-routes";
import { dreamReason, prepareDream, replacementReason, replaceDream, pruneDreams, interruptDream, type DreamChecks } from "./dream-preparation";
import {queueToolReason,queueTool,refitToolReason,refitTool,fieldRepairReason,fieldRepair,progressTools,toolUnitBusy,toolFacilityBusy} from './tool-services';
import {queueMountsReason,queueMounts,recoverMountsReason,recoverMounts,remountReason,startRemount,progressMounts,mountUnitBusy,mountFacilityBusy,initializeMounts,createCompanyMounts} from './remounts';
import {watchGearReason,queueWatchGear,reweaveReason,startReweave,progressWatchGear,watchUnitBusy,watchFacilityBusy} from './watch-posts';
import {initializeNight,advanceNightRegions,darkShiftReason,assignDarkShift,illuminationReason,illuminateShift,dawnWatchReason,selectDawnWatch} from './night-work';
import {trainScoutReason,trainScout,finishScoutTraining,nightPatrolReason,startNightPatrol,advanceNightPatrols,publishNightReports,settleNightParties,nightBusy} from './night-patrol';
import {relayReason,startRelayMessage,secondSignalReason,prepareSecondSignal,progressRelayMessages,settleRelayLosses,relayBusy} from './relay-messages';
import {nightPower,nightOperations,type NightAction} from './night-relay';
import {formationReason,prepareFormation,resolveFormations,formationOperations,formationBusy,postReason,assignPost,interruptFormation} from "./formation-orders";
import {initializeHouseholds,civilianProfiles,civilianBusy,civilianReason,applyCivilian,progressCivilians,settleCivilianLosses,type CivilianChecks} from "./civilians";
import {surgeReason,surgePassage,currentReason,authorizeCurrentCrossing,currentAllows,landingReason,prepareLanding,interruptShorePower} from "./shore-powers";
import {habitatReason,applyHabitatPower,progressHabitat,habitatWorkerBusy,lifterReason,assignLifter,blockTrailReason,blockTrail,interruptHabitat} from "./habitat-works";
import {protectionKitReason,makeProtectionKit,fitGuardReason,fitGuard,temperReason,startTemper,progressEquipmentServices,equipmentServiceBusy,fittingReduction} from "./equipment-service";
import {scoutPowerReason,useScoutPower,recordWitnessedAttack,shadowContacts,examineShadowReason,examineShadow,pruneScouting} from "./scouting";
import {initializePrey,huntingReason,prepareHunting,resolveHunting,interruptHunting,huntingBusy} from "./hunting";
import { damageMorale, verifiedOrderMorale, moraleAttackPenalty, finishMoraleEncounter } from "./morale";
import {fieldworkPlotReservations,fieldworkReason,startFieldwork,progressFieldworks,fieldworkWorkerBusy,fieldworkKinds,repairKitReason,loadRepairKit,braceBreachReason,braceBreach,faultReason,markFault,fieldworkBreachBonus,fieldworkBlocks,fieldworkCoverReduction} from "./fieldworks";
import { chargeReason,prepareCharge,chargeOperationCost,resolveCharges,isChargeMember,interruptChargesOnDamage,pursuitDamagePenalty } from "./charges";
import {
  transportClassFor,
  logisticsReason,
  startLogistics,
  progressLogistics,
  logisticsUnitBusy,
  logisticsShipBusy,
} from "./logistics-support";
import {
  recordPatrolMovement,
  inspectTraceReason,
  inspectTrace,
  starwatchReason,
  prepareStarwatch,
} from "./patrols";
import {
  infrastructureBlocked,
  infrastructureReason,
  startInfrastructureWork,
  infrastructurePowerReason,
  applyInfrastructurePower,
  progressInfrastructureWork,
  isInfrastructureWorker,
} from "./infrastructure-work";
import {
  worksiteSupportReason,
  prepareWorksiteSupport,
  evacuationReason,
  evacuateWorksite,
  progressWorksiteSupports,
  type WorksiteChecks,
} from "./worksite-support";
import {
  releaseTacticalOrder,
  tacticalPartyBusy,
  grappleMovementBlocked,
  grappleOccupiesHero,
  interruptGrappleOnDamage,
  tacticalAlarmReason,
  raiseTacticalAlarm,
  tacticalOrderReason,
  declareTacticalOrder,
  tacticalPowerReason,
  applyTacticalPower,
  resolveTacticalOrders,
} from "./tactical-orders";
import {
  navalPowerReason,
  applyNavalPower,
  unloadingDamage,
  expireNavalEffects,
  connectedCoastal,
} from "./naval-powers";
import {
  plantingReason,
  plantCrop,
  cropPowerReason,
  advanceCrop,
  progressCrops,
} from "./crops";
import {
  careEvacuationReason,applyCareEvacuation,
  careReason,
  startCare,
  carePowerReason,
  accelerateCare,
  progressCare,
  recordRecoverableInjury,
} from "./recovery";
import {
  intelligenceReason,
  startIntelligence,
  recordObservedAttack,
  progressIntelligence,
  isIntelligenceCourier,
} from "./intelligence";
import { observation, terrainObserved } from "./visibility";
import {
  navalOrderReason,
  startNavalOrder,
  progressVessels,
  spawnVessel,
  damageVessel,
  isAboard,
  isNavalCrew,
  type NavalAction,
} from "./naval";
import {
  crossingReason,
  startCrossing,
  progressCrossings,
  crossingAllows,
  damageCrossing,
  isCrossingCrew,
} from "./crossings";
import {
  prepareMovementPower,
  validateMovementPower,
  resolveMovementPlan,
  consumeMovementPlanStep,
  woodlandMovementCost,
  movementOperationCost,
} from "./movement-plans";
import {
  restReason,
  startRest,
  progressRest,
  pruneRest,
  travelFatigue,
  fatigueMovementPenalty,
} from "./fatigue";
import {
  beginPassivePhase,
  passiveActivity,
  passiveOrdinaryHit,
  endPassivePhase,
} from "./passives";
import { interruptCastOnDamage } from "./cast-interruption";
import { effectiveRelation } from "./diplomacy";
import {
  movementZonePenalty,
  crossZones,
  rangedZonePenalty,
  clearableZone,
  pruneZones,
} from "./zones";
import {
  validateConvoy,
  startConvoy,
  progressConvoys,
  settleConvoyLosses,
  recoverCargoReason,
  recoverCargo,
  rerouteConvoyReason,
  rerouteConvoy,
  prepareSupplyReason,
  prepareSupply,
  eyrieRelayReason,
  startEyrieRelay,
} from "./transport";
import {
  interruptTreatments,
  afterOrdinaryDamage,
  attackPenalty,
  movementPenalty,
  endEncounterConditions,
} from "./conditions";
import { radagastInterceptor } from "./interception";
import { wearEquipment } from "./equipment";
import {
  repairReason,
  startRepair,
  progressRepairs,
  pruneRepairs,
} from "./repair";
import { activeEffects, protectedDamage, sightline } from "./effects";
import {
  zonePowerProfiles,
  AbilityValidationError,
  abilityAvailability,
  resolveAbility,
} from "./abilities";
import abilityData from "../content/abilities.json";
import { factionProduction } from "../content/production";
import { parseOrder } from "./schema";
import {
  profile,
  factionBuilding,
  supportingSummon,
  sarumanSentinel,
  limits,
  recipe,
  buildings,
  economy,
} from "../content/catalog";
import {
  VERSION,
  stocks,
  type Match,
  type Order,
  type Action,
  type Player,
  type Unit,
  type Pos,
  type Stock,
  type GameEvent,
  type Facility,
} from "./types";
const keys: (keyof Stock)[] = ["P", "M", "K", "E"];
export const distance = (a: Pos, b: Pos) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const entityAt = (s: Match, id: string): Unit | Facility | undefined =>
  (s.units[id] as Unit | undefined) ?? s.facilities[id];
const copy = <T>(x: T): T => structuredClone(x);
const afford = (p: Player, c: Stock) => keys.every((k) => p.stock[k] >= c[k]);
const pay = (p: Player, c: Stock) =>
  keys.forEach((k) => {
    p.stock[k] -= c[k];
  });
const event = (
  s: Match,
  text: string,
  audience: GameEvent["audience"] = "public",
) => {
  s.events.push({ id: s.nextId++, turn: s.turn, text, audience });
  if (s.events.length > 400) s.events.shift();
};
export const exclusive = (u: Unit) =>
  ["drake", "dragon", "winged-dragon", "balrog"].includes(u.kind);
const owned = (s: Match, seat: string, id: string) =>
  s.units[id]?.owner === seat && s.units[id].alive && s.units[id].active;
export function rng(s: Match) {
  s.rng = (Math.imul(1664525, s.rng) + 1013904223) >>> 0;
  return s.rng / 4294967296;
}
export function visible(s: Match, seat: string, pos: Pos) {
  if ("id" in pos) {
    const entity =
      entityAt(s, String(pos.id)) ??
      s.vessels?.[String(pos.id)] ??
      s.vesselContacts?.find((v) => v.id === String(pos.id));
    if (entity?.owner === seat) return true;
    if (
      s.units[String(pos.id)] &&
      (isAboard(s, String(pos.id)) || isNavalCrew(s, String(pos.id)))
    )
      return false;
    if (entity) return observation(s, seat, pos) === "identified";
  }
  return terrainObserved(s, seat, pos);
}
export function silhouetteContacts(s: Match, seat: string): Pos[] {
  if (s.contacts) return s.contacts.map(({ x, y }) => ({ x, y }));
  const seen = new Set<string>();
  return Object.values(s.units)
    .filter((u) => {
      const key = `${u.x}:${u.y}`;
      if (!u.alive || observation(s, seat, u) !== "silhouette" || seen.has(key))
        return false;
      seen.add(key);
      return true;
    })
    .map(({ x, y }) => ({ x, y })).concat(shadowContacts(s,seat));
}
const pathCache = new WeakMap<
  Match,
  { signature: string; routes: Map<string, Pos[] | null> }
>();
export function path(
  s: Match,
  start: Pos,
  end: Pos,
  flying = false,
  traveller?: Unit,
): Pos[] | null {
  traveller ??= "id" in start ? s.units[String(start.id)] : undefined;
  if (
    traveller &&
    grappleMovementBlocked(s, traveller.id) &&
    distance(start, end) > 0
  )
    return null;
  if (traveller?.landed) flying = false;
  const blocked = (p: Pos) =>
    (!flying && fieldworkBlocks(s,p,traveller)) ||
    !flying &&
    (infrastructureBlocked(s, p, "land") ||
      (["water", "cliff"].includes(s.map.terrain[p.y * s.map.width + p.x]) &&
        !s.shallowWater[`${p.x},${p.y}`] && !(traveller && (crossingAllows(s, p, traveller)||currentAllows(s,traveller,p)))));
  if (
    !Number.isInteger(end.x) ||
    !Number.isInteger(end.y) ||
    end.x < 0 ||
    end.y < 0 ||
    end.x >= s.map.width ||
    end.y >= s.map.height
  )
    return null;
  if (blocked(end)) return null;
  const signature = `${JSON.stringify(s.shallowWater)}:${JSON.stringify(s.currentCrossings)}:${s.turn}:${JSON.stringify(Object.values(s.fieldworks).map(q=>s.facilities[q.id]))}:${s.map.width}:${s.map.height}:${s.map.terrain.join(",")}:${JSON.stringify(s.crossings)}:${JSON.stringify(s.infrastructureSites)}:${Object.values(
    s.facilities,
  )
    .filter((f) => f.kind === "crossing-anchor")
    .map((f) => `${f.id}:${f.owner}:${f.hp}:${f.workers}`)
    .join(";")}:${Object.values(s.players)
    .map((p) => JSON.stringify(p.relations))
    .join(";")}`;
  let cache = pathCache.get(s);
  if (!cache || cache.signature !== signature) {
    cache = { signature, routes: new Map() };
    pathCache.set(s, cache);
  }
  const cacheKey = `${start.x}:${start.y}:${end.x}:${end.y}:${flying}:${traveller?.owner}:${traveller?.kind}`;
  const cloneRoute = (r: Pos[] | null) =>
    r?.map((p) => ({ x: p.x, y: p.y })) ?? null;
  if (cache.routes.has(cacheKey))
    return cloneRoute(cache.routes.get(cacheKey)!);
  const remember = (r: Pos[] | null) => {
    if (cache!.routes.size >= 64)
      cache!.routes.delete(cache!.routes.keys().next().value!);
    cache!.routes.set(cacheKey, cloneRoute(r));
    return r;
  };
  const queue = [{ x: start.x, y: start.y }],
    prev = new Map<string, Pos | null>([[`${start.x},${start.y}`, null]]);
  for (let i = 0; i < queue.length && i < 16384; i++) {
    const p = queue[i];
    if (p.x === end.x && p.y === end.y) {
      const out: Pos[] = [];
      let at: Pos | null = p;
      while (at) {
        out.push(at);
        at = prev.get(`${at.x},${at.y}`) ?? null;
      }
      return remember(out.reverse());
    }
    for (const n of [
      { x: p.x + 1, y: p.y },
      { x: p.x, y: p.y + 1 },
      { x: p.x - 1, y: p.y },
      { x: p.x, y: p.y - 1 },
    ]) {
      if (n.x < 0 || n.y < 0 || n.x >= s.map.width || n.y >= s.map.height)
        continue;
      const k = `${n.x},${n.y}`;
      if (prev.has(k) || blocked(n)) continue;
      prev.set(k, p);
      queue.push(n);
    }
  }
  return remember(null);
}
function unit(
  s: Match,
  seat: string,
  id: string,
  name: string,
  kind: Unit["kind"],
  x: number,
  y: number,
): Unit {
  const p = s.players[seat];
  const l = p ? limits(p.profile) : limits("melkor_worldbreaker");
  const hero = kind === "hero";
  const special = ["drake", "dragon", "winged-dragon", "balrog"].includes(kind);
  let hp = hero ? l.heroHp : special ? 90 : 40;
  let attack = hero ? l.heroAttack : special ? 20 : 10;
  let move = 6;
  let armor = 2;
  if (p?.profile === "human_rohan") {
    move = 9;
    armor = 1;
  }
  if (p?.profile.startsWith("dwarf")) {
    armor = 5;
    move = 4;
  }
  if (p?.profile.startsWith("elf")) {
    hp = 50;
    attack = 13;
  }
  if (p?.profile === "orc_fortress_clan") {
    hp = 35;
    attack = 11;
  }
  if (kind === "worker") {
    hp = 20;
    attack = 2;
  }
  if (p && !hero && !special && kind !== "worker") {
    const spec = factionProduction(p.profile).unit;
    hp = spec.hp;
    attack = spec.attack;
    armor = spec.armor;
    move = spec.move;
    kind = spec.kind;
    name = spec.name;
    if (p.research.includes("technique")) attack += 2;
    if (p.research.includes("defenses")) armor += 1;
  }
  return {
    id,
    owner: seat,
    name,
    kind,
    x,
    y,
    hp,
    maxHp: hp,
    attack,
    armor,
    move,
    supply:
      hero || kind === "worker"
        ? 0
        : special
          ? kind === "drake"
            ? 3
            : kind === "winged-dragon"
              ? 8
              : 6
          : p
            ? factionProduction(p.profile).unit.supply
            : 1,
    great: special ? (kind === "winged-dragon" ? 2 : 1) : 0,
    binding: 0,
    upkeep:
      p && !hero && !special && kind !== "worker"
        ? factionProduction(p.profile).unit.upkeep
        : stocks(hero || kind === "worker" ? 0 : 1),
    flying: kind === "winged-dragon" || p?.profile === "eagle_eyrie",
    landed: true,
    ...(kind==="company"&&p?.profile==="dwarf_nogrod"?{engineer:"nogrod" as const}:{}),
    loadClass: transportClassFor(p?.profile ?? "melkor_worldbreaker", kind),
    active: seat !== "remnant",
    alive: true,
    supplied: true,
    effects: [],
    inventory: [],
  };
}
export function createMatch(
  ids: string[],
  seed: number,
  size = 32,
  matchId?: string,
): Match {
  if (ids.length < 2 || ids.length > 4) throw new Error("Choose 2–4 factions");
  const identities = ids.map((id) => profile(id).faction);
  if (new Set(identities).size !== ids.length)
    throw new Error("Duplicate faction / hero identity");
  if (!Number.isInteger(seed) || size < 24 || size > 128)
    throw new Error("Invalid scenario parameters");
  const scenario = createBasinScenario(size);
  const s: Match = {
    grievances:{},restitutions:{},survivorMemories:{},
    falseTrails:{},
    agentCaptivities:{},agentDisclosures:{},
    waterChannels:{},loggingJobs:{},loggedVegetation:{},beaconSurveyCandidates:{},beaconLinks:{},beaconSignals:{},beaconFogUses:{},
    warbandAgreements:{},
    localKnowledgeReports:{},localGroundTraces:{},groveDisturbances:{},
    routineInspections:{},routineWearUses:{},routineWorksiteWear:{},habitatWear:{},tunnelAir:{},airflowWarnings:{},routineTravelEvents:{},
    ledgeConsents:{},landingSurveys:{},portableWorkshops:{},portableConsents:{},productionPlans:{},dreamPlans: {},forestConsents:{},forestRoutes:{},forestVeils:{},forestReports:{},forestEntrances:{},
    version: VERSION,
    id: matchId ?? `basin-${seed}-${ids.join("-")}`,
    scenario: "Cross-era sandbox",
    revision: 0,
    turn: 1,
    combatPhase: 0,
    rng: seed >>> 0,
    phase: "planning",
    players: {},
    units: {},
    facilities: {},
    items: {},
    sites: [],
    map: {...scenario.map,scenarioId:scenario.id},
    orders: [],
    receipts: {},
    nextSeq: {},
    events: [],
    nextId: 1,
    winner: null,
    warnings: [],
    convoys: {},
    zones: {},
    crossings: {},
    recoveries: {},
    crops: {},
    worksiteSupports: {},
    shallowWater:{},shorePreparations:{},currentCrossings:{},
    toolMetadata:{},toolJobs:{},mountLots:{},mountJobs:{},watchGear:{},watchJobs:{},borderReports:{},borderSurveys:{},
    protectionKits:{},armorFittings:{},equipmentServices:{},
    fieldworkJobs:{},fieldworks:{},repairKits:{},faultMarks:{},
    movementTraces: {},
    routeSurveys: {},
    patrolWatches: {},
    patrolReports: {},
    infrastructureSites: {},
    infrastructureWork: {},
    nightRegions:{},darkShifts:{},dawnWatches:{},dawnReports:{},scoutCredentials:{},nightPatrols:{},nightReports:{},personalNightSurveys:{},nightBearingUses:{},relayMessages:{},secondSignals:{},relayDeliveries:{},witnessChainUses:{},
    households:{},civilianConsents:{},civilianJobs:{},
    logisticsJobs: {},
    navalEffects: [],
    tacticalOrders: {},
    intelligenceReports: {},
    intelligenceTasks: {},
    formationOrders:{},garrisonPosts:{},garrisonReports:{},
    vegetation:{},livingBarriers:{},oldTrails:{},heroTrailSurveys:{},trailProjects:{},
    scoutShadows:{},witnessedAttacks:{},witnessFlares:{},preySites:{},huntingJobs:{},huntingReports:{},
    charges:{},
    movementPlans: {},
    vessels: {},
    seaHazards: {},
  };
  // Cross-era sandbox adaptation: sparse, fixed coastal hazards. Wave severity1,
  // a fog delay and one handling delay per river segment are provisional values.
  // These are scenario facts, not historical geography or extra randomness.
  for (let y = 1; y < size; y++) {
    const x = Math.floor(size / 2);
    if (s.map.terrain[y * size + x] !== "water") continue;
    if ([9,21,33].includes(y))s.shallowWater[`${x},${y}`]=true;
    if (y % 8 === 3)
      s.seaHazards[`${x},${y}`] = { wave: 1, fog: false, handling: 0 };
    if (y % 8 === 5)
      s.seaHazards[`${x},${y}`] = { wave: 0, fog: true, handling: 0 };
    if (y % 8 === 6)
      s.seaHazards[`${x},${y}`] = { wave: 0, fog: false, handling: 1 };
  }
  const corners = scenario.starts;
  ids.forEach((id, i) => {
    const seat = `p${i + 1}`,
      p = profile(id),
      at = corners[i],
      l = limits(id);
    s.players[seat] = {
      seat,
      profile: id,
      stock: stocks(230, 240, 180, 180),
      component: 0,
      hero: {
        id: `${seat}:hero`,
        status: "uncreated",
        level: 1,
        xp: 0,
        perks: [],
        readiness: id === "melkor_worldbreaker" ? 12 : 6,
        equipment: [],
      },
      operations: 3,
      commitment: 1,
      ready: false,
      ai: i > 0,
      encounter: false,
      tacticalUsed: false,
      eliminated: false,
      streak: 0,
      research: [],
      sources: [
        ...new Set([
          economy(id).component.access,
          ...factionProduction(id).unit.access,
          ...factionProduction(id).equipment.access,
          "timber",
          "stone",
        ]),
      ],
      relations: {},
      memory: [],
    };
    s.nextSeq[seat] = 1;
    s.receipts[seat] = [];
    s.facilities[`${seat}:core`] = {
      id: `${seat}:core`,
      owner: seat,
      name: economy(id).heroBuilding,
      kind: "core",
      tier: 1,
      hp: 180,
      maxHp: 180,
      workers: 3,
      ...at,
    };
    s.facilities[`${seat}:training`] = {
      id: `${seat}:training`,
      owner: seat,
      name: factionProduction(id).trainingName,
      kind: "training",
      tier: 1,
      hp: 100,
      maxHp: 100,
      workers: 2,
      x: at.x + 1,
      y: at.y,
    };
    for (let n = 0; n < 3; n++) {
      const id = `${seat}:company:${n}`;
      s.units[id] = unit(
        s,
        seat,
        id,
        n === 2 ? "Recovery workers" : `${p.faction} company ${n + 1}`,
        n === 2 ? "worker" : "company",
        at.x,
        at.y + n + 1,
      );
    }
    for (const [index, kind] of (
      ["shaft", "haulway", "wreck"] as const
    ).entries()) {
      const point = { x: at.x + index - 1, y: at.y - 2 };
      if (
        !["water", "cliff"].includes(s.map.terrain[point.y * size + point.x])
      ) {
        const siteId = `infrastructure:${seat}:${kind}`;
        s.infrastructureSites[siteId] = {
          id: siteId,
          owner: seat,
          kind,
          ...point,
          blocked: kind !== "wreck",
          originalCapacity: 1,
          material: "stone",
          yield: kind === "wreck" ? stocks(0, 30) : stocks(),
          consumed: false,
        };
      }
    }
    const channel = { x: Math.floor(size / 2), y: at.y };
    if (s.map.terrain[channel.y * size + channel.x] === "water") {
      const siteId = `infrastructure:${seat}:channel`;
      // Deliberately nonblocking initially: clearing remains an authored hazard
      // option without closing the sandbox's only river for every seat.
      s.infrastructureSites[siteId] = {
        id: siteId,
        owner: seat,
        kind: "channel",
        ...channel,
        blocked: false,
        originalCapacity: 1,
        material: "silt",
        yield: stocks(),
        consumed: false,
      };
    }
    if (l.supply === 12) s.players[seat].stock.P = 150;
  });
  const mid = Math.floor(size / 2);
  s.sites = scenario.landmarks.map(site=>({...site,owner:null}));
  [
    ["drake", mid - 6, 8],
    ["balrog", mid + 5, mid - 4],
    ["winged-dragon", mid, mid + 7],
  ].forEach(([kind, x, y], i) => {
    const u = unit(
      s,
      "remnant",
      `remnant:${i}`,
      `Uncalled ${kind}`,
      kind as Unit["kind"],
      Number(x),
      Number(y),
    );
    u.upkeep = creatureUpkeep(u.kind);
    s.units[u.id] = u;
  });
  // Authored sandbox designation: existing woodland starts mature; no terrain
  // is created. Each region receives one existing two-tile old trail if present.
  for(const p of Object.values(s.players)){const core=s.facilities[`${p.seat}:core`];const woods=s.map.terrain.map((t,i)=>({t,x:i%s.map.width,y:Math.floor(i/s.map.width)})).filter(q=>q.t==="woodland").sort((a,b)=>distance(a,core)-distance(b,core)||a.y-b.y||a.x-b.x);for(const at of woods.slice(0,8)){const id=`vegetation:${at.x}:${at.y}`;s.vegetation[id]={id,x:at.x,y:at.y,mature:true,altered:false};}const first=woods.find(at=>woods.some(q=>distance(q,at)===1));const second=first&&woods.find(q=>distance(q,first)===1);if(first&&second){const id=`old-trail:${p.seat}`;s.oldTrails[id]={id,tiles:[{x:first.x,y:first.y},{x:second.x,y:second.y}],blocked:true,waystation:core.id};}}
  // Provisional sandbox inventory: twelve nonrenewing animals per starting region,
  // four P per animal; normal hunt maximum two. Sites retain IDs across checkpoints.
  for(const p of Object.values(s.players)){const core=s.facilities[`${p.seat}:core`];const candidates=s.map.terrain.map((t,i)=>({t,x:i%s.map.width,y:Math.floor(i/s.map.width)})).filter(q=>["meadow","woodland"].includes(q.t)&&!Object.values(s.preySites).some(v=>v.x===q.x&&v.y===q.y)).sort((a,b)=>distance(a,core)-distance(b,core)||a.y-b.y||a.x-b.x);const at=candidates[0];if(at)initializePrey(s,[{id:`prey:${p.seat}`,x:at.x,y:at.y,habitat:at.t as "meadow"|"woodland",initial:12,remaining:12,harvested:0,yieldP:4}]);}
  event(
    s,
    "Cross-era sandbox: invented connected basin; unique canonical artifacts absent. Hold two sites from week 8 for three resolutions.",
  );
  initializeHouseholds(s);
  initializeNight(s);initializeWaterChannels(s);
  initializeMounts(s);
  return s;
}
function capacity(s: Match, seat: string) {
  const p = s.players[seat],
    l = limits(p.profile),
    holds = Object.values(s.facilities).filter(
      (f) => f.owner === seat && f.kind === "hold" && f.hp > 0,
    ).length;
  const us = Object.values(s.units).filter(
    (u) => u.owner === seat && u.alive && u.active,
  );
  const jobs = Object.values(s.facilities)
    .filter((f) => f.owner === seat && f.job)
    .map((f) => f.job!);
  return {
    supply:
      us.reduce((a, u) => a + u.supply, 0) +
      jobs.reduce((a, j) => a + j.supply, 0),
    great:
      us.reduce((a, u) => a + u.great, 0) +
      jobs.reduce((a, j) => a + j.great, 0),
    binding:
      us.reduce((a, u) => a + u.binding, 0) +
      jobs.reduce((a, j) => a + j.binding, 0),
    supplyMax:
      l.supply +
      (p.profile === "melkor_dark_architect" ? Math.min(2, holds) * 12 : 0),
    greatMax:
      l.great +
      (p.profile === "melkor_dark_architect" ? Math.min(2, holds) * 2 : 0),
    bindingMax: l.binding,
  };
}
export const capacities = capacity;
type PowerContract = {
  cost: { readiness: number; stocks: Stock };
  commitment: string;
  timing: { warningPhases: number | null };
};
function contract(id: string, which: "field" | "support") {
  return (
    abilityData.profiles as unknown as Record<
      string,
      Record<string, PowerContract>
    >
  )[id][which];
}
export function powerCost(p: Player, which: "field" | "support") {
  const q = profile(p.profile)[
    which === "field" ? "field_power" : "support_power"
  ];
  const c = contract(p.profile, which);
  return { cost: c.cost.stocks, readiness: c.cost.readiness, source: q };
}
export function movementPowerOperations(
  s: Match,
  seat: string,
  a: Extract<Action, { kind: "movement-power" }>,
): number {
  return movementOperationCost(
    s,
    prepareMovementPower(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    ),
  );
}
const tactical = (p: Player, a: Action) =>
  (a.kind==="forest-power"&&a.mode==="departing") ||
  (a.kind === "logistics" && a.mode === "lift") ||
  (a.kind === "formation-power"&&a.mode==="rendezvous") ||
  a.kind === "scout-power" ||
  a.kind === "charge-power" ||
  a.kind === "tactical-power" ||
  a.kind === "surge-passage" || a.kind === "coastal-landing" || a.kind === "fit-guard" || a.kind === "brace-breach" || a.kind === "read-fault" ||
  a.kind === "inspect-trace" ||
  (a.kind === "naval-power" && a.power === "field") ||
  (a.kind === "movement-power" && p.profile !== "melkor_dark_architect") ||
  (a.kind === "cast" &&
    contract(p.profile, a.power).commitment === "tactical") ||
  ((p.encounter || a.kind === "attack" || a.kind === "capture") &&
    "unit" in a &&
    a.unit === p.hero.id &&
    ["move", "attack", "capture"].includes(a.kind));
const navalKinds = new Set([
  "prepare-rescue-rig",
  "load-cargo",
  "unload-cargo",
  "embark",
  "disembark",
  "rescue-passenger",
  "sail",
  "repair-ship",
]);
const hullCrew = (s: Match, id: string) =>
  Object.values(s.facilities).some(
    (f) => !!f.job && recipe(s.players[f.owner].profile,f.job.recipe)?.kind === "vessel" && f.job.crew === id,
  );
function freeWorker(s: Match, seat: string, f: Facility): Unit | undefined {
  return Object.values(s.units)
    .filter(
      (u) =>
        u.owner === seat &&
        u.kind === "worker" &&
        u.alive &&
        u.active &&
        u.supplied &&
        distance(u, f) <= 1 &&
        !Object.values(s.recoveries).some((q) => q.unit === u.id) &&
        !loggingWorkerBusy(s,u.id) && !portableBusy(s,u.id) && !restitutionBusy(s,u.id) && !nightBusy(s,u.id) && !relayBusy(s,u.id) &&
        !civilianBusy(s,u.id) &&
        !isChargeMember(s,u.id) &&
        !isIntelligenceCourier(s, u.id) &&
        !isNavalCrew(s, u.id) &&
        !isAboard(s, u.id) &&
        !hullCrew(s, u.id) &&
        !isInfrastructureWorker(s, u.id) &&
        !isCrossingCrew(s, u.id) &&
        !Object.values(s.convoys).some(
          (c) => c.carrier === u.id && c.phase !== "lost",
        ),
    )
    .sort((a, b) => a.id.localeCompare(b.id))[0];
}
function launchTile(s: Match, f: Facility): Pos | undefined {
  return [
    { x: f.x + 1, y: f.y },
    { x: f.x, y: f.y + 1 },
    { x: f.x - 1, y: f.y },
    { x: f.x, y: f.y - 1 },
  ].find(
    (p) =>
      p.x >= 0 &&
      p.y >= 0 &&
      p.x < s.map.width &&
      p.y < s.map.height &&
      s.map.terrain[p.y * s.map.width + p.x] === "water" &&
      !Object.values(s.vessels).some((v) => v.hp > 0 && distance(v, p) === 0),
  );
}
function actionReason(s: Match, seat: string, a: Action): string {
  const p = s.players[seat];
  if (!p) return "Unknown seat";
  if (p.eliminated) return "Faction has lost its recovery footholds";
  if (p.ready && a.kind !== "ready") return "Seat already committed";
  if (a.kind === "ready") return "";
  if(a.kind!=='assign-mining-engine'&&([...('unit'in a?[a.unit]:[]),...('carrier'in a&&a.carrier?[a.carrier]:[]),...('worker'in a?[a.worker]:[]),...('crew'in a?[a.crew]:[]),...(a.kind==='declare-tactical'?[a.order.unit]:[]),...(a.kind==='movement-power'||a.kind==='formation-power'?a.members.map(m=>m.unit):[])].some(id=>s.units[id]?.mineWork)))return 'Mining engine is assigned to a worksite; release it first';
  if(a.kind==='consent-ledge')return ledgeConsentReason(s,seat,a.ledge,a.visitor,a.allow);
  if(a.kind==='survey-landing')return landingSurveyReason(s,seat,a.destination,at=>visible(s,seat,at));
  if(a.kind==='portable'&&a.mode==='consent')return portableReason(s,seat,a,civilianChecks(s));
  if(a.kind!=='portable'&&([...('unit'in a?[a.unit]:[]),...('carrier'in a&&a.carrier?[a.carrier]:[]),...('worker'in a?[a.worker]:[]),...('crew'in a?[a.crew]:[]),...(a.kind==='movement-power'||a.kind==='formation-power'?a.members.map(m=>m.unit):[])].some(id=>portableBusy(s,id))))return 'Carrier is committed to a portable workshop';
  if(a.kind==="consent-veil")return consentVeilReason(s,seat,a.unit,a.melian,a.accept);
  if(a.kind==="release-forest")return s.forestRoutes[a.id]?.owner===seat?"":"Own maintained route required";
  if (a.kind === "replace-dream") return replacementReason(s, seat, a.plan, a.report, dreamChecks(s));
  if(a.kind==='council-drop'){const j=s.restitutions[a.restitution];return j?.owner===seat&&j.phase==='travel'?'':'Own traveling restitution required';}
  if(a.kind==='council-terms')return termsReason(s,seat,a.grievance,a.payment)||(s.players[a.mediator]?.profile==='nienna'?'':'Existing Nienna mediator required');
  if(a.kind==='council-consent')return consentReason(s,seat,a.grievance)||(a.accept&&s.grievances[a.grievance].termsVersion!==a.termsVersion?'Terms changed; review the current exact payment':'');
  const councilUnits=[...('unit' in a?[a.unit]:[]),...('carrier' in a&&a.carrier?[a.carrier]:[]),...('worker' in a?[a.worker]:[]),...('crew' in a?[a.crew]:[]),...('courier' in a?[a.courier]:[]),...(a.kind==='movement-power'||a.kind==='formation-power'?a.members.map(m=>m.unit):[]),...(a.kind==='declare-tactical'?[a.order.unit]:[])];
  if(councilUnits.some(id=>restitutionBusy(s,id)))return 'Courier is committed to conserved restitution';
  const reservedNight=(id:string)=>nightBusy(s,id)||relayBusy(s,id);
  if(("unit"in a&&reservedNight(a.unit))||("worker"in a&&reservedNight(a.worker))||("carrier"in a&&a.carrier&&reservedNight(a.carrier))||("crew"in a&&reservedNight(a.crew))||("courier"in a&&reservedNight(a.courier))||(a.kind==="movement-power"&&a.members.some(m=>reservedNight(m.unit)))||(a.kind==="declare-tactical"&&reservedNight(a.order.unit)))return "Party is committed to night work or a physical message";
  if (("unit" in a&&civilianBusy(s,a.unit))||("worker" in a&&civilianBusy(s,a.worker))||("carrier" in a&&a.carrier&&civilianBusy(s,a.carrier))||("crew" in a&&civilianBusy(s,a.crew))||(a.kind==="movement-power"&&a.members.some(m=>civilianBusy(s,m.unit)))||(a.kind==="declare-tactical"&&civilianBusy(s,a.order.unit)))return "Carrier is committed to civilian transport";
  if ((a.kind === "attack" || a.kind === "capture" || a.kind === "attack-ship") && s.units[a.unit]?.owner===seat && activeEffects(s,s.units[a.unit]).some(e=>e.kind==="rout")) return "Routed company must withdraw or rally before attacking";

  const serviceBusy=(id:string)=>toolUnitBusy(s,id)||mountUnitBusy(s,id)||watchUnitBusy(s,id);
  const serviceUnits=[...councilUnits,...("rider" in a?[a.rider]:[]),...("item" in a&&s.items[a.item]?.bearer?[s.items[a.item].bearer!]:[])];
  if(serviceUnits.some(id=>loggingWorkerBusy(s,id)))return 'Worker is committed to finite logging';
  if(serviceUnits.some(serviceBusy))return 'Company is committed to a funded tool, mount or watch job';
  if('facility' in a&&a.facility&&(toolFacilityBusy(s,a.facility)||mountFacilityBusy(s,a.facility)||watchFacilityBusy(s,a.facility)))return 'Facility queue is committed to tools, mounts or watch equipment';
  if(("unit" in a&&equipmentServiceBusy(s,a.unit))||("carrier" in a&&a.carrier&&equipmentServiceBusy(s,a.carrier))||("worker" in a&&equipmentServiceBusy(s,a.worker))||("crew" in a&&equipmentServiceBusy(s,a.crew))||(a.kind==="movement-power"&&a.members.some(m=>equipmentServiceBusy(s,m.unit)))||(a.kind==="declare-tactical"&&equipmentServiceBusy(s,a.order.unit)))return "Company is committed to armor refitting";
  if("facility" in a&&Object.values(s.equipmentServices).some(q=>q.facility===a.facility&&q.status==="working"))return "Workshop queue is committed to armor refitting";
  if(("unit" in a&&formationBusy(s,a.unit))||("worker" in a&&formationBusy(s,a.worker))||("carrier" in a&&a.carrier&&formationBusy(s,a.carrier))||("crew" in a&&formationBusy(s,a.crew))||(a.kind==="movement-power"&&a.members.some(m=>formationBusy(s,m.unit)))||(a.kind==="declare-tactical"&&formationBusy(s,a.order.unit)))return "Company is committed to an explicit formation route";
  if(("unit" in a&&habitatWorkerBusy(s,a.unit))||("worker" in a&&habitatWorkerBusy(s,a.worker))||("crew" in a&&habitatWorkerBusy(s,a.crew))||("carrier" in a&&a.carrier&&habitatWorkerBusy(s,a.carrier))||(a.kind==="movement-power"&&a.members.some(m=>habitatWorkerBusy(s,m.unit)))||(a.kind==="declare-tactical"&&habitatWorkerBusy(s,a.order.unit)))return "Party occupies a construction or trail role";
  if(("unit" in a&&huntingBusy(s,a.unit))||("worker" in a&&huntingBusy(s,a.worker))||("carrier" in a&&a.carrier&&huntingBusy(s,a.carrier))||("crew" in a&&huntingBusy(s,a.crew))||(a.kind==="movement-power"&&a.members.some(m=>huntingBusy(s,m.unit)))||(a.kind==="declare-tactical"&&huntingBusy(s,a.order.unit)))return "Party is committed to a physical hunting assignment";
  if(("unit" in a&&fieldworkWorkerBusy(s,a.unit))||("worker" in a&&fieldworkWorkerBusy(s,a.worker))||("carrier" in a&&a.carrier&&fieldworkWorkerBusy(s,a.carrier))||("crew" in a&&fieldworkWorkerBusy(s,a.crew))||(a.kind==="declare-tactical"&&fieldworkWorkerBusy(s,a.order.unit))||(a.kind==="movement-power"&&a.members.some(m=>fieldworkWorkerBusy(s,m.unit))))return "Worker is committed to fieldwork construction";
  if("facility" in a&&Object.values(s.fieldworkJobs).some(q=>q.status==="working"&&q.facility===a.facility))return "Worksite supplies a pending fieldwork queue";
  if(("unit" in a&&isChargeMember(s,a.unit))||("carrier" in a&&a.carrier&&isChargeMember(s,a.carrier))||("crew" in a&&isChargeMember(s,a.crew))||("worker" in a&&isChargeMember(s,a.worker))||(a.kind==="movement-power"&&a.members.some(m=>isChargeMember(s,m.unit)))||(a.kind==="declare-tactical"&&isChargeMember(s,a.order.unit)))return "Party is committed to a declared charge";
  if (
    a.kind !== "logistics" &&
    (("unit" in a && logisticsUnitBusy(s, a.unit)) ||
      ("carrier" in a && a.carrier && logisticsUnitBusy(s, a.carrier)) ||
      ("crew" in a && logisticsUnitBusy(s, a.crew)) ||
      ("worker" in a && logisticsUnitBusy(s, a.worker)) ||
      ("ship" in a &&
        a.ship &&
        a.kind !== "attack-ship" &&
        logisticsShipBusy(s, a.ship)))
  )
    return "Party is reserved by a physical logistics order";
  if (
    a.kind !== "logistics" &&
    logisticsUnitBusy(s, p.hero.id) &&
    [
      "cast",
      "call",
      "recover",
      "naval-power",
      "movement-power",
      "tactical-power",
      "charge-power",
      "scout-power",
      "habitat-power",
      "formation-power",
      "forest-power", "prepare-dream", "council-settle", "remember-workshop",
      "surrender",
    ].includes(a.kind)
  )
    return "Hero is carrying a physical rescue";

  if (
    "facility" in a &&
    a.facility &&
    a.kind !== "infrastructure-work" &&
    Object.values(s.infrastructureWork).some((j) => j.facility === a.facility)
  )
    return "Facility queue reserved by an infrastructure project";
  const infrastructureBusy = (id: string) => isInfrastructureWorker(s, id);
  if (
    ("unit" in a && infrastructureBusy(a.unit)) ||
    ("carrier" in a && a.carrier && infrastructureBusy(a.carrier)) ||
    ("crew" in a && infrastructureBusy(a.crew))
  )
    return "Worker is reserved by an infrastructure project";
  if (a.kind === "infrastructure-work") {
    if (p.operations < 1) return "No strategic operations remain";
    if (
      tacticalPartyBusy(s, a.worker) ||
      Object.values(s.recoveries).some((q) => q.unit === a.worker) ||
      isCrossingCrew(s, a.worker) ||
      isNavalCrew(s, a.worker) ||
      isAboard(s, a.worker) ||
      hullCrew(s, a.worker) ||
      isIntelligenceCourier(s, a.worker) ||
      Object.values(s.convoys).some(
        (c) => c.carrier === a.worker && c.phase !== "lost",
      )
    )
      return "Worker already has another assignment";
    return infrastructureReason(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u?.flying ?? false, u),
    );
  }
  if (a.kind === "cancel-tactical")
    return Object.values(s.tacticalOrders).some(
      (q) => q.owner === seat && q.unit === a.unit,
    )
      ? ""
      : "Own declared tactical order required";
  const busyTactical = (id: string) => tacticalPartyBusy(s, id);
  if (
    a.kind !== "tactical-power" && !(a.kind==="forest-power"&&a.mode==="departing") &&
    (("unit" in a && busyTactical(a.unit)) ||
      ("carrier" in a && a.carrier && busyTactical(a.carrier)) ||
      ("crew" in a && busyTactical(a.crew)) ||
      (a.kind === "movement-power" &&
        a.members.some((m) => busyTactical(m.unit))))
  )
    return "Formation has a declared tactical order; cancel it first";
  if (a.kind === "cancel-care")
    return Object.values(s.recoveries).some(
      (q) => q.owner === seat && q.unit === a.unit,
    )
      ? ""
      : "Owned recovery queue required";
  if (
    ("unit" in a &&
      Object.values(s.recoveries).some((q) => q.unit === a.unit)) ||
    ("carrier" in a &&
      Object.values(s.recoveries).some((q) => q.unit === a.carrier)) ||
    ("crew" in a &&
      Object.values(s.recoveries).some((q) => q.unit === a.crew)) ||
    (a.kind === "movement-power" &&
      a.members.some((m) =>
        Object.values(s.recoveries).some((q) => q.unit === m.unit),
      ))
  )
    return "Patient is resting; explicitly cancel care before another action";
  if (
    "facility" in a &&
    a.kind !== "care" &&
    a.kind !== "care-power" &&
    Object.values(s.recoveries).some((q) => q.facility === a.facility)
  )
    return "Facility recovery queue occupied";
  if (
    ("unit" in a && isIntelligenceCourier(s, a.unit)) ||
    ("carrier" in a && a.carrier && isIntelligenceCourier(s, a.carrier)) ||
    ("crew" in a && isIntelligenceCourier(s, a.crew)) ||
    (a.kind === "movement-power" &&
      a.members.some((m) => isIntelligenceCourier(s, m.unit)))
  )
    return "Courier is committed to a dated report delivery";
  if (navalKinds.has(a.kind)) {
    if (p.operations < 1) return "No strategic operations remain";
    if (
      "unit" in a &&
      ["embark", "rescue-passenger"].includes(a.kind) &&
      (isCrossingCrew(s, a.unit) ||
        hullCrew(s, a.unit) ||
        Object.values(s.movementPlans).some((plan) =>
          plan.members.some((m) => m.unit === a.unit && !m.complete),
        ) ||
        Object.values(s.convoys).some(
          (c) => c.carrier === a.unit && c.phase !== "lost",
        ))
    )
      return "Party is committed to another assignment";
    return navalOrderReason(s, seat, a as NavalAction);
  }
  if (
    a.kind!=="coastal-landing" && "unit" in a &&
    (isAboard(s, a.unit) || isNavalCrew(s, a.unit) || hullCrew(s, a.unit))
  )
    return "Unit is committed aboard or crewing a vessel; use fleet controls";
  if (
    "carrier" in a &&
    a.carrier &&
    (isAboard(s, a.carrier) ||
      isNavalCrew(s, a.carrier) ||
      hullCrew(s, a.carrier))
  )
    return "Carrier is committed to a vessel";
  if (
    [
      "cast",
      "recover",
      "call",
      "crossing",
      "movement-power",
      "eyrie-relay",
      "prepare-supply",
      "intelligence-power",
    ].includes(a.kind) &&
    isAboard(s, p.hero.id)
  )
    return "Hero is aboard a vessel; land before a separate commitment";

  if (
    "carrier" in a &&
    a.carrier &&
    (isCrossingCrew(s, a.carrier) ||
      Object.values(s.movementPlans).some((plan) =>
        plan.members.some((m) => m.unit === a.carrier && !m.complete),
      ))
  )
    return "Carrier is committed to another work assignment";
  if ("unit" in a && isCrossingCrew(s, a.unit))
    return "Worker is committed to crossing construction";
  if (
    "unit" in a &&
    Object.values(s.movementPlans).some(
      (plan) =>
        plan.until > s.revision &&
        plan.members.some((m) => m.unit === a.unit && !m.complete),
    )
  )
    return "Formation is committed to a declared movement plan";
  if (
    [
      "cast",
      "recover",
      "call",
      "eyrie-relay",
      "infrastructure-power",
      "prepare-supply",
      "surrender",
    ].includes(a.kind) &&
    Object.values(s.convoys).some(
      (c) => c.carrier === p.hero.id && c.phase !== "lost",
    )
  )
    return "Hero is carrying committed cargo; finish delivery before another commitment";
  if (
    "unit" in a &&
    Object.values(s.convoys).some(
      (c) => c.carrier === a.unit && c.phase !== "lost",
    )
  )
    return "Carrier committed to a physical convoy; finish unloading before another action";
  if (a.kind === "convoy") {
    if (p.operations < 1) return "No strategic operations remain";
    return validateConvoy(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
  }
  const heroAction = (a.kind==='portable'&&a.mode==='relocate') ||
    equipmentPower(a) ||
    (a.kind==="night"&&nightPower(a)) ||
    (a.kind==="civilian"&&"method" in a&&a.method!=="ordinary") ||
    (a.kind === "logistics" && (a.mode === "lift" || a.mode === "redistribute"&&a.method === "power")) ||
    (a.kind === "hunting" && a.mode === "survey") ||
    a.kind === "care-power" ||
    (a.kind === "care" && a.method === "este") ||
    ((a.kind === "repair" || a.kind === "reroute-convoy") &&
      a.method === "power") ||
    [
      "recover",
      "call",
      "cast",
      "surrender",
      "infrastructure-power",
      "prepare-supply",
      "eyrie-relay",
      "crossing",
      "movement-power",
      "intelligence-power",
      "advance-crop",
      "worksite-support",
      "surge-passage",
      "coastal-landing",
      "current-crossing",
      "fit-guard",
      "temper-armor",
      "brace-breach",
      "read-fault",
      "prepare-starwatch",
      "inspect-trace",
      "naval-power",
      "tactical-power",
      "charge-power",
      "scout-power",
      "habitat-power",
      "formation-power",
      "forest-power", "prepare-dream", "council-settle", "remember-workshop",
    ].includes(a.kind) ||
    ("unit" in a &&
      a.unit === p.hero.id &&
      ["move", "attack", "capture", "rescue"].includes(a.kind));
  if (
    heroAction &&
    Object.values(s.recoveries).some((q) => q.unit === p.hero.id)
  )
    return "Hero is resting; cancel care before another commitment";
  if (
    heroAction &&
    isAboard(s, p.hero.id) &&
    !(
      a.kind === "coastal-landing" || a.kind === "naval-power" &&
      p.profile === "elf_falmari" &&
      a.power === "field"
    )
  )
    return "Hero is aboard a vessel; land before a separate commitment";
  if(heroAction&&portableBusy(s,p.hero.id))return 'Hero carries a portable workshop';
  if (heroAction && grappleOccupiesHero(s, p.hero.id))
    return "Hero is maintaining a grapple; cancel it before another action";
  if (heroAction && a.kind !== "logistics" && logisticsUnitBusy(s, p.hero.id))
    return "Hero is carrying a physical rescue";
  if (
    a.kind === "movement-power" &&
    a.members.some((m) => logisticsUnitBusy(s, m.unit))
  )
    return "Formation is reserved by physical logistics";
  if(heroAction&&serviceBusy(p.hero.id))return 'Hero is committed to funded equipment logistics';
  if(heroAction&&formationBusy(s,p.hero.id))return "Hero directs an explicit formation plan";
  if(heroAction&&habitatWorkerBusy(s,p.hero.id))return "Hero occupies a construction or trail role";
  if(heroAction&&huntingBusy(s,p.hero.id))return "Hero is surveying a habitat";
  if(heroAction&&isChargeMember(s,p.hero.id))return "Hero directs a pending charge";
  if (tactical(p, a) && p.tacticalUsed)
    return "One local hero action per tactical phase";
  if (heroAction && p.commitment < 1 && !(tactical(p, a) && p.encounter))
    return "Hero commitment already spent";
  if (
    !heroAction && equipmentOperations(a)>0 &&
    ![
      "produce",
      "cancel",
      "perk",
      "equip",
      "land",
      "evacuate-worksite",
    ].includes(a.kind) &&
    p.operations < 1
  )
    return "No strategic operations remain";
  if(a.kind==='deploy-device')return finalDeviceReason(s,seat,a.unit,a.item,a.at);
  if(a.kind==='assign-mining-engine'){
    const u=s.units[a.unit],f=a.facility?s.facilities[a.facility]:undefined;if(!u||u.owner!==seat||!u.alive||!u.active||!extendedCapabilities(s,u)?.miningWork)return 'Own active mining engine required';
    if(a.facility===null)return u.mineWork?'':'Engine has no mining assignment';
    if(u.mineWork)return 'Release the existing mining assignment first';
    const busy=actionReason(s,seat,{kind:'move',unit:u.id,x:u.x,y:u.y});if(busy)return busy;
    if(!u.supplied||activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind))||!f||f.owner!==seat||f.kind!=='mine'||f.hp<=0||distance(u,f)>1)return 'Supplied engine beside an owned mine required';
    return Object.values(s.units).some(v=>v.mineWork===f.id)?'One mechanical worker per mine':'';
  }
  if(a.kind==="lay-false-trail"){const u=s.units[a.unit];if(!u)return "Existing actor required";return actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y})||falseTrailReason(s,seat,a.unit);}
  if(a.kind==="carry-heavy"){const u=s.units[a.carrier];if(!u)return "Existing carrier required";return actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y})||heavyCarryReason(s,seat,a.item,a.carrier);}
  if(a.kind==="drop-heavy")return heavyDropReason(s,seat,a.item);
  if(a.kind==="capture-agent"||a.kind==="free-agent"){const u=s.units[a.unit];if(!u)return "Existing actor required";const busy=actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y});return busy||(a.kind==="capture-agent"?captureAgentReason(s,seat,a.unit,a.target):freeAgentReason(s,seat,a.unit,a.capture));}
  if(a.kind==="survey-beacon-link")return beaconSurveyReason(s,seat,a.origin,a.destination,a.trace);
  if(a.kind==="signal-beacon")return beaconSignalReason(s,seat,a);
  if(a.kind==="logging"){const u=s.units[a.worker];if(!u)return "Existing worker required";const busy=actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y});return busy||loggingReason(s,seat,a.worker,a.vegetation,a.facility);}
  if(a.kind==="agree-reward")return agreeWarbandRewardReason(s,seat,a.unit,a.reward,a.due);
  if(a.kind==="pay-reward")return payWarbandRewardReason(s,seat,a.unit,a.facility);
  if(a.kind==="inspect-local")return localKnowledgeReason(s,seat,a.point,{visible:at=>visible(s,seat,at),connected:(a,b)=>Boolean(path(s,a,b))});
  if(a.kind==="inspect-worksite")return inspectWorksiteReason(s,seat,a.facility);
  if(a.kind==="evacuate-care")return careEvacuationReason(s,seat,a,civilianChecks(s));
  if(a.kind==='pack-rations')return reserveReason(s,seat,a.unit,a.facility,a.amount);
  if(a.kind==='reload-siege')return siegeReloadReason(s,seat,a.unit,a.facility);
  if(a.kind==='portable')return portableReason(s,seat,a,civilianChecks(s));
  if(a.kind==='preserve-plan')return preserveReason(s,seat,a.archive,a.recipe);
  if(a.kind==='remember-workshop')return rememberReason(s,seat,a.plan,a.facility,(x,y)=>Boolean(path(s,x,y)));
  if(a.kind==='recover-plan'||a.kind==='destroy-plan')return planRecoveryReason(s,seat,a.plan,a.unit,a.kind==='destroy-plan');
  if(a.kind==='council-settle')return councilReason(s,seat,a.grievance,councilChecks(s));
  if(a.kind==='council-deliver'||a.kind==='council-recover'){
   const u=s.units[a.carrier];if(!u)return 'Existing courier required';
   const busy=actionReason(s,seat,{kind:'move',unit:u.id,x:u.x,y:u.y});if(busy)return busy;
   return a.kind==='council-deliver'?deliveryReason(s,seat,a.grievance,a.carrier,a.origin,a.destination,a.route,councilChecks(s)):restitutionRecoveryReason(s,seat,a.restitution,a.carrier,a.route,councilChecks(s));
  }
  if(a.kind==="prepare-dream")return dreamReason(s,seat,a.unit,a.facility,dreamChecks(s));
  if(a.kind==="forest-power")return forestReason(s,seat,a,(x,y)=>Boolean(path(s,x,y,false,s.units[p.hero.id])));
  if(a.kind==="forest-entrance")return entranceReason(s,seat,a.facility);
  if(a.kind==="harass-convoy")return harassmentReason(s,seat,a.unit,a.target);
  if(a.kind==="inspect-forest")return inspectForestReason(s,seat,a.unit,a.point);
  if(a.kind==='tool-service'||a.kind==='mounts'||a.kind==='watch-gear'){if(p.operations<equipmentOperations(a))return 'Normal physical transfer operation required';return equipmentReason(s,seat,a);}
  if(a.kind==="civilian"){if(p.operations<1)return "Civilian orders need one ordinary operation";return civilianReason(s,seat,a,civilianChecks(s));}
  if(a.kind==="night"){if(p.operations<nightOperations(a))return "Insufficient ordinary operations for night assignment";return nightOrderReason(s,seat,a);}
  if (a.kind === "care")
    return careReason(s, seat, a, (x, y) => Boolean(path(s, x, y)));
  if (a.kind === "infrastructure-power")
    return infrastructurePowerReason(s, seat, a.job, (state, x, y, u) =>
      path(state, x, y, u?.flying ?? false, u),
    );
  if (a.kind === "tactical-alarm")
    return tacticalAlarmReason(s, seat, a.unit, a.target);
  if (a.kind === "declare-tactical") {
    const id = a.order.unit;
    if (
      isAboard(s, id) ||
      isNavalCrew(s, id) ||
      hullCrew(s, id) ||
      isCrossingCrew(s, id) ||
      isIntelligenceCourier(s, id) ||
      Object.values(s.recoveries).some((q) => q.unit === id) ||
      Object.values(s.convoys).some(
        (c) => c.carrier === id && c.phase !== "lost",
      ) ||
      Object.values(s.movementPlans).some((q) =>
        q.members.some((m) => m.unit === id && !m.complete),
      )
    )
      return "Party is committed to another assignment";
    return tacticalOrderReason(s, seat, a.order, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
  }
  if (a.kind === "tactical-power")
    return tacticalPowerReason(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
  if (a.kind === "naval-power")
    return navalPowerReason(
      s,
      seat,
      a,
      (pos) => visible(s, seat, pos),
      (x, y) => connectedCoastal(s, x, y, (a, b) => Boolean(path(s, a, b))),
    );
  if (a.kind === "inspect-trace") return inspectTraceReason(s, seat, a);
  if (a.kind === "prepare-starwatch")
    return starwatchReason(s, seat, a.survey, (x, y) => Boolean(path(s, x, y)));
  if(a.kind==="surge-passage")return surgeReason(s,seat,a.unit,a.tile,pos=>visible(s,seat,pos));
  if(a.kind==="coastal-landing")return landingReason(s,seat,a.ship,a.unit,a.tile,pos=>Object.values(s.units).some(u=>u.alive&&u.active&&u.attack>0&&effectiveRelation(s,seat,u.owner)==="war"&&distance(u,pos)<=1));
  if(a.kind==="current-crossing"){
    const reason=currentReason(s,seat,a.convoy,a.tiles,pos=>terrainObserved(s,seat,pos),pos=>Object.values(s.units).some(u=>u.alive&&u.active&&u.attack>0&&effectiveRelation(s,seat,u.owner)==="war"&&distance(u,pos)<=1));if(reason)return reason;
    const c=s.convoys[a.convoy],u=s.units[c.carrier],end=a.tiles.at(-1)!;
    if(a.tiles.length-1>Math.min(Math.max(1,u.move-movementPenalty(s,u)-fatigueMovementPenalty(s,u)),...activeEffects(s,u).filter(e=>e.kind==="move-limit").map(e=>e.value)))return "Whole crossing must fit normal remaining weekly movement";
    if(c.lastProgress>=s.turn)return "Convoy already spent this week's movement";
    if(!path(s,end,s.facilities[c.destination],u.flying,u))return "Surveyed far bank must connect to existing convoy destination";
    return "";
  }
  if(a.kind==="make-protection-kit")return protectionKitReason(s,seat,a.unit,a.facility,a.hazard);
  if(a.kind==="fit-guard")return fitGuardReason(s,seat,a.unit,a.hazard);
  if(a.kind==="temper-armor")return temperReason(s,seat,a.unit,a.facility,a.hazard,(x,y)=>Boolean(path(s,x,y,false,s.units[p.hero.id])));
  if(a.kind === "fieldwork") {
    if(!factionBuilding(p.profile,a.form))return "This faction lacks the structural recipe";
    const plots=Object.values(s.facilities).filter(f=>f.owner===seat&&f.hp>0&&!["core","hold"].includes(f.kind)).length+fieldworkPlotReservations(s,seat);
    if(plots>=limits(p.profile).plots)return "Support plots full";
    return fieldworkReason(s,seat,{worker:a.worker,facility:a.facility,kind:a.form,material:a.material,x:a.x,y:a.y},(x,y,u)=>Boolean(path(s,x,y,false,u)));
  }
  if(a.kind === "load-repair-kit")return repairKitReason(s,seat,a.unit,a.facility,a.material);
  if(a.kind === "brace-breach")return braceBreachReason(s,seat,a.unit,a.target);
  if(a.kind === "read-fault")return faultReason(s,seat,a.target,p=>visible(s,seat,p));
  if (a.kind === "worksite-support")
    return worksiteSupportReason(s, seat, a, worksiteChecks(s));
  if (a.kind === "evacuate-worksite")
    return evacuationReason(s, seat, a.id, worksiteChecks(s));
  if (a.kind === "plant-crop")
    return plantingReason(s, seat, a.plot, a.irrigation);
  if (a.kind === "advance-crop")
    return cropPowerReason(s, seat, a.crop, (x, y) => Boolean(path(s, x, y)));
  if (a.kind === "care-power")
    return carePowerReason(s, seat, a, (x, y) => Boolean(path(s, x, y)));
  if (a.kind === "intelligence-power")
    return intelligenceReason(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
  if (a.kind === "recover-cargo")
    return recoverCargoReason(s, seat, a.convoy, a.carrier, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
  if(a.kind==="logistics"&&a.mode==="rescue-flight"){for(const id of [a.carrier,a.unit]){const u=s.units[id];if(!u)return "Existing carrier and passenger required";const busy=actionReason(s,u.owner,{kind:"move",unit:id,x:u.x,y:u.y});if(busy)return busy;}return logisticsReason(s,seat,a,(state,x,y,u)=>path(state,x,y,u?.flying??false,u));}
  if (a.kind === "logistics")
    return logisticsReason(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u?.flying ?? false, u),
    );
  if (a.kind === "prepare-supply")
    return prepareSupplyReason(
      s,
      seat,
      a,
      (state, x, y, u) => path(state, x, y, u.flying, u),
      (pos) => visible(s, seat, pos),
    );
  if (a.kind === "eyrie-relay")
    return eyrieRelayReason(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
  if (a.kind === "reroute-convoy")
    return rerouteConvoyReason(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
  if (a.kind === "clear-zone") {
    const u = s.units[a.unit],
      z = s.zones[a.zone];
    return u && z && visible(s, seat, z)
      ? clearableZone(s, seat, u, z)
      : "Choose an observed obstacle and owned company";
  }
  if((a.kind==="attack-ship"||a.kind==="break-crossing")&&s.units[a.unit]?.siege){const reason=siegeAttackReason(s,s.units[a.unit]);if(reason)return reason;}
  if (a.kind === "attack-ship") {
    const u = s.units[a.unit],
      v = s.vessels[a.ship] ?? s.vesselContacts?.find((v) => v.id === a.ship);
    if (
      !u?.alive ||
      !u.active ||
      u.owner !== seat ||
      u.attack < 1 ||
      !v ||
      v.hp <= 0 ||
      !visible(s, seat, v)
    )
      return "Owned armed formation and observed surviving vessel required";
    if (effectiveRelation(s, seat, v.owner) !== "war")
      return "Cannot attack own or peaceful vessel";
    if (!sightline(s, u, v)) return "Solid cover blocks the attack line";
    return distance(u, v) <= (militaryCapabilities(s,u)?.rangedRange??2) ? "" : "Vessel beyond ordinary attack range";
  }
  if (a.kind === "repair")
    return repairReason(s, seat, a, (x, y) => Boolean(path(s, x, y)));
  if (a.kind === "rest") return restReason(s, seat, a.unit, a.facility);
  if (a.kind === "crossing")
    return crossingReason(
      s,
      seat,
      a,
      (x, y) => Boolean(path(s, x, y)),
      (pos) => visible(s, seat, pos),
    );
  if (a.kind === "break-crossing") {
    const u = s.units[a.unit],
      c = s.crossings[a.crossing];
    if (
      !u?.alive ||
      !u.active ||
      u.owner !== seat ||
      u.attack < 1 ||
      !c ||
      c.hp <= 0
    )
      return "Owned armed formation and existing crossing required";
    if (effectiveRelation(s, seat, c.owner) !== "war")
      return "Cannot break own or peaceful crossing";
    return c.tiles.some((pos) => distance(u, pos) <= 1 && visible(s, seat, pos))
      ? ""
      : "Reach an observed crossing segment";
  }
  if (a.kind === "movement-power") {
    if (
      Object.values(s.movementPlans).some(
        (plan) => plan.owner === seat && plan.until > s.revision,
      )
    )
      return "Resolve the existing movement plan first";
    if (p.hero.readiness < (p.profile === "melkor_dark_architect" ? 3 : 2))
      return "Insufficient readiness";
    if (
      a.members.some(
        (m) =>
          isAboard(s, m.unit) ||
          isNavalCrew(s, m.unit) ||
          hullCrew(s, m.unit) ||
          isCrossingCrew(s, m.unit) ||
          Object.values(s.convoys).some(
            (c) => c.carrier === m.unit && c.phase !== "lost",
          ),
      )
    )
      return "A selected formation is committed to other work";
    const reason = validateMovementPower(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
    if (reason) return reason;
    const operations = movementPowerOperations(s, seat, a);
    return p.operations < operations
      ? `Complete movement plan needs ${operations} ordinary operations; only ${p.operations} remain`
      : "";
  }
  if(a.kind==="formation-power"){if(p.operations<formationOperations(a))return "Every normal movement must fit the remaining three-operation budget";for(const m of a.members){const u=s.units[m.unit];if(!u)return "Unknown formation participant";const busy=actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y});if(busy)return busy;}return formationReason(s,seat,a,(state,x,y,u)=>path(state,x,y,u.flying,u));}
  if(a.kind==="post-garrison"){const u=s.units[a.unit];if(!u)return "Unknown company";const busy=actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y});return busy||postReason(s,seat,a.unit,a.post,a.survey);}
  if(a.kind==="release-post")return s.garrisonPosts[a.unit]?.owner===seat?"":"Owned garrison assignment required";
  if(a.kind==="habitat-power"){if(a.mode==="old-trail"){if(p.operations<1)return "One normal worker project operation required";const u=s.units[a.worker];if(!u)return "Unknown worker";const busy=actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y});if(busy)return busy;}return habitatReason(s,seat,a,(x,y,u)=>Boolean(path(s,x,y,false,u)));}
  if(a.kind==="assign-lifter"||a.kind==="block-trail"){const u=s.units[a.unit];if(!u)return "Unknown party";const busy=actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y});if(busy)return busy;return a.kind==="assign-lifter"?lifterReason(s,seat,a.job,a.unit):blockTrailReason(s,seat,a.unit,a.trail);}
  if(a.kind==="scout-power")return scoutPowerReason(s,seat,a);
  if(a.kind==="examine-contact"){const u=s.units[a.unit];if(!u)return "Unknown examiner";const busy=actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y});return busy||examineShadowReason(s,seat,a.unit,a.point);}
  if(a.kind==="hunting"){const u=s.units[a.unit];if(!u)return "Unknown hunter";const busy=actionReason(s,seat,{kind:"move",unit:u.id,x:u.x,y:u.y});return busy||huntingReason(s,seat,a,(state,x,y,u)=>path(state,x,y,u.flying,u));}
  if(a.kind==="charge-power"){if(p.operations<chargeOperationCost(a))return "Insufficient ordinary operations for every charge participant";for(const m of a.members){const u=s.units[m.unit];if(!u)return "Unknown charge participant";const busy=actionReason(s,seat,{kind:"move",unit:m.unit,x:u.x,y:u.y});if(busy)return busy;}return chargeReason(s,seat,a,(state,x,y,u)=>path(state,x,y,u.flying,u));}
  if (a.kind === "produce") {
    const f = s.facilities[a.facility],
      r = recipe(p.profile, a.recipe);
    if (!f || f.owner !== seat || f.hp <= 0)
      return "Owned working facility required";
    if (!r) return "Unknown or faction-unavailable recipe";
    if(a.recipe==="equipment"&&!planAllowsProduction(s,f,(x,y)=>Boolean(path(s,x,y))))return "Unlocked equipment plan and staffed archive or current Remembered Workshop commitment required";
    if (a.recipe === "sentinel") {
      if (
        p.hero.status !== "living" ||
        p.commitment < 1 ||
        p.hero.readiness < 3
      )
        return "Living Saruman, one personal commitment and 3 readiness required";
      if (!path(s, s.units[p.hero.id], f))
        return "Reachable staffed Orthanc Workshop required";
      if (
        Object.values(s.units).some(
          (u) =>
            u.owner === seat &&
            u.alive &&
            u.effects.some((e) => e.kind === "sentinel"),
        ) ||
        Object.values(s.facilities).some(
          (f) => f.owner === seat && f.job?.recipe === "sentinel",
        )
      )
        return "One living or pending Resonant Sentinel maximum";
    }
    if (
      f.job ||
      f.repair ||
      f.rest ||
      Object.values(s.infrastructureWork).some((j) => j.facility === f.id)
    )
      return "Facility queue occupied";
    if (r.kind === "vessel" && (!freeWorker(s, seat, f) || !launchTile(s, f)))
      return "A free supplied crew and unoccupied adjacent water launch tile are required";
    if (f.kind !== r.facility && !(p.profile==="elf_avari"&&f.kind==="portable-workshop"&&r.kind==="item"&&a.recipe==="equipment")) return `Requires ${r.facility} facility`;
    if (f.workers < 1) return "Staff required";
    if (!afford(p, r.cost)) return "Insufficient P / M / K / E";
    if (r.access.some((x) => !p.sources.includes(x)))
      return `Missing source access: ${r.access.join(", ")}`;
    if (a.recipe === "hero" && !["uncreated", "dead"].includes(p.hero.status))
      return "Hero slot occupied (living, captive or pending)";
    if (a.recipe === "hero" && p.component < 1)
      return "A new signature component is required";
    if (
      Object.values(s.facilities).filter(
        (f) =>
          f.owner === seat &&
          f.job && !tunnelProductionPenalty(s,f.id) &&
          f.job.recipe !== "hero" &&
          f.job.recipe !== "component" &&
          f.job.recipe !== "synthesis",
      ).length + Object.values(s.portableWorkshops).filter(j=>j.owner===seat&&j.phase!=="arrived"&&j.workshop?.job).length >= limits(p.profile).queues &&
      !["hero", "component", "synthesis"].includes(a.recipe)
    )
      return "Ordinary queue limit reached";
    if (
      ["drake", "dragon", "winged-dragon", "balrog", "brood"].includes(
        a.recipe,
      ) &&
      p.profile !== "melkor_dark_architect"
    )
      return "Only Dark Architect can create new Dragons and Balrogs";
    if (
      a.recipe === "brute" &&
      !p.profile.startsWith("melkor") &&
      p.profile !== "orc_fortress_clan"
    )
      return "Faction lacks this recipe";
    if (
      (a.recipe === "dragon" && f.tier < 2) ||
      (a.recipe === "balrog" && f.tier < 2) ||
      (a.recipe === "winged-dragon" && f.tier < 3)
    )
      return "Facility tier too low";
    if (r.kind === "research" && p.research.includes(a.recipe))
      return "Already researched";
    if (
      r.kind === "research" &&
      Object.values(s.facilities).some(
        (f) => f.owner === seat && f.job?.recipe === a.recipe,
      )
    )
      return "Research already queued";
    const c = capacity(s, seat);
    if (
      c.supply + r.supply > c.supplyMax ||
      c.great + r.great > c.greatMax ||
      c.binding + r.binding > c.bindingMax
    )
      return "Supply / binding / great-creature capacity unavailable";
    if (
      r.great &&
      Object.values(s.units).some(
        (u) => u.owner === seat && u.alive && !u.supplied,
      )
    )
      return "Unpaid upkeep stalls creature production";
    return "";
  }
  if (a.kind === "cancel")
    return s.facilities[a.facility]?.owner === seat &&
      (s.facilities[a.facility].job ||
        s.facilities[a.facility].repair ||
        s.facilities[a.facility].rest)
      ? ""
      : "No owned pending job";
  if (a.kind === "build") {
    if(fieldworkKinds.includes(a.building as never))return "Use the paid staffed fieldwork queue";
    if(a.building==="relay-stable"&&!civilianProfiles.includes(p.profile))return "This habitat has no civilian relay stable recipe";
    const b = factionBuilding(p.profile, a.building);
    if (!b) return "Building unavailable to this faction";
    if (b.access.some((x) => !p.sources.includes(x)))
      return `Missing facility source access: ${b.access.join(", ")}`;
    if (!afford(p, b.cost)) return "Insufficient building stocks";
    const fs = Object.values(s.facilities).filter(
      (f) => f.owner === seat && f.hp > 0,
    );
    if (
      ["hold", "core"].includes(a.building) &&
      fs.filter((f) => f.kind === "core" || f.kind === "hold").length >=
        limits(p.profile).cities
    )
      return "Faction city limit reached";
    if (
      !["hold", "core"].includes(a.building) &&
      fs.filter((f) => !["core", "hold"].includes(f.kind)).length + Object.values(s.portableWorkshops).filter(j=>j.owner===seat&&j.phase!=="arrived").length + fieldworkPlotReservations(s,seat) >=
        limits(p.profile).plots
    )
      return "Support plots full";
    if (
      ["vault", "sky-vault", "crucible", "spire"].includes(a.building) &&
      p.profile !== "melkor_dark_architect"
    )
      return "Dark Architect industry only";
    if (
      !Object.values(s.units).some(
        (u) =>
          u.owner === seat &&
          u.alive &&
          u.kind === "worker" &&
          distance(u, a) <= 3,
      )
    )
      return "Owned worker within 3 tiles required";
    if (!path(s, a, a)) return "Outside map";
    if(Object.values(s.fieldworkJobs).some(q=>q.status==="working"&&distance(q,a)===0))return "Paid fieldwork occupies this construction site";
    if (
      Object.values(s.facilities).some((f) => f.hp > 0 && distance(f, a) === 0)
    )
      return "Plot occupied";
    return "";
  }
  if (a.kind === "move") {
    if (!owned(s, seat, a.unit)) return "Owned living active unit required";
    const u = s.units[a.unit];
    if (u.kind === "hero" && p.hero.status !== "living")
      return "Hero unavailable";
    const route = path(s, u, a, u.flying, u);
    if (!route) return "No traversable route";
    const moveLimit = Math.min(
      Math.max(
        1,
        u.move - movementPenalty(s, u) - fatigueMovementPenalty(s, u),
      ),
      ...activeEffects(s, u)
        .filter((e) => e.kind === "move-limit")
        .map((e) => e.value),
    );
    if (
      route.length -
        1 +
        woodlandMovementCost(s, u, route) +
        movementZonePenalty(s, u, route) >
      moveLimit
    )
      return `Movement exceeds ${u.move} tiles`;
    if (activeEffects(s, u).some((e) => e.kind === "root"))
      return "Rooted: wait or remove roots";
    return "";
  }
  if (a.kind === "attack" || a.kind === "capture") {
    if(s.units[a.unit]&&activeEffects(s,s.units[a.unit]).some(e=>e.kind==="facing-unready"))return "Formation is recovering its facing after withdrawal";
    if (!owned(s, seat, a.unit)) return "Owned attacker required";
    const u = s.units[a.unit],
      t = entityAt(s, a.target);
    if(u.siege){if(a.kind==='capture')return "Siege engines cannot take captives";const reason=siegeAttackReason(s,u);if(reason)return reason;}
    if (!t || !visible(s, seat, t)) return "Choose an observed target";
    if (t.owner === seat || effectiveRelation(s, seat, t.owner) !== "war")
      return "Cannot attack own or peaceful target";
    if (distance(u, t) > (militaryCapabilities(s,u)?.rangedRange??2)) return "Target beyond ordinary weapon range";
    if (!sightline(s, u, t)) return "Solid cover blocks the attack line";
    if (("alive" in t && !t.alive) || t.hp <= 0) return "Target already lost";
    if (
      a.kind === "capture" &&
      (!("kind" in t) || t.kind !== "hero" || t.hp > t.maxHp / 3)
    )
      return "Capture requires a weakened living hero";
    return "";
  }
  if (a.kind === "recover")
    return p.hero.status === "living" && !p.encounter
      ? ""
      : "Recovery is a separate weekly commitment, outside battle";
  if (a.kind === "exchange")
    return p.stock.P >= 20 && p.stock.M >= 10
      ? ""
      : "Exchange requires 20P + 10M for 10K";
  if (a.kind === "surrender")
    return p.hero.status === "captive"
      ? ""
      : "Only a captive can surrender incarnation";
  if (a.kind === "call") {
    if (!p.profile.startsWith("melkor"))
      return "Only Melkor commands Dragons and Balrogs";
    if (p.hero.status !== "living") return "Living Melkor embodiment required";
    if (p.hero.readiness < 3 || !afford(p, stocks(20, 20, 0, 10)))
      return "Call requires 3 readiness + 20P + 20M + 10E";
    const u = s.units[a.unit];
    if (!u || !u.alive || u.active || !exclusive(u) || !visible(s, seat, u))
      return "Discovered existing living uncalled creature required";
    const h = s.units[p.hero.id];
    if (!path(s, u, h, u.flying)) return "Known traversable route required";
    const c = capacity(s, seat);
    if (c.supply + u.supply > c.supplyMax || c.great + u.great > c.greatMax)
      return "Full supply and creature points required";
    if (
      Object.values(s.units).some(
        (u) => u.owner === seat && u.alive && !u.supplied,
      )
    )
      return "Unpaid upkeep prevents activation";
    return "";
  }
  if (a.kind === "cast") {
    const pointCast = a.x !== undefined || a.y !== undefined;
    if (
      pointCast &&
      (a.x === undefined ||
        a.y === undefined ||
        a.power !== "field" ||
        !zonePowerProfiles.has(p.profile))
    )
      return "Only terrain-zone powers accept a complete map position";
    const anchor = pointCast ? { x: a.x!, y: a.y! } : undefined;
    const unavailable = abilityAvailability(s, seat, a.power, a.target, anchor);
    if (unavailable) return unavailable;
    if (p.hero.status !== "living") return "Living hero required";
    const q = powerCost(p, a.power);
    if (p.hero.readiness < q.readiness || !afford(p, q.cost))
      return "Insufficient readiness or spell stocks";
    if (p.profile === "melkor_worldbreaker" && a.power === "support")
      return "Use Call existing creature";
    const t = anchor ?? entityAt(s, a.target);
    if (!t || !visible(s, seat, t)) return "Choose observed target";
    const h = s.units[p.hero.id];
    const max = Number(q.source.range.match(/(\d+) metres/)?.[1] ?? 32) / 3;
    if (distance(h, t) > max) return "Outside ability reach";
    // Explicit ability targeting separates physical/observational counterplay
    // from ownership and command effects; prose matching must not grant immunity.
    return "";
  }
  if (a.kind === "diplomacy")
    return s.players[a.target] && a.target !== seat
      ? ""
      : "Choose another faction";
  if (a.kind === "trade")
    return s.players[a.target] &&
      a.target !== seat &&
      effectiveRelation(s, seat, a.target) === "alliance" &&
      Number.isSafeInteger(a.amount) &&
      a.amount > 0 &&
      a.amount <= p.stock[a.resource]
      ? ""
      : "Trade needs alliance and a positive affordable amount";
  if (a.kind === "rescue") {
    const t = s.players[a.target];
    return owned(s, seat, a.unit) &&
      t?.hero.status === "captive" &&
      t.seat === seat &&
      distance(s.units[a.unit], s.units[t.hero.id]) <= 2
      ? ""
      : "Reach your captive with a living company";
  }
  if (a.kind === "equip") {
    const u = s.units[a.unit],
      i = s.items[a.item];
    if(i?.extended==='saddle'&&u&&!Object.values(s.mountLots).some(l=>l.unit===u.id&&l.owner===seat))return 'A saddle requires an existing mounted formation';
    if(i?.extended&&u&&!['company','worker','hero'].includes(u.kind))return 'Humanoid equipment requires a fitting ordinary bearer';
    return u &&
      owned(s, seat, u.id) &&
      i &&
      (!i.bearer||(i.bearer===u.id&&i.carried)) &&
      (!heavyLoad(s,u)||i.bearer===u.id) &&
      (!i.owner || i.owner === seat) &&
      // Carried equipment follows its physical bearer; loose-item coordinates
      // record its previous ground position until it is put down.
      distance(u, i.bearer ? s.units[i.bearer] : i) <= 1
      ? ""
      : "Reach an available owned or dropped item";
  }
  if (a.kind === "annex") {
    const f = s.facilities[a.facility];
    if (
      p.profile === "melkor_worldbreaker" ||
      profile(p.profile).category === "Valar"
    )
      return "Sanctuaries accept tribute or independent enclaves, not productive annexation";
    if (
      !f ||
      f.hp <= 0 ||
      f.owner === seat ||
      effectiveRelation(s, seat, f.owner) !== "war"
    )
      return "Annexation requires a surviving hostile facility";
    const fs = Object.values(s.facilities).filter(
      (x) => x.owner === seat && x.hp > 0,
    );
    if (
      f.kind === "hold" &&
      fs.filter((x) => ["hold", "core"].includes(x.kind)).length >=
        limits(p.profile).cities
    )
      return "City capacity full";
    if (
      f.kind !== "hold" &&
      fs.filter((x) => !["hold", "core"].includes(x.kind)).length + fieldworkPlotReservations(s,seat) >=
        limits(p.profile).plots
    )
      return "Support plot capacity full";
    if (
      !f ||
      !owned(s, seat, a.unit) ||
      distance(f, s.units[a.unit]) > 1 ||
      f.hp > f.maxHp / 3
    )
      return "Reach a weakened settlement";
    if (f.kind === "core")
      return "Hero core never transfers; destroy and rebuild within city limits";
    if (
      ["vault", "sky-vault", "crucible"].includes(f.kind) &&
      p.profile !== "melkor_dark_architect"
    )
      return "Creature industry cannot transfer";
    return "";
  }
  if (a.kind === "perk")
    return p.hero.level > p.hero.perks.length &&
      !p.hero.perks.includes(a.branch)
      ? ""
      : "No unspent level or branch already chosen";
  if (a.kind === "land")
    return owned(s, seat, a.unit) && s.units[a.unit].flying
      ? ""
      : "Owned flying unit required";
  return "Unsupported action";
}
function spendBudget(s: Match, seat: string, a: Action) {
  const p = s.players[seat];
  if(a.kind==='tool-service'||a.kind==='mounts'||a.kind==='watch-gear'){p.operations-=equipmentOperations(a);if(equipmentPower(a))p.commitment--;return;}
  if(a.kind==="night"){p.operations-=nightOperations(a);if(nightPower(a))p.commitment--;return;}
  if(a.kind==="civilian"){p.operations--;if("method" in a&&a.method!=="ordinary")p.commitment--;return;}
  if (tactical(p, a)) {
    if (!p.encounter) {
      p.commitment--;
      p.encounter = true;
    }
    p.tacticalUsed = true;
    return;
  }
  if (
    (a.kind === "logistics" &&
      a.mode === "redistribute" &&
      a.method === "power") ||
    (a.kind === "hunting" && a.mode === "survey") ||
    a.kind === "care-power" ||
    (a.kind === "care" && a.method === "este") ||
    ((a.kind === "repair" || a.kind === "reroute-convoy") &&
      a.method === "power") ||
    [
      "recover",
      "call",
      "cast",
      "surrender",
      "infrastructure-power",
      "prepare-supply",
      "eyrie-relay",
      "crossing",
      "movement-power",
      "intelligence-power",
      "advance-crop",
      "worksite-support",
      "surge-passage",
      "coastal-landing",
      "current-crossing",
      "fit-guard",
      "temper-armor",
      "brace-breach",
      "read-fault",
      "prepare-starwatch",
      "inspect-trace",
      "naval-power",
      "tactical-power",
      "charge-power",
      "scout-power",
      "habitat-power",
      "formation-power",
      "forest-power", "prepare-dream", "council-settle", "remember-workshop",
    ].includes(a.kind) ||
    ("unit" in a &&
      a.unit === p.hero.id &&
      ["move", "attack", "capture", "rescue"].includes(a.kind))
  )
    p.commitment--;
  else if (
    ![
      "produce",
      "cancel",
      "perk",
      "equip",
      "land",
      "ready",
      "evacuate-worksite",
    ].includes(a.kind)
  )
    p.operations--;
}
export function kill(s: Match, id: string) {
  dropPlans(s,id);
  if(s.units[id]){delete s.units[id].reserveProvisions;delete s.units[id].mineWork;}
  const u = s.units[id];
  if (!u || !u.alive) return;
  u.alive = false;
  u.active = false;
  u.hp = 0;
  for (const item of u.inventory) {
    const i = s.items[item];
    if (i) {
      i.bearer = null;
      delete i.carried;
      i.owner = null;
      i.x = u.x;
      i.y = u.y;
    }
  }
  u.inventory = [];
  if (u.kind === "hero") {
    const p = s.players[u.owner];
    p.hero.status = "dead";
    p.hero.equipment = [];
    delete p.hero.captor;
  }
  event(s, `${u.name} has fallen. Equipment drops once.`, [u.owner]);
}
function damage(
  s: Match,
  target: string,
  amount: number,
  ability = false,
  reductionPercent = 0,
  attacker?: Unit,
) {
  const t = entityAt(s, target);
  if (!t || t.hp <= 0) return;
  const armor = "armor" in t ? t.armor : 4;
  let hit = Math.max(1, amount - armor);
  if ("effects" in t) hit = protectedDamage(s, t, hit, ability);
  hit = Math.ceil(hit * (1 - reductionPercent / 100));
  if (ability && (t.kind === "hero" || t.kind === "core") && t.hp === t.maxHp)
    hit = Math.min(hit, t.hp - 1);
  if (hit > 0 && "effects" in t) {
    interruptDream(s,t.id);
    interruptShorePower(s,t.id);
    interruptChargesOnDamage(s,t.id,hit);
    interruptHunting(s,t.id,hit);
    interruptHabitat(s,t.id,hit);
    interruptFormation(s,t.id,hit);
    interruptGrappleOnDamage(s, t.id, hit);
    interruptTreatments(s, t);
    interruptCastOnDamage(s, t, hit, ability);
    if (t.kind === "hero")
      for (const [id, plan] of Object.entries(s.movementPlans))
        if (plan.owner === t.owner) {
          delete s.movementPlans[id];
          event(
            s,
            "Movement preparation interrupted by injury; paid preparation is not refunded.",
            [t.owner],
          );
        }
  }
  if (hit > 0 && "inventory" in t) wearEquipment(s, t, "armor");
  const actualInjury=Math.min(t.hp,hit);
  if(attacker && "alive" in t && actualInjury>0 && visible(s,t.owner,attacker) && visible(s,attacker.owner,t))recordGrievance(s,attacker,t,actualInjury);
  t.hp -= hit;
  if(!ability&&attacker&&"alive" in t)secondaryVenomHit(s,attacker,t,actualInjury);
  if ("alive" in t && hit > 0) recordRecoverableInjury(s, t, hit);
  if (!ability && "alive" in t) afterOrdinaryDamage(s, t, hit);
  if ("alive" in t && hit > 0) damageMorale(s,t,hit,(u,route)=>route.length>1&&route[0].x===u.x&&route[0].y===u.y&&route.slice(1).every((at,i)=>path(s,route[i],at,u.flying,u)?.length===2&&!Object.values(s.units).some(v=>v.id!==u.id&&v.alive&&v.active&&distance(v,at)===0)));
  if (t.hp <= 0) {
    delete s.livingBarriers[target];
    t.hp = 0;
    if ("alive" in t) kill(s, target);
    else {
      if (t.job?.recipe === "hero") s.players[t.owner].hero.status = "dead";
      delete t.job;
      delete t.repair;
      delete t.rest;
    }
  }
}
function weaponDamage(
  s: Match,
  attacker: Unit,
  targetId: string,
  amount: number,
  reductionPercent = 0,
) {
  const target = entityAt(s, targetId);
  if (!target || activeEffects(s,attacker).some(e=>e.kind==="facing-unready")) return;
  if(attacker.siege){if(siegeAttackReason(s,attacker))return;consumeSiegeShot(s,attacker);}
  if (distance(attacker, target) > 1) {
    const penalty = Math.max(
      0,
      rangedZonePenalty(s, attacker, target),
      ...("effects" in target ? activeEffects(s, target) : [])
        .filter(
          (e) =>
            e.kind === "ranged-accuracy-reduction-percent" &&
            s.map.terrain[target.y * s.map.width + target.x] === "woodland",
        )
        .map((e) => e.value),
    );
    if (penalty > 0 && rng(s) < penalty / 100) {
      passiveActivity(s, attacker);
      event(s, `${attacker.name}'s ranged attack misses covered movement.`, [
        attacker.owner,
        target.owner,
      ]);
      return;
    }
  }
  if(!("alive" in target)&&["core","hold","gate","cover","barricade","siege-brace"].includes(target.kind))amount+=(secondaryCapabilities(s,attacker)?.structuralAttackBonus??0)+(militaryCapabilities(s,attacker)?.structuralAttackBonus??0);
  if(!("alive" in target)&&target.kind==='guest-marker')amount+=attacker.inventory.filter(id=>{const i=s.items[id];return i?.military==='ward-breaker-tools'&&i.durability>0&&!i.carried;}).length?2:0;
  amount = passiveOrdinaryHit(s, attacker, target, amount,isOrdinarySiege(s,attacker));
  passiveActivity(s, attacker);
  if (
    !("alive" in target) &&
    ["cover", "barricade", "gate", "siege-brace"].includes(target.kind)
  ) {
    const bonus = activeEffects(s, attacker).find(
      (e) =>
        e.kind === "breach-bonus-percent" &&
        (e.source === `breach:${target.id}` ||
          e.source === "breach:ordinary-obstacle"),
    );
    const fault=fieldworkBreachBonus(s,attacker,target.id);
    if (bonus || fault) {
      amount = Math.ceil(amount * (1 + Math.max(bonus?.value??0,fault) / 100));
      attacker.effects = attacker.effects.filter((e) => e !== bonus);
    }

  }
  wearEquipment(
    s,
    attacker,
    !("alive" in target) &&
      ["cover", "barricade", "gate", "siege-brace"].includes(target.kind)
      ? "breach"
      : "attack",
  );
  damage(s, targetId, amount, false, Math.max(reductionPercent,fieldworkCoverReduction(s,attacker,target),"alive" in target?fittingReduction(s,target.id,distance(attacker,target)>1?"arrows":"impact",Object.values(s.units).some(u=>u.alive&&u.owner===attacker.owner&&u.id!==attacker.id&&distance(u,target)===1&&(u.x-target.x)*(attacker.x-target.x)+(u.y-target.y)*(attacker.y-target.y)<0)):0),attacker);
}
function performOrdinaryAttack(
  s: Match,
  seat: string,
  unit: string,
  target: string,
  reductionPercent = 0,
) {
  const p = s.players[seat],
    u = s.units[unit],
    a = { target };
  forestAttack(s,u.id);
  recordWarbandParticipation(s,u);
  recordObservedAttack(s, u);
  recordWitnessedAttack(s,u);
  const intended = s.units[a.target];
  const companion = intended ? radagastInterceptor(s, intended) : undefined;
  const interceptor =
    companion ??
    (intended && intended.kind !== "hero" && !exclusive(intended)
      ? Object.values(s.units)
          .filter(
            (x) =>
              x.owner === intended.owner &&
              x.id !== intended.id &&
              x.alive &&
              x.active &&
              x.supplied &&
              distance(x, intended) <= 1 &&
              x.effects.some((e) => e.kind === "sentinel") &&
              !x.effects.some(
                (e) =>
                  e.kind === "intercepted" &&
                  e.source === `encounter:${s.turn}`,
              ),
          )
          .sort((a, b) => a.id.localeCompare(b.id))[0]
      : undefined);
  if (interceptor) {
    if (!companion)
      interceptor.effects.push({
        kind: "intercepted",
        value: 1,
        until: 1000000,
        source: `encounter:${s.turn}`,
      });
    event(s, `${interceptor.name} intercepts one ordinary attack.`, [
      u.owner,
      intended.owner,
    ]);
  }
  const intendedHp=entityAt(s,a.target)?.hp??0;
  weaponDamage(
    s,
    u,
    interceptor?.id ?? a.target,
    Math.max(1, u.attack - attackPenalty(s, u) - moraleAttackPenalty(s,u)) + Math.floor(rng(s) * 5),
    reductionPercent,
  );
  const intendedHit=!interceptor&&(entityAt(s,a.target)?.hp??0)<intendedHp;
  const t = s.units[interceptor?.id ?? a.target];

  if (t?.alive && distance(t,u)<=(militaryCapabilities(s,t)?.rangedRange??2) && sightline(s,t,u) && !activeEffects(s,t).some(e=>e.kind==="rout"))
    weaponDamage(
      s,
      t,
      u.id,
      Math.max(1, Math.floor((t.attack - attackPenalty(s, t) - moraleAttackPenalty(s,t)) / 2)),
    );
  if (u.kind === "hero") {
    p.hero.xp++;
    if (p.hero.xp % 3 === 0) p.hero.level++;
  }
  return intendedHit;
}
function apply(s: Match, seat: string, a: Action, preview = false) {
  if(a.kind==='pack-rations'){packRations(s,seat,a.unit,a.facility,a.amount);s.players[seat].operations--;return;}
  if(a.kind==="lay-false-trail"){layFalseTrail(s,seat,a.unit);spendBudget(s,seat,a);return;}
  if(a.kind==="carry-heavy"){carryHeavy(s,seat,a.item,a.carrier);return;}
  if(a.kind==="drop-heavy"){dropHeavy(s,seat,a.item);return;}
  if(a.kind==="capture-agent"){captureAgent(s,seat,a.unit,a.target);spendBudget(s,seat,a);return;}
  if(a.kind==="free-agent"){freeAgent(s,seat,a.unit,a.capture);spendBudget(s,seat,a);return;}
  if(a.kind==="survey-beacon-link"){surveyBeaconLink(s,seat,a.origin,a.destination,a.trace);spendBudget(s,seat,a);return;}
  if(a.kind==="signal-beacon"){startBeaconSignal(s,seat,a);spendBudget(s,seat,a);return;}
  if(a.kind==="logging"){startLogging(s,seat,a.worker,a.vegetation,a.facility);return;}
  if(a.kind==="agree-reward"){agreeWarbandReward(s,seat,a.unit,a.reward,a.due);return;}
  if(a.kind==="pay-reward"){payWarbandReward(s,seat,a.unit,a.facility);return;}
  if(a.kind==="inspect-local"){inspectLocalKnowledge(s,seat,a.point,{visible:at=>visible(s,seat,at),connected:(a,b)=>Boolean(path(s,a,b))});spendBudget(s,seat,a);return;}
  if(a.kind==="inspect-worksite"){inspectWorksite(s,seat,a.facility);spendBudget(s,seat,a);return;}
  if(a.kind==="evacuate-care"){applyCareEvacuation(s,seat,a,civilianChecks(s));spendBudget(s,seat,a);return;}
  if(a.kind==='reload-siege'){reloadSiege(s,seat,a.unit,a.facility);return;}
  if(a.kind==='consent-ledge'){setLedgeConsent(s,seat,a.ledge,a.visitor,a.allow);return;}
  if(a.kind==='survey-landing'){inspectLanding(s,seat,a.destination,at=>visible(s,seat,at),at=>!Object.values(s.units).some(u=>u.alive&&u.active&&visible(s,seat,u)&&distance(u,at)===0));return;}
  if(a.kind==='portable'){applyPortable(s,seat,a,civilianChecks(s));if(a.mode!=='consent')s.players[seat].operations--;if(a.mode==='relocate')s.players[seat].commitment--;return;}
  if(a.kind==='preserve-plan'){preservePlan(s,seat,a.archive,a.recipe);spendBudget(s,seat,a);return;}
  if(a.kind==='remember-workshop'){rememberWorkshop(s,seat,a.plan,a.facility,(x,y)=>Boolean(path(s,x,y)));spendBudget(s,seat,a);return;}
  if(a.kind==='recover-plan'){recoverPlan(s,seat,a.plan,a.unit);spendBudget(s,seat,a);return;}
  if(a.kind==='destroy-plan'){delete s.productionPlans[a.plan];spendBudget(s,seat,a);return;}
  if(a.kind==='council-drop'){s.restitutions[a.restitution].phase='lost';return;}
  if(a.kind==='council-terms'){offerTerms(s,seat,a.grievance,a.payment,a.mediator);return;}
  if(a.kind==='council-consent'){consentTerms(s,seat,a.grievance,a.accept);return;}
  if(a.kind==='council-deliver'){deliverRestitution(s,seat,a.grievance,a.carrier,a.origin,a.destination,a.route,councilChecks(s));spendBudget(s,seat,a);return;}
  if(a.kind==='council-recover'){recoverRestitution(s,seat,a.restitution,a.carrier,a.route,councilChecks(s));spendBudget(s,seat,a);return;}
  if(a.kind==='council-settle'){settleCouncil(s,seat,a.grievance,councilChecks(s));spendBudget(s,seat,a);return;}

  if(a.kind==="consent-veil"){consentVeil(s,seat,a.unit,a.melian,a.accept);return;}
  if(a.kind==="forest-power"){prepareForest(s,seat,a,(x,y)=>Boolean(path(s,x,y,false,s.units[s.players[seat].hero.id])));spendBudget(s,seat,a);return;}
  if(a.kind==="forest-entrance"){assignForestEntrance(s,seat,a.facility);spendBudget(s,seat,a);return;}
  if(a.kind==='deploy-device'){deployFinalDevice(s,seat,a.unit,a.item,a.at);return;}
  if(a.kind==='assign-mining-engine'){if(a.facility===null)delete s.units[a.unit].mineWork;else s.units[a.unit].mineWork=a.facility;spendBudget(s,seat,a);return;}
  if(a.kind==="harass-convoy"){harassConvoy(s,seat,a.unit,a.target);spendBudget(s,seat,a);return;}
  if(a.kind==="inspect-forest"){inspectForestTrail(s,seat,a.unit,a.point);spendBudget(s,seat,a);return;}
  if(a.kind==="release-forest"){releaseForest(s,seat,a.id);return;}

  if(a.kind === "prepare-dream") { prepareDream(s,seat,a.unit,a.facility,a.contingency,dreamChecks(s));s.players[seat].commitment--;return; }
  if(a.kind === "replace-dream") { replaceDream(s,seat,a.plan,a.contingency,a.report,dreamChecks(s));return; }
  if(a.kind==="night"){applyNightOrder(s,seat,a);spendBudget(s,seat,a);return;}
  if(a.kind==="civilian"){applyCivilian(s,seat,a,civilianChecks(s));spendBudget(s,seat,a);return;}
  if(!preview){const unit="unit" in a?a.unit:a.kind==="declare-tactical"?a.order.unit:undefined;if(unit&&s.units[unit])verifiedOrderMorale(s,s.units[unit]);}
  if(a.kind==="formation-power"){prepareFormation(s,seat,a,(state,x,y,u)=>path(state,x,y,u.flying,u));s.players[seat].operations-=formationOperations(a);spendBudget(s,seat,a);return;}
  if(a.kind==="post-garrison"){assignPost(s,seat,a.unit,a.post,a.survey);spendBudget(s,seat,a);return;}
  if(a.kind==="release-post"){delete s.garrisonPosts[a.unit];spendBudget(s,seat,a);return;}
  if(a.kind==="habitat-power"){applyHabitatPower(s,seat,a,(x,y,u)=>Boolean(path(s,x,y,false,u)));if(a.mode==="old-trail")s.players[seat].operations--;spendBudget(s,seat,a);return;}
  if(a.kind==="assign-lifter"){assignLifter(s,seat,a.job,a.unit);spendBudget(s,seat,a);return;}
  if(a.kind==="block-trail"){blockTrail(s,seat,a.unit,a.trail);spendBudget(s,seat,a);return;}
  if(a.kind==="scout-power"){useScoutPower(s,seat,a);spendBudget(s,seat,a);return;}
  if(a.kind==="examine-contact"){examineShadow(s,seat,a.unit,a.point);spendBudget(s,seat,a);return;}
  if(a.kind==="hunting"){prepareHunting(s,seat,a,(state,x,y,u)=>path(state,x,y,u.flying,u));spendBudget(s,seat,a);return;}
  if(a.kind==="charge-power"){prepareCharge(s,seat,a,(state,x,y,u)=>path(state,x,y,u.flying,u));s.players[seat].operations-=chargeOperationCost(a);spendBudget(s,seat,a);return;}
  if (a.kind === "logistics") {
    startLogistics(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u?.flying ?? false, u),
    );
    if(a.mode!=="rescue-flight")spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "infrastructure-work" || a.kind === "infrastructure-power") {
    if (a.kind === "infrastructure-work")
      startInfrastructureWork(s, seat, a, (state, x, y, u) =>
        path(state, x, y, u?.flying ?? false, u),
      );
    else
      applyInfrastructurePower(s, seat, a.job, (state, x, y, u) =>
        path(state, x, y, u?.flying ?? false, u),
      );
    spendBudget(s, seat, a);
    return;
  }
  const p = s.players[seat];
  if (a.kind === "cancel-tactical") {
    for (const [id, q] of Object.entries(s.tacticalOrders))
      if (q.owner === seat && q.unit === a.unit) releaseTacticalOrder(s,id);
    return;
  }
  if (a.kind === "tactical-alarm") {
    raiseTacticalAlarm(s, seat, a.unit, a.target);
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "declare-tactical") {
    declareTacticalOrder(s, seat, a.order, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "tactical-power") {
    applyTacticalPower(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "naval-power") {
    applyNavalPower(
      s,
      seat,
      a,
      (pos) => visible(s, seat, pos),
      (x, y) => connectedCoastal(s, x, y, (a, b) => Boolean(path(s, a, b))),
    );
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "inspect-trace") {
    inspectTrace(s, seat, a);
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "prepare-starwatch") {
    prepareStarwatch(s, seat, a.survey, (x, y) => Boolean(path(s, x, y)));
    spendBudget(s, seat, a);
    return;
  }
  if(a.kind==="surge-passage"){surgePassage(s,seat,a.unit,a.tile,pos=>visible(s,seat,pos));spendBudget(s,seat,a);return;}
  if(a.kind==="coastal-landing"){prepareLanding(s,seat,a.ship,a.unit,a.tile,()=>false);spendBudget(s,seat,a);return;}
  if(a.kind==="current-crossing"){const c=s.convoys[a.convoy],u=s.units[c.carrier];const tail=path(s,a.tiles.at(-1)!,s.facilities[c.destination],u.flying,u)!;authorizeCurrentCrossing(s,seat,c.id,a.tiles,pos=>terrainObserved(s,seat,pos),()=>false);c.route=[...structuredClone(a.tiles),...tail.slice(1)];c.index=0;spendBudget(s,seat,a);return;}
  if(a.kind==='tool-service'||a.kind==='mounts'||a.kind==='watch-gear'){applyEquipmentOrder(s,seat,a);spendBudget(s,seat,a);return;}
  if(a.kind==="make-protection-kit"){makeProtectionKit(s,seat,a.unit,a.facility,a.hazard);spendBudget(s,seat,a);return;}
  if(a.kind==="fit-guard"){fitGuard(s,seat,a.unit,a.hazard);spendBudget(s,seat,a);return;}
  if(a.kind==="temper-armor"){startTemper(s,seat,a.unit,a.facility,a.hazard,(x,y)=>Boolean(path(s,x,y,false,s.units[s.players[seat].hero.id])));spendBudget(s,seat,a);return;}
  if(a.kind === "fieldwork"){startFieldwork(s,seat,{worker:a.worker,facility:a.facility,kind:a.form,material:a.material,x:a.x,y:a.y},(x,y,u)=>Boolean(path(s,x,y,false,u)));spendBudget(s,seat,a);return;}
  if(a.kind === "load-repair-kit"){loadRepairKit(s,seat,a.unit,a.facility,a.material);spendBudget(s,seat,a);return;}
  if(a.kind === "brace-breach"){braceBreach(s,seat,a.unit,a.target);spendBudget(s,seat,a);return;}
  if(a.kind === "read-fault"){markFault(s,seat,a.target,p=>visible(s,seat,p));spendBudget(s,seat,a);return;}
  if (a.kind === "worksite-support") {
    prepareWorksiteSupport(s, seat, a, worksiteChecks(s));
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "evacuate-worksite") {
    evacuateWorksite(s, seat, a.id, worksiteChecks(s));
    return;
  }
  if (a.kind === "plant-crop") {
    plantCrop(s, seat, a.plot, a.irrigation);
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "advance-crop") {
    advanceCrop(s, seat, a.crop, (x, y) => Boolean(path(s, x, y)));
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "cancel-care") {
    for (const [id, q] of Object.entries(s.recoveries))
      if (q.owner === seat && q.unit === a.unit) delete s.recoveries[id];
    return;
  }
  if (a.kind === "care") {
    startCare(s, seat, a, (x, y) => Boolean(path(s, x, y)));
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "care-power") {
    accelerateCare(s, seat, a, (x, y) => Boolean(path(s, x, y)));
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "intelligence-power") {
    startIntelligence(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "crossing") {
    startCrossing(
      s,
      seat,
      a,
      (x, y) => Boolean(path(s, x, y)),
      (pos) => visible(s, seat, pos),
    );
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "movement-power") {
    const plan = prepareMovementPower(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
    s.nextId++;
    s.movementPlans[plan.id] = plan;
    p.hero.readiness -= p.profile === "melkor_dark_architect" ? 3 : 2;
    p.operations -= movementOperationCost(s, plan);
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "eyrie-relay") {
    startEyrieRelay(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "prepare-supply") {
    prepareSupply(
      s,
      seat,
      a,
      (state, x, y, u) => path(state, x, y, u.flying, u),
      (pos) => visible(s, seat, pos),
    );
    spendBudget(s, seat, a);
    return;
  }
  if (a.kind === "reroute-convoy") {
    rerouteConvoy(s, seat, a, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
    spendBudget(s, seat, a);
    return;
  }
  if (navalKinds.has(a.kind)) {
    startNavalOrder(s, seat, a as NavalAction);
    spendBudget(s, seat, a);
    return;
  }
  spendBudget(s, seat, a);
  switch (a.kind) {
    case "attack-ship":
      if(s.units[a.unit].siege)consumeSiegeShot(s,s.units[a.unit]);
      if (!preview) {
        recordObservedAttack(s, s.units[a.unit]);
        recordWitnessedAttack(s,s.units[a.unit]);
        damageVessel(
          s,
          a.ship,
          unloadingDamage(
            s,
            s.vessels[a.ship],
            Math.max(1, s.units[a.unit].attack - 4),
            distance(s.units[a.unit], s.vessels[a.ship]) > 1,
          ),
        );
      }
      passiveActivity(s, s.units[a.unit]);
      break;
    case "break-crossing":
      if(s.units[a.unit].siege)consumeSiegeShot(s,s.units[a.unit]);
      damageCrossing(s, a.crossing, Math.max(1, s.units[a.unit].attack));
      passiveActivity(s, s.units[a.unit]);
      break;
    case "rest":
      startRest(s, seat, a.unit, a.facility);
      break;
    case "recover-cargo":
      recoverCargo(s, seat, a.convoy, a.carrier, (state, x, y, u) =>
        path(state, x, y, u.flying, u),
      );
      break;
    case "clear-zone":
      delete s.zones[a.zone];
      break;
    case "convoy":
      startConvoy(s, seat, a, (state, x, y, u) =>
        path(state, x, y, u.flying, u),
      );
      break;
    case "repair":
      startRepair(s, seat, a);
      break;
    case "produce": {
      const f = s.facilities[a.facility],
        r = recipe(p.profile, a.recipe)!;
      pay(p, r.cost);
      if (a.recipe === "sentinel") {
        p.commitment--;
        p.hero.readiness -= 3;
      }
      f.job = {
        id: `job:${s.nextId++}`,
        recipe: a.recipe,
        remaining:
          r.great && p.research.includes("brood")
            ? Math.ceil(r.turns * 0.75)
            : r.turns,
        started: s.turn,
        cost: copy(r.cost),
        supply: r.supply,
        great: r.great,
        binding: r.binding,
        ...(r.kind === "vessel" ? { crew: freeWorker(s, seat, f)!.id } : {}),
      };
      if (a.recipe === "hero") {
        p.component--;
        p.hero.status = "pending";
      }
      break;
    }
    case "cancel": {
      const f = s.facilities[a.facility],
        j = f.job ?? f.repair ?? f.rest!;
      keys.forEach((k) => (p.stock[k] += Math.floor(j.cost[k] / 2)));
      if ("recipe" in j && j.recipe === "hero") p.hero.status = "dead";
      delete f.job;
      delete f.repair;
      delete f.rest;
      break;
    }
    case "build": {
      const b = factionBuilding(p.profile, a.building)!;
      pay(p, b.cost);
      const id = `facility:${s.nextId++}`;
      s.facilities[id] = {
        id,
        owner: seat,
        name:
          a.building === "core"
            ? economy(p.profile).heroBuilding
            : a.building === "training"
              ? factionProduction(p.profile).trainingName
              : a.building === "workshop"
                ? factionProduction(p.profile).workshopName
                : a.building === "research"
                  ? factionProduction(p.profile).researchName
                  : b.name,
        kind: a.building,
        tier: ["vault", "crucible"].includes(a.building)
          ? 2
          : a.building === "sky-vault"
            ? 3
            : 1,
        x: a.x,
        y: a.y,
        hp: 100,
        maxHp: 100,
        workers: 1,
      };
      break;
    }
    case "move": {
      const u = s.units[a.unit];
      passiveActivity(s, u);
      const route = path(s, u, a, u.flying, u)!;
      crossZones(s, u, route);
      travelFatigue(s, u, u, a);
      u.x = a.x;
      u.y = a.y;
      recordPatrolMovement(s, u, route);
      if (u.kind === "hero") {
        s.warnings = s.warnings.filter((w) => w.seat !== seat);
        for (const [id, plan] of Object.entries(s.movementPlans))
          if (plan.owner === seat) delete s.movementPlans[id];
      }
      u.effects = u.effects.filter(
        (e) =>
          !e.source.startsWith("circle:") && !e.source.startsWith("formation:"),
      );
      cancelSeparatedTreatments(s);
      break;
    }
    case "attack": {
      if(preview&&s.units[a.unit].siege)consumeSiegeShot(s,s.units[a.unit]);
      if (!preview) performOrdinaryAttack(s, seat, a.unit, a.target);
      break;
    }
    case "capture": {
      const t = s.units[a.target];
      if (!preview) {
        const owner = s.players[t.owner];
        owner.hero.status = "captive";
        owner.hero.captor = seat;
        t.active = false;
        event(s, `${t.name} is captive and still occupies its hero slot.`, [
          seat,
          t.owner,
        ]);
      }
      break;
    }
    case "recover":
      p.hero.readiness = Math.min(
        p.profile === "melkor_worldbreaker" ? 12 : 6,
        p.hero.readiness + (p.profile === "melkor_worldbreaker" ? 6 : 3),
      );
      break;
    case "exchange":
      pay(p, stocks(20, 10));
      p.stock.K += 10;
      break;
    case "surrender":
      kill(s, p.hero.id);
      break;
    case "call": {
      const u = s.units[a.unit];
      pay(p, stocks(20, 20, 0, 10));
      p.hero.readiness -= 3;
      u.owner = seat;
      u.active = true;
      break;
    }
    case "cast": {
      const q = powerCost(p, a.power);
      pay(p, q.cost);
      p.hero.readiness -= q.readiness;
      if (!preview) {
        const t =
          a.x !== undefined && a.y !== undefined
            ? { x: a.x, y: a.y }
            : entityAt(s, a.target);
        s.warnings.push({
          id: `warning:${s.nextId++}`,
          seat,
          power: a.power,
          target: a.target,
          x: t!.x,
          y: t!.y,
          due:
            s.revision +
            (contract(p.profile, a.power).timing.warningPhases ?? 0),
        });
        event(
          s,
          `${profile(p.profile).hero} prepares ${q.source.name}. Move out or interrupt before next resolution.`,
          Object.keys(s.players).filter(
            (id) => visible(s, id, s.units[p.hero.id]) || visible(s, id, t!),
          ),
        );
      }
      break;
    }
    case "diplomacy":
      p.relations[a.target] = a.relation;
      if (a.relation === "war") s.players[a.target].relations[seat] = "war";
      else if (s.players[a.target].relations[seat] === a.relation) {
        event(s, `${seat} and ${a.target} agree ${a.relation}.`);
      }
      break;
    case "trade":
      p.stock[a.resource] -= a.amount;
      s.players[a.target].stock[a.resource] += a.amount;
      break;
    case "rescue":
      p.hero.status = "living";
      delete p.hero.captor;
      s.units[p.hero.id].active = true;
      break;
    case "equip": {
      const u = s.units[a.unit],
        i = s.items[a.item];
      i.bearer = u.id;
      i.owner = seat;
      if(!u.inventory.includes(i.id))u.inventory.push(i.id);
      delete i.carried;
      if (u.kind === "hero"&&!p.hero.equipment.includes(i.id)) p.hero.equipment.push(i.id);
      if (i.durability > 0) {
        u.armor += i.bonus;
        u.attack += i.attackBonus ?? 0;
      }
      break;
    }
    case "annex": {
      const f = s.facilities[a.facility];
      if (f.job?.recipe === "hero") s.players[f.owner].hero.status = "dead";
      delete f.job;
      delete f.repair;
      delete f.rest;
      f.owner = seat;
      break;
    }
    case "perk": {
      p.hero.perks.push(a.branch);
      const h = s.units[p.hero.id];
      if (h?.alive) {
        if (a.branch === "guard") h.armor += 2;
        if (a.branch === "path") h.move += 2;
        if (a.branch === "craft") h.attack += 2;
      }
      break;
    }
    case "land":
      s.units[a.unit].landed = !s.units[a.unit].landed;
      break;
    case "ready":
      p.ready = true;
  }
}
export function preview(s: Match, seat: string) {
  const x = copy(s);
  x.players[seat].ready = false;
  for (const o of x.orders
    .filter((o) => o.seat === seat)
    .sort((a, b) => a.seq - b.seq)) {
    if (!actionReason(x, seat, o.action)) apply(x, seat, o.action, true);
  }
  x.players[seat].ready = s.players[seat].ready;
  return x;
}
export function validate(s: Match, o: Order) {
  if (s.phase !== "planning") return "Match finished";
  if (!s.players[o.seat]) return "Unknown seat";
  if (o.turn !== s.turn || o.revision !== s.revision)
    return "Stale turn or revision; synchronize";
  if (o.seq !== s.nextSeq[o.seat]) return "Unexpected sequence; synchronize";
  return actionReason(preview(s, o.seat), o.seat, o.action);
}
export function submit(
  s: Match,
  o: Order,
): { ok: boolean; state: Match; reason: string } {
  try {
    o = parseOrder(o);
  } catch {
    return { ok: false, state: s, reason: "Malformed command schema" };
  }
  const old = s.receipts[o.seat]?.find((r) => r.id === o.id);
  const fingerprint = JSON.stringify(o);
  if (old)
    return {
      ok: old.fingerprint === fingerprint,
      state: s,
      reason:
        old.fingerprint === fingerprint
          ? "Already accepted"
          : "Command ID collision",
    };
  const reason = validate(s, o);
  if (reason) return { ok: false, state: s, reason };
  const next = copy(s);
  next.orders.push(copy(o));
  next.orders.sort((a, b) => a.seat.localeCompare(b.seat) || a.seq - b.seq);
  next.nextSeq[o.seat]++;
  next.receipts[o.seat].push({
    id: o.id,
    seq: o.seq,
    turn: o.turn,
    accepted: true,
    reason: "Accepted",
    fingerprint,
  });
  if (o.action.kind === "ready") next.players[o.seat].ready = true;
  return {
    ok: true,
    state: next,
    reason: "Order reserved; resolves with the week",
  };
}
function creatureUpkeep(kind: string) {
  return kind === "drake"
    ? stocks(1, 0, 0, 1)
    : kind === "dragon"
      ? stocks(3, 0, 0, 1)
      : kind === "winged-dragon"
        ? stocks(5, 0, 0, 2)
        : kind === "balrog"
          ? stocks(0, 0, 0, 3)
          : stocks(1);
}
function finishJob(s: Match, f: Match["facilities"][string]) {
  const j = f.job!,
    p = s.players[f.owner],
    r = recipe(p.profile, j.recipe)!;
  if (r.kind === "vessel") {
    const crew = j.crew ? s.units[j.crew] : undefined,
      at = launchTile(s, f);
    if (
      !crew?.alive ||
      !crew.active ||
      !crew.supplied ||
      crew.owner !== f.owner ||
      distance(crew, f) > 1 ||
      !at
    ) {
      j.remaining = 1;
      return;
    }
    spawnVessel(s, f.owner, f.id, crew.id, at, j.recipe);
  } else if (r.kind === "hero") {
    p.hero.status = "living";
    p.hero.readiness = p.profile === "melkor_worldbreaker" ? 12 : 6;
    s.units[p.hero.id] = unit(
      s,
      p.seat,
      p.hero.id,
      profile(p.profile).hero,
      "hero",
      f.x,
      f.y,
    );
    for (const perk of p.hero.perks) {
      const h = s.units[p.hero.id];
      if (perk === "guard") h.armor += 2;
      else if (perk === "path") h.move += 2;
      else if (perk === "craft") h.attack += 2;
    }
    event(s, `${profile(p.profile).hero} returns at level ${p.hero.level}.`, [
      p.seat,
    ]);
  } else if (r.kind === "component") p.component++;
  else if (r.kind === "ritual") p.stock.E += 10;
  else if (r.kind === "research") {
    p.research.push(j.recipe);
    for (const u of Object.values(s.units).filter(
      (u) =>
        u.owner === p.seat &&
        u.alive &&
        u.kind !== "hero" &&
        u.kind !== "worker" &&
        !exclusive(u),
    )) {
      if (j.recipe === "technique") u.attack += 2;
      if (j.recipe === "defenses") u.armor += 1;
    }
  } else if (r.kind === "item") {
    const id = `item:${s.nextId++}`;
    s.items[id] = {
      id,
      name: j.recipe === "field-tools" ? "Field breach tools" : factionProduction(p.profile).equipment.name,
      owner: p.seat,
      bearer: null,
      bonus: j.recipe === "field-tools" ? 0 : factionProduction(p.profile).equipment.armorBonus,
      attackBonus: j.recipe === "field-tools" ? 0 : factionProduction(p.profile).equipment.attackBonus,
      durability: 100,
      maxDurability: 100,
      crafted: true,
      ...(p.profile==="troll_hold"&&j.recipe==="equipment"?{heavy:true as const}:{}),
      materials: j.recipe === "field-tools" ? ["metal"] : [...factionProduction(p.profile).equipment.access],
      x: f.x,
      y: f.y,
    };
    const extended=extendedProduction(p.profile,j.recipe),military=militaryProduction(p.profile,j.recipe);
    if(extended?.item)Object.assign(s.items[id],extended.item,{name:extended.recipe.name,extended:j.recipe});
    if(military?.kind==='item'){const {bonus,attackBonus,materials,durability}=military.item;Object.assign(s.items[id],{bonus,attackBonus,materials,durability,maxDurability:100,name:military.recipe.name,military:j.recipe});}
    const final=finalProduction(p.profile,j.recipe);if(final?.kind==='item')Object.assign(s.items[id],final.item,{name:final.recipe.name,finalProduct:j.recipe});
    const companion=companionProduction(p.profile,j.recipe);if(companion?.item)Object.assign(s.items[id],companion.item,{name:companion.recipe.name,companion:j.recipe});
  } else {
    const id = `unit:${s.nextId++}`;
    const kind = [
      "drake",
      "dragon",
      "winged-dragon",
      "balrog",
      "worker",
    ].includes(j.recipe)
      ? (j.recipe as Unit["kind"])
      : ["summon", "sentinel"].includes(j.recipe)
        ? "construct"
        : "company";
    const u = unit(s, p.seat, id, r.name, kind, f.x, f.y);
    u.supply = r.supply;
    u.great = r.great;
    u.binding = r.binding;
    u.upkeep = exclusive(u)
      ? creatureUpkeep(kind)
      : kind === "worker"
        ? stocks()
        : factionProduction(p.profile).unit.upkeep;
    if (j.recipe === "summon") {
      u.kind = "construct";
      u.name = r.name;
      u.upkeep = supportingSummon(p.profile)!.upkeep;
    }
    if (j.recipe === "sentinel") {
      u.kind = "construct";
      u.name = r.name;
      u.upkeep = { ...sarumanSentinel.upkeep };
      u.effects.push({
        kind: "sentinel",
        value: 1,
        until: 1000000,
        source: "saruman",
      });
    }
    if(j.recipe === "engineers"){u.kind="company";u.engineer="trained";u.name="Field Engineers";u.hp=60;u.maxHp=60;u.attack=12;u.armor=3;u.move=3;u.loadClass="standard";u.upkeep=stocks(2);}
    const companion=companionProduction(p.profile,j.recipe);if(companion?.stats)Object.assign(u,companion.stats,{companion:j.recipe});
    const extended=extendedProduction(p.profile,j.recipe),military=militaryProduction(p.profile,j.recipe);
    if(extended?.stats)Object.assign(u,extended.stats,{extended:j.recipe});
    if(military?.kind==='unit'){Object.assign(u,military.stats,{military:j.recipe});if(military.capabilities.magazine)u.siege={ammunition:3,capacity:3};}
    const secondary=secondaryProduction(p.profile,j.recipe);if(secondary)Object.assign(u,secondary.stats,{secondary:j.recipe});
    const final=finalProduction(p.profile,j.recipe);if(final?.kind==='unit')Object.assign(u,final.stats,{finalProduct:j.recipe});
    s.units[id] = u;
    if(j.recipe==='siege'){Object.assign(u,{kind:'company',name:'Ordinary siege engine',hp:siegeRecipe.maxHp,maxHp:siegeRecipe.maxHp,armor:siegeRecipe.armor+(p.research.includes('defenses')?1:0),attack:siegeRecipe.attack+(p.research.includes('technique')?2:0),move:siegeRecipe.move,loadClass:'large',flying:false,upkeep:{...siegeRecipe.upkeep},siege:{ammunition:3,capacity:3}});}
    if(!u.siege&&!u.secondary&&!u.companion&&!u.military)createCompanyMounts(s,u);
    const mounts=militaryCapabilities(s,u)?.trainedMounts;if(mounts){const lot=`mounts:${s.nextId++}`;s.mountLots[lot]={id:lot,owner:u.owner,count:12,fatigue:0,stable:null,unit:u.id,species:mounts.species};}
    if(u.extended==='elven-archers'||u.extended==='mounted-scout'||u.military==='hunters')s.scoutCredentials[u.id]={unit:u.id,owner:u.owner,started:s.turn,ready:true};
  }
  if(j.recipe==='equipment')for(const q of Object.values(s.productionPlans))if(q.workshop===f.id){delete q.workshop;delete q.committedTurn;}
  delete f.job;
}
function cancelSeparatedTreatments(s: Match) {
  for (const u of Object.values(s.units)) {
    const link = u.effects.find((e) => e.kind === "treatment-link");
    if (link) {
      const h = s.units[link.source];
      if (!h?.alive || !h.active || Math.hypot(h.x - u.x, h.y - u.y) > 1)
        u.effects = u.effects.filter(
          (e) => !["treatment-link", "stabilized-wound"].includes(e.kind),
        );
    }
  }
}
function resolveWarnings(s: Match) {
  for (const w of s.warnings.filter((w) => w.due <= s.revision)) {
    if (!s.warnings.some((active) => active.id === w.id) || w.due > s.revision)
      continue;
    const p = s.players[w.seat];
    if (p.hero.status !== "living") continue;
    const anchoredArea =
      w.power === "field" &&
      (zonePowerProfiles.has(p.profile) ||
        ["istari_gandalf", "istari_radagast"].includes(p.profile));
    if (anchoredArea) {
      // A warned area persists independently of the original selected victim.
      // Its location, sightline and remaining occupants are checked at resolution.
      if (!visible(s, w.seat, w)) continue;
    } else {
      const t = entityAt(s, w.target);
      if (!t || t.hp <= 0 || distance(t, w) > 1 || !visible(s, w.seat, t))
        continue;
      const reason = abilityAvailability(s, w.seat, w.power, w.target);
      if (reason) {
        event(s, `Prepared power interrupted: ${reason}`, [w.seat]);
        continue;
      }
    }
    // Effects resolve after ordinary attacks. Their first usable response phase is
    // the next revision; shift newly created/refreshed expiries by that boundary.
    const previous = new Map(
      Object.values(s.units).flatMap((u) =>
        u.effects.map((e) => [e, e.until] as const),
      ),
    );
    const previousZones = new Set(Object.keys(s.zones));
    const heroPositions = Object.values(s.units)
      .filter((u) => u.kind === "hero")
      .map((u) => ({ id: u.id, x: u.x, y: u.y, owner: u.owner }));
    try {
      resolveAbility(
        s,
        w.seat,
        w.power,
        w.target,
        {
          damage: (id, amount, ability) => {if(amount>0){const caster=s.units[s.players[w.seat].hero.id];if(caster)recordWitnessedAttack(s,caster);}damage(s, id, amount, ability,0,s.units[s.players[w.seat].hero.id]);},
          event: (text) => event(s, text, [w.seat]),
        },
        anchoredArea ? w : undefined,
      );
    } catch (error) {
      if (!(error instanceof AbilityValidationError)) throw error;
      event(s, `Prepared power interrupted: ${error.message}`, [w.seat]);
      continue;
    }
    for (const [id, z] of Object.entries(s.zones))
      if (!previousZones.has(id)) z.until++;
    for (const before of heroPositions) {
      const now = s.units[before.id];
      if (now && (now.x !== before.x || now.y !== before.y)) {
        s.warnings = s.warnings.filter((w) => w.seat !== before.owner);
        for (const [id, plan] of Object.entries(s.movementPlans))
          if (plan.owner === before.owner) delete s.movementPlans[id];
      }
    }
    cancelSeparatedTreatments(s);
    for (const u of Object.values(s.units))
      for (const e of u.effects)
        if (!previous.has(e) || e.until > previous.get(e)!)
          e.until = Math.min(1000000, e.until + 1);
  }
  s.warnings = s.warnings.filter((w) => w.due > s.revision);
}
export function resolveWeek(state: Match): Match {
  if (state.phase === "finished") return state;
  const s = copy(state);
  pruneZones(s);
  expireNavalEffects(s);
  beginPassivePhase(s);
  for (const p of Object.values(s.players)) {
    p.ready = false;
  }
  const seats = Object.keys(s.players).sort(),
    rank = (seat: string) =>
      (seats.indexOf(seat) + seats.length - (s.turn % seats.length)) %
      seats.length;
  const phase = (a: Action) =>
    (a.kind === "council-consent" && !a.accept || a.kind === "consent-ledge" && !a.allow || a.kind==="portable"&&a.mode==="consent"&&!a.willing) ? -1 : [
      "consent-ledge", "survey-landing", "portable", "preserve-plan", "remember-workshop", "recover-plan", "destroy-plan", "council-drop", "council-terms", "council-consent", "council-deliver", "council-recover", "council-settle",
      "consent-veil", "prepare-dream", "replace-dream", "forest-power", "forest-entrance", "release-forest", "inspect-forest", "harass-convoy",
      "tool-service", "mounts", "watch-gear",
      "produce",
      "care",
      "care-power",
      "plant-crop",
      "night",
      "civilian",
      "hunting",
      "examine-contact",
      "assign-lifter",
      "block-trail",
      "post-garrison",
      "release-post",
      "cancel-care",
      "declare-tactical",
      "cancel-tactical",
      "tactical-alarm",
      "intelligence-power",
      "advance-crop",
      "worksite-support",
      "surge-passage",
      "coastal-landing",
      "current-crossing",
      "fit-guard",
      "temper-armor",
      "brace-breach",
      "read-fault",
      "prepare-starwatch",
      "inspect-trace",
      "naval-power",
      "tactical-power",
      "charge-power",
      "scout-power",
      "habitat-power",
      "formation-power",
      "convoy",
      "recover-cargo",
      "reroute-convoy",
      "infrastructure-work",
      "infrastructure-power",
      "prepare-supply",
      "eyrie-relay",
      "repair",
      "rest",
      "cancel",
      "build",
      "exchange",
      "perk",
      "equip",
      "diplomacy",
      "trade",
    ].includes(a.kind)
      ? 0
      : a.kind === "move"
        ? 1
        : a.kind === "attack" || a.kind === "capture"
          ? 3
          : 2;
  const permissionKey=(o:Order)=>o.action.kind==='consent-ledge'?`${o.seat}:ledge:${o.action.ledge}:${o.action.visitor}`:o.action.kind==='portable'&&o.action.mode==='consent'?`${o.seat}:portable:${o.action.settlement}`:undefined;
  const orders = s.orders.filter(o=>{const key=permissionKey(o);return !key||!s.orders.some(later=>later.seq>o.seq&&permissionKey(later)===key);}).sort(
    (a, b) =>
      phase(a.action) - phase(b.action) ||
      rank(a.seat) - rank(b.seat) ||
      a.seq - b.seq,
  );
  let executedCombat = false;
  for (const o of orders) {
    if (o.action.kind === "ready") continue;
    const reason = actionReason(s, o.seat, o.action);
    if (reason) {
      event(s, `Order ${o.id} not executed: ${reason}. No payment.`, [o.seat]);
      continue;
    }
    if (["attack", "capture"].includes(o.action.kind))
      progressWorksiteSupports(s, worksiteChecks(s));
    apply(s, o.seat, o.action);
    if (o.action.kind === "move")
      progressWorksiteSupports(s, worksiteChecks(s));
    if (["attack", "capture"].includes(o.action.kind)) executedCombat = true;
  }
  progressVessels(s, "sailing");
  resolveWarnings(s);
  for (const plan of Object.values(s.movementPlans).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (plan.createdRevision === s.revision) continue;
    const result = resolveMovementPlan(s, plan, (state, x, y, u) =>
      path(state, x, y, u.flying, u),
    );
    if (result.reason) {
      event(s, `Movement plan ended: ${result.reason}.`, [plan.owner]);
      delete s.movementPlans[plan.id];
      continue;
    }
    for (const m of result.moves) {
      const u = s.units[m.unit];
      crossZones(s, u, m.route);
      travelFatigue(s, u, u, m.to);
      passiveActivity(s, u);
      u.x = m.to.x;
      u.y = m.to.y;
      recordPatrolMovement(s, u, m.route);
      u.effects = u.effects.filter(
        (e) =>
          !e.source.startsWith("circle:") && !e.source.startsWith("formation:"),
      );
    }
    cancelSeparatedTreatments(s);
    consumeMovementPlanStep(plan, result.moves, s.revision);
    if (plan.members.every((m) => m.complete)) delete s.movementPlans[plan.id];
  }
  progressWorksiteSupports(s, worksiteChecks(s));
  resolveCharges(s,(state,x,y,u)=>path(state,x,y,u.flying,u),{attack:(attacker,target)=>performOrdinaryAttack(s,s.units[attacker].owner,attacker,target),moved:(u,route)=>{passiveActivity(s,u);recordPatrolMovement(s,u,route);if(u.kind==="hero"){s.warnings=s.warnings.filter(w=>w.seat!==u.owner);for(const[id,plan]of Object.entries(s.movementPlans))if(plan.owner===u.owner)delete s.movementPlans[id];}u.effects=u.effects.filter(e=>!e.source.startsWith("circle:")&&!e.source.startsWith("formation:"));cancelSeparatedTreatments(s);}});
  resolveForestPatrols(s,(state,x,y,u)=>path(state,x,y,u.flying,u),(u,route)=>civilianChecks(s).moved?.(s,u,route));
  resolveFormations(s,(state,x,y,u)=>path(state,x,y,u.flying,u),(u,route)=>{passiveActivity(s,u);recordPatrolMovement(s,u,route);u.effects=u.effects.filter(e=>!e.source.startsWith("circle:")&&!e.source.startsWith("formation:"));cancelSeparatedTreatments(s);});
  resolveTacticalOrders(s, (state, x, y, u) => path(state, x, y, u.flying, u), {
    ranged:(attacker,target)=>performOrdinaryAttack(s,s.units[attacker].owner,attacker,target),
    pursuit: (attacker, target, reduction) =>
      performOrdinaryAttack(
        s,
        s.units[attacker].owner,
        attacker,
        target,
        Math.max(reduction,pursuitDamagePenalty(s,s.units[attacker])),
      ),
  });
  cancelSeparatedTreatments(s);
  settleForest(s);pruneDreams(s);
  pruneRepairs(s);
  pruneRest(s);
  progressLogistics(
    s,
    (state, x, y, u) => path(state, x, y, u?.flying ?? false, u),
    false,
  );
  settleConvoyLosses(s);
  settleCivilianLosses(s);
  settleNightParties(s);settleRelayLosses(s);
  advanceNightPatrols(s,civilianChecks(s).route,civilianChecks(s).cost,(u,route)=>civilianChecks(s).moved?.(s,u,route));
  if (
    (Object.values(s.forestRoutes).some(q=>q.kind==="wild-road"&&!q.patrolled&&!q.released) || Object.values(s.nightPatrols).some(q=>q.phase!=="interrupted") || executedCombat ||
      s.combatPhase > 0 ||
      Object.keys(s.movementPlans).length > 0 ||
      Object.keys(s.formationOrders).length > 0 ||
      Object.keys(s.charges).length > 0 ||
      Object.keys(s.tacticalOrders).length > 0 ||
      Object.values(s.players).some((p) => p.encounter)) &&
    (s.combatPhase < 2 ||
      s.warnings.length > 0 ||
      Object.keys(s.movementPlans).length > 0 ||
      Object.keys(s.formationOrders).length > 0 ||
      Object.keys(s.charges).length > 0 ||
      Object.keys(s.tacticalOrders).length > 0)
  ) {
    endPassivePhase(s);
    s.combatPhase++;
    s.revision++;progressSecondaryVenom(s);
    settleAgentCaptivities(s);settleHeavyEquipment(s);settleForest(s);pruneDreams(s);
    pruneScouting(s);
    for (const [id, plan] of Object.entries(s.movementPlans))
      if (plan.until <= s.revision) delete s.movementPlans[id];
    s.orders = [];
    for (const p of Object.values(s.players)) p.tacticalUsed = false;
    event(
      s,
      `Tactical response phase ${s.combatPhase}: counter warnings before weekly production.`,
    );
    return s;
  }
  progressWorksiteSupports(s, worksiteChecks(s));
  progressRelayMessages(s,civilianChecks(s).route,civilianChecks(s).cost,(u,route)=>civilianChecks(s).moved?.(s,u,route));
  progressIntelligence(s, (state, x, y, u) => path(state, x, y, u.flying, u));
  resolveHunting(s,(state,x,y,u)=>path(state,x,y,u.flying,u),(u,route)=>{passiveActivity(s,u);recordPatrolMovement(s,u,route);u.effects=u.effects.filter(e=>!e.source.startsWith("circle:")&&!e.source.startsWith("formation:"));cancelSeparatedTreatments(s);});
  settleAgentCaptivities(s);settleHeavyEquipment(s);progressLogging(s);progressBeaconSignals(s);
  progressRoutineEnvironment(s);
  progressCare(s);
  progressCrops(s);
  progressCivilians(s,civilianChecks(s));
  endEncounterConditions(s);
  finishMoraleEncounter(s);
  for (const f of Object.values(s.facilities).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (f.hp <= 0 || (f.workers < 1 && !(f.kind==='mine'&&Object.values(s.units).some(u=>u.mineWork===f.id&&u.owner===f.owner&&u.alive&&u.active&&u.supplied&&distance(u,f)<=1&&!activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind)))))) continue;
    const p = s.players[f.owner],
      income =
        f.kind === "core"
          ? factionProduction(p.profile).income
          : (buildings[f.kind]?.income ?? stocks());
    keys.forEach((k) => (p.stock[k] += income[k]));
  }
  for (const u of Object.values(s.units).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (!u.alive || !u.active || !s.players[u.owner]) continue;
    const p = s.players[u.owner];
    u.supplied = payReservedUpkeep(s,u);
    if (!u.supplied && exclusive(u)) p.hero.readiness = Math.max(0, p.hero.readiness - 1);
    u.effects = u.effects.filter((e) => e.until > s.revision);
  }
  for (const f of Object.values(s.facilities).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    if (f.hp <= 0) continue;
    const p = s.players[f.owner];
    if (
      f.job && !tunnelProductionPenalty(s,f.id) &&
      (f.job.recipe!=="equipment" || planAllowsProduction(s,f,(x,y)=>Boolean(path(s,x,y)))) &&
      f.workers > 0 &&
      (!f.job.great ||
        !Object.values(s.units).some(
          (u) => u.owner === p.seat && u.alive && !u.supplied,
        ))
    ) {
      f.job.remaining--;
      if (f.job.remaining <= 0) finishJob(s, f);
    }
  }
  progressPortableWorkshops(s,civilianChecks(s));
  pruneEyrieState(s);
  refreshPlans(s);
  settlePortableLosses(s);
  progressRestitution(s,councilChecks(s));
  progressConvoys(s, (state, x, y, u) => path(state, x, y, u.flying, u));
  progressTools(s,(x,y)=>Boolean(path(s,x,y)));
  progressMounts(s,equipmentChecks(s));
  progressWatchGear(s,equipmentChecks(s));
  progressEquipmentServices(s,(x,y)=>Boolean(path(s,x,y,false)));
  progressHabitat(s,(x,y,u)=>Boolean(path(s,x,y,false,u)));
  progressFieldworks(s,(x,y,u)=>Boolean(path(s,x,y,false,u)));
  pruneDreams(s);
  progressRest(s);
  progressCrossings(s);
  progressInfrastructureWork(s, (state, x, y, u) =>
    path(state, x, y, u?.flying ?? false, u),
  );
  progressVessels(s);
  progressLogistics(s, (state, x, y, u) =>
    path(state, x, y, u?.flying ?? false, u),
  );
  progressRepairs(
    s,
    (a, b) => Boolean(path(s, a, b)),
    (text, seat) => event(s, text, [seat]),
  );
  for (const site of s.sites) {
    const contenders = new Set(
      Object.values(s.units)
        .filter(
          (u) =>
            u.alive &&
            u.active &&
            u.kind !== "worker" &&
            u.supplied &&
            (!u.flying || u.landed) &&
            distance(u, site) <= 1,
        )
        .map((u) => u.owner),
    );
    site.owner = contenders.size === 1 ? [...contenders][0] : null;
  }
  for (const p of Object.values(s.players)) {
    if (s.turn >= 8 && s.sites.filter((t) => t.owner === p.seat).length >= 2)
      p.streak++;
    else p.streak = 0;
    if (p.streak >= 3) {
      s.winner = p.seat;
      s.phase = "finished";
    }
    const foothold =
      Object.values(s.facilities).some((f) => f.owner === p.seat && f.hp > 0) ||
      Object.values(s.units).some(
        (u) => u.owner === p.seat && u.alive && u.kind === "worker",
      );
    p.eliminated = !foothold;
    p.operations = 3;
    p.commitment = 1;
    p.ready = false;
    p.encounter = false;
    p.tacticalUsed = false;
  }
  const survivors = Object.values(s.players).filter((p) => !p.eliminated);
  if (survivors.length === 1) {
    s.winner = survivors[0].seat;
    s.phase = "finished";
  }
  s.orders = [];
  s.combatPhase = 0;
  s.turn++;
  s.revision++;progressSecondaryVenom(s);
  pruneRoutineEnvironment(s);pruneLocalKnowledge(s);progressWarbandRewards(s);
  pruneDreams(s);
  forestWeekly(s);
  finishScoutTraining(s);publishNightReports(s);advanceNightRegions(s);
  pruneScouting(s);
  progressHabitat(s,(x,y,u)=>Boolean(path(s,x,y,false,u)));
  event(
    s,
    s.winner
      ? `${s.winner} wins the Cross-era sandbox.`
      : `Week ${s.turn}: established queues continue independently.`,
  );
  return s;
}
export function planAI(s: Match, seat: string): Action[] {
  let local = s;
  const actions: Action[] = [];
  const add = (action: Action) => {
    const o = {
      id: `ai:${seat}:${s.turn}:${local.nextSeq[seat]}`,
      seat,
      seq: local.nextSeq[seat],
      turn: s.turn,
      revision: s.revision,
      action,
    };
    const r = submit(local, o);
    if (r.ok) {
      local = r.state;
      actions.push(action);
      return true;
    }
    return false;
  };
  const p = s.players[seat],
    core = Object.values(s.facilities).find(
      (f) => f.owner === seat && f.kind === "core" && f.hp > 0,
    );
  if (core && !core.job && ["uncreated", "dead"].includes(p.hero.status))
    add({
      kind: "produce",
      facility: core.id,
      recipe: p.component ? "hero" : "component",
    });
  const train = Object.values(s.facilities).find(
    (f) => f.owner === seat && f.kind === "training" && !f.job,
  );
  if (train && s.turn % 3 === 0)
    add({ kind: "produce", facility: train.id, recipe: "company" });
  const units = Object.values(s.units).filter(
    (u) => u.owner === seat && u.alive && u.active && u.kind !== "worker",
  );
  units.forEach((u, i) => {
    const target = s.sites[i % s.sites.length];
    const enemy = Object.values(s.units).find(
      (t) =>
        t.owner !== seat &&
        t.owner !== "remnant" &&
        t.alive &&
        effectiveRelation(s, seat, t.owner) === "war" &&
        visible(s, seat, t) &&
        distance(t, u) <= 2,
    );
    if (enemy) {
      if (add({ kind: "attack", unit: u.id, target: enemy.id })) return;
    }
    if (distance(u, target) <= 1) return;
    const route = path(s, u, target, u.flying, u);
    if (route) {
      // Use the same validator as a player, including fatigue, woodland and zones.
      for (let step = Math.min(route.length - 1, u.move); step > 0; step--) {
        if (add({ kind: "move", unit: u.id, ...route[step] })) break;
      }
    }
  });
  return actions;
}

/** Provisional direct approach radius: two observed tiles; the ward names no attacker. */
function worksiteChecks(s: Match): WorksiteChecks {
  return {
    connected: (a, b) => Boolean(path(s, a, b)),
    openRoute: (seat, route) => {
      const template = Object.values(s.units).find(
        (u) => u.owner === seat && u.alive,
      );
      if (!template) return false;
      const worker: Unit = {
        ...template,
        kind: "worker",
        flying: false,
        landed: false,
      };
      return route.every(
        (pos, index) =>
          terrainObserved(s, seat, pos) &&
          !Object.values(s.units).some(
            (u) =>
              u.alive &&
              u.active &&
              u.owner !== seat &&
              effectiveRelation(s, seat, u.owner) === "war" &&
              distance(u, pos) === 0,
          ) &&
          (!index ||
            path(s, route[index - 1], pos, false, worker)?.length === 2),
      );
    },
    observedApproach: (seat, site) =>
      Object.values(s.units).some(
        (u) =>
          u.alive &&
          u.active &&
          u.attack > 0 &&
          u.owner !== seat &&
          effectiveRelation(s, seat, u.owner) === "war" &&
          distance(u, site) <= 2 &&
          visible(s, seat, u),
      ),
  };
}

function civilianChecks(s:Match):CivilianChecks{
 return {
 busy:id=>{const u=s.units[id];return !u||Boolean(actionReason(s,u.owner,{kind:"move",unit:id,x:u.x,y:u.y}));},
 connected:(a,b)=>Boolean(path(s,a,b)),
 route:(state,u,route)=>!activeEffects(state,u).some(e=>e.kind==="root")&&route.every((at,i)=>terrainObserved(state,u.owner,at)&&(!i||Boolean(path(state,route[i-1],at,u.flying,u)?.length===2)))&&!Object.values(state.units).some(v=>v.alive&&effectiveRelation(state,u.owner,v.owner)==="war"&&distance(v,route.at(-1)!)===0),
 cost:(state,u,route)=>{const limit=Math.min(Math.max(1,u.move-movementPenalty(state,u)-fatigueMovementPenalty(state,u)),...activeEffects(state,u).filter(e=>e.kind==="move-limit").map(e=>e.value));return route.length-1+woodlandMovementCost(state,u,route)+movementZonePenalty(state,u,route)+u.move-limit;},
 moved:(state,u,route)=>{crossZones(state,u,route);travelFatigue(state,u,route[0],route.at(-1)!);passiveActivity(state,u);recordPatrolMovement(state,u,route);cancelSeparatedTreatments(state);}
 };
}

function nightOrderReason(s:Match,seat:string,a:NightAction):string{
 const checks=civilianChecks(s);switch(a.mode){
 case 'assign-shift':return darkShiftReason(s,seat,a.job);
 case 'light-shift':return illuminationReason(s,seat,a.shift,a.method,a.mirror,(x,y)=>Boolean(path(s,x,y)));
 case 'dawn-watch':return dawnWatchReason(s,seat,a.post,a.approach);
 case 'train-scout':return trainScoutReason(s,seat,a.unit);
 case 'patrol':{if(a.companion){const u=s.units[a.companion];if(!u)return 'Unknown accompanying scout';const busy=actionReason(s,seat,{kind:'move',unit:u.id,x:u.x,y:u.y});if(busy)return busy;}return nightPatrolReason(s,seat,a,checks.route,checks.cost);}
 case 'message':{const u=s.units[a.courier];if(!u)return 'Unknown courier';const busy=actionReason(s,seat,{kind:'move',unit:u.id,x:u.x,y:u.y});return busy||relayReason(s,seat,a,checks.route);}
 case 'second-signal':return secondSignalReason(s,seat,a.message,a.route,checks.route,(x,y)=>Boolean(path(s,x,y)));
 }
}
function applyNightOrder(s:Match,seat:string,a:NightAction):void{const checks=civilianChecks(s);switch(a.mode){
 case 'assign-shift':assignDarkShift(s,seat,a.job);break;
 case 'light-shift':illuminateShift(s,seat,a.shift,a.method,a.mirror,(x,y)=>Boolean(path(s,x,y)));break;
 case 'dawn-watch':selectDawnWatch(s,seat,a.post,a.approach);break;
 case 'train-scout':trainScout(s,seat,a.unit);break;
 case 'patrol':startNightPatrol(s,seat,a,checks.route,checks.cost);break;
 case 'message':startRelayMessage(s,seat,a,checks.route);break;
 case 'second-signal':prepareSecondSignal(s,seat,a.message,a.route,checks.route,(x,y)=>Boolean(path(s,x,y)));break;
 }}

function equipmentPower(a:Action){return a.kind==='tool-service'&&a.mode==='refit'||a.kind==='mounts'&&a.mode==='exchange'||a.kind==='watch-gear'&&a.mode==='relocate';}
function equipmentOperations(a:Action){return a.kind==='tool-service'?(a.mode==='repair'?1:0):a.kind==='mounts'?(a.mode==='exchange'?1:0):a.kind==='watch-gear'?(a.mode==='relocate'?1:0):1;}
function equipmentChecks(s:Match){const c=civilianChecks(s);return {open:c.route,cost:c.cost,budget:(_s:Match,u:Unit)=>u.move,connected:(a:Pos,b:Pos,u:Unit)=>Boolean(path(s,a,b,false,u)),surveyed:()=>false,moved:c.moved};}
function equipmentReason(s:Match,seat:string,a:Action):string{
 const connected=(x:Pos,y:Pos)=>Boolean(path(s,x,y,false));const c={...equipmentChecks(s),surveyed:(p:Pos)=>terrainObserved(s,seat,p)};
 if(a.kind==='mounts'&&a.mode==='exchange'){for(const id of [a.crew,a.rider]){const u=s.units[id];if(!u)return 'Existing party required';const reason=actionReason(s,seat,{kind:'move',unit:id,x:u.x,y:u.y});if(reason)return reason;}}
 if(a.kind==='watch-gear'&&a.mode==='relocate'){const u=s.units[a.worker];if(!u)return 'Existing worker required';const reason=actionReason(s,seat,{kind:'move',unit:u.id,x:u.x,y:u.y});if(reason)return reason;}
 if(a.kind==='tool-service'){if(a.mode==='make')return queueToolReason(s,seat,a.facility,a.function);if(a.mode==='refit')return refitToolReason(s,seat,a.item,a.facility,a.function,connected);return fieldRepairReason(s,seat,a.unit,a.tool,a.target);}
 if(a.kind==='mounts'){if(a.mode==='breed')return queueMountsReason(s,seat,a.facility);if(a.mode==='recover')return recoverMountsReason(s,seat,a.lot);return remountReason(s,seat,a.rider,a.lot,a.crew,a.route,c);}
 if(a.kind==='watch-gear')return a.mode==='make'?watchGearReason(s,seat,a.facility):reweaveReason(s,seat,a.facility,a.worker,a.route,c);return 'Unknown equipment service';
}
function applyEquipmentOrder(s:Match,seat:string,a:Action){const connected=(x:Pos,y:Pos)=>Boolean(path(s,x,y,false));const c={...equipmentChecks(s),surveyed:(p:Pos)=>terrainObserved(s,seat,p)};
 if(a.kind==='tool-service'){if(a.mode==='make')queueTool(s,seat,a.facility,a.function);else if(a.mode==='refit')refitTool(s,seat,a.item,a.facility,a.function,connected);else fieldRepair(s,seat,a.unit,a.tool,a.target);}
 if(a.kind==='mounts'){if(a.mode==='breed')queueMounts(s,seat,a.facility);else if(a.mode==='recover')recoverMounts(s,seat,a.lot);else startRemount(s,seat,a.rider,a.lot,a.crew,a.route,c);}
 if(a.kind==='watch-gear'){if(a.mode==='make')queueWatchGear(s,seat,a.facility);else startReweave(s,seat,a.facility,a.worker,a.route,c);}
}

function dreamChecks(s: Match): DreamChecks {
 return {
  connected: (a,b,u) => Boolean(path(s,a,b,u.flying,u)),
  verifiedReport: (seat,id,turn,revision) => {
   const r=s.nightReports[id];
   return !!r && r.owner===seat && r.verified && r.observations.length>0 &&
    (r.createdTurn>turn || r.createdTurn===turn && r.createdRevision>revision) &&
    r.observations.some(o=>o.turn>turn || o.turn===turn && o.revision>revision);
  }
 };
}

function councilChecks(s:Match):CouncilChecks{
 const c=civilianChecks(s);
 return {connected:(a,b,u)=>Boolean(path(s,a,b,false,u)),route:(state,u,route)=>c.route(state,u,route)&&route.every(at=>!Object.values(state.units).some(v=>v.alive&&v.active&&effectiveRelation(state,u.owner,v.owner)==='war'&&distance(v,at)===0)),cost:c.cost,moved:(u,route)=>c.moved?.(s,u,route)};
}
