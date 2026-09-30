import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {startInfrastructureWork} from '../src/simulation/infrastructure-work';
import {initializeNight,assignDarkShift,illuminateShift,shiftCanWork,markShiftWorked,selectDawnWatch,recordDawnMovement,advanceNightRegions,type NightWorkState} from '../src/simulation/night-work';
it('only the explicit paid existing dark shift uses source illumination and can advance once',()=>{
 const s=createMatch(['arien','human_gondor'],1) as NightWorkState;s.nightRegions={};s.darkShifts={};s.dawnWatches={};s.dawnReports={};initializeNight(s);
 const p=s.players.p1,u=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!,f=s.facilities['p1:core'];u.x=f.x;u.y=f.y;p.stock={P:500,M:500,K:500,E:500};s.units[p.hero.id]={...structuredClone(u),id:p.hero.id,kind:'hero'};p.hero.status='living';p.hero.readiness=6;
 const site=Object.values(s.infrastructureSites).find(q=>q.owner==='p1'&&q.kind==='haulway')!;u.x=site.x;u.y=site.y;const route=(_s:unknown,a:{x:number;y:number},b:{x:number;y:number})=>[a,b];const job=startInfrastructureWork(s,'p1',{site:site.id,worker:u.id,facility:f.id},route).id;
 const shift=assignDarkShift(s,'p1',job);expect(shiftCanWork(s,job)).toBe(false);s.facilities.mirror={...f,id:'mirror',kind:'mirror-station',x:site.x,y:site.y};const before={...p.stock};illuminateShift(s,'p1',shift,'dawn','mirror',()=>true);expect(p.stock.M).toBe(before.M-10);expect(p.stock.K).toBe(before.K-5);expect(p.hero.readiness).toBe(3);expect(shiftCanWork(s,job)).toBe(true);s.facilities.mirror.hp=0;expect(shiftCanWork(s,job)).toBe(false);s.facilities.mirror.hp=f.hp;markShiftWorked(s,job);expect(shiftCanWork(s,job)).toBe(false);
});
it('an occupied real dawn watch records direction only',()=>{
 const s=createMatch(['arien','human_gondor'],2) as NightWorkState;s.nightRegions={};s.darkShifts={};s.dawnWatches={};s.dawnReports={};initializeNight(s);advanceNightRegions(s);const p=s.players.p1,f=s.facilities['p1:core'],u=Object.values(s.units).find(u=>u.owner==='p2'&&u.kind==='company')!;s.facilities.watch={...f,id:'watch',kind:'dawn-watch'};const h=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;s.units[p.hero.id]={...structuredClone(h),id:p.hero.id,kind:'hero'};p.hero.status='living';selectDawnWatch(s,'p1','watch',[{x:f.x-1,y:f.y},{x:f.x-2,y:f.y}]);u.x=f.x-2;u.y=f.y;recordDawnMovement(s,u,[{x:f.x-1,y:f.y},{x:f.x-2,y:f.y}]);expect(Object.values(s.dawnReports)[0]).toMatchObject({direction:'west'});expect(JSON.stringify(s.dawnReports)).not.toContain(u.id);
});
