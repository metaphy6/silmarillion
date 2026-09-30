import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {stocks} from '../src/simulation/types';
import {isOrdinarySiege,siegeAttackReason,consumeSiegeShot,siegeReloadReason,reloadSiege,validateSiege,siegeRecipe,type SiegeUnit} from '../src/simulation/siege';
function setup(profile='human_gondor'){
 const s=createMatch([profile,profile==='human_rohan'?'elf_feanor':'human_rohan'],4),u=s.units['p1:company:0'] as SiegeUnit,f=s.facilities['p1:core'];
 u.siege={ammunition:0,capacity:3};Object.assign(u,{x:f.x,y:f.y,active:true,supplied:true});f.kind='workshop';f.workers=1;s.players.p1.stock=stocks(50,50,50,50);s.players.p1.operations=3;
 return {s,u,f};
}
it('trusted siege belongs only to authorized normal companies, never heroes or other factions',()=>{
 const {s,u}=setup();expect(isOrdinarySiege(s,u)).toBe(true);
 u.kind='hero';expect(isOrdinarySiege(s,u)).toBe(false);expect(()=>validateSiege(s)).toThrow(/siege/);
 const foreign=setup('human_rohan');expect(isOrdinarySiege(foreign.s,foreign.u)).toBe(false);expect(()=>validateSiege(foreign.s)).toThrow(/siege/);
 expect(siegeRecipe.cost).toEqual(stocks(40,45,10));expect(siegeRecipe.turns).toBe(4);expect(siegeRecipe.supply).toBe(3);
});
it('reload consumes normal operation and full fee, conserves identity and HP, and fills only existing magazines',()=>{
 const {s,u,f}=setup('istari_saruman'),hp=u.hp,ids=Object.keys(s.units);
 expect(siegeReloadReason(s,'p1',u.id,f.id)).toBe('');reloadSiege(s,'p1',u.id,f.id);
 expect(u.siege?.ammunition).toBe(3);expect(s.players.p1.stock).toEqual(stocks(45,40,50,50));expect(s.players.p1.operations).toBe(2);expect(u.hp).toBe(hp);
 expect(siegeReloadReason(s,'p1',u.id,f.id)).toMatch(/full/);expect(Object.keys(s.units)).toEqual(ids);
 expect(()=>validateSiege(s)).not.toThrow();
});
it('real weapon attempts consume ammunition once including misses and cannot fire empty magazines',()=>{
 const {s,u}=setup();expect(siegeAttackReason(s,u)).toMatch(/ammunition/);expect(()=>consumeSiegeShot(s,u)).toThrow(/ammunition/);
 u.siege!.ammunition=2;consumeSiegeShot(s,u);expect(u.siege!.ammunition).toBe(1);consumeSiegeShot(s,u);expect(siegeAttackReason(s,u)).toMatch(/ammunition/);
 u.siege!.ammunition=4;expect(()=>validateSiege(s)).toThrow(/siege/);
});
it('reload rejects enemy worksites, absent staff, supply, stock or actions without partial payment',()=>{
 const {s,u,f}=setup();f.owner='p2';expect(siegeReloadReason(s,'p1',u.id,f.id)).toMatch(/worksite/);f.owner='p1';f.workers=0;expect(siegeReloadReason(s,'p1',u.id,f.id)).toMatch(/worksite/);f.workers=1;
 u.supplied=false;expect(siegeReloadReason(s,'p1',u.id,f.id)).toMatch(/supplied/);u.supplied=true;s.players.p1.operations=0;expect(siegeReloadReason(s,'p1',u.id,f.id)).toMatch(/operation/);s.players.p1.operations=1;s.players.p1.stock.M=9;
 const before=structuredClone(s);expect(()=>reloadSiege(s,'p1',u.id,f.id)).toThrow(/Materials/);expect(s).toEqual(before);
});
