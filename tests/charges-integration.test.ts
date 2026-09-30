import {expect,it} from 'vitest';
import {createMatch,submit,resolveWeek} from '../src/simulation/engine';
import {parseMatch} from '../src/simulation/schema';
import {guestSnapshot} from '../src/network/protocol';
import type {Action,Match} from '../src/simulation/types';
function fixture(profile='human_rohan'){
 const s=createMatch([profile,'human_gondor'],53);s.map.terrain.fill('meadow');s.seaHazards={};s.shallowWater={};const p=s.players.p1;p.hero.status='living';p.hero.readiness=6;s.units[p.hero.id]={...structuredClone(s.units['p1:company:0']),id:p.hero.id,kind:'hero',x:8,y:9,move:4,effects:[]};
 const a=s.units['p1:company:0'],target=s.units['p2:company:0'];Object.assign(a,{x:8,y:10,move:4,attack:20});Object.assign(target,{x:11,y:10,hp:100,maxHp:100,armor:0,attack:0});
 for(const u of Object.values(s.units))if(u.owner==='p2'&&u!==target){u.x=28;u.y=28;}
 return s;
}
function command(s:Match,seat:string,action:Action){return submit(s,{id:`${seat}-${s.revision}-${s.nextSeq[seat]}`,seat,seq:s.nextSeq[seat],turn:s.turn,revision:s.revision,action});}
const charge:Action={kind:'charge-power',mode:'relief-charge',target:'p2:company:0',members:[{unit:'p1:company:0',route:[{x:8,y:10},{x:9,y:10},{x:10,y:10}]}]};
it('charge reserves normal operation plus hero commitment/readiness, opens a counterphase and saves privately',()=>{
 let s=fixture();const accepted=command(s,'p1',charge);expect(accepted.ok).toBe(true);const extra=command(accepted.state,'p1',{kind:'attack',unit:'p1:company:0',target:'p2:company:0'});expect(extra.reason).toMatch(/charge/);s=resolveWeek(accepted.state);expect(s.turn).toBe(1);expect(s.players.p1.operations).toBe(2);expect(s.players.p1.commitment).toBe(0);expect(s.players.p1.hero.readiness).toBe(4);expect(s.units['p1:company:0'].x).toBe(8);expect(parseMatch(s).charges).toEqual(s.charges);
 const guest=guestSnapshot(s,'p2');expect(Object.keys(guest.charges)).toHaveLength(0);expect(guest.chargeWarnings).toHaveLength(1);expect(guest.chargeWarnings?.[0]).not.toHaveProperty('members');expect(()=>parseMatch(guest,'p2')).not.toThrow();expect(()=>parseMatch({...s,chargeWarnings:guest.chargeWarnings})).toThrow();
 s=resolveWeek(s);expect(s.units['p1:company:0'].x).toBe(10);expect(s.units['p2:company:0'].hp).toBeLessThan(100);expect(s.units['p2:company:0'].effects.some(e=>e.kind==='pursuit-suppressed')).toBe(true);expect(s.players.p1.operations).toBe(2);expect(Object.values(s.movementTraces).some(t=>t.owner==='p1'&&t.route.at(-1)?.x===10)).toBe(true);
});
it('moving the declared target cancels the fixed charge without tracking or a refund',()=>{
 let s=resolveWeek(command(fixture(),'p1',charge).state);const move=command(s,'p2',{kind:'move',unit:'p2:company:0',x:12,y:10});expect(move.ok).toBe(true);s=resolveWeek(move.state);expect(s.units['p1:company:0'].x).toBe(8);expect(s.units['p2:company:0'].hp).toBe(100);expect(s.players.p1.operations).toBe(2);expect(Object.keys(s.charges)).toHaveLength(0);
});
it('an intercepted charge hit causes casualties on the interceptor without falsely suppressing intended infantry',()=>{
 let s=fixture();const guard=s.units['p2:company:1'];Object.assign(guard,{x:11,y:11,hp:100,maxHp:100,armor:0,effects:[{kind:'sentinel',value:1,until:1000000,source:'test'}]});s=resolveWeek(resolveWeek(command(s,'p1',charge).state));expect(s.units['p2:company:0'].hp).toBe(100);expect(s.units[guard.id].hp).toBeLessThan(100);expect(s.units['p2:company:0'].effects.some(e=>e.kind==='pursuit-suppressed')).toBe(false);
});
it('actual counterattack damage cancels pending charge preparation before it moves',()=>{
 let s=resolveWeek(command(fixture(),'p1',charge).state);const enemy=s.units['p2:company:1'];Object.assign(enemy,{x:8,y:11,attack:12});const attack=command(s,'p2',{kind:'attack',unit:enemy.id,target:'p1:company:0'});expect(attack.ok).toBe(true);s=resolveWeek(attack.state);expect(Object.keys(s.charges)).toHaveLength(0);expect(s.units['p1:company:0'].x).toBe(8);
});
it('guest identified preparers contain no future targets/routes and cannot become authoritative save data',()=>{
 let s=fixture('orome');const declared=command(s,'p2',{kind:'declare-tactical',order:{kind:'pursuit',unit:'p2:company:0',target:'p1:company:0'}});expect(declared.ok).toBe(false);Object.assign(s.units['p2:company:0'],{x:10,y:10,attack:15});const valid=command(s,'p2',{kind:'declare-tactical',order:{kind:'pursuit',unit:'p2:company:0',target:'p1:company:0'}});expect(valid.ok).toBe(true);s=resolveWeek(valid.state);const guest=guestSnapshot(s,'p1');expect(guest.observedAttackers).toEqual(['p2:company:0']);expect(Object.keys(guest.tacticalOrders)).toHaveLength(0);const intercept=command(guest,'p1',{kind:'charge-power',mode:'hunter-interception',target:'p2:company:0',members:[{unit:guest.players.p1.hero.id,route:[{x:8,y:9},{x:9,y:9},{x:10,y:9}]}]});expect(intercept.ok).toBe(true);expect(()=>parseMatch({...s,observedAttackers:guest.observedAttackers})).toThrow();
});
