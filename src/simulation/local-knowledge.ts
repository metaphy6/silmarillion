import type {OrdinaryEnvironmentState} from './ordinary-environment';
import {traceFresh} from './patrols';
import type {Match,Pos,Unit} from './types';
import {activeEffects} from './effects';
export type LocalDirection='north'|'east'|'south'|'west';
export type KnowledgeDetail=
 |{kind:'water';flow:LocalDirection|'still'|'unknown';shallow:boolean;draft:'shallow'|'deep'|'unknown';safeDraft:1|2|null;wave:number|null;fog:boolean|null;handling:number|null;blocked:boolean}
 |{kind:'plant';viable:boolean;recoverable:boolean}
 |{kind:'scent';ownPack:boolean}
 |{kind:'grove';disturbance:'heavy-passage'|'logging'|'none';direction:LocalDirection|null}
 |{kind:'tremor';direction:LocalDirection;eventTurn:number;eventRevision:number};
export interface LocalKnowledgeReport{owner:string;point:Pos;turn:number;revision:number;detail:KnowledgeDetail}
export interface LocalGroundTrace{point:Pos;turn:number;revision:number;expiresRevision:number;packOwner?:string}
export interface GroveDisturbance{vegetation:string;turn:number;revision:number;kind:'heavy-passage'|'logging';direction:LocalDirection}
export type KnowledgeState=Match&{localKnowledgeReports?:Record<string,LocalKnowledgeReport>;localGroundTraces?:Record<string,LocalGroundTrace>;groveDisturbances?:Record<string,GroveDisturbance>};
export type LocalKnowledgeAction={kind:'inspect-local';point:Pos};
export interface KnowledgeChecks{visible:(p:Pos)=>boolean;connected:(from:Pos,to:Pos)=>boolean}
const d=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const key=(p:Pos)=>`${p.x},${p.y}`;
const freshLocal=(s:Match,q:LocalGroundTrace)=>traceFresh(s,{id:'local',owner:'remnant',route:[q.point],turn:q.turn,revision:q.revision,erased:false,expiresRevision:q.expiresRevision});
const bounded=(s:Match,p:Pos)=>Number.isSafeInteger(p.x)&&Number.isSafeInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
const direction=(a:Pos,b:Pos):LocalDirection=>b.x>a.x?'east':b.x<a.x?'west':b.y>a.y?'south':'north';
const supported=['ulmo','vana','osse','wolf_pack','ent_grove'];
function hero(s:Match,seat:string){const p=s.players[seat],h=p&&s.units[p.hero.id];return p?.hero.status==='living'&&h?.alive&&h.active&&h.hp>0&&!activeEffects(s,h).some(e=>['stunned','incapacitated'].includes(e.kind))?h:undefined;}
function report(s:KnowledgeState,owner:string,point:Pos,detail:KnowledgeDetail){s.localKnowledgeReports??={};const q:LocalKnowledgeReport={owner,point:{x:point.x,y:point.y},turn:s.turn,revision:s.revision,detail};s.localKnowledgeReports[owner]=q;return q;}
/** Exact source domains only. Provisional local observation radius1; Ent uses a
 * real connected existing grove. No range extension comes from map knowledge. */
export function localKnowledgeReason(s:KnowledgeState,seat:string,point:Pos,c:KnowledgeChecks):string{
 const p=s.players[seat],h=hero(s,seat);if(!h||!supported.includes(p.profile))return 'Living supported local inspection hero required';
 if(!bounded(s,point)||d(h,point)>1||!c.visible(point))return 'Visible local inspection point required';
 if(['osse','ent_grove'].includes(p.profile)&&s.localKnowledgeReports?.[seat]?.turn===s.turn)return 'One inspected channel or grove per week';
 if(['ulmo','osse'].includes(p.profile)&&s.map.terrain[point.y*s.map.width+point.x]!=='water')return 'Existing local water required';
 if(p.profile==='vana'&&!Object.values(s.vegetation).some(v=>d(v,point)===0)&&!Object.values(s.facilities).some(f=>f.kind==='crop-plot'&&d(f,point)===0))return 'Existing plants or cultivated plot required';
 if(p.profile==='wolf_pack'&&(d(h,point)!==0||!s.localGroundTraces?.[key(point)]||!freshLocal(s,s.localGroundTraces[key(point)])))return 'Encounter a fresh local trace at hero position';
 if(p.profile==='ent_grove'&&(!Object.values(s.vegetation).some(v=>d(v,point)===0)||!c.connected(h,point)))return 'Existing connected grove required';
 return '';
}
/** Snapshots are dated condition evidence, never promises about future weather,
 * invisible enemies or recovery. Authored channel flow/draft is reported only
 * when present; unmarked water remains explicitly unknown. */
