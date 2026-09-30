import type {Match,Pos,Unit} from './types';
import {activeEffects,sightline} from './effects';
import {observation,terrainObserved} from './visibility';
import {factionProduction} from '../content/production';
import {effectiveRelation} from './diplomacy';
import {movementPenalty} from './conditions';
import {fatigueMovementPenalty,travelFatigue} from './fatigue';
import {woodlandMovementCost,type MovementRouteFinder} from './movement-plans';
import {movementZonePenalty,crossZones} from './zones';
export type ChargeMode='hunter-interception'|'relief-charge'|'split-pursuit';
export interface ChargeRequest {mode:ChargeMode;target:string;members:{unit:string;route:Pos[]}[]}
export interface ChargePlan extends ChargeRequest {id:string;owner:string;hero:string;origin:Pos;targetOrigin:Pos;createdTurn:number;createdRevision:number;until:number}
export type ChargeState=Match&{charges:Record<string,ChargePlan>;observedAttackers?:string[]};
const profiles:Record<ChargeMode,string>={'hunter-interception':'orome','relief-charge':'human_rohan','split-pursuit':'wolf_pack'};
const distance=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const terrain=(s:Match,p:Pos)=>s.map.terrain[p.y*s.map.width+p.x];
const bounded=(s:Match,p:Pos)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
const unable=(s:Match,u:Unit)=>activeEffects(s,u).some(e=>['root','stunned','incapacitated','rout'].includes(e.kind));
/** Ordinary group charges combine one normal move and one normal attack in one
 * paid charge operation. This action economy is provisional; adopted field
 * readiness2 and Wolf's two normal movement actions remain exact. */
