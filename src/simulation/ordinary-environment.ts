import type {Match,Pos,Stock,Unit} from './types';
import {createBasinScenario} from '../content/scenario';
import {recordGroveLogging} from './local-knowledge';
import {activeEffects} from './effects';
export interface WaterChannel extends Pos{flow:'north'|'east'|'south'|'west'|'still';depth:1|2}
export interface LoggingJob{id:string;owner:string;worker:string;vegetation:string;facility:string;started:number;lastProgress:number;remaining:1;status:'working'|'lost';yieldM:10}
export type OrdinaryEnvironmentState=Match&{waterChannels?:Record<string,WaterChannel>;loggingJobs?:Record<string,LoggingJob>;loggedVegetation?:Record<string,true>};
export type LoggingAction={kind:'logging';worker:string;vegetation:string;facility:string};
const d=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const able=(s:Match,u:Unit|undefined)=>!!u?.alive&&u.active&&u.supplied&&!activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind));
export function initializeWaterChannels(s:OrdinaryEnvironmentState):void{
 s.waterChannels??={};if(s.map.scenarioId!=='cross-era-basin-v1'||s.map.width!==s.map.height)return;
 for(const[id,q]of Object.entries(createBasinScenario(s.map.width).waterChannels))if(s.map.terrain[q.y*s.map.width+q.x]==='water'&&!s.waterChannels[id])s.waterChannels[id]={...q};
}
/** Provisional current shallow hull draft: class1 light, class2 with a passenger
 *or more than10cargo. No depth guarantee is fabricated for unmarked water. */
export function ordinaryVesselDraft(v:{cargo:Stock;passenger:string|null}):1|2{return v.passenger||Object.values(v.cargo).reduce((n,x)=>n+x,0)>10?2:1;}
export function draftRouteReason(s:OrdinaryEnvironmentState,v:{cargo:Stock;passenger:string|null},route:Pos[]):string{
 return route.some(p=>{const q=s.waterChannels?.[`${p.x},${p.y}`];return q&&s.map.terrain[p.y*s.map.width+p.x]==='water'&&q.depth<ordinaryVesselDraft(v);})?'Known channel depth is below the vessel loaded draft':'';
}
export function loggingReason(s:OrdinaryEnvironmentState,owner:string,worker:string,vegetation:string,facility:string):string{
 const p=s.players[owner],u=s.units[worker],v=s.vegetation[vegetation],f=s.facilities[facility];
 if(!p||p.eliminated||!able(s,u)||u.owner!==owner||u.kind!=='worker')return 'Own active supplied logging worker required';
 if(!v?.mature||s.loggedVegetation?.[vegetation]||d(u,v)!==1)return 'Adjacent existing mature unconsumed tree required';
 if(!f||f.owner!==owner||f.hp<=0||f.workers<1||d(f,v)>3)return 'Nearby staffed owned receiving worksite required';
 if(Object.values(s.loggingJobs??{}).some(q=>q.status==='working'&&(q.worker===worker||q.vegetation===vegetation)))return 'Tree or worker already reserved for logging';
 if(p.stock.M>999990)return 'Make room for the finite material yield before logging';
 if(p.operations<1||p.stock.P<5||p.stock.M<2)return 'One operation,5P rations and2M tools required';
 return '';
}
/** Provisional finite ordinary harvest:5P2M, one worker operation, one staffed
 * weekly advance,10M output. Existing mature vegetation is consumed exactly once.
 * Hero inspection never produces these materials; Ent receives only the event. */
export function startLogging(s:OrdinaryEnvironmentState,owner:string,worker:string,vegetation:string,facility:string):string{
 const reason=loggingReason(s,owner,worker,vegetation,facility);if(reason)throw new Error(reason);const p=s.players[owner];p.stock.P-=5;p.stock.M-=2;p.operations--;const id=`logging:${s.nextId++}`;s.loggingJobs??={};for(const [old,q]of Object.entries(s.loggingJobs))if(q.vegetation===vegetation&&q.status==='lost')delete s.loggingJobs[old];s.loggingJobs[id]={id,owner,worker,vegetation,facility,started:s.turn,lastProgress:s.turn-1,remaining:1,status:'working',yieldM:10};return id;
}
export const loggingWorkerBusy=(s:OrdinaryEnvironmentState,worker:string)=>Object.values(s.loggingJobs??{}).some(q=>q.worker===worker&&q.status==='working');
export function progressLogging(s:OrdinaryEnvironmentState):void{
 s.loggedVegetation??={};for(const[id,q]of Object.entries(s.loggingJobs??{})){
  if(q.status!=='working'||q.lastProgress>=s.turn)continue;const u=s.units[q.worker],v=s.vegetation[q.vegetation],f=s.facilities[q.facility];
  if(!u?.alive||u.kind!=='worker'||u.owner!==q.owner||!v?.mature||s.loggedVegetation[q.vegetation]||!f||f.hp<=0||f.owner!==q.owner){q.status='lost';continue;}
  if(!able(s,u)||d(u,v)!==1||f.workers<1||d(f,v)>3||s.players[q.owner].stock.M>999990)continue;
  q.lastProgress=s.turn;recordGroveLogging(s,q.vegetation,u,v);v.mature=false;v.altered=true;s.loggedVegetation[q.vegetation]=true;s.players[q.owner].stock.M+=q.yieldM;delete s.loggingJobs![id];
 }
}
export function validateOrdinaryEnvironment(s:OrdinaryEnvironmentState,guestSeat?:string):void{
 const bounded=(p:Pos)=>Number.isSafeInteger(p.x)&&Number.isSafeInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
 for(const[id,q]of Object.entries(s.waterChannels??{}))if(id!==`${q.x},${q.y}`||!bounded(q)||s.map.terrain[q.y*s.map.width+q.x]!=='water'||![1,2].includes(q.depth)||!['north','east','south','west','still'].includes(q.flow))throw new Error('Invalid authored water channel');
 for(const[id,v]of Object.entries(s.loggedVegetation??{}))if(v!==true||!s.vegetation[id]||s.vegetation[id].mature)throw new Error('Invalid consumed logging tree');
 const workers=new Set<string>(),trees=new Set<string>();
 for(const[id,q]of Object.entries(s.loggingJobs??{})){
  if(id!==q.id||!s.players[q.owner]||!Number.isSafeInteger(q.started)||q.started<1||q.started>s.turn||!Number.isSafeInteger(q.lastProgress)||q.lastProgress<q.started-1||q.lastProgress>s.turn||q.remaining!==1||q.yieldM!==10||!['working','lost'].includes(q.status)||(guestSeat&&q.owner!==guestSeat)||(!guestSeat&&(!s.units[q.worker]||!s.vegetation[q.vegetation]||!s.facilities[q.facility])))throw new Error('Invalid finite logging queue');
  if(q.status==='working'){if((!guestSeat&&(s.units[q.worker]?.kind!=='worker'||s.units[q.worker]?.owner!==q.owner||s.facilities[q.facility]?.owner!==q.owner))||workers.has(q.worker)||trees.has(q.vegetation)||s.loggedVegetation?.[q.vegetation])throw new Error('Duplicate logging reservation');workers.add(q.worker);trees.add(q.vegetation);}
 }
}
