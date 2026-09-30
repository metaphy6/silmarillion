import {expect,it} from 'vitest';
import {factionBuilding,recipe,profiles} from '../src/content/catalog';
import {createMatch,validate} from '../src/simulation/engine';
const creatures=['ent_grove','eagle_eyrie','wolf_pack','spider_brood'];
it('rejects unsupported industrial buildings and products for each section10 habitat',()=>{
 for(const id of creatures){
  for(const key of ['harbor','foundry','rescue-yard','pens','vault','sky-vault','crucible','spire','siege-brace'])expect(factionBuilding(id,key),`${id}:${key}`).toBeUndefined();
  for(const key of ['hull','engineers','field-tools','brute','brood','drake','dragon','winged-dragon','balrog'])expect(recipe(id,key),`${id}:${key}`).toBeUndefined();
 }
});
it('preserves essential queues, habitat stocks, storage and physical route infrastructure',()=>{
 for(const id of creatures){
  for(const key of ['core','training','workshop','research','farm','mine','archive','hold','refuge','depot','relay','ledge','crossing-anchor'])expect(factionBuilding(id,key),`${id}:${key}`).toBeDefined();
  for(const key of ['hero','component','synthesis','essence','company','worker','equipment','technique','defenses'])expect(recipe(id,key),`${id}:${key}`).toBeDefined();
 }
 expect(factionBuilding('ent_grove','workshop')?.name).toBe('Rootworks');
 expect(factionBuilding('eagle_eyrie','workshop')?.name).toBe('Harness Perch');
 expect(factionBuilding('wolf_pack','workshop')?.name).toBe('Pack Ground');
 expect(factionBuilding('spider_brood','workshop')?.name).toBe('Brood Chamber');
});
it('does not impose new restrictions on other roster identities',()=>{
 for(const p of profiles.filter(p=>!creatures.includes(p.id))){expect(factionBuilding(p.id,'harbor')).toBeDefined();expect(recipe(p.id,'hull')).toBeDefined();}
});
it('rejects creature industrial construction through simulation validation',()=>{
 const s=createMatch(['wolf_pack','human_gondor'],41); const seat=Object.keys(s.players)[0];
 expect(validate(s,{id:'capability-test',seat,seq:s.nextSeq[seat],turn:s.turn,revision:s.revision,action:{kind:'build',building:'harbor',x:2,y:2}})).not.toBe('');
});

it('rejects direct fieldwork bypass for a habitat without the structural recipe',()=>{
 const s=createMatch(['eagle_eyrie','human_gondor'],42); const seat=Object.keys(s.players)[0];
 const reason=validate(s,{id:'fieldwork-bypass',seat,seq:s.nextSeq[seat],turn:s.turn,revision:s.revision,action:{kind:'fieldwork',worker:seat+':worker',facility:seat+':core',form:'siege-brace',material:'metal',x:2,y:2}});
 expect(reason).toBe('This faction lacks the structural recipe');
});
