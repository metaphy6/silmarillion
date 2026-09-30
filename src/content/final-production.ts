import {stocks,type Match,type Recipe,type Item,type Unit,type Pos} from '../simulation/types';
import {activeEffects} from '../simulation/effects';
import type {Zone} from '../simulation/zones';
export const finalKeys=['small-mechanism','crafted-weapon','durable-inscription','refuge-keeper','courier','sea-ward','passage-ward','diplomacy-tools','calm-passage-charm','song-lure','boundary-ward','mobile-camp-ward','root-snare']as const;
export type FinalProductKey=typeof finalKeys[number];
export type FinalItem=Item&{finalProduct?:FinalProductKey;carried?:true};
export type FinalUnit=Unit&{finalProduct?:FinalProductKey};
interface Base{profile:string;source:string;recipe:Recipe;role:string}
export type FinalProduction=(Base&{kind:'item';item:Pick<Item,'bonus'|'attackBonus'|'materials'|'durability'|'maxDurability'>;device?:Zone['kind']})|(Base&{kind:'unit';stats:Pick<Unit,'name'|'kind'|'hp'|'maxHp'|'attack'|'armor'|'move'|'supply'|'great'|'binding'|'upkeep'|'flying'|'landed'|'loadClass'>});
/** Source gives named output identities, not ordinary powers or numbers. These
 * prices, physical kit interpretations, durability and stats are provisional. */
function gear(profile:string,key:FinalProductKey,name:string,section:string,materials:string[],M:number,K:number,bonus=0,attackBonus=0,durability=100,device?:Zone['kind']):FinalProduction{return{profile,source:`docs/design/silmarillion-game-report.md §${section}`,kind:'item',role:device?'prepared field device':'physical equipment',recipe:{id:key,name,cost:stocks(0,M,K),turns:2,facility:'workshop',access:materials,supply:0,great:0,binding:0,kind:'item',provisional:true},item:{bonus,attackBonus,materials,durability,maxDurability:durability},...(device?{device}:{})};}
function person(profile:string,key:FinalProductKey,name:string,role:string,hp:number,attack:number,armor:number,move:number):FinalProduction{return{profile,source:'docs/design/silmarillion-game-report.md §11',kind:'unit',role,recipe:{id:key,name,cost:stocks(25,15,10),turns:2,facility:'training',access:['textile'],supply:1,great:0,binding:0,kind:'unit',provisional:true},stats:{name,kind:'company',hp,maxHp:hp,attack,armor,move,supply:1,great:0,binding:0,upkeep:stocks(1),flying:false,landed:true,loadClass:'light'}};}
const products:Record<FinalProductKey,FinalProduction>={
 'small-mechanism':gear('dwarf_nogrod','small-mechanism','Small mechanisms','09',['metal'],25,10,2,0),
 'crafted-weapon':gear('dwarf_nogrod','crafted-weapon','Crafted weapons','09',['metal'],30,10,0,4),
 'durable-inscription':gear('dwarf_nogrod','durable-inscription','Durable inscriptions','09',['metal','stone'],25,15,1,0,150),
 'refuge-keeper':person('melian','refuge-keeper','Refuge keepers','refuge guard',55,6,3,3),
 courier:person('ilmare','courier','Couriers','courier',35,4,1,5),
 'sea-ward':gear('human_numenor','sea-ward','Sea wards','08',['timber','crystal'],25,15),
 'passage-ward':gear('dwarf_khazad_dum','passage-ward','Passage wards','09',['stone','metal'],20,10,0,0,100,'threshold'),
 'diplomacy-tools':gear('elf_finarfin','diplomacy-tools','Diplomacy tools','07',['textile','timber'],15,15),
 'calm-passage-charm':gear('elf_falmari','calm-passage-charm','Calm-passage charms','07',['shore','textile'],20,15),
 // Song-lure: an audible decoy induces one local hesitation; no allegiance,
 // command, damage or forced movement. All ordinary device durations are2 phases.
 'song-lure':gear('elf_sindar','song-lure','Song-lures','07',['timber','textile'],15,10,0,0,100,'threshold'),
 'boundary-ward':gear('elf_sindar','boundary-ward','Boundary wards','07',['timber','textile'],20,10,0,0,100,'web'),
 'mobile-camp-ward':gear('elf_avari','mobile-camp-ward','Mobile camp wards','07',['textile','timber'],20,10,0,0,100,'bloomscreen'),
 'root-snare':gear('elf_nandor','root-snare','Root snares','07',['grove','timber'],15,5,0,0,100,'roots'),
};
export function finalProduction(profile:string,key:string):FinalProduction|undefined{if(!Object.hasOwn(products,key))return;const q=products[key as FinalProductKey];return q?.profile===profile?structuredClone(q):undefined;}
export function finalCapabilities(s:Match,u:Unit):{courier?:true;refugeGuard?:true}|undefined{const q=(u as FinalUnit).finalProduct&&products[(u as FinalUnit).finalProduct!];if(!q||q.kind!=='unit'||s.players[u.owner]?.profile!==q.profile||u.kind!=='company'||u.flying)return;return q.role==='courier'?{courier:true}:{refugeGuard:true};}
const able=(s:Match,u:Unit)=>u.alive&&u.active&&u.supplied&&!activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind));
/** Utility bonuses require actually fitted live equipment. Merely carrying a
 * heavy piece provides no benefit. Trading never creates another recipe. */
