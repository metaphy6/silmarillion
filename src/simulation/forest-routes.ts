import type {Match,Pos,Unit} from './types';
import {activeEffects,sightline} from './effects';
import {effectiveRelation} from './diplomacy';
import {observation,terrainObserved} from './visibility';
import {movementPenalty} from './conditions';
import {fatigueMovementPenalty} from './fatigue';
import {woodlandMovementCost,type MovementRouteFinder} from './movement-plans';
import {movementZonePenalty} from './zones';
export type ForestRequest={mode:'departing';unit:string}|{mode:'wild-road';survey:string}|{mode:'guest-road';survey:string;origin:string;destination:string};
export interface ForestRoute{id:string;owner:string;hero:string;kind:'wild-road'|'guest-road';survey:string;route:Pos[];turn:number;revision:number;markers:string[];origin?:string;destination?:string;released:boolean;patrolled:boolean}
export interface ForestVeil{unit:string;owner:string;hero:string;until:number;fallback:string;trail:Pos[]}
export interface ForestReport{id:string;owner:string;kind:'passage'|'entrance';point:Pos;turn:number;revision:number;expires:number;uncertainty:string}
export interface ForestEntrance{owner:string;facility:string}
export type ForestState=Match&{forestRoutes:Record<string,ForestRoute>;forestVeils:Record<string,ForestVeil>;forestReports:Record<string,ForestReport>;forestEntrances:Record<string,ForestEntrance>};
const d=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const wooded=(s:Match,p:Pos)=>s.map.terrain[p.y*s.map.width+p.x]==='woodland';
const ordinary=(u:Unit|undefined)=>!!u&&['company','worker','beast','construct'].includes(u.kind)&&!u.great;
const able=(s:Match,u:Unit|undefined)=>!!u&&u.alive&&u.active&&u.supplied&&!activeEffects(s,u).some(e=>['stunned','incapacitated','root'].includes(e.kind));
const ownHero=(s:Match,seat:string)=>s.units[s.players[seat]?.hero.id];
const point=(p:Pos)=>({x:p.x,y:p.y});
export function forestAnchors(s:ForestState,seat:string):number{return Object.values(s.forestRoutes??{}).filter(q=>q.owner===seat&&q.kind==='guest-road').length;}
function liveRoute(s:ForestState,q:ForestRoute){const p=s.players[q.owner],h=s.units[q.hero];if(q.released||q.turn!==s.turn||!p||p.hero.status!=='living'||!able(s,h))return false;if(q.kind==='wild-road')return true;return q.route.every(at=>wooded(s,at))&&q.markers.every(id=>s.facilities[id]?.hp>0&&s.facilities[id]?.owner===q.owner)&&[q.origin,q.destination].every(id=>!!id&&s.facilities[id]?.hp>0&&s.facilities[id]?.owner===q.owner&&s.facilities[id]?.workers>0);}
export function forestReason(s:ForestState,seat:string,a:ForestRequest,connected:(a:Pos,b:Pos)=>boolean):string {
 const p=s.players[seat],h=ownHero(s,seat),profile=a.mode==='wild-road'?'orome':'melian';if(!p||p.profile!==profile||p.hero.status!=='living'||!able(s,h)||p.hero.readiness<(a.mode==='departing'?2:3))return 'Living supplied source hero and readiness required';
 if(a.mode==='departing'){const u=s.units[a.unit];if(!ordinary(u)||!able(s,u)||effectiveRelation(s,seat,u.owner)!=='alliance')return 'One consenting ordinary living party required';if(Math.hypot(u.x-h.x,u.y-h.y)>10/3||!wooded(s,u)||!wooded(s,h)||!sightline(s,h,u))return 'Visible party within ten metres in a wooded encounter required';if(!Object.values(s.tacticalOrders).some(q=>q.kind==='fallback'&&q.unit===u.id&&q.until>s.revision))return 'Actual declared ordinary withdrawal required';return '';}
 const r=s.routeSurveys[a.survey];if(!r||r.owner!==seat||r.route.length<2||r.route.length>128||!connected(h,r.route[0]))return 'Existing physically surveyed route in one connected region required';
 if(a.mode==='wild-road'){if(d(h,r.route[0])!==0)return 'Hero must personally start at the marked patrol route';const allowance=Math.max(1,h.move-movementPenalty(s,h)-fatigueMovementPenalty(s,h));if(r.route.length-1+woodlandMovementCost(s,h,r.route)+movementZonePenalty(s,h,r.route)>allowance)return 'Marked patrol must fit one actual ordinary movement allowance';if(p.stock.P<1)return 'One provisional ordinary travel Provision required';return '';}
 const origin=s.facilities[a.origin],dest=s.facilities[a.destination];if(!origin||!dest||origin.id===dest.id||origin.owner!==seat||dest.owner!==seat||origin.workers<1||dest.workers<1||origin.hp<=0||dest.hp<=0||d(h,origin)>1||d(r.route[0],origin)>1||d(r.route.at(-1)!,dest)>1)return 'Distinct owned staffed sanctuary endpoints adjoining the hero and surveyed route required';
 if(!r.route.every(at=>wooded(s,at)))return 'Guest Road needs existing continuous wooded cover';if(forestAnchors(s,seat)>=3)return 'All three hero Anchor slots occupied until turn end';if(p.stock.M<10||p.stock.K<5)return 'Ten Materials and five Lore supplies required';return '';
}
/** Caller consumes tactical hero action or weekly commitment. Personal wild-road
 * travel uses that commitment; no strategic operation or second fallback charge. 1P travel, marker20HP and local one-tile
 * inspection/harassment reach are provisional ordinary infrastructure values. */
