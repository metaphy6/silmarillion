// Documentation-only renderer. Supply an existing Playwright installation; no download/install.
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.SILMARILLION_PLAYWRIGHT_MODULE || 'playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const output=path.join(root,'gallery','evidence');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true, ...(process.env.SILMARILLION_BROWSER_EXECUTABLE ? {executablePath:process.env.SILMARILLION_BROWSER_EXECUTABLE} : {})});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure().errorText));
const reports=[];
try{
 await page.goto(pathToFileURL(path.join(root,'gallery','index.html')).href);
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await Promise.all(['art/faction-portraits-v1.png','art/world-figures-v1.svg'].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=src;})));
 });
 for(const selector of ['.skip','#text-scale','.gallery-tools a','[data-view="strategic"]','[data-view="local"]']){
  await page.keyboard.press('Tab');
  if(!(await page.locator(selector).evaluate(e=>e===document.activeElement)))throw Error('Tab order mismatch: '+selector);
 }
 await page.keyboard.press('Enter');
 if(!(await page.locator('#local').isVisible()))throw Error('Tab/Enter activation failed');
 for(const view of ['strategic','local','factions','map','dialogue']){
  await page.locator(`[data-view="${view}"]`).click();
  await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
  const metrics=await page.evaluate(()=>({viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,bodyHeight:document.body.scrollHeight,loadedImages:[...document.images].every(i=>i.complete&&i.naturalWidth>0),visibleStudy:document.querySelector('.study:not([hidden])').id,
   textSizes:[...document.querySelectorAll('.study:not([hidden]) p,.study:not([hidden]) button')].map(e=>parseFloat(getComputedStyle(e).fontSize)),
   buttonTargets:[...document.querySelectorAll('button,select,summary')].filter(e=>e.checkVisibility()).map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));
  if(metrics.scrollWidth>1440||!metrics.loadedImages||metrics.visibleStudy!==view||Math.min(...metrics.textSizes)<14||metrics.buttonTargets.some(t=>t.width<44||t.height<44))throw Error('View check failed '+JSON.stringify(metrics));
  await page.screenshot({path:path.join(output,view+'-1440.png'),fullPage:true});
  reports.push({view,...metrics});
 }
 await page.locator('[data-view="map"]').click();
 await page.locator('[data-layer="threat-layer"]').uncheck();
 if(await page.locator('.threat-layer').isVisible())throw Error('Overlay hide failed');
 await page.locator('[data-layer="threat-layer"]').check();
 await page.locator('[data-view="dialogue"]').click();
 await page.locator('[data-reply]').first().click();
 if(!(await page.locator('#reply').innerText()).includes('metal thinned'))throw Error('Dialogue demo failed');
 await page.locator('[data-view="local"]').focus();
 await page.keyboard.press('Enter');
 if(!(await page.locator('#local').isVisible()))throw Error('Keyboard view activation failed');
 const focus=await page.locator('[data-view="local"]').evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));
 if(focus.width!=='3px'||focus.style==='none')throw Error('Visible focus missing');
 await page.screenshot({path:path.join(output,'keyboard-focus-1440.png'),fullPage:true});
 await page.setViewportSize({width:1024,height:900});
 for(const scale of ['1','2']){
  await page.locator('#text-scale').selectOption(scale);
  for(const view of ['strategic','local','factions','map','dialogue']){
   await page.locator(`[data-view="${view}"]`).click();
   const metric=await page.evaluate(()=>({width:document.documentElement.scrollWidth,inner:innerWidth}));
   if(metric.width>metric.inner)throw Error('Horizontal overflow '+view+' scale '+scale+': '+JSON.stringify(metric));
   reports.push({view,textScale:Number(scale),viewport:[1024,900],horizontalOverflow:false});
  }
 }
 await page.locator('[data-view="local"]').click();
 await page.screenshot({path:path.join(output,'local-1024-text200.png'),fullPage:true});
 const targetChecks=await page.evaluate(()=>[...document.querySelectorAll('button,select,summary')].filter(e=>e.checkVisibility()).map(e=>({label:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
 if(targetChecks.some(x=>x.width<44||x.height<44))throw Error('Small target '+JSON.stringify(targetChecks));
 if(errors.length)throw Error(errors.join('\n'));
 await page.setViewportSize({width:1200,height:540});
 await page.goto(pathToFileURL(path.join(root,'gallery','art','review-examples-v1.svg')).href);
 await page.screenshot({path:path.join(output,'review-examples-1200.png')});
 await fs.writeFile(path.join(output,'render-checks.json'),JSON.stringify({status:'passed',scope:'Documentation gallery only',referenceViewport:[1440,900],checks:reports,keyboardFocus:focus,tabOrderChecked:true,targets:targetChecks,consoleErrors:errors,notTested:['game runtime','screen reader operation','touch/controller','actual audio','competitive balance','fresh client skill loading']},null,2)+'\n');
 console.log('PASS: 5 base renders, 10 compact/text-scale checks, keyboard focus, overlay and dialogue controls; no console or image errors.');
}finally{await browser.close();}
