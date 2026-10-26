/** Regression coverage for parser-time bootstraps and React client navigation. */
import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app=process.env.THEME_QA_APP || 'http://127.0.0.1:3190';
const out=fileURLToPath(new URL('../docs/theme-refresh/evidence/',import.meta.url));
const checks=[],errors=[],reactWarnings=[];
function check(name,pass){checks.push({name,pass:!!pass});if(!pass)throw Error(name);}
function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&/script tag|hydration|did not match|React component/i.test(m.text()))reactWarnings.push(m.text());});}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const cold=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce'});
 const early=await cold.newPage();observe(early);
 await early.route(url=>url.pathname.startsWith('/_next/static/')&&url.pathname.endsWith('.js'),route=>route.abort());
 await early.goto(app,{waitUntil:'domcontentloaded'});
 await early.waitForFunction(()=>document.getElementById('hero-wire')?.dataset.wireOwner==='bootstrap');
 await early.waitForFunction(()=>document.getElementById('hero-actions')?.style.opacity==='1');
 check('Wire bootstrap runs before framework scripts load',await early.locator('#hero-wire').getAttribute('data-wire-owner')==='bootstrap');
 check('Typing bootstrap runs before hydration',await early.locator('#hero-title').getAttribute('data-type-owner')==='bootstrap');
 check('Server bootstraps are executable scripts',await early.locator('.hero-layer script').evaluateAll(s=>s.length===2&&s.every(e=>e.type==='text/javascript')));
 check('Early canvas is drawn',await early.locator('#hero-wire').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)));
 await cold.close();
 const handoffContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const handoff=await handoffContext.newPage();observe(handoff);
 await handoff.addInitScript(()=>{window.__activeEarlyPointers=new Set();const add=window.addEventListener,remove=window.removeEventListener;window.addEventListener=function(type,callback,...args){if(type==='pointermove')window.__activeEarlyPointers.add(callback);return add.call(this,type,callback,...args);};window.removeEventListener=function(type,callback,...args){if(type==='pointermove')window.__activeEarlyPointers.delete(callback);return remove.call(this,type,callback,...args);};});
 let release;const gate=new Promise(resolve=>{release=resolve;});
 await handoff.route(url=>url.pathname.startsWith('/_next/static/')&&url.pathname.endsWith('.js'),async route=>{await gate;await route.continue();});
 await handoff.goto(app,{waitUntil:'commit'});
 await handoff.locator('#hero-wire[data-wire-owner="bootstrap"]').waitFor();
 await handoff.waitForTimeout(300);
 check('Early wire pointer listener is registered before hydration',await handoff.evaluate(()=>{window.__bootPointers=[...window.__activeEarlyPointers];return window.__bootPointers.length>0;}));
 release();await handoff.locator('#hero-wire[data-wire-owner="react"]').waitFor();
 await handoff.waitForFunction(()=>window.__bootPointers.every(callback=>!window.__activeEarlyPointers.has(callback)));
 check('React handoff removes early listeners in reduced motion',await handoff.evaluate(()=>window.__bootPointers.every(callback=>!window.__activeEarlyPointers.has(callback))));
 await handoffContext.close();
 for(const motion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:motion});const page=await context.newPage();observe(page);
  await page.goto(app,{waitUntil:'domcontentloaded'});await page.locator('#hero-wire[data-wire-owner="react"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('#hero-title .story-text')?.textContent===document.getElementById('hero-title')?.dataset.text&&document.getElementById('hero-actions')?.style.opacity==='1');
  check(`Initial load renders the hero (${motion})`,await page.getByRole('link',{name:'Find my website fit',exact:true}).first().isVisible());
  await page.evaluate(()=>{window.__heroDocument='kept';});
  for(let visit=0;visit<2;visit++){
   await page.getByRole('link',{name:'Get started',exact:true}).filter({visible:true}).click();await page.waitForURL('**/find-your-fit');
   await page.getByRole('link',{name:'Vigil Studios home'}).click();await page.waitForURL(url=>url.pathname==='/');
   await page.locator('#hero-wire[data-wire-owner="react"]').waitFor();
   await page.waitForFunction(()=>document.querySelector('#hero-title .story-text')?.textContent===document.getElementById('hero-title')?.dataset.text&&document.getElementById('hero-actions')?.style.opacity==='1');
   check(`Return ${visit+1} uses client navigation (${motion})`,await page.evaluate(()=>window.__heroDocument==='kept'));
   check(`Return ${visit+1} has inert bootstrap tags (${motion})`,await page.locator('.hero-layer script').evaluateAll(s=>s.length===2&&s.every(e=>e.type==='text/plain')));
   await page.waitForFunction(()=>{const c=document.getElementById('hero-wire');return c&&c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0);});
   check(`Return ${visit+1} draws the wire mark (${motion})`,await page.locator('#hero-wire').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)));
  }
  await page.getByRole('button',{name:'Switch to dark theme',exact:true}).filter({visible:true}).click();
  check(`Theme switching still works (${motion})`,await page.evaluate(()=>document.documentElement.dataset.theme==='dark'));
  await context.close();
 }
 check('No thrown browser errors',errors.length===0);check('No React script or hydration warnings',reactWarnings.length===0);
}finally{await mkdir(out,{recursive:true});await writeFile(`${out}/hero-navigation-results.json`,JSON.stringify({checks,errors,reactWarnings},null,2));await browser.close();}
console.log(JSON.stringify({checks:checks.length,errors,reactWarnings}));
