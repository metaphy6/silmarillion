import {expect,it} from 'vitest';
import {createMatch,submit,resolveWeek} from '../src/simulation/engine';
import {parseMatch,parseOrder} from '../src/simulation/schema';
import {guestSnapshot} from '../src/network/protocol';
import type {Match,Action} from '../src/simulation/types';
function fixture(profile='istari_star'){
 const s=createMatch([profile,'human_rohan'],74);s.map.terrain.fill('meadow');s.seaHazards={};s.shallowWater={};s.infrastructureSites={};const p=s.players.p1;p.hero.status='living';p.hero.readiness=6;
 const u=s.units['p1:company:0'];Object.assign(u,{x:10,y:10,move:4,hp:100,maxHp:100,armor:0,attack:0});s.units[p.hero.id]={...structuredClone(u),id:p.hero.id,kind:'hero',x:9,y:9};
 Object.assign(s.units['p2:company:0'],{x:9,y:10,attack:20,armor:0});return s;
}
function order(s:Match,seat:string,action:Action){const result=submit(s,{id:`${seat}-${s.turn}-${s.revision}-${s.nextSeq[seat]}`,seat,seq:s.nextSeq[seat],turn:s.turn,revision:s.revision,action});expect(result.reason).toBe('Order reserved; resolves with the week');expect(result.ok).toBe(true);return result.state;}
const fallback:Action={kind:'declare-tactical',order:{kind:'fallback',unit:'p1:company:0',route:[{x:10,y:10},{x:11,y:10},{x:12,y:10}]}};
const pursuit:Action={kind:'declare-tactical',order:{kind:'pursuit',unit:'p2:company:0',target:'p1:company:0'}};
it('fallback consumes one ordinary operation and opens a real response phase without automatic hero commitment',()=>{
 let s=order(fixture(),'p1',fallback);s=resolveWeek(s);expect(s.turn).toBe(1);expect(s.combatPhase).toBe(1);expect(s.units['p1:company:0'].x).toBe(10);expect(s.players.p1.operations).toBe(2);expect(s.players.p1.commitment).toBe(1);
 expect(parseMatch(s).tacticalOrders).toEqual(s.tacticalOrders);expect(Object.keys(guestSnapshot(s,'p2').tacticalOrders)).toHaveLength(0);
 s=resolveWeek(s);expect(s.units['p1:company:0'].x).toBe(12);expect(s.players.p1.operations).toBe(2);
});
it('Signal Flash spends its tactical hero action to revise the declared route during the response phase',()=>{
 let s=resolveWeek(order(fixture(),'p1',fallback));s=order(s,'p1',{kind:'tactical-power',mode:'signal-flash',unit:'p1:company:0',route:[{x:10,y:10},{x:10,y:11}]});s=resolveWeek(s);expect(s.units['p1:company:0'].y).toBe(11);expect(s.players.p1.commitment).toBe(0);expect(s.players.p1.hero.readiness).toBe(4);expect(s.players.p1.operations).toBe(2);
});
it('pursuit resolution is independent of accepted cross-seat command arrival ordering',()=>{
 let a=fixture(),b=fixture();a=order(order(a,'p1',fallback),'p2',pursuit);b=order(order(b,'p2',pursuit),'p1',fallback);a=resolveWeek(resolveWeek(a));b=resolveWeek(resolveWeek(b));expect(a.units).toEqual(b.units);expect(a.rng).toBe(b.rng);expect(a.units['p1:company:0'].hp).toBeLessThan(100);expect(a.players.p2.operations).toBe(2);
});
it('Fingolfin shield reduces actual post-defense pursuit damage for a tired trailing company',()=>{
 function run(shield:boolean){let s=fixture('elf_fingolfin');s.units['p2:company:0'].effects.push({kind:'fatigue',source:'ordinary-travel',value:1,until:1000000});s=order(order(s,'p1',fallback),'p2',pursuit);if(shield)s=order(s,'p1',{kind:'tactical-power',mode:'shielded-withdrawal',unit:'p1:company:0'});return resolveWeek(resolveWeek(s));}
 const normal=run(false),protectedState=run(true);expect(protectedState.units['p1:company:0'].hp).toBeGreaterThan(normal.units['p1:company:0'].hp);expect(protectedState.units['p1:company:0'].x).toBe(12);
});
it('malformed Signal Flash without a route is rejected at command schema rather than throwing during validation',()=>{
 const s=resolveWeek(order(fixture(),'p1',fallback));const raw={id:'malformed-signal',seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action:{kind:'tactical-power',mode:'signal-flash',unit:'p1:company:0'}};expect(()=>parseOrder(raw)).toThrow();
});
it('a pursuit declared in the advertised response phase can react to the pending fallback',()=>{
 let s=resolveWeek(order(fixture(),'p1',fallback));s=order(s,'p2',pursuit);s=resolveWeek(s);expect(s.units['p1:company:0'].hp).toBeLessThan(100);
});