export function finalWornItem(s:Match,u:Unit,key:FinalProductKey):FinalItem|undefined{if(!able(s,u))return;return u.inventory.map(id=>s.items[id]as FinalItem).find(i=>i?.finalProduct===key&&i.crafted&&i.owner===u.owner&&i.bearer===u.id&&!i.carried&&i.durability>0);}
export function consumeFinalItem(s:Match,u:Unit,key:FinalProductKey):boolean{const i=finalWornItem(s,u,key);if(!i)return false;i.durability--;return true;}
export function finalDeviceReason(s:Match,seat:string,unit:string,item:string,at:Pos):string{const p=s.players[seat],u=s.units[unit],i=s.items[item]as FinalItem|undefined,q=i?.finalProduct&&products[i.finalProduct];if(!p||p.eliminated||!u||u.owner!==seat||!able(s,u)||!i||!q||q.kind!=='item'||!q.device||finalWornItem(s,u,i.finalProduct!)!==i)return 'Existing fitted usable owned field device required';if(!Number.isSafeInteger(at.x)||!Number.isSafeInteger(at.y)||at.x<0||at.y<0||at.x>=s.map.width||at.y>=s.map.height||Math.abs(u.x-at.x)+Math.abs(u.y-at.y)>1||['water','cliff'].includes(s.map.terrain[at.y*s.map.width+at.x]))return 'Adjacent dry reachable deployment tile required';if(Object.values(s.facilities).some(f=>f.hp>0&&f.x===at.x&&f.y===at.y)||s.zones[`device:${item}`])return 'Existing structure or device occupies this deployment';if(q.device==='roots'&&s.map.terrain[at.y*s.map.width+at.x]!=='woodland')return 'Existing woodland roots required';return p.operations<1?'One ordinary deployment operation required':'';}
/** Consumes the SAME paid item into a short-lived local physical device. No
 * source stock, hero action, staff, free magic or new ordinary unit is created. */
export function deployFinalDevice(s:Match,seat:string,unit:string,item:string,at:Pos):void{const reason=finalDeviceReason(s,seat,unit,item,at);if(reason)throw Error(reason);const u=s.units[unit],i=s.items[item]as FinalItem,q=products[i.finalProduct!];if(q.kind!=='item'||!q.device)throw Error('Device required');s.players[seat].operations--;i.durability=0;i.bearer=null;i.x=at.x;i.y=at.y;u.inventory=u.inventory.filter(id=>id!==item);if(s.players[seat].hero.id===u.id)s.players[seat].hero.equipment=s.players[seat].hero.equipment.filter(id=>id!==item);s.zones[`device:${item}`]={id:`device:${item}`,owner:seat,kind:q.device,...at,dx:0,dy:0,radius:q.device==='bloomscreen'?1:0,until:s.revision+2,triggered:false};}
/** Parent invokes only while paying this actual courier's positive upkeep.
 * There is no relay dispatch fee to waive and this never adds Provisions. */
export function diplomacyUpkeepCost(s:Match,u:Unit,baseP:number):number{if(baseP<=0||!Object.values(s.relayMessages).some(q=>q.courier===u.id&&q.owner===u.owner&&q.phase==='travel')||!finalWornItem(s,u,'diplomacy-tools'))return baseP;return Math.max(0,baseP-1);}
export function consumeDiplomacyUpkeep(s:Match,u:Unit,baseP:number):number{const quote=diplomacyUpkeepCost(s,u,baseP);if(quote<baseP)consumeFinalItem(s,u,'diplomacy-tools');return quote;}

export function finalDeviceKind(key:string):Zone['kind']|undefined{if(!Object.hasOwn(products,key))return;const q=products[key as FinalProductKey];return q.kind==='item'?q.device:undefined;}
