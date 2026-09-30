import {militaryCapabilities} from "../content/military-production";
import {siegeAttackReason} from "./siege";
import { retreatMorale, refreshOrderlyFallback } from "./morale";
import {recordPatrolMovement} from "./patrols";
import type {Match,Pos,Unit} from './types';
import {activeEffects,sightline} from './effects';
import {observation,terrainObserved} from './visibility';
import {movementPenalty} from './conditions';
import {fatigue,fatigueMovementPenalty,travelFatigue} from './fatigue';
import {movementZonePenalty,crossZones} from './zones';
import {woodlandMovementCost,type MovementRouteFinder} from './movement-plans';
import {effectiveRelation} from './diplomacy';
interface DeclaredBase {id:string;owner:string;unit:string;createdTurn:number;createdRevision:number;until:number}
export type TacticalOrder =
 | (DeclaredBase & {kind:'fallback';route:Pos[];shielded:boolean})
 | (DeclaredBase & {kind:'pursuit'|'ranged-attack';target:string;origin:Pos})
 | (DeclaredBase & {kind:'grapple';target:string;origin:Pos;targetOrigin:Pos;phase:'warning'|'holding'})
 | (DeclaredBase & {kind:'drowsing';target:string;origin:Pos;targetOrigin:Pos;phase:'warning'|'active'});
export type TacticalRequest={kind:'fallback';unit:string;route:Pos[]}|{kind:'pursuit'|'ranged-attack';unit:string;target:string};
export type TacticalPower={mode:'signal-flash';unit:string;route:Pos[]}|{mode:'shielded-withdrawal';unit:string}|{mode:'grapple';target:string}|{mode:'drowsing-veil';target:string};
export type TacticalState=Match & {tacticalOrders:Record<string,TacticalOrder>;tacticalSignals?:TacticalSignal[]};
const distance=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const ordinary=(u:Unit)=>['company','worker','beast','construct'].includes(u.kind);
const bounded=(s:Match,p:Pos)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
const blocked=(s:Match,u:Unit,p:Pos)=>Object.values(s.units).some(v=>v.id!==u.id&&v.alive&&v.active&&distance(v,p)===0);
const unable=(s:Match,u:Unit)=>activeEffects(s,u).some(e=>['root','stunned','incapacitated'].includes(e.kind));
function routeReason(s:Match,seat:string,u:Unit,route:Pos[],path:MovementRouteFinder):string {
 if(route.length<2||route.length>128||route.some(p=>!bounded(s,p))||route.some((p,i)=>i>0&&distance(p,route[i-1])!==1))return 'Declare a bounded adjacent physical route';
 if(distance(u,route[0])!==0)return 'Party moved away from its declared fallback origin';
 if(grappleMovementBlocked(s as TacticalState,u.id))return 'Party is physically held by a maintained grapple';
 if(unable(s,u))return 'Party is physically unable to withdraw';
 if(route.some((p,i)=>i>0&&(!terrainObserved(s,seat,p)||blocked(s,u,p)||path(s,route[i-1],p,u)?.length!==2)))return 'Fallback has an unobserved or blocked route or exit';
 const allowance=Math.min(Math.max(1,u.move-movementPenalty(s,u)-fatigueMovementPenalty(s,u)),...activeEffects(s,u).filter(e=>e.kind==='move-limit').map(e=>e.value));
 const cost=route.length-1+woodlandMovementCost(s,u,route)+movementZonePenalty(s,u,route);
 return cost>allowance?'Fallback exceeds the normal movement allowance':'';
}
/** Provisional ordinary reaction model: one paid stationary pursuit attack can
 * threaten an adjacent retreat segment; it grants no movement or extra attack.
 * Caller reserves one ordinary operation per declaration, through the same
 * player command validator. IDs and route steps—not arrival time—order reactions. */
