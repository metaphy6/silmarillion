import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import {
  recordRecoverableInjury,
  startCare,
  progressCare,
  careReason,
  type RecoveryState,
} from "../src/simulation/recovery";
function fixture() {
  const s: RecoveryState = {
    ...createMatch(["elf_finarfin", "human_rohan"], 61),
    recoveries: {},
  };
  const u = s.units["p1:company:0"];
  u.hp = 30;
  u.maxHp = 100;
  const f = s.facilities["p1:core"];
  f.kind = "refuge";
  u.x = f.x;
  u.y = f.y;
  recordRecoverableInjury(s, u, 30);
  return { s, u, f };
}
it("keeps finite injury identity and requires actual paid care without restoring casualties", () => {
  const { s, u, f } = fixture();
  const before = { ...s.players.p1.stock };
  startCare(s, "p1", { unit: u.id, facility: f.id });
  expect(s.players.p1.stock.P).toBe(before.P - 5);
  expect(s.players.p1.stock.M).toBe(before.M - 2);
  progressCare(s);
  expect(u.effects.some((e) => e.kind === "recovery-wound")).toBe(true);
  s.turn++;
  progressCare(s);
  expect(u.effects.some((e) => e.kind === "recovery-wound")).toBe(false);
  expect(u.hp).toBe(30);
});
it("moving or taking renewed injury interrupts care permanently, without refund or remote healing", () => {
  const { s, u, f } = fixture();
  startCare(s, "p1", { unit: u.id, facility: f.id });
  u.x += 2;
  progressCare(s);
  expect(Object.keys(s.recoveries)).toHaveLength(0);
  expect(u.effects.some((e) => e.kind === "recovery-wound")).toBe(true);
});
it("rejects fabricated healthy patients and occupied work sites", () => {
  const { s, u, f } = fixture();
  u.effects = [];
  expect(careReason(s, "p1", { unit: u.id, facility: f.id })).toMatch(
    /injury/i,
  );
  recordRecoverableInjury(s, u, 30);
  f.job = {id:"job-test",started:s.turn,supply:0,great:0,binding:0, recipe: "worker", remaining: 1, cost: { P: 1, M: 0, K: 0, E: 0 } };
  expect(careReason(s, "p1", { unit: u.id, facility: f.id })).toMatch(
    /occupied/i,
  );
});

import {carePowerReason,accelerateCare} from '../src/simulation/recovery';
import {submit,resolveWeek} from '../src/simulation/engine';
import {parseMatch} from '../src/simulation/schema';
import {guestSnapshot} from '../src/network/protocol';
function liveHero(s:RecoveryState,profile:string){const p=s.players.p1;p.profile=profile;p.hero.status='living';p.hero.readiness=6;p.stock={P:100,M:100,K:100,E:100};s.units[p.hero.id]={...structuredClone(s.units['p1:company:0']),id:p.hero.id,kind:'hero',effects:[],alive:true,active:true};}
it('Grove advances real paid worker and company schedules; Finarfin still excludes workers',()=>{
 const {s,u,f}=fixture();liveHero(s,'istari_grove');f.kind='medicine-nursery';const worker=Object.values(s.units).find(v=>v.owner==='p1'&&v.kind==='worker')!;Object.assign(worker,{x:f.x,y:f.y});recordRecoverableInjury(s,worker,Math.ceil(worker.maxHp/4));
 startCare(s,'p1',{unit:u.id,facility:f.id});startCare(s,'p1',{unit:worker.id,facility:f.id});const a={mode:'grove' as const,facility:f.id,units:[u.id,worker.id]};expect(carePowerReason(s,'p1',a,()=>false)).toMatch(/connected/);accelerateCare(s,'p1',a,()=>true);progressCare(s);expect(Object.keys(s.recoveries)).toHaveLength(0);expect(worker.effects.some(e=>e.kind==='recovery-wound')).toBe(false);
});
it('Este needs connected ordinary shelter and cannot use an exposed beacon as shelter',()=>{
 const {s,u,f}=fixture();liveHero(s,'este');f.kind='beacon';const a={unit:u.id,method:'este' as const};expect(careReason(s,'p1',a,()=>true)).toMatch(/shelter/i);f.kind='core';expect(careReason(s,'p1',a,()=>false)).toMatch(/connected/i);startCare(s,'p1',a,()=>true);progressCare(s);expect(u.hp).toBe(30);expect(Object.keys(s.recoveries)).toHaveLength(0);
});
it('normal care commands reserve physical rest, persist through saves and require explicit cancellation',()=>{
 const {s,u,f}=fixture();const first=submit(s,{id:'care1',seat:'p1',seq:1,turn:s.turn,revision:s.revision,action:{kind:'care',unit:u.id,facility:f.id}});expect(first.ok).toBe(true);
 const denied=submit(first.state,{id:'caremove',seat:'p1',seq:2,turn:s.turn,revision:s.revision,action:{kind:'move',unit:u.id,x:u.x+1,y:u.y}});expect(denied.reason).toMatch(/cancel care/);
 const next=resolveWeek(first.state);expect(Object.values(next.recoveries)[0].remaining).toBe(1);expect(parseMatch(next).recoveries).toEqual(next.recoveries);expect(Object.keys(guestSnapshot(next,'p2').recoveries)).toHaveLength(0);
 const cancel=submit(next,{id:'carecancel',seat:'p1',seq:next.nextSeq.p1,turn:next.turn,revision:next.revision,action:{kind:'cancel-care',unit:u.id}});expect(cancel.ok).toBe(true);const ended=resolveWeek(cancel.state);expect(Object.keys(ended.recoveries)).toHaveLength(0);expect(ended.units[u.id].effects.some(e=>e.kind==='recovery-wound')).toBe(true);
});
it('save validation rejects a fabricated healthy-patient recovery queue',()=>{
 const {s,u,f}=fixture();startCare(s,'p1',{unit:u.id,facility:f.id});u.effects=[];expect(()=>parseMatch(s)).toThrow(/recovery/i);
});
it('a real nonfatal combat hit creates a persistent recoverable injury',()=>{
 const {s,u}=fixture();u.effects=[];u.hp=100;u.armor=0;const enemy=s.units['p2:company:0'];Object.assign(enemy,{x:u.x+1,y:u.y,attack:40,armor:0});
 const order=submit(s,{id:'wound',seat:'p2',seq:1,turn:s.turn,revision:s.revision,action:{kind:'attack',unit:enemy.id,target:u.id}});expect(order.ok).toBe(true);const next=resolveWeek(order.state);expect(next.units[u.id].effects.some(e=>e.kind==='recovery-wound')).toBe(true);
});
