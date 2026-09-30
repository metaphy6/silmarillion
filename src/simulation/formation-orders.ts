import type {Match,Pos,Unit} from './types';
import {activeEffects,sightline} from './effects';
import {observation,terrainObserved} from './visibility';
import {movementPenalty} from './conditions';
import {fatigueMovementPenalty,travelFatigue} from './fatigue';
import {movementZonePenalty,crossZones} from './zones';
import {woodlandMovementCost,type MovementRouteFinder} from './movement-plans';
import {factionProduction} from '../content/production';
export interface FormationMember{unit:string;route:Pos[]}
export type FormationRequest={mode:'rendezvous';movement:'advance'|'retreat';members:FormationMember[]}|{mode:'rotation';members:FormationMember[]}|{mode:'muster';relay:string;objective:string;members:FormationMember[];commission?:FormationMember};
export type FormationOrder=FormationRequest&{id:string;owner:string;hero:string;origin:Pos;turn:number;revision:number;until:number;communicationsCut:boolean};
export interface GarrisonPost{unit:string;owner:string;post:string;survey:string}
export interface GarrisonReport{id:string;owner:string;point:Pos;turn:number;revision:number;uncertainty:string}
export type FormationState=Match&{formationOrders:Record<string,FormationOrder>;garrisonPosts:Record<string,GarrisonPost>;garrisonReports:Record<string,GarrisonReport>};
const d=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const bounded=(s:Match,p:Pos)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
const able=(s:Match,u:Unit|undefined)=>Boolean(u?.alive&&u.active&&u.supplied&&!activeEffects(s,u).some(e=>['root','stunned','incapacitated','rout'].includes(e.kind)));
export const formationOperations=(a:FormationRequest)=>a.mode==='muster'?3:2;
export const formationBusy=(s:FormationState,id:string)=>Object.values(s.formationOrders??{}).some(q=>q.hero===id||q.members.some(m=>m.unit===id));
function routeReason(s:Match,seat:string,m:FormationMember,path:MovementRouteFinder,moving:string[],resolving=false):string {
 const u=s.units[m.unit],r=m.route;if(!able(s,u)||u.owner!==seat||u.kind!=='company')return 'Owned supplied ordinary company required';
 if(r.length<2||r.length>128||r.some((p,i)=>!bounded(s,p)||i>0&&d(p,r[i-1])!==1)||d(u,r[0])!==0)return 'Declare an adjacent physical route from the company';
 const allowance=Math.min(Math.max(1,u.move-movementPenalty(s,u)-fatigueMovementPenalty(s,u)),...activeEffects(s,u).filter(e=>e.kind==='move-limit').map(e=>e.value));
 if(r.length-1+woodlandMovementCost(s,u,r)+movementZonePenalty(s,u,r)>allowance)return 'Each route must fit its normal movement allowance';
 if(r.slice(1).some((at,i)=>!terrainObserved(s,seat,at)||path(s,r[i],at,u)?.length!==2||Object.values(s.units).some(v=>v.alive&&v.active&&!moving.includes(v.id)&&d(v,at)===0&&(resolving||observation(s,seat,v)==='identified'))))return 'A route, exit or occupied tile is blocked';return '';
}
export function postReason(s:FormationState,seat:string,unit:string,post:string,survey:string):string {
 const u=s.units[unit],f=s.facilities[post],r=s.routeSurveys[survey];if(!able(s,u)||u.owner!==seat||u.kind!=='company'||formationBusy(s,unit))return 'Free supplied own company required';
 if(!f||f.owner!==seat||f.hp<=0||f.workers<1||d(u,f)>1||!r||r.owner!==seat||!r.route.some(p=>d(p,f)<=1))return 'Existing staffed own post beside company and actual surveyed patrol route required';return '';
}
export function assignPost(s:FormationState,seat:string,unit:string,post:string,survey:string):void {const reason=postReason(s,seat,unit,post,survey);if(reason)throw new Error(reason);s.garrisonPosts[unit]={unit,owner:seat,post,survey};}
export function formationReason(s:FormationState,seat:string,a:FormationRequest,path:MovementRouteFinder):string {
 const p=s.players[seat],h=p&&s.units[p.hero.id],profile=a.mode==='rendezvous'?'elf_avari':a.mode==='rotation'?'elf_fingolfin':'eonwe';
 if(!p||p.profile!==profile||p.hero.status!=='living'||!able(s,h)||p.hero.readiness<(a.mode==='rendezvous'?2:3))return 'Living supplied matching hero and source readiness required';
 if(formationBusy(s,h.id))return 'Hero already directs a formation order';
 const count=formationOperations(a),ids=a.members.map(m=>m.unit);if(ids.length!==count||new Set(ids).size!==count||new Set(a.members.map(m=>`${m.route.at(-1)?.x}:${m.route.at(-1)?.y}`)).size!==count)return `Exactly ${count} distinct companies and distinct endpoints required`;
 for(let i=0;i<a.members.length;i++)for(let j=i+1;j<a.members.length;j++){const aRoute=a.members[i].route,bRoute=a.members[j].route;for(let step=1;step<Math.max(aRoute.length,bRoute.length);step++){const aNow=aRoute[Math.min(step,aRoute.length-1)],bNow=bRoute[Math.min(step,bRoute.length-1)],aPrev=aRoute[Math.min(step-1,aRoute.length-1)],bPrev=bRoute[Math.min(step-1,bRoute.length-1)];if(aNow&&bNow&&aPrev&&bPrev&&(d(aNow,bNow)===0||d(aNow,bPrev)===0&&d(bNow,aPrev)===0))return 'Simultaneous routes collide or exchange through an occupied edge';}}
 for(const m of a.members){if(formationBusy(s,m.unit))return 'Company has a pending formation order';const reason=routeReason(s,seat,m,path,ids);if(reason)return reason;const u=s.units[m.unit];if(a.mode==='rendezvous'&&(factionProduction(p.profile).unit.traits.includes('heavy')||Math.hypot(u.x-h.x,u.y-h.y)>4||!sightline(s,h,u)))return 'Both own light companies must be within the clear local signal radius';}
 if(a.mode==='rotation'){
  const posts=a.members.map(m=>s.garrisonPosts[m.unit]);if(posts.some(q=>!q)||posts[0].post===posts[1].post)return 'Two actual garrisons at distinct existing posts required';
  for(let i=0;i<2;i++){const own=s.facilities[posts[i].post],dest=s.facilities[posts[1-i].post];if(!own||!dest||own.owner!==seat||dest.owner!==seat||own.hp<=0||dest.hp<=0||own.workers<1||dest.workers<1||d(s.units[posts[i].unit],own)>1||d(a.members[i].route.at(-1)!,dest)>1||!path(s,h,own,h))return 'Open connected road exchanging the two actual garrison posts required';}
 }
 if(a.mode==='muster'){
  const f=s.facilities[a.relay],objective=s.sites.find(q=>q.id===a.objective);if(!f||f.owner!==seat||f.hp<=0||f.workers<1||!objective||d(f,objective)>2||!path(s,h,f,h))return 'Staffed supplied rally point connected to hero and declared hold-site operation required';
  if(a.members.some(m=>d(m.route.at(-1)!,objective)>1))return 'Every company must actually reach its own rally position at the declared objective';
  if(p.stock.P<15||p.stock.M<10)return 'Fifteen Provisions and ten Materials required';
  if(a.commission){if(!ids.includes(a.commission.unit))return 'One participating ordinary company may hold the written mission';const reason=routeReason(s,seat,a.commission,path,ids);if(reason)return reason;}
 }
 return '';
}
/** Caller reserves exactly2/3 ordinary operations and the appropriate hero action.
 * No further operation or automatic attack is produced by reaching the rally. */