export function inspectLocalKnowledge(s:KnowledgeState,seat:string,point:Pos,c:KnowledgeChecks):LocalKnowledgeReport{
 const reason=localKnowledgeReason(s,seat,point,c);if(reason)throw new Error(reason);const p=s.players[seat];
 if(['ulmo','osse'].includes(p.profile)){
  const q=s.seaHazards[key(point)],channel=(s as OrdinaryEnvironmentState).waterChannels?.[key(point)],shallow=channel?channel.depth===1:!!s.shallowWater[key(point)];
  return report(s,seat,point,{kind:'water',flow:channel?.flow??'unknown',shallow,draft:channel?(channel.depth===1?'shallow':'deep'):shallow?'shallow':'unknown',safeDraft:channel?.depth??null,wave:q?.wave??null,fog:q?.fog??null,handling:q?.handling??null,blocked:Object.values(s.infrastructureSites).some(site=>site.kind==='channel'&&site.blocked&&d(site,point)===0)});
 }
 if(p.profile==='vana'){
  const v=Object.values(s.vegetation).find(v=>d(v,point)===0),f=Object.values(s.facilities).find(f=>f.kind==='crop-plot'&&d(f,point)===0),crop=f&&Object.values(s.crops).find(q=>q.plot===f.id&&q.status==='growing');
  return report(s,seat,point,{kind:'plant',viable:!!v?.mature||!!crop,recoverable:!!f&&f.hp>0||!!v?.mature});
 }
 if(p.profile==='wolf_pack')return report(s,seat,point,{kind:'scent',ownPack:s.localGroundTraces![key(point)].packOwner===seat});
 const v=Object.values(s.vegetation).find(v=>d(v,point)===0)!,e=s.groveDisturbances?.[v.id];
 return report(s,seat,point,{kind:'grove',disturbance:e&&e.turn>=s.turn-1?e.kind:'none',direction:e&&e.turn>=s.turn-1?e.direction:null});
}
/** One real logging event hook, not a logging action or resource producer.
 * No ordinary logging subsystem is implied by this optional producer adapter. */
export function recordGroveLogging(s:KnowledgeState,vegetation:string,from:Pos,to:Pos):void{
 const v=s.vegetation[vegetation];if(!v||d(v,to)!==0||d(from,to)!==1)throw new Error('Actual local grove logging direction required');s.groveDisturbances??={};s.groveDisturbances[vegetation]={vegetation,turn:s.turn,revision:s.revision,kind:'logging',direction:direction(from,to)};
}
/** Connected silk uses actual intact paid crossings and surviving staffed owned
 * anchors, rooted within1tile of the occupied core lair. No remote web sensing. */
function connectedSilk(s:Match,owner:string):Pos[]{
 const lair=s.facilities[`${owner}:core`];if(!lair||lair.owner!==owner||lair.hp<=0||lair.workers<1)return [];
 const spans=Object.values(s.crossings).filter(q=>q.owner===owner&&q.kind==='silk'&&q.phase==='ready'&&q.hp>0&&[s.facilities[q.from],s.facilities[q.to]].every(f=>f?.owner===owner&&f.hp>0&&f.workers>0));
 const reachable=new Set(Object.values(s.facilities).filter(f=>f.owner===owner&&d(f,lair)<=1).map(f=>f.id)),points:Pos[]=[];let changed=true;
 while(changed){changed=false;for(const q of spans){if(!reachable.has(q.from)&&!reachable.has(q.to))continue;points.push(...q.tiles);if(!reachable.has(q.from)||!reachable.has(q.to)){reachable.add(q.from);reachable.add(q.to);changed=true;}}}
 return points;
}
/** Called only AFTER committed physical movement, with the traversed route.
 * Per-cell newest trace and per-grove latest disturbance bound retained data.
 * Ground scent lifetime current/previous week is provisional. Reports contain
 * neither unit IDs, counts nor paths. Concealed/erased movements leave no scent,
 * but physical contact with intact silk remains an anonymous vibration. */
