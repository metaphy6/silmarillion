import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {intelligenceReason,startIntelligence,recordObservedAttack,progressIntelligence,isIntelligenceCourier} from '../src/simulation/intelligence';
import type {Unit} from '../src/simulation/types';
function fixture(profile='istari_veil'){
 const s=createMatch([profile,'human_gondor'],93);s.intelligenceReports={};s.intelligenceTasks={};s.map.terrain.fill('meadow');s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
 const p=s.players.p1;p.hero.status='living';p.hero.readiness=6;p.stock.K=50;p.stock.M=50;
 const h:Unit={...structuredClone(s.units['p1:company:0']),id:p.hero.id,kind:'hero',x:9,y:10,effects:[]};s.units[h.id]=h;
 const courier=s.units['p1:worker:0']??Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;Object.assign(courier,{x:10,y:10,move:5});
 const base=s.facilities['p1:core'];for(let i=0;i<3;i++)s.facilities[`station${i}`]={...structuredClone(base),id:`station${i}`,kind:profile==='istari_star'?'beacon':'safehouse',x:10+i*2,y:10,workers:1};
 const attacker=s.units['p2:company:0'];Object.assign(attacker,{x:11,y:11});
 const path=(_s:typeof s,a:{x:number;y:number},b:{x:number;y:number})=>{const route=[{...a}];let{x,y}=a;while(x!==b.x){x+=Math.sign(b.x-x);route.push({x,y});}while(y!==b.y){y+=Math.sign(b.y-y);route.push({x,y});}return route;};
 return {s,p,courier,attacker,path};
}
it('actual observation creates only finite dated coordinate reports without hidden identity or inventory',()=>{
 const {s,attacker}=fixture();recordObservedAttack(s,attacker);
 const reports=Object.values(s.intelligenceReports);expect(reports.length).toBeGreaterThan(0);
 expect(JSON.stringify(reports)).not.toContain(attacker.id);expect(JSON.stringify(reports)).not.toContain(attacker.name);
 expect(reports[0].observations[0]).toMatchObject({x:11,y:11,turn:s.turn,revision:s.revision,kind:'attack'});
 for(let i=0;i<70;i++)recordObservedAttack(s,attacker);
 expect(Object.values(s.intelligenceReports).filter(r=>r.owner==='p1').length).toBeLessThanOrEqual(64);
});
it('Quiet Exchange requires existing dated evidence and two real staffed safehouses, then delivers paid cross-check via courier',()=>{
 const {s,p,courier,attacker,path}=fixture();const a={mode:'quiet-exchange' as const,stations:['station0','station1'],carrier:courier.id,report:'missing'};
 expect(intelligenceReason(s,'p1',a,path)).toMatch(/report/i);recordObservedAttack(s,attacker);a.report=Object.keys(s.intelligenceReports)[0];
 const before=p.stock.K;startIntelligence(s,'p1',a,path);expect(p.stock.K).toBe(before-10);expect(p.hero.readiness).toBe(3);expect(isIntelligenceCourier(s,courier.id)).toBe(true);
 progressIntelligence(s,path);expect(courier.x).toBe(12);
 const report=Object.values(s.intelligenceReports).find(r=>r.kind==='cross-check')!;expect(report.status).toBe('corroborated');expect(isIntelligenceCourier(s,courier.id)).toBe(false);
});
it('loss of staff or courier stops delivery without inventing evidence or refunds',()=>{
 const {s,p,courier,attacker,path}=fixture();recordObservedAttack(s,attacker);
 startIntelligence(s,'p1',{mode:'quiet-exchange',stations:['station0','station1'],carrier:courier.id,report:Object.keys(s.intelligenceReports)[0]},path);
 s.facilities.station1.workers=0;const stock=p.stock.K;progressIntelligence(s,path);
 expect(Object.values(s.intelligenceReports).some(r=>r.kind==='cross-check')).toBe(false);expect(p.stock.K).toBe(stock);
});
it('Beacon Concord records only attacks actually observed by its prepared staffed chain, then delivers next planning report',()=>{
 const {s,p,attacker,path}=fixture('istari_star');const m=p.stock.M,k=p.stock.K;
 startIntelligence(s,'p1',{mode:'beacon-concord',stations:['station0','station1','station2']},path);
 expect(p.stock.M).toBe(m-10);expect(p.stock.K).toBe(k-5);expect(Object.values(s.intelligenceReports)).toHaveLength(0);
 recordObservedAttack(s,attacker);attacker.x=29;attacker.y=29;recordObservedAttack(s,attacker);
 progressIntelligence(s,path);const report=Object.values(s.intelligenceReports)[0];expect(report.kind).toBe('relay');expect(report.observations).toHaveLength(1);expect(report.observations[0].x).toBe(11);
});