export function tacticalOrderReason(s:TacticalState,seat:string,a:TacticalRequest,path:MovementRouteFinder):string {
 const u=s.units[a.unit];if(!u?.alive||!u.active||!u.supplied||u.owner!==seat||!ordinary(u))return 'Owned supplied ordinary party required';
 if(Object.values(s.tacticalOrders).some(q=>q.unit===u.id))return 'Party already has a declared tactical order';
 if(a.kind==='fallback')return routeReason(s,seat,u,a.route,path);
 const target=s.units[a.target];
 if(!ordinary(u)||u.attack<1||unable(s,u)||activeEffects(s,u).some(e=>e.kind==='rout'))return 'An armed company capable of a normal attack is required';
 if(!target?.alive||!ordinary(target)||effectiveRelation(s,seat,target.owner)!=='war'||observation(s,seat,target)!=='identified')return 'Identify a living hostile ordinary party';
 if(a.kind==='ranged-attack'&&u.siege){const reason=siegeAttackReason(s,u);if(reason)return reason;}
 if(a.kind==='ranged-attack'&&distance(u,target)<=1)return 'Prepared ranged attack requires a target beyond adjacent melee';
 if(distance(u,target)>(a.kind==='ranged-attack'?(militaryCapabilities(s,u)?.rangedRange??2):2)||!sightline(s,u,target))return 'Reach the visible local pursuit approach';
 return '';
}
export function declareTacticalOrder(s:TacticalState,seat:string,a:TacticalRequest,path:MovementRouteFinder):TacticalOrder {
 const reason=tacticalOrderReason(s,seat,a,path);if(reason)throw new Error(reason);
 const base={id:`tactical:${s.nextId++}`,owner:seat,unit:a.unit,createdTurn:s.turn,createdRevision:s.revision,until:s.revision+2};
 const q:TacticalOrder=a.kind==='fallback'?{...base,kind:a.kind,route:structuredClone(a.route),shielded:false}:{...base,kind:a.kind,target:a.target,origin:{x:s.units[a.unit].x,y:s.units[a.unit].y}};
 s.tacticalOrders[q.id]=q;
 if(q.kind==='fallback'){const end=q.route.at(-1)!;s.units[q.unit].effects=s.units[q.unit].effects.filter(e=>e.kind!=='declared-fallback');s.units[q.unit].effects.push({kind:'declared-fallback',value:1,until:q.until,source:`fallback:${end.x}:${end.y}`});}
 return q;
}
export function tacticalPowerReason(s:TacticalState,seat:string,a:TacticalPower,path:MovementRouteFinder):string {
 const p=s.players[seat],h=p&&s.units[p.hero.id],u=s.units['target' in a?a.target:a.unit];
 if(!p||p.profile!==(a.mode==='drowsing-veil'?'irmo':a.mode==='grapple'?'tulkas':a.mode==='signal-flash'?'istari_star':'elf_fingolfin')||p.hero.status!=='living'||!h?.alive||!h.active||unable(s,h))return 'Living matching active hero required';
 if(p.hero.readiness<2)return 'Two readiness required';
 if(a.mode==='drowsing-veil'){
  if(!u?.alive||!u.active||u.kind!=='company'||effectiveRelation(s,seat,u.owner)!=='war'||observation(s,seat,u)!=='identified')return 'One identified hostile formation required';
  if(Math.hypot(h.x-u.x,h.y-u.y)>5||!sightline(s,h,u))return 'Formation must be in a visible local patch';
  if(Object.values(s.tacticalOrders).some(q=>q.kind==='drowsing'&&q.target===u.id))return 'Formation already has a prepared or active drowsing veil';
  return '';
 }
 if(a.mode==='grapple'){
  if(!u?.alive||!u.active||(u.flying&&!u.landed))return 'A living physically reachable grounded opponent is required';
  if(effectiveRelation(s,seat,u.owner)!=='war'||distance(h,u)!==1||observation(s,seat,u)!=='identified')return 'One identified adjacent hostile opponent required';
  if(Object.values(s.tacticalOrders).some(q=>q.unit===h.id))return 'Tulkas already occupies a declared action';
  if(h.effects.some(e=>e.kind==='grapple-attempt'&&e.source===`encounter:${s.turn}:${u.id}`))return 'Same opponent may be approached only once per encounter';
  if(activeEffects(s,u).some(e=>e.kind==='disable-grace'))return 'Target has hard-disable recovery grace';
  return '';
 }
 if(!u?.alive||u.owner!==seat||!ordinary(u)||observation(s,seat,u)!=='identified')return 'One visible owned ordinary party required';
 const q=Object.values(s.tacticalOrders).find(q=>q.kind==='fallback'&&q.unit===u.id&&q.owner===seat);
 if(!q||q.kind!=='fallback'||q.until<=s.revision)return 'An existing declared fallback is required';
 // 3m/tile; Star's15m is adopted. Fingolfin's unspecified command radius is provisional5tiles.
 const signalView:Match={...s,units:{[h.id]:h},facilities:{}};
 if(Math.hypot(h.x-u.x,h.y-u.y)>5||!sightline(s,h,u)||observation(signalView,seat,{x:u.x,y:u.y})!=='identified')return 'Party is outside the visible signal or command radius';
 if(a.mode==='shielded-withdrawal')return u.kind==='company'&&!u.flying?'':'Own grounded infantry company required';
 return routeReason(s,seat,u,a.route,path);
}
/** Pays only adopted2readiness. Caller spends tactical hero action/commitment. */
export function applyTacticalPower(s:TacticalState,seat:string,a:TacticalPower,path:MovementRouteFinder):void {
 const reason=tacticalPowerReason(s,seat,a,path);if(reason)throw new Error(reason);
 s.players[seat].hero.readiness-=2;
 if(a.mode==='drowsing-veil'){const h=s.units[s.players[seat].hero.id],u=s.units[a.target],id=`tactical:${s.nextId++}`;s.tacticalOrders[id]={id,owner:seat,unit:h.id,kind:'drowsing',target:u.id,origin:{x:h.x,y:h.y},targetOrigin:{x:u.x,y:u.y},phase:'warning',createdTurn:s.turn,createdRevision:s.revision,until:s.revision+3};return;}
 if(a.mode==='grapple'){const h=s.units[s.players[seat].hero.id],u=s.units[a.target],id=`tactical:${s.nextId++}`;s.tacticalOrders[id]={id,owner:seat,unit:h.id,kind:'grapple',target:u.id,origin:{x:h.x,y:h.y},targetOrigin:{x:u.x,y:u.y},phase:'warning',createdTurn:s.turn,createdRevision:s.revision,until:s.revision+3};h.effects.push({kind:'grapple-attempt',value:1,until:1000000,source:`encounter:${s.turn}:${u.id}`});return;}
 const q=Object.values(s.tacticalOrders).find(q=>q.kind==='fallback'&&q.unit===a.unit)!;
 if(q.kind==='fallback'){if(a.mode==='signal-flash'){q.route=structuredClone(a.route);const end=q.route.at(-1)!,e=s.units[q.unit].effects.find(e=>e.kind==='declared-fallback');if(e)e.source=`fallback:${end.x}:${end.y}`;}else q.shielded=true;}
}
export interface TacticalCallbacks {ranged?:(attacker:string,target:string)=>void;pursuit:(attacker:string,target:string,reductionPercent:number)=>void}
/** Invoke after ordinary counter-orders, before weekly processing. The parent
 * must expose a response phase while pending orders exist. Normal combat callback
 * handles armor, miss, casualties, wounds and interruption; no second damage model. */
