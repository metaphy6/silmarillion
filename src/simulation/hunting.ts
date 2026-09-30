import type {Match,Pos,Unit} from './types';
import {observation,terrainObserved} from './visibility';
import {activeEffects} from './effects';
import {effectiveRelation} from './diplomacy';
import {woodlandMovementCost,type MovementRouteFinder} from './movement-plans';
import {movementPenalty} from './conditions';
import {fatigueMovementPenalty,travelFatigue} from './fatigue';
import {movementZonePenalty,crossZones} from './zones';
export interface PreySite extends Pos {id:string;habitat:'woodland'|'meadow';initial:number;remaining:number;harvested:number;yieldP:number}
export type HuntingRequest={mode:'hunt';unit:string;prey:string;amount:number;route:Pos[]}|{mode:'survey';unit:string;route:Pos[]};
export type HuntingJob=HuntingRequest&{id:string;owner:string;turn:number;revision:number;origin:Pos};
export interface HuntingReport {id:string;owner:string;turn:number;revision:number;route:Pos[];prey:{site:string;x:number;y:number;remaining:number}[];danger:Pos[];uncertainty:string}
export type HuntingState=Match&{preySites:Record<string,PreySite>;huntingJobs:Record<string,HuntingJob>;huntingReports:Record<string,HuntingReport>};
const distance=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const bounded=(s:Match,p:Pos)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
const habitat=(s:Match,p:Pos)=>s.map.terrain[p.y*s.map.width+p.x];
/** Scenario-author supplied finite inventory. No regeneration or procedural stock grant. */
export function initializePrey(s:HuntingState,sites:PreySite[]):void {const pending={...s.preySites};for(const q of sites){if(pending[q.id])throw new Error('Prey site already authored');pending[q.id]=structuredClone(q);}validateHunting({...s,preySites:pending});s.preySites=pending;}
export function huntingBusy(s:HuntingState,unit:string):boolean{return Object.values(s.huntingJobs).some(q=>q.unit===unit);}
export function huntingReason(s:HuntingState,seat:string,a:HuntingRequest,path:MovementRouteFinder,resolving=false):string {
 const p=s.players[seat],u=s.units[a.unit];if(!p||!u?.alive||!u.active||!u.supplied||u.owner!==seat||activeEffects(s,u).some(e=>['root','stunned','incapacitated','rout'].includes(e.kind)))return 'An active supplied mobile owned hunting party is required';
 if(!resolving&&huntingBusy(s,u.id))return 'Party already has a hunting assignment';
 if(a.mode==='survey'){
  if(p.profile!=='wolf_pack'||p.hero.status!=='living'||u.id!==p.hero.id)return 'Wolf hero must personally traverse the habitat';
  if(!resolving&&(p.hero.readiness<3||p.stock.P<2))return 'Survey requires three readiness and two Provisions';
 }else{
  const site=s.preySites[a.prey];if(!site||observation(s,seat,site)==='hidden'||site.remaining<1)return 'Observe an existing nonempty prey site';
  if(!['company','beast'].includes(u.kind)||!Number.isInteger(a.amount)||a.amount<1||a.amount>2)return 'One ordinary hunting party may harvest at most two animals per order (provisional)';
  if(distance(a.route.at(-1)??u,site)!==0)return 'Hunting route must reach the prey site';
  if(Object.values(s.units).some(v=>v.alive&&v.active&&v.attack>0&&effectiveRelation(s,seat,v.owner)==='war'&&distance(v,site)<=1&&(resolving||observation(s,seat,v)==='identified')))return 'Armed defenders prevent this hunt';
 }
 const route=a.route;if(route.length<(a.mode==='hunt'?1:2)||route.length>128||distance(u,route[0])!==0||route.some((at,i)=>!bounded(s,at)||i>0&&distance(at,route[i-1])!==1))return 'Declare a real adjacent route from the party position';
 if(a.mode==='survey'&&(!['woodland','meadow'].includes(habitat(s,route[0]))||route.some(at=>habitat(s,at)!==habitat(s,route[0]))))return 'Survey one connected woodland or meadow habitat';
 if(route.slice(1).some((at,i)=>!terrainObserved(s,seat,at)||path(s,route[i],at,u)?.length!==2||Object.values(s.units).some(v=>v.id!==u.id&&v.alive&&v.active&&distance(v,at)===0&&(resolving||observation(s,seat,v)==='identified'))))return 'A blocked or unobserved route prevents travel';
 const allowance=Math.min(Math.max(1,u.move-movementPenalty(s,u)-fatigueMovementPenalty(s,u)),...activeEffects(s,u).filter(e=>e.kind==='move-limit').map(e=>e.value));
 return route.length-1+woodlandMovementCost(s,u,route)+movementZonePenalty(s,u,route)>allowance?'Route exceeds normal movement allowance':'';
}
/** Caller reserves one ordinary operation for hunt, or weekly hero commitment for survey. */
export function prepareHunting(s:HuntingState,seat:string,a:HuntingRequest,path:MovementRouteFinder):HuntingJob {
 const reason=huntingReason(s,seat,a,path);if(reason)throw new Error(reason);const u=s.units[a.unit],id=`hunt:${s.nextId++}`;
 if(a.mode==='survey'){s.players[seat].hero.readiness-=3;s.players[seat].stock.P-=2;}
 const request:HuntingRequest=a.mode==='survey'?{mode:a.mode,unit:a.unit,route:structuredClone(a.route)}:{mode:a.mode,unit:a.unit,route:structuredClone(a.route),prey:a.prey,amount:a.amount};const q:HuntingJob={...request,id,owner:seat,turn:s.turn,revision:s.revision,origin:{x:u.x,y:u.y}};s.huntingJobs[id]=q;return q;
}
/** Weekly resolution, rotating seat priority then stable actor ID, never arrival timing. */
export function resolveHunting(s:HuntingState,path:MovementRouteFinder,moved?:(unit:Unit,route:Pos[])=>void):void {
 const seats=Object.keys(s.players).sort(),priority=(owner:string)=>(seats.indexOf(owner)+s.turn)%seats.length;
 for(const q of Object.values(s.huntingJobs).sort((a,b)=>priority(a.owner)-priority(b.owner)||a.unit.localeCompare(b.unit))){
  delete s.huntingJobs[q.id];const u=s.units[q.unit];if(!u||distance(u,q.origin)!==0||huntingReason(s,q.owner,q,path,true))continue;
  const prey:HuntingReport['prey']=[],danger:Pos[]=[];
  for(const point of q.route.slice(1)){u.x=point.x;u.y=point.y;
   if(q.mode==='survey'){
    for(const site of Object.values(s.preySites))if(distance(site,u)<=2&&habitat(s,site)===habitat(s,u)&&observation({...s,units:{[u.id]:u},facilities:{}},q.owner,site)!=='hidden'&&!prey.some(p=>p.site===site.id))prey.push({site:site.id,x:site.x,y:site.y,remaining:site.remaining});
    for(const enemy of Object.values(s.units))if(enemy.alive&&enemy.active&&effectiveRelation(s,q.owner,enemy.owner)==='war'&&observation({...s,units:{[u.id]:u},facilities:{}},q.owner,enemy)!=='hidden'&&!danger.some(p=>distance(p,enemy)===0))danger.push({x:enemy.x,y:enemy.y});
   }
  }
  if(q.route.length>1){crossZones(s,u,q.route);travelFatigue(s,u,q.origin,u);moved?.(u,q.route);}
  if(q.mode==='hunt'){const site=s.preySites[q.prey],amount=Math.min(q.amount,site.remaining);site.remaining-=amount;site.harvested+=amount;s.players[q.owner].stock.P+=amount*site.yieldP;}
  else{const id=`hunt-report:${s.nextId++}`;s.huntingReports[id]={id,owner:q.owner,turn:s.turn,revision:s.revision,route:structuredClone(q.route),prey,danger,uncertainty:'Observed along the physically traversed habitat only; prey and dangers may change after this dated report.'};const old=Object.values(s.huntingReports).filter(r=>r.owner===q.owner);for(const r of old.slice(0,Math.max(0,old.length-64)))delete s.huntingReports[r.id];}
 }
}
export function interruptHunting(s:HuntingState,unit:string,hit:number):void{if(hit>0)for(const[id,q]of Object.entries(s.huntingJobs))if(q.unit===unit)delete s.huntingJobs[id];}
export function validateHunting(s:HuntingState,guestSeat?:string):void {
 for(const[id,q]of Object.entries(s.preySites))if(id!==q.id||!bounded(s,q)||habitat(s,q)!==q.habitat||![q.initial,q.remaining,q.harvested,q.yieldP].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100000)||q.initial!==q.remaining+q.harvested||q.yieldP<1)throw new Error('Invalid finite prey inventory');
 const units=new Set<string>();for(const[id,q]of Object.entries(s.huntingJobs)){const p=s.players[q.owner],u=s.units[q.unit];if(id!==q.id||!p||!u||u.owner!==q.owner||units.has(u.id)||(guestSeat&&q.owner!==guestSeat)||q.turn!==s.turn||q.revision<0||q.revision>s.revision||q.route.length<(q.mode==='hunt'?1:2)||q.route.length>128||q.route.some((p,i)=>!bounded(s,p)||i>0&&distance(p,q.route[i-1])!==1)||distance(q.origin,q.route[0])!==0||(q.mode==='survey'?(p.profile!=='wolf_pack'||u.id!==p.hero.id):((!guestSeat&&!s.preySites[q.prey])||!Number.isInteger(q.amount)||q.amount<1||q.amount>2)))throw new Error('Invalid hunting assignment');if(q.mode==='survey'?p.commitment!==0:p.operations>2)throw new Error('Unpaid hunting assignment');units.add(u.id);}
 const counts:Record<string,number>={};for(const[id,r]of Object.entries(s.huntingReports)){counts[r.owner]=(counts[r.owner]??0)+1;if(id!==r.id||!s.players[r.owner]||(guestSeat&&r.owner!==guestSeat)||r.turn<1||r.turn>s.turn||r.revision<0||r.revision>s.revision||counts[r.owner]>64||r.route.length>128||r.route.some(p=>!bounded(s,p))||r.danger.some(p=>!bounded(s,p))||r.prey.some(p=>!bounded(s,p)||!Number.isSafeInteger(p.remaining)||p.remaining<0))throw new Error('Invalid dated hunting report');}
}
