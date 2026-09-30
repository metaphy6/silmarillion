import {expect,it} from 'vitest';
import {createMatch,submit,resolveWeek,preview} from '../src/simulation/engine';
import {guestSnapshot} from '../src/network/protocol';
import {encodeCheckpoint,decodeCheckpoint} from '../src/persistence/checkpoints';
import {parseMatch} from '../src/simulation/schema';
import type {Match,Action} from '../src/simulation/types';
function order(s:Match,a:Action,seat='p1'){const r=submit(s,{id:`night:${seat}:${s.turn}:${s.nextSeq[seat]}`,seat,seq:s.nextSeq[seat],turn:s.turn,revision:s.revision,action:a});expect(r.ok,r.reason).toBe(true);return r.state;}
function finish(s:Match){const turn=s.turn;for(let n=0;n<6&&s.turn===turn;n++)s=resolveWeek(s);expect(s.turn).toBe(turn+1);return s;}
function fixture(profile:string){const s=createMatch([profile,'human_rohan'],3);s.infrastructureSites={};s.shallowWater={};s.seaHazards={};s.map.terrain.fill('meadow');s.waterChannels={};s.players.p2.ai=false;s.players.p1.stock={P:500,M:500,K:500,E:500};return s;}
it('normal scout training creates a usable patrol and dated report, roundtrips and hides foreign reports',()=>{
 let s=fixture('human_gondor');const unit=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='company')!;unit.x=3;unit.y=3;unit.move=5;
 s=order(s,{kind:'night',mode:'train-scout',unit:unit.id});s=finish(s);expect(s.scoutCredentials[unit.id].ready).toBe(true);s=finish(s);s=finish(s);expect(s.nightRegions['night:p1'].period).toBe('night');
 const route=[{x:3,y:3},{x:3,y:2}];s=order(s,{kind:'night',mode:'patrol',unit:unit.id,route,method:'ordinary'});expect(preview(s,'p1').players.p1.operations).toBe(2);s=resolveWeek(s);expect(s.units[unit.id].y).toBe(3);expect(()=>encodeCheckpoint(s)).toThrow();s=resolveWeek(s);expect(s.units[unit.id].y).toBe(2);
 const enemy=Object.values(s.units).find(u=>u.owner==='p2'&&u.kind==='company')!;enemy.x=2;enemy.y=3;enemy.move=5;
 s=order(s,{kind:'move',unit:enemy.id,x:3,y:3},'p2');s=finish(s);const report=Object.values(s.nightReports)[0];expect(report.observations).toHaveLength(1);expect(report.createdTurn).toBe(s.turn);expect(decodeCheckpoint(encodeCheckpoint(s)).state.nightReports).toEqual(s.nightReports);const guest=guestSnapshot(s,'p2');expect(Object.keys(guest.nightReports)).toHaveLength(0);expect(()=>parseMatch(guest,'p2')).not.toThrow();
});
it('explicit dark assignment pauses only its paid job; maintained ordinary lamps fund the normal stage',()=>{
 let s=fixture('human_gondor');const f=s.facilities['p1:core'],u=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;u.x=f.x;u.y=f.y;
 s.infrastructureSites.site={id:'site',owner:'p1',x:f.x,y:f.y+1,kind:'haulway',blocked:true,originalCapacity:1,material:'timber',yield:{P:0,M:0,K:0,E:0},consumed:false};
 s=order(s,{kind:'infrastructure-work',site:'site',worker:u.id,facility:f.id});const job=Object.keys(preview(s,'p1').infrastructureWork)[0];s=order(s,{kind:'night',mode:'assign-shift',job});const shift=Object.keys(preview(s,'p1').darkShifts)[0];const before=preview(s,'p1').players.p1.stock.M;s=order(s,{kind:'night',mode:'light-shift',shift,method:'lamps'});expect(preview(s,'p1').players.p1.stock.M).toBe(before-5);s=finish(s);expect(s.infrastructureWork[job].remaining).toBe(1);expect(s.darkShifts[shift].worked).toBe(true);expect(()=>encodeCheckpoint(s)).not.toThrow();
});
it('Dawn Worksite uses the adopted paid activation through normal commands and existing queue',()=>{
 let s=fixture('arien');const f=s.facilities['p1:core'],u=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!,p=s.players.p1;u.x=f.x;u.y=f.y;s.units[p.hero.id]={...structuredClone(u),id:p.hero.id,kind:'hero',loadClass:'standard'};p.hero.status='living';p.hero.readiness=6;
 s=order(s,{kind:'build',building:'mirror-station',x:f.x-1,y:f.y});s=finish(s);s=finish(s);s=finish(s);const mirror=Object.values(s.facilities).find(f=>f.kind==='mirror-station')!;
 s.infrastructureSites.site={id:'site',owner:'p1',x:f.x,y:f.y+1,kind:'haulway',blocked:true,originalCapacity:1,material:'timber',yield:{P:0,M:0,K:0,E:0},consumed:false};s=order(s,{kind:'infrastructure-work',site:'site',worker:u.id,facility:f.id});const job=Object.keys(preview(s,'p1').infrastructureWork)[0];s=order(s,{kind:'night',mode:'assign-shift',job});const shift=Object.keys(preview(s,'p1').darkShifts)[0];s=order(s,{kind:'night',mode:'light-shift',shift,method:'dawn',mirror:mirror.id});expect(preview(s,'p1').players.p1.commitment).toBe(0);expect(preview(s,'p1').players.p1.operations).toBe(1);s=finish(s);expect(s.darkShifts[shift].worked).toBe(true);expect(s.infrastructureWork[job].remaining).toBe(1);
});
it('rejects forged dark-shift ownership and job linkage in checkpoints',()=>{
 let s=fixture('human_gondor');const f=s.facilities['p1:core'],u=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;u.x=f.x;u.y=f.y;
 s.infrastructureSites.site={id:'site',owner:'p1',x:f.x,y:f.y+1,kind:'haulway',blocked:true,originalCapacity:1,material:'timber',yield:{P:0,M:0,K:0,E:0},consumed:false};
 s=order(s,{kind:'infrastructure-work',site:'site',worker:u.id,facility:f.id});const job=Object.keys(preview(s,'p1').infrastructureWork)[0];
 expect(submit(s,{id:'foreign-shift',seat:'p2',seq:s.nextSeq.p2,turn:s.turn,revision:s.revision,action:{kind:'night',mode:'assign-shift',job}}).ok).toBe(false);
 s=order(s,{kind:'night',mode:'assign-shift',job});s=finish(s);expect(s.infrastructureWork[job].remaining).toBe(2);
 const shift=Object.values(s.darkShifts)[0];shift.owner='p2';expect(()=>parseMatch(s)).toThrow();
});
it('paid lamps cannot be charged twice and loss of staff before acceptance cancels dependent orders',()=>{
 let s=fixture('human_gondor');const f=s.facilities['p1:core'],u=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;u.x=f.x;u.y=f.y;
 s.infrastructureSites.site={id:'site',owner:'p1',x:f.x,y:f.y+1,kind:'haulway',blocked:true,originalCapacity:1,material:'timber',yield:{P:0,M:0,K:0,E:0},consumed:false};
 s=order(s,{kind:'infrastructure-work',site:'site',worker:u.id,facility:f.id});const job=Object.keys(preview(s,'p1').infrastructureWork)[0];s=order(s,{kind:'night',mode:'assign-shift',job});const shift=Object.keys(preview(s,'p1').darkShifts)[0];s=order(s,{kind:'night',mode:'light-shift',shift,method:'lamps'});
 const funded=preview(s,'p1');expect(funded.players.p1.operations).toBe(0);expect(submit(s,{id:'double-light',seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action:{kind:'night',mode:'light-shift',shift,method:'lamps'}}).ok).toBe(false);
 s.units[u.id].supplied=false;s=finish(s);expect(s.infrastructureWork[job]).toBeUndefined();expect(s.darkShifts[shift]).toBeUndefined();expect(s.infrastructureSites.site.blocked).toBe(true);
});
