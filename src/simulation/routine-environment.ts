import type {Match,Unit,Pos} from './types';
import {activeEffects} from './effects';
import {effectiveRelation} from './diplomacy';
export interface RoutineInspection{owner:string;facility:string;turn:number;revision:number;used:boolean}
export interface RoutineWearUse{owner:string;facility:string;turn:number}
export interface HabitatWear{vegetation:string;damage:number;lastTurn:number}
export interface TunnelAir{site:string;pressure:number;lastProgress:number;penaltyTurn:number}
export interface AirflowWarning{owner:string;site:string;turn:number;revision:number;penaltyTurn:number}
export interface RoutineTravelEvent{unit:string;turn:number;revision:number}
export type RoutineAction={kind:'inspect-worksite';facility:string};
export type RoutineState=Match&{routineInspections?:Record<string,RoutineInspection>;routineWearUses?:Record<string,RoutineWearUse>;routineWorksiteWear?:Record<string,number>;habitatWear?:Record<string,HabitatWear>;tunnelAir?:Record<string,TunnelAir>;airflowWarnings?:Record<string,AirflowWarning>;routineTravelEvents?:Record<string,RoutineTravelEvent>};
const d=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const able=(s:Match,u:Unit|undefined)=>!!u?.alive&&u.hp>0&&u.active&&u.supplied&&!activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind));
const hero=(s:Match,owner:string,profile:string)=>{const p=s.players[owner],h=p&&s.units[p.hero.id];return p?.profile===profile&&p.hero.status==='living'&&able(s,h)?h:undefined;};
const defense=(kind:string)=>['core','hold','gate','cover','barricade','siege-brace'].includes(kind);
export function inspectWorksiteReason(s:RoutineState,owner:string,facility:string):string{
 const h=hero(s,owner,'aule'),f=s.facilities[facility];
 if(!h||!f||f.owner!==owner||f.hp<=0||f.workers<1||d(h,f)>1)return 'Aule beside a living owned staffed worksite required';
 return s.routineInspections?.[owner]?.turn===s.turn?'One inspected worksite per week':'';
}
export function inspectWorksite(s:RoutineState,owner:string,facility:string):void{
 const reason=inspectWorksiteReason(s,owner,facility);if(reason)throw new Error(reason);
 s.routineInspections??={};s.routineInspections[owner]={owner,facility,turn:s.turn,revision:s.revision,used:false};
}
/** Provisional ordinary maintenance: one 4HP event per staffed worksite/week,
 * severity step2HP, minimum1HP (routine maintenance never demolishes a site).
 * This is an actual independent wear producer; powers never charge/refund stock,
 * restore existing damage, alter combat damage or waive normal paid upkeep. */
export function progressRoutineEnvironment(s:RoutineState):void{
 s.routineWorksiteWear??={};s.routineWearUses??={};s.tunnelAir??={};s.airflowWarnings??={};
 for(const f of Object.values(s.facilities).sort((a,b)=>a.id.localeCompare(b.id))){
  if(f.hp<=1||f.workers<1||s.routineWorksiteWear[f.id]===s.turn)continue;
  s.routineWorksiteWear[f.id]=s.turn;let loss=4;
  const inspected=s.routineInspections?.[f.owner],a=hero(s,f.owner,'aule'),g=hero(s,f.owner,'human_gondor');
  if(a&&inspected?.facility===f.id&&inspected.turn===s.turn&&!inspected.used){loss-=2;inspected.used=true;}
  else if(g&&d(g,f)<=1&&defense(f.kind)&&s.routineWearUses[f.owner]?.turn!==s.turn){loss=Math.ceil(loss*.75);s.routineWearUses[f.owner]={owner:f.owner,facility:f.id,turn:s.turn};}
  f.hp=Math.max(1,f.hp-loss);
 }
 for(const site of Object.values(s.infrastructureSites)){
  if(site.kind!=='shaft'||site.consumed)continue;
  if(!site.blocked){delete s.tunnelAir[site.id];continue;}
  let q=s.tunnelAir[site.id];
  if(!q)q=s.tunnelAir[site.id]={site:site.id,pressure:0,lastProgress:s.turn-1,penaltyTurn:s.turn+1};
  if(q.lastProgress===s.turn)continue;q.lastProgress=s.turn;q.pressure=Math.min(3,q.pressure+1);
  const h=hero(s,site.owner,'dwarf_khazad_dum');
  if(h&&d(h,site)===0&&s.turn<q.penaltyTurn&&s.airflowWarnings[site.owner]?.turn!==s.turn)s.airflowWarnings[site.owner]={owner:site.owner,site:site.id,turn:s.turn,revision:s.revision,penaltyTurn:q.penaltyTurn};
 }
 pruneRoutineEnvironment(s);
}
/** The queue caller skips its normal advance while a real adjacent owned shaft
 * remains blocked after its announced next-week threshold. No progress is lost
 * retroactively. Radius1 and threshold1week are provisional airflow tuning. */
