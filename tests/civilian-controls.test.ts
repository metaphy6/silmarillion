import {expect,it} from 'vitest';
import {createMatch} from '../src/simulation/engine';
import {panel,actionBuilder} from '../src/ui/civilian-controls';
it('shows finite population/stores and exact support fees without a creature household fiction',()=>{
 const s=createMatch(['hobbit_shire','eagle_eyrie'],2);expect(panel(s,'p1')).toContain('12 people');expect(panel(s,'p1')).toContain('2P');expect(panel(s,'p2')).toBe('');
});
it('builds a local withdrawal request and rejects missing or fractional values',()=>{
 const s=createMatch(['hobbit_shire','human_gondor'],2);const unit=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!;const values:Record<string,string>={'civil-household':'household:p1','civil-unit':unit.id,'civil-amount':'4'};
 expect(actionBuilder('civil-withdraw',s,'p1',id=>values[id]??'')).toEqual({kind:'civilian',mode:'withdraw',household:'household:p1',amount:4,unit:unit.id});values['civil-amount']='1.5';expect(actionBuilder('civil-withdraw',s,'p1',id=>values[id]??'')).toBeUndefined();
});