export function prepareForest(s:ForestState,seat:string,a:ForestRequest,connected:(a:Pos,b:Pos)=>boolean):ForestRoute|undefined {
 const reason=forestReason(s,seat,a,connected);if(reason)throw new Error(reason);const p=s.players[seat],h=ownHero(s,seat);p.hero.readiness-=a.mode==='departing'?2:3;
 if(a.mode==='departing'){const fallback=Object.values(s.tacticalOrders).find(q=>q.kind==='fallback'&&q.unit===a.unit)!;s.forestVeils[a.unit]={unit:a.unit,owner:seat,hero:h.id,until:s.revision+2,fallback:fallback.id,trail:[]};return;}
 const q:ForestRoute={id:`forest:${s.nextId++}`,owner:seat,hero:h.id,kind:a.mode,survey:a.survey,route:s.routeSurveys[a.survey].route.map(point),turn:s.turn,revision:s.revision,markers:[],released:false,patrolled:false};
 if(a.mode==='guest-road'){p.stock.M-=10;p.stock.K-=5;q.origin=a.origin;q.destination=a.destination;for(const at of [q.route[0],q.route.at(-1)!]){const id=`guest-marker:${s.nextId++}`;s.facilities[id]={id,owner:seat,name:'Prepared Guest Road marker',kind:'guest-marker',tier:1,hp:20,maxHp:20,workers:0,...point(at)};q.markers.push(id);}}else p.stock.P--;
 s.forestRoutes[q.id]=q;return q;
}
export function resolveForestPatrols(s:ForestState,path:MovementRouteFinder,moved:(u:Unit,route:Pos[])=>void):void {
 for(const q of Object.values(s.forestRoutes).sort((a,b)=>a.id.localeCompare(b.id))){if(q.kind!=='wild-road'||q.patrolled||q.revision>=s.revision||!liveRoute(s,q))continue;const h=s.units[q.hero];q.patrolled=true;if(d(h,q.route[0])!==0||q.route.some((at,i)=>i>0&&(path(s,q.route[i-1],at,h)?.length!==2||Object.values(s.units).some(u=>u.id!==h.id&&u.alive&&u.active&&d(u,at)===0)))){q.released=true;continue;}const allowance=Math.max(1,h.move-movementPenalty(s,h)-fatigueMovementPenalty(s,h));if(q.route.length-1+woodlandMovementCost(s,h,q.route)+movementZonePenalty(s,h,q.route)>allowance){q.released=true;continue;}Object.assign(h,q.route.at(-1)!);moved(h,q.route);}
}
export function forestAttack(s:ForestState,unit:string):void{delete s.forestVeils?.[unit];}
function report(s:ForestState,owner:string,kind:ForestReport['kind'],at:Pos,extended=false){const id=`forest-report:${s.nextId++}`;s.forestReports[id]={id,owner,kind,point:point(at),turn:s.turn,revision:s.revision,expires:s.turn+(extended?3:1),uncertainty:'Dated personally observed crossing; identity and numbers unestablished. Weather, concealment and false trails can invalidate later inference.'};const rows=Object.values(s.forestReports).filter(r=>r.owner===owner);for(const r of rows.slice(0,Math.max(0,rows.length-64)))delete s.forestReports[r.id];}
/** Trusted actual-movement hook; no raw moving identity is placed in reports. */
export function forestMovement(s:ForestState,u:Unit,route:Pos[]):void {
 if(!u.alive||route.length<2)return;if(s.units[u.id]!==u||d(route.at(-1)!,u)!==0||route.some((at,i)=>!Number.isSafeInteger(at.x)||!Number.isSafeInteger(at.y)||at.x<0||at.y<0||at.x>=s.map.width||at.y>=s.map.height||i>0&&d(at,route[i-1])!==1))throw new Error('Forest evidence requires actual adjacent traversed movement');
 const v=s.forestVeils?.[u.id];if(v)v.trail=route.map(point);if(v&&(v.until<=s.revision||route.some(at=>!wooded(s,at))))delete s.forestVeils[u.id];
 for(const q of Object.values(s.forestRoutes??{})){if(q.kind!=='wild-road'||u.owner===q.owner||!liveRoute(s,q))continue;const h=s.units[q.hero],at=route.find(at=>q.route.some(p=>d(at,p)===0)&&d(h,at)<=3&&sightline(s,h,at));if(at&&observation(s,q.owner,u)==='identified')report(s,q.owner,'passage',at,true);}
 for(const entry of Object.values(s.forestEntrances??{})){const f=s.facilities[entry.facility];if(!f||f.owner!==entry.owner||f.hp<=0||f.workers<1||s.players[entry.owner]?.profile!=='melian')continue;const at=route.find(p=>d(f,p)===0);if(at)report(s,entry.owner,'entrance',at);}
}
/** Trail concealment does not make its departing body invisible. Guest Road only
 * conceals an ordinary physical carrier on this ward's real route and endpoints. */