export function prepareFormation(s:FormationState,seat:string,a:FormationRequest,path:MovementRouteFinder):FormationOrder {
 const reason=formationReason(s,seat,a,path);if(reason)throw new Error(reason);const p=s.players[seat],h=s.units[p.hero.id];p.hero.readiness-=a.mode==='rendezvous'?2:3;if(a.mode==='muster'){p.stock.P-=15;p.stock.M-=10;}
 const request:FormationRequest=a.mode==='rendezvous'?{mode:a.mode,movement:a.movement,members:structuredClone(a.members)}:a.mode==='rotation'?{mode:a.mode,members:structuredClone(a.members)}:{mode:a.mode,relay:a.relay,objective:a.objective,members:structuredClone(a.members),...(a.commission?{commission:structuredClone(a.commission)}:{})};
 const q:FormationOrder={...request,id:`formation:${s.nextId++}`,owner:seat,hero:h.id,origin:{x:h.x,y:h.y},turn:s.turn,revision:s.revision,until:s.revision+2,communicationsCut:false};s.formationOrders[q.id]=q;return q;
}
function fallback(s:FormationState,q:FormationOrder,m:FormationMember):void {const id=`fallback:${s.nextId++}`;s.tacticalOrders[id]={id,kind:'fallback',owner:q.owner,unit:m.unit,route:structuredClone(m.route),shielded:false,createdTurn:s.turn,createdRevision:q.revision,until:s.revision+1};}
/** Resolve after counter-orders, before the ordinary fallback/pursuit consumer.
 * Avari signal4tiles; actual patrol sight8tiles; both provisional geometry. */
