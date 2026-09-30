import {expect,it} from 'vitest';
import {createMatch,submit,preview,resolveWeek} from '../src/simulation/engine';
import {guestSnapshot} from '../src/network/protocol';
import {parseMatch} from '../src/simulation/schema';
import {decodeCheckpoint,encodeCheckpoint} from '../src/persistence/checkpoints';
import type {Match,Action} from '../src/simulation/types';
function order(s:Match,a:Action){return submit(s,{id:`civil:${s.nextSeq.p1}`,seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action:a});}
it('real orders reserve operations/commitment, preserve stores and checkpoint identity, and redact foreign households',()=>{
 let s=createMatch(['hobbit_shire','human_gondor'],17);const p=s.players.p1,f=s.facilities['p1:core'],h=s.households['household:p1'];const u=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;u.x=f.x;u.y=f.y;u.move=5;s.infrastructureSites={};s.shallowWater={};s.seaHazards={};
 s.units[p.hero.id]={...structuredClone(u),id:p.hero.id,kind:'hero',loadClass:'standard'};p.hero.status='living';p.hero.readiness=6;
 const dest={x:f.x+2,y:f.y};for(let x=f.x;x<=dest.x;x++)s.map.terrain[f.y*s.map.width+x]='meadow';s.facilities.ref={...f,id:'ref',kind:'refuge',...dest};
 let r=order(s,{kind:'civilian',mode:'deposit',household:h.id,unit:u.id,amount:10});expect(r.ok,r.reason).toBe(true);s=r.state;
 r=order(s,{kind:'civilian',mode:'stores',household:h.id,carrier:u.id,destination:'ref',route:[{x:f.x,y:f.y},{x:f.x+1,y:f.y},dest],amount:10,method:'hobbit'});expect(r.ok,r.reason).toBe(true);
 const v=preview(r.state,'p1');expect(v.players.p1.operations).toBe(1);expect(v.players.p1.commitment).toBe(0);expect(Object.values(v.civilianJobs)[0].provisions).toBe(10);expect(order(r.state,{kind:'move',unit:u.id,x:f.x,y:f.y+1}).reason).toMatch(/civilian transport/);
 s=resolveWeek(r.state);expect(Object.values(s.civilianJobs)[0].phase).toBe('arrived');expect(Object.values(s.households).filter(h=>h.owner==='p1').reduce((n,h)=>n+h.provisions,0)).toBe(10);
 expect(decodeCheckpoint(encodeCheckpoint(s)).state.civilianJobs).toEqual(s.civilianJobs);const guest=guestSnapshot(s,'p2');expect(Object.values(guest.households).every(h=>h.owner==='p2')).toBe(true);expect(Object.keys(guest.civilianJobs)).toHaveLength(0);expect(()=>parseMatch(guest,'p2')).not.toThrow();
});
