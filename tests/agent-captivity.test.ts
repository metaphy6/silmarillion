import {expect,it} from 'vitest';
import type {Match} from '../src/simulation/types';
import {createMatch} from '../src/simulation/engine';
import {recordObservedAttack,startIntelligence,progressIntelligence} from '../src/simulation/intelligence';
import {agentAssignment,captureAgentReason,captureAgent,freeAgentReason,freeAgent,settleAgentCaptivities,type AgentCaptivityState} from '../src/simulation/agent-captivity';
function fixture(){
 const s=Object.assign(createMatch(['istari_veil','human_gondor'],93),{agentCaptivities:{},agentDisclosures:{}}) as AgentCaptivityState;
 s.map.terrain.fill('meadow');s.waterChannels={};s.seaHazards={};s.shallowWater={};s.infrastructureSites={};s.intelligenceReports={};s.intelligenceTasks={};
 const p=s.players.p1;p.hero.status='living';p.hero.readiness=6;p.stock.K=50;p.stock.M=50;
 s.units[p.hero.id]={...structuredClone(s.units['p1:company:0']),id:p.hero.id,kind:'hero',x:9,y:10,effects:[]};
 const courier=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;Object.assign(courier,{x:10,y:10,move:5});
 for(let i=0;i<3;i++)s.facilities[`station${i}`]={...structuredClone(s.facilities['p1:core']),id:`station${i}`,kind:'safehouse',x:10+i*2,y:10,workers:1};
 const guard=s.units['p2:company:0'];Object.assign(guard,{x:11,y:10});
 const path=(_s:Match,a:{x:number;y:number},b:{x:number;y:number})=>{const route=[{x:a.x,y:a.y}];let{x,y}=a;while(x!==b.x){x+=Math.sign(b.x-x);route.push({x,y});}while(y!==b.y){y+=Math.sign(b.y-y);route.push({x,y});}return route;};
 recordObservedAttack(s,guard);const report=Object.values(s.intelligenceReports).find(r=>r.owner==='p1')!;
 startIntelligence(s,'p1',{mode:'quiet-exchange',stations:['station0','station1'],carrier:courier.id,report:report.id},path);
 courier.hp=Math.max(1,Math.floor(courier.maxHp/3));return {s,courier,guard,path};
}
it('captures a paid real courier assignment, discloses only current Veil contacts and preserves already learned reports',()=>{
 const {s,courier,guard,path}=fixture();expect(agentAssignment(s,courier.id)?.kind).toBe('quiet-exchange');
 const reports=structuredClone(s.intelligenceReports),stock={...s.players.p1.stock};
 expect(captureAgentReason(s,'p2',guard.id,courier.id)).toBe('');const c=captureAgent(s,'p2',guard.id,courier.id)!;
 expect(courier).toMatchObject({active:false,owner:'p1',x:guard.x,y:guard.y});
 expect(s.agentDisclosures[c.id]).toMatchObject({owner:'p2',scope:'compartmented',contacts:['station0','station1']});
 expect(s.agentDisclosures[c.id].contacts).not.toContain('station2');expect(s.intelligenceReports).toEqual(reports);
 progressIntelligence(s,path);expect(s.players.p1.stock).toEqual(stock);expect(Object.values(s.intelligenceReports).some(r=>r.kind==='cross-check')).toBe(false);
});
it('does not manufacture agents from ordinary troops, healthy enemies, hidden units or distant targets',()=>{
 const {s,courier,guard}=fixture();courier.hp=courier.maxHp;expect(captureAgentReason(s,'p2',guard.id,courier.id)).toMatch(/weakened/);
 courier.hp=1;courier.effects.push({kind:'concealed',value:1,until:s.revision+3,source:'test'});expect(captureAgentReason(s,'p2',guard.id,courier.id)).toMatch(/Identify/);
 courier.effects=[];guard.x+=5;expect(captureAgentReason(s,'p2',guard.id,courier.id)).toMatch(/approach/);guard.x-=5;
 s.intelligenceTasks={};expect(captureAgentReason(s,'p2',guard.id,courier.id)).toMatch(/actual current/);
 expect(captureAgent(s,'p2',guard.id,courier.id)).toBeUndefined();expect(courier.active).toBe(true);
});
it('guard loss leaves prisoner in place until an adjacent owner rescue and retains historical disclosure',()=>{
 const {s,courier,guard}=fixture();const c=captureAgent(s,'p2',guard.id,courier.id)!;const rescuer=s.units['p1:company:0'];Object.assign(rescuer,{x:c.x,y:c.y+1});
 expect(freeAgentReason(s,'p1',rescuer.id,c.id)).toMatch(/guard/);guard.alive=false;settleAgentCaptivities(s);
 expect(courier.active).toBe(false);expect(courier.x).toBe(c.x);expect(freeAgent(s,'p1',rescuer.id,c.id)).toBe(true);expect(courier.active).toBe(true);expect(s.agentDisclosures[c.id]).toBeDefined();
});
it('captor may release; prisoner death removes only live captivity and retains dated knowledge',()=>{
 const {s,courier,guard}=fixture();const c=captureAgent(s,'p2',guard.id,courier.id)!;
 expect(freeAgent(s,'p2',guard.id,c.id)).toBe(true);expect(courier.owner).toBe('p1');
 s.agentCaptivities[c.id]=c;courier.active=false;courier.alive=false;settleAgentCaptivities(s);expect(s.agentCaptivities[c.id]).toBeUndefined();expect(s.agentDisclosures[c.id]).toBeDefined();
});
import {startRelayMessage,progressRelayMessages} from '../src/simulation/relay-messages';
import {validateAgentCaptivities} from '../src/simulation/agent-captivity';
it('a real ordinary relay capture stops cargo, reveals only carried contacts and leaves other reports private',()=>{
 const {s,courier,guard,path}=fixture();s.intelligenceTasks={};s.players.p1.profile='human_gondor';
 const report=Object.values(s.intelligenceReports).find(r=>r.owner==='p1'&&r.observations.some(o=>o.source==='station0'))!;
 const id=startRelayMessage(s,'p1',{report:report.id,courier:courier.id,origin:'station0',primary:'station1',destination:'station2',route:path(s,courier,s.facilities.station2)},()=>true);
 const before=structuredClone(s.intelligenceReports),c=captureAgent(s,'p2',guard.id,courier.id)!;
 expect(s.agentDisclosures[c.id]).toMatchObject({scope:'known-contacts',contacts:['station0','station1','station2']});expect(s.relayMessages[id].phase).toBe('lost');
 progressRelayMessages(s,()=>true,(_s,_u,r)=>r.length-1);expect(s.relayDeliveries).toEqual({});expect(s.intelligenceReports).toEqual(before);expect(courier.active).toBe(false);
 expect(()=>validateAgentCaptivities(s)).not.toThrow();expect(()=>validateAgentCaptivities(s,'p1')).toThrow(/private/);
 const guest=structuredClone(s);guest.agentDisclosures={};expect(()=>validateAgentCaptivities(guest,'p1')).not.toThrow();
});