it('obscured station sightlines produce no report despite unrelated friendly scouts nearby',()=>{
 const {s,attacker}=fixture();const scout=s.units['p1:company:0'];Object.assign(scout,{x:attacker.x,y:attacker.y});
 s.zones.smoke={id:'smoke',owner:'p2',kind:'smoke',x:attacker.x,y:attacker.y,dx:0,dy:0,radius:1,until:s.revision+3,triggered:false};
 recordObservedAttack(s,attacker);expect(Object.values(s.intelligenceReports)).toHaveLength(0);
});
it('contradictory prior evidence is flagged without deciding truth or inventing another event',()=>{
 const {s,courier,attacker,path}=fixture();recordObservedAttack(s,attacker);const reports=Object.values(s.intelligenceReports);reports[1].observations[0].x++;
 startIntelligence(s,'p1',{mode:'quiet-exchange',stations:['station0','station1'],carrier:courier.id,report:reports[0].id},path);progressIntelligence(s,path);
 const report=Object.values(s.intelligenceReports).find(r=>r.kind==='cross-check')!;expect(report.status).toBe('contradictory');expect(report.uncertainty.join(' ')).toContain('does not establish truth');expect(new Set(report.observations.map(o=>o.eventKey)).size).toBe(1);
});
it('checkpoint validation keeps finite owner-private facts and requires paid task commitment',async()=>{
 const {validateIntelligenceState}=await import('../src/simulation/intelligence');const {s,p,courier,attacker,path}=fixture();recordObservedAttack(s,attacker);
 startIntelligence(s,'p1',{mode:'quiet-exchange',stations:['station0','station1'],carrier:courier.id,report:Object.keys(s.intelligenceReports)[0]},path);
 expect(()=>validateIntelligenceState(s)).toThrow();p.commitment=0;expect(()=>validateIntelligenceState(s)).not.toThrow();
 Object.values(s.intelligenceReports)[0].observations[0].x=-1;expect(()=>validateIntelligenceState(s)).toThrow();
});
it('rooted couriers cannot begin or complete a physical report delivery',()=>{
 const {s,courier,attacker,path}=fixture();recordObservedAttack(s,attacker);
 const a={mode:'quiet-exchange' as const,stations:['station0','station1'],carrier:courier.id,report:Object.keys(s.intelligenceReports)[0]};
 courier.effects.push({kind:'root',value:1,until:s.revision+4,source:'test'});
 expect(intelligenceReason(s,'p1',a,path)).toMatch(/route|movement/i);
 courier.effects=[];startIntelligence(s,'p1',a,path);
 courier.effects.push({kind:'root',value:1,until:s.revision+4,source:'test'});progressIntelligence(s,path);
 expect(courier.x).toBe(10);expect(Object.values(s.intelligenceReports).some(r=>r.kind==='cross-check')).toBe(false);
});

