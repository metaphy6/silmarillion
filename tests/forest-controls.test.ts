import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {panel,actionBuilder} from '../src/ui/forest-controls';
it('forest controls explain real Anchor capacity, ordinary transport and unknown harassment outcomes',()=>{const s=createMatch(['melian','human_gondor'],81);const html=panel(s,'p1');expect(html).toContain('one of three maintained Anchor slots');expect(html).toContain('Any cargo and resulting travel delay remain uncertain');expect(html).toContain('target must already have a paid withdrawal');expect(html).not.toContain('value="p2:company:0"');});
it('harassment submits only an observed party identifier, never private convoy data',()=>{const s=createMatch(['melian','human_gondor'],81);expect(actionBuilder('forest-harass',s,'p1',id=>id==='forest-raider'?'own':'observed')).toEqual({kind:'harass-convoy',unit:'own',target:'observed'});});
