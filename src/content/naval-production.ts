import {stocks,type Recipe,type Stock} from '../simulation/types';
export const navalProductionKeys=['swan-ship','expedition-ship','storm-skiff','protected-fishing-craft']as const;
export type NavalProductionKey=typeof navalProductionKeys[number];
export interface HullStatistics{hp:number;move:number;capacity:number;upkeep:Stock;draft:1|2;stormArmor:number;cargoProtection:number}
export interface NavalProduction{profile:string;source:string;recipe:Recipe;hull:HullStatistics}
/** Product names are r6 §§07,08,11; every numerical ship capability/cost below
 * is provisional. Storm protection never changes direct attack damage. */
function product(profile:string,key:NavalProductionKey,name:string,section:string,cost:Stock,turns:number,hull:HullStatistics):NavalProduction{return{profile,source:`docs/design/silmarillion-game-report.md §${section}`,recipe:{id:key,name,cost,turns,facility:'harbor',access:['timber','textile','shore'],supply:0,great:0,binding:0,kind:'vessel',provisional:true},hull};}
const products:Record<NavalProductionKey,NavalProduction>={
 'swan-ship':product('elf_falmari','swan-ship','Swan-ships','07',stocks(30,80,20),3,{hp:80,move:4,capacity:20,upkeep:stocks(2,1),draft:1,stormArmor:0,cargoProtection:0}),
 'expedition-ship':product('human_numenor','expedition-ship','Expedition Ships','08',stocks(40,100,25),4,{hp:120,move:3,capacity:40,upkeep:stocks(3,2),draft:2,stormArmor:0,cargoProtection:0}),
 'storm-skiff':product('osse','storm-skiff','Storm skiffs','11',stocks(25,50,15),3,{hp:60,move:4,capacity:10,upkeep:stocks(2,1),draft:1,stormArmor:2,cargoProtection:0}),
 'protected-fishing-craft':product('uinen','protected-fishing-craft','Protected fishing craft','11',stocks(25,60,20),3,{hp:70,move:2,capacity:15,upkeep:stocks(2,1),draft:1,stormArmor:1,cargoProtection:2}),
};
export function navalProduction(profile:string,key:string):NavalProduction|undefined{const q=products[key as NavalProductionKey];return q?.profile===profile?structuredClone(q):undefined;}
export function hullStatistics(profile:string,key?:NavalProductionKey):HullStatistics|undefined{return key?navalProduction(profile,key)?.hull:{hp:80,move:3,capacity:20,upkeep:stocks(2,1),draft:1,stormArmor:0,cargoProtection:0};}
