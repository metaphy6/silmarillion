import {stocks,type Match,type Recipe,type Unit} from '../simulation/types';
import {effectiveRelation} from '../simulation/diplomacy';
/** Exact products/buildings: silmarillion-game-report.md §10. All numbers and
 * capability tuning here are provisional ordinary production, not hero powers. */
export const secondaryKeys=['rescue-flight','pack-runner','venom-stalker','troll-siege-crew'] as const;
export type SecondaryKey=typeof secondaryKeys[number];
export type SecondaryUnit=Unit&{secondary?:SecondaryKey};
export interface SecondaryCapabilities{rescuePassengers?:1;convoyCapacity?:20;venom?:2;structuralAttackBonus?:4}
export interface SecondaryProduction{profile:string;source:string;recipe:Recipe;stats:Pick<Unit,'name'|'kind'|'hp'|'maxHp'|'attack'|'armor'|'move'|'supply'|'great'|'binding'|'upkeep'|'flying'|'landed'|'loadClass'>;capabilities:SecondaryCapabilities}
function entry(profile:string,key:SecondaryKey,name:string,cost:ReturnType<typeof stocks>,turns:number,access:string[],hp:number,attack:number,armor:number,move:number,supply:number,upkeep:ReturnType<typeof stocks>,capabilities:SecondaryCapabilities):SecondaryProduction{return{profile,source:'docs/design/silmarillion-game-report.md §10',recipe:{id:key,name,cost,turns,facility:'workshop',access,supply,great:0,binding:0,kind:'unit',provisional:true},stats:{name,kind:profile==='troll_hold'?'company':'beast',hp,maxHp:hp,attack,armor,move,supply,great:0,binding:0,upkeep,flying:profile==='eagle_eyrie',landed:true,loadClass:profile==='wolf_pack'?'light':'large'},capabilities};}
const products:Record<SecondaryKey,SecondaryProduction>={
 'rescue-flight':entry('eagle_eyrie','rescue-flight','Rescue Flights',stocks(50,25,10),3,['eyrie','textile'],50,6,1,5,3,stocks(3),{rescuePassengers:1}),
 'pack-runner':entry('wolf_pack','pack-runner','Runners',stocks(35,5,5),2,['hunting'],40,8,0,6,2,stocks(2),{convoyCapacity:20}),
 'venom-stalker':entry('spider_brood','venom-stalker','Venom Stalkers',stocks(50,10,10),3,['silk','hunting'],45,10,1,4,3,stocks(3),{venom:2}),
 'troll-siege-crew':entry('troll_hold','troll-siege-crew','Siege Crews',stocks(50,50,10),4,['stone','metal','timber'],100,16,3,2,3,stocks(3,1),{structuralAttackBonus:4}),
};
export function secondaryProduction(profile:string,key:string):SecondaryProduction|undefined{const q=products[key as SecondaryKey];return q?.profile===profile?structuredClone(q):undefined;}
/** Trust explicit producer metadata and matching owner/class, never a renamed unit.
 * Parent save validator calls this for every present secondary marker. */
export function secondaryCapabilities(s:Match,u:Unit):SecondaryCapabilities|undefined{const key=(u as SecondaryUnit).secondary,p=s.players[u.owner],q=key&&products[key];return q&&p?.profile===q.profile&&u.kind===q.stats.kind&&u.flying===q.stats.flying?q.capabilities:undefined;}
/** Trusted post-hit hook: only ordinary successful adjacent hostile attacks.
 * Poison refreshes rather than stacking, is curable by existing Radagast care,
 * and never applies to constructs or dead targets. */
export function secondaryVenomHit(s:Match,attacker:Unit,target:Unit,hit:number):void{
 if(!secondaryCapabilities(s,attacker)?.venom||!attacker.alive||!attacker.active||!attacker.supplied||!Number.isFinite(hit)||hit<=0||!target.alive||target.hp<=0||target.kind==='construct'||Math.abs(attacker.x-target.x)+Math.abs(attacker.y-target.y)>1||effectiveRelation(s,attacker.owner,target.owner)!=='war')return;
 target.effects=target.effects.filter(e=>e.kind!=='poison');target.effects.push({kind:'poison',value:2,until:s.revision+2,source:`ordinary-venom:${s.revision}`});
}
/** Call once after each tactical revision increment, BEFORE generic effect expiry.
 * Two nonlethal 2HP ticks are provisional; idempotent within each revision. */
export function progressSecondaryVenom(s:Match):void{for(const u of Object.values(s.units)){const poison=u.effects.find(e=>e.kind==='poison'&&e.source.startsWith('ordinary-venom:'));if(!poison)continue;const born=Number(poison.source.slice('ordinary-venom:'.length));if(!Number.isSafeInteger(born)||s.revision<=born)continue;if(s.revision>poison.until){u.effects=u.effects.filter(e=>e!==poison);continue;}if(u.alive&&u.hp>0&&u.kind!=='construct'&&!u.effects.some(e=>e.kind==='venom-tick'&&e.source===String(s.revision))){u.hp=Math.max(1,u.hp-poison.value);u.effects=u.effects.filter(e=>e.kind!=='venom-tick');u.effects.push({kind:'venom-tick',value:1,until:s.revision+1,source:String(s.revision)});}if(s.revision===poison.until)u.effects=u.effects.filter(e=>e!==poison);}}
