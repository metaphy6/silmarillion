import type {FinalProductKey} from "../content/final-production";
import type {ExtendedKey} from "../content/extended-production";
import type {MilitaryKey} from "../content/military-production";
import type {CompanionKey} from "../content/companion-production";
import type {SecondaryKey} from "../content/secondary-production";
import type {HeavyAction} from "./heavy-equipment";
import type {AgentCaptivity,AgentDisclosure} from "./agent-captivity";
import type {WaterChannel,LoggingJob,LoggingAction} from "./ordinary-environment";
import type {BeaconLink,BeaconSignal,BeaconSurveyCandidate} from "./relay-messages";
import type {RewardAction,WarbandAgreement} from "./warband-rewards";
import type {LocalKnowledgeAction,LocalKnowledgeReport,LocalGroundTrace,GroveDisturbance} from "./local-knowledge";
import type {RoutineAction,RoutineInspection,RoutineWearUse,HabitatWear,TunnelAir,AirflowWarning,RoutineTravelEvent} from "./routine-environment";
import type {SiegeMagazine} from "./siege";
import type {LedgeConsent,LandingSurvey} from "./transport";
import type {PortableWorkshop,PortableConsent,PortableRequest} from "./portable-workshop";
import type {ProductionPlan,PlanAction} from "./preserved-plan";
import type { Grievance, Restitution, SurvivorMemory, CouncilAction } from "./council";
import type {ForestConsent,ForestRoute,ForestVeil,ForestReport,ForestEntrance,ForestRequest,FalseTrail} from "./forest-routes";
import type { DreamPlan, DreamContingency } from "./dream-preparation";
import type {ToolMetadata,ToolJob,ToolAction} from './tool-services';
import type {MountLot,MountJob,MountAction} from './remounts';
import type {WatchGear,WatchJob,BorderReport,BorderSurvey,WatchAction} from './watch-posts';
import type {NightRegion,DarkShift,DawnWatch,DawnReport} from './night-work';
import type {ScoutCredential,NightPatrol,NightReport,PersonalNightSurvey} from './night-patrol';
import type {RelayMessage,SecondSignal,RelayDelivery,WitnessUse} from './relay-messages';
import type {NightAction} from './night-relay';
import type {FormationRequest,FormationOrder,GarrisonPost,GarrisonReport} from "./formation-orders";
import type {AttackPreparation} from "./tactical-orders";
import type {Household,CivilianConsent,CivilianJob,CivilianRequest} from "./civilians";
import type {ShorePreparation,CurrentCrossing} from "./shore-powers";
import type {HabitatPower,Vegetation,LivingBarrier,OldTrail,HeroTrailSurvey,TrailProject} from "./habitat-works";
import type {ProtectionKit,ArmorFitting,EquipmentService,OrdinaryHazard} from "./equipment-service";
import type {ScoutPower,ScoutShadow,WitnessedAttack,WitnessFlare} from "./scouting";
import type {HuntingRequest,HuntingJob,HuntingReport,PreySite} from "./hunting";
import type {FieldworkJob,Fieldwork,FieldRepairKit,FaultMark,FieldworkKind,StructuralMaterial} from "./fieldworks";
import type { ChargeRequest,ChargePlan } from "./charges";
import type {
  LogisticsJob,
  LogisticsRequest,
  TransportClass,
} from "./logistics-support";
import type {
  MovementTrace,
  RouteSurvey,
  PatrolWatch,
  PatrolReport,
} from "./patrols";
import type { TacticalSignal } from "./tactical-orders";
import type {
  InfrastructureSite,
  InfrastructureJob,
  InfrastructureRequest,
} from "./infrastructure-work";
import type { WorksiteSupport, WorksiteRequest } from "./worksite-support";
import type {
  TacticalOrder,
  TacticalRequest,
  TacticalPower,
} from "./tactical-orders";
import type { NavalEffect, NavalPowerAction } from "./naval-powers";
import type { CropCycle } from "./crops";
import type { CareRequest, CarePower, CareQueue, CareEvacuationRequest } from "./recovery";
import type {
  IntelligenceRequest,
  IntelligenceReport,
  IntelligenceTask,
} from "./intelligence";
import type { Zone } from "./zones";
import type { Crossing } from "./crossings";
import type { MovementPlan } from "./movement-plans";
import type { Vessel, SeaHazard, NavalAction } from "./naval";
import type { Convoy } from "./transport";
import { CONTENT_FINGERPRINT } from "../content/version";
export type Stock = { P: number; M: number; K: number; E: number };
export type Pos = { x: number; y: number };
export type HeroStatus =
  "uncreated" | "pending" | "living" | "captive" | "dead";