export function resolveFormations(s:FormationState,path:MovementRouteFinder,moved?:(u:Unit,route:Pos[])=>void):void {
 for(const q of Object.values(s.formationOrders).sort((a,b)=>a.hero.localeCompare(b.hero))){if(q.revision>=s.revision)continue;const h=s.units[q.hero],ids=q.members.map(m=>m.unit);const cut=q.communicationsCut||!able(s,h)||d(h,q.origin)!==0||(q.mode==='muster'&&(!s.facilities[q.relay]||s.facilities[q.relay].owner!==q.owner||s.facilities[q.relay].hp<=0||s.facilities[q.relay].workers<1||!path(s,h,s.facilities[q.relay],h)));
  if(q.turn!==s.turn||q.until<s.revision){delete s.formationOrders[q.id];continue;}
  if(cut){delete s.formationOrders[q.id];if(q.mode==='muster'&&q.commission&&!routeReason(s,q.owner,q.commission,path,[q.commission.unit],true))fallback(s,q,q.commission);continue;}
  if(q.members.some(m=>routeReason(s,q.owner,m,path,ids,true))||(q.mode==='rendezvous'&&q.members.some(m=>{const u=s.units[m.unit];return Math.hypot(u.x-h.x,u.y-h.y)>4||!sightline(s,h,u);}))){delete s.formationOrders[q.id];continue;}
  if(q.mode==='rotation'&&q.members.some(m=>{const post=s.garrisonPosts[m.unit],f=post&&s.facilities[post.post];return !f||f.hp<=0||f.workers<1||f.owner!==q.owner;})){delete s.formationOrders[q.id];continue;}
  if(q.mode==='rendezvous'&&q.movement==='retreat'){for(const m of q.members){const u=s.units[m.unit];u.effects.push({kind:'rendezvous',value:1,until:s.revision+1,source:`rendezvous:${q.id}`});fallback(s,q,m);}delete s.formationOrders[q.id];continue;}
  for(const m of q.members){const u=s.units[m.unit];crossZones(s,u,m.route);travelFatigue(s,u,u,m.route.at(-1)!);Object.assign(u,m.route.at(-1)!);moved?.(u,m.route);}
  if(q.mode==='rotation'){const a=s.garrisonPosts[q.members[0].unit],b=s.garrisonPosts[q.members[1].unit];[a.post,b.post]=[b.post,a.post];[a.survey,b.survey]=[b.survey,a.survey];}
  delete s.formationOrders[q.id];
 }
}
export function interruptFormation(s:FormationState,unit:string,hit:number):void {if(hit<=0)return;for(const q of Object.values(s.formationOrders))if(q.hero===unit){if(q.mode==='muster')q.communicationsCut=true;else delete s.formationOrders[q.id];}}
/** Keeps reporting attached to existing physical patrol observers. During a
 * rotation only the actual moving garrison's current optical coverage counts. */
