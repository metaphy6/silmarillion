import {expect,it} from 'vitest';
import {createMatch,validate} from '../src/simulation/engine';
import {guestSnapshot} from '../src/network/protocol';
import {spawnVessel} from '../src/simulation/naval';
import {parseMatch} from '../src/simulation/schema';
it('exposes targetable observed hull without cargo, occupants or future route',()=>{
 const s=createMatch(['human_rohan','human_numenor'],41);s.map.terrain.fill('meadow');s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
 const f=s.facilities['p2:core'];f.kind='harbor';f.x=6;f.y=4;
 const crew=Object.values(s.units).find(u=>u.owner==='p2'&&u.kind==='worker')!;crew.x=6;crew.y=4;s.map.terrain[4*s.map.width+5]='water';
 const v=spawnVessel(s,'p2',f.id,crew.id,{x:5,y:4});v.cargo.M=15;
 const attacker=s.units['p1:company:0'];attacker.x=4;attacker.y=4;
 const guest=guestSnapshot(s,'p1');expect(guest.vessels[v.id]).toBeUndefined();
 expect(guest.vesselContacts?.[0]).toEqual({id:v.id,name:v.name,owner:'p2',x:5,y:4,hp:80,maxHp:80,phase:'idle'});
 expect(JSON.stringify(guest.vesselContacts)).not.toContain('cargo');parseMatch(guest,'p1');
 expect(validate(guest,{id:'p1:1:1',seat:'p1',seq:guest.nextSeq.p1,turn:guest.turn,revision:guest.revision,action:{kind:'attack-ship',unit:attacker.id,ship:v.id}})).toBe('');
});
