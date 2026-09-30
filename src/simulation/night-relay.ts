import type {Pos} from './types';
import type {NightPatrolState} from './night-patrol';
import type {RelayState} from './relay-messages';
export type NightRelayState=NightPatrolState&RelayState;
export type NightAction=
 |{kind:'night';mode:'assign-shift';job:string}
 |{kind:'night';mode:'light-shift';shift:string;method:'lamps'|'dawn';mirror?:string}
 |{kind:'night';mode:'dawn-watch';post:string;approach:Pos[]}
 |{kind:'night';mode:'train-scout';unit:string}
 |{kind:'night';mode:'patrol';unit:string;route:Pos[];method:'ordinary'|'moon';companion?:string}
 |{kind:'night';mode:'message';report:string;courier:string;origin:string;primary:string;destination:string;route:Pos[]}
 |{kind:'night';mode:'second-signal';message:string;route:Pos[]};
export const nightPower=(a:NightAction)=>a.mode==='second-signal'||a.mode==='patrol'&&a.method==='moon'||a.mode==='light-shift'&&a.method==='dawn';
export const nightOperations=(a:NightAction)=>nightPower(a)?a.mode==='patrol'&&a.companion?1:0:1;
