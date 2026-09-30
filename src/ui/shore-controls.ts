import type {Action,Match,Pos} from '../simulation/types';
import {visible} from '../simulation/engine';
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const button=(name:string,label:string)=>`<button data-action="${name}">${label}</button>`;
export function panel(state:Match,seat:string,selectedTile?:Pos):string {
 const p=state.players[seat];if(!p||!['ulmo','human_numenor'].includes(p.profile))return '';
 const position=selectedTile??state.units[p.hero.id]??{x:0,y:0};
 const coordinates=`<div class="form-row"><label>Shore destination x<input id="shore-x" type="number" min="0" max="${state.map.width-1}" value="${position.x}"></label><label>Shore destination y<input id="shore-y" type="number" min="0" max="${state.map.height-1}" value="${position.y}"></label></div>`;
 if(p.profile==='human_numenor')return `<details><summary>Organized coastal landing</summary><p>2 readiness and the encounter commitment. Prepare one existing marine passenger for its normal paid disembarkation. No cargo or extra movement is created. A contested shore blocks unloading; injury to the accompanying hero interrupts preparation.</p><label>Loaded marine transport<select id="shore-ship">${Object.values(state.vessels).filter(v=>v.owner===seat&&v.hp>0&&v.passenger).map(v=>`<option value="${esc(v.id)}">${esc(v.name)} · passenger ${esc(state.units[v.passenger!]?.name??'existing company')} (${v.x},${v.y})</option>`).join('')}</select></label>${coordinates}${button('shore-landing','Review Coastal Landing')}<p>After preparing, issue the transport’s ordinary disembarkation to this exact landing during the same response phase.</p></details>`;
 const units=Object.values(state.units).filter(u=>u.alive&&u.owner!==seat&&visible(state,seat,u));
 return `<details><summary>Fords and current-borne passage</summary><p>Surging Passage: 2 readiness, encounter commitment, two response phases. Disrupt one observed formation standing in authored shallow water; bracing, higher ground or injury to Ulmo counters it.</p><label>Observed formation at ford<select id="shore-target">${units.map(u=>`<option value="${esc(u.id)}">${esc(u.name)} (${u.x},${u.y})</option>`).join('')}</select></label>${button('shore-surge','Review Surging Passage')}<p>Current-Borne Crossing: 3 readiness and one weekly commitment. Select an already loaded, supplied traveling convoy at the near bank. Choose the far bank below: a straight span of 3–6 tiles, with existing water between dry banks, must fit its ordinary movement. Both banks must be surveyed and uncontested.</p><label>Loaded convoy at near bank<select id="shore-convoy">${Object.values(state.convoys).filter(c=>c.owner===seat&&c.phase==='travel').map(c=>`<option value="${esc(c.id)}">${esc(state.units[c.carrier]?.name??c.carrier)} · bank (${c.x},${c.y}) · ${Object.values(c.cargo).reduce((a,b)=>a+b,0)}/${c.capacity} cargo</option>`).join('')}</select></label>${coordinates}${button('shore-current','Review Current-Borne Crossing')}<p>The convoy keeps its destination, cargo and normal weekly movement. The passage expires after one crossing; no ferry is built.</p></details>`;
}
export function actionBuilder(name:string,state:Match,seat:string,value:(id:string)=>string):Action|undefined {
 if(!state.players[seat])return;
 if(name==='shore-surge'){const u=state.units[value('shore-target')];if(!u)return;return{kind:'surge-passage',unit:u.id,tile:{x:u.x,y:u.y}};}
 if(!['shore-current','shore-landing'].includes(name))return;
 const tile={x:Number(value('shore-x')),y:Number(value('shore-y'))};if(!Number.isSafeInteger(tile.x)||!Number.isSafeInteger(tile.y))return;
 if(name==='shore-landing'){const v=state.vessels[value('shore-ship')];if(!v?.passenger)return;return{kind:'coastal-landing',ship:v.id,unit:v.passenger,tile};}
 const c=state.convoys[value('shore-convoy')];if(!c)return;const length=Math.abs(c.x-tile.x)+Math.abs(c.y-tile.y);const tiles=length<=5&&(c.x===tile.x||c.y===tile.y)?Array.from({length:length+1},(_,i)=>({x:c.x+Math.sign(tile.x-c.x)*i,y:c.y+Math.sign(tile.y-c.y)*i})):[];
 return{kind:'current-crossing',convoy:c.id,tiles};
}