export function resolveTacticalOrders(s:TacticalState,path:MovementRouteFinder,callbacks:TacticalCallbacks):void {
 // Explicit paid aim preparations resolve after counter-movement and ability
 // warnings. Two-tile range is the existing provisional ordinary weapon rule.
 for(const q of Object.values(s.tacticalOrders).filter(q=>q.kind==='ranged-attack'&&q.createdRevision<s.revision).sort((a,b)=>reactionDelay(s,a.unit)-reactionDelay(s,b.unit)||a.unit.localeCompare(b.unit))){if(q.kind!=='ranged-attack')continue;delete s.tacticalOrders[q.id];const u=s.units[q.unit],target=s.units[q.target];if(q.until<s.revision||q.createdTurn!==s.turn||!u?.alive||!u.active||!u.supplied||!target?.alive||!target.active||u.owner!==q.owner||distance(u,q.origin)!==0||unable(s,u)||activeEffects(s,u).some(e=>e.kind==='rout')||effectiveRelation(s,u.owner,target.owner)!=='war'||distance(u,target)<2||distance(u,target)>(militaryCapabilities(s,u)?.rangedRange??2)||observation(s,u.owner,target)!=='identified'||!sightline(s,u,target))continue;callbacks.ranged?.(u.id,target.id);}
 for(const u of Object.values(s.units))refreshOrderlyFallback(s,u);
 for(const [id,q] of Object.entries(s.tacticalOrders))if(q.kind==='grapple'){const h=s.units[q.unit],u=s.units[q.target];if(q.until<=s.revision||!h?.alive||!h.active||!u?.alive||!u.active||distance(h,q.origin)!==0||distance(u,q.targetOrigin)!==0||distance(h,u)!==1||unable(s,h)||effectiveRelation(s,q.owner,u.owner)!=='war'){releaseTacticalOrder(s,id);continue;}if(q.createdRevision<s.revision&&q.phase==='warning'){if(activeEffects(s,u).some(e=>e.kind==='disable-grace')){releaseTacticalOrder(s,id);continue;}q.phase='holding';u.effects.push({kind:'disable-grace',value:1,until:q.until+2,source:`grapple:${q.id}`});}}
 for(const [id,q] of Object.entries(s.tacticalOrders))if(q.kind==='drowsing'){const h=s.units[q.unit],u=s.units[q.target];if(q.until<=s.revision||!h?.alive||!h.active||!u?.alive||!u.active||distance(u,q.targetOrigin)>1||(q.phase==='warning'&&(distance(h,q.origin)!==0||unable(s,h)||!sightline(s,h,q.targetOrigin)))){delete s.tacticalOrders[id];continue;}if(q.createdRevision<s.revision)q.phase='active';}
 const ready=(q:TacticalOrder)=>q.createdRevision<s.revision;
 const retreats=Object.values(s.tacticalOrders).filter(q=>q.kind==='fallback'&&ready(q)).sort((a,b)=>a.unit.localeCompare(b.unit));
 for(const q of retreats){
  if(q.kind!=='fallback')continue;releaseTacticalOrder(s,q.id);const u=s.units[q.unit];
  if(!u?.alive||!u.active||!u.supplied||u.owner!==q.owner||q.until<s.revision||routeReason(s,q.owner,u,q.route,path))continue;
  const from={x:u.x,y:u.y};
  for(let i=1;i<q.route.length;i++){
   const at=q.route[i],previous=q.route[i-1];
   const reactions=Object.values(s.tacticalOrders).filter(r=>r.kind==='pursuit'&&r.createdRevision<=s.revision&&r.target===u.id).sort((a,b)=>reactionDelay(s,a.unit)-reactionDelay(s,b.unit)||a.unit.localeCompare(b.unit));
   for(const r of reactions){
    if(r.kind!=='pursuit')continue;const enemy=s.units[r.unit];
    if(!enemy?.alive||!enemy.active||!enemy.supplied||distance(enemy,r.origin)!==0||unable(s,enemy)||activeEffects(s,enemy).some(e=>['rout','pursuit-suppressed'].includes(e.kind))||effectiveRelation(s,r.owner,u.owner)!=='war'||observation(s,r.owner,u)!=='identified'||!sightline(s,enemy,u))continue;
    if(Math.min(distance(enemy,previous),distance(enemy,at))>1)continue;
    delete s.tacticalOrders[r.id];
    // Provisional counter interpretation: fresh troops have zero actual travel
    // fatigue; flanking attackers are not behind the current withdrawal vector.
    const trailing=(enemy.x-previous.x)*(at.x-previous.x)+(enemy.y-previous.y)*(at.y-previous.y)<0;
    const reduction=q.shielded&&trailing&&fatigue(s,enemy)>0?25:0;
    callbacks.pursuit(enemy.id,u.id,reduction);
    if(!u.alive||!u.active||u.hp<=0)break;
   }
   if(!u.alive||!u.active||u.hp<=0||unable(s,u)||distance(u,previous)!==0||blocked(s,u,at))break;
   const spent=q.route.slice(0,i+1);
   const remainingAllowance=Math.min(Math.max(1,u.move-movementPenalty(s,u)-fatigueMovementPenalty(s,u)),...activeEffects(s,u).filter(e=>e.kind==='move-limit').map(e=>e.value));
   if(i+woodlandMovementCost(s,u,spent)+movementZonePenalty(s,u,spent)>remainingAllowance)break;
   crossZones(s,u,[previous,at]);u.x=at.x;u.y=at.y;recordPatrolMovement(s,u,[previous,at]);
  }
  if(distance(from,u)>0){travelFatigue(s,u,from,u);const index=q.route.findIndex(p=>distance(p,u)===0);retreatMorale(s,u,q.route.slice(0,index+1));}
  u.effects=u.effects.filter(e=>e.kind!=="declared-fallback");
 }
 for(const [id,q] of Object.entries(s.tacticalOrders))if(q.until<=s.revision||q.createdTurn!==s.turn)releaseTacticalOrder(s,id);
}
export function validateTacticalOrders(s:TacticalState,guestSeat?:string):void {
 const units=new Set<string>();
 for(const [id,q] of Object.entries(s.tacticalOrders)){
  const u=s.units[q.unit];if(id!==q.id||!s.players[q.owner]||(guestSeat&&q.owner!==guestSeat)||!u||u.owner!==q.owner||((q.kind==='grapple'||q.kind==='drowsing')?u.kind!=='hero':!ordinary(u))||(q.kind!=='drowsing'&&units.has(u.id))||q.createdTurn!==s.turn||!Number.isInteger(q.createdRevision)||q.createdRevision<0||q.createdRevision>s.revision||q.until!==q.createdRevision+((q.kind==='grapple'||q.kind==='drowsing')?3:2)||q.until<s.revision)throw new Error('Invalid tactical order checkpoint');if(q.kind!=='drowsing')units.add(u.id);
  if(q.kind==='fallback'){if(q.route.length<2||q.route.length>128||q.route.some(p=>!bounded(s,p))||q.route.some((p,i)=>i>0&&distance(p,q.route[i-1])!==1)||typeof q.shielded!=='boolean'||(q.shielded&&s.players[q.owner].profile!=='elf_fingolfin'))throw new Error('Invalid fallback checkpoint');}
  else if(q.kind==='drowsing'){const target=s.units[q.target];if(s.players[q.owner].profile!=='irmo'||q.unit!==s.players[q.owner].hero.id||!bounded(s,q.origin)||!bounded(s,q.targetOrigin)||(!guestSeat&&!target)||(target&&target.kind!=='company')||!['warning','active'].includes(q.phase)||(q.phase==='active'&&q.createdRevision>=s.revision))throw new Error('Invalid drowsing veil');}
  else if(q.kind==='grapple'){const target=s.units[q.target];if(s.players[q.owner].profile!=='tulkas'||q.unit!==s.players[q.owner].hero.id||!bounded(s,q.origin)||!bounded(s,q.targetOrigin)||(!guestSeat&&!target)||(target&&target.flying&&!target.landed)||!['warning','holding'].includes(q.phase)||(q.phase==='holding'&&q.createdRevision>=s.revision))throw new Error('Invalid maintained grapple');}
  else if(!['pursuit','ranged-attack'].includes(q.kind)||!bounded(s,q.origin)||(!guestSeat&&!s.units[q.target])||!ordinary(u)||u.attack<1)throw new Error('Invalid prepared attack checkpoint');
  if(q.kind==='ranged-attack'&&s.players[q.owner].operations>2)throw new Error('Unpaid prepared ranged attack');
 }
}

