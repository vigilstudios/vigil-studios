import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { contactSubmissionSchema, validBookingUrl } from "../contact/contract";
import { handleContact, readBoundedJson, submissionFingerprint, verifyTurnstile, type ContactDependencies } from "../contact/http";
import { notifyWebsiteLead } from "../contact/notify";
import { ProviderError } from "../auth/errors";
import { FakeAdmin } from "./fake-admin";
import type { ProvisioningJob } from "../types";
import { submitWebsiteInquiry } from "../contact/browser";
const site="ca000000-0000-4000-8000-000000000021",org="ca000000-0000-4000-8000-000000000011",leadId="ca000000-0000-4000-8000-000000000031";
const input={submissionId:leadId,captchaToken:"challenge-token",name:"A visitor",email:"visitor@example.com",message:"A project inquiry",source:"inquiries",sourcePage:"https://client.example.com/contact?email=private#token",details:{type:"Collaboration"}};
function fixtures(){
 const fake=new FakeAdmin({website_contact_settings:[{website_id:site,organization_id:org,enabled:true,allowed_origins:["https://client.example.com"],notification_email:"client@example.com",booking_url:"https://calendly.com/client/intro"}],websites:[{id:site,organization_id:org,status:"live"}],organizations:[{id:org,archived_at:null}]});
 const client=fake.asClient();const rpc=vi.fn(async(name:string)=>({data:name==='rate_limit'?true:leadId,error:null}));client.rpc=rpc as unknown as typeof client.rpc;
 const deps:ContactDependencies={admin:()=>client,secret:()=>"fixture-production-style-secret",siteKey:()=>"fixture-production-style-sitekey",verify:vi.fn(async()=>true)};
 return {fake,client,rpc,deps};
}
function request(body:unknown=input,origin="https://client.example.com",method="POST"){
 return new Request(`https://www.vigilstudios.co/api/contact/${site}`,{method,headers:{Origin:origin,"Content-Type":"application/json"},...(method==='POST'?{body:JSON.stringify(body)}:{})});
}
afterEach(()=>vi.unstubAllGlobals());
describe("shared contact HTTP contract",()=>{
 it("saves only to the server registry, strips source secrets and returns a receipt, not delivery",async()=>{
  const {deps,rpc}=fixtures();const response=await handleContact(request(),site,deps);
  expect(response.status).toBe(202);expect(await response.json()).toEqual({ok:true,status:'received'});
  expect(deps.verify).toHaveBeenCalledWith('challenge-token','client.example.com','unknown','fixture-production-style-secret');
  const capture=rpc.mock.calls.find(([name])=>name==='capture_website_lead');expect(capture).toBeDefined();
  const args=(capture as unknown as [string,Record<string,unknown>])[1];
  expect(args.p_website).toBe(site);expect(args.p_page).toBe('https://client.example.com/contact');expect(args).not.toHaveProperty('organization_id');expect(args).not.toHaveProperty('recipient');
 });
 it.each([{...input,organization_id:org},{...input,to:'attacker@example.com'},{...input,recipient:'attacker@example.com'},{...input,message:''},{...input,name:'Header\r\nInjection'},{...input,email:'bad'},{...input,sourcePage:'https://other.example.com/'},{...input,details:Object.fromEntries(Array.from({length:9},(_,i)=>['field-'+i,'x']))}])('rejects forged or malformed payload %#',async(body)=>{
  const {deps,rpc}=fixtures();expect((await handleContact(request(body),site,deps)).status).toBe(422);expect(rpc).not.toHaveBeenCalledWith('capture_website_lead',expect.anything());
 });
 it.each(['https://attacker.example.com','null','http://client.example.com','https://client.example.com/'])('rejects unregistered origin %s',async(origin)=>{
  const {deps,rpc}=fixtures();expect((await handleContact(request(input,origin),site,deps)).status).toBe(403);expect(rpc).not.toHaveBeenCalled();
 });
 it("rejects invalid CAPTCHA without saving",async()=>{
  const {deps,rpc}=fixtures();deps.verify=vi.fn(async()=>false);expect((await handleContact(request(),site,deps)).status).toBe(403);expect(rpc.mock.calls.some(([name])=>name==='capture_website_lead')).toBe(false);
 });
 it("fails closed when CAPTCHA, limiter or database is unavailable",async()=>{
  for(const kind of ['captcha','limiter','admin']){
   const {deps,rpc}=fixtures();if(kind==='captcha')deps.verify=async()=>{throw new Error('network');};if(kind==='admin')deps.admin=()=>{throw new Error('missing secret');};if(kind==='limiter')rpc.mockResolvedValue({data:null,error:{message:'unavailable'}} as never);
   expect((await handleContact(request(),site,deps)).status).toBe(503);
  }
 });
 it("enforces a distributed limit before CAPTCHA",async()=>{
  const {deps,rpc}=fixtures();rpc.mockResolvedValue({data:false,error:null} as never);const response=await handleContact(request(),site,deps);expect(response.status).toBe(429);expect(response.headers.get('Retry-After')).toBe('600');expect(deps.verify).not.toHaveBeenCalled();
 });
 it.each(['disabled','paused','archived','wrong-org'])('rejects inactive registration: %s',async(kind)=>{
  const {deps,fake}=fixtures();if(kind==='disabled')fake.rows('website_contact_settings')[0].enabled=false;if(kind==='paused')fake.rows('websites')[0].status='paused';if(kind==='archived')fake.rows('organizations')[0].archived_at=new Date().toISOString();if(kind==='wrong-org')fake.rows('websites')[0].organization_id='other';
  expect((await handleContact(request(),site,deps)).status).toBe(403);
 });
 it.each([undefined,'1x0000000000000000000000000000000AA'])('never activates missing/dummy Turnstile credentials',async(secret)=>{
  const {deps,rpc}=fixtures();deps.secret=()=>secret;expect((await handleContact(request(),site,deps)).status).toBe(503);expect(rpc).not.toHaveBeenCalled();
 });
 it("exposes only public config and grants CORS for registered origins",async()=>{
  const {deps}=fixtures();const response=await handleContact(request(undefined,undefined,'GET'),site,deps);expect(await response.json()).toEqual({websiteId:site,siteKey:'fixture-production-style-sitekey',bookingUrl:'https://calendly.com/client/intro'});expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://client.example.com');expect((await handleContact(request(undefined,undefined,'OPTIONS'),site,deps)).status).toBe(204);
 });
 it("bounds a streamed body even without content-length",async()=>{
  const big=request({...input,message:'x'.repeat(20_000)});expect((await handleContact(big,site,fixtures().deps)).status).toBe(413);
  await expect(readBoundedJson(new Request('https://example.com',{method:'POST',body:'{}'}))).rejects.toMatchObject({status:415});
 });
 it("deduplicates normalized payload fingerprints independently of CAPTCHA and detail order",()=>{
  const a=contactSubmissionSchema.parse(input),b={...a,captchaToken:'fresh-token',details:{...a.details}};
  expect(submissionFingerprint(a)).toBe(submissionFingerprint(b));expect(submissionFingerprint({...b,message:'changed'})).not.toBe(submissionFingerprint(a));
 });
 it("verifies hostname and action, not success alone",async()=>{
  const fetched=vi.fn(async()=>Response.json({success:true,hostname:'client.example.com',action:'contact'}));vi.stubGlobal('fetch',fetched);
  expect(await verifyTurnstile('token','client.example.com','unknown','fixture')).toBe(true);
  expect(await verifyTurnstile('token','other.example.com','unknown','fixture')).toBe(false);
  fetched.mockImplementation(async()=>Response.json({success:true,hostname:'client.example.com',action:'login'}));expect(await verifyTurnstile('token','client.example.com','unknown','fixture')).toBe(false);
 });
});
function mailFixtures(){
 const fake=new FakeAdmin({leads:[{id:leadId,website_id:site,organization_id:org,contact:{name:'<script>bad</script>',email:'visitor@example.com',details:{type:'<img>'}},message:'Hello <b>world</b>'}],lead_notifications:[{lead_id:leadId,organization_id:org,recipient:'client@example.com',status:'queued',attempts:0,first_attempt_at:null,message:null,provider_id:null}]});
 const job={organization_id:org,website_id:site,payload:{lead_id:leadId},attempts:1,max_attempts:8} as unknown as ProvisioningJob;
 const client=fake.asClient();
 client.rpc=vi.fn(async(_name,args)=>{
  const row=fake.rows('lead_notifications')[0];row.status='sent';row.provider_id=(args as {p_provider:string}).p_provider;row.sent_at=new Date().toISOString();row.last_error=null;
  fake.rows('lead_events').push({kind:'notification_sent'});return {data:undefined,error:null};
 }) as unknown as typeof client.rpc;
 return {fake,job,client};
}
describe('durable lead notification',()=>{
 beforeEach(()=>vi.unstubAllGlobals());
 it('escapes markup, sends only the configured destination and records provider acceptance',async()=>{
  const {fake,client,job}=mailFixtures(),transport=vi.fn(async()=> 'mail_1');await notifyWebsiteLead(client,job,transport);
  const [message,key]=transport.mock.calls[0] as unknown as [{to:string[];html:string;subject:string},string];expect(message.to).toEqual(['client@example.com']);expect(message.html).toContain('&lt;script&gt;');expect(message.html).not.toContain('<script>');expect(key).toBe('lead-notify/'+leadId);expect(fake.rows('lead_notifications')[0].status).toBe('sent');expect(fake.rows('lead_events')[0].kind).toBe('notification_sent');
 });
 it('preserves lead on failure, retries with immutable payload/key and keeps attempt history',async()=>{
  const {fake,client,job}=mailFixtures(),transport=vi.fn().mockRejectedValueOnce(new ProviderError('resend','temporarily unavailable',{retryable:true})).mockResolvedValue('mail_2');
  await expect(notifyWebsiteLead(client,job,transport)).rejects.toThrow();expect(fake.rows('leads')).toHaveLength(1);expect(fake.rows('lead_notifications')[0].status).toBe('queued');
  fake.rows('leads')[0].message='edited by staff';await notifyWebsiteLead(client,{...job,attempts:2},transport);
  expect(transport.mock.calls[0]).toEqual(transport.mock.calls[1]);expect(fake.rows('lead_notifications')[0].attempts).toBe(2);expect(fake.rows('lead_events').map(e=>e.kind)).toEqual(['notification_failed','notification_sent']);
 });
 it('marks terminal failure, keeps the inquiry and does not turn a missing provider into success',async()=>{
  const {fake,client,job}=mailFixtures();await expect(notifyWebsiteLead(client,{...job,attempts:8},async()=>{throw new ProviderError('resend','configuration missing',{retryable:true});})).rejects.toThrow();expect(fake.rows('lead_notifications')[0].status).toBe('failed');expect(fake.rows('leads')).toHaveLength(1);
 });
 it('requires review beyond provider deduplication window',async()=>{
  const {fake,client,job}=mailFixtures(),transport=vi.fn(async()=>'duplicate');fake.rows('lead_notifications')[0].first_attempt_at=new Date(Date.now()-24*3600_000).toISOString();await expect(notifyWebsiteLead(client,job,transport)).rejects.toThrow('window expired');expect(transport).not.toHaveBeenCalled();expect(fake.rows('lead_notifications')[0].status).toBe('review_required');
 });
 it('never resends a sent notification or accepts a forged tenant job',async()=>{
  const {fake,client,job}=mailFixtures(),transport=vi.fn(async()=>'duplicate');fake.rows('lead_notifications')[0].status='sent';await notifyWebsiteLead(client,job,transport);expect(transport).not.toHaveBeenCalled();await expect(notifyWebsiteLead(client,{...job,organization_id:'another-org'},transport)).rejects.toThrow('does not match');
 });
});
describe('booking and client boundaries',()=>{
 it.each(['javascript:alert(1)','http://calendly.com/client','https://user:pass@example.com/','https://127.0.0.1/','https://internal/','https://foo.local/'])('rejects unsafe scheduler %s',value=>expect(validBookingUrl(value)).toBe(false));
 it('accepts public HTTPS scheduler links',()=>expect(validBookingUrl('https://calendly.com/client/intro?month=2026-10')).toBe(true));
 it('client never sends without a verification token',async()=>{
  const fetched=vi.fn();vi.stubGlobal('fetch',fetched);await expect(submitWebsiteInquiry('https://www.vigilstudios.co/api/contact/'+site,{name:'Visitor',email:'visitor@example.com',message:'Hello',sourcePage:'https://client.example.com/'},'',leadId)).rejects.toThrow('verification');expect(fetched).not.toHaveBeenCalled();
 });
});

