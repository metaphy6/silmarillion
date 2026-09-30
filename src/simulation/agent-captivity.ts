import type {Match,Pos} from './types';
import {effectiveRelation} from './diplomacy';
import {observation} from './visibility';

export interface AgentAssignment {id:string;kind:'quiet-exchange'|'beacon-concord'|'relay';contacts:string[];reportIds:string[]}
export interface AgentCaptivity extends Pos {id:string;unit:string;owner:string;captor:string;guard:string;turn:number;revision:number}
export interface AgentDisclosure {id:string;owner:string;victim:string;unit:string;turn:number;revision:number;scope:'compartmented'|'known-contacts';assignment:AgentAssignment;contacts:string[]}
export type AgentCaptivityState=Match&{agentCaptivities:Record<string,AgentCaptivity>;agentDisclosures:Record<string,AgentDisclosure>};
const near=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<=1;
const finiteIds=(ids:string[])=>[...new Set(ids)].sort().slice(0,16);
/** An ordinary body is an agent only while assigned a real, paid physical intelligence route. */
export function agentAssignment(s:Match,unit:string):AgentAssignment|undefined {
 const u=s.units[unit];if(!u||!['worker','company'].includes(u.kind))return;
 const task=Object.values(s.intelligenceTasks).find(t=>t.carrier===unit&&t.owner===u.owner);
 if(task)return {id:task.id,kind:task.kind,contacts:finiteIds(task.stationIds),reportIds:finiteIds(task.reportIds)};
 const relay=Object.values(s.relayMessages).find(m=>m.courier===unit&&m.owner===u.owner&&m.phase==='travel');
 if(relay)return {id:relay.id,kind:'relay',contacts:finiteIds([relay.origin,relay.primary,relay.destination]),reportIds:[relay.report]};
}
export function captureAgentReason(s:AgentCaptivityState,seat:string,guardId:string,targetId:string):string {
 const guard=s.units[guardId],target=s.units[targetId];
 if(!guard?.alive||!guard.active||!guard.supplied||guard.owner!==seat)return 'An active supplied owned captor is required';
 if(!target?.alive||!target.active||target.hp<=0||target.hp*3>target.maxHp||effectiveRelation(s,seat,target.owner)!=='war')return 'A weakened active enemy agent at one third health or less is required';
 if(!near(guard,target)||observation(s,seat,target)!=='identified')return 'Identify and approach the agent';
 if(Object.values(s.agentCaptivities).some(c=>c.unit===targetId)||!agentAssignment(s,targetId))return 'Target must carry an actual current ordinary intelligence assignment';
 return '';
}
/** Veil source: current assignment/contacts only; baseline includes only sources carried by this agent, never an owner-wide network. */
export function captureAgent(s:AgentCaptivityState,seat:string,guardId:string,targetId:string):AgentCaptivity|undefined {
 if(captureAgentReason(s,seat,guardId,targetId))return;
 const u=s.units[targetId],guard=s.units[guardId],assignment=agentAssignment(s,targetId)!;
 const compartmented=s.players[u.owner].profile==='istari_veil';
 const known=compartmented?[]:assignment.reportIds.flatMap(id=>{const report=s.intelligenceReports[id];return report?.owner===u.owner?report.observations.map(o=>o.source):[];});
 const relay=s.relayMessages[assignment.id];
 if(!compartmented&&relay?.courier===u.id)known.push(...relay.provenance.map(v=>v.station));
 const id=`agent-capture:${s.nextId++}`;
 const record:AgentCaptivity={id,unit:u.id,owner:u.owner,captor:seat,guard:guardId,turn:s.turn,revision:s.revision,x:guard.x,y:guard.y};
 s.agentCaptivities[id]=record;
 s.agentDisclosures[id]={id,owner:seat,victim:u.owner,unit:u.id,turn:s.turn,revision:s.revision,scope:compartmented?'compartmented':'known-contacts',assignment:structuredClone(assignment),contacts:finiteIds([...assignment.contacts,...known])};
 const owned=Object.values(s.agentDisclosures).filter(d=>d.owner===seat).sort((a,b)=>a.revision-b.revision||a.turn-b.turn||a.id.localeCompare(b.id));
 while(owned.length>32)delete s.agentDisclosures[owned.shift()!.id];
 u.active=false;u.x=guard.x;u.y=guard.y;
 for(const task of Object.values(s.intelligenceTasks))if(task.carrier===u.id)delete s.intelligenceTasks[task.id];
 for(const message of Object.values(s.relayMessages))if(message.courier===u.id&&message.phase==='travel')message.phase='lost';
 return record;
}
export function freeAgentReason(s:AgentCaptivityState,seat:string,actorId:string,captureId:string):string {
 const c=s.agentCaptivities[captureId],actor=s.units[actorId];
 if(!c||!s.units[c.unit]?.alive)return 'Living captive required';
 if(!actor?.alive||!actor.active||!actor.supplied||actor.owner!==seat||!near(actor,c))return 'An active supplied owned actor must reach the captive';
 if(seat===c.captor)return '';
 if(seat!==c.owner)return 'Only the captor may release or the owner may rescue';
 const guard=s.units[c.guard];
 if(guard?.alive&&guard.active&&guard.owner===c.captor&&near(guard,c))return 'Defeat or displace the guard before rescue';
 return '';
}
export function freeAgent(s:AgentCaptivityState,seat:string,actorId:string,captureId:string):boolean {
 if(freeAgentReason(s,seat,actorId,captureId))return false;
 const c=s.agentCaptivities[captureId],u=s.units[c.unit];u.active=true;u.x=c.x;u.y=c.y;delete s.agentCaptivities[captureId];return true;
}
/** Captor loss never teleports or automatically rescues a captive; dated learned disclosures survive. */
export function settleAgentCaptivities(s:AgentCaptivityState):void {
 for(const c of Object.values(s.agentCaptivities)){const u=s.units[c.unit];if(!u?.alive){delete s.agentCaptivities[c.id];continue;}u.active=false;u.x=c.x;u.y=c.y;}
}

