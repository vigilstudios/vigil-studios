// Use an installed Playwright or set PLAYWRIGHT_MODULE to its module path.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://localhost:3018';
const route=process.env.QA_ROUTE||'/express';
const out=process.env.QA_OUT||'/tmp/vigil-express-catalogue-qa';
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const report={base,sizes:[],variants:[],errors:[]};
 const page=await browser.newPage();
 await page.emulateMedia({reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));
 for(const [width,height] of [[320,667],[375,812],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1920,1080],[667,375]]){
  await page.setViewportSize({width,height});
  await page.goto(`${base}${route}`,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Mobile',exact:true}).waitFor();
  await page.waitForFunction(()=>Number.parseFloat(document.querySelector('#template-stage iframe')?.parentElement.style.getPropertyValue('--preview-scale'))>0);
  for(const mode of ['mobile','desktop']){
   await page.getByRole('button',{name:mode==='mobile'?'Mobile':'Desktop',exact:true}).click();
   await page.waitForFunction(expected=>document.querySelector('#template-stage iframe')?.clientWidth===expected,mode==='mobile'?390:1200);
   await page.waitForTimeout(100);
   console.log(width,height,mode);
   const measured=await page.locator('#template-stage iframe').evaluate(el=>{
    const r=el.getBoundingClientRect(),v=el.parentElement.getBoundingClientRect();
    const group=document.querySelector('[aria-label="Preview size"]');
    const select=document.querySelector('select[aria-label$=" variant"]');
    const replay=document.querySelector('[aria-label="Replay animations"]');
    const controls=[group,select.parentElement,replay].map(e=>e.getBoundingClientRect().toJSON());
    return {natural:[el.clientWidth,el.clientHeight],frame:r.toJSON(),viewport:v.toJSON(),controls,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,selected:group.querySelector('[aria-pressed="true"]').ariaLabel,motionText:replay.textContent,variant:select.options[select.selectedIndex].textContent};
   });
   assert.deepEqual(measured.natural,mode==='mobile'?[390,844]:[1200,700]);
   assert.equal(measured.selected,mode==='mobile'?'Mobile':'Desktop');
   assert.ok(Math.abs(measured.frame.width-measured.viewport.width)<.1,'Frame width does not fit');
   assert.ok(Math.abs(measured.frame.height-measured.viewport.height)<.1,'Frame height does not fit');
   assert.ok(measured.frame.left>=0 && measured.frame.right<=width,'Frame outside screen');
   assert.ok(measured.documentWidth<=width && measured.bodyWidth<=width,'Page overflow');
   assert.equal(measured.motionText,'Motion');
   const [toggle,variant,motion]=measured.controls;
   for(const control of measured.controls) assert.equal(control.height,32);
   assert.ok(Math.abs(toggle.y-variant.y)<1 && Math.abs(toggle.y-motion.y)<1,'Controls not one row');
   assert.ok(toggle.right<=variant.left && variant.right<=motion.left,'Controls overlap');
   assert.ok(Math.abs(variant.x+variant.width/2-width/2)<1,'Variant not centered');
   const surface=await page.locator('#template-stage iframe').elementHandle().then(e=>e.contentFrame());
   await surface.waitForFunction(()=>document.readyState==='complete');
   assert.equal(await surface.evaluate(()=>innerWidth),mode==='mobile'?390:1200);
   assert.equal(await surface.evaluate(()=>innerHeight),mode==='mobile'?844:700);
   // Actual interaction at the transformed size, including fixed nav and inner scrolling.
   if(width===390 || width===1440){
    const toggle=surface.locator('.nav-toggle');
    if(mode==='mobile' && await toggle.count()){
     await toggle.click();
     await surface.waitForFunction(()=>document.querySelector('.mobile-nav').classList.contains('is-open'));
     await surface.locator('.mobile-nav a[href^="#"]').first().click();
    } else {
     await surface.locator('.desktop-nav a[href^="#"]').first().click();
    }
    await surface.waitForFunction(()=>location.hash.length>1);
    assert.ok(await surface.evaluate(()=>scrollY>0),'Preview did not scroll');
    assert.equal(await page.locator('#template-stage iframe').evaluate(e=>e.parentElement.scrollTop),0);
    await page.getByRole('button',{name:'Replay animations'}).click();
    await page.waitForFunction(()=>document.querySelector('#template-stage iframe')?.contentDocument?.readyState==='complete');
    const replayed=await page.locator('#template-stage iframe').elementHandle().then(e=>e.contentFrame());
    assert.equal(await replayed.evaluate(()=>location.hash),'');
    assert.equal(await replayed.evaluate(()=>scrollY),0);
   }
   if([320,390,768,1440].includes(width)){
    // Scroll the page's actual enclosing scrollport, leaving the controls pinned.
    await page.locator('[aria-label="Industries"]').evaluate(e=>{
     let p=e.parentElement;
     while(p && p!==document.documentElement){
      if(p.scrollHeight>p.clientHeight && ['auto','scroll'].includes(getComputedStyle(p).overflowY)) {p.scrollTop+=e.getBoundingClientRect().top-100;return;}
      p=p.parentElement;
     }
     window.scrollTo(0,250);
    });
    await page.waitForTimeout(250);
    await page.screenshot({path:`${out}/${width}-${mode}.png`});
   }
   report.sizes.push({width,height,mode,...measured});
   await fs.writeFile(`${out}/browser-results.json`,JSON.stringify(report,null,2));
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}${route}`);
 const industries=await page.getByRole('tab').allTextContents();
 for(const industry of industries){
  await page.getByRole('tab',{name:industry,exact:true}).click();
  await page.waitForTimeout(750);
  const select=page.locator('select[aria-label$=" variant"]');
  const options=await select.locator('option').allTextContents();
  for(let i=0;i<options.length;i++){
   if(options.length>1) await select.selectOption(String(i));
   await page.waitForFunction(()=>Number.parseFloat(document.querySelector('#template-stage iframe')?.parentElement.style.getPropertyValue('--preview-scale'))>0);
   assert.ok((await select.locator('..').textContent()).includes(options[i]));
   const frame=page.locator('#template-stage iframe');
   assert.equal(await frame.count(),1);
   report.variants.push({industry,variant:options[i],src:await frame.getAttribute('src')});
  }
 }
 await fs.writeFile(`${out}/browser-results.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify({checks:report.sizes.length,variants:report.variants.length,errors:report.errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
