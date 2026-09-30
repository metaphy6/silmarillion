import type {Match,Item,Unit} from './types';
import {activeEffects} from './effects';
/** Source: docs/design/hero-balance-roster.md, Shoulder the Load: one existing
 * heavy piece, occupied carrying capacity, no sprint and no supply-ceiling gain.
 * Physical worker porters and numeric load/walk limits below are provisional. */
export type HeavyItem=Item&{heavy?:true;carried?:true};
export type HeavyAction={kind:'carry-heavy';item:string;carrier:string}|{kind:'drop-heavy';item:string};
const able=(s:Match,u:Unit|undefined)=>!!u?.alive&&u.active&&u.supplied&&u.hp>0&&!activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind));
const d=(a:{x:number;y:number},b:{x:number;y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const loaded=(s:Match,u:Unit)=>(Object.values(s.items)as HeavyItem[]).filter(i=>i.heavy&&i.carried&&i.bearer===u.id);
/** One heavy item consumes10 of the ordinary20 transport load units. This is
 * explicit provisional physical handling tuning, never extra faction supply. */
export const heavyLoad=(s:Match,u:Unit)=>loaded(s,u).length*10;
export const heavyCargoCapacity=(s:Match,u:Unit,capacity:number)=>Math.max(0,capacity-heavyLoad(s,u));
/** An ordinary carried load uses one movement point per action (provisional), never sprint or
 * extra movement granted by a rapid-march ability. No free porter movement. */
export const heavyMovementLimit=(s:Match,u:Unit)=>heavyLoad(s,u)>0?1:Infinity;
export const heavySprintReason=(s:Match,u:Unit)=>heavyLoad(s,u)>0?'Heavy equipment prevents sprinting; ordinary carrying movement only':'';
export function heavyCarryReason(s:Match,owner:string,item:string,carrier:string):string{
 const p=s.players[owner],u=s.units[carrier],i=s.items[item]as HeavyItem|undefined;
 if(!p||p.eliminated||!able(s,u)||u.owner!==owner)return 'Own supplied active carrier required';
 if(u.kind!=='worker'&&!(p.profile==='troll_hold'&&p.hero.status==='living'&&u.id===p.hero.id&&u.kind==='hero'))return 'A real worker porter is required; Troll hero may carry personally';
 if(!i?.heavy||!i.crafted||i.owner!==owner||i.bearer||d(u,i)>1)return 'Adjacent existing own uncarried heavy equipment required';
 if(loaded(s,u).length||u.inventory.length)return 'Carrier may hold only one equipment piece';
 if(Object.values(s.convoys).some(q=>q.carrier===carrier&&q.phase!=='lost')||Object.values(s.civilianJobs).some(q=>q.carrier===carrier&&q.phase==='travel')||Object.values(s.vessels).some(q=>q.phase!=='wreck'&&(q.crew===carrier||q.passenger===carrier||q.aboardHero===carrier)))return 'Finish existing cargo or vessel assignment before heavy pickup';
 return p.operations<1?'One ordinary pickup operation required':'';
}
/** Physical pickup only. Carried items must be excluded by equipment wear/stat
 * routines until a separate ordinary equip action removes the carried flag. */
export function carryHeavy(s:Match,owner:string,item:string,carrier:string):void{
 const reason=heavyCarryReason(s,owner,item,carrier);if(reason)throw new Error(reason);const i=s.items[item]as HeavyItem,u=s.units[carrier];s.players[owner].operations--;i.bearer=carrier;i.carried=true;u.inventory.push(item);if(u.kind==='hero')s.players[owner].hero.equipment.push(item);
}
export function heavyDropReason(s:Match,owner:string,item:string):string{
 const p=s.players[owner],i=s.items[item]as HeavyItem|undefined,u=i?.bearer?s.units[i.bearer]:undefined;
 if(!p||!i?.heavy||!i.carried||i.owner!==owner||!u||u.owner!==owner||!able(s,u))return 'Own physically carried heavy item required';
 return p.operations<1?'One ordinary put-down operation required':'';
}
export function dropHeavy(s:Match,owner:string,item:string):void{
 const reason=heavyDropReason(s,owner,item);if(reason)throw new Error(reason);const i=s.items[item]as HeavyItem,u=s.units[i.bearer!];s.players[owner].operations--;i.x=u.x;i.y=u.y;i.bearer=null;delete i.carried;u.inventory=u.inventory.filter(id=>id!==item);if(u.kind==='hero')s.players[owner].hero.equipment=s.players[owner].hero.equipment.filter(id=>id!==item);
}
/** Death/drop housekeeping preserves the same item, never grants armor or stock.
 * Existing general death handling may already have cleared its bearer. */
export function settleHeavyEquipment(s:Match):void{
 for(const i of Object.values(s.items)as HeavyItem[]){if(!i.carried)continue;const u=i.bearer?s.units[i.bearer]:undefined;if(!i.bearer){delete i.carried;continue;}if(u&&!u.alive){i.x=u.x;i.y=u.y;i.bearer=null;delete i.carried;u.inventory=u.inventory.filter(id=>id!==i.id);}}
}
export function validateHeavyEquipment(s:Match,guestSeat?:string):void{
 const bearers=new Set<string>();
 for(const i of Object.values(s.items)as HeavyItem[]){
  if(i.carried&&!i.heavy)throw new Error('Invalid carried heavy equipment flag');if(!i.heavy)continue;
  if(!i.crafted)throw new Error('Heavy equipment must have a normal crafted producer');
  if(!i.bearer){if(i.carried)throw new Error('Carried heavy equipment lacks physical bearer');continue;}
  const u=s.units[i.bearer];if(!u&&guestSeat)continue;
  if(!u||!u.alive||i.owner!==u.owner||!u.inventory.includes(i.id)||(i.carried&&bearers.has(u.id)))throw new Error('Invalid physical heavy equipment load');if(i.carried)bearers.add(u.id);
  if(i.carried&&u.kind!=='worker'&&!(s.players[u.owner]?.profile==='troll_hold'&&u.id===s.players[u.owner].hero.id&&u.kind==='hero'))throw new Error('Heavy equipment needs actual ordinary porter or Troll hero');
 }
}