function activeHold(s:TacticalState,q:Extract<TacticalOrder,{kind:'grapple'}>):boolean {const h=s.units[q.unit],u=s.units[q.target];return q.until>s.revision&&!!h?.alive&&h.active&&!!u?.alive&&u.active&&distance(h,q.origin)===0&&distance(u,q.targetOrigin)===0&&distance(h,u)===1&&!unable(s,h);}
/** Physical restraint is not captivity and never occupies another hero slot. */
export function grappleMovementBlocked(s:TacticalState,id:string):boolean {
 return Object.values(s.tacticalOrders??{}).some(q=>q.kind==='grapple'&&q.phase==='holding'&&activeHold(s,q)&&q.target===id)||(s.tacticalSignals??[]).some(q=>q.kind==='grapple'&&q.phase==='holding'&&q.until>s.revision&&q.target===id);
}
export function grappleOccupiesHero(s:TacticalState,id:string):boolean {
 return Object.values(s.tacticalOrders??{}).some(q=>q.kind==='grapple'&&q.phase==='holding'&&activeHold(s,q)&&q.unit===id);
}
export function releaseTacticalOrder(s:TacticalState,id:string):void {
 const q=s.tacticalOrders[id];
 if(q?.kind==='fallback'&&s.units[q.unit])s.units[q.unit].effects=s.units[q.unit].effects.filter(e=>e.kind!=='declared-fallback');
 if(q?.kind==='grapple'&&q.phase==='holding'){
  const u=s.units[q.target],grace=u?.effects.find(e=>e.kind==='disable-grace'&&e.source===`grapple:${q.id}`);
  if(grace)grace.until=s.revision+2;
  else if(u?.alive)u.effects.push({kind:'disable-grace',value:1,until:s.revision+2,source:`grapple:${q.id}`});
 }
 delete s.tacticalOrders[id];
}
export function interruptGrappleOnDamage(s:TacticalState,id:string,hit:number):void {
 if(!Number.isFinite(hit)||hit<=0)return;
 for(const [key,q] of Object.entries(s.tacticalOrders??{}))if((q.kind==='grapple'&&(q.unit===id||q.target===id))||(q.kind==='drowsing'&&q.unit===id))releaseTacticalOrder(s,key);
}

