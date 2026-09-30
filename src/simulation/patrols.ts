import {borderMemory} from './watch-posts';
import {recordNightMovement} from "./night-patrol";
import {recordDawnMovement} from "./night-work";
import {recordFormationObservation} from "./formation-orders";
import {recordHabitatTravel} from "./habitat-works";
import {infrastructureBlocked} from "./infrastructure-work";
import type {Match,Pos,Unit} from './types';
export interface MovementTrace {id:string;owner:string;route:Pos[];turn:number;revision:number;erased:boolean}
export interface RouteSurvey {id:string;owner:string;route:Pos[];turn:number;revision:number}
export interface PatrolWatch {id:string;owner:string;survey:string;route:Pos[];turn:number;lastReportRevision:number}
export interface PatrolReport {id:string;owner:string;kind:'track'|'route';points:Pos[];turn:number;revision:number;reportedTurn:number;reportedRevision:number;uncertainty:string[]}
export type PatrolState=Match&{movementTraces:Record<string,MovementTrace>;routeSurveys:Record<string,RouteSurvey>;patrolWatches:Record<string,PatrolWatch>;patrolReports:Record<string,PatrolReport>};
const distance=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const clone=(r:Pos[])=>r.map(p=>({x:p.x,y:p.y}));
const bounded=(s:Match,p:Pos)=>Number.isSafeInteger(p.x)&&Number.isSafeInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
function cap<T>(records:Record<string,T>,limit:number){for(const id of Object.keys(records).slice(0,Math.max(0,Object.keys(records).length-limit)))delete records[id];}
function exposed(s:Match,u:Unit,p:Pos){return !['woodland','cliff'].includes(s.map.terrain[p.y*s.map.width+p.x])&&!u.effects.some(e=>e.kind==='concealed'&&e.until>s.revision);}
function report(s:PatrolState,owner:string,kind:PatrolReport['kind'],points:Pos[],turn:number,revision:number){const id=`patrol-report:${s.nextId++}`;s.patrolReports[id]={id,owner,kind,points:clone(points),turn,revision,reportedTurn:s.turn,reportedRevision:s.revision,uncertainty:['Dated physical evidence; does not follow a unit.','No identity or exact numbers established; traces may be overlaid or misleading.']};cap(s.patrolReports,256);return id;}
/** Trusted simulation hook AFTER an actual ground move. Never infer a path from
 * endpoints. Caller supplies its real traversed route, including interrupted legs.
 * Provisional trace lifetime: current and previous week; storage caps bound saves. */
