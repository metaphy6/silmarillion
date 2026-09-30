import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {scoutPowerReason,useScoutPower,recordWitnessedAttack,shadowContacts,examineShadowReason,examineShadow,pruneScouting,validateScouting,type ScoutingState} from '../src/simulation/scouting';
function fixture(profile='istari_veil'){
 const s:ScoutingState={...createMatch([profile,'human_gondor'],77),scoutShadows:{},witnessedAttacks:{},witnessFlares:{}};s.map.terrain.fill('meadow');s.seaHazards={};s.shallowWater={};const p=s.players.p1;p.hero.status='living';p.hero.readiness=6;p.stock.K=50;const hero={...structuredClone(s.units['p1:company:0']),id:p.hero.id,kind:'hero' as const,x:10,y:10,effects:[]};s.units[hero.id]=hero;const enemy=s.units['p2:company:0'];Object.assign(enemy,{x:12,y:10});return{s,p,hero,enemy};
}
it('Borrowed Shadow spends exact costs and creates only a stationary anonymous visible contact, never a Unit',()=>{
 const{s,p}=fixture();const before=Object.keys(s.units);useScoutPower(s,'p1',{mode:'borrowed-shadow',point:{x:11,y:10}});expect(p.hero.readiness).toBe(4);expect(p.stock.K).toBe(45);expect(Object.keys(s.units)).toEqual(before);expect(shadowContacts(s,'p2')).toEqual([{x:11,y:10}]);expect(Object.values(s.scoutShadows)[0]).not.toHaveProperty('inventory');s.revision+=2;pruneScouting(s);expect(shadowContacts(s,'p2')).toHaveLength(1);s.revision++;pruneScouting(s);expect(shadowContacts(s,'p2')).toHaveLength(0);
});
it('physical examination costs an ordinary action outside this module, removes a real silhouette and never probes presence via validation',()=>{
 const{s,enemy}=fixture();useScoutPower(s,'p1',{mode:'borrowed-shadow',point:{x:11,y:10}});expect(examineShadowReason(s,'p2',enemy.id,{x:11,y:10})).toBe('');expect(examineShadow(s,'p2',enemy.id,{x:11,y:10})).toBe(true);expect(examineShadowReason(s,'p2',enemy.id,{x:11,y:10})).toBe('');expect(examineShadow(s,'p2',enemy.id,{x:11,y:10})).toBe(false);
});
it('Witness Flare requires a genuinely observed attacker and remains at its dated point after the target moves',()=>{
 const{s,p,enemy}=fixture('ilmare');const request={mode:'witness-flare' as const,target:enemy.id};expect(scoutPowerReason(s,'p1',request)).toMatch(/observed attack/i);recordWitnessedAttack(s,enemy);useScoutPower(s,'p1',request);expect(p.hero.readiness).toBe(4);const mark=Object.values(s.witnessFlares)[0];expect(mark.point).toEqual({x:12,y:10});enemy.x=14;expect(mark.point).toEqual({x:12,y:10});expect(mark).not.toHaveProperty('target');
});
it('hidden attacks generate no private identity evidence and silhouettes never become identified attackers',()=>{
 const{s,enemy}=fixture('ilmare');s.zones.smoke={id:'smoke',owner:'p2',kind:'smoke',x:12,y:10,dx:1,dy:0,radius:1,until:4,triggered:false};recordWitnessedAttack(s,enemy);expect(Object.values(s.witnessedAttacks).filter(e=>e.owner==='p1')).toHaveLength(0);expect(scoutPowerReason(s,'p1',{mode:'witness-flare',target:enemy.id})).not.toBe('');
});
it('scouting checkpoint records are finite, private and reject fabricated future observations',()=>{
 const{s,enemy}=fixture('ilmare');for(let i=0;i<70;i++)recordWitnessedAttack(s,enemy);expect(Object.values(s.witnessedAttacks).filter(a=>a.owner==='p1').length).toBeLessThanOrEqual(64);expect(()=>validateScouting(s)).not.toThrow();Object.values(s.witnessedAttacks)[0].revision=s.revision+1;expect(()=>validateScouting(s)).toThrow();
});
