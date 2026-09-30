import type {Match,Stock,Unit} from './types';
import {activeEffects} from './effects';
export interface WarbandAgreement{id:string;owner:string;unit:string;reward:Stock;created:number;due:number;participated:boolean;status:'agreed'|'paid'|'defaulted';paidTurn?:number}
export type RewardState=Match&{warbandAgreements?:Record<string,WarbandAgreement>};
export type RewardAction={kind:'agree-reward';unit:string;reward:Stock;due:number}|{kind:'pay-reward';unit:string;facility:string};
const keys=['P','M','K','E']as const;
const validReward=(r:Stock)=>r&&Object.keys(r).sort().join(',')==='E,K,M,P'&&keys.every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)&&keys.reduce((n,k)=>n+r[k],0)>0&&keys.reduce((n,k)=>n+r[k],0)<=100;
const able=(s:Match,u:Unit|undefined)=>!!u?.alive&&u.active&&u.supplied&&u.hp>0&&!activeEffects(s,u).some(e=>['stunned','incapacitated','rout'].includes(e.kind));
const d=(a:Unit,b:{x:number;y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function agreeWarbandRewardReason(s:RewardState,owner:string,unit:string,reward:Stock,due:number):string{
 const p=s.players[owner],u=s.units[unit];if(!p||p.profile!=='orc_fortress_clan'||!able(s,u)||u.owner!==owner||u.kind!=='company'||u.siege)return 'Own supplied ordinary Orc warband required';
 if(s.warbandAgreements?.[unit]?.status==='agreed')return 'Warband already has an unresolved agreement';
 if(!validReward(reward)||!Number.isSafeInteger(due)||due<s.turn||due>s.turn+4)return 'Positive finite reward and due week within four weeks required';
 return p.operations<1?'One ordinary agreement operation required':'';
}
/** Provisional ordinary admin action: one operation, finite agreed reward up to
 *100 stock, deadline at most4weeks. No escrow, free wealth or retrospective
 * participation. Each new agreement requires a new real attack event. */
export function agreeWarbandReward(s:RewardState,owner:string,unit:string,reward:Stock,due:number):void{
 const reason=agreeWarbandRewardReason(s,owner,unit,reward,due);if(reason)throw new Error(reason);s.warbandAgreements??={};s.players[owner].operations--;s.warbandAgreements[unit]={id:`reward:${s.nextId++}`,owner,unit,reward:{...reward},created:s.turn,due,participated:false,status:'agreed'};
}
/** Invoke only on an actual ordinary warband attack attempt (including miss),
 * never a preview, rejected command, hero attack or passive trigger. */
export function recordWarbandParticipation(s:RewardState,u:Unit):void{const q=s.warbandAgreements?.[u.id];if(s.units[u.id]===u&&q?.status==='agreed'&&q.owner===u.owner&&u.kind==='company'&&u.alive)q.participated=true;}
function dispute(s:Match,u:Unit):void{const e=activeEffects(s,u).find(e=>e.kind==='cohesion-loss');if(e)e.value++;else u.effects.push({kind:'cohesion-loss',value:1,until:1000000,source:`morale:${s.turn}`});}
export function payWarbandRewardReason(s:RewardState,owner:string,unit:string,facility:string):string{
 const p=s.players[owner],u=s.units[unit],f=s.facilities[facility],q=s.warbandAgreements?.[unit];
 if(!p||!q||q.owner!==owner||q.status!=='agreed'||!q.participated||!able(s,u)||u.owner!==owner||u.kind!=='company')return 'Existing unpaid participating warband agreement required';
 if(s.turn>q.due)return 'Agreement is overdue; ordinary dispute must settle';
 if(!f||f.owner!==owner||f.hp<=0||f.workers<1||!['core','depot'].includes(f.kind)||d(u,f)>1)return 'Local owned staffed core or depot payout required';
 if(p.operations<1)return 'One ordinary distribution operation required';
 return keys.some(k=>p.stock[k]<q.reward[k])?'Full agreed reward stocks required':'';
}
/** Ordinary paid distribution has provisional1step division friction. A living
 * nearby Orc hero prevents only its first timely participating distribution/week.
 * Previously accumulated cohesion and council grievances are never erased. */
export function payWarbandReward(s:RewardState,owner:string,unit:string,facility:string):void{
 const reason=payWarbandRewardReason(s,owner,unit,facility);if(reason)throw new Error(reason);const q=s.warbandAgreements![unit],p=s.players[owner],u=s.units[unit],h=s.units[p.hero.id];
 for(const k of keys)p.stock[k]-=q.reward[k];p.operations--;q.status='paid';q.paidTurn=s.turn;
 const marker=`reward:${s.turn}`;
 if(p.profile==='orc_fortress_clan'&&p.hero.status==='living'&&able(s,h)&&d(h,u)<=1&&!h.effects.some(e=>e.kind==='declared-shares-used'&&e.source===marker)){h.effects=h.effects.filter(e=>e.kind!=='declared-shares-used');h.effects.push({kind:'declared-shares-used',value:1,until:1000000,source:marker});}else dispute(s,u);
}
export function progressWarbandRewards(s:RewardState):void{
 for(const q of Object.values(s.warbandAgreements??{}))if(q.status==='agreed'&&s.turn>q.due){q.status='defaulted';const u=s.units[q.unit];if(q.participated&&u?.alive&&u.owner===q.owner)dispute(s,u);}
}
export function validateWarbandRewards(s:RewardState,guestSeat?:string):void{
 for(const[id,q]of Object.entries(s.warbandAgreements??{}))if(id!==q.unit||!q.id||s.players[q.owner]?.profile!=='orc_fortress_clan'||!validReward(q.reward)||!Number.isSafeInteger(q.created)||q.created<1||q.created>s.turn||!Number.isSafeInteger(q.due)||q.due<q.created||q.due>q.created+4||typeof q.participated!=='boolean'||!['agreed','paid','defaulted'].includes(q.status)||(q.status==='paid'&&(!q.participated||!Number.isSafeInteger(q.paidTurn)||q.paidTurn!<q.created||q.paidTurn!>q.due||q.paidTurn!>s.turn))||(q.status!=='paid'&&q.paidTurn!==undefined)||(q.status==='defaulted'&&s.turn<=q.due)||(!guestSeat&&!s.units[q.unit])||(guestSeat&&q.owner!==guestSeat))throw new Error('Invalid finite warband reward agreement');
}
