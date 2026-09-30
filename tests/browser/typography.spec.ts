import {test,expect} from '@playwright/test';
test('bundled Noto faces render token typography and diacritics at both text scales',async({page},testInfo)=>{
 const failures:string[]=[];page.on('requestfailed',r=>{if(r.url().includes('/assets/fonts/'))failures.push(r.url());});
 await page.goto('/');
 await page.evaluate(async()=>{await Promise.all(['16px "Noto Sans"','700 16px "Noto Sans"','32px "Noto Serif"','italic 22px "Noto Serif"'].map(face=>document.fonts.load(face,'Númenor Fëanor Aulë Eönwë Lórien')));await document.fonts.ready;});
 const fonts=await page.evaluate(()=>Array.from(document.fonts).map(f=>({family:f.family,status:f.status})));
 expect(fonts.filter(f=>f.status==='loaded').map(f=>f.family)).toEqual(expect.arrayContaining(['Noto Sans','Noto Serif']));expect(failures).toEqual([]);
 expect(await page.evaluate(()=>document.fonts.check('16px "Noto Sans"')&&document.fonts.check('32px "Noto Serif"'))).toBe(true);
 await expect(page.locator('.setup h1')).toHaveCSS('font-size','32px');await expect(page.locator('.setup h1')).toHaveCSS('font-family','"Noto Serif", Georgia, serif');
 await expect(page.locator('body')).toHaveCSS('font-family','"Noto Sans", Arial, sans-serif');
 await page.screenshot({path:testInfo.outputPath('noto-setup.png'),fullPage:true});
 await page.locator('#app').evaluate(el=>(el as HTMLElement).style.setProperty('--text-scale','2'));
 await expect(page.locator('.setup h1')).toHaveCSS('font-size','64px');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.locator('#app').evaluate(el=>(el as HTMLElement).style.setProperty('--text-scale','1'));
 await page.getByRole('button',{name:'Begin Cross-era sandbox'}).click();await expect(page.locator('#world canvas')).toBeVisible();
 expect(await page.evaluate(()=>document.fonts.check('16px "Noto Sans"')&&document.fonts.check('600 16px "Noto Sans"'))).toBe(true);
});