export interface Hero {
  id: string;
  status: HeroStatus;
  level: number;
  xp: number;
  perks: string[];
  readiness: number;
  equipment: string[];
  captor?: string;
}
export interface Player {
  seat: string;
  profile: string;
  stock: Stock;
  component: number;
  hero: Hero;
  operations: number;
  commitment: number;
  ready: boolean;
  ai: boolean;
  encounter: boolean;
  tacticalUsed: boolean;
  eliminated: boolean;
  streak: number;
  research: string[];
  sources: string[];
  relations: Record<string, "peace" | "alliance" | "war">;
  memory: string[];
}
export interface Unit extends Pos {
  secondary?:SecondaryKey;companion?:CompanionKey;extended?:ExtendedKey;military?:MilitaryKey;finalProduct?:FinalProductKey;mineWork?:string;
  siege?:SiegeMagazine;
  reserveProvisions?:number;
  engineer?:"trained"|"nogrod";
  id: string;
  owner: string;
  name: string;
  kind:
    | "company"
    | "hero"
    | "worker"
    | "drake"
    | "dragon"
    | "winged-dragon"
    | "balrog"
    | "construct"
    | "beast";
  hp: number;
  maxHp: number;
  attack: number;
  armor: number;
  move: number;
  supply: number;
  great: number;
  binding: number;
  upkeep: Stock;
  flying: boolean;
  landed: boolean;
  loadClass: TransportClass;
  active: boolean;
  alive: boolean;
  supplied: boolean;
  effects: Effect[];
  inventory: string[];
}
export interface Effect {
  kind: string;
  value: number;
  until: number;
  source: string;
}
export interface Facility extends Pos {
  id: string;
  owner: string;
  name: string;
  kind: string;
  tier: number;
  hp: number;
  maxHp: number;
  workers: number;
  job?: Job;
  repair?: RepairWork;
  rest?: {
    id: string;
    unit: string;
    started: number;
    remaining: number;
    cost: Stock;
  };
}
export interface RepairWork {
  id: string;
  target: string;
  kind: "item" | "structure" | "construct" | "siege";
  remaining: number;
  started: number;
  cost: Stock;
  amount: number;
  method: "ordinary" | "power";
  accelerated: boolean;
}
export interface Job {
  id: string;
  recipe: string;
  remaining: number;
  started: number;
  cost: Stock;
  supply: number;
  great: number;
  binding: number;
  crew?: string;
}
export interface Item extends Pos {
  heavy?:true;carried?:true;companion?:CompanionKey;extended?:ExtendedKey;military?:MilitaryKey;finalProduct?:FinalProductKey;
  id: string;
  name: string;
  owner: string | null;
  bearer: string | null;
  bonus: number;
  attackBonus?: number;
  durability: number;
  maxDurability: number;
  crafted: boolean;
  materials: string[];
}
export interface Site extends Pos {
  id: string;
  name: string;
  owner: string | null;
}
export interface GameEvent {
  /** Trusted completed own movement; presentation only, never an order. */
  motion?: { unit: string; route: Pos[] };
  id: number;
  turn: number;
  text: string;
  audience: string[] | "public";
}
export type Action = {kind:"lay-false-trail";unit:string} | HeavyAction | {kind:"capture-agent";unit:string;target:string} | {kind:"free-agent";unit:string;capture:string} | LoggingAction | {kind:"survey-beacon-link";origin:string;destination:string;trace:string} | {kind:"signal-beacon";origin:string;destination:string;report:string} | RewardAction | LocalKnowledgeAction | RoutineAction | ({kind:"evacuate-care"}&CareEvacuationRequest) | {kind:"pack-rations";unit:string;facility:string;amount:number} | {kind:"reload-siege";unit:string;facility:string} | {kind:"consent-ledge";ledge:string;visitor:string;allow:boolean} | {kind:"survey-landing";destination:Pos} | ({kind:"portable"}&PortableRequest) | PlanAction | CouncilAction | {kind:"consent-veil";unit:string;melian:string;accept:boolean}
 | ({kind:"forest-power"}&ForestRequest)
 | {kind:"harass-convoy";unit:string;target:string} | {kind:"forest-entrance";facility:string} | {kind:"release-forest";id:string} | {kind:"inspect-forest";unit:string;point:Pos}
 | {kind:"prepare-dream";unit:string;facility:string;contingency:DreamContingency}
 | {kind:"replace-dream";plan:string;report:string;contingency:DreamContingency}
 | ToolAction | MountAction | WatchAction
 | NightAction
  | ({kind:"civilian"}&CivilianRequest)
 | {kind:"surge-passage";unit:string;tile:Pos}
 | {kind:"current-crossing";convoy:string;tiles:Pos[]}
 | {kind:"coastal-landing";ship:string;unit:string;tile:Pos}
  | {kind:"make-protection-kit";unit:string;facility:string;hazard:OrdinaryHazard}
  | {kind:"fit-guard";unit:string;hazard:OrdinaryHazard}
  | {kind:"temper-armor";unit:string;facility:string;hazard:OrdinaryHazard}
  | ({kind:"formation-power"}&FormationRequest)
  | {kind:"post-garrison";unit:string;post:string;survey:string}
  | {kind:"release-post";unit:string}
  | ({kind:"habitat-power"}&HabitatPower)
  | {kind:"assign-lifter";job:string;unit:string}
  | {kind:"block-trail";trail:string;unit:string}
  | ({kind:"scout-power"}&ScoutPower)
  | ({kind:"hunting"}&HuntingRequest)
  | {kind:"examine-contact";unit:string;point:Pos}
  | ({kind:"charge-power"}&ChargeRequest)
  | NavalAction
  | { kind: "attack-ship"; unit: string; ship: string }
  | { kind: "produce"; facility: string; recipe: string }
  | { kind: "cancel"; facility: string }
  | {
      kind: "repair";
      kit?:string;
      facility: string;
      target: string;
      method: "ordinary" | "power";
    }
  | { kind: "build"; building: string; x: number; y: number }
  | { kind: "move"; unit: string; x: number; y: number }
  | { kind: "attack"; unit: string; target: string }
  | { kind: "recover" }
  | { kind: "exchange" }
  | { kind: "surrender" }
  | { kind: "call"; unit: string }
  | {
      kind: "cast";
      power: "field" | "support";
      target: string;
      x?: number;
      y?: number;
    }
  | {
      kind: "diplomacy";
      target: string;
      relation: "peace" | "alliance" | "war";
    }
  | { kind: "trade"; target: string; resource: keyof Stock; amount: number }
  | { kind: "rescue"; unit: string; target: string }
  | { kind: "capture"; unit: string; target: string }
  | {kind:"deploy-device";unit:string;item:string;at:Pos}
  | {kind:"assign-mining-engine";unit:string;facility:string|null}
  | { kind: "equip"; unit: string; item: string }
  | { kind: "annex"; facility: string; unit: string }
  | { kind: "perk"; branch: "craft" | "guard" | "path" }
  | { kind: "land"; unit: string }
  | {
      kind: "convoy";
      carrier: string;
      origin: string;
      destination: string;
      cargo: Stock;
    }
  | { kind: "recover-cargo"; convoy: string; carrier: string }
  | { kind: "prepare-supply"; convoy: string; route: Pos[] }
  | { kind: "eyrie-relay"; origin: string; destination: string; cargo: Stock }
  | { kind: "rest"; unit: string; facility: string }
  | { kind: "crossing"; from: string; to: string; crew: string }
  | { kind: "break-crossing"; unit: string; crossing: string }
  | ({ kind: "care" } & CareRequest)
  | ({ kind: "care-power" } & CarePower)
  | { kind: "inspect-trace"; x: number; y: number }
  | { kind: "prepare-starwatch"; survey: string }
  | {kind:"fieldwork";worker:string;facility:string;form:FieldworkKind;material:StructuralMaterial;x:number;y:number}
  | {kind:"load-repair-kit";unit:string;facility:string;material:StructuralMaterial}
  | {kind:"brace-breach";unit:string;target:string}
  | {kind:"read-fault";target:string}
  | { kind: "cancel-care"; unit: string }
  | ({ kind: "worksite-support" } & WorksiteRequest)
  | { kind: "evacuate-worksite"; id: string }
  | { kind: "plant-crop"; plot: string; irrigation: string }
  | { kind: "advance-crop"; crop: string }
  | ({ kind: "infrastructure-work" } & InfrastructureRequest)
  | { kind: "infrastructure-power"; job: string }
  | ({ kind: "logistics" } & LogisticsRequest)
  | NavalPowerAction
  | { kind: "declare-tactical"; order: TacticalRequest }
  | ({ kind: "tactical-power" } & TacticalPower)
  | { kind: "cancel-tactical"; unit: string }
  | { kind: "tactical-alarm"; unit: string; target: string }
  | ({ kind: "intelligence-power" } & IntelligenceRequest)
  | { kind: "movement-power"; members: { unit: string; to: Pos }[] }
  | {
      kind: "reroute-convoy";
      convoy: string;
      destination: string;
      method: "ordinary" | "power";
      relay?: string;
    }
  | { kind: "clear-zone"; unit: string; zone: string }
  | { kind: "ready" };
