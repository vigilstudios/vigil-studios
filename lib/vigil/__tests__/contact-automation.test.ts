import { afterEach,describe,expect,it,vi } from 'vitest';
import { ContactCloudflare,ContactProvisioningError,contactConnectionReady } from '../contact/cloudflare';
import { contactWidgetName,provisionWebsiteContact,reconcileContactSetup } from '../contact/provision';
import { websiteContactCredentials } from '../contact/credentials';
import { handleContact } from '../contact/http';
import { FakeAdmin } from './fake-admin';
import type { ProvisioningJob } from '../types';
const website='cb000000-0000-4000-8000-000000000021',organization='cb000000-0000-4000-8000-000000000011',account='a'.repeat(32),projectUrl='https://fixture.supabase.co',origins=['https://client.example.com'];
const name=contactWidgetName(projectUrl,website);
const widget={sitekey:'fixture-key',secret:'fixture-secret-do-not-log',name,domains:['client.example.com'],mode:'managed',clearance_level:'no_clearance'};
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('Cloudflare contract and recovery',()=>{
 it('scopes widget identity to database project and website',()=>{expect(name).not.toBe(contactWidgetName('https://sandbox.supabase.co',website));expect(name).not.toBe(contactWidgetName(projectUrl,organization));});
 it('creates a managed hostname-scoped widget with no pre-clearance',async()=>{
  const fetcher=vi.fn(async()=>Response.json({success:true,result:widget}));const provider=new ContactCloudflare(account,'fixture-token',fetcher);
  expect(await provider.save(name,widget.domains)).toEqual(widget);const [url,init]=fetcher.mock.calls[0] as unknown as [string,RequestInit];expect(url).toMatch(/\/challenges\/widgets$/);expect(JSON.parse(init.body as string)).toEqual({name,domains:widget.domains,mode:'managed',clearance_level:'no_clearance'});expect(init.method).toBe('POST');
 });
 it('paginates lookup and exact-matches names despite substring filtering',async()=>{
  const transport=vi.fn(async(url:RequestInfo|URL)=>Response.json({success:true,result:String(url).includes('page=1&')?Array.from({length:100},(_,i)=>({name:name+'-other',sitekey:'other'+i})):[{name,sitekey:widget.sitekey}],result_info:{total_count:101}}));
  expect(await new ContactCloudflare(account,'fixture-token',transport).find(name)).toBe(widget.sitekey);expect(transport).toHaveBeenCalledTimes(2);
 });
 it('rejects duplicate exact identities',async()=>{
  const transport=vi.fn(async()=>Response.json({success:true,result:[{name,sitekey:'key-a'},{name,sitekey:'key-b'}]}));await expect(new ContactCloudflare(account,'fixture-token',transport).find(name)).rejects.toMatchObject({review:true});
 });
 it.each([401,403,400,429,500])('redacts provider error body for HTTP %s',async(status)=>{
  const transport=vi.fn(async()=>new Response(widget.secret,{status}));const provider=new ContactCloudflare(account,'fixture-token',transport);
  try{await provider.save(name,widget.domains);throw new Error('expected refusal');}catch(error){expect(error).toBeInstanceOf(ContactProvisioningError);expect(String(error)).not.toContain(widget.secret);expect(String(error)).not.toContain('fixture-token');expect((error as ContactProvisioningError).retryable).toBe(status===429||status>=500);}
 });
 it('redacts network exceptions including reflected tokens',async()=>{const provider=new ContactCloudflare(account,'fixture-token',async()=>{throw new Error('fixture-token '+widget.secret);});await expect(provider.find(name)).rejects.toThrow('Cloudflare could not be reached');});
 it('rejects success without credentials or with mismatched hostnames',async()=>{
  for(const result of [{...widget,secret:undefined},{...widget,domains:['attacker.example.com']},{...widget,mode:'invisible'},{...widget,clearance_level:'interactive'}]){
   await expect(new ContactCloudflare(account,'fixture-token',async()=>Response.json({success:true,result})).save(name,widget.domains)).rejects.toBeInstanceOf(ContactProvisioningError);
  }
 });
 it('updates the same sitekey instead of creating on domain changes',async()=>{const transport=vi.fn(async()=>Response.json({success:true,result:widget}));await new ContactCloudflare(account,'fixture-token',transport).save(name,widget.domains,widget.sitekey);expect((transport.mock.calls[0] as unknown as [string,RequestInit])[1].method).toBe('PUT');});
 it('bounds provider hostname and lookup limits',async()=>{
  const transport=vi.fn(async()=>Response.json({success:true,result:Array.from({length:100},(_,i)=>({name:'unrelated',sitekey:'key'+i})),result_info:{total_count:1001}}));const provider=new ContactCloudflare(account,'fixture-token',transport);
  await expect(provider.find(name)).rejects.toMatchObject({review:true});expect(transport).toHaveBeenCalledTimes(10);await expect(provider.save(name,Array.from({length:11},(_,i)=>`site${i}.example.com`))).rejects.toMatchObject({review:true});
 });
});
function fixture({creation=false,linked=false,claimStatus='',active=true}={}){
 const fake=new FakeAdmin({provider_links:linked?[{entity_type:'website',entity_id:website,provider:'cloudflare',resource_kind:'turnstile_widget',external_id:widget.sitekey,metadata:{account_id:account}}]:[]});const admin=fake.asClient();
 const rpc=vi.fn(async(command:string)=>({data:command==='claim_contact_setup'?(claimStatus?{claimed:false,status:claimStatus}:{claimed:true,organization_id:organization,origins,creation_started:creation}):command==='finish_contact_setup'?active:null,error:null}));admin.rpc=rpc as unknown as typeof admin.rpc;
 const job={website_id:website,organization_id:organization,payload:{generation:1},attempts:1,max_attempts:8} as unknown as ProvisioningJob;
 const provider=new ContactCloudflare(account,'fixture-token');vi.spyOn(provider,'find').mockResolvedValue(null);vi.spyOn(provider,'get').mockResolvedValue(widget);vi.spyOn(provider,'save').mockResolvedValue(widget);
 return {fake,admin,rpc,job,provider,options:{provider,connected:true,projectUrl}};
}
describe('durable contact provisioning',()=>{
 it('missing connection records a waiting state without provider calls or notification',async()=>{const f=fixture();expect(await provisionWebsiteContact(f.admin,f.job,{...f.options,connected:false})).toEqual({status:'waiting_connection'});expect(f.provider.find).not.toHaveBeenCalled();expect(f.rpc).toHaveBeenCalledWith('contact_setup_failed',expect.objectContaining({p_status:'waiting_connection'}));});
 it('creates once and keeps secrets out of job results',async()=>{const f=fixture();const result=await provisionWebsiteContact(f.admin,f.job,f.options);expect(result).toEqual({status:'ready'});expect(JSON.stringify(result)).not.toContain(widget.secret);expect(f.rpc.mock.calls.map(([command])=>command)).toEqual(['claim_contact_setup','mark_contact_widget_creation','finish_contact_setup']);});
 it('recovers a widget after uncertain creation without another POST',async()=>{const f=fixture({creation:true});vi.mocked(f.provider.find).mockResolvedValue(widget.sitekey);expect(await provisionWebsiteContact(f.admin,f.job,f.options)).toEqual({status:'ready'});expect(f.rpc.mock.calls.some(([command])=>command==='mark_contact_widget_creation')).toBe(false);expect(f.provider.save).toHaveBeenCalledWith(name,widget.domains,widget.sitekey);});
 it('never creates when a previous creation is uncertain and lookup has no match',async()=>{const f=fixture({creation:true});await expect(provisionWebsiteContact(f.admin,f.job,f.options)).rejects.toMatchObject({review:true});expect(f.provider.save).not.toHaveBeenCalled();expect(f.rpc).toHaveBeenCalledWith('contact_setup_failed',expect.objectContaining({p_status:'review_required'}));});
 it('reuses linked widget and refuses account changes',async()=>{const f=fixture({linked:true});await provisionWebsiteContact(f.admin,f.job,f.options);expect(f.provider.find).not.toHaveBeenCalled();f.fake.rows('provider_links')[0].metadata={account_id:'b'.repeat(32)};await expect(provisionWebsiteContact(f.admin,f.job,f.options)).rejects.toMatchObject({review:true});});
 it('waits for a busy lease and skips superseded launch revisions',async()=>{const f=fixture({claimStatus:'busy'});await expect(provisionWebsiteContact(f.admin,f.job,f.options)).rejects.toMatchObject({retryable:true});expect(f.provider.find).not.toHaveBeenCalled();const old=fixture({claimStatus:'superseded'});expect(await provisionWebsiteContact(old.admin,old.job,old.options)).toEqual({status:'superseded'});});
 it('does not announce activation when origins changed during setup',async()=>{const f=fixture({active:false});expect(await provisionWebsiteContact(f.admin,f.job,f.options)).toEqual({status:'superseded'});});
 it('sanitizes unknown failures and marks exhausted retries failed',async()=>{const f=fixture();vi.mocked(f.provider.find).mockRejectedValue(new Error(widget.secret));f.job.attempts=8;await expect(provisionWebsiteContact(f.admin,f.job,f.options)).rejects.toThrow('Contact setup could not complete');expect(f.rpc).toHaveBeenCalledWith('contact_setup_failed',expect.objectContaining({p_status:'failed',p_error:expect.not.stringContaining(widget.secret)}));});
 it('does not reconcile until all required connection settings exist',async()=>{vi.stubEnv('CLOUDFLARE_ACCOUNT_ID','');vi.stubEnv('CLOUDFLARE_TURNSTILE_API_TOKEN','');const f=fixture();expect(contactConnectionReady()).toBe(false);expect(await reconcileContactSetup(f.admin)).toBe(0);expect(f.rpc).not.toHaveBeenCalled();});
});
describe('per-website credentials',()=>{
 it('cannot fall back to global keys during automatic setup',async()=>{const f=fixture();f.fake.rows('website_contact_automation').push({website_id:website,automatic:true});vi.stubEnv('TURNSTILE_SECRET_KEY','global-secret');vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY','global-key');expect(await websiteContactCredentials(f.admin,website)).toBeNull();});
 it('serves the public sitekey while keeping website secret server-side',async()=>{
  const f=fixture();f.fake.rows('website_contact_settings').push({website_id:website,organization_id:organization,enabled:true,allowed_origins:origins,booking_url:null});f.fake.rows('websites').push({id:website,organization_id:organization,status:'live'});f.fake.rows('organizations').push({id:organization,archived_at:null});
  const response=await handleContact(new Request('https://www.vigilstudios.co/api/contact/'+website,{headers:{origin:origins[0]}}),website,{admin:()=>f.admin,secret:()=>undefined,siteKey:()=>undefined,credentials:async()=>({siteKey:widget.sitekey,secret:widget.secret}),verify:async()=>true});
  expect(response.status).toBe(200);expect(await response.json()).toEqual({websiteId:website,siteKey:widget.sitekey,bookingUrl:null});
 });
});
