import {test,expect} from '@playwright/test';
test('household UI deposits finite P, transports it physically, and persists the receiving ledger',async({page})=>{
 await page.goto('/');
 const fixture=await page.evaluate(async()=>{
  const{createMatch}=await import('/src/simulation/engine.ts' as string);const{saveCheckpoint}=await import('/src/persistence/checkpoints.ts' as string);const s=createMatch(['hobbit_shire','human_gondor'],17);s.players.p2.ai=false;s.infrastructureSites={};s.shallowWater={};s.seaHazards={};
  const p=s.players.p1,f=s.facilities['p1:core'];const u=(Object.values(s.units) as Array<{id:string;owner:string;kind:string;x:number;y:number;move:number}>).find(u=>u.owner==='p1'&&u.kind==='worker')!;u.x=f.x;u.y=f.y;u.move=5;
  p.hero.status='living';p.hero.readiness=6;s.units[p.hero.id]={...structuredClone(s.units[u.id]),id:p.hero.id,kind:'hero',loadClass:'standard',inventory:[]};
  for(let x=f.x;x<=f.x+2;x++)s.map.terrain[f.y*s.map.width+x]='meadow';s.facilities.ref={...f,id:'ref',name:'Receiving refuge',kind:'refuge',x:f.x+2};await saveCheckpoint(s);return{worker:u.id,x:f.x+2,y:f.y};
 });
 await page.getByRole('button',{name:'Continue saved match'}).click();await page.getByRole('button',{name:'Economy',exact:true}).click();await page.getByText('Civilian groups and household stores',{exact:true}).click();
 await page.locator('#civil-household').selectOption('household:p1');await page.locator('#civil-unit').selectOption(fixture.worker);await page.locator('#civil-amount').fill('10');
 await page.getByRole('button',{name:'Review deposit',exact:true}).click();await expect(page.getByRole('button',{name:'Confirm order'})).toBeEnabled();await page.getByRole('button',{name:'Confirm order'}).click();
 await page.getByText('Civilian groups and household stores',{exact:true}).click();await page.locator('#civil-unit').selectOption(fixture.worker);await page.locator('#civil-refuge').selectOption('ref');await page.getByRole('button',{name:'Review Neighbors’ Stores'}).click();await expect(page.getByRole('dialog')).toContainText('civilian');await page.getByRole('button',{name:'Confirm order'}).click();await page.getByRole('button',{name:'Resolve week →',exact:true}).click();
 const saved=await page.evaluate(async()=>{const{loadCheckpoint}=await import('/src/persistence/checkpoints.ts' as string);return(await loadCheckpoint())!.state;});
 const homes=Object.values(saved.households) as Array<{owner:string;home:string;provisions:number;population:number}>;
 expect(homes.filter(h=>h.owner==='p1').reduce((n,h)=>n+h.provisions,0)).toBe(10);expect(homes.find(h=>h.home==='ref')?.provisions).toBe(10);expect(homes.filter(h=>h.owner==='p1').reduce((n,h)=>n+h.population,0)).toBe(12);expect(saved.units[fixture.worker]).toMatchObject({x:fixture.x,y:fixture.y});expect(Object.values(saved.civilianJobs)[0]).toMatchObject({phase:'arrived',provisions:0});
 await page.reload();await page.getByRole('button',{name:'Continue saved match'}).click();await page.getByRole('button',{name:'Economy',exact:true}).click();await page.getByText('Civilian groups and household stores',{exact:true}).click();await expect(page.locator('#civil-household')).toContainText('10P');
});