/** Drowsing changes reaction ordering, never ownership, movement budget or the
 * ability to act. Patch radius1tile and local5tile cast range are provisional. */
export function reactionDelay(s:TacticalState,id:string):number {
 const u=s.units[id];return u&&Object.values(s.tacticalOrders).some(q=>q.kind==='drowsing'&&q.phase==='active'&&q.target===id&&q.until>s.revision&&distance(u,q.targetOrigin)<=1)?1:0;
}
export function tacticalPartyBusy(s:TacticalState,id:string):boolean {return Object.values(s.tacticalOrders).some(q=>q.kind!=='drowsing'&&q.unit===id);}
export function tacticalAlarmReason(s:TacticalState,seat:string,unit:string,target:string):string {
 const u=s.units[unit],v=s.units[target];if(!u?.alive||!u.active||u.owner!==seat||unable(s,u)||!v?.alive||distance(u,v)>1)return 'Active owned alarm raiser beside a living formation required';
 if(v.owner!==seat&&!(s.players[seat]?.relations[v.owner]==='alliance'&&s.players[v.owner]?.relations[seat]==='alliance'))return 'Alarm target must be own or mutually allied';
 return (Object.values(s.tacticalOrders).some(q=>q.kind==='drowsing'&&q.target===target)||(s.tacticalSignals??[]).some(q=>q.kind==='drowsing'&&q.target===target&&q.until>s.revision))?'':'No prepared or active drowsing veil to counter';
}
/** Caller validates/spends one ordinary operation; no magical cure or heal. */
export function raiseTacticalAlarm(s:TacticalState,seat:string,unit:string,target:string):void {const reason=tacticalAlarmReason(s,seat,unit,target);if(reason)throw new Error(reason);for(const[id,q]of Object.entries(s.tacticalOrders))if(q.kind==='drowsing'&&q.target===target)delete s.tacticalOrders[id];if(s.tacticalSignals)s.tacticalSignals=s.tacticalSignals.filter(q=>q.kind!=='drowsing'||q.target!==target);}

