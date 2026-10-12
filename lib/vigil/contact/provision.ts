import "server-only";
import { createHash,randomUUID } from "node:crypto";
import { z } from "zod";
import type { DbClient,ProvisioningJob } from "../types";
import { ContactCloudflare,ContactProvisioningError,contactConnectionReady } from "./cloudflare";

export function contactWidgetName(projectUrl:string,websiteId:string){
 let host:string;try{host=new URL(projectUrl).hostname;}catch{throw new ContactProvisioningError('Configure the Supabase project URL before contact setup.');}
 return `vigil-${createHash('sha256').update(host).digest('hex').slice(0,12)}-${websiteId}`;
}
const claimSchema=z.object({claimed:z.boolean(),status:z.string().optional(),organization_id:z.string().uuid().optional(),origins:z.array(z.string().url()).optional(),creation_started:z.boolean().optional()});
export async function provisionWebsiteContact(admin:DbClient,job:ProvisioningJob,options?:{provider:ContactCloudflare;projectUrl:string;connected:boolean}):Promise<{status:string}>{
 const website=job.website_id,generation=(job.payload as {generation?:number}|null)?.generation,token=randomUUID();
 if(!website||!Number.isInteger(generation)||generation!<1)throw new ContactProvisioningError('Contact setup requires a website and valid revision.');
 const fail=async(status:'waiting_connection'|'queued'|'failed'|'review_required',message:string)=>{
  const {error}=await admin.rpc('contact_setup_failed',{p_website:website,p_generation:generation!,p_token:token,p_status:status,p_error:message});
  if(error)throw new ContactProvisioningError('Contact setup state could not be saved.',false,true);
 };
 if(!(options?.connected??contactConnectionReady())){await fail('waiting_connection','Connect Cloudflare account credentials and Resend in the production environment.');return {status:'waiting_connection'};}
 try{
  const {data,error}=await admin.rpc('claim_contact_setup',{p_website:website,p_generation:generation!,p_token:token});
  if(error)throw new ContactProvisioningError('Contact setup lease could not be acquired.',false,true);
  const claim=claimSchema.safeParse(data);if(!claim.success)throw new ContactProvisioningError('Contact setup lease could not be verified.',false,true);
  if(!claim.data.claimed){if(claim.data.status==='busy')throw new ContactProvisioningError('Another worker is configuring this website.',false,true);return {status:claim.data.status??'superseded'};}
  if(claim.data.organization_id!==job.organization_id||!claim.data.origins?.length)throw new ContactProvisioningError('Contact setup website ownership could not be verified.',true);
  const origins=claim.data.origins,domains=[...new Set(origins.map(origin=>new URL(origin).hostname))].sort();
  const provider=options?.provider??new ContactCloudflare(process.env.CLOUDFLARE_ACCOUNT_ID!,process.env.CLOUDFLARE_TURNSTILE_API_TOKEN!);
  const name=contactWidgetName(options?.projectUrl??process.env.NEXT_PUBLIC_SUPABASE_URL??'',website);
  const {data:link,error:lookupError}=await admin.from('provider_links').select('external_id,metadata').eq('entity_type','website').eq('entity_id',website).eq('provider','cloudflare').eq('resource_kind','turnstile_widget').maybeSingle();
  if(lookupError)throw new ContactProvisioningError('Existing widget association could not be read.',false,true);
  if(link&&(link.metadata as {account_id?:string})?.account_id!==provider.account)throw new ContactProvisioningError('This website belongs to a different Cloudflare account. Review before changing accounts.',true);
  const key=link?.external_id??await provider.find(name);
  let widget;
  if(key){
   const existing=await provider.get(key);
   if(existing.name!==name)throw new ContactProvisioningError('The linked widget identity changed. Review before replacing it.',true);
   widget=await provider.save(name,domains,key);
  }else{
   if(claim.data.creation_started)throw new ContactProvisioningError('A previous widget creation was interrupted. No matching widget is visible; review Cloudflare before retrying.',true);
   const {error:markError}=await admin.rpc('mark_contact_widget_creation',{p_website:website,p_token:token});
   if(markError)throw new ContactProvisioningError('Widget creation lease could not be confirmed.',false,true);
   widget=await provider.save(name,domains);
  }
  const {data:active,error:saveError}=await admin.rpc('finish_contact_setup',{p_website:website,p_generation:generation!,p_token:token,p_sitekey:widget.sitekey,p_secret:widget.secret,p_account:provider.account,p_origins:origins});
  if(saveError)throw new ContactProvisioningError('Widget setup could not be committed. Retry to recover the existing widget.',false,true);
  return {status:active===true?'ready':'superseded'};
 }catch(error){
  const safe=error instanceof ContactProvisioningError?error:new ContactProvisioningError('Contact setup could not complete. Retry to recover the existing widget.',false,true);
  await fail(safe.review?'review_required':safe.retryable&&job.attempts<job.max_attempts?'queued':'failed',safe.message);
  throw safe;
 }
}
export async function reconcileContactSetup(admin:DbClient){
 if(!contactConnectionReady())return 0;
 const {data,error}=await admin.rpc('reconcile_contact_setup',{p_limit:20});
 if(error)throw new ContactProvisioningError('Contact setup reconciliation could not run.',false,true);
 return data;
}
