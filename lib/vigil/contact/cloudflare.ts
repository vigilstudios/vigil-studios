import "server-only";
import { ProviderError } from "../auth/errors";
import { z } from "zod";

const widgetSchema = z.object({sitekey:z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),secret:z.string().min(10).max(256),name:z.string(),domains:z.array(z.string()),mode:z.string(),clearance_level:z.string()});
export type ContactWidget = z.infer<typeof widgetSchema>;
export class ContactProvisioningError extends ProviderError {
 constructor(message:string,public review=false,retryable=false){super('Cloudflare',message,{retryable});}
}
export function contactConnectionReady(){
 return /^[a-f0-9]{32}$/.test(process.env.CLOUDFLARE_ACCOUNT_ID??'') && Boolean(process.env.CLOUDFLARE_TURNSTILE_API_TOKEN) && Boolean(process.env.RESEND_API_KEY);
}
/** No provider response body, request headers or underlying network exception reaches logs. */
export class ContactCloudflare {
 constructor(readonly account:string,private token:string,private transport:typeof fetch=fetch){
  if(!/^[a-f0-9]{32}$/.test(account)||!token)throw new ContactProvisioningError('Connect the Cloudflare account and Turnstile Sites Write token.');
 }
 private async request(method:string,path:string,body?:unknown):Promise<{result:unknown;result_info?:{total_count?:number;count?:number}}>{
  let response:Response;
  try{response=await this.transport(`https://api.cloudflare.com/client/v4/accounts/${this.account}/challenges/widgets${path}`,{method,headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(8000)});}catch{throw new ContactProvisioningError('Cloudflare could not be reached. Retry setup to recover any existing widget.',false,true);}
  if(!response.ok){
   if(response.status===401||response.status===403)throw new ContactProvisioningError('Check the Cloudflare account and account-scoped Turnstile Sites Write permission.');
   if(response.status===429)throw new ContactProvisioningError('Cloudflare request limit reached. Setup will retry.',false,true);
   throw new ContactProvisioningError(response.status>=500?'Cloudflare is temporarily unavailable.':'Cloudflare rejected setup. Check widget quota and hostname configuration.',false,response.status>=500);
  }
  let data:unknown;try{data=await response.json();}catch{throw new ContactProvisioningError('Cloudflare returned an unreadable response.',false,true);}
  const parsed=z.object({success:z.literal(true),result:z.unknown(),result_info:z.object({total_count:z.number().optional(),count:z.number().optional()}).optional()}).safeParse(data);
  if(!parsed.success)throw new ContactProvisioningError('Cloudflare did not confirm setup. Check account permissions and widget quota.');
  return {result:parsed.data.result,result_info:parsed.data.result_info};
 }
 async find(name:string):Promise<string|null>{
  const keys=new Set<string>();
  for(let page=1;page<=10;page++){
   const query=new URLSearchParams({filter:`name:${name}`,page:String(page),per_page:'100'});
   const data=await this.request('GET',`?${query}`);
   const parsed=z.array(z.object({name:z.string(),sitekey:z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/)})).safeParse(data.result);
   if(!parsed.success)throw new ContactProvisioningError('Cloudflare widget lookup could not be verified.',true);
   for(const item of parsed.data)if(item.name===name)keys.add(item.sitekey);
   if(keys.size>1)throw new ContactProvisioningError('Multiple widgets match this website. Staff must resolve the duplicate before retrying.',true);
   if(parsed.data.length<100 && (data.result_info?.total_count??0)<=page*100)return [...keys][0]??null;
   if(data.result_info?.total_count!==undefined&&data.result_info.total_count<=page*100)return [...keys][0]??null;
  }
  throw new ContactProvisioningError('Widget lookup exceeded the safe page limit. Review the account before retrying.',true);
 }
 private widget(result:unknown){const parsed=widgetSchema.safeParse(result);if(!parsed.success)throw new ContactProvisioningError('Cloudflare widget credentials could not be verified.',true);return parsed.data;}
 async get(sitekey:string){return this.widget((await this.request('GET',`/${encodeURIComponent(sitekey)}`)).result);}
 async save(name:string,domains:string[],sitekey?:string){
  if(domains.length<1||domains.length>10||domains.some(d=>!/^([a-z0-9][a-z0-9-]*\.)+[a-z]{2,63}$/.test(d)))throw new ContactProvisioningError('Register between one and ten verified public hostnames.',true);
  const widget=this.widget((await this.request(sitekey?'PUT':'POST',sitekey?`/${encodeURIComponent(sitekey)}`:'',{name,domains,mode:'managed',clearance_level:'no_clearance'})).result);
  if(widget.name!==name||widget.mode!=='managed'||widget.clearance_level!=='no_clearance'||[...widget.domains].sort().join(',')!==[...domains].sort().join(',')||(sitekey&&widget.sitekey!==sitekey))throw new ContactProvisioningError('Cloudflare did not confirm the intended hostname configuration.',true);
  return widget;
 }
}