describe('Lab and Express host binding',()=>{
 it('binds live engine inquiry forms without mutating the catalogue, and preserves safe preview markup',async()=>{
  const { makeEndingSection }=await import('@/design-engine/preview/ending-fixtures');
  const {emptyProjectSite}=await import('../professional/document');
  const {bindWebsiteInquiryForms,expressHtml,bindLegacyContact}=await import('../express/export');
  const original=emptyProjectSite('demo','Client site');
  original.pages[0].sections=[makeEndingSection('contact.inquiry','contact')];
  const bound=bindWebsiteInquiryForms(original);
  const form=bound.pages[0].sections[0];if(form.component!=='contact.inquiry')throw new Error('fixture');
  expect(form.content.form?.submission).toEqual({mode:'host',integration:'inquiries'});
  const source=original.pages[0].sections[0];if(source.component!=='contact.inquiry')throw new Error('fixture');expect(source.content.form?.submission.mode).toBe('unavailable');
  const draft={kind:'site' as const,site:original,variant:'Demo',industry:'creator',example:'Client',description:'An inquiry',accent:'#123456'};
  expect(expressHtml(draft,'/runtime',false,undefined,site)).toContain('data-vigil-contact="https://www.vigilstudios.co/api/contact/');
  expect(expressHtml(draft,'/runtime',true,undefined,site)).not.toContain('data-vigil-contact=');
  const html='<html><body><form id="contact-form"><input name="email"></form></body></html>';
  expect(bindLegacyContact(html,site)).toContain('VigilContact.mountContactForm');expect(bindLegacyContact(html,site)).toContain('<form id="contact-form">');
 });
});
