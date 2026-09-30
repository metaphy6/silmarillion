import type {Match,Pos,Unit,Facility} from './types';
import {observation,terrainObserved} from './visibility';
import {sightline,activeEffects} from './effects';
import {movementPenalty} from './conditions';
import {fatigueMovementPenalty,travelFatigue} from './fatigue';
import {movementZonePenalty,crossZones} from './zones';
export interface IntelligenceObservation extends Pos {
 eventKey:string;turn:number;revision:number;kind:'attack';certainty:'observed'|'silhouette';source:string;
}
export interface IntelligenceReport {
 id:string;owner:string;createdTurn:number;createdRevision:number;kind:'attack'|'cross-check'|'relay';
 observations:IntelligenceObservation[];sourceReportIds:string[];uncertainty:string[];status:'dated'|'corroborated'|'contradictory'|'unverified';
}
export interface IntelligenceTask {
 id:string;owner:string;kind:'quiet-exchange'|'beacon-concord';startedTurn:number;dueTurn:number;
 stationIds:string[];reportIds:string[];route:Pos[];carrier?:string;observations:IntelligenceObservation[];
}
export interface IntelligenceRequest {mode:IntelligenceTask['kind'];stations:string[];report?:string;carrier?:string}
export type IntelligenceRouteFinder=(s:Match,start:Pos,end:Pos,unit:Unit)=>Pos[]|null;
const distance=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const stationKind=(mode:IntelligenceTask['kind'])=>mode==='quiet-exchange'?'safehouse':'beacon';
function stationsIntact(s:Match,owner:string,ids:string[],mode:IntelligenceTask['kind']):boolean {
 return ids.every(id=>{const f=s.facilities[id];return f?.owner===owner&&f.kind===stationKind(mode)&&f.hp>0&&f.workers>0;});
}
function courierAllowance(s:Match,u:Unit):number {
 if(activeEffects(s,u).some(e=>e.kind==='root'))return 0;
 return Math.min(Math.max(1,u.move-movementPenalty(s,u)-fatigueMovementPenalty(s,u)),...activeEffects(s,u).filter(e=>e.kind==='move-limit').map(e=>e.value));
}
function courierCost(s:Match,u:Unit,route:Pos[]):number {
 return route.length-1+route.slice(1).filter(p=>s.map.terrain[p.y*s.map.width+p.x]==='woodland').length+movementZonePenalty(s,u,route);
}
export function isIntelligenceCourier(s:Match,id:string):boolean {return Object.values(s.intelligenceTasks).some(t=>t.carrier===id);}
export function intelligenceReason(s:Match,seat:string,a:IntelligenceRequest,path:IntelligenceRouteFinder):string {
 const p=s.players[seat],h=p&&s.units[p.hero.id],quiet=a.mode==='quiet-exchange';
 if(!p||p.profile!==(quiet?'istari_veil':'istari_star'))return 'This profile cannot prepare that intelligence power';
 if(!h?.alive||!h.active||p.hero.status!=='living')return 'Living active hero required';
 if(p.hero.readiness<3||p.commitment<1)return 'Three readiness and weekly hero commitment required';
 if(p.stock.K<(quiet?10:5)||p.stock.M<(quiet?0:10))return 'Required Lore supplies or Materials are unavailable';
 if(Object.values(s.intelligenceTasks).some(t=>t.owner===seat))return 'An intelligence preparation is already pending';
 const count=quiet?2:3;
 if(a.stations.length!==count||new Set(a.stations).size!==count||!stationsIntact(s,seat,a.stations,a.mode))return `Choose ${count} distinct existing owned staffed ${stationKind(a.mode)} stations`;
 const sites=a.stations.map(id=>s.facilities[id]);
 if(!path(s,h,sites[0],h))return 'Hero and stations must occupy one connected region';
 for(let i=1;i<sites.length;i++)if(!path(s,sites[i-1],sites[i],h)||(!quiet&&(distance(sites[i-1],sites[i])>8||!sightline(s,sites[i-1],sites[i]))))return 'Station chain needs connected surveyed physical links';
 if(!quiet)return '';
 const report=a.report?s.intelligenceReports[a.report]:undefined;
 if(!report||report.owner!==seat||!report.observations.length||!report.observations.some(o=>a.stations.includes(o.source)))return 'An existing owned dated report held at a selected safehouse is required';
 const u=a.carrier?s.units[a.carrier]:undefined;
 if(!u?.alive||!u.active||!u.supplied||u.owner!==seat||!['worker','company'].includes(u.kind))return 'Owned active supplied ordinary courier required';
 if(isIntelligenceCourier(s,u.id)||Object.values(s.convoys).some(c=>c.carrier===u.id&&c.phase!=='lost')||Object.values(s.movementPlans).some(p=>p.members.some(m=>m.unit===u.id&&!m.complete)))return 'Courier is already committed to other work';
 if(distance(u,sites[0])>1)return 'Courier must reach the report safehouse';
 const route=path(s,u,sites[1],u);
 if(!route||route.length<2||courierCost(s,u,route)>courierAllowance(s,u)||route.some(at=>!terrainObserved(s,seat,at)))return 'Courier needs a surveyed traversable route deliverable within ordinary weekly movement';
 return '';
}
export function startIntelligence(s:Match,seat:string,a:IntelligenceRequest,path:IntelligenceRouteFinder):IntelligenceTask {
 const reason=intelligenceReason(s,seat,a,path);if(reason)throw new Error(reason);
 const p=s.players[seat],quiet=a.mode==='quiet-exchange';p.stock.K-=quiet?10:5;if(!quiet)p.stock.M-=10;p.hero.readiness-=3;
 const primary=quiet?s.intelligenceReports[a.report!]:undefined;
 const eventKeys=new Set(primary?.observations.map(o=>o.eventKey));
 const reports=quiet?Object.values(s.intelligenceReports).filter(r=>r.owner===seat&&(r.id===a.report||r.observations.some(o=>eventKeys.has(o.eventKey)&&a.stations.includes(o.source)))):[];
 const id=`intel-task:${s.nextId++}`;
 const task:IntelligenceTask={id,owner:seat,kind:a.mode,startedTurn:s.turn,dueTurn:s.turn,stationIds:[...a.stations],reportIds:quiet?[a.report!,...reports.filter(r=>r.id!==a.report).map(r=>r.id)]:[],route:quiet?path(s,s.units[a.carrier!],s.facilities[a.stations[1]],s.units[a.carrier!])!:[],observations:[]};
 if(quiet)task.carrier=a.carrier;
 s.intelligenceTasks[id]=task;return task;
}
function addReport(s:Match,owner:string,kind:IntelligenceReport['kind'],observations:IntelligenceObservation[],sourceReportIds:string[],status:IntelligenceReport['status'],uncertainty:string[]):void {
 const id=`report:${s.nextId++}`;
 s.intelligenceReports[id]={id,owner,createdTurn:s.turn,createdRevision:s.revision,kind,observations:structuredClone(observations.slice(0,64)),sourceReportIds:[...sourceReportIds],status,uncertainty};
 const pinned=new Set([...Object.values(s.intelligenceTasks).flatMap(t=>t.reportIds),...Object.values(s.relayMessages).map(q=>q.report)]);
 const owned=Object.values(s.intelligenceReports).filter(r=>r.owner===owner);
 while(owned.length>64){const index=owned.findIndex(r=>!pinned.has(r.id));if(index<0)break;delete s.intelligenceReports[owned[index].id];owned.splice(index,1);}
}
function stationObservation(s:Match,f:Facility,attacker:Unit):'hidden'|'silhouette'|'identified' {
 if(distance(f,attacker)>8||!sightline(s,f,attacker))return 'hidden';
 // Restrict observation to this real station. Other owned scouts must not let a
 // blocked beacon report an event that it could not itself observe.
 const view:Match={...s,units:Object.fromEntries(Object.entries(s.units).map(([id,u])=>[id,u.owner===f.owner?{...u,owner:'station-observation-only'}:u])),facilities:Object.fromEntries(Object.entries(s.facilities).map(([id,v])=>[id,v.owner===f.owner&&id!==f.id?{...v,owner:'station-observation-only'}:v]))};
 return observation(view,f.owner,attacker);
}
/** Call exactly once for a genuine attack, never for a preview or queued order.
 * Report facts contain no entity identifiers, names, inventories or intent. */
