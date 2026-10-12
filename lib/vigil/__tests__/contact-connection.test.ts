import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const context=vi.hoisted(()=>({staff:vi.fn()}));
vi.mock('@/lib/vigil/auth/session',()=>({requireStaff:context.staff}));
import {verifyContactConnection} from '../actions/contact-connection';
import {ForbiddenError} from '../auth/errors';
beforeEach(()=>{context.staff.mockReset();context.staff.mockResolvedValue({});vi.stubEnv('CLOUDFLARE_ACCOUNT_ID','a'.repeat(32));vi.stubEnv('CLOUDFLARE_TURNSTILE_API_TOKEN','fixture-private-token');vi.stubEnv('RESEND_API_KEY','fixture-mail');});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('staff-only provider connection check',()=>{
 it('uses only widget GET and returns no credential or widget data',async()=>{const transport=vi.fn(async()=>Response.json({success:true,result:[]}));vi.stubGlobal('fetch',transport);expect(await verifyContactConnection()).toEqual({ok:true,data:undefined});expect(transport).toHaveBeenCalledTimes(1);const [url,options]=transport.mock.calls[0] as unknown as [string,RequestInit];expect(url).toContain('/challenges/widgets?');expect(url).toContain('name%3Avigil-connection-check');expect(options.method).toBe('GET');expect(options.body).toBeUndefined();});
 it('refuses non-staff before reading provider credentials or calling the API',async()=>{context.staff.mockRejectedValue(new ForbiddenError());const transport=vi.fn();vi.stubGlobal('fetch',transport);expect(await verifyContactConnection()).toMatchObject({ok:false,code:'forbidden'});expect(transport).not.toHaveBeenCalled();});
 it('reports missing runtime settings without calling the provider',async()=>{vi.stubEnv('CLOUDFLARE_ACCOUNT_ID','');const transport=vi.fn();vi.stubGlobal('fetch',transport);expect(await verifyContactConnection()).toMatchObject({ok:false,error:expect.stringContaining('redeploy')});expect(transport).not.toHaveBeenCalled();});
 it('returns a sanitized permission failure',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response('fixture-private-token reflected-secret',{status:403})));const result=await verifyContactConnection();expect(result).toMatchObject({ok:false,error:expect.stringContaining('Turnstile Sites Write')});expect(JSON.stringify(result)).not.toContain('fixture-private-token');expect(JSON.stringify(result)).not.toContain('reflected-secret');});
});