export function forestObservation(s:ForestState,seat:string,u:Unit):'ordinary'|'hidden' {
 if(!ordinary(u)||u.owner===seat)return 'ordinary';const convoy=Object.values(s.convoys).find(c=>c.carrier===u.id&&c.phase!=='lost');if(!convoy)return 'ordinary';const ward=Object.values(s.forestRoutes??{}).find(q=>q.kind==='guest-road'&&q.owner===u.owner&&q.origin===convoy.origin&&q.destination===convoy.destination&&liveRoute(s,q)&&q.route.some(at=>d(at,u)===0));if(!ward)return 'ordinary';const close=Object.values(s.units).some(v=>v.owner===seat&&v.alive&&v.active&&d(v,u)<=1&&sightline(s,v,u));return close?'ordinary':'hidden';
}
export function forestTrailHidden(s:ForestState,u:Unit,route:Pos[]):boolean{const v=s.forestVeils?.[u.id];return !!v&&v.until>s.revision&&ordinary(u)&&route.every(at=>wooded(s,at));}
export function harassmentReason(s:ForestState,seat:string,unit:string,target:string):string {const u=s.units[unit],v=s.units[target];if(!able(s,u)||u.owner!==seat||u.kind!=='company'||!ordinary(v)||!v.alive||!v.active||effectiveRelation(s,seat,v.owner)!=='war'||d(u,v)>1||observation(s,seat,v)!=='identified')return 'Own supplied company beside an identified hostile ordinary party required';return '';}
/** Caller consumes one operation even when no cargo exists or patrol deters it.
 * Target legality and public outcome never disclose private convoy membership.
 * Provisional actual cargo consequence loses this week's travel step, not stock/HP. */
