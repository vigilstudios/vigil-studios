import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
const account=vi.hoisted(()=>({retrieve:vi.fn()}));
vi.mock('stripe',()=>({default:class{accounts=account;}}));
import { assertLiveStripeAccount } from '../domain-engine/live-providers';
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('VIGIL_DOMAIN_ENGINE_ENABLED','true');vi.stubEnv('VIGIL_DOMAIN_REGISTRAR','namecom');vi.stubEnv('VIGIL_DOMAIN_LIVE_ENABLED','true');vi.stubEnv('VIGIL_DOMAIN_STRIPE_LIVE_KEY','sk_live_fake');vi.stubEnv('VIGIL_DOMAIN_STRIPE_ACCOUNT_ID','acct_fixture');});
afterEach(()=>vi.unstubAllEnvs());
describe('production Stripe account handshake',()=>{
 it('accepts only the exact approved account with charges enabled',async()=>{account.retrieve.mockResolvedValue({id:'acct_fixture',charges_enabled:true,details_submitted:true});await expect(assertLiveStripeAccount()).resolves.toBeUndefined();});
 it.each([{id:'acct_other',charges_enabled:true,details_submitted:true},{id:'acct_fixture',charges_enabled:false,details_submitted:true},{id:'acct_fixture',charges_enabled:true,details_submitted:false}])('refuses a wrong or incomplete billing account',async result=>{account.retrieve.mockResolvedValue(result);await expect(assertLiveStripeAccount()).rejects.toThrow('approved billing account');});
 it('never sends a test key to the production account check',async()=>{vi.stubEnv('VIGIL_DOMAIN_STRIPE_LIVE_KEY','sk_test_fake');await expect(assertLiveStripeAccount()).rejects.toThrow('not configured');expect(account.retrieve).not.toHaveBeenCalled();});
});