export const chargeOperationCost=(a:Pick<ChargeRequest,'mode'>)=>a.mode==='hunter-interception'?0:a.mode==='relief-charge'?1:2;
export function isChargeMember(s:ChargeState,id:string):boolean {return Object.values(s.charges??{}).some(q=>q.hero===id||q.members.some(m=>m.unit===id));}
function defended(s:Match,target:Unit,seat:string,knownOnly:boolean):boolean {
 return activeEffects(s,target).some(e=>e.kind==='braced')||Object.values(s.facilities).some(f=>f.hp>0&&(!knownOnly||observation(s,seat,f)==='identified')&&f.owner===target.owner&&['barricade','cover','siege-brace'].includes(f.kind)&&distance(f,target)<=1);
}
function isolated(s:Match,target:Unit,seat:string,knownOnly:boolean):boolean {
 return !Object.values(s.units).some(u=>u.id!==target.id&&(!knownOnly||observation(s,seat,u)==='identified')&&u.alive&&u.active&&u.attack>0&&distance(u,target)<=2&&(u.owner===target.owner||effectiveRelation(s,u.owner,target.owner)==='alliance'))&&!Object.values(s.crossings).some(c=>c.phase==='ready'&&(!knownOnly||c.tiles.some(p=>terrainObserved(s,seat,p)))&&c.owner===target.owner&&c.tiles.some(p=>distance(p,target)<=1));
}
function inspect(s:ChargeState,seat:string,a:ChargeRequest,path:MovementRouteFinder,resolving=false):string {
 const p=s.players[seat],h=p&&s.units[p.hero.id],target=s.units[a.target];
 if(!p||p.profile!==profiles[a.mode]||p.hero.status!=='living'||!h?.alive||!h.active||unable(s,h))return 'Living active matching hero required';
 if(!resolving&&isChargeMember(s,h.id))return 'Hero already directs a charge preparation';
 if(!resolving&&p.hero.readiness<2)return 'Two readiness required';
 if(!target?.alive||!target.active||(a.mode!=='hunter-interception'&&target.kind!=='company')||target.flying&&!target.landed||effectiveRelation(s,seat,target.owner)!=='war'||observation(s,seat,target)!=='identified')return 'One identified hostile grounded company required';
 if(defended(s,target,seat,!resolving))return 'Braced formation or built defenses counter this approach';
 if(a.mode==='hunter-interception'&&!Object.values(s.tacticalOrders).some(q=>(q.kind==='pursuit'||q.kind==='ranged-attack')&&q.unit===target.id)&&!(!resolving&&s.observedAttackers?.includes(target.id)))return 'Interception requires a genuinely prepared attacking formation';
 if(a.mode==='relief-charge'){
  const owner=s.players[target.owner];if(!owner||factionProduction(owner.profile).unit.kind!=='company'||factionProduction(owner.profile).unit.traits.includes('rider'))return 'Relief Charge targets exposed ordinary infantry, not mounted or other bodies';
 }
 if(a.mode==='split-pursuit'&&!isolated(s,target,seat,!resolving))return 'Close support or a defended crossing prevents isolation';
 const count=a.mode==='split-pursuit'?2:1;
 if(a.members.length!==count||new Set(a.members.map(m=>m.unit)).size!==count)return `Select exactly ${count} distinct normal movement participants`;
 const endpoints:Pos[]=[];
 for(const m of a.members){
  const u=s.units[m.unit],route=m.route;
  if(!u?.alive||!u.active||!u.supplied||u.owner!==seat||unable(s,u)||(u.flying&&!u.landed))return 'Participants must be active supplied grounded parties';
  if(a.mode==='hunter-interception'?u.id!==h.id:u.kind!==factionProduction(p.profile).unit.kind)return 'Participant does not match this profile army identity';
  if(!resolving&&isChargeMember(s,u.id))return 'Participant already occupies a charge preparation';
  // Command/howling radius5tiles is provisional; physical approach uses normal movement.
  if(Math.hypot(h.x-u.x,h.y-u.y)>5||!sightline(s,h,u))return 'Party must remain in local command or howling range';
  if(route.length<2||route.length>128||route.some(at=>!bounded(s,at))||distance(u,route[0])!==0||route.some((at,i)=>i>0&&distance(at,route[i-1])!==1))return 'Declare an adjacent traversable route from the actual party position';
  const end=route.at(-1)!;if(distance(end,target)!==1)return 'Charge lane must end physically adjacent to the target';
  if(route.slice(1).some((at,i)=>!terrainObserved(s,seat,at)||path(s,route[i],at,u)?.length!==2||Object.values(s.units).some(v=>v.id!==u.id&&(resolving||observation(s,seat,v)==='identified')&&v.alive&&v.active&&distance(v,at)===0)))return 'A party or impassable tile blocks the real route';
  if(a.mode!=='split-pursuit'&&(route.some(at=>!['plain','meadow'].includes(terrain(s,at)))||!(route.every(at=>at.x===route[0].x)||route.every(at=>at.y===route[0].y))))return 'Normal charges require a straight open approach; broken ground counters them';
  const allowance=Math.min(Math.max(1,u.move-movementPenalty(s,u)-fatigueMovementPenalty(s,u)),...activeEffects(s,u).filter(e=>e.kind==='move-limit').map(e=>e.value));
  if(route.length-1+woodlandMovementCost(s,u,route)+movementZonePenalty(s,u,route)>allowance)return 'Declared route exceeds normal movement allowance';
  endpoints.push(end);
 }
 if(a.mode==='split-pursuit'&&distance(endpoints[0],endpoints[1])<2)return 'Wolf groups must approach from different passable directions';
 return '';
}
export const chargeReason=(s:ChargeState,seat:string,a:ChargeRequest,path:MovementRouteFinder)=>inspect(s,seat,a,path);
/** Caller reserves ordinary operations and tactical hero commitment separately. */
export function prepareCharge(s:ChargeState,seat:string,a:ChargeRequest,path:MovementRouteFinder):ChargePlan {
 const reason=chargeReason(s,seat,a,path);if(reason)throw new Error(reason);const p=s.players[seat],h=s.units[p.hero.id],target=s.units[a.target],id=`charge:${s.nextId++}`;p.hero.readiness-=2;
 const q:ChargePlan={mode:a.mode,target:a.target,members:structuredClone(a.members),id,owner:seat,hero:h.id,origin:{x:h.x,y:h.y},targetOrigin:{x:target.x,y:target.y},createdTurn:s.turn,createdRevision:s.revision,until:s.revision+2};s.charges[id]=q;return q;
}
export interface ChargeCallbacks {/** True only when intended target actually receives the normal hit. */attack:(attacker:string,target:string)=>boolean;moved?:(unit:Unit,route:Pos[])=>void}
/** Call after counter-orders but before prepared pursuits. No pursuit damage or
 * casualties are invented here: engine normal combat owns its attack callback. */