export function recordObservedAttack(s:Match,attacker:Unit):void {
 if(!attacker.alive)return;
 const eventKey=`observed-attack:${s.nextId++}`;
 const observe=(f:Facility):IntelligenceObservation|undefined=>{
  const view=stationObservation(s,f,attacker);if(view==='hidden')return;
  return {eventKey,x:attacker.x,y:attacker.y,turn:s.turn,revision:s.revision,kind:'attack',certainty:view==='identified'?'observed':'silhouette',source:f.id};
 };
 for(const f of Object.values(s.facilities))if(f.kind==='safehouse'&&f.hp>0&&f.workers>0&&s.players[f.owner]){const fact=observe(f);if(fact)addReport(s,f.owner,'attack',[fact],[],'dated',['This is a dated local observation, not live tracking.']);}
 for(const task of Object.values(s.intelligenceTasks))if(task.kind==='beacon-concord'&&task.dueTurn>=s.turn&&stationsIntact(s,task.owner,task.stationIds,task.kind)){
  const facts=task.stationIds.map(id=>observe(s.facilities[id])).filter((o):o is IntelligenceObservation=>!!o);
  if(facts.length&&task.observations.length<64)task.observations.push(facts[0]);
 }
}
/** Weekly resolution after combat and before turn increment. Failure consumes
 * paid preparation but never fabricates a report or refunds its resources. */
