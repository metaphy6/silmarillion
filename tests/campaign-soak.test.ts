import {expect,it} from 'vitest';
import {profiles} from '../src/content/catalog';
import {createMatch,planAI,submit,resolveWeek} from '../src/simulation/engine';
import {encodeCheckpoint,decodeCheckpoint} from '../src/persistence/checkpoints';
import {guestSnapshot} from '../src/network/protocol';
import {parseMatch} from '../src/simulation/schema';
import type {Match} from '../src/simulation/types';
const seeds=[7,29,113];
function advance(s:Match,economicOnly=false){
 const turn=s.turn;
 for(let phase=0;phase<4&&s.turn===turn&&s.phase!=='finished';phase++){
  for(const seat of Object.keys(s.players).sort())for(const action of planAI(s,seat)){
   if(economicOnly&&['move','attack'].includes(action.kind))continue;
   const result=submit(s,{id:`soak:${seat}:${s.turn}:${s.revision}:${s.nextSeq[seat]}`,seat,seq:s.nextSeq[seat],turn:s.turn,revision:s.revision,action});
   expect(result.ok,`${seat} ${JSON.stringify(action)}: ${result.reason}`).toBe(true);s=result.state;
  }
  s=resolveWeek(s);
 }
 expect(s.turn).toBe(turn+1);return s;
}
for(const profile of profiles)it(`${profile.id}: three seeded campaigns through 64 weeks or legitimate victory`,async()=>{
 for(const seed of seeds){
  const opponent=profile.id==='human_rohan'?'human_gondor':'human_rohan';let s=createMatch([profile.id,opponent],seed);
  try{
   for(let week=0;week<64&&s.phase!=='finished';week++){
    await new Promise(resolve=>setTimeout(resolve,0));
    // Check restoration and deterministic future resolution repeatedly on evolving state.
    const saved=week%8===0?decodeCheckpoint(encodeCheckpoint(s)).state:undefined;
    s=advance(s);if(saved)expect(advance(saved)).toEqual(s);
    for(const p of Object.values(s.players)){
     expect(Object.keys(p.stock).sort()).toEqual(['E','K','M','P']);
     for(const quantity of Object.values(p.stock))expect(Number.isSafeInteger(quantity)&&quantity>=0).toBe(true);
     expect(p.operations).toBe(3);expect(p.commitment).toBe(1);
     expect(Object.values(s.units).filter(u=>u.owner===p.seat&&u.kind==='hero'&&u.alive)).toHaveLength(p.hero.status==='living'?1:0);
    }
    parseMatch(s);
    if(week%8===0)for(const seat of Object.keys(s.players))parseMatch(guestSnapshot(s,seat),seat);
   }
   expect(s.turn>=65||s.phase==='finished').toBe(true);
   expect(decodeCheckpoint(encodeCheckpoint(s)).state).toEqual(s);

  }catch(error){throw new Error(`Campaign reproduction: profile=${profile.id} seed=${seed} turn=${s.turn} revision=${s.revision}`,{cause:error});}
 }
},120000);
it('four-seat economy policy defers military orders and exercises 64 real weeks',async()=>{
 let longest=0;
 for(const seed of seeds){let s=createMatch(['human_gondor','human_rohan','elf_nandor','dwarf_khazad_dum'],seed);
  for(let week=0;week<64&&s.phase!=='finished';week++){
    await new Promise(resolve=>setTimeout(resolve,0));s=advance(s,true);parseMatch(s);if(week%8===0)s=decodeCheckpoint(encodeCheckpoint(s)).state;}
  expect(s.turn).toBe(65);
  expect(s.phase).not.toBe("finished");
  longest=Math.max(longest,s.turn-1);
 }
 expect(longest).toBeGreaterThanOrEqual(60);
},120000);
