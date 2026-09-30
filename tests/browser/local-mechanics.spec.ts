import {test,expect} from '@playwright/test';
import type {Action,Match} from '../../src/simulation/types';
for(const width of [1440,700])for(const mode of ['logging','beacon','heavy']as const)test(`${mode} normal production review cancellation confirmation reload at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');
 const setup=await page.evaluate(async(mode)=>{
  const {createMatch,submit,resolveWeek}=await import('/src/simulation/engine.ts' as string);const {saveCheckpoint}=await import('/src/persistence/checkpoints.ts' as string);const {recipe}=await import('/src/content/catalog.ts' as string);
  let s:Match=createMatch([mode==='heavy'?'troll_hold':mode==='beacon'?'istari_star':'human_gondor','human_rohan'],93);s.players.p2.ai=false;
  const worker=Object.values(s.units).find(u=>u.owner==='p1'&&u.kind==='worker')!.id;
  const run=(a:Action)=>{const r=submit(s,{id:`p1-${s.nextSeq.p1}`,seat:'p1',seq:s.nextSeq.p1,turn:s.turn,revision:s.revision,action:a});if(!r.ok)throw Error(r.reason);s=resolveWeek(r.state);};
  if(mode!=='logging'){run({kind:'produce',facility:'p1:core',recipe:'component'});run({kind:'produce',facility:'p1:core',recipe:'hero'});for(let i=1;i<recipe(s.players.p1.profile,'hero').turns;i++)s=resolveWeek(s);}
  if(mode==='logging'){run({kind:'build',building:'depot',x:5,y:8});run({kind:'move',unit:worker,x:5,y:8});}
  if(mode==='beacon'){run({kind:'move',unit:worker,x:5,y:6});run({kind:'build',building:'beacon',x:4,y:5});run({kind:'build',building:'beacon',x:6,y:5});run({kind:'move',unit:s.players.p1.hero.id,x:4,y:5});run({kind:'move',unit:s.players.p1.hero.id,x:6,y:5});}
  if(mode==='heavy'){run({kind:'build',building:'workshop',x:4,y:5});const f=Object.values(s.facilities).find(f=>f.owner==='p1'&&f.kind==='workshop')!;run({kind:'produce',facility:f.id,recipe:'equipment'});s=resolveWeek(s);}
  await saveCheckpoint(s);return {worker,hero:s.players.p1.hero.id,turn:s.turn,stock:s.players.p1.stock,item:Object.values(s.items).find(i=>i.owner==='p1'&&i.heavy)?.id,depot:Object.values(s.facilities).find(f=>f.owner==='p1'&&f.kind==='depot')?.id};
 },mode);
 await page.getByRole('button',{name:'Continue saved match'}).click();await page.getByRole('button',{name:'Economy',exact:true}).click();
 const summary=mode==='logging'?'Finite timber harvest':mode==='beacon'?'Visual beacon signals':'Carry heavy equipment';await page.getByText(summary,{exact:true}).click();
 if(mode==='logging'){await page.locator('#logging-worker').selectOption(setup.worker);await page.locator('#logging-tree').selectOption('vegetation:5:9');await page.locator('#logging-site').selectOption(setup.depot!);}
 if(mode==='heavy'){await page.locator('#heavy-item').selectOption(setup.item!);await page.locator('#heavy-carrier').selectOption(setup.hero);}
 const button=page.getByRole('button',{name:mode==='logging'?'Review timber harvest':mode==='beacon'?'Review record surveyed link':'Review carry heavy item',exact:true});
 await button.click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog')).toContainText(/operation/i);if(mode==='logging')await expect(page.getByRole('dialog')).toContainText('5P + 2M');await page.screenshot({path:info.outputPath('review.png')});await page.keyboard.press('Escape');await expect(button).toBeFocused();
 const unchanged=await page.evaluate(async()=>{const {loadCheckpoint}=await import('/src/persistence/checkpoints.ts' as string);const q=await loadCheckpoint();return {turn:q.state.turn,stock:q.state.players.p1.stock};});expect(unchanged).toEqual({turn:setup.turn,stock:setup.stock});
 await button.click();await page.getByRole('button',{name:'Confirm order',exact:true}).click();await page.getByRole('button',{name:'Resolve week →',exact:true}).click();await expect(page.locator('#status')).toContainText('committed and saved');
 await page.reload();await page.getByRole('button',{name:'Continue saved match'}).click();await page.getByRole('button',{name:'Economy',exact:true}).click();await page.getByText(summary,{exact:true}).click();
 const saved=await page.evaluate(async()=>{const {loadCheckpoint}=await import('/src/persistence/checkpoints.ts' as string);return(await loadCheckpoint()).state;});
 if(mode==='logging'){expect(saved.loggedVegetation['vegetation:5:9']).toBe(true);await expect(page.locator('#logging-tree')).not.toContainText('Tree 5,9');}
 if(mode==='beacon')expect(saved.beaconLinks.p1.route.at(-1)).toEqual({x:6,y:5});
 if(mode==='heavy'){expect(saved.items[setup.item!]).toMatchObject({carried:true,bearer:setup.hero});await expect(page.locator('#heavy-item')).toContainText('carried');}
 await button.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('reloaded.png')});
});