export function recordFormationObservation(s:FormationState,u:Unit,route:Pos[]):void {
 if(s.units[u.id]!==u||!u.alive||route.length<2||d(u,route.at(-1)!)!==0)return;
 for(const g of Object.values(s.garrisonPosts??{})){const guard=s.units[g.unit],post=s.facilities[g.post],survey=s.routeSurveys[g.survey];if(!able(s,guard)||!post||post.hp<=0||post.workers<1||post.owner!==g.owner||!survey||u.owner===g.owner)continue;const moving=Object.values(s.formationOrders).some(q=>q.mode==='rotation'&&q.members.some(m=>m.unit===guard.id));if(!moving&&d(guard,post)>1)continue;const at=route.find(at=>survey.route.some(p=>d(p,at)===0)&&d(guard,at)<=8&&observation({...s,units:{[guard.id]:guard,[u.id]:{...u,...at}},facilities:{}},g.owner,{...u,...at})!=='hidden');if(!at)continue;const id=`garrison-report:${s.nextId++}`;s.garrisonReports[id]={id,owner:g.owner,point:{...at},turn:s.turn,revision:s.revision,uncertainty:'Dated patrol crossing at an actually observed point; no identity or live tracking.'};const own=Object.values(s.garrisonReports).filter(r=>r.owner===g.owner);for(const r of own.slice(0,Math.max(0,own.length-64)))delete s.garrisonReports[r.id];}
}
export function validateFormations(s:FormationState,guestSeat?:string):void {
 const assigned=new Set<string>();for(const[id,q]of Object.entries(s.formationOrders)){const p=s.players[q.owner],expected=q.mode==='rendezvous'?'elf_avari':q.mode==='rotation'?'elf_fingolfin':'eonwe';if(id!==q.id||!p||p.profile!==expected||q.hero!==p.hero.id||(guestSeat&&q.owner!==guestSeat)||q.turn!==s.turn||q.revision>s.revision||q.until!==q.revision+2||q.until<s.revision||!bounded(s,q.origin)||q.members.length!==formationOperations(q)||p.operations>3-formationOperations(q)||p.commitment!==0)throw new Error('Invalid paid formation plan');for(const m of q.members){const u=s.units[m.unit];if(!u||u.owner!==q.owner||u.kind!=='company'||assigned.has(m.unit)||m.route.length<2||m.route.length>128||m.route.some((p,i)=>!bounded(s,p)||i>0&&d(p,m.route[i-1])!==1))throw new Error('Invalid formation participant route');assigned.add(m.unit);}if(q.mode==='muster'&&(!s.sites.some(site=>site.id===q.objective)||!guestSeat&&!s.facilities[q.relay]))throw new Error('Invalid rally infrastructure');if(q.mode==='muster'&&q.commission&&(!q.members.some(m=>m.unit===q.commission!.unit)||q.commission.route.length<2||q.commission.route.length>128||q.commission.route.some((p,i)=>!bounded(s,p)||i>0&&d(p,q.commission!.route[i-1])!==1)))throw new Error('Invalid written fallback');}
 for(const[id,g]of Object.entries(s.garrisonPosts))if(id!==g.unit||!s.players[g.owner]||(guestSeat&&g.owner!==guestSeat)||!s.units[g.unit]||s.units[g.unit].owner!==g.owner||(!guestSeat&&(!s.facilities[g.post]||!s.routeSurveys[g.survey])))throw new Error('Invalid physical garrison assignment');
 const counts:Record<string,number>={};for(const[id,r]of Object.entries(s.garrisonReports)){counts[r.owner]=(counts[r.owner]??0)+1;if(id!==r.id||!s.players[r.owner]||(guestSeat&&r.owner!==guestSeat)||!bounded(s,r.point)||r.turn>s.turn||r.revision>s.revision||counts[r.owner]>64)throw new Error('Invalid private patrol report');}
}
