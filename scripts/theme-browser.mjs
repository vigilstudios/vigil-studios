import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { writeFile, mkdir, copyFile, unlink, rmdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'docs/theme-refresh/evidence');
const app=process.env.THEME_QA_APP || 'http://127.0.0.1:3190';
if(!['localhost','127.0.0.1'].includes(new URL(app).hostname))throw Error('Use a local development server for the temporary fixture.');
const fixtureDir=path.join(root,'app/(vigil)/theme-preview');
const fixture=path.join(fixtureDir,'page.tsx');
await mkdir(out,{recursive:true});
await mkdir(fixtureDir,{recursive:true});
await copyFile(path.join(root,'docs/theme-refresh/dashboard-fixture.tsx'),fixture,constants.COPYFILE_EXCL);
const checks=[],errors=[],reactWarnings=[];
function check(name,pass){checks.push({name,pass:!!pass});console.log(`${pass?"PASS":"FAIL"} ${name}`);if(!pass)throw Error(name);}
let browser;
try {
browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce'});
const page=await context.newPage();page.setDefaultNavigationTimeout(120000);page.on('pageerror',e=>{errors.push({message:e.message,stack:e.stack,url:page.url()});console.log('PAGEERROR',e.stack);});
page.on('console',message=>{if(['error','warning'].includes(message.type())&&/Encountered a script tag|hydration|did not match|React component/i.test(message.text()))reactWarnings.push(message.text());});
const theme=()=>page.evaluate(()=>document.documentElement.dataset.theme);
async function settle(){await page.evaluate(()=>document.fonts.ready);const label=await page.evaluate(()=>document.documentElement.dataset.theme==='light'?'Switch to dark theme':'Switch to light theme');await page.getByRole('button',{name:label,exact:true,includeHidden:true}).first().waitFor({state:'attached',timeout:60000});await page.waitForTimeout(700);}
async function capture(name){await page.addStyleTag({content:'nextjs-portal { display:none!important; }'});await page.screenshot({path:`${out}/${name}.png`});}
async function jump(selector){await page.evaluate(s=>{const main=document.getElementById('site-root');main.style.scrollBehavior='auto';main.style.scrollSnapType='none';document.querySelector(s).scrollIntoView({behavior:'instant',block:'start'});},selector);await page.waitForTimeout(800);}
try{
 const response=await page.goto(app,{waitUntil:'domcontentloaded'});await settle();check('Home renders successfully',response.status()===200);check('Fresh light device defaults to light',await theme()==='light');
 check('Home hero uses neutral light surface',await page.locator('.hero-layer').evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(250, 250, 250)');
 check('Light mode main accent is the approved spring green',await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim())==='#12bf60');
 check('Home outline CTA uses the approved green text and border',await page.getByRole('button',{name:'Book a call',exact:true}).first().evaluate(e=>getComputedStyle(e).color==='rgb(18, 191, 96)'&&getComputedStyle(e).borderTopColor==='rgb(18, 191, 96)'));
 await capture('home-light-desktop');
 await page.getByRole('button',{name:'Switch to dark theme',exact:true}).filter({visible:true}).click();await settle();check('Navbar toggle selects dark',await theme()==='dark');await capture('home-dark-desktop');
 await page.reload({waitUntil:"domcontentloaded"});await settle();check('Explicit dark survives reload on a light device',await theme()==='dark');
 await page.goto(`${app}/theme-preview`,{waitUntil:"domcontentloaded"});await settle();check('Marketing preference survives product root navigation',await theme()==='dark');
 await page.goto(app,{waitUntil:'domcontentloaded'});await settle();await page.getByRole('button',{name:'Switch to light theme',exact:true}).filter({visible:true}).click();await settle();check('Navbar toggle restores light',await theme()==='light');
 await page.reload({waitUntil:"domcontentloaded"});await settle();check('Explicit light survives reload',await theme()==='light');
 check('Desktop Get started points to the current website finder',await page.getByRole('link',{name:'Get started',exact:true}).filter({visible:true}).getAttribute('href')==='/find-your-fit');
 await page.getByRole('link',{name:'Get started',exact:true}).filter({visible:true}).click();await page.waitForURL('**/find-your-fit');await page.getByRole('heading',{name:'Where is your business right now?'}).waitFor();
 check('Get started opens the real website-fit questionnaire',await page.getByRole('heading',{name:'Where is your business right now?'}).isVisible());
 await page.getByText('Starting or validating an idea',{exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 check('Website-fit questionnaire advances after an answer',!(await page.getByRole('heading',{name:'Where is your business right now?'}).isVisible()));
 await capture('website-fit-light');await page.goto(app,{waitUntil:'domcontentloaded'});await settle();
 check('Light primary buttons use the brighter spring green',await page.getByRole('link',{name:'Find my website fit',exact:true}).first().evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(18, 191, 96)');
 await jump('#how-it-works');await capture('home-light-walkthrough');
 await jump('#start');await capture('home-light-builds');
 await jump('#why-vigil');await capture('home-light-comparison');
 await jump('#faq');await capture('home-light-faq');
 await page.getByRole('button',{name:/What if/}).first().count();
 await jump('#get-started');await capture('home-light-contact');
 await jump('footer');await capture('home-light-footer');
 await page.goto(`${app}/theme-preview`,{waitUntil:"domcontentloaded"});await settle();check('Dashboard components inherit light preference',await theme()==='light');
 // Match authenticated dashboard chrome; the temporary route is outside /dashboard.
 await page.addStyleTag({content:'.creator-promo-banner{display:none!important}'});
 check('Dashboard canvas is soft gray',await page.locator('.vigil-frame').evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(246, 247, 249)');
 check('Dashboard sidebar is white',await page.locator('.vigil-frame > aside').evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(255, 255, 255)');
 check('Dashboard panels are white',await page.locator('.vigil-frame section').first().evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(255, 255, 255)');
 check('Dashboard primary buttons share the bright home green',await page.getByRole('link',{name:'View website',exact:true}).evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(18, 191, 96)');
 check('Dashboard meters share the bright home green',await page.getByRole('meter').locator('div').first().evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(18, 191, 96)');
 check('Dashboard status text uses the canonical spring green',await page.getByText('Connected',{exact:true}).evaluate(e=>getComputedStyle(e).color)==='rgb(18, 191, 96)');
 for(const [name,file,container,buttonClass] of [['Content Hub','app/(vigil)/dashboard/content/content.css','content-hub','hub-primary'],['Lead Hub','components/vigil/lead-hub.css','lead-hub','btn-primary'],['Premium preview','components/vigil/premium.css','','premium-preview-primary']]){
  await page.addStyleTag({path:path.join(root,file)});
  const colors=await page.locator('.vigil-frame').evaluate((frame,{container,buttonClass})=>{const wrapper=document.createElement('div');wrapper.className=container;const button=document.createElement('button');button.className=buttonClass;wrapper.append(button);frame.append(wrapper);const style=getComputedStyle(button);const colors={fill:style.backgroundColor,text:style.color};wrapper.remove();return colors;},{container,buttonClass});
  check(`${name} primary buttons use matching green and readable text`,colors.fill==='rgb(18, 191, 96)'&&colors.text==='rgb(4, 53, 27)');
 }
 check('Dashboard selected navigation uses the canonical green',await page.getByRole('link',{name:'Overview',exact:true}).evaluate(e=>getComputedStyle(e).color)==='rgb(18, 191, 96)');
 check('Dashboard success pills use the canonical green',await page.getByText('Live',{exact:true}).evaluate(e=>getComputedStyle(e).color)==='rgb(18, 191, 96)');
 await capture('dashboard-light-desktop');
 await page.goto(`${app}/theme-preview?mode=admin`,{waitUntil:'domcontentloaded'});await settle();
 await page.addStyleTag({content:'.creator-promo-banner{display:none!important}'});
 check('Admin frame uses the approved main accent',await page.locator('.vigil-frame').evaluate(e=>getComputedStyle(e).getPropertyValue('--accent').trim())==='#12bf60');
 check('Admin navigation uses the approved green',await page.getByRole('link',{name:'Overview',exact:true}).evaluate(e=>getComputedStyle(e).color)==='rgb(18, 191, 96)');
 check('Admin status text uses the approved green',await page.getByText('Connected',{exact:true}).evaluate(e=>getComputedStyle(e).color)==='rgb(18, 191, 96)');
 check('Admin workspace contains its admin navigation',await page.getByRole('link',{name:'Customers',exact:true}).isVisible());
 await capture('admin-light-desktop');
 await page.goto(`${app}/theme-preview`,{waitUntil:'domcontentloaded'});await settle();
 await page.getByRole('button',{name:'Collapse sidebar'}).click();check('Sidebar collapses in light theme',await page.locator('aside[data-collapsed=true]').count()===1);await page.getByRole('button',{name:'Expand sidebar'}).click();
 await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();await settle();check('Dashboard toggle selects dark',await theme()==='dark');await capture('dashboard-dark-desktop');
 await page.goto(app,{waitUntil:'domcontentloaded'});await settle();check('Product preference survives return to marketing',await theme()==='dark');
 await page.evaluate(()=>localStorage.removeItem('site-theme'));await page.reload({waitUntil:"domcontentloaded"});await settle();check('Cleared preference returns to system light',await theme()==='light');
 await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');await settle();check('Unselected theme follows live device change',await theme()==='dark');
 await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');await settle();check('Unselected theme follows device back to light',await theme()==='light');
 for(const width of [768,390,320]){
  await page.setViewportSize({width,height:844});await page.goto(app,{waitUntil:'domcontentloaded'});await settle();
  check(`Home ${width}px has no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`Home ${width}px has one visible theme control`,await page.getByRole('button',{name:'Switch to dark theme',exact:true}).filter({visible:true}).count()===1);
  await capture(`home-light-${width}`);
  if(width===320){await page.getByRole('button',{name:'Open menu',exact:true}).click();check('Mobile navigation opens alongside theme control',await page.getByRole('button',{name:'Close menu',exact:true}).count()===1);await page.getByRole('button',{name:'Switch to dark theme',exact:true}).filter({visible:true}).click();check('Mobile theme toggle works with menu open',await theme()==='dark');await page.getByRole('button',{name:'Switch to light theme',exact:true}).filter({visible:true}).click();}
  await page.goto(`${app}/theme-preview`,{waitUntil:"domcontentloaded"});await settle();await page.addStyleTag({content:'.creator-promo-banner{display:none!important}'});
  check(`Dashboard ${width}px has no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture(`dashboard-light-${width}`);
  if(width<768){await page.getByRole('button',{name:'Open navigation',exact:true}).click();check(`Dashboard ${width}px drawer opens`,await page.getByRole('dialog',{name:'Navigation'}).isVisible());await capture(`dashboard-light-drawer-${width}`);await page.getByRole('dialog').getByRole('button',{name:'Switch to dark theme'}).click();check(`Dashboard ${width}px drawer toggle works`,await theme()==='dark');await page.getByRole('dialog').getByRole('button',{name:'Switch to light theme'}).click();await page.keyboard.press('Escape');}
 }
 const invalid=await browser.newContext({colorScheme:'light'});await invalid.addInitScript(()=>localStorage.setItem('site-theme','invalid'));const ip=await invalid.newPage();await ip.goto(app,{waitUntil:"domcontentloaded"});check('Invalid saved theme falls back to device preference',await ip.evaluate(()=>document.documentElement.dataset.theme)==='light');await invalid.close();
 const blocked=await browser.newContext({colorScheme:'light'});await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}}));const bp=await blocked.newPage();await bp.goto(app,{waitUntil:"domcontentloaded"});await bp.getByRole('button',{name:'Switch to dark theme'}).filter({visible:true}).waitFor();check('Storage blocked still initializes from device',await bp.evaluate(()=>document.documentElement.dataset.theme)==='light');await bp.getByRole('button',{name:'Switch to dark theme'}).filter({visible:true}).click();check('Storage blocked still permits theme switching',await bp.evaluate(()=>document.documentElement.dataset.theme)==='dark');await blocked.close();
 check('No browser runtime errors',errors.length===0);
 check('No React rendering or hydration warnings',reactWarnings.length===0);
}finally{await writeFile(`${out}/browser-results.json`,JSON.stringify({checks,errors,reactWarnings},null,2));}
}finally{await browser?.close();await unlink(fixture);await rmdir(fixtureDir);await rm(path.join(root,".next/dev/types/app/(vigil)/theme-preview"),{recursive:true,force:true});}
console.log(JSON.stringify({checks:checks.length,errors,reactWarnings}));