export function harassConvoy(s:ForestState,seat:string,unit:string,target:string):'resolved' {const reason=harassmentReason(s,seat,unit,target);if(reason)throw new Error(reason);const c=Object.values(s.convoys).find(c=>c.carrier===target&&c.phase==='travel');if(!c)return 'resolved';const guarded=Object.values(s.forestRoutes).some(q=>q.kind==='wild-road'&&liveRoute(s,q)&&effectiveRelation(s,q.owner,c.owner)==='alliance'&&q.route.some(at=>d(at,c)===0)&&d(s.units[q.hero],c)<=1);if(!guarded){c.lastProgress=s.turn;c.pauseReason='Minor harassment delayed this ordinary travel step';}return 'resolved';}
export function releaseForest(s:ForestState,seat:string,id:string):void{const q=s.forestRoutes[id];if(!q||q.owner!==seat)throw new Error('Own maintained route required');q.released=true;}
export function forestWeekly(s:ForestState):void {for(const q of Object.values(s.forestRoutes)){for(const id of q.markers)delete s.facilities[id];delete s.forestRoutes[q.id];}s.forestVeils={};for(const r of Object.values(s.forestReports))if(r.expires<=s.turn)delete s.forestReports[r.id];}
export function entranceReason(s:ForestState,seat:string,facility:string):string{const p=s.players[seat],h=ownHero(s,seat),f=s.facilities[facility];return !p||p.profile!=='melian'||p.hero.status!=='living'||!able(s,h)||!f||f.owner!==seat||f.hp<=0||f.workers<1||d(h,f)>1?'Living Melian beside one owned staffed sanctuary entrance required':'';}
/** Ordinary one-operation assignment, not a new magical charge or extra Anchor. */
export function assignForestEntrance(s:ForestState,seat:string,facility:string):void{const reason=entranceReason(s,seat,facility);if(reason)throw new Error(reason);s.forestEntrances[seat]={owner:seat,facility};}
export function validateForest(s:ForestState,guestSeat?:string):void {
 const bounded=(p:Pos)=>Number.isSafeInteger(p.x)&&Number.isSafeInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
 for(const[id,q]of Object.entries(s.forestRoutes)){const p=s.players[q.owner];if(id!==q.id||!p||p.commitment!==0||(guestSeat&&q.owner!==guestSeat)||q.hero!==p.hero.id||p.profile!==(q.kind==='guest-road'?'melian':'orome')||q.turn!==s.turn||q.revision>s.revision||q.route.length<2||q.route.length>128||q.route.some((at,i)=>!bounded(at)||i>0&&d(at,q.route[i-1])!==1))throw new Error('Invalid private forest route');if(q.kind==='guest-road'&&(q.markers.length!==2||new Set(q.markers).size!==2||!q.origin||!q.destination||q.origin===q.destination||q.markers.some(marker=>s.facilities[marker]?.kind!=='guest-marker'||s.facilities[marker]?.owner!==q.owner)||forestAnchors(s,q.owner)>3))throw new Error('Invalid maintained route Anchor');if(q.kind==='wild-road'&&(q.markers.length||q.origin||q.destination))throw new Error('Patrol cannot create Anchor markers');}
 for(const[id,v]of Object.entries(s.forestVeils)){const p=s.players[v.owner],u=s.units[v.unit];if(id!==v.unit||!p||p.commitment!==0||p.profile!=='melian'||v.hero!==p.hero.id||(guestSeat&&v.owner!==guestSeat)||(!guestSeat&&!ordinary(u))||v.until<s.revision||v.until>s.revision+3||v.trail.length>128||v.trail.some((at,i)=>!bounded(at)||i>0&&d(at,v.trail[i-1])!==1))throw new Error('Invalid private departing trail veil');}
 for(const[id,r]of Object.entries(s.forestReports)){if(id!==r.id||!s.players[r.owner]||(guestSeat&&r.owner!==guestSeat)||!bounded(r.point)||r.turn>s.turn||r.revision>s.revision||r.expires<r.turn||r.expires>r.turn+3)throw new Error('Invalid dated private forest report');if(Object.values(s.forestReports).filter(q=>q.owner===r.owner).length>64)throw new Error('Forest report capacity exceeded');}
 for(const[id,e]of Object.entries(s.forestEntrances)){if(id!==e.owner||s.players[e.owner]?.profile!=='melian'||(guestSeat&&e.owner!==guestSeat)||!s.facilities[e.facility])throw new Error('Invalid staffed threshold assignment');}
}

export function inspectForestReason(s:ForestState,seat:string,unit:string,at:Pos):string{const u=s.units[unit];return !Number.isSafeInteger(at.x)||!Number.isSafeInteger(at.y)||at.x<0||at.y<0||at.x>=s.map.width||at.y>=s.map.height||!ordinary(u)||!able(s,u)||u.owner!==seat||d(u,at)>1||!terrainObserved(s,seat,at)?'Own active ordinary party beside actually observed ground required':'';}
/** A paid physical inspection has the same public result if no trail is present.
 * It reports anonymous dated evidence only; no hidden unit identity or route. */
export function inspectForestTrail(s:ForestState,seat:string,unit:string,at:Pos):void{const reason=inspectForestReason(s,seat,unit,at);if(reason)throw new Error(reason);const found=Object.values(s.forestVeils).some(v=>v.until>s.revision&&v.trail.some(p=>d(p,at)===0));if(found)report(s,seat,'passage',at);}

/** Call at each resolved tactical boundary. Death suspends rather than releases a
 * maintained Anchor; physical loss permanently ends its route until turn cleanup. */
export function settleForest(s:ForestState):void{for(const[id,v]of Object.entries(s.forestVeils))if(v.until<=s.revision||!s.units[id]?.alive)delete s.forestVeils[id];for(const q of Object.values(s.forestRoutes)){if(q.kind==='guest-road'&&(q.route.some(at=>!wooded(s,at))||q.markers.some(id=>!s.facilities[id]||s.facilities[id].hp<=0||s.facilities[id].owner!==q.owner)||[q.origin,q.destination].some(id=>!id||!s.facilities[id]||s.facilities[id].hp<=0||s.facilities[id].owner!==q.owner)))q.released=true;}}
