import type {Match,Pos,Unit} from './types';
import {activeEffects} from './effects';
import {effectiveRelation} from './diplomacy';
import {limits} from '../content/catalog';
import {fieldworkCost,fieldworkPlotReservations,type FieldworkRoute} from './fieldworks';
export interface Vegetation extends Pos{id:string;mature:boolean;altered:boolean}
export interface LivingBarrier{id:string;owner:string;vegetation:string;facility:string;expires:number}
export interface OldTrail{id:string;tiles:Pos[];blocked:boolean;waystation:string}
export interface HeroTrailSurvey{id:string;owner:string;hero:string;trail:string;turn:number}
export interface TrailProject{id:string;owner:string;hero:string;worker:string;trail:string;started:number;lastProgress:number}
export type HabitatState=Match&{vegetation:Record<string,Vegetation>;livingBarriers:Record<string,LivingBarrier>;oldTrails:Record<string,OldTrail>;heroTrailSurveys:Record<string,HeroTrailSurvey>;trailProjects:Record<string,TrailProject>};
export type HabitatPower={mode:'living-buttress';vegetation:string;facility:string}|{mode:'shoulder-burden';job:string}|{mode:'old-trail';trail:string;worker:string};
const distance=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const able=(s:Match,u:Unit|undefined)=>Boolean(u?.alive&&u.active&&u.supplied&&!activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind)));
const wood=(s:Match,p:Pos)=>s.map.terrain[p.y*s.map.width+p.x]==='woodland';
const bounded=(s:Match,p:Pos)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
export function recordHabitatTravel(s:HabitatState,u:Unit,route:Pos[]):void {
 if(s.units[u.id]!==u||u.kind!=='hero'||!u.alive||route.length<2||distance(u,route.at(-1)!)!==0||route.some((p,i)=>!bounded(s,p)||i>0&&distance(p,route[i-1])!==1))return;
 for(const trail of Object.values(s.oldTrails??{}))if(trail.tiles.every(p=>route.some(q=>distance(p,q)===0))){const id=`trail-survey:${u.owner}:${trail.id}`;s.heroTrailSurveys[id]={id,owner:u.owner,hero:u.id,trail:trail.id,turn:s.turn};}
}
export function habitatWorkerBusy(s:HabitatState,id:string):boolean{return Object.values(s.trailProjects??{}).some(q=>q.worker===id||q.hero===id)||Object.values(s.fieldworkJobs).some(q=>q.status==='working'&&(q.lifting?.unit===id));}
export function lifterReason(s:Match,seat:string,job:string,unit:string):string {const q=s.fieldworkJobs[job],u=s.units[unit];if(!q||q.owner!==seat||q.status!=='working'||!q.lifting||q.lifting.unit)return 'Unfilled tagged lifting phase required';if(!able(s,u)||u.owner!==seat||u.kind!=='worker'||q.worker===unit||distance(u,q)>1||Object.values(s.fieldworkJobs).some(j=>j.status==='working'&&(j.worker===unit||j.lifting?.unit===unit)))return 'Separate adjacent supplied lifting worker required';return '';}
export function assignLifter(s:Match,seat:string,job:string,unit:string):void {const reason=lifterReason(s,seat,job,unit);if(reason)throw new Error(reason);s.fieldworkJobs[job].lifting={unit,method:'worker'};}
/** Only role replacement, never extra progress; full construction M is already
 * paid into the tagged ordinary queue. Main worker and delivery remain required. */
