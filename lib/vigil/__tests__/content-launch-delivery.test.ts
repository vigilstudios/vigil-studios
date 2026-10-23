import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeAdmin } from './fake-admin';
import type { DeploymentProvider, DeploymentSnapshot, DomainConfigSnapshot } from '../providers/types';
const dns = vi.hoisted(() => ({ checks: vi.fn() }));
vi.mock('../services/dns', async () => ({ ...await vi.importActual('../services/dns'), checkDnsRecords: dns.checks }));
import { canDeliverPublishedWebsite } from '../content/delivery';
import { verifyDomain } from '../services/domain';
import { finalizeWebsiteLaunch } from '../services/deployment';
const websiteId='site-a',org='org-a',deploymentId='release-a';
function fixture() {
 const fake=new FakeAdmin({
  websites:[{id:websiteId,organization_id:org,status:'building',project_id:'project-a',project:{id:'project-a',kind:'professional'}}],
  projects:[{id:'project-a',status:'approved'}],
  project_review_rounds:[1,2].map(number=>({project_id:'project-a',round_number:number,status:'approved',current_submission_id:`approved-${number}`,approved_submission_id:`approved-${number}`})),
  deployments:[{id:deploymentId,organization_id:org,website_id:websiteId,status:'ready',environment:'production',url:'https://production.example',finished_at:'2026-10-22T23:00:00Z'}],
  domains:[{id:'domain-a',website_id:websiteId,organization_id:org,status:'verifying',hostname:'client.example.com',kind:'subdomain',verification_token:'owner-proof',verification:{source:'provider'}}],
  design_workspaces:[{website_id:websiteId,revision:3,repository_revision:3,repository_commit:'approved-source'}],
  provider_links:[{provider:'vercel',resource_kind:'site',entity_type:'website',entity_id:websiteId,external_id:'project-provider'}, {provider:'vercel',resource_kind:'deployment',entity_type:'deployment',entity_id:deploymentId,external_id:'deployment-provider',metadata:{source_commit:'approved-source'}}],
 });
 const admin=fake.asClient();
 const rpc=vi.fn(async (_name:string, args:{p_review:boolean})=>({data:fake.rows('websites')[0].status==='live'||args.p_review,error:null}));admin.rpc=rpc as unknown as typeof admin.rpc;
 const provider:DeploymentProvider={name:'vercel',provisionSite:vi.fn(),triggerDeployment:vi.fn(),deleteSite:vi.fn(),addDomain:vi.fn(),removeDomain:vi.fn(),
  getDeployment:vi.fn(async():Promise<DeploymentSnapshot>=>({externalId:'deployment-provider',status:'ready',environment:'production',url:'https://production.example',createdAt:null,readyAt:null,error:null})),
  getDomainConfig:vi.fn(async(_site:string,hostname:string):Promise<DomainConfigSnapshot>=>({hostname,verified:true,sslReady:true,misconfigured:false,requiredRecords:[{type:'CNAME',name:'client',value:'target.vercel-dns.com'}],servingSiteId:'project-provider',servingDeploymentId:'deployment-provider'})),
 };
 return {fake,admin,rpc,provider,deliver:(review=false,module:'content'|'blog'='content')=>canDeliverPublishedWebsite(admin,websiteId,review,module,()=>provider)};
}
beforeEach(()=>{dns.checks.mockReset().mockImplementation(async (_host,records)=>records.map((record:unknown)=>({record,ok:true,found:['match']})));});
describe('published content during approved first launch',()=>{
 it('keeps live and explicit published-review delivery on the existing fast path',async()=>{const f=fixture();expect(await f.deliver(true)).toBe(true);expect(f.provider.getDeployment).not.toHaveBeenCalled();f.fake.rows('websites')[0].status='live';expect(await f.deliver()).toBe(true);expect(f.rpc).toHaveBeenLastCalledWith('website_content_delivery',{p_website:websiteId,p_review:false});expect(f.provider.getDomainConfig).not.toHaveBeenCalled();});
 it('allows an approved exact production build with real ownership/DNS/SSL/alias checks without changing state',async()=>{const f=fixture();expect(await f.deliver()).toBe(true);expect(f.fake.rows('websites')[0].status).toBe('building');expect(f.fake.rows('domains')[0].status).toBe('verifying');expect(dns.checks).toHaveBeenCalledWith('client.example.com',expect.arrayContaining([{type:'TXT',name:'_vigil.client',value:'vigil-verify=owner-proof'}]));});
 it('retains the database Blog-scope restriction',async()=>{const f=fixture();f.rpc.mockResolvedValue({data:false,error:null});expect(await f.deliver(false,'blog')).toBe(false);expect(f.rpc.mock.calls.map(call=>call[0])).toEqual(['website_blog_delivery','website_blog_delivery']);expect(f.provider.getDeployment).not.toHaveBeenCalled();});
 it('fails closed on a database eligibility error',async()=>{const f=fixture();f.admin.rpc=vi.fn(async()=>({data:null,error:{message:'unavailable'}})) as unknown as typeof f.admin.rpc;await expect(f.deliver()).rejects.toEqual({message:'unavailable'});});
 it.each(['paused','suspended','archived','provisioning'])('refuses %s even if a stale eligibility check returns true',async status=>{const f=fixture();f.fake.rows('websites')[0].status=status;expect(await f.deliver()).toBe(false);});
 it('requires the latest submission approval in both Professional rounds',async()=>{const f=fixture();f.fake.rows('project_review_rounds')[1].current_submission_id='unapproved';expect(await f.deliver()).toBe(false);expect(f.provider.getDeployment).not.toHaveBeenCalled();});
 it('requires an exact exported and approved design revision',async()=>{const f=fixture();f.fake.rows('design_workspaces')[0].revision=4;expect(await f.deliver()).toBe(false);});
 it('requires the production provider link to match the exported source',async()=>{const f=fixture();f.fake.rows('provider_links')[1].metadata={source_commit:'older-source'};expect(await f.deliver()).toBe(false);});
 it.each(['building','error'])('refuses a %s production build',async status=>{const f=fixture();f.fake.rows('deployments')[0].status=status;expect(await f.deliver()).toBe(false);});
 it('checks actual provider readiness, not only the stored deployment status',async()=>{const f=fixture();vi.mocked(f.provider.getDeployment).mockResolvedValue({...await f.provider.getDeployment('deployment-provider'),status:'building'} as never);expect(await f.deliver()).toBe(false);});
 it('does not accept a ready preview deployment as production',async()=>{const f=fixture();vi.mocked(f.provider.getDeployment).mockResolvedValue({...await f.provider.getDeployment('deployment-provider'),environment:'preview'} as never);expect(await f.deliver()).toBe(false);});
 it.each(['servingSiteId','servingDeploymentId'] as const)('rejects a mismatched %s',async key=>{const f=fixture();const config=await f.provider.getDomainConfig('project-provider','client.example.com');vi.mocked(f.provider.getDomainConfig).mockResolvedValue({...config,[key]:'another-tenant'});expect(await f.deliver()).toBe(false);});
 it.each([{verified:false},{sslReady:false},{misconfigured:true},{requiredRecords:[]}])('refuses incomplete domain configuration %j',async change=>{const f=fixture();const config=await f.provider.getDomainConfig('project-provider','client.example.com');vi.mocked(f.provider.getDomainConfig).mockResolvedValue({...config,...change});expect(await f.deliver()).toBe(false);});
 it('refuses missing ownership proof or nonmatching public DNS',async()=>{const f=fixture();dns.checks.mockResolvedValue([{ok:false}]);expect(await f.deliver()).toBe(false);f.fake.rows('domains')[0].verification_token=null;dns.checks.mockClear();expect(await f.deliver()).toBe(false);expect(dns.checks).not.toHaveBeenCalled();});
 it('requires an active domain attached to this organization and site',async()=>{const f=fixture();f.fake.rows('domains')[0].organization_id='other-org';expect(await f.deliver()).toBe(false);f.fake.rows('domains')[0].organization_id=org;f.fake.rows('domains')[0].status='released';expect(await f.deliver()).toBe(false);});
 it('fails closed when the provider cannot inspect its current association',async()=>{const f=fixture();vi.mocked(f.provider.getDomainConfig).mockRejectedValue(new Error('provider unavailable'));await expect(f.deliver()).rejects.toThrow('provider unavailable');});
 it('breaks the homepage/content cycle and promotes only after the real HTTPS check',async()=>{const f=fixture();let homepageChecks=0;const result=await verifyDomain(f.admin,'domain-a',f.provider,{checkDns:dns.checks,checkHttps:async()=>{homepageChecks++;expect(f.fake.rows('websites')[0].status).toBe('building');return f.deliver();}});expect(result.connected).toBe(true);expect(homepageChecks).toBe(1);expect(f.fake.rows('websites')[0].status).toBe('building');expect(await finalizeWebsiteLaunch(f.admin,websiteId,deploymentId)).toBe(true);expect(f.fake.rows('websites')[0]).toMatchObject({status:'live',live_url:'https://client.example.com'});expect(f.fake.rows('projects')[0].status).toBe('launched');});
 it('never promotes a domain if the homepage still fails',async()=>{const f=fixture();expect((await verifyDomain(f.admin,'domain-a',f.provider,{checkDns:dns.checks,checkHttps:async()=>false})).connected).toBe(false);expect(await finalizeWebsiteLaunch(f.admin,websiteId,deploymentId)).toBe(false);expect(f.fake.rows('websites')[0].status).toBe('building');});
});
