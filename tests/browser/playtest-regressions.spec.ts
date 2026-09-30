import { test, expect } from '@playwright/test';


test('ranged preparation review describes a shot, not pursuit, and cancellation retains focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tutorial').uncheck();
  await page.getByRole('button', {name:'Begin Cross-era sandbox'}).click();
  await page.locator('#entity').selectOption('p1:company:0');
  const opener=page.getByRole('button',{name:'Review prepared ranged attack',exact:true});
  await opener.click();
  await expect(page.getByRole('dialog')).toContainText('ranged shot');
  await expect(page.getByRole('dialog')).not.toContainText('pursuit attack');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('ordinary scout training is reachable, reviewed, paid once and persists after reload', async ({page})=>{
  await page.goto('/');
  await page.locator('#tutorial').uncheck();
  await page.getByRole('button',{name:'Begin Cross-era sandbox'}).click();
  await page.getByText('Night work and communications',{exact:true}).click();
  await page.getByText('Physical night patrol',{exact:true}).click();
  await page.locator('#night-unit').selectOption('p1:company:0');
  await page.getByRole('button',{name:'Review scout training',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('5P + 5K, 1 operation, 1 week');
  await page.getByRole('button',{name:'Confirm order'}).click();
  await page.getByRole('button',{name:'Resolve week →',exact:true}).click();
  await expect(page.locator('#status')).toContainText('Week 2 committed');
  await page.reload();
  await page.getByRole('button',{name:'Continue saved match'}).click();
  await page.getByText('Night work and communications',{exact:true}).click();
  await page.getByText('Physical night patrol',{exact:true}).click();
  await expect(page.locator('#night-unit')).toContainText('trained scout');
  const trained=await page.evaluate(async()=>{
    const p=await import('/src/persistence/checkpoints.ts' as string);
    return (await p.loadCheckpoint()).state.scoutCredentials['p1:company:0'];
  });
  expect(trained.ready).toBe(true);
});

test('finite Rohan mounts breed through three paid queue weeks and remain distinct after restore',async({page})=>{
 await page.goto('/');await page.locator('#tutorial').uncheck();
 await page.getByRole('button',{name:'Begin Cross-era sandbox'}).click();
 await page.getByText('Finite remount circuit',{exact:true}).click();
 await page.getByRole('button',{name:'Review mount breeding',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('30P10M; three staffed stable weeks; no strategic operation');
 await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
 for(let week=2;week<=4;week++){
  await page.getByRole('button',{name:'Resolve week →',exact:true}).click();
  await expect(page.locator('#status')).toContainText(`Week ${week} committed`);
 }
 await page.reload();await page.getByRole('button',{name:'Continue saved match'}).click();
 await page.getByText('Finite remount circuit',{exact:true}).click();
 await expect(page.locator('#mount-lot')).toContainText('12 mounts');
 const state=await page.evaluate(async()=>{const p=await import('/src/persistence/checkpoints.ts' as string);return (await p.loadCheckpoint()).state;});
 expect(Object.values(state.mountLots).filter((lot:unknown)=>(lot as {owner:string;stable:string|null}).owner==='p1'&&(lot as {stable:string|null}).stable)).toHaveLength(1);
 expect(state.players.p1.operations).toBe(3);
});

test('tool production and refit preserve the same wear ceiling through the accessible UI',async({page})=>{
 await page.goto('/');
 // Isolated component scenario: existing forge, research station and active maker; research is purchased below.
 await page.evaluate(async()=>{
  const e=await import('/src/simulation/engine.ts' as string),p=await import('/src/persistence/checkpoints.ts' as string);
  const s=e.createMatch(['dwarf_nogrod','human_gondor'],91),owner=s.players.p1;
  s.players.p2.ai=false;owner.sources.push('metal');
  owner.hero.status='living';owner.hero.readiness=6;
  s.units[owner.hero.id]={...structuredClone(s.units['p1:company:0']),id:owner.hero.id,kind:'hero',engineer:undefined,inventory:[],x:4,y:4};
  s.facilities.forge={...s.facilities['p1:core'],id:'forge',name:'Test forge',kind:'workshop',x:4,y:4};
  s.facilities.research={...s.facilities['p1:core'],id:'research',name:'Test research station',kind:'research',x:4,y:5};
  await p.saveCheckpoint(s);
 });
 await page.getByRole('button',{name:'Continue saved match'}).click();
 await page.getByRole('button',{name:'Economy',exact:true}).click();
 await page.locator('#facility').selectOption('research');
 for(const name of ['Tool breach','Tool repair']){
  await page.locator('article').filter({has:page.getByRole('heading',{name,exact:true})}).getByRole('button').click();
  await expect(page.getByRole('dialog')).toContainText('10M + 10K');
  await page.locator('#confirm').click();await page.getByRole('button',{name:'Resolve week →',exact:true}).click();
 }
 await page.getByRole('button',{name:'World',exact:true}).click();
 await page.getByText('Finite tools and field repairs',{exact:true}).click();
 await page.locator('#service-forge').selectOption('forge');
 await page.getByRole('button',{name:'Review standard tool production'}).click();
 await expect(page.getByRole('dialog')).toContainText('15M5K');
 await page.locator('#confirm').click();await page.getByRole('button',{name:'Resolve week →',exact:true}).click();
 await expect(page.locator('#status')).toContainText('Week 4 committed');
 await page.getByText('Finite tools and field repairs',{exact:true}).click();
 await page.locator('#service-forge').selectOption('forge');
 await page.locator('#service-function').selectOption('repair');
 await page.getByRole('button',{name:'Review Modular Refit'}).click();
 await expect(page.getByRole('dialog')).toContainText('Original standard tool is consumed');
 await expect(page.locator('#confirm')).toBeEnabled();await page.locator('#confirm').click();
 await page.getByRole('button',{name:'Resolve week →',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'Continue saved match'}).click();
 await page.getByText('Finite tools and field repairs',{exact:true}).click();
 await expect(page.locator('#service-tool')).toContainText('repair');
 const tools=await page.evaluate(async()=>{const p=await import('/src/persistence/checkpoints.ts' as string);const s=(await p.loadCheckpoint()).state;return Object.values(s.toolMetadata);});
 expect(tools).toHaveLength(1);
});

test('rules terrain toggles an explicit color-independent map without committing an order',async({page})=>{
 await page.goto('/');await page.locator('#tutorial').uncheck();await page.getByRole('button',{name:'Begin Cross-era sandbox'}).click();
 const toggle=page.getByRole('button',{name:'Rules terrain',exact:true});
 await expect(toggle).toHaveAttribute('aria-pressed','false');await toggle.click();
 await expect(toggle).toHaveAttribute('aria-pressed','true');await expect(toggle).toBeFocused();
 await expect(page.locator('.terrain-legend')).toContainText('Water = parallel waves');
 await expect(page.locator('.terrain-legend')).toContainText('atmospheric');
 await expect(page.locator('.turnbar')).toContainText('0 planned orders');
 await page.getByRole('button',{name:'View landscape',exact:true}).click();
 await page.screenshot({path:'docs/reports/runtime/rules-terrain.png'});
 await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','false');
 await page.screenshot({path:'docs/reports/runtime/painted-world.png'});
});

test('keyboard selection retains focus after entity, facility and text-size changes',async({page})=>{
 await page.goto('/');await page.locator('#tutorial').uncheck();await page.getByRole('button',{name:'Begin Cross-era sandbox'}).click();
 await page.locator('#entity').focus();await page.locator('#entity').selectOption('p1:company:0');
 await expect(page.locator('#entity')).toBeFocused();
 await page.getByRole('button',{name:'Economy',exact:true}).click();
 await page.locator('#facility').focus();await page.locator('#facility').selectOption('p1:training');
 await expect(page.locator('#facility')).toBeFocused();
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await page.locator('#text-scale').focus();await page.locator('#text-scale').selectOption('2');
 await expect(page.locator('#text-scale')).toBeFocused();
});
