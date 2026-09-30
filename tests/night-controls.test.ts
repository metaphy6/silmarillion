import {describe as suite,it,expect} from 'vitest';
import {describe} from '../src/ui/night-relay-controls';
suite('night order review',()=>{
 it('shows zero strategic operations for personal powers and the separate accompanying scout operation',()=>{
  expect(describe({kind:'night',mode:'patrol',unit:'hero',route:[],method:'moon'})).toContain('0 operations');
  expect(describe({kind:'night',mode:'patrol',unit:'hero',route:[],method:'moon',companion:'scout'})).toContain('1 operation for the accompanying scout');
  expect(describe({kind:'night',mode:'second-signal',message:'message',route:[]})).toContain('15M + 5K, 3 readiness, 1 hero commitment, 0 operations');
 });
 it('distinguishes normal funded work from additional production',()=>{
  expect(describe({kind:'night',mode:'light-shift',shift:'shift',method:'lamps'})).toContain('5M, 1 operation');
  expect(describe({kind:'night',mode:'light-shift',shift:'shift',method:'dawn'})).toContain('without an extra cycle');
  expect(describe({kind:'night',mode:'train-scout',unit:'unit'})).toContain('5P + 5K, 1 operation, 1 week');
 });
});
