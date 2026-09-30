import {stocks,type Match,type Recipe,type Unit} from '../simulation/types';
/** Exact output identities: r6 §§06,06a,09,11. Numerical recipes, stats,
 * capacities and ordinary equipment benefits are explicitly provisional. */
export const militaryKeys=['werewolves','sauron-siege','woodland-defenders','hunters','ward-breaker-tools','wardstones','wolf-riders','crude-artillery','patrol-riders','banner-guards','eonwe-siege-crews','current-guides']as const;
export type MilitaryKey=typeof militaryKeys[number];
export type MilitaryUnit=Unit&{military?:MilitaryKey};
export interface MilitaryCapabilities{magazine?:3;rangedRange?:4;trainedMounts?:{species:'wolf'|'horse';count:12};structuralAttackBonus?:4;wardAnchorBonus?:2;currentHandling?:1}
type Stats=Pick<Unit,'name'|'kind'|'hp'|'maxHp'|'attack'|'armor'|'move'|'supply'|'great'|'binding'|'upkeep'|'flying'|'landed'|'loadClass'>;
interface Base{profile:string;source:string;recipe:Recipe;capabilities:MilitaryCapabilities}
export type MilitaryProduction=(Base&{kind:'unit';stats:Stats})|(Base&{kind:'item';item:{bonus:number;attackBonus:number;materials:string[];durability:100;service:'wardstone'|'ward-breaker'}});
function unit(profile:string,key:MilitaryKey,name:string,section:string,cost:ReturnType<typeof stocks>,turns:number,facility:string,access:string[],hp:number,attack:number,armor:number,move:number,supply:number,kind:'company'|'beast'='company',capabilities:MilitaryCapabilities={}):MilitaryProduction{return{profile,source:`docs/design/silmarillion-game-report.md §${section}`,kind:'unit',recipe:{id:key,name,cost,turns,facility,access,supply,great:0,binding:0,kind:'unit',provisional:true},stats:{name,kind,hp,maxHp:hp,attack,armor,move,supply,great:0,binding:0,upkeep:stocks(supply,capabilities.magazine?1:0),flying:false,landed:true,loadClass:kind==='beast'||capabilities.magazine?'large':'standard'},capabilities};}
function item(profile:string,key:MilitaryKey,name:string,cost:ReturnType<typeof stocks>,materials:string[],bonus:number,attackBonus:number,service:'wardstone'|'ward-breaker',capabilities:MilitaryCapabilities={}):MilitaryProduction{return{profile,source:'docs/design/silmarillion-game-report.md §06a',kind:'item',recipe:{id:key,name,cost,turns:2,facility:'workshop',access:materials,supply:0,great:0,binding:0,kind:'item',provisional:true},item:{bonus,attackBonus,materials,durability:100,service},capabilities};}
const products:Record<MilitaryKey,MilitaryProduction>={
 werewolves:unit('sauron','werewolves','Werewolves','06',stocks(55,15,10,10),4,'pens',['hunting'],70,17,1,5,3,'beast'),
 'sauron-siege':unit('sauron','sauron-siege','Siege equipment','06',stocks(40,55,10),4,'workshop',['timber','metal'],90,20,3,2,3,'company',{magazine:3,rangedRange:4}),
 'woodland-defenders':unit('istari_radagast','woodland-defenders','Woodland defenders','06a',stocks(30,25,10),3,'training',['grove','timber'],60,11,3,3,2),
 hunters:unit('istari_alatar','hunters','Hunters','06a',stocks(30,20,10),2,'training',['timber'],45,12,1,4,1),
 'ward-breaker-tools':item('istari_pallando','ward-breaker-tools','Ward-breaker tools',stocks(0,25,15),['metal','crystal'],0,1,'ward-breaker',{wardAnchorBonus:2}),
 wardstones:item('istari_gandalf','wardstones','Wardstones',stocks(0,20,15),['stone'],1,0,'wardstone'),
 // Full four-week queue includes existing wolf recruitment/training and riders.
 // The twelve-mount lot is created ONCE on completion, never on ability use.
 'wolf-riders':unit('orc_fortress_clan','wolf-riders','Wolf riders','09',stocks(65,25,10),4,'pens',['hunting','metal'],55,14,2,6,3,'company',{trainedMounts:{species:'wolf',count:12}}),
 'crude-artillery':unit('orc_fortress_clan','crude-artillery','Crude artillery','09',stocks(40,45,5),4,'workshop',['timber','metal'],65,18,2,2,3,'company',{magazine:3,rangedRange:4}),
 'patrol-riders':unit('tilion','patrol-riders','Patrol riders','11',stocks(50,25,10),3,'training',['pasture','metal'],50,11,2,6,2,'company',{trainedMounts:{species:'horse',count:12}}),
 'banner-guards':unit('eonwe','banner-guards','Banner guards','11',stocks(35,30,10),3,'training',['metal','textile'],70,13,4,3,2),
 'eonwe-siege-crews':unit('eonwe','eonwe-siege-crews','Siege crews','11',stocks(45,45,10),4,'workshop',['timber','metal'],80,16,3,2,3,'company',{structuralAttackBonus:4}),
 'current-guides':unit('uinen','current-guides','Current guides','11',stocks(30,15,15),3,'training',['shore'],40,6,1,4,1,'company',{currentHandling:1}),
};
export function militaryProduction(profile:string,key:string):MilitaryProduction|undefined{const q=products[key as MilitaryKey];return q?.profile===profile?structuredClone(q):undefined;}
/** Item tags are consumed by physical equipment handling separately; a named
 * unit can never acquire weapon/mount permissions without exact recipe metadata. */
export function militaryCapabilities(s:Match,u:Unit):MilitaryCapabilities|undefined{const key=(u as MilitaryUnit).military,q=key&&products[key];return q&&q.kind==='unit'&&s.players[u.owner]?.profile===q.profile&&u.kind===q.stats.kind&&!u.flying?structuredClone(q.capabilities):undefined;}
