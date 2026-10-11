/** One-time, idempotent import. Existing staff edits are never overwritten. */
import { randomUUID, createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { EXPRESS_TEMPLATES } from "../lib/constants";
import { parseExpressDraft } from "../lib/vigil/express/document";
import type { Database, Json } from "../types/database.types";

async function importHtml(slug: string) {
 const original=await readFile(path.join(process.cwd(),"public/express-templates",`${slug}.html`),"utf8");
 const assets=path.join(process.cwd(),"public/express-library-media");await mkdir(assets,{recursive:true});
 let html=original;
 for(const match of original.matchAll(/data:image\/(png|jpeg|jpg|webp|avif|gif|svg\+xml);base64,([a-zA-Z0-9+/=]+)/g)) {
  const bytes=Buffer.from(match[2],"base64");const extension=match[1]==="svg+xml"?"svg":match[1]==="jpeg"?"jpg":match[1];
  const file=`${createHash("sha256").update(bytes).digest("hex")}.${extension}`;
  await writeFile(path.join(assets,file),bytes);html=html.split(match[0]).join(`/express-library-media/${file}`);
 }
 return html;
}
async function main() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new Error("Configure the linked Supabase URL and service key before importing.");
 const client=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const manifest=JSON.parse(await readFile(path.join(process.cwd(),"public/design-engine-runtime/manifest.json"),"utf8"));
 for(const [sort_order,template] of EXPRESS_TEMPLATES.entries()) {
  const {data:existing,error:lookup}=await client.from("express_variants").select("id").eq("slug",template.slug).maybeSingle();
  if(lookup)throw lookup;if(existing){console.log(`Retained ${template.slug}`);continue;}
  const id=randomUUID();
  const draft=parseExpressDraft(template.slug==="creator"?{
   ...template,kind:"site",engineVersion:manifest.version,site:{...JSON.parse(await readFile(path.join(process.cwd(),"docs/express/creator-variants/luxe.site.json"),"utf8")),id:`express-${id}`},
  }:{...template,kind:"html",html:await importHtml(template.slug)},id,true);
  const {error}=await client.from("express_variants").insert({id,slug:template.slug,draft:draft as unknown as Json,published:draft as unknown as Json,published_revision:1,sort_order});
  if(error)throw error;console.log(`Published ${template.industry} · ${template.variant}`);
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Import failed");process.exitCode=1;});
