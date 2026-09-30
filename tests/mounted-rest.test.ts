import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {startRest,progressRest,restReason} from '../src/simulation/fatigue';
import {mountPenalty,travelMounts} from '../src/simulation/remounts';
import {parseMatch} from '../src/simulation/schema';
import {guestSnapshot} from '../src/network/protocol';
function fixture(profile:string,species:'wolf'|'horse'){
 const s=createMatch([profile,'human_gondor'],8),p=s.players.p1,u=s.units['p1:company:0'],core=s.facilities['p1:core'];
 Object.assign(u,{x:core.x,y:core.y});const f={...structuredClone(core),id:'mounted-rest',kind:'refuge',workers:1};s.facilities[f.id]=f;
 s.mountLots={paid:{id:'paid',owner:'p1',count:12,fatigue:0,species,stable:null,unit:u.id}};
 for(let i=0;i<3;i++)travelMounts(s,u,u,{x:u.x+1,y:u.y});
 return{s,p,u,f,lot:s.mountLots.paid};
}
it.each([['orc_fortress_clan','wolf'],['tilion','horse']]as const)('%s recovers existing attached mounts only after paid ordinary refuge rest', (profile,species)=>{
 const{s,p,u,f,lot}=fixture(profile,species),before=p.stock.P;
 expect(mountPenalty(s,u)).toBe(1);expect(restReason(s,'p1',u.id,f.id)).toBe('');startRest(s,'p1',u.id,f.id);
 expect(p.stock.P).toBe(before-2);expect(lot.fatigue).toBe(3);s.turn++;progressRest(s);
 expect(lot.fatigue).toBe(1);expect(mountPenalty(s,u)).toBe(0);expect(lot.species).toBe(species);expect(lot.count).toBe(12);expect(lot.unit).toBe(u.id);expect(Object.keys(s.mountLots)).toEqual(['paid']);
 progressRest(s);expect(lot.fatigue).toBe(1);
 expect(()=>parseMatch(s)).not.toThrow();expect(()=>parseMatch(guestSnapshot(s,'p1'),'p1')).not.toThrow();
});
it('absence pauses mounted recovery and capture destroys paid rest without recovering foreign mounts',()=>{
 const{s,p,u,f,lot}=fixture('tilion','horse');startRest(s,'p1',u.id,f.id);const paid=p.stock.P;
 u.x+=3;s.turn++;progressRest(s);expect(lot.fatigue).toBe(3);expect(f.rest).toBeDefined();
 u.x=f.x;f.owner='p2';progressRest(s);expect(lot.fatigue).toBe(3);expect(f.rest).toBeUndefined();expect(p.stock.P).toBe(paid);expect(restReason(s,'p2',u.id,f.id)).not.toBe('');
});
it('another owner mount lot cannot qualify a company for paid mount recovery',()=>{
 const{s,u,f,lot}=fixture('tilion','horse');lot.owner='p2';expect(restReason(s,'p1',u.id,f.id)).not.toBe('');
});
