import type {Match,Pos,Facility} from './types';
export interface WorksiteSupport {id:string;owner:string;profile:'namo'|'istari_ember';site:string;refuge:string;route:Pos[];prepared:number;until:number;staff:number;used:boolean}
export interface WorksiteRequest {site:string;refuge:string;route:Pos[]}
export type WorksiteState=Match&{worksiteSupports:Record<string,WorksiteSupport>};
export interface WorksiteChecks {
 connected:(a:Pos,b:Pos)=>boolean;
 /** Must validate surveyed, currently traversable route and hostile occupation. */
 openRoute:(seat:string,route:Pos[])=>boolean;
 /** True only for observed direct hostile approach, never concealed infiltration. */
 observedApproach:(seat:string,site:Facility)=>boolean;
}
const distance=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function routeReason(s:WorksiteState,seat:string,a:WorksiteRequest,checks:WorksiteChecks){const f=s.facilities[a.site],r=s.facilities[a.refuge];if(!f||!r||f.id===r.id||f.owner!==seat||r.owner!==seat||f.hp<=0||r.hp<=0||r.kind!=='refuge')return 'Existing owned worksite and surviving refuge required';if(a.route.length<2||a.route.length>9||distance(a.route[0],f)!==0||distance(a.route.at(-1)!,r)!==0||a.route.some((p,i)=>!Number.isSafeInteger(p.x)||!Number.isSafeInteger(p.y)||p.x<0||p.y<0||p.x>=s.map.width||p.y>=s.map.height||(i>0&&distance(p,a.route[i-1])!==1))||!checks.openRoute(seat,a.route))return 'Surveyed open adjacent route to nearby refuge required';return '';}
export function worksiteSupportReason(s:WorksiteState,seat:string,a:WorksiteRequest,checks:WorksiteChecks){const p=s.players[seat],h=p&&s.units[p.hero.id],f=s.facilities[a.site];if(!p||!['namo','istari_ember'].includes(p.profile)||p.hero.status!=='living'||!h?.alive||!h.active||p.hero.readiness<3||p.commitment<1)return 'Living supported hero, three readiness and personal commitment required';const route=routeReason(s,seat,a,checks);if(route)return route;if(!f.workers||!checks.connected(h,f))return 'Existing staffed site in the hero connected region required';if(Object.values(s.worksiteSupports).some(q=>q.site===f.id&&q.until>=s.turn&&!q.used))return 'Site already has a prepared evacuation';if(p.profile==='istari_ember'&&(p.stock.P<10||p.stock.M<10))return 'Refuge Shift requires 10P and 10M';return '';}
/** Parent consumes the weekly hero commitment through the shared command budget.
 * Eight route edges is provisional nearby scale. Facility staff are conserved,
 * never converted into newly spawned worker entities or remote production. */
export function prepareWorksiteSupport(s:WorksiteState,seat:string,a:WorksiteRequest,checks:WorksiteChecks){const reason=worksiteSupportReason(s,seat,a,checks);if(reason)throw new Error(reason);const p=s.players[seat];p.hero.readiness-=3;if(p.profile==='istari_ember'){p.stock.P-=10;p.stock.M-=10;}const id=`worksite:${s.nextId++}`;s.worksiteSupports[id]={id,owner:seat,profile:p.profile as WorksiteSupport['profile'],site:a.site,refuge:a.refuge,route:structuredClone(a.route),prepared:s.turn,until:s.turn,staff:s.facilities[a.site].workers,used:false};return id;}
export function evacuationReason(s:WorksiteState,seat:string,id:string,checks:WorksiteChecks){const q=s.worksiteSupports[id];if(!q||q.owner!==seat||q.used||q.until<s.turn)return 'Unused preparation in the current week required';const reason=routeReason(s,seat,q,checks);if(reason)return reason;if(q.profile==='namo'&&!checks.observedApproach(seat,s.facilities[q.site]))return 'Ward requires an observed direct hostile approach';if(s.facilities[q.site].workers!==q.staff)return 'Prepared staff changed; prepare a fresh evacuation';return '';}
export function evacuateWorksite(s:WorksiteState,seat:string,id:string,checks:WorksiteChecks){const reason=evacuationReason(s,seat,id,checks);if(reason)throw new Error(reason);const q=s.worksiteSupports[id],f=s.facilities[q.site],r=s.facilities[q.refuge];r.workers+=f.workers;f.workers=0;q.used=true;}
export function progressWorksiteSupports(s:WorksiteState,checks:WorksiteChecks){for(const q of Object.values(s.worksiteSupports)){const f=s.facilities[q.site];if(q.profile==='namo'&&f&&checks.observedApproach(q.owner,f)&&!evacuationReason(s,q.owner,q.id,checks))evacuateWorksite(s,q.owner,q.id,checks);}}
export function validateWorksiteSupport(s:WorksiteState,q:WorksiteSupport,guestSeat?:string){
 const f=s.facilities[q.site],r=s.facilities[q.refuge];
 if(s.worksiteSupports[q.id]!==q||!s.players[q.owner]||s.players[q.owner].profile!==q.profile||q.site===q.refuge||q.prepared>s.turn||q.until!==q.prepared||q.staff<1||!Number.isSafeInteger(q.staff)||q.route.length<2||q.route.length>9||(!f||!r)&&guestSeat!==q.owner||f&&distance(f,q.route[0])!==0||r&&distance(r,q.route.at(-1)!)!==0||q.route.some((p,i)=>!Number.isSafeInteger(p.x)||!Number.isSafeInteger(p.y)||p.x<0||p.y<0||p.x>=s.map.width||p.y>=s.map.height||(i>0&&distance(p,q.route[i-1])!==1)))throw new Error('Invalid conserved worksite preparation');
}
