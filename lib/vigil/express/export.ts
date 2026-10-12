import "server-only";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { ExpressDraft } from "./document";
import { parseExpressDraft } from "./document";
import type { DbClient } from "@/lib/vigil/types";
import { ValidationError } from "@/lib/vigil/auth/errors";
import { runtimeManifest } from "@/lib/vigil/professional/workspace";
import { z } from "zod";
import type { SiteDefinition } from "@/design-engine/site/model";
import { serializeSite } from "@/design-engine/site/persistence";
const escape = (value: string) => value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]!);
export function expressHtml(draft: ExpressDraft, runtimeBase: string, preview = false, previewPath?: string, websiteId?: string): string {
 if(draft.kind === "html")return !preview&&websiteId ? bindLegacyContact(draft.html,websiteId) : draft.html;
 const boundSite=websiteId&&!preview ? bindWebsiteInquiryForms(draft.site) : draft.site;
 const site=previewPath ? { ...boundSite, pages: boundSite.pages.map((page,index)=>index===0 ? {...page,routeOverride:previewPath} : page) } : boundSite; const page=site.pages[0];
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.seo.title??site.title)}</title><meta name="description" content="${escape(page.seo.description??draft.description)}"><meta name="robots" content="${preview?"noindex,nofollow":"index,follow"}"><link rel="icon" href="data:,"><link rel="stylesheet" href="${runtimeBase}/client.css"><link rel="stylesheet" href="${runtimeBase}/fonts.css"></head><body><div id="root" data-vigil-page="${escape(page.id)}"${websiteId&&!preview?` data-vigil-contact="https://www.vigilstudios.co/api/contact/${escape(websiteId)}"`:""}></div><script id="vigil-site" type="application/json">${serializeSite(site).replace(/</g,"\\u003c")}</script><script src="${runtimeBase}/client.js" defer></script></body></html>`;
}
/** Bind inquiry forms at the host boundary; newsletter/marketing consent remain separate. */
export function bindWebsiteInquiryForms(site:SiteDefinition):SiteDefinition {
 const copy=structuredClone(site);
 for(const page of copy.pages)for(const section of page.sections){
  if(section.component!=="contact.inquiry")continue;
  const form=section.content.form;
  if(form){form.submission={mode:"host",integration:"inquiries"};form.successMessage="Your inquiry was received. Appointments are confirmed separately.";}
 }
 return copy;
}
/** Live HTML export adds only an explicit host adapter; authored artwork/styles stay intact. */
export function bindLegacyContact(html:string,websiteId:string):string {
 z.string().uuid().parse(websiteId);
 const endpoint=`https://www.vigilstudios.co/api/contact/${websiteId}`;
 const script=`<script src="https://www.vigilstudios.co/integrations/vigil-contact-v1.js" defer></script><script>document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('form[data-vigil-contact],form#booking-form,form#inquiry-form,form#contact-form').forEach(function(form){VigilContact.mountContactForm(form,${JSON.stringify(endpoint)});});});</script>`;
 return html.includes('</body>')?html.replace('</body>',script+'</body>'):html+script;
}
/** Copy a published snapshot into the customer's repository exactly once. Archived templates remain available to already placed orders. */
export async function expressRepositoryFiles(client: DbClient, slug: string, websiteId?: string) {
 const {data,error}=await client.from("express_variants").select("published").eq("slug",slug).maybeSingle();
 if(error)throw error;if(!data?.published)throw new ValidationError(`Express variant “${slug}” is not published.`);
 const draft=parseExpressDraft(data.published);
 const files: {path:string;content:string|Buffer}[]=[];
 if(draft.kind === "html")files.push({path:"site/index.html",content:websiteId?bindLegacyContact(draft.html,websiteId):draft.html});
 else {
 if(!draft.engineVersion)throw new ValidationError("Published variant has no pinned engine version.");
 const manifest=await runtimeManifest(websiteId ? undefined : draft.engineVersion);
 files.push({path:"site/index.html",content:expressHtml(draft,`/_vigil/runtime/${manifest.version}`,false,undefined,websiteId)});
 files.push({path:".vigil/express-template.json",content:JSON.stringify({slug,variant:draft.variant,engineVersion:manifest.version,site:draft.site},null,2)});
 for(const file of manifest.files) {
  const bytes=await readFile(path.join(process.cwd(),"public/design-engine-runtime",manifest.version,file.path));
  if(createHash("sha256").update(bytes).digest("hex")!==file.sha256)throw new ValidationError("Pinned template runtime checksum failed.");
  files.push({path:`site/_vigil/runtime/${manifest.version}/${file.path}`,content:bytes});
 }
 }
 // Only paths present in the authored document are copied; public files cannot escape the asset directories.
 const media=new Set<string>();
 const visit=(value:unknown):void=>{
  if(typeof value === "string")for(const match of value.matchAll(/\/(?:design-engine-[a-z0-9-]+|express-library-media|creators|images|assets)\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpg|jpeg|svg|avif|gif|mp4|webm)/g))media.add(match[0]);
  else if(Array.isArray(value))value.forEach(visit);
  else if(value&&typeof value === "object")Object.values(value).forEach(visit);
 };visit(draft.kind === "site" ? draft.site : draft.html);
 const publicRoot=path.join(process.cwd(),"public");
 for(const asset of media) {
  const absolute=path.resolve(publicRoot,asset.slice(1));
  if(!absolute.startsWith(publicRoot+path.sep))throw new ValidationError("Invalid template media path.");
  files.push({path:`site${asset}`,content:await readFile(absolute)});
 }
 return files;
}