export function recordLocalKnowledgeMovement(s:KnowledgeState,u:Unit,route:Pos[]):void{
 if(s.units[u.id]!==u||!u.alive||u.flying&&!u.landed||route.length<2||d(route.at(-1)!,u)!==0||route.some((p,i)=>!bounded(s,p)||i>0&&d(p,route[i-1])!==1))return;
 s.localGroundTraces??={};s.groveDisturbances??={};
 const actualTrace=Object.values(s.movementTraces).find(t=>t.unit===u.id&&t.revision===s.revision&&t.route.length===route.length&&t.route.every((p,i)=>d(p,route[i])===0));
 const erased=actualTrace?.erased||activeEffects(s,u).some(e=>['concealed','forest-veil'].includes(e.kind));
 for(let i=1;i<route.length;i++){
  const p=route[i];if(!erased)s.localGroundTraces[key(p)]={point:{...p},turn:s.turn,revision:s.revision,expiresRevision:actualTrace?.expiresRevision??s.revision+2,...(s.players[u.owner]?.profile==='wolf_pack'&&u.kind==='beast'?{packOwner:u.owner}:{})};
  if(u.loadClass==='large')for(const v of Object.values(s.vegetation))if(d(v,p)===0)s.groveDisturbances[v.id]={vegetation:v.id,turn:s.turn,revision:s.revision,kind:'heavy-passage',direction:direction(route[i-1],p)};
  for(const owner of Object.keys(s.players))if(s.players[owner].profile==='spider_brood'&&hero(s,owner)&&connectedSilk(s,owner).some(at=>d(at,p)===0))report(s,owner,s.facilities[`${owner}:core`],{kind:'tremor',direction:direction(route[i-1],p),eventTurn:s.turn,eventRevision:s.revision});
 }
 pruneLocalKnowledge(s);
}
export function pruneLocalKnowledge(s:KnowledgeState):void{
 for(const[id,q]of Object.entries(s.localGroundTraces??{}))if(!freshLocal(s,q))delete s.localGroundTraces![id];
 for(const[id,q]of Object.entries(s.groveDisturbances??{}))if(q.turn<s.turn-1||!s.vegetation[id])delete s.groveDisturbances![id];
}
export function validateLocalKnowledge(s:KnowledgeState,guestSeat?:string):void{
 const time=(turn:number,revision:number)=>Number.isSafeInteger(turn)&&turn>=1&&turn<=s.turn&&Number.isSafeInteger(revision)&&revision>=0&&revision<=s.revision;
 const fail=()=>{throw new Error('Invalid private local knowledge evidence');};
 if(guestSeat&&(Object.keys(s.localGroundTraces??{}).length||Object.keys(s.groveDisturbances??{}).length))fail();
 for(const[id,q]of Object.entries(s.localGroundTraces??{}))if(id!==key(q.point)||!bounded(s,q.point)||!time(q.turn,q.revision)||![q.revision+1,q.revision+2].includes(q.expiresRevision)||(q.packOwner&&s.players[q.packOwner]?.profile!=='wolf_pack'))fail();
 for(const[id,q]of Object.entries(s.groveDisturbances??{}))if(id!==q.vegetation||!s.vegetation[id]||!time(q.turn,q.revision)||!['logging','heavy-passage'].includes(q.kind)||!['north','east','south','west'].includes(q.direction))fail();
 const kinds:Record<string,string[]>={water:['ulmo','osse'],plant:['vana'],scent:['wolf_pack'],grove:['ent_grove'],tremor:['spider_brood']};
 for(const[id,q]of Object.entries(s.localKnowledgeReports??{})){
  if(id!==q.owner||!kinds[q.detail.kind]?.includes(s.players[q.owner]?.profile)||!bounded(s,q.point)||!time(q.turn,q.revision)||(guestSeat&&q.owner!==guestSeat))fail();
  if(q.detail.kind==='tremor'&&(!time(q.detail.eventTurn,q.detail.eventRevision)||q.detail.eventTurn>q.turn||q.detail.eventRevision>q.revision))fail();
 }
}