export function habitatReason(s:HabitatState,seat:string,a:HabitatPower,route:FieldworkRoute):string {
 const p=s.players[seat],h=p&&s.units[p.hero.id],profile=a.mode==='living-buttress'?'yavanna':a.mode==='shoulder-burden'?'tulkas':'elf_nandor';
 if(!p||p.profile!==profile||p.hero.status!=='living'||!able(s,h)||p.hero.readiness<3)return 'Living active matching hero and three readiness required';
 if(a.mode==='living-buttress'){
  const v=s.vegetation[a.vegetation],f=s.facilities[a.facility];if(!v||!v.mature||v.altered||!wood(s,v))return 'Existing unaltered mature woodland vegetation required';
  if(!f||f.owner!==seat||f.hp<=0||f.workers<1||distance(v,f)!==1||!route(h,v,h))return 'Adjacent staffed worksite in a physically connected region required';
  if(Object.values(s.facilities).some(f=>f.hp>0&&distance(f,v)===0)||Object.values(s.fieldworkJobs).some(q=>q.status==='working'&&distance(q,v)===0))return 'Barrier frontage already occupied';
  if(Object.values(s.facilities).filter(f=>f.owner===seat&&f.hp>0&&!['core','hold'].includes(f.kind)).length+fieldworkPlotReservations(s,seat)>=limits(p.profile).plots)return 'Faction support plot capacity full';return '';
 }
 if(a.mode==='shoulder-burden'){
  const q=s.fieldworkJobs[a.job];if(!q||q.owner!==seat||q.status!=='working'||!q.lifting||q.lifting.unit)return 'One unfilled tagged lifting phase required';
  const cost=fieldworkCost(q.kind);if(q.cost.M!==cost.M)return 'Phase full tagged Materials must already be paid';
  if(distance(h,q)>1||!route(h,q,h))return 'Tulkas must physically remain beside the connected phase';return '';
 }
 const trail=s.oldTrails[a.trail],worker=s.units[a.worker];
 if(!trail||!trail.blocked||!trail.tiles.every(at=>wood(s,at)))return 'An obstructed existing woodland trail required; no new river or cliff route';
 if(!Object.values(s.heroTrailSurveys).some(q=>q.owner===seat&&q.hero===h.id&&q.trail===trail.id))return 'Hero must physically survey the complete existing trail';
 if(!able(s,worker)||worker.owner!==seat||worker.kind!=='worker'||habitatWorkerBusy(s,worker.id)||!trail.tiles.some(at=>distance(worker,at)<=1))return 'Available supplied worker at the trail required';
 const f=s.facilities[trail.waystation];if(!f||f.owner!==seat||f.hp<=0||f.workers<1||!route(worker,f,worker)||!route(h,worker,h))return 'Surviving staffed waystation and connected delivery required';
 if(p.stock.M<5||p.stock.P<5)return 'Five Materials tools plus provisional five Provisions normal worker supplies required';
 if(Object.values(s.trailProjects).some(q=>q.trail===trail.id))return 'Trail restoration already assigned';return '';
}
/** Caller reserves weekly hero commitment and, for old-trail, one worker operation. */
export function applyHabitatPower(s:HabitatState,seat:string,a:HabitatPower,route:FieldworkRoute):string {
 const reason=habitatReason(s,seat,a,route);if(reason)throw new Error(reason);const p=s.players[seat];p.hero.readiness-=3;
 if(a.mode==='shoulder-burden'){s.fieldworkJobs[a.job].lifting={unit:p.hero.id,method:'hero',turn:s.turn};return a.job;}
 const id=`habitat:${s.nextId++}`;
 if(a.mode==='living-buttress'){const v=s.vegetation[a.vegetation];v.altered=true;s.facilities[id]={id,owner:seat,name:'Living buttress',kind:'barricade',tier:1,x:v.x,y:v.y,hp:60,maxHp:60,workers:0};s.fieldworks[id]={id,owner:seat,kind:'barricade',material:'timber'};s.livingBarriers[id]={id,owner:seat,vegetation:v.id,facility:a.facility,expires:s.turn+1};}
 else{p.stock.M-=5;p.stock.P-=5;s.trailProjects[id]={id,owner:seat,hero:p.hero.id,worker:a.worker,trail:a.trail,started:s.turn,lastProgress:s.turn-1};}
 return id;
}
/** Light convoy threshold20 cargo is provisional. This is a physical old trail,
 * not a new bridge or speed bonus; heavy loads cannot use its narrow frontage. */
