import type {Match,Pos,Unit} from './types';
import {observation} from './visibility';
import {activeEffects} from './effects';
export interface ScoutShadow extends Pos {id:string;owner:string;createdRevision:number;until:number}
export interface WitnessedAttack extends Pos {id:string;owner:string;attacker:string;turn:number;revision:number}
export interface WitnessFlare {id:string;owner:string;point:Pos;turn:number;revision:number;until:number}
export type ScoutingState=Match&{scoutShadows:Record<string,ScoutShadow>;witnessedAttacks:Record<string,WitnessedAttack>;witnessFlares:Record<string,WitnessFlare>};
export type ScoutPower={mode:'borrowed-shadow';point:Pos}|{mode:'witness-flare';target:string};
const distance=(a:Pos,b:Pos)=>Math.hypot(a.x-b.x,a.y-b.y);
const bounded=(s:Match,p:Pos)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height;
function heroSees(s:Match,seat:string,p:Pos):boolean {const h=s.units[s.players[seat].hero.id];return observation({...s,units:{[h.id]:h},facilities:{}},seat,{x:p.x,y:p.y})==='identified';}
/** Actual combat hook only. A silhouette never establishes an attacker's identity.
 * Each faction keeps at most64 dated observations, never an enemy live snapshot. */
export function recordWitnessedAttack(s:ScoutingState,attacker:Unit):void {
 if(!attacker.alive||!attacker.active||s.units[attacker.id]!==attacker)return;
 for(const seat of Object.keys(s.players))if(observation(s,seat,attacker)==='identified'){
  const id=`witness:${s.nextId++}`;s.witnessedAttacks[id]={id,owner:seat,attacker:attacker.id,x:attacker.x,y:attacker.y,turn:s.turn,revision:s.revision};
  const owned=Object.values(s.witnessedAttacks).filter(o=>o.owner===seat);for(const old of owned.slice(0,Math.max(0,owned.length-64)))delete s.witnessedAttacks[old.id];
 }
}
export function scoutPowerReason(s:ScoutingState,seat:string,a:ScoutPower):string {
 const p=s.players[seat],h=p&&s.units[p.hero.id];
 if(!p||p.profile!==(a.mode==='borrowed-shadow'?'istari_veil':'ilmare')||p.hero.status!=='living'||!h?.alive||!h.active||activeEffects(s,h).some(e=>['stunned','incapacitated','silenced'].includes(e.kind)))return 'Living active matching hero required';
 if(p.hero.readiness<2)return 'Two readiness required';
 if(a.mode==='borrowed-shadow'){
  if(p.stock.K<5)return 'Five Lore supplies required';
  if(!bounded(s,a.point)||distance(h,a.point)>4||!heroSees(s,seat,a.point))return 'Choose an actually visible location within12 metres';
  if(['water','cliff'].includes(s.map.terrain[a.point.y*s.map.width+a.point.x])||Object.values(s.facilities).some(f=>f.hp>0&&distance(f,a.point)===0&&observation(s,seat,f)==='identified')||Object.values(s.units).some(u=>u.alive&&distance(u,a.point)===0&&observation(s,seat,u)==='identified'))return 'Choose an unoccupied ordinary scout location';
  return '';
 }
 const target=s.units[a.target];
 if(!target?.alive||!target.active||distance(h,target)>5||observation(s,seat,target)!=='identified'||!heroSees(s,seat,target))return 'One actually visible attacker within15 metres required';
 return Object.values(s.witnessedAttacks).some(o=>o.owner===seat&&o.attacker===target.id&&o.turn===s.turn)?'':'A genuine observed attack in this encounter is required';
}
/** Pays source stocks/readiness; caller spends tactical hero action. Two response
 * phases remain after the committing phase increments revision. */
export function useScoutPower(s:ScoutingState,seat:string,a:ScoutPower):string {
 const reason=scoutPowerReason(s,seat,a);if(reason)throw new Error(reason);s.players[seat].hero.readiness-=2;const id=`scout:${s.nextId++}`;
 if(a.mode==='borrowed-shadow'){s.players[seat].stock.K-=5;s.scoutShadows[id]={id,owner:seat,...a.point,createdRevision:s.revision,until:s.revision+3};}
 else {const u=s.units[a.target];s.witnessFlares[id]={id,owner:seat,point:{x:u.x,y:u.y},turn:s.turn,revision:s.revision,until:s.revision+3};}
 return id;
}
/** No illusion identity, caster or owner is exposed. These points join ordinary
 * unidentified contacts, not the Unit registry or a selectable enemy identity. */
export function shadowContacts(s:ScoutingState,seat:string):Pos[] {
 return Object.values(s.scoutShadows).filter(q=>q.until>s.revision&&observation(s,seat,{x:q.x,y:q.y})!=='hidden').map(q=>({x:q.x,y:q.y}));
}
export function examineShadowReason(s:ScoutingState,seat:string,unit:string,point:Pos):string {
 const u=s.units[unit];if(!u?.alive||!u.active||u.owner!==seat||!bounded(s,point)||Math.abs(u.x-point.x)+Math.abs(u.y-point.y)>1)return 'Reach the nearby location with an owned active examiner';
 if(activeEffects(s,u).some(e=>['stunned','incapacitated'].includes(e.kind)))return 'Examiner cannot act';
 // Presence must never be a free validation oracle; genuine and false contacts
 // cost the same physical examination, with no hidden third-party disclosure.
 return '';
}
export function examineShadow(s:ScoutingState,seat:string,unit:string,point:Pos):boolean {
 const reason=examineShadowReason(s,seat,unit,point);if(reason)throw new Error(reason);let removed=false;
 for(const[id,q]of Object.entries(s.scoutShadows))if(q.until>s.revision&&distance(q,point)===0){delete s.scoutShadows[id];removed=true;}
 return removed;
}
export function pruneScouting(s:ScoutingState):void {
 for(const records of [s.scoutShadows,s.witnessFlares])for(const[id,q]of Object.entries(records))if(q.until<=s.revision)delete records[id];
 for(const[id,o]of Object.entries(s.witnessedAttacks))if(o.turn<s.turn)delete s.witnessedAttacks[id];
}
export function validateScouting(s:ScoutingState,guestSeat?:string):void {
 for(const records of [s.scoutShadows,s.witnessFlares]){
  if(Object.keys(records).length>128)throw new Error('Scouting display budget exceeded');
  for(const[id,q]of Object.entries(records)){const point='point'in q?q.point:q;const revision='revision'in q?q.revision:q.createdRevision;if(id!==q.id||!s.players[q.owner]||s.players[q.owner].profile!==('point'in q?'ilmare':'istari_veil')||(guestSeat&&q.owner!==guestSeat)||!bounded(s,point)||revision<0||revision>s.revision||q.until!==revision+3||q.until<=s.revision)throw new Error('Invalid scouting display checkpoint');}
 }
 const counts:Record<string,number>={};
 for(const[id,o]of Object.entries(s.witnessedAttacks)){counts[o.owner]=(counts[o.owner]??0)+1;if(id!==o.id||!s.players[o.owner]||(guestSeat&&o.owner!==guestSeat)||!bounded(s,o)||o.turn<1||o.turn>s.turn||o.revision<0||o.revision>s.revision||!o.attacker||counts[o.owner]>64)throw new Error('Invalid private witnessed attack');}
}
