import {expect,it} from 'vitest';
import {createMatch,submit,resolveWeek,preview} from '../src/simulation/engine';
import {parseMatch} from '../src/simulation/schema';
import {guestSnapshot} from '../src/network/protocol';
import {recipe} from '../src/content/catalog';
import {recordObservedAttack} from '../src/simulation/intelligence';
import {startLogging} from '../src/simulation/ordinary-environment';
import type {Action,Match} from '../src/simulation/types';
function order(s:Match,action:Action,seat='p1'){const r=submit(s,{id:`${seat}-${s.nextSeq[seat]}`,seat,seq:s.nextSeq[seat],turn:s.turn,revision:s.revision,action});expect(r.ok,r.reason).toBe(true);return r.state;}
function week(s:Match,a:Action,seat='p1'){return resolveWeek(order(s,a,seat));}
function fresh(profile:string){const s=createMatch([profile,'human_rohan'],93);s.players.p2.ai=false;return s;}
function hero(s:Match){s=week(s,{kind:'produce',facility:'p1:core',recipe:'component'});s=week(s,{kind:'produce',facility:'p1:core',recipe:'hero'});for(let i=1;i<recipe(s.players.p1.profile,'hero')!.turns;i++)s=resolveWeek(s);return s;}
it('ordinary logging uses an authored tree and paid built depot once, with actual worker travel and checkpoint',()=>{
 let s=fresh('human_gondor');const worker=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!.id;
 s=week(s,{kind:'build',building:'depot',x:5,y:8});s=week(s,{kind:'move',unit:worker,x:5,y:8});const f=Object.values(s.facilities).find(f=>f.owner==='p1'&&f.kind==='depot')!;
 const before={...s.players.p1.stock};s=order(s,{kind:'logging',worker,vegetation:'vegetation:5:9',facility:f.id});const projected=preview(s,'p1');expect(projected.players.p1.stock.P).toBe(before.P-5);expect(projected.players.p1.stock.M).toBe(before.M-2);expect(projected.players.p1.operations).toBe(2);
 s=resolveWeek(s);expect(s.loggedVegetation['vegetation:5:9']).toBe(true);expect(s.vegetation['vegetation:5:9'].mature).toBe(false);expect(parseMatch(s)).toEqual(s);
 const again=submit(s,{id:'again',seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action:{kind:'logging',worker,vegetation:'vegetation:5:9',facility:f.id}});expect(again.ok).toBe(false);
});
it('personally produced Star walks between paid beacons and retains the owner survey candidate through guest projection',()=>{
 let s=hero(fresh('istari_star'));const worker=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!.id;s=week(s,{kind:'move',unit:worker,x:5,y:6});s=week(s,{kind:'build',building:'beacon',x:4,y:5});s=week(s,{kind:'build',building:'beacon',x:6,y:5});const origin=Object.values(s.facilities).find(f=>f.kind==='beacon'&&f.x===4)!,destination=Object.values(s.facilities).find(f=>f.kind==='beacon'&&f.x===6)!;
 const unit=s.players.p1.hero.id;s=week(s,{kind:'move',unit,x:4,y:5});s=week(s,{kind:'move',unit,x:6,y:5});
 const own=guestSnapshot(s,'p1'),enemy=guestSnapshot(s,'p2');expect(own.movementTraces).toEqual({});expect(own.beaconSurveyCandidates.p1).toMatchObject({origin:origin.id,destination:destination.id,hero:unit});expect(enemy.beaconSurveyCandidates).toEqual({});expect(parseMatch(own,'p1')).toEqual(own);
 s=week(s,{kind:'survey-beacon-link',origin:origin.id,destination:destination.id,trace:own.beaconSurveyCandidates.p1.trace});expect(parseMatch(s).beaconLinks.p1.route.at(-1)).toEqual({x:6,y:5});
});
it('normal workshop production creates heavy plate, paid Troll pickup preserves armor and saves custody',()=>{
 let s=hero(fresh('troll_hold'));s=week(s,{kind:'build',building:'workshop',x:4,y:5});const f=Object.values(s.facilities).find(f=>f.owner==='p1'&&f.kind==='workshop')!;
 s=week(s,{kind:'produce',facility:f.id,recipe:'equipment'});s=resolveWeek(s);const item=Object.values(s.items).find(i=>i.owner==='p1'&&i.crafted)!;expect(item).toMatchObject({heavy:true,bearer:null});const unit=s.players.p1.hero.id,armor=s.units[unit].armor,stock={...s.players.p1.stock};
 s=order(s,{kind:'carry-heavy',item:item.id,carrier:unit});const p=preview(s,'p1');expect(p.players.p1.operations).toBe(2);expect(p.players.p1.stock).toEqual(stock);expect(p.units[unit].armor).toBe(armor);s=resolveWeek(s);expect(parseMatch(s).items[item.id]).toMatchObject({carried:true,bearer:unit});
 s=week(s,{kind:'drop-heavy',item:item.id});expect(s.items[item.id]).toMatchObject({bearer:null,x:s.units[unit].x,y:s.units[unit].y});
});
function courierFixture(){const s=fresh('human_gondor');s.map.terrain.fill('meadow');s.waterChannels={};s.shallowWater={};s.seaHazards={};s.infrastructureSites={};const worker=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;Object.assign(worker,{x:10,y:10,move:2});const f=s.facilities['p1:core'];Object.assign(f,{kind:'safehouse',x:10,y:10});s.facilities.primary={...f,id:'primary',x:12};s.facilities.destination={...f,id:'destination',x:20};const guard=s.units['p2:company:0'];Object.assign(guard,{x:11,y:10});s.vegetation.tree={id:'tree',x:10,y:11,mature:true,altered:false};recordObservedAttack(s,guard);const report=Object.values(s.intelligenceReports).find(r=>r.owner==='p1'&&r.observations.some(o=>o.source===f.id))!;return{s,worker,guard,f,relay:{kind:'night' as const,mode:'message' as const,report:report.id,courier:worker.id,origin:f.id,primary:'primary',destination:'destination',route:Array.from({length:11},(_,i)=>({x:10+i,y:10}))}};}
it('rejects a forged company logging queue and a logging worker second reservation as relay courier',()=>{
 const{s,worker,f,relay}=courierFixture();const id=startLogging(s,'p1',worker.id,'tree',f.id);const forged=structuredClone(s);forged.loggingJobs[id].worker='p1:company:0';expect(()=>parseMatch(forged)).toThrow(/logging/i);
 const r=submit(s,{id:'busy',seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action:relay});expect(r.ok).toBe(false);expect(r.reason).toMatch(/logging/);
});
it('captor can walk out of sight while its private prisoner body and dated disclosure still roundtrip',()=>{
 const initial=courierFixture();let{s}=initial;const{worker,guard,relay}=initial;s=week(s,relay);const target=s.units[worker.id];target.hp=Math.floor(target.maxHp/3);Object.assign(s.units[guard.id],{x:target.x,y:target.y+1});s=week(s,{kind:'capture-agent',unit:guard.id,target:target.id},'p2');const capture=Object.values(s.agentCaptivities)[0];expect(capture).toBeDefined();
 for(let i=0;i<2;i++){const g=s.units[guard.id];s=week(s,{kind:'move',unit:guard.id,x:g.x+g.move,y:g.y},'p2');}
 const guest=guestSnapshot(s,'p2');expect(guest.units[target.id]).toMatchObject({active:false,x:capture.x,y:capture.y});expect(guest.agentDisclosures[capture.id].owner).toBe('p2');expect(parseMatch(guest,'p2')).toEqual(guest);expect(guestSnapshot(s,'p1').agentDisclosures).toEqual({});
});