import {submit,resolveWeek} from '../src/simulation/engine';
import {parseMatch} from '../src/simulation/schema';
import {guestSnapshot} from '../src/network/protocol';
it('real command validation reserves hero commitment, rejects a courier second action and delivers weekly',()=>{
 const {s,courier,attacker}=fixture();recordObservedAttack(s,attacker);
 const action={kind:'intelligence-power' as const,mode:'quiet-exchange' as const,stations:['station0','station1'],carrier:courier.id,report:Object.keys(s.intelligenceReports)[0]};
 const first=submit(s,{id:'intel-1',seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action});expect(first.reason).toBe('Order reserved; resolves with the week');expect(first.ok).toBe(true);
 const duplicate=submit(first.state,{id:'intel-2',seat:'p1',seq:first.state.nextSeq.p1,turn:s.turn,revision:s.revision,action:{kind:'move',unit:courier.id,x:11,y:10}});expect(duplicate.ok).toBe(false);expect(duplicate.reason).toMatch(/courier/i);
 const resolved=resolveWeek(first.state);expect(Object.values(resolved.intelligenceReports).some(r=>r.kind==='cross-check')).toBe(true);expect(resolved.units[courier.id].x).toBe(12);
});
it('actual resolved attack records intelligence while command previews do not',()=>{
 const {s,attacker}=fixture();const target=s.units['p1:company:0'];Object.assign(target,{x:11,y:10});
 const result=submit(s,{id:'attack-report',seat:'p2',seq:s.nextSeq.p2,turn:s.turn,revision:s.revision,action:{kind:'attack',unit:attacker.id,target:target.id}});expect(result.ok).toBe(true);expect(Object.keys(result.state.intelligenceReports)).toHaveLength(0);
 const resolved=resolveWeek(result.state);expect(Object.keys(resolved.intelligenceReports).length).toBeGreaterThan(0);
});
it('checkpoints round trip reports while enemy guest snapshots remove every private report and task',()=>{
 const {s,attacker}=fixture();recordObservedAttack(s,attacker);
 expect(parseMatch(s).intelligenceReports).toEqual(s.intelligenceReports);
 const guest=guestSnapshot(s,'p2');expect(Object.keys(guest.intelligenceReports)).toHaveLength(0);expect(Object.keys(guest.intelligenceTasks)).toHaveLength(0);expect(()=>parseMatch(guest,'p2')).not.toThrow();
 const malformed=structuredClone(s);Object.values(malformed.intelligenceReports)[0].observations[0].certainty='secret' as never;expect(()=>parseMatch(malformed)).toThrow();
});
import {spawnVessel} from '../src/simulation/naval';
it('guest naval projection exposes targetable observed hulls without enemy cargo, route or crew',()=>{
 const {s}=fixture();const crew=Object.values(s.units).find(u=>u.owner==='p2'&&u.kind==='worker')!;
 Object.assign(s.facilities['p2:core'],{kind:'harbor',x:11,y:11,workers:1});Object.assign(crew,{x:11,y:11});s.map.terrain[10*s.map.width+11]='water';const vessel=spawnVessel(s,'p2','p2:core',crew.id,{x:11,y:10});vessel.cargo.K=7;
 const guest=guestSnapshot(s,'p1');expect(guest.vessels[vessel.id]).toBeUndefined();expect(guest.vesselContacts).toContainEqual({id:vessel.id,name:vessel.name,owner:vessel.owner,x:11,y:10,hp:80,maxHp:80,phase:"idle"});expect(()=>parseMatch(guest,'p1')).not.toThrow();expect(()=>parseMatch({...s,vesselContacts:[{x:11,y:10}]})).toThrow();
});
it('movement powers cannot move an embarked formation outside fleet handling',()=>{
 const {s}=fixture('nessa');const crew=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;Object.assign(s.facilities['p1:core'],{kind:'harbor',x:10,y:10,workers:1});Object.assign(crew,{x:10,y:10});s.map.terrain[10*s.map.width+11]='water';const vessel=spawnVessel(s,'p1','p1:core',crew.id,{x:11,y:10});const member=s.units['p1:company:0'];Object.assign(member,{x:11,y:10});vessel.passenger=member.id;
 const result=submit(s,{id:'aboard-plan',seat:'p1',seq:1,turn:s.turn,revision:s.revision,action:{kind:'movement-power',members:[{unit:member.id,to:{x:12,y:10}}]}});expect(result.ok).toBe(false);expect(result.reason).toMatch(/committed.*work/i);
});
