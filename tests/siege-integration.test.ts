import {expect,it} from 'vitest';
import {createMatch,submit,preview,resolveWeek} from '../src/simulation/engine';
import {encodeCheckpoint,decodeCheckpoint} from '../src/persistence/checkpoints';
import {stocks,type Match,type Action} from '../src/simulation/types';
function order(s:Match,action:Action){return submit(s,{id:`siege:${s.nextSeq.p1}`,seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action});}
function queue(profile='istari_saruman'){
 let s=createMatch([profile,'human_rohan'],19);const p=s.players.p1,core=s.facilities['p1:core'];p.stock=stocks(999,999,999,999);p.sources.push('timber','metal','stone');
 s.facilities.work={...core,id:'work',kind:'workshop',workers:1};
 const result=order(s,{kind:'produce',facility:'work',recipe:'siege'});expect(result.ok,result.reason).toBe(true);
 const reserved=preview(result.state,'p1');expect(reserved.facilities.work.job?.cost).toEqual(stocks(40,45,10));expect(reserved.facilities.work.job?.remaining).toBe(4);expect(reserved.players.p1.stock).toEqual(stocks(959,954,989,999));
 s=result.state;for(let i=0;i<4;i++)s=resolveWeek(s);const machine=Object.values(s.units).find(u=>u.siege)!;expect(machine).toBeDefined();return {s,id:machine.id};
}
function hero(s:Match){const p=s.players.p1,base=s.units['p1:company:0'];s.units[p.hero.id]={...structuredClone(base),id:p.hero.id,kind:'hero',x:s.facilities.work.x,y:s.facilities.work.y,inventory:[],effects:[]};p.hero.status='living';p.hero.readiness=6;}
it('normal paid four-week queue creates one heavy finite-ammunition siege and preserves it through checkpoint',()=>{
 const {s,id}=queue();expect(s.units[id]).toMatchObject({kind:'company',hp:90,maxHp:90,armor:3,attack:20,move:2,supply:3,loadClass:'large',siege:{ammunition:3,capacity:3},upkeep:stocks(2,1)});
 expect(s.facilities.work.job).toBeUndefined();const restored=decodeCheckpoint(encodeCheckpoint(s)).state;expect(restored.units[id].siege).toEqual({ammunition:3,capacity:3});
});
it('Saruman adds exactly one siege hit equivalent per week and every successful weapon attack consumes one shot',()=>{
 const {s,id}=queue();hero(s);const u=s.units[id];s.players.p1.relations.p2='war';s.players.p2.relations.p1='war';s.map.terrain[u.y*s.map.width+u.x+1]='grass';
 s.facilities.target={...s.facilities['p2:core'],id:'target',kind:'gate',x:u.x+1,y:u.y,hp:500,maxHp:500};
 const plain=structuredClone(s);plain.units[plain.players.p1.hero.id].x+=10;
 const attacks=(state:Match)=>{let next=state;for(let n=0;n<2;n++){const r=order(next,{kind:'attack',unit:id,target:'target'});expect(r.ok,r.reason).toBe(true);next=r.state;}return resolveWeek(next);};
 const a=attacks(s),b=attacks(plain);const bonus=b.facilities.target.hp-a.facilities.target.hp;
 expect(bonus).toBeGreaterThanOrEqual(20);expect(bonus).toBeLessThanOrEqual(24);expect(a.units[id].siege?.ammunition).toBe(1);
 const next=order(a,{kind:'attack',unit:id,target:'target'});expect(next.ok,next.reason).toBe(true);const done=resolveWeek(next.state);expect(done.units[id].siege?.ammunition).toBe(0);expect(a.facilities.target.hp-done.facilities.target.hp).toBeGreaterThanOrEqual(20);expect(a.facilities.target.hp-done.facilities.target.hp).toBeLessThanOrEqual(24);
 let later=done;for(let n=0;n<4&&later.turn===s.turn;n++)later=resolveWeek(later);expect(later.turn).toBeGreaterThan(s.turn);expect(order(later,{kind:'attack',unit:id,target:'target'}).reason).toMatch(/ammunition/);
 const reload=order(later,{kind:'reload-siege',unit:id,facility:'work'});expect(reload.ok,reload.reason).toBe(true);const shot=order(reload.state,{kind:'attack',unit:id,target:'target'});expect(shot.ok,shot.reason).toBe(true);const ordinary=structuredClone(shot.state);ordinary.units[ordinary.players.p1.hero.id].x+=10;const renewed=resolveWeek(shot.state),without=resolveWeek(ordinary);expect(without.facilities.target.hp-renewed.facilities.target.hp).toBeGreaterThanOrEqual(20);expect(without.facilities.target.hp-renewed.facilities.target.hp).toBeLessThanOrEqual(24);
});
it('Gondor refits a produced damaged siege without ammunition then reloads for exact stocks and one operation',()=>{
 const initial=queue('human_gondor'),id=initial.id;let s=initial.s;hero(s);s.facilities.work.kind='depot';s.units[id].hp=40;s.units[id].siege!.ammunition=0;
 const r=order(s,{kind:'repair',facility:'work',target:id,method:'power'});expect(r.ok,r.reason).toBe(true);expect(preview(r.state,'p1').players.p1.stock.M).toBe(s.players.p1.stock.M-10);s=resolveWeek(r.state);
 expect(s.units[id].hp).toBe(62);expect(s.units[id].siege?.ammunition).toBe(0);
 const reload=order(s,{kind:'reload-siege',unit:id,facility:'work'});expect(reload.ok,reload.reason).toBe(true);const reserved=preview(reload.state,'p1');expect(reserved.players.p1.operations).toBe(s.players.p1.operations-1);expect(reserved.players.p1.stock).toEqual({...s.players.p1.stock,P:s.players.p1.stock.P-5,M:s.players.p1.stock.M-10});expect(reserved.units[id].siege?.ammunition).toBe(3);expect(reserved.units[id].hp).toBe(62);
});
it('checkpoint rejects forged magazine capacity, ammunition and unauthorized company identity',()=>{
 const {s,id}=queue();Object.assign(s.units[id].siege!,{capacity:4});expect(()=>encodeCheckpoint(s)).toThrow();Object.assign(s.units[id].siege!,{capacity:3});s.units[id].siege!.ammunition=4;expect(()=>encodeCheckpoint(s)).toThrow();s.units[id].siege!.ammunition=3;s.units[id].kind='hero';expect(()=>encodeCheckpoint(s)).toThrow();s.units[id].kind='company';s.units[id].owner='p2';expect(()=>encodeCheckpoint(s)).toThrow();
});