export function resolveCharges(s:ChargeState,path:MovementRouteFinder,callbacks:ChargeCallbacks):void {
 for(const q of Object.values(s.charges).sort((a,b)=>a.hero.localeCompare(b.hero)||a.id.localeCompare(b.id))){
  if(q.createdRevision>s.revision||(q.createdRevision===s.revision&&q.mode!=='hunter-interception'))continue;delete s.charges[q.id];const h=s.units[q.hero],target=s.units[q.target];
  if(q.createdTurn!==s.turn||q.until<s.revision||!h||!target||distance(h,q.origin)!==0||distance(target,q.targetOrigin)!==0||inspect(s,q.owner,q,path,true))continue;
  for(const m of q.members){const u=s.units[m.unit],from={x:u.x,y:u.y};crossZones(s,u,m.route);const end=m.route.at(-1)!;u.x=end.x;u.y=end.y;travelFatigue(s,u,from,u);callbacks.moved?.(u,m.route);}
  if(q.mode==='split-pursuit'){
   target.effects=target.effects.filter(e=>e.kind!=='split-pursuit');target.effects.push({kind:'split-pursuit',value:25,until:s.revision+2,source:q.id});continue;
  }
  const hit=callbacks.attack(q.members[0].unit,target.id);if(!hit)continue;
  for(const [id,order] of Object.entries(s.tacticalOrders))if((order.kind==='pursuit'||order.kind==='ranged-attack')&&order.unit===target.id)delete s.tacticalOrders[id];
  if(target.alive)target.effects.push({kind:q.mode==='relief-charge'?'pursuit-suppressed':'move-limit',value:1,until:s.revision+2,source:q.id});
 }
}
/** Provisional Wolf pursuit magnitude; nonstacking25% only on pursuit damage. */
export function pursuitDamagePenalty(s:Match,u:Unit):number {return Math.max(0,...activeEffects(s,u).filter(e=>e.kind==='split-pursuit').map(e=>e.value));}
export function interruptChargesOnDamage(s:ChargeState,id:string,hit:number):void {if(!Number.isFinite(hit)||hit<=0)return;for(const [key,q] of Object.entries(s.charges??{}))if(q.hero===id||q.members.some(m=>m.unit===id))delete s.charges[key];}
export function validateChargeState(s:ChargeState,guestSeat?:string):void {
 const participants=new Set<string>(),heroes=new Set<string>();
 for(const [id,q] of Object.entries(s.charges)){
  const p=s.players[q.owner],h=s.units[q.hero];
  if(id!==q.id||!p||(guestSeat&&q.owner!==guestSeat)||p.profile!==profiles[q.mode]||!h||h.id!==p.hero.id||q.createdTurn!==s.turn||q.createdRevision<0||q.createdRevision>s.revision||q.until!==q.createdRevision+2||q.until<s.revision||!bounded(s,q.origin)||!bounded(s,q.targetOrigin)||(!guestSeat&&!s.units[q.target])||q.members.length!==(q.mode==='split-pursuit'?2:1))throw new Error('Invalid charge checkpoint');
  if(p.commitment!==0||!p.encounter||p.operations>3-chargeOperationCost(q))throw new Error("Unpaid charge budget checkpoint");
  if(heroes.has(q.hero))throw new Error("Duplicate charge director");heroes.add(q.hero);
  for(const m of q.members){const u=s.units[m.unit];if(!u||u.owner!==q.owner||participants.has(u.id)||(q.mode==='hunter-interception'?u.id!==h.id:u.kind!==factionProduction(p.profile).unit.kind)||m.route.length<2||m.route.length>128||m.route.some(at=>!bounded(s,at))||m.route.some((at,i)=>i>0&&distance(at,m.route[i-1])!==1)||distance(m.route.at(-1)!,q.targetOrigin)!==1)throw new Error('Invalid charge participant route');participants.add(u.id);}
 }
}
