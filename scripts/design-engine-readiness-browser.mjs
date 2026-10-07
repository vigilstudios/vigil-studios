import {createRequire} from "node:module";
import fs from "node:fs";
const require=createRequire(import.meta.url),{chromium}=require("/Users/belierjavier/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");
const out="docs/design-engine/readiness-import/evidence";fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[],audits=[],interactions=[];
page.on("pageerror",error=>{errors.push(error.message);fs.writeFileSync(`${out}/errors-live.json`,JSON.stringify(errors,null,2));});page.on("console",event=>{if(event.type()==="error")errors.push(event.text());});
const base="http://127.0.0.1:4397",cases=[
 ["editorial","component=cta.editorial&actions&longActions"],["signal","component=cta.signal&actions&longActions"],
 ["contact","component=contact.inquiry&actions"],["sitemap","component=footer.sitemap&siteTree&actions"],
 ["compact","component=footer.compact&siteTree&actions"],["split","component=footer.split&siteTree&actions"],
 ["banner","component=footer.banner&siteTree&actions"],["expand","component=work.expand-rail"],
 ["cards","component=work.card-rail"],["glass","component=work.liquid-glass"],
 ["reverse-cta","component=cta.signal&structure=reverse&actions&fullActions"],
 ["image-strips","component=work.expand-rail&structure=image-strips"],
 ["coverflow","component=work.card-rail&structure=coverflow"],
 ["social","component=contact.inquiry&structure=social&actions"],
];
async function settle(){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll("img")].map(image=>{image.loading="eager";return image.decode().catch(()=>{});}));});await page.waitForTimeout(120);}
async function measure(){return page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.querySelectorAll("img")].filter(i=>i.getClientRects().length&&(!i.complete||!i.naturalWidth)).map(i=>i.src),clippedCopy:[...document.querySelectorAll(".de-ending-heading h2,.de-footer-map h3,.de-ending-field input,.de-ending-field textarea,.de-ending-field select,.de-ending .de-action")].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent,client:e.clientWidth,scroll:e.scrollWidth})),duplicateIds:[...document.querySelectorAll("[id]")].map(e=>e.id).filter((id,i,list)=>list.indexOf(id)!==i)}));}
for(const[name,query]of cases){
 for(const width of [1920,1440,1280,1024,768,390,320]){
  await page.setViewportSize({width,height:1000});await page.goto(`${base}/?${query}`);await settle();results.push({name,...await measure()});
  if((width===1440||width===390)&&!name.startsWith("reverse"))await page.locator(".de-ending").first().screenshot({path:`${out}/${name}-${width}.png`});
  if((width===1440||width===320)&&!name.startsWith("reverse")){
   await page.addScriptTag({url:`${base}/axe.js`});
   const audit=await page.evaluate(async()=>{const r=await axe.run(".de-ending",{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
   audits.push({name,width,violations:audit});
  }
 }
 console.log(`Responsive ${name}`);
}
for(const[name,query]of cases.slice(0,10)){
 for(const[type,art]of [["editorial","publication"],["neo-grotesk","precision"],["humanist","salon"],["technical","precision"],["fashion","runway"],["brutalist","billboard"],["luxury","gallery"]]){
  await page.setViewportSize({width:320,height:1000});await page.goto(`${base}/?${query}&type=${type}&art=${art}&contentLength=long`);await settle();results.push({name,type,art,long:true,...await measure()});
 }
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto(`${base}/?${query}`);await settle();results.push({name,reduced:true,...await measure()});await page.emulateMedia({reducedMotion:"no-preference"});
}
for(const component of ["work.expand-rail","work.card-rail","work.liquid-glass"])for(const width of [1440,1024,320]){
 await page.setViewportSize({width,height:1000});await page.goto(`${base}/?component=${component}&maximum`);await settle();results.push({name:component,maximum:true,...await measure()});
}
await page.setViewportSize({width:1440,height:1000});
await page.goto(`${base}/?component=work.expand-rail`);await settle();const triggers=page.locator(".de-expand-trigger"),second=triggers.nth(1);await second.focus();await page.keyboard.press("Enter");interactions.push({check:"rail keyboard",pass:await second.getAttribute("aria-expanded")==="true"});
await page.setViewportSize({width:320,height:900});await page.goto(`${base}/?component=work.expand-rail`);await settle();await page.locator(".de-expand-trigger").nth(2).click();interactions.push({check:"rail touch/click",pass:await page.locator(".de-expand-trigger").nth(2).getAttribute("aria-expanded")==="true"});
await page.setViewportSize({width:1440,height:1000});await page.goto(`${base}/?component=work.card-rail`);await settle();const inspect=page.getByRole("button",{name:/^Inspect /}).first();await inspect.click();interactions.push({check:"inspection dialog",pass:await page.locator("dialog").evaluate(e=>e.open)&&await page.locator("dialog button").evaluate(e=>e===document.activeElement)});await page.keyboard.press("Escape");interactions.push({check:"dialog focus restoration",pass:await inspect.evaluate(e=>e===document.activeElement)});await page.getByRole("button",{name:"Next image",exact:true}).click();await page.waitForTimeout(700);interactions.push({check:"card navigation",pass:(await page.locator('.de-gallery-controls [role="status"]').textContent()).startsWith("2")});
const filter=page.locator('[aria-label="Gallery categories"] button').nth(1);await filter.click();interactions.push({check:"category filter",pass:await filter.getAttribute("aria-pressed")==="true"});
await page.goto(`${base}/?component=work.card-rail&structure=coverflow`);await settle();await page.getByRole("button",{name:"Next image",exact:true}).click();await page.waitForTimeout(700);interactions.push({check:"coverflow centered navigation",pass:(await page.locator('.de-gallery-controls [role="status"]').textContent()).startsWith("2")&&await page.locator('.de-gallery-card[data-active="true"]').count()===1});

for(const form of ["success","failure","missing"]){
 await page.goto(`${base}/?component=contact.inquiry&form=${form}`);await settle();
 const submit=page.locator('.de-ending-form button[type="submit"]');
 if(form==="missing"){interactions.push({check:"unconnected host",pass:await submit.isDisabled()});continue;}
 await page.getByLabel("Your name",{exact:false}).fill("QA visitor");await page.getByLabel("Email",{exact:false}).fill("qa@example.com");await page.getByLabel("Project or inquiry details",{exact:false}).fill("A test inquiry with real browser validation.");await page.getByLabel("I agree to be contacted",{exact:false}).check();await submit.click();await page.waitForTimeout(300);
 const text=await page.locator(".de-ending-form").textContent();interactions.push({check:`form ${form}`,pass:text.includes(form==="success"?"Your inquiry was received.":"Fixture server rejected this inquiry.")});
}
await page.goto(`${base}/?site`);await settle();interactions.push({check:"footer outside main",pass:await page.locator("main footer").count()===0&&await page.locator("footer").count()===1});
fs.writeFileSync(`${out}/browser.json`,JSON.stringify({results,audits,interactions,errors},null,2));
const summary={layoutChecks:results.length,overflows:results.filter(r=>r.overflow).length,clippedCopy:results.filter(r=>r.clippedCopy.length).length,duplicateIds:results.filter(r=>r.duplicateIds.length).length,brokenMedia:results.filter(r=>r.brokenImages.length).length,accessibilityAudits:audits.length,failedAudits:audits.filter(a=>a.violations.length).length,interactions,errors};
console.log(JSON.stringify(summary,null,2));await browser.close();if(summary.overflows||summary.clippedCopy||summary.duplicateIds||summary.brokenMedia||summary.failedAudits||errors.length||interactions.some(i=>!i.pass))process.exitCode=1;
