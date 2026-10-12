import "server-only";
import { z } from "zod";
import type { DbClient } from "../types";
export async function websiteContactCredentials(admin:DbClient,websiteId:string){
 const {data,error}=await admin.rpc('contact_widget_credentials',{p_website:websiteId});
 if(error)throw new Error('Contact credentials unavailable.');
 const parsed=z.object({siteKey:z.string(),secret:z.string()}).safeParse(data);
 if(parsed.success)return parsed.data;
 const {data:automation,error:lookup}=await admin.from('website_contact_automation').select('automatic').eq('website_id',websiteId).maybeSingle();
 if(lookup||automation?.automatic!==false)return null;
 const siteKey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,secret=process.env.TURNSTILE_SECRET_KEY;
 return siteKey&&secret?{siteKey,secret}:null;
}
