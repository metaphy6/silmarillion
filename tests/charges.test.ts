import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {chargeReason,prepareCharge,resolveCharges,chargeOperationCost,isChargeMember,interruptChargesOnDamage,pursuitDamagePenalty,validateChargeState,type ChargeState} from '../src/simulation/charges';
import type {Match} from '../src/simulation/types';
import {factionProduction} from '../src/content/production';
function fixture(profile='human_rohan'){
 const s:ChargeState={...createMatch([profile,'human_gondor'],53),charges:{}};s.map.terrain.fill('meadow');s.seaHazards={};s.shallowWater={};const p=s.players.p1;p.hero.status='living';p.hero.readiness=6;s.units[p.hero.id]={...structuredClone(s.units['p1:company:0']),id:p.hero.id,kind:'hero',x:8,y:10,move:4,effects:[]};
 const a=s.units['p1:company:0'],b=s.units['p1:company:1'],target=s.units['p2:company:0'];Object.assign(a,{x:8,y:10,move:4,kind:factionProduction(profile).unit.kind});Object.assign(b,{x:10,y:8,move:4,kind:factionProduction(profile).unit.kind});Object.assign(target,{x:11,y:10,hp:100,maxHp:100});
 for(const u of Object.values(s.units))if(u.owner==='p2'&&u!==target){u.x=28;u.y=28;}
 const path=(_s:Match,x:{x:number;y:number},y:{x:number;y:number})=>{const r=[{x:x.x,y:x.y}];let{ x:a,y:b}=x;while(a!==y.x){a+=Math.sign(y.x-a);r.push({x:a,y:b});}while(b!==y.y){b+=Math.sign(y.y-b);r.push({x:a,y:b});}return r;};
 const route=[{x:8,y:10},{x:9,y:10},{x:10,y:10}];return{s,p,a,b,target,path,route};
}
it('Rohan moves along the paid normal charge route and suppresses pursuit only after a successful actual hit',()=>{
 for(const hit of [true,false]){const{s,p,a,target,path,route}=fixture();const request={mode:'relief-charge' as const,target:target.id,members:[{unit:a.id,route}]};expect(chargeOperationCost(request)).toBe(1);const q=prepareCharge(s,'p1',request,path);expect(p.hero.readiness).toBe(4);expect(isChargeMember(s,a.id)).toBe(true);resolveCharges(s,path,{attack:()=>hit});expect(a.x).toBe(8);s.revision++;const attacks:string[]=[];resolveCharges(s,path,{attack:id=>{attacks.push(id);return hit;}});expect(a.x).toBe(10);expect(attacks).toEqual([a.id]);expect(target.effects.some(e=>e.kind==='pursuit-suppressed')).toBe(hit);expect(s.charges[q.id]).toBeUndefined();}
});
it('Wolf requires two trusted beast groups and distinct passable directions around an isolated formation, without attacks',()=>{
 const{s,a,b,target,path,route}=fixture('wolf_pack');const request={mode:'split-pursuit' as const,target:target.id,members:[{unit:a.id,route},{unit:b.id,route:[{x:10,y:8},{x:11,y:8},{x:11,y:9}]}]};expect(a.kind).toBe('beast');expect(chargeReason(s,'p1',request,path)).toBe('');expect(chargeOperationCost(request)).toBe(2);prepareCharge(s,'p1',request,path);s.revision++;let hits=0;resolveCharges(s,path,{attack:()=>{hits++;return true;}});expect(hits).toBe(0);expect(a.x).toBe(10);expect(b.y).toBe(9);expect(pursuitDamagePenalty(s,target)).toBe(25);
});
it('real counter support, brace or blocked terrain invalidates the charge before movement',()=>{
 const{s,a,target,path,route}=fixture();const request={mode:'relief-charge' as const,target:target.id,members:[{unit:a.id,route}]};prepareCharge(s,'p1',request,path);s.facilities.counter={...structuredClone(s.facilities['p2:core']),id:'counter',kind:'barricade',x:11,y:11};s.revision++;let attacks=0;resolveCharges(s,path,{attack:()=>{attacks++;return true;}});expect(a.x).toBe(8);expect(attacks).toBe(0);
});
it('Orome must intercept a genuinely prepared attacker and interrupts its pursuit after real impact',()=>{
 const{s,p,a,target,path,route}=fixture('orome');a.x=7;a.y=9;const h=s.units[p.hero.id];const request={mode:'hunter-interception' as const,target:target.id,members:[{unit:h.id,route}]};expect(chargeReason(s,'p1',request,path)).toMatch(/attacking/);s.tacticalOrders.enemy={id:'enemy',owner:'p2',unit:target.id,kind:'pursuit',target:a.id,origin:{x:target.x,y:target.y},createdTurn:s.turn,createdRevision:s.revision,until:s.revision+2};expect(chargeOperationCost(request)).toBe(0);prepareCharge(s,'p1',request,path);s.revision++;resolveCharges(s,path,{attack:()=>true});expect(s.tacticalOrders.enemy).toBeUndefined();expect(target.effects.some(e=>e.kind==='move-limit'&&e.value===1)).toBe(true);
});
it('positive hits interrupt preparation and forged duplicate participant saves are rejected',()=>{
 const{s,a,target,path,route}=fixture();const q=prepareCharge(s,'p1',{mode:'relief-charge',target:target.id,members:[{unit:a.id,route}]},path);expect(()=>validateChargeState(s)).toThrow(/budget/);s.players.p1.commitment=0;s.players.p1.encounter=true;s.players.p1.operations=2;expect(()=>validateChargeState(s)).not.toThrow();interruptChargesOnDamage(s,a.id,0);expect(isChargeMember(s,a.id)).toBe(true);q.members.push(structuredClone(q.members[0]));expect(()=>validateChargeState(s)).toThrow();interruptChargesOnDamage(s,a.id,1);expect(isChargeMember(s,a.id)).toBe(false);
});
it('hidden supporting troops do not leak through preparation reasons but counter the actual wolf approach',()=>{
 const{s,a,b,target,path,route}=fixture('wolf_pack');const ally=s.units['p2:company:1'];Object.assign(ally,{x:12,y:10});s.zones.smoke={id:'smoke',owner:'p2',kind:'smoke',x:12,y:10,dx:1,dy:0,radius:.4,until:s.revision+4,triggered:false};const request={mode:'split-pursuit' as const,target:target.id,members:[{unit:a.id,route},{unit:b.id,route:[{x:10,y:8},{x:11,y:8},{x:11,y:9}]}]};expect(chargeReason(s,'p1',request,path)).toBe('');prepareCharge(s,'p1',request,path);s.revision++;resolveCharges(s,path,{attack:()=>true});expect(a.x).toBe(8);expect(pursuitDamagePenalty(s,target)).toBe(0);
});
