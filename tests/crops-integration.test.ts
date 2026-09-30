import {expect,it} from 'vitest';
import {createMatch,submit,resolveWeek,preview} from '../src/simulation/engine';
import {encodeCheckpoint,decodeCheckpoint} from '../src/persistence/checkpoints';
import {guestSnapshot} from '../src/network/protocol';
import {parseMatch} from '../src/simulation/schema';
import type {Match,Action} from '../src/simulation/types';
function fixture(){const s=createMatch(['vana','human_rohan'],15),p=s.players.p1,f=s.facilities['p1:core'];s.map.terrain.fill('meadow');s.seaHazards={};s.shallowWater={};s.infrastructureSites={};p.stock={P:100,M:100,K:100,E:100};p.hero.status='living';p.hero.readiness=6;s.units[p.hero.id]={...structuredClone(s.units['p1:company:0']),id:p.hero.id,kind:'hero',x:f.x,y:f.y};f.kind='crop-plot';s.facilities.water={...structuredClone(f),id:'water',kind:'irrigation',x:f.x+1};return s;}
function order(s:Match,action:Action){return submit(s,{id:`crop-order-${s.turn}-${s.nextSeq.p1}`,seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action});}
it('reserves real planting costs and operation, advances once with personal commitment, and preserves finite yield through checkpoint',()=>{
 let s=fixture();const planted=order(s,{kind:'plant-crop',plot:'p1:core',irrigation:'water'});expect(planted.ok).toBe(true);const projected=preview(planted.state,'p1');expect(projected.players.p1.stock.P).toBe(90);expect(projected.players.p1.stock.M).toBe(95);expect(projected.players.p1.operations).toBe(2);
 s=resolveWeek(planted.state);const id=Object.keys(s.crops)[0];expect(s.crops[id].stage).toBe(1);const advance=order(s,{kind:'advance-crop',crop:id});expect(advance.ok).toBe(true);expect(preview(advance.state,'p1').players.p1.commitment).toBe(0);expect(order(advance.state,{kind:'advance-crop',crop:id}).ok).toBe(false);
 s=resolveWeek(advance.state);expect(s.crops[id]).toMatchObject({stage:3,harvest:30,remainingCare:0,status:'harvested',advanced:true});const restored=decodeCheckpoint(encodeCheckpoint(s)).state;expect(restored.crops).toEqual(s.crops);expect(parseMatch(guestSnapshot(restored,'p2'),'p2').crops).toEqual({});
});
it('rejects stolen irrigation before spending and keeps failed crop private without phantom harvest',()=>{
 let s=fixture();s=resolveWeek(order(s,{kind:'plant-crop',plot:'p1:core',irrigation:'water'}).state);const id=Object.keys(s.crops)[0];s.facilities.water.owner='p2';const before=structuredClone(s.players.p1);expect(order(s,{kind:'advance-crop',crop:id}).ok).toBe(false);expect(s.players.p1).toEqual(before);s=resolveWeek(s);expect(s.crops[id].status).toBe('failed');expect(s.crops[id].harvest).toBe(30);expect(decodeCheckpoint(encodeCheckpoint(s)).state.crops[id].status).toBe('failed');
});