export function progressIntelligence(s:Match,path:IntelligenceRouteFinder):void {
 for(const task of Object.values(s.intelligenceTasks)){
  if(task.dueTurn>s.turn)continue;
  delete s.intelligenceTasks[task.id];
  if(!stationsIntact(s,task.owner,task.stationIds,task.kind))continue;
  if(task.kind==='beacon-concord'){
   const sites=task.stationIds.map(id=>s.facilities[id]);
   if(sites.slice(1).some((f,i)=>distance(sites[i],f)>8||!sightline(s,sites[i],f)))continue;
   addReport(s,task.owner,'relay',task.observations,[],task.observations.length?'dated':'unverified',['Only attacks within the prepared chain sightlines were observed. Absence of a report is not evidence of safety.']);continue;
  }
  const u=task.carrier?s.units[task.carrier]:undefined;if(!u?.alive||!u.active||!u.supplied||u.owner!==task.owner)continue;
  const route=path(s,u,s.facilities[task.stationIds[1]],u);
  if(!route||JSON.stringify(route)!==JSON.stringify(task.route)||courierCost(s,u,route)>courierAllowance(s,u))continue;
  const end=route.at(-1)!;crossZones(s,u,route);travelFatigue(s,u,u,end);u.x=end.x;u.y=end.y;
  const selected=s.intelligenceReports[task.reportIds[0]];if(!selected)continue;
  const selectedEvents=new Set(selected.observations.map(o=>o.eventKey));
  const facts=task.reportIds.flatMap(id=>s.intelligenceReports[id]?.observations??[]).filter(o=>selectedEvents.has(o.eventKey)&&task.stationIds.includes(o.source));if(!facts.length)continue;
  const keys=[...new Set(facts.map(o=>o.eventKey))];let contradictory=false,corroborated=true;
  for(const key of keys){const group=facts.filter(o=>o.eventKey===key);if(new Set(group.map(o=>`${o.kind}:${o.x}:${o.y}:${o.turn}:${o.revision}`)).size>1)contradictory=true;if(new Set(group.map(o=>o.source)).size<2)corroborated=false;}
  addReport(s,task.owner,'cross-check',facts,task.reportIds,contradictory?'contradictory':corroborated?'corroborated':'unverified',['Agreement does not establish truth; independently consistent false evidence remains possible.','No unobserved event was inferred.']);
 }
}

/** Historical station loss does not erase prior observations. Pending tasks may
 * reference dead couriers/stations; weekly resolution cancels them normally. */
export function validateIntelligenceState(s:Match,guestSeat?:string):void {
 const fail=()=>{throw new Error('Invalid intelligence checkpoint invariant');};
 const bounded=(p:Pos)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
 const factValid=(o:IntelligenceObservation)=>bounded(o)&&o.kind==='attack'&&['observed','silhouette'].includes(o.certainty)&&typeof o.eventKey==='string'&&o.eventKey.startsWith('observed-attack:')&&typeof o.source==='string'&&Number.isInteger(o.turn)&&o.turn>=1&&o.turn<=s.turn&&Number.isInteger(o.revision)&&o.revision>=0&&o.revision<=s.revision;
 const counts:Record<string,number>={};
 for(const [id,r] of Object.entries(s.intelligenceReports)){
  if(id!==r.id||!s.players[r.owner]||(guestSeat&&r.owner!==guestSeat)||r.createdTurn<1||r.createdTurn>s.turn||r.createdRevision<0||r.createdRevision>s.revision||r.observations.length>64||r.observations.some(o=>!factValid(o))||r.sourceReportIds.length>64||r.uncertainty.length>8)fail();
  counts[r.owner]=(counts[r.owner]??0)+1;if(counts[r.owner]>64)fail();
 }
 const owners=new Set<string>(),couriers=new Set<string>();
 for(const [id,t] of Object.entries(s.intelligenceTasks)){
  const p=s.players[t.owner],quiet=t.kind==='quiet-exchange';
  if(id!==t.id||!p||(guestSeat&&t.owner!==guestSeat)||p.profile!==(quiet?'istari_veil':'istari_star')||p.commitment!==0||owners.has(t.owner)||t.startedTurn!==s.turn||t.dueTurn!==t.startedTurn||t.stationIds.length!==(quiet?2:3)||new Set(t.stationIds).size!==t.stationIds.length||t.stationIds.some(id=>!s.facilities[id])||t.observations.length>64||t.observations.some(o=>!factValid(o)))fail();
  owners.add(t.owner);
  if(quiet){
   const u=t.carrier?s.units[t.carrier]:undefined;if(!u||u.owner!==t.owner||!['worker','company'].includes(u.kind)||couriers.has(u.id)||!t.reportIds.length||t.reportIds.length>64||t.reportIds.some(id=>s.intelligenceReports[id]?.owner!==t.owner)||t.route.length<2||t.route.length>256)fail();
   couriers.add(u!.id);const last=t.route.at(-1)!,destination=s.facilities[t.stationIds[1]];if(last.x!==destination.x||last.y!==destination.y)fail();
   for(const [i,p] of t.route.entries())if(!bounded(p)||(i>0&&distance(t.route[i-1],p)!==1))fail();
  }else if(t.carrier||t.route.length||t.reportIds.length)fail();
 }
}