export function recordPatrolMovement(s:PatrolState,u:Unit,route:Pos[]):void {
 if(!u.alive||route.length<2)return;
 if(s.units[u.id]!==u||route.length>256||distance(route.at(-1)!,u)!==0||route.some((p,i)=>!bounded(s,p)||(i>0&&distance(p,route[i-1])!==1)))throw new Error('Movement evidence requires actual adjacent traversed route');
 if(s.players[u.owner]){
  s.events.push({id:s.nextId++,turn:s.turn,audience:[u.owner],text:`${u.name} completed its recorded movement.`,motion:{unit:u.id,route:clone(route)}});
  if(s.events.length>400)s.events.splice(0,s.events.length-400);
 }
 recordNightMovement(s,u,route);recordDawnMovement(s,u,route);
 if(u.flying&&!u.landed)return;
 recordFormationObservation(s,u,route);
 borderMemory(s,u,route);
 recordHabitatTravel(s,u,route);
 for(const[id,t]of Object.entries(s.movementTraces))if(t.turn<s.turn-1)delete s.movementTraces[id];
 const id=`trace:${s.nextId++}`;s.movementTraces[id]={id,owner:u.owner,route:clone(route),turn:s.turn,revision:s.revision,erased:false};cap(s.movementTraces,512);
 if(s.players[u.owner]){
  // Existing assignments remain valid checkpoints. Never evict a referenced
  // route to make room for unrelated travel history.
  const pinned=new Set([...Object.values(s.garrisonPosts??{}).map(g=>g.survey),...Object.values(s.patrolWatches).filter(w=>w.turn===s.turn).map(w=>w.survey)]);
  const oldest=Object.keys(s.routeSurveys).find(id=>!pinned.has(id));
  if(Object.keys(s.routeSurveys).length<256||oldest){
   if(Object.keys(s.routeSurveys).length>=256&&oldest)delete s.routeSurveys[oldest];
   const survey=`survey:${s.nextId++}`;s.routeSurveys[survey]={id:survey,owner:u.owner,route:clone(route),turn:s.turn,revision:s.revision};
  }else{
   s.events.push({id:s.nextId++,turn:s.turn,audience:[u.owner],text:'Survey archive full: all 256 routes support existing assignments. Travel completed, but no new survey was stored; release an unused garrison or route watch to make room.'});
   if(s.events.length>400)s.events.splice(0,s.events.length-400);
  }
 }
 for(const w of Object.values(s.patrolWatches)){
  if(w.turn!==s.turn||w.lastReportRevision===s.revision||w.route.some(p=>(['water','cliff'].includes(s.map.terrain[p.y*s.map.width+p.x])||infrastructureBlocked(s,p,'land'))))continue;
  const at=route.find(p=>w.route.some(q=>distance(p,q)===0)&&exposed(s,u,p));
  if(at){report(s,w.owner,'route',[at],s.turn,s.revision);w.lastReportRevision=s.revision;}
 }
}
function heroReason(s:PatrolState,seat:string,profile:string,cost:number){const p=s.players[seat],h=p&&s.units[p.hero.id];return !p||p.profile!==profile||p.hero.status!=='living'||!h?.alive||!h.active||p.hero.readiness<cost?'Living active source hero and readiness required':'';}
export function inspectTraceReason(s:PatrolState,seat:string,point:Pos){const reason=heroReason(s,seat,'vaire',2);if(reason)return reason;const h=s.units[s.players[seat].hero.id];if(!bounded(s,point)||distance(h,point)!==0)return 'Stationary inspection requires hero at the actual trace site';if(!s.traceContacts?.some(p=>distance(p,point)===0)&&!Object.values(s.movementTraces).some(t=>!t.erased&&t.turn>=s.turn-1&&t.route.some(p=>distance(p,point)===0)))return 'No recent surviving trace at this site';return '';}
export function inspectTrace(s:PatrolState,seat:string,point:Pos){const reason=inspectTraceReason(s,seat,point);if(reason)throw new Error(reason);const t=Object.values(s.movementTraces).filter(t=>!t.erased&&t.turn>=s.turn-1&&t.route.some(p=>distance(p,point)===0)).sort((a,b)=>b.turn-a.turn||b.revision-a.revision||b.id.localeCompare(a.id))[0];s.players[seat].hero.readiness-=2;if(!t&&s.traceContacts)return '';return report(s,seat,'track',t.route,t.turn,t.revision);}
export function starwatchReason(s:PatrolState,seat:string,surveyId:string,connected:(a:Pos,b:Pos)=>boolean){const reason=heroReason(s,seat,'varda',3);if(reason)return reason;const p=s.players[seat],survey=s.routeSurveys[surveyId];if(p.commitment<1)return 'Weekly hero commitment required';if(!survey||survey.owner!==seat||!connected(s.units[p.hero.id],survey.route[0])||survey.route.some(p=>(['water','cliff'].includes(s.map.terrain[p.y*s.map.width+p.x])||infrastructureBlocked(s,p,'land'))))return 'Existing physically surveyed open route in one connected region required';if(Object.values(s.patrolWatches).some(w=>w.owner===seat&&w.turn===s.turn))return 'One route watch may be prepared this week';return '';}
/** Parent consumes personal commitment; no free material, towers or live target marker. */
export function prepareStarwatch(s:PatrolState,seat:string,survey:string,connected:(a:Pos,b:Pos)=>boolean){const reason=starwatchReason(s,seat,survey,connected);if(reason)throw new Error(reason);s.players[seat].hero.readiness-=3;const id=`watch:${s.nextId++}`;s.patrolWatches[id]={id,owner:seat,survey,route:clone(s.routeSurveys[survey].route),turn:s.turn,lastReportRevision:-1};cap(s.patrolWatches,64);return id;}
/** Safe projection hint: anonymous recent trace presence at the viewer's actual
 * hero location only. No route, owner, unit identity or remote point is exposed. */
export function localTraceSites(s:PatrolState,seat:string):Pos[]{const p=s.players[seat],h=p&&s.units[p.hero.id];if(!h?.alive)return [];return Object.values(s.movementTraces).some(t=>!t.erased&&t.turn>=s.turn-1&&t.route.some(at=>distance(at,h)===0))?[{x:h.x,y:h.y}]:[];}
export function validatePatrolState(s:PatrolState,guestSeat?:string):void {
 if(guestSeat&&Object.keys(s.movementTraces).length)throw new Error('Raw trace privacy violation');
 for(const [records,limit]of [[s.movementTraces,512],[s.routeSurveys,256],[s.patrolWatches,64],[s.patrolReports,256]] as const){if(Object.keys(records).length>limit)throw new Error('Patrol record budget exceeded');for(const[id,r]of Object.entries(records)){if(id!==r.id||(!s.players[r.owner]&&r.owner!=='remnant')||r.turn>s.turn||(guestSeat&&r.owner!==guestSeat))throw new Error('Invalid private patrol record');const points:Pos[]='route'in r?r.route:r.points;if(points.some(p=>!bounded(s,p)))throw new Error('Invalid patrol position');if('route'in r&&points.some((p,i)=>i>0&&distance(p,points[i-1])!==1))throw new Error('Invalid physical survey route');if('revision'in r&&r.revision>s.revision)throw new Error('Future patrol observation');if('lastReportRevision'in r&&r.lastReportRevision>s.revision)throw new Error('Future route watch');if('reportedTurn'in r&&(r.reportedTurn>s.turn||r.reportedTurn<r.turn||r.reportedRevision>s.revision||r.reportedRevision<r.revision))throw new Error('Invalid dated patrol report');}}
 if(s.traceContacts){const h=guestSeat&&s.units[s.players[guestSeat]?.hero.id];if(!guestSeat||s.traceContacts.some(p=>!h||distance(h,p)!==0))throw new Error('Invalid anonymous local trace contact');}
}
