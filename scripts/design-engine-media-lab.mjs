import {createRequire} from 'node:module';import fs from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require('/Users/belierjavier/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1100}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:4398',out='docs/design-engine/media-replacement/evidence';
const entries=[['work.image-expansion','Image Expansion Slider'],['work.image-gallery','Hover Expanding Image Gallery'],['work.apple-cards','Apple Card Carousel'],['work.liquid-glass','Liquid Glass Carousel']];
await page.goto(`${base}/?lab=design`);const design=page.getByRole('region',{name:'Design Lab editor',exact:true}),selected=design.getByLabel('Selected component');await selected.waitFor();
results.push({check:'retired option absent',pass:await selected.locator('option[value="work.glass-lens"]').count()===0});
for(const[id,name]of entries){await selected.selectOption(id);await page.waitForTimeout(200);results.push({check:`Design Lab ${name}`,pass:await design.locator('.vigil-media:visible').count()===1&&await design.locator('.composition-blocked:visible').count()===0});}
await page.screenshot({path:`out/design-lab.png`.replace('out/',`${out}/`)});
for(const[id,name]of entries){
 await page.goto(`${base}/?lab=composition`);await page.evaluate(()=>localStorage.clear());await page.reload();const composer=page.getByRole('region',{name:'Composition Lab editor',exact:true});await composer.getByLabel('Section type',{exact:true}).waitFor();
 await composer.getByLabel('Section type',{exact:true}).selectOption('portfolio');await composer.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(150);
 const title=composer.getByLabel('title',{exact:true});await title.fill(`Custom ${name}`);await title.blur();results.push({check:`add and author ${id}`,pass:(await composer.locator('.vm-heading h2').textContent())===`Custom ${name}`});
 const skin=composer.locator('.lab-preview-choice[data-choice-label="skin"]:visible');await skin.locator('.lab-choice-trigger').click();await skin.locator('[data-choice-value="site"]').click();await page.waitForTimeout(100);results.push({check:`custom style ${id}`,pass:await composer.locator('.vigil-media').getAttribute('data-skin')==='site'});
 await composer.getByRole('tab',{name:'Site',exact:true}).click();await composer.getByRole('button',{name:'Save local draft',exact:true}).click();await page.reload();await composer.locator('.vigil-media').waitFor();
 const saved=await page.evaluate(()=>localStorage.getItem('vigil-design-engine:site:v1'));results.push({check:`reload authored ${id}`,pass:!!saved&&saved.includes(`Custom ${name}`)&&JSON.parse(saved).pages.some(p=>p.sections.some(s=>s.component===id&&s.skin==='site'))&&await composer.locator('.vigil-media').getAttribute('data-skin')==='site'});
}
await page.screenshot({path:`${out}/composition-lab.png`});fs.writeFileSync(`${out}/lab.json`,JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors},null,2));await browser.close();if(errors.length||results.some(r=>!r.pass))process.exitCode=1;
