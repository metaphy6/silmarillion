import {militaryCapabilities} from "../content/military-production";
import { stocks, type Match, type Unit } from './types';
import { activeEffects } from './effects';

export interface SiegeMagazine { ammunition:number; capacity:3 }
export type SiegeUnit = Unit & { siege?:SiegeMagazine };
/** Revision6 sections06a/08 authorize ordinary Gondor/Saruman siege engines.
 * All ordinary recipe, ammunition and combat numbers below are provisional
 * runtime tuning, not adopted hero-power prices or a balance claim. */
export const siegeRecipe = {
 profiles:['human_gondor','istari_saruman'],
 cost:stocks(40,45,10),turns:4,facility:'workshop',crew:true,
 kind:'company' as const,heavy:true,maxHp:90,armor:3,attack:20,move:2,
 supply:3,upkeep:stocks(2,1),capacity:3 as const,
 reloadCost:stocks(5,10),provisional:true,
};
/** Metadata is produced only by the authorized recipe, never from an action's
 * claim to be siege. Owner profile alone does not classify ordinary infantry. */
export function isOrdinarySiege(s:Match,u:SiegeUnit):boolean {
 return u.kind==='company'&&!!u.siege&&(siegeRecipe.profiles.includes(s.players[u.owner]?.profile)||militaryCapabilities(s,u)?.magazine===3)&&u.siege.capacity===3&&Number.isSafeInteger(u.siege.ammunition)&&u.siege.ammunition>=0&&u.siege.ammunition<=3;
}
export function siegeAttackReason(s:Match,u:SiegeUnit):string {
 if(!isOrdinarySiege(s,u))return 'Authorized ordinary siege company required';
 if(!u.alive||u.hp<=0||!u.active||!u.supplied||activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind)))return 'Living active supplied siege crew required';
 return u.siege!.ammunition>0?'':'Existing siege ammunition required';
}
/** Call exactly once for an executed ordinary attack, including a miss, after
 * target/range/cover legality; never for previews, rejected orders or powers. */
export function consumeSiegeShot(s:Match,u:SiegeUnit):void {
 const reason=siegeAttackReason(s,u);if(reason)throw new Error(reason);
 u.siege!.ammunition--;
}
export function siegeReloadReason(s:Match,seat:string,unit:string,facility:string):string {
 const p=s.players[seat],u=s.units[unit] as SiegeUnit|undefined,f=s.facilities[facility];
 if(!p||p.eliminated||!u||u.owner!==seat||!isOrdinarySiege(s,u)||!u.alive||u.hp<=0||!u.active||!u.supplied||activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind)))return 'Own living active supplied ordinary siege company required';
 if(!f||f.owner!==seat||f.hp<=0||f.workers<1||!['depot','workshop'].includes(f.kind)||Math.abs(u.x-f.x)+Math.abs(u.y-f.y)>1)return 'Adjacent owned staffed depot or workshop worksite required';
 if(u.siege!.ammunition===3)return 'Siege magazine already full';
 if(p.operations<1)return 'One ordinary operation required';
 if(p.stock.P<5||p.stock.M<10)return 'Five Provisions and ten Materials required';
 return '';
}
/** One paid normal equipment action fills the existing magazine, even when
 * partially loaded. It neither creates a machine nor restores durability. */
export function reloadSiege(s:Match,seat:string,unit:string,facility:string):void {
 const reason=siegeReloadReason(s,seat,unit,facility);if(reason)throw new Error(reason);
 const p=s.players[seat];p.stock.P-=5;p.stock.M-=10;p.operations--;
 (s.units[unit] as SiegeUnit).siege!.ammunition=3;
}
export function validateSiege(s:Match):void {
 for(const u of Object.values(s.units) as SiegeUnit[])if(u.siege&&!isOrdinarySiege(s,u))throw new Error('Invalid ordinary siege magazine or production identity');
}
