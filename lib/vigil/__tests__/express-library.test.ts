import { readFileSync } from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";
import { parseExpressDraft,blankExpressSite,catalogEntry } from "../express/document";
import { expressHtml,expressRepositoryFiles } from "../express/export";
import { saveProjectSite } from "../professional/workspace";
import { FakeAdmin } from "./fake-admin";
import type { DbClient } from "../types";
import type { ExpressDraft } from "../express/document";
const id="11111111-1111-4111-8111-111111111111";
const luxe=JSON.parse(readFileSync(path.join(process.cwd(),"docs/express/creator-variants/luxe.site.json"),"utf8"));
const draft:ExpressDraft={kind:"site",variant:"Luxe",industry:"Creator",example:"Muse Bennett",description:"Creator portfolio",accent:"#bfa483",site:{...luxe,id:`express-${id}`}};
function stored(published:unknown){return {from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:published?{published}:null,error:null})})})})} as unknown as DbClient;}
describe("Express library documents",()=>{
 it("publishes the authored Luxe composition with all eight sections",()=>{const parsed=parseExpressDraft(draft,id,true);expect(parsed.kind).toBe("site");if(parsed.kind==="site")expect(parsed.site.pages[0].sections).toHaveLength(8);});
 it("isolates variant identities, single-page scope, and customer media",()=>{
  expect(()=>parseExpressDraft(draft,"another",true)).toThrow(/another Express/);
  expect(()=>parseExpressDraft({...draft,site:blankExpressSite(id,"Blank")},id,true)).toThrow(/Add sections/);
  expect(()=>parseExpressDraft({...draft,site:{...draft.site,pages:[...draft.site.pages,draft.site.pages[0]]}},id,true)).toThrow();
  expect(()=>parseExpressDraft({...draft,site:{...draft.site,title:"/_vigil/assets/private.webp"}},id)).toThrow(/private customer/);
 });
 it("escapes embedded JSON and title without changing the parsed document",()=>{
  const edited={...draft,site:{...draft.site,title:"</script><script>alert(1)</script>"}};
  const html=expressHtml(edited,"/runtime",true);expect(html).toContain('data-vigil-page="page-home"');expect(html).toContain('noindex,nofollow');
  const hosted=expressHtml(draft,"/runtime",true,"/express-preview/creator");expect(JSON.parse(hosted.match(/id="vigil-site" type="application\/json">([\s\S]*?)<\/script>/)![1]).pages[0].routeOverride).toBe("/express-preview/creator");
  const json=html.match(/id="vigil-site" type="application\/json">([\s\S]*?)<\/script>/)![1];expect(json).not.toContain("<script>");expect(JSON.parse(json).title).toBe(edited.site.title);
 });
 it("exports the published snapshot with pinned runtime and all selected library media",async()=>{
  const manifest=JSON.parse(readFileSync(path.join(process.cwd(),"public/design-engine-runtime/manifest.json"),"utf8"));
  const files=await expressRepositoryFiles(stored({...draft,engineVersion:manifest.version}),"creator");
  expect(files.some(f=>f.path.endsWith("/client.js"))).toBe(true);expect(files.some(f=>f.path==="site/design-engine-creators/neutral-light-hero.webp")).toBe(true);expect(files.some(f=>f.path==="site/design-engine-creators/neutral-light-hero-640.webp")).toBe(true);
  expect(files.find(f=>f.path==="site/index.html")?.content).toContain('/_vigil/runtime/');
 });
 it("refuses an unpublished or missing variant",async()=>{await expect(expressRepositoryFiles(stored(null),"missing")).rejects.toThrow(/not published/);});
 it("uses an immutable preview slug when a variant is renamed",()=>{expect(catalogEntry("creator",{...draft,variant:"Renamed"}).previewUrl).toBe("/express-preview/creator");});
});

describe("Professional workspace saves",()=>{
 it("isolates customer project documents and rejects stale saves",async()=>{
  const site=blankExpressSite("unused","Client");site.id="project-client-a";
  const fake=new FakeAdmin({projects:[{id:"client-a",kind:"professional",organization_id:"org-a"},{id:"client-b",kind:"professional",organization_id:"org-b"}],websites:[{id:"website-a",project_id:"client-a",organization_id:"org-a"},{id:"website-b",project_id:"client-b",organization_id:"org-b"}],design_workspaces:[{project_id:"client-a",revision:1,site_definition:site},{project_id:"client-b",revision:1,site_definition:{...site,id:"project-client-b"}}]});
  await expect(saveProjectSite(fake.asClient(),"client-b",site,1,"staff",{},fake.asClient())).rejects.toThrow(/different project/);
  await saveProjectSite(fake.asClient(),"client-a",{...site,title:"Saved"},1,"staff",{},fake.asClient());
  expect(fake.rows("design_workspaces")[0]).toMatchObject({revision:2,site_definition:{title:"Saved"}});
  expect(fake.rows("design_workspaces")[1]).toMatchObject({revision:1});
  await expect(saveProjectSite(fake.asClient(),"client-a",site,1,"staff",{},fake.asClient())).rejects.toThrow(/Another editor/);
 });
});
