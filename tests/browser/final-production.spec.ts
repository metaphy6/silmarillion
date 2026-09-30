import {test,expect} from '@playwright/test';
import type {Match,Action,Item} from '../../src/simulation/types';
test('paid field device reviews, cancels with restored focus, deploys and survives checkpoint reload',async({page})=>{
 await page.goto('/');
 const fixture=await page.evaluate(async()=>{
  const e=await import('/src/simulation/engine.ts' as string),p=await import('/src/persistence/checkpoints.ts' as string);
  let s=e.createMatch(['elf_avari','human_gondor'],19)as Match;s.players.p2.ai=false;
  const commit=(action:Action)=>{const r=e.submit(s,{id:`device-flow:${s.nextSeq.p1}`,seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action});if(!r.ok)throw Error(r.reason);s=e.resolveWeek(r.state);};
  const core=s.facilities['p1:core'];let site:{x:number;y:number}|undefined;
  for(let y=core.y-2;y<=core.y+2&&!site;y++)for(let x=core.x-2;x<=core.x+2&&!site;x++){const r=e.submit(s,{id:'check-build',seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action:{kind:'build',building:'workshop',x,y}});if(r.ok)site={x,y};}
  if(!site)throw Error('No normal workshop site');commit({kind:'build',building:'workshop',...site});
  const workshop=Object.values(s.facilities).find(f=>f.owner==='p1'&&f.kind==='workshop')!;
  commit({kind:'produce',facility:workshop.id,recipe:'mobile-camp-ward'});while(s.facilities[workshop.id].job)s=e.resolveWeek(s);
  const item=Object.values(s.items).find((i:Item)=>i.finalProduct==='mobile-camp-ward')!,unit='p1:company:0';
  commit({kind:'move',unit,x:item.x,y:item.y});commit({kind:'equip',unit,item:item.id});
  const u=s.units[unit];const at=[{x:u.x+1,y:u.y},{x:u.x-1,y:u.y},{x:u.x,y:u.y+1},{x:u.x,y:u.y-1}].find(at=>e.submit(s,{id:'check-device',seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action:{kind:'deploy-device',unit,item:item.id,at}}).ok);
  if(!at)throw Error('No normal deployment tile');await p.saveCheckpoint(s);return{item:item.id,unit,at};
 });
 await page.getByRole('button',{name:'Continue saved match'}).click();await page.getByRole('button',{name:'Economy',exact:true}).click();await page.getByText('Prepared field devices',{exact:true}).click();
 await page.locator('#device-item').selectOption(fixture.item);await page.locator('#device-x').fill(String(fixture.at.x));await page.locator('#device-y').fill(String(fixture.at.y));
 const review=page.getByRole('button',{name:'Review deploy field device'});await review.click();await expect(page.getByRole('dialog')).toContainText('one operation');await page.keyboard.press('Escape');await expect(review).toBeFocused();
 await review.click();await page.getByRole('button',{name:'Confirm order'}).click();
 await page.getByRole('button',{name:'Resolve week'}).click();
 const check=()=>page.evaluate(async({item,unit})=>{const p=await import('/src/persistence/checkpoints.ts' as string),s=(await p.loadCheckpoint()).state as Match;return{durability:s.items[item].durability,inventory:s.units[unit].inventory,zone:s.zones[`device:${item}`]};},fixture);
 await expect.poll(async()=>(await check()).durability).toBe(0);const result=await check();expect(result.inventory).not.toContain(fixture.item);expect(result.zone).toMatchObject({kind:'bloomscreen',...fixture.at});
 await page.reload();await page.getByRole('button',{name:'Continue saved match'}).click();expect((await check()).zone).toEqual(result.zone);
});
