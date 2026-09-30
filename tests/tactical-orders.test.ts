import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {declareTacticalOrder,tacticalOrderReason,tacticalPowerReason,applyTacticalPower,resolveTacticalOrders,validateTacticalOrders,type TacticalState} from '../src/simulation/tactical-orders';
function setup(profile='istari_star'){
 const s:TacticalState={...createMatch([profile,'human_rohan'],74),tacticalOrders:{}};s.map.terrain.fill('meadow');s.seaHazards={};s.shallowWater={};s.infrastructureSites={};
 const p=s.players.p1;p.hero.status='living';p.hero.readiness=6;p.operations=3;
 const u=s.units['p1:company:0'];Object.assign(u,{x:10,y:10,move:4,flying:false});
 const hero={...structuredClone(u),id:p.hero.id,kind:'hero' as const,x:9,y:10};s.units[hero.id]=hero;
 const enemy=s.units['p2:company:0'];Object.assign(enemy,{x:9,y:10,move:4});
 const path=(_s:typeof s,a:{x:number;y:number},b:{x:number;y:number})=>{const r=[{x:a.x,y:a.y}];let{x,y}=a;while(x!==b.x){x+=Math.sign(b.x-x);r.push({x,y});}while(y!==b.y){y+=Math.sign(b.y-y);r.push({x,y});}return r;};
 return{s,p,u,hero,enemy,path};
}
it('declares actual fallback and resolves no earlier than its response phase',()=>{
 const{s,u,path}=setup();declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10},{x:12,y:10}]},path);
 resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(u.x).toBe(10);s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(u.x).toBe(12);expect(Object.keys(s.tacticalOrders)).toHaveLength(0);
});
it('Signal Flash revises only an existing declared own fallback without extra movement allowance',()=>{
 const{s,p,u,path}=setup();const a={mode:'signal-flash' as const,unit:u.id,route:[{x:10,y:10},{x:10,y:11}]};expect(tacticalPowerReason(s,'p1',a,path)).toMatch(/declared/);
 declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10}]},path);applyTacticalPower(s,'p1',a,path);expect(p.hero.readiness).toBe(4);s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(u.y).toBe(11);
});
it('pursuit reactions are stable by unit identity, occur once and use ordinary combat callback',()=>{
 const{s,u,enemy,path}=setup();const other=structuredClone(enemy);other.id='p2:company:9';other.x=10;other.y=9;s.units[other.id]=other;
 declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10}]},path);
 declareTacticalOrder(s,'p2',{kind:'pursuit',unit:other.id,target:u.id},path);declareTacticalOrder(s,'p2',{kind:'pursuit',unit:enemy.id,target:u.id},path);
 s.revision++;const hits:string[]=[];resolveTacticalOrders(s,path,{pursuit:a=>hits.push(a)});expect(hits).toEqual([enemy.id,other.id]);resolveTacticalOrders(s,path,{pursuit:a=>hits.push(a)});expect(hits).toHaveLength(2);
});
it('Shielded Withdrawal reduces tired trailing pursuit 25 percent while fresh or flanking troops counter it',()=>{
 const{s,u,enemy,path}=setup('elf_fingolfin');declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10}]},path);applyTacticalPower(s,'p1',{mode:'shielded-withdrawal',unit:u.id},path);declareTacticalOrder(s,'p2',{kind:'pursuit',unit:enemy.id,target:u.id},path);enemy.effects.push({kind:'fatigue',source:'ordinary-travel',value:1,until:1000000});s.revision++;
 const reductions:number[]=[];resolveTacticalOrders(s,path,{pursuit:(_a,_t,r)=>reductions.push(r)});expect(reductions).toEqual([25]);
});
it('blocked exits, forced displacement and forged routes never teleport a retreating party',()=>{
 const{s,u,path}=setup();const bad={kind:'fallback' as const,unit:u.id,route:[{x:10,y:10},{x:12,y:10}]};expect(tacticalOrderReason(s,'p1',bad,path)).toMatch(/adjacent/);
 const q=declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10}]},path);s.units['p2:company:1'].x=11;s.units['p2:company:1'].y=10;s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(u.x).toBe(10);expect(s.tacticalOrders[q.id]).toBeUndefined();
});
it('checkpoints validate physical identities and bounded route geometry',()=>{
 const{s,u,path}=setup();const q=declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10}]},path);expect(()=>validateTacticalOrders(s)).not.toThrow();if(q.kind==='fallback')q.route[1].x=99;expect(()=>validateTacticalOrders(s)).toThrow();
});
it('fresh trailing and tired flanking pursuers bypass the shield countermeasure',()=>{
 for(const flank of [false,true]){
 const{s,u,enemy,path}=setup('elf_fingolfin');if(flank){enemy.x=10;enemy.y=9;enemy.effects.push({kind:'fatigue',source:'ordinary-travel',value:1,until:1000000});}
 declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10}]},path);applyTacticalPower(s,'p1',{mode:'shielded-withdrawal',unit:u.id},path);declareTacticalOrder(s,'p2',{kind:'pursuit',unit:enemy.id,target:u.id},path);s.revision++;const amounts:number[]=[];resolveTacticalOrders(s,path,{pursuit:(_a,_b,r)=>amounts.push(r)});expect(amounts).toEqual([0]);}
});
it('opaque smoke between the hero and party blocks Signal Flash even if another scout sees the party',()=>{
 const{s,u,path}=setup();declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10}]},path);s.zones.smoke={id:'smoke',owner:'p2',kind:'smoke',x:9.5,y:10,dx:1,dy:0,radius:.2,until:s.revision+3,triggered:false};
 expect(tacticalPowerReason(s,'p1',{mode:'signal-flash',unit:u.id,route:[{x:10,y:10},{x:10,y:11}]},path)).toMatch(/signal/);
});
it('an actual pursuit wound reduces remaining movement rather than granting the old full allowance',()=>{
 const{s,u,enemy,path}=setup();declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10},{x:12,y:10},{x:13,y:10},{x:14,y:10}]},path);declareTacticalOrder(s,'p2',{kind:'pursuit',unit:enemy.id,target:u.id},path);s.revision++;
 resolveTacticalOrders(s,path,{pursuit:()=>u.effects.push({kind:'wound',source:'injury:test',value:1,until:1000000})});expect(u.x).toBe(13);
});
import {grappleMovementBlocked,grappleOccupiesHero,interruptGrappleOnDamage} from '../src/simulation/tactical-orders';
it('grapple respects existing hard-disable grace and grants two protected phases after an early release',()=>{
 const{s,enemy,hero,path}=setup('tulkas');enemy.x=10;enemy.y=10;
 enemy.effects.push({kind:'disable-grace',value:1,source:'prior-disable',until:s.revision+2});
 expect(tacticalPowerReason(s,'p1',{mode:'grapple',target:enemy.id},path)).toMatch(/grace/);
 enemy.effects=[];applyTacticalPower(s,'p1',{mode:'grapple',target:enemy.id},path);s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});
 interruptGrappleOnDamage(s,hero.id,1);const grace=enemy.effects.find(e=>e.kind==='disable-grace');expect(grace?.until).toBe(s.revision+2);
 expect(enemy.effects.filter(e=>e.kind==='disable-grace')).toHaveLength(1);
});
it('Tulkas telegraphs an adjacent hold, restrains movement for two beats and stays occupied without damage',()=>{
 const{s,p,hero,enemy,path}=setup('tulkas');enemy.x=10;enemy.y=10;const hp=enemy.hp;
 applyTacticalPower(s,'p1',{mode:'grapple',target:enemy.id},path);expect(p.hero.readiness).toBe(4);expect(grappleMovementBlocked(s,enemy.id)).toBe(false);s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(grappleMovementBlocked(s,enemy.id)).toBe(true);expect(grappleOccupiesHero(s,hero.id)).toBe(true);expect(enemy.hp).toBe(hp);
 s.revision+=2;resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(grappleMovementBlocked(s,enemy.id)).toBe(false);expect(tacticalPowerReason(s,'p1',{mode:'grapple',target:enemy.id},path)).toMatch(/once/);
});
it('Tulkas approach can be dodged and an actual hit breaks either side of the maintained hold',()=>{
 const{s,enemy,hero,path}=setup('tulkas');enemy.x=10;enemy.y=10;applyTacticalPower(s,'p1',{mode:'grapple',target:enemy.id},path);enemy.y++;s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(grappleMovementBlocked(s,enemy.id)).toBe(false);
 const next=setup('tulkas');next.enemy.x=10;next.enemy.y=10;applyTacticalPower(next.s,'p1',{mode:'grapple',target:next.enemy.id},next.path);next.s.revision++;resolveTacticalOrders(next.s,next.path,{pursuit:()=>{}});interruptGrappleOnDamage(next.s,next.hero.id,0);expect(grappleOccupiesHero(next.s,next.hero.id)).toBe(true);interruptGrappleOnDamage(next.s,next.enemy.id,1);expect(grappleOccupiesHero(next.s,next.hero.id)).toBe(false);expect(hero.alive).toBe(true);
});
it('the adopted adjacent opponent rule includes grounded heroes and great creatures without changing ownership or captivity',()=>{
 for(const kind of ['hero','drake','balrog','construct'] as const){const{s,enemy,path}=setup('tulkas');Object.assign(enemy,{x:10,y:10,kind,flying:false});const owner=enemy.owner;const heroStatus=s.players.p2.hero.status;applyTacticalPower(s,'p1',{mode:'grapple',target:enemy.id},path);s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(grappleMovementBlocked(s,enemy.id)).toBe(true);expect(enemy.owner).toBe(owner);expect(s.players.p2.hero.status).toBe(heroStatus);}
});
import {tacticalPartyBusy,tacticalAlarmReason,raiseTacticalAlarm} from '../src/simulation/tactical-orders';
it('Irmo delays an affected pursuit reaction while retaining its action and permits an ordinary alarm counter',()=>{
 const{s,u,enemy,path}=setup('irmo');const second=structuredClone(enemy);second.id='p2:company:9';second.x=10;second.y=9;s.units[second.id]=second;
 applyTacticalPower(s,'p1',{mode:'drowsing-veil',target:enemy.id},path);expect(tacticalPartyBusy(s,s.players.p1.hero.id)).toBe(false);
 declareTacticalOrder(s,'p1',{kind:'fallback',unit:u.id,route:[{x:10,y:10},{x:11,y:10}]},path);declareTacticalOrder(s,'p2',{kind:'pursuit',unit:enemy.id,target:u.id},path);declareTacticalOrder(s,'p2',{kind:'pursuit',unit:second.id,target:u.id},path);s.revision++;const hits:string[]=[];resolveTacticalOrders(s,path,{pursuit:id=>hits.push(id)});expect(hits).toEqual([second.id,enemy.id]);expect(tacticalAlarmReason(s,'p2',enemy.id,enemy.id)).toBe('');raiseTacticalAlarm(s,'p2',enemy.id,enemy.id);expect(Object.values(s.tacticalOrders).some(q=>q.kind==='drowsing')).toBe(false);
});
it('leaving Irmo fixed patch or hitting the caster defeats the prepared veil',()=>{
 for(const counter of ['move','hit']){const{s,enemy,hero,path}=setup('irmo');applyTacticalPower(s,'p1',{mode:'drowsing-veil',target:enemy.id},path);if(counter==='move')enemy.x+=2;else interruptGrappleOnDamage(s,hero.id,1);s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});expect(Object.values(s.tacticalOrders).some(q=>q.kind==='drowsing')).toBe(false);}
});
import {projectTacticalSignals} from '../src/simulation/tactical-orders';
it('guest signals expose an affected own party and patch but no hidden caster or future route',()=>{
 const{s,enemy,hero,path}=setup('irmo');applyTacticalPower(s,'p1',{mode:'drowsing-veil',target:enemy.id},path);const signals=projectTacticalSignals(s,'p2');expect(signals).toHaveLength(1);expect(signals[0].origin).toEqual({x:enemy.x,y:enemy.y});expect(JSON.stringify(signals)).not.toContain(hero.id);expect(signals[0]).not.toHaveProperty('owner');expect(signals[0]).not.toHaveProperty('route');
 const guest={...structuredClone(s),tacticalOrders:{},tacticalSignals:signals};expect(tacticalAlarmReason(guest,'p2',enemy.id,enemy.id)).toBe('');
});
it('a projected maintained hold blocks guest movement even without the private enemy order',()=>{
 const{s,enemy,path}=setup('tulkas');enemy.x=10;enemy.y=10;applyTacticalPower(s,'p1',{mode:'grapple',target:enemy.id},path);s.revision++;resolveTacticalOrders(s,path,{pursuit:()=>{}});const guest={...structuredClone(s),tacticalOrders:{},tacticalSignals:projectTacticalSignals(s,'p2')};expect(grappleMovementBlocked(guest,enemy.id)).toBe(true);
});
