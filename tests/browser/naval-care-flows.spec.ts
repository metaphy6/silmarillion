import {test,expect,type Page} from '@playwright/test';
async function setup(page:Page,mode:'naval'|'care'|'crop'){
 await page.goto('/');await page.evaluate(async mode=>{
 const e=await import('/src/simulation/engine.ts' as string),p=await import('/src/persistence/checkpoints.ts' as string),r=await import('/src/simulation/recovery.ts' as string);
 const s=e.createMatch([mode==='crop'?'vana':'elf_falmari','human_rohan'],44);s.players.p2.ai=false;s.map.terrain.fill('meadow');s.waterChannels={};s.seaHazards={};s.shallowWater={};s.infrastructureSites={};s.players.p1.stock={P:500,M:500,K:500,E:500};const f=s.facilities['p1:core'],u=s.units['p1:company:0'];Object.assign(f,{x:4,y:4,kind:mode==='naval'?'harbor':mode==='care'?'refuge':'crop-plot'});Object.assign(u,{x:4,y:4});
 if(mode==='naval'){for(let x=4;x<=9;x++)s.map.terrain[5*s.map.width+x]='water';for(const worker of Object.values(s.units) as Array<{owner:string;kind:string;x:number;y:number}>)if(worker.owner==='p1'&&worker.kind==='worker')Object.assign(worker,{x:4,y:4});}
 if(mode==='care'){u.hp=30;r.recordRecoverableInjury(s,u,30);}
 if(mode==='crop'){s.facilities.water={...structuredClone(f),id:'water',kind:'irrigation',x:5};const owner=s.players.p1;owner.hero.status='living';owner.hero.readiness=6;s.units[owner.hero.id]={...structuredClone(u),id:owner.hero.id,kind:'hero'};}
 await p.saveCheckpoint(s);
 },mode);await page.getByRole('button',{name:'Continue saved match'}).click();await page.getByRole('button',{name:'Economy',exact:true}).click();
}
async function confirm(page:Page,name:string){await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'Confirm order'}).click();}
async function week(page:Page){const prior=await page.locator('.topbar').innerText();await page.getByRole('button',{name:'Resolve week'}).click();await expect(page.locator('.topbar')).not.toHaveText(prior);}
async function saved(page:Page){return page.evaluate(async()=>{const p=await import('/src/persistence/checkpoints.ts' as string);return (await p.loadCheckpoint()).state;});}
async function open(page:Page,name:string){await page.getByText(name,{exact:true}).evaluate(el=>{(el.parentElement as HTMLDetailsElement).open=true;});}

test('paid hull production carries existing cargo and party, sails, lands and survives reload',async({page})=>{
 await setup(page,'naval');await page.locator('#facility').selectOption('p1:core');await page.locator('.recipe').filter({has:page.getByRole('heading',{name:'Ordinary coastal transport',exact:true})}).getByRole('button',{name:'Review order'}).click();await expect(page.getByRole('dialog')).toContainText('60M');await page.getByRole('button',{name:'Confirm order'}).click();await week(page);await week(page);
 await open(page,'Coastal transport');await expect(page.locator('#fleet-ship option')).toHaveCount(1);await page.locator('#fleet-P').fill('5');await confirm(page,'Review load-cargo');await week(page);expect(Object.values((await saved(page)).vessels)[0]).toMatchObject({cargo:{P:5}});
 await open(page,'Coastal transport');await page.locator('#fleet-unit').selectOption('p1:company:0');await confirm(page,'Review embark');await week(page);
 await open(page,'Coastal transport');await page.locator('#fleet-x').fill('7');await page.locator('#fleet-y').fill('5');await confirm(page,'Review sail');await week(page);
 await open(page,'Coastal transport');await page.locator('#fleet-unit').selectOption('p1:company:0');await page.locator('#fleet-x').fill('7');await page.locator('#fleet-y').fill('4');await confirm(page,'Review disembark');await week(page);const checkpoint=await saved(page);expect(checkpoint.units['p1:company:0']).toMatchObject({x:7,y:4});expect(Object.values(checkpoint.vessels)[0]).toMatchObject({passenger:null,cargo:{P:5}});
 await page.reload();await page.getByRole('button',{name:'Continue saved match'}).click();await page.getByRole('button',{name:'Economy',exact:true}).click();await expect(page.locator('#fleet-ship option')).toHaveCount(1);
});

test('care can be interrupted explicitly and completed without restoring lost HP',async({page})=>{
 await setup(page,'care');await open(page,'Injury recovery');await confirm(page,'Review normal care');await week(page);expect(Object.values((await saved(page)).recoveries)[0]).toMatchObject({remaining:1});await open(page,'Injury recovery');await confirm(page,'Review cancel care');await week(page);let s=await saved(page);expect(Object.keys(s.recoveries)).toHaveLength(0);expect(s.units['p1:company:0'].effects.some((e:{kind:string})=>e.kind==='recovery-wound')).toBe(true);
 await open(page,'Injury recovery');await confirm(page,'Review normal care');await week(page);await week(page);s=await saved(page);expect(s.units['p1:company:0'].hp).toBe(30);expect(s.units['p1:company:0'].effects.some((e:{kind:string})=>e.kind==='recovery-wound')).toBe(false);
});

test('Vana advances an existing paid crop once, with unchanged fixed harvest and saved cycle',async({page})=>{
 await setup(page,'crop');await open(page,'Cultivated crop cycles');await confirm(page,'Review planting');await week(page);await open(page,'Cultivated crop cycles');await expect(page.locator('#crop-cycle')).toContainText('stage 1/3');await confirm(page,'Review Season Brought Forward');await expect(page.locator('.topbar')).toContainText('0/1 hero commitment');await week(page);const s=await saved(page);expect(Object.values(s.crops)[0]).toMatchObject({harvest:30,remainingCare:0,status:'harvested',advanced:true});await page.reload();await page.getByRole('button',{name:'Continue saved match'}).click();await page.getByRole('button',{name:'Economy',exact:true}).click();await expect(page.locator('#crop-cycle')).toContainText('harvested');
});
