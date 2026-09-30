import type {Match,Pos} from './types';
import type {CivilianJob} from './civilians';
import {activeEffects} from './effects';
import {fatigue} from './fatigue';
const d=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
/** Public provisional sandbox weather schedule: every fourth week is rainy on
 * dry terrain. Derived from the authored simulation clock, not a hidden roll or
 * duplicate weather map. Sea wave/fog conditions remain their separate domain. */
export const civilianWeatherLabel=(s:Match)=>s.turn%4===0?'Rain: civilian journeys gain one fatigue; next three weeks dry.':'Dry: next rain in '+(4-s.turn%4)+' week(s).';
export const civilianRainAt=(s:Match,p:Pos)=>s.turn%4===0&&p.x>=0&&p.y>=0&&p.x<s.map.width&&p.y<s.map.height&&!['water','cliff'].includes(s.map.terrain[p.y*s.map.width+p.x]);
/** Ordinary committed civilian journey hook before arrival escrow closes.
 * Does not replace travel fees, time, load, normal movement or combat fatigue. */
export function applyCivilianRain(s:Match,j:CivilianJob,route:Pos[]):void{
 const u=s.units[j.carrier];if(j.phase!=='travel'||!u?.alive||!u.active||!u.supplied||route.length<2||d(u,route.at(-1)!)!==0||!route.slice(1).some(p=>civilianRainAt(s,p)))return;
 const p=s.players[j.owner],h=p&&s.units[p.hero.id],marker=`rain:${s.turn}`;
 if(p?.profile==='hobbit_shire'&&p.hero.status==='living'&&h?.alive&&h.active&&h.supplied&&!activeEffects(s,h).some(e=>['stunned','incapacitated'].includes(e.kind))&&d(h,route[0])<=1&&d(h,u)<=1&&!h.effects.some(e=>e.kind==='packed-rain-used'&&e.source===marker)){
  h.effects=h.effects.filter(e=>e.kind!=='packed-rain-used');h.effects.push({kind:'packed-rain-used',value:1,until:1000000,source:marker});return;
 }
 const value=Math.min(6,fatigue(s,u)+1);u.effects=u.effects.filter(e=>e.kind!=='fatigue');u.effects.push({kind:'fatigue',value,until:1000000,source:'ordinary-rain-travel'});
}