export interface TacticalSignal {id:string;kind:'grapple'|'drowsing';target:string;phase:'warning'|'holding'|'active';origin:Pos;until:number}
/** Guest contact contains only the observed affected position, never the caster
 * origin, identity, allegiance, route or another hidden entity identifier. */
export function projectTacticalSignals(s:TacticalState,seat:string):TacticalSignal[] {
 const result:TacticalSignal[]=[];
 for(const q of Object.values(s.tacticalOrders))if((q.kind==='grapple'||q.kind==='drowsing')&&q.owner!==seat&&q.until>s.revision){const u=s.units[q.target];if(!u||observation(s,seat,u)!=='identified')continue;result.push({id:q.id,kind:q.kind,target:u.id,phase:q.phase,origin:{...q.targetOrigin},until:q.until});}
 return result;
}

/** Minimal identified attack intent toward this seat or a mutually allied party.
 * No enemy fallback route, hidden target identity or unseen preparer is exposed. */
export interface AttackPreparation {unit:string;target:string;kind:'pursuit'|'ranged-attack';until:number}
export function projectAttackPreparations(s:Match,seat:string):AttackPreparation[]{return Object.values(s.tacticalOrders).filter((q):q is Extract<TacticalOrder,{origin:Pos}>&{kind:'pursuit'|'ranged-attack'}=>{if(q.kind!=='pursuit'&&q.kind!=='ranged-attack')return false;const u=s.units[q.unit],target=s.units[q.target];return q.until>s.revision&&!!u?.alive&&!!target?.alive&&effectiveRelation(s,seat,target.owner)==='alliance'&&observation(s,seat,u)==='identified'&&observation(s,seat,target)==='identified';}).map(q=>({unit:q.unit,target:q.target,kind:q.kind,until:q.until}));}
