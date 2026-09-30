import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const roster = JSON.parse(readFileSync(new URL('../../hero-balance-roster.json', import.meta.url), 'utf8')) as {profiles:{id:string;hero:string}[]};

// These are real DOM sessions from ordinary scenario setup. No grants of stocks,
// heroes, terrain or artificial opponents are injected into the running game.


for(const profile of roster.profiles) {
 test(`${profile.id}: setup, exact hero recipe, 12 weekly resolutions and checkpoint rejoin`,async({page})=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.locator('#faction').selectOption(profile.id);
  await page.locator('#tutorial').uncheck();
  await page.getByRole('button',{name:'Begin Cross-era sandbox'}).click();
  await page.getByRole('button',{name:'Economy',exact:true}).click();
  const component=page.locator('article').filter({has:page.getByRole('heading',{name:'Signature component',exact:true})});
  await component.getByRole('button').click();
  await expect(page.locator('#confirm')).toBeEnabled();
  await page.locator('#confirm').click();
  await page.getByRole('button',{name:'Resolve week →',exact:true}).click();
  await expect(page.locator('#status')).toContainText('Week 2 committed');
  const hero=page.locator('article').filter({has:page.getByRole('heading',{name:`Create / recreate ${profile.hero}`,exact:true})});
  await hero.getByRole('button').click();
  await expect(page.locator('#confirm')).toBeEnabled();
  await page.locator('#confirm').click();
  for(let i=0;i<11;i++){
   await page.getByRole('button',{name:'Resolve week →',exact:true}).click();
   await expect(page.locator('#status')).toContainText(`Week ${i+3} committed`);
  }
  await page.getByRole('button',{name:'Hero',exact:true}).click();
  await expect(page.locator('#controls')).toContainText('LIVING');
  await page.reload();
  await page.getByRole('button',{name:'Continue saved match'}).click();
  await expect(page.locator('.topbar')).toContainText('Week 13');
  const saved=await page.evaluate(async()=>{
   const storage=await import('/src/persistence/checkpoints.ts' as string);
   const cp=await storage.loadCheckpoint();
   return {profile:cp.state.players.p1.profile,hero:cp.state.players.p1.hero.status,stocks:cp.state.players.p1.stock,turn:cp.state.turn};
  });
  expect(saved.profile).toBe(profile.id);expect(saved.hero).toBe('living');
  expect(Object.keys(saved.stocks).sort()).toEqual(['E','K','M','P']);
  expect(Object.values(saved.stocks).every(n=>Number.isFinite(n)&&Number(n)>=0)).toBe(true);
  expect(errors).toEqual([]);
 });
}