export function trailConvoyReason(s:HabitatState,route:Pos[],cargo:number):string {
 for(const trail of Object.values(s.oldTrails??{}))if(route.some(p=>trail.tiles.some(q=>distance(p,q)===0))){if(trail.blocked)return 'Existing woodland trail is obstructed';if(cargo>20)return 'Restored old trail carries only light convoys (20 cargo provisional)';if(!s.facilities[trail.waystation]||s.facilities[trail.waystation].hp<=0)return 'Trail waystation destroyed';}return '';
}
export function progressHabitat(s:HabitatState,route:FieldworkRoute):void {
 for(const[id,q]of Object.entries(s.livingBarriers)){const f=s.facilities[id];if(q.expires<=s.turn||!f||f.hp<=0){if(f)f.hp=0;delete s.livingBarriers[id];}}
 for(const[id,q]of Object.entries(s.trailProjects)){if(q.lastProgress>=s.turn)continue;const trail=s.oldTrails[q.trail],u=s.units[q.worker],h=s.units[q.hero],f=trail&&s.facilities[trail.waystation];if(!trail||!able(s,u)||!able(s,h)||u.owner!==q.owner||!f||f.owner!==q.owner||f.hp<=0||f.workers<1||!trail.tiles.every(at=>wood(s,at))||!trail.tiles.some(at=>distance(u,at)<=1)||!route(u,f,u)||!route(h,u,h))continue;if(Object.values(s.units).some(v=>v.alive&&v.active&&v.attack>0&&effectiveRelation(s,q.owner,v.owner)==='war'&&trail.tiles.some(at=>distance(at,v)<=1)))continue;q.lastProgress=s.turn;trail.blocked=false;delete s.trailProjects[id];}
}
export function interruptHabitat(s:HabitatState,unit:string,hit:number):void {if(hit<=0)return;for(const q of Object.values(s.fieldworkJobs))if(q.lifting?.method==='hero'&&q.lifting.unit===unit)q.lifting={};for(const[id,q]of Object.entries(s.trailProjects))if(q.hero===unit||q.worker===unit)delete s.trailProjects[id];}
export function blockTrailReason(s:HabitatState,seat:string,unit:string,trail:string):string{const u=s.units[unit],t=s.oldTrails[trail];return !able(s,u)||u.owner!==seat||u.attack<1||!t||t.blocked||!t.tiles.some(p=>distance(p,u)<=1)?'Active armed party must reach an open old trail chokepoint':'';}
export function blockTrail(s:HabitatState,seat:string,unit:string,trail:string):void{const reason=blockTrailReason(s,seat,unit,trail);if(reason)throw new Error(reason);s.oldTrails[trail].blocked=true;}
export function validateHabitat(s:HabitatState,guestSeat?:string):void {
 for(const[id,v]of Object.entries(s.vegetation))if(id!==v.id||!bounded(s,v))throw new Error('Invalid authored vegetation');
 for(const[id,t]of Object.entries(s.oldTrails))if(id!==t.id||t.tiles.length<2||t.tiles.length>128||t.tiles.some((p,i)=>!bounded(s,p)||i>0&&distance(p,t.tiles[i-1])!==1)||(!guestSeat&&!s.facilities[t.waystation]))throw new Error('Invalid authored old trail');
 for(const[id,q]of Object.entries(s.livingBarriers)){const f=s.facilities[id];if(id!==q.id||s.players[q.owner]?.profile!=='yavanna'||!f||f.maxHp!==60||f.hp<=0||q.expires!==s.turn+1&&q.expires!==s.turn||(!guestSeat&&!s.vegetation[q.vegetation]?.altered))throw new Error('Invalid living barrier');}
 for(const[id,q]of Object.entries(s.heroTrailSurveys))if(id!==q.id||!s.players[q.owner]||(guestSeat&&q.owner!==guestSeat)||q.hero!==s.players[q.owner].hero.id||q.turn>s.turn||!guestSeat&&!s.oldTrails[q.trail])throw new Error('Invalid actual hero trail survey');
 for(const[id,q]of Object.entries(s.trailProjects))if(id!==q.id||s.players[q.owner]?.profile!=='elf_nandor'||(guestSeat&&q.owner!==guestSeat)||q.hero!==s.players[q.owner].hero.id||!s.units[q.worker]||s.units[q.worker].owner!==q.owner||q.started>s.turn||q.lastProgress>s.turn||!guestSeat&&!s.oldTrails[q.trail])throw new Error('Invalid paid trail restoration');
 for(const q of Object.values(s.trailProjects))if(q.started===s.turn&&(s.players[q.owner].commitment!==0||s.players[q.owner].operations>2))throw new Error('Unpaid trail project budget');
}
