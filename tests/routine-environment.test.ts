import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {inspectWorksite,progressRoutineEnvironment,recordRoutineTravel,routineSeparationPenalty,tunnelProductionPenalty,validateRoutineEnvironment,type RoutineState} from '../src/simulation/routine-environment';
function setup(profile:string){const s=createMatch([profile,'human_rohan'],3) as RoutineState,p=s.players.p1,f=s.facilities['p1:core'],base=s.units['p1:company:0'];s.units[p.hero.id]={...structuredClone(base),id:p.hero.id,kind:'hero',x:f.x,y:f.y,inventory:[],effects:[]};p.hero.status='living';return {s,p,f,h:s.units[p.hero.id],u:base};}
it('Aule inspection mitigates actual first weekly maintenance wear by one step without repairs or refunds',()=>{
 const {s,f}=setup('aule');const stock={...s.players.p1.stock};inspectWorksite(s,'p1',f.id);const hp=f.hp;progressRoutineEnvironment(s);expect(f.hp).toBe(hp-2);expect(s.players.p1.stock).toEqual(stock);progressRoutineEnvironment(s);expect(f.hp).toBe(hp-2);expect(()=>inspectWorksite(s,'p1',f.id)).toThrow(/week/);s.turn++;progressRoutineEnvironment(s);expect(f.hp).toBe(hp-6);expect(()=>validateRoutineEnvironment(s)).not.toThrow();
});
it('Gondor reduces one staffed adjacent defensive structure first wear only, never heals existing damage',()=>{
 const {s,f}=setup('human_gondor');f.hp-=20;s.facilities.second={...f,id:'second',x:f.x+1};const hp=f.hp;progressRoutineEnvironment(s);expect(f.hp).toBe(hp-3);expect(s.facilities.second.hp).toBe(hp-4);
});
it('real woodland travel harms existing vegetation less beside allied Yavanna, without erasing logging',()=>{
 const {s,h,u}=setup('yavanna');u.x=h.x+1;u.y=h.y;const from={x:u.x-1,y:u.y},to={x:u.x,y:u.y};s.map.terrain[to.y*s.map.width+to.x]='woodland';s.vegetation.tree={id:'tree',...to,mature:true,altered:true};
 recordRoutineTravel(s,u,[from,to]);expect(s.habitatWear?.tree.damage).toBe(1);expect(s.vegetation.tree.altered).toBe(true);recordRoutineTravel(s,u,[from,to]);expect(s.habitatWear?.tree.damage).toBe(1);
 h.x+=10;s.revision++;recordRoutineTravel(s,u,[from,to]);expect(s.habitatWear?.tree.damage).toBe(3);
});
it('Nessa accompanying ordinary travel reduces separation only; movement and positions remain unchanged',()=>{
 const {s,h,u}=setup('nessa');u.x=h.x+1;u.y=h.y;const route=[{x:h.x,y:h.y},{x:u.x,y:u.y}];s.map.terrain[u.y*s.map.width+u.x]='woodland';const move=u.move;recordRoutineTravel(s,u,route);expect(routineSeparationPenalty(s,u)).toBe(0);expect(u.move).toBe(move);expect(u.x).toBe(route[1].x);h.x+=10;s.revision++;recordRoutineTravel(s,u,route);expect(routineSeparationPenalty(s,u)).toBe(1);
});
it('occupied deteriorating shaft warns locally before its next ordinary queue penalty and clearing removes penalty',()=>{
 const {s,h,f}=setup('dwarf_khazad_dum');s.infrastructureSites.shaft={id:'shaft',owner:'p1',kind:'shaft',x:h.x,y:h.y,blocked:true,originalCapacity:1,material:'stone',yield:{P:0,M:0,K:0,E:0},consumed:false};
 progressRoutineEnvironment(s);expect(tunnelProductionPenalty(s,f.id)).toBe(false);expect(s.airflowWarnings?.p1).toMatchObject({site:'shaft',turn:s.turn,penaltyTurn:s.turn+1});s.turn++;progressRoutineEnvironment(s);expect(tunnelProductionPenalty(s,f.id)).toBe(true);s.infrastructureSites.shaft.blocked=false;progressRoutineEnvironment(s);expect(tunnelProductionPenalty(s,f.id)).toBe(false);expect(()=>validateRoutineEnvironment(s,'p2')).toThrow(/routine|airflow/i);
});
it('habitat wear changes mature eligibility only after real committed traversal and does not repeat within a phase',()=>{
 const {s,h,u}=setup('human_gondor');u.x=h.x+1;u.y=h.y;const route=[{x:h.x,y:h.y},{x:u.x,y:u.y}];s.map.terrain[u.y*s.map.width+u.x]='woodland';s.vegetation.tree={id:'tree',x:u.x,y:u.y,mature:true,altered:false};
 recordRoutineTravel(s,u,[route[0],{x:u.x+1,y:u.y}]);expect(s.habitatWear?.tree).toBeUndefined();recordRoutineTravel(s,u,route);expect(s.vegetation.tree.mature).toBe(true);s.revision++;recordRoutineTravel(s,u,route);expect(s.vegetation.tree).toMatchObject({mature:false,altered:true});expect(s.habitatWear?.tree.damage).toBe(4);
});
it('inspection is owned local and one per week, and save validation rejects forged dates or hidden records',()=>{
 const {s,f,h}=setup('aule');expect(()=>inspectWorksite(s,'p1','p2:core')).toThrow();h.x+=5;expect(()=>inspectWorksite(s,'p1',f.id)).toThrow();h.x-=5;inspectWorksite(s,'p1',f.id);expect(()=>validateRoutineEnvironment(structuredClone(s))).not.toThrow();expect(()=>validateRoutineEnvironment(s,'p2')).toThrow();s.routineInspections!.p1.turn++;expect(()=>validateRoutineEnvironment(s)).toThrow();
});
it('an absent tunnel hero gets no airflow warning while ordinary blockage still penalizes production',()=>{
 const {s,f,h}=setup('dwarf_khazad_dum');s.infrastructureSites.local={id:'local',owner:'p1',kind:'shaft',x:f.x,y:f.y,blocked:true,originalCapacity:1,material:'stone',yield:{P:0,M:0,K:0,E:0},consumed:false};h.x+=2;progressRoutineEnvironment(s);expect(s.airflowWarnings?.p1).toBeUndefined();expect(tunnelProductionPenalty(s,f.id)).toBe(false);s.turn++;progressRoutineEnvironment(s);expect(tunnelProductionPenalty(s,f.id)).toBe(true);expect(s.airflowWarnings?.p1).toBeUndefined();
});
