import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeAdmin } from './fake-admin';
const mocks=vi.hoisted(()=>({verify:vi.fn(),finalize:vi.fn(),mail:vi.fn()}));
vi.mock('../services/domain',()=>({verifyDomain:mocks.verify,beginDomainVerification:vi.fn()}));
vi.mock('../services/deployment',()=>({finalizeWebsiteLaunch:mocks.finalize,deployWebsite:vi.fn(),provisionWebsite:vi.fn(),syncDeployment:vi.fn()}));
vi.mock('../email',async()=>({...await vi.importActual('../email'),sendEmail:mocks.mail}));
import { runDueJobs } from '../jobs';
import { ProviderError } from '../auth/errors';
function fixture(payload:{deployment_id?:string}={},attempts=0){return new FakeAdmin({provisioning_jobs:[{id:'job',kind:'domain.verify',organization_id:'org',website_id:'site',domain_id:'domain',payload,idempotency_key:'verify-domain',status:'queued',attempts,max_attempts:5,scheduled_for:'2026-01-01T00:00:00Z',created_by:null}]});}
beforeEach(()=>{vi.clearAllMocks();mocks.verify.mockResolvedValue({connected:true,deploymentId:'verified-current-production'});mocks.finalize.mockResolvedValue(true);mocks.mail.mockResolvedValue({sent:true,id:'test'});});
describe('final domain verification completes the launch',()=>{
 it.each([{}, {deployment_id:'old-production'}])('promotes the verified deployment from a manual or stale job %j',async payload=>{const fake=fixture(payload);expect((await runDueJobs(fake.asClient(),{worker:'test',limit:1}))[0].status).toBe('succeeded');expect(mocks.finalize).toHaveBeenCalledWith(fake.asClient(),'site','verified-current-production');expect(fake.rows('provisioning_jobs').filter(row=>row.kind==='website.deployment.notify')).toHaveLength(1);expect(mocks.mail).not.toHaveBeenCalled();});
 it('does not claim launch or enqueue a launch notice while another domain is unfinished',async()=>{const fake=fixture();mocks.finalize.mockResolvedValue(false);await runDueJobs(fake.asClient(),{worker:'test',limit:1});expect(fake.rows('provisioning_jobs')).toHaveLength(1);expect(mocks.mail).not.toHaveBeenCalled();});
 it('keeps checking expected DNS waiting without exhausting the failure budget',async()=>{const fake=fixture({},4);mocks.verify.mockResolvedValue({connected:false});const before=Date.now();expect((await runDueJobs(fake.asClient(),{worker:'test',limit:1}))[0].status).toBe('queued');expect(fake.rows('provisioning_jobs')[0]).toMatchObject({status:'queued',attempts:4});expect(new Date(String(fake.rows('provisioning_jobs')[0].scheduled_for)).getTime()).toBeGreaterThanOrEqual(before+15*60*1000);expect(mocks.finalize).not.toHaveBeenCalled();expect(mocks.mail).not.toHaveBeenCalled();});
 it('still stops real provider failures when their budget is exhausted',async()=>{const fake=fixture({},4);mocks.verify.mockRejectedValue(new ProviderError('vercel','provider failed',{retryable:true}));expect((await runDueJobs(fake.asClient(),{worker:'test',limit:1}))[0].status).toBe('failed');expect(fake.rows('provisioning_jobs')[0].attempts).toBe(5);expect(mocks.finalize).not.toHaveBeenCalled();});
});