export interface Order {
  id: string;
  seat: string;
  seq: number;
  turn: number;
  revision: number;
  action: Action;
}
export interface Receipt {
  id: string;
  seq: number;
  turn: number;
  accepted: boolean;
  reason: string;
  fingerprint: string;
}
export interface Match {
  falseTrails:Record<string,FalseTrail>;
  agentCaptivities:Record<string,AgentCaptivity>;agentDisclosures:Record<string,AgentDisclosure>;
  waterChannels:Record<string,WaterChannel>;loggingJobs:Record<string,LoggingJob>;loggedVegetation:Record<string,true>;
  beaconSurveyCandidates:Record<string,BeaconSurveyCandidate>;beaconLinks:Record<string,BeaconLink>;beaconSignals:Record<string,BeaconSignal>;beaconFogUses:Record<string,number>;
  warbandAgreements:Record<string,WarbandAgreement>;
  localKnowledgeReports:Record<string,LocalKnowledgeReport>; localGroundTraces:Record<string,LocalGroundTrace>; groveDisturbances:Record<string,GroveDisturbance>;
  routineInspections:Record<string,RoutineInspection>; routineWearUses:Record<string,RoutineWearUse>; routineWorksiteWear:Record<string,number>; habitatWear:Record<string,HabitatWear>; tunnelAir:Record<string,TunnelAir>; airflowWarnings:Record<string,AirflowWarning>; routineTravelEvents:Record<string,RoutineTravelEvent>;
  ledgeConsents:Record<string,LedgeConsent>;
  landingSurveys:Record<string,LandingSurvey>;
  portableWorkshops:Record<string,PortableWorkshop>;
  portableConsents:Record<string,PortableConsent>;
  productionPlans:Record<string,ProductionPlan>;
  grievances: Record<string,Grievance>; restitutions: Record<string,Restitution>; survivorMemories: Record<string,SurvivorMemory>;
  dreamPlans: Record<string, DreamPlan>;
  forestConsents:Record<string,ForestConsent>;
  forestRoutes:Record<string,ForestRoute>;forestVeils:Record<string,ForestVeil>;forestReports:Record<string,ForestReport>;forestEntrances:Record<string,ForestEntrance>;
  version: string;
  id: string;
  scenario: string;
  revision: number;
  turn: number;
  combatPhase: number;
  rng: number;
  phase: "planning" | "finished";
  players: Record<string, Player>;
  units: Record<string, Unit>;
  facilities: Record<string, Facility>;
  items: Record<string, Item>;
  sites: Site[];
  map: { width: number; height: number; terrain: string[]; scenarioId?:"cross-era-basin-v1" };
  orders: Order[];
  receipts: Record<string, Receipt[]>;
  nextSeq: Record<string, number>;
  events: GameEvent[];
  nextId: number;
  winner: string | null;
  warnings: Warning[];
  convoys: Record<string, Convoy>;
  zones: Record<string, Zone>;
  /** Guest-only observation DTO. Never authoritative entities or checkpoint data. */
  contacts?: Pos[];
  vesselContacts?: Array<
    Pos & {
      id: string;
      name: string;
      owner: string;
      hp: number;
      maxHp: number;
      phase: "idle" | "loading" | "sailing" | "unloading" | "wreck";
    }
  >;
  crossings: Record<string, Crossing>;
  recoveries: Record<string, CareQueue>;
  movementTraces: Record<string, MovementTrace>;
  routeSurveys: Record<string, RouteSurvey>;
  patrolWatches: Record<string, PatrolWatch>;
  patrolReports: Record<string, PatrolReport>;
  traceContacts?: Pos[];
  shallowWater:Record<string,true>;shorePreparations:Record<string,ShorePreparation>;currentCrossings:Record<string,CurrentCrossing>;
  toolMetadata:Record<string,ToolMetadata>;toolJobs:Record<string,ToolJob>;mountLots:Record<string,MountLot>;mountJobs:Record<string,MountJob>;watchGear:Record<string,WatchGear>;watchJobs:Record<string,WatchJob>;borderReports:Record<string,BorderReport>;borderSurveys:Record<string,BorderSurvey>;
  protectionKits:Record<string,ProtectionKit>;armorFittings:Record<string,ArmorFitting>;equipmentServices:Record<string,EquipmentService>;
  fieldworkJobs:Record<string,FieldworkJob>;fieldworks:Record<string,Fieldwork>;repairKits:Record<string,FieldRepairKit>;faultMarks:Record<string,FaultMark>;
  worksiteSupports: Record<string, WorksiteSupport>;
  crops: Record<string, CropCycle>;
  infrastructureSites: Record<string, InfrastructureSite>;
  infrastructureWork: Record<string, InfrastructureJob>;
  nightRegions:Record<string,NightRegion>;darkShifts:Record<string,DarkShift>;dawnWatches:Record<string,DawnWatch>;dawnReports:Record<string,DawnReport>;
  scoutCredentials:Record<string,ScoutCredential>;nightPatrols:Record<string,NightPatrol>;nightReports:Record<string,NightReport>;personalNightSurveys:Record<string,PersonalNightSurvey>;nightBearingUses:Record<string,number>;
  relayMessages:Record<string,RelayMessage>;secondSignals:Record<string,SecondSignal>;relayDeliveries:Record<string,RelayDelivery>;witnessChainUses:Record<string,WitnessUse>;
  households:Record<string,Household>;civilianConsents:Record<string,CivilianConsent>;civilianJobs:Record<string,CivilianJob>;
  logisticsJobs: Record<string, LogisticsJob>;
  navalEffects: NavalEffect[];
  formationOrders:Record<string,FormationOrder>;
  garrisonPosts:Record<string,GarrisonPost>;
  garrisonReports:Record<string,GarrisonReport>;
  vegetation:Record<string,Vegetation>;
  livingBarriers:Record<string,LivingBarrier>;
  oldTrails:Record<string,OldTrail>;
  heroTrailSurveys:Record<string,HeroTrailSurvey>;
  trailProjects:Record<string,TrailProject>;
  scoutShadows:Record<string,ScoutShadow>;
  witnessedAttacks:Record<string,WitnessedAttack>;
  witnessFlares:Record<string,WitnessFlare>;
  preySites:Record<string,PreySite>;
  huntingJobs:Record<string,HuntingJob>;
  huntingReports:Record<string,HuntingReport>;
  charges:Record<string,ChargePlan>;
  attackPreparations?:AttackPreparation[];
  observedAttackers?:string[];
  chargeWarnings?:{id:string;target:string;origin:Pos;until:number}[];
  tacticalOrders: Record<string, TacticalOrder>;
  tacticalSignals?: TacticalSignal[];
  intelligenceReports: Record<string, IntelligenceReport>;
  intelligenceTasks: Record<string, IntelligenceTask>;
  movementPlans: Record<string, MovementPlan>;
  vessels: Record<string, Vessel>;
  seaHazards: Record<string, SeaHazard>;
}
export interface Warning {
  id: string;
  seat: string;
  power: "field" | "support";
  target: string;
  x: number;
  y: number;
  due: number;
}
export interface Recipe {
  id: string;
  name: string;
  cost: Stock;
  turns: number;
  facility: string;
  access: string[];
  supply: number;
  great: number;
  binding: number;
  kind:
    "component" | "hero" | "unit" | "research" | "item" | "ritual" | "vessel";
  provisional: boolean;
}
export interface Profile {
  id: string;
  faction: string;
  hero: string;
  category: string;
  field_power: {
    name: string;
    effect: string;
    cost: string;
    range: string;
    duration: string;
    counter: string;
  };
  support_power: Profile["field_power"];
  passive: { name: string; effect: string; limit: string };
  compensates: string;
  retained_weakness: string;
}
export const VERSION = `r6-sim-13-${CONTENT_FINGERPRINT}-protocol-2-save-2`;
export const stocks = (P = 0, M = 0, K = 0, E = 0): Stock => ({ P, M, K, E });