export function validateAgentCaptivities(s:AgentCaptivityState,guestSeat?:string):void {
 const dated=(q:{turn:number;revision:number})=>Number.isSafeInteger(q.turn)&&q.turn>=1&&q.turn<=s.turn&&Number.isSafeInteger(q.revision)&&q.revision>=0&&q.revision<=s.revision;
 const seen=new Set<string>();
 for(const [id,c] of Object.entries(s.agentCaptivities)){
  const u=s.units[c.unit];
  if(!dated(c)||(!guestSeat&&!s.units[c.guard])||id!==c.id||seen.has(c.unit)||!s.players[c.owner]||!s.players[c.captor]||c.owner===c.captor||!Number.isInteger(c.x)||!Number.isInteger(c.y)||c.x<0||c.y<0||c.x>=s.map.width||c.y>=s.map.height||!u?.alive||u.active||u.owner!==c.owner||u.x!==c.x||u.y!==c.y||!['worker','company'].includes(u.kind)||guestSeat&&![c.owner,c.captor].includes(guestSeat))throw new Error('Invalid ordinary agent captivity');
  seen.add(c.unit);
 }
 const counts:Record<string,number>={};
 for(const [id,d] of Object.entries(s.agentDisclosures)){
  counts[d.owner]=(counts[d.owner]??0)+1;
  if(!dated(d)||(d.scope==='compartmented')!==(s.players[d.victim]?.profile==='istari_veil')||id!==d.id||!s.players[d.owner]||!s.players[d.victim]||d.owner===d.victim||counts[d.owner]>32||guestSeat&&d.owner!==guestSeat||!['compartmented','known-contacts'].includes(d.scope)||!['quiet-exchange','beacon-concord','relay'].includes(d.assignment.kind)||d.contacts.length>16||d.assignment.contacts.length>16||d.assignment.reportIds.length>16||new Set(d.contacts).size!==d.contacts.length||d.assignment.contacts.some(contact=>!d.contacts.includes(contact))||d.scope==='compartmented'&&d.contacts.some(contact=>!d.assignment.contacts.includes(contact)))throw new Error('Invalid private agent disclosure');
 }
}