export function tunnelProductionPenalty(s:RoutineState,facility:string):boolean{
 const f=s.facilities[facility];if(!f||f.hp<=0)return false;
 return Object.values(s.tunnelAir??{}).some(q=>{const site=s.infrastructureSites[q.site];return site?.blocked&&!site.consumed&&site.owner===f.owner&&d(site,f)<=1&&s.turn>=q.penaltyTurn;});
}
/** Ordinary actual committed ground travel, once per unit/tactical phase.
 * Woodland causes2 habitat wear and one coordination step. Nearby Yavanna
 * reduces travel wear to1; accompanying Nessa prevents that separation step.
 * At4 accumulated wear existing mature vegetation becomes damaged/immature,
 * so Living Buttress cannot use it. Harvest/fire/construction never call this.
 * No speed, free route, restored plants, stocks or casualty protection. */
export function recordRoutineTravel(s:RoutineState,u:Unit,route:Pos[]):void{
 if(s.units[u.id]!==u||!able(s,u)||u.flying&&!u.landed||route.length<2||d(route.at(-1)!,u)!==0||route.some((p,i)=>!Number.isSafeInteger(p.x)||!Number.isSafeInteger(p.y)||p.x<0||p.y<0||p.x>=s.map.width||p.y>=s.map.height||(i>0&&d(p,route[i-1])!==1)))return;
 if(s.routineTravelEvents?.[u.id]?.revision===s.revision)return;
 s.routineTravelEvents??={};s.routineTravelEvents[u.id]={unit:u.id,turn:s.turn,revision:s.revision};
 const woods=route.slice(1).filter(p=>s.map.terrain[p.y*s.map.width+p.x]==='woodland');if(!woods.length)return;
 const accompanies=(profile:string)=>Object.keys(s.players).some(owner=>{const h=hero(s,owner,profile);return h&&(owner===u.owner||effectiveRelation(s,owner,u.owner)==='alliance')&&d(h,route[0])<=1&&d(h,u)<=1;});
 const loss=accompanies('yavanna')?1:2;s.habitatWear??={};
 for(const v of Object.values(s.vegetation))if(woods.some(p=>d(p,v)===0)){
  const q=s.habitatWear[v.id]??{vegetation:v.id,damage:0,lastTurn:s.turn};q.damage=Math.min(4,q.damage+loss);q.lastTurn=s.turn;s.habitatWear[v.id]=q;
  if(q.damage>=4){v.mature=false;v.altered=true;}
 }
 if(u.kind==='company'&&!accompanies('nessa')){
  const e=activeEffects(s,u).find(e=>e.kind==='cohesion-loss');
  if(e)e.value++;else u.effects.push({kind:'cohesion-loss',value:1,until:1000000,source:`morale:${s.turn}`});
 }
}
export function routineSeparationPenalty(s:Match,u:Unit):number{return Math.max(0,...activeEffects(s,u).filter(e=>e.kind==='cohesion-loss').map(e=>e.value));}
export function pruneRoutineEnvironment(s:RoutineState):void{
 for(const[id,q]of Object.entries(s.routineInspections??{}))if(q.turn<s.turn||!s.facilities[q.facility]||s.facilities[q.facility].owner!==q.owner)delete s.routineInspections![id];
 for(const[id,q]of Object.entries(s.routineWearUses??{}))if(q.turn<s.turn||!s.facilities[q.facility])delete s.routineWearUses![id];
 for(const id of Object.keys(s.routineWorksiteWear??{}))if(!s.facilities[id])delete s.routineWorksiteWear![id];
 for(const id of Object.keys(s.habitatWear??{}))if(!s.vegetation[id])delete s.habitatWear![id];
 for(const[id,q]of Object.entries(s.tunnelAir??{}))if(!s.infrastructureSites[q.site]||s.infrastructureSites[q.site].consumed||!s.infrastructureSites[q.site].blocked)delete s.tunnelAir![id];
 for(const[id,q]of Object.entries(s.airflowWarnings??{}))if(q.turn<s.turn-1||!s.infrastructureSites[q.site])delete s.airflowWarnings![id];
 for(const[id,q]of Object.entries(s.routineTravelEvents??{}))if(!s.units[id]?.alive||q.turn<s.turn)delete s.routineTravelEvents![id];
}
export function validateRoutineEnvironment(s:RoutineState,guestSeat?:string):void{
 const time=(v:number)=>Number.isSafeInteger(v)&&v>=1&&v<=s.turn;
 const revision=(v:number)=>Number.isSafeInteger(v)&&v>=0&&v<=s.revision;
 const fail=()=>{throw new Error('Invalid routine environment or airflow record');};
 for(const[id,q]of Object.entries(s.routineInspections??{}))if(id!==q.owner||s.players[q.owner]?.profile!=='aule'||!time(q.turn)||!revision(q.revision)||typeof q.used!=='boolean'||(guestSeat&&q.owner!==guestSeat)||(!guestSeat&&s.facilities[q.facility]?.owner!==q.owner))fail();
 for(const[id,q]of Object.entries(s.routineWearUses??{}))if(id!==q.owner||s.players[q.owner]?.profile!=='human_gondor'||!time(q.turn)||(guestSeat&&q.owner!==guestSeat)||(!guestSeat&&!s.facilities[q.facility]))fail();
 for(const[id,turn]of Object.entries(s.routineWorksiteWear??{}))if(!time(turn)||(!guestSeat&&!s.facilities[id])||(guestSeat&&s.facilities[id]?.owner!==guestSeat))fail();
 for(const[id,q]of Object.entries(s.habitatWear??{}))if(id!==q.vegetation||!s.vegetation[id]||!Number.isSafeInteger(q.damage)||q.damage<0||q.damage>4||!time(q.lastTurn))fail();
 for(const[id,q]of Object.entries(s.tunnelAir??{}))if(id!==q.site||!Number.isSafeInteger(q.pressure)||q.pressure<1||q.pressure>3||!time(q.lastProgress)||!Number.isSafeInteger(q.penaltyTurn)||q.penaltyTurn<2||q.penaltyTurn>s.turn+1||(!guestSeat&&s.infrastructureSites[id]?.kind!=='shaft')||(guestSeat&&s.infrastructureSites[id]?.owner!==guestSeat))fail();
 for(const[id,q]of Object.entries(s.airflowWarnings??{}))if(id!==q.owner||s.players[q.owner]?.profile!=='dwarf_khazad_dum'||!time(q.turn)||!revision(q.revision)||q.penaltyTurn!==q.turn+1||(guestSeat&&q.owner!==guestSeat)||(!guestSeat&&s.infrastructureSites[q.site]?.owner!==q.owner))fail();
 for(const[id,q]of Object.entries(s.routineTravelEvents??{}))if(id!==q.unit||!time(q.turn)||!revision(q.revision)||(!guestSeat&&!s.units[id])||(guestSeat&&s.units[id]?.owner!==guestSeat))fail();
}
