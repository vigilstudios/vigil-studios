import {beforeEach,describe,it,expect,vi} from 'vitest';
import {FakeAdmin} from './fake-admin';
import {ForbiddenError,UnauthenticatedError} from '../auth/errors';
const mocks=vi.hoisted(()=>({context:vi.fn(),role:vi.fn(),client:vi.fn(),admin:vi.fn(),limit:vi.fn(),form:vi.fn(),normalize:vi.fn()}));
vi.mock('@/lib/vigil/auth/session',()=>({requireOrgContextOrThrow:mocks.context,assertOrgRole:mocks.role}));
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.client}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocks.admin}));
vi.mock('@/lib/vigil/rate-limit',()=>({enforceRateLimit:mocks.limit,RATE_LIMITS:{filesOrg:{limit:40,windowSeconds:3600}}}));
vi.mock('@/lib/vigil/blog/image-upload',()=>({boundedImageForm:mocks.form,normalizeBlogImage:mocks.normalize}));
import {POST} from '@/app/api/blog/[websiteId]/images/route';
const site='ba000000-0000-4000-8000-000000000021',org='ba000000-0000-4000-8000-000000000011';
function request(origin='https://vigil.test'){return new Request('https://vigil.test/api/blog/'+site+'/images',{method:'POST',headers:{origin,host:'vigil.test'}});}
const params={params:Promise.resolve({websiteId:site})};
beforeEach(()=>{vi.resetAllMocks();mocks.context.mockResolvedValue({organization:{id:org},user:{id:'user'}});mocks.role.mockResolvedValue(undefined);const fake=new FakeAdmin({websites:[{id:site,organization_id:org,project_id:'project'}]});const client=fake.asClient();client.rpc=vi.fn(async()=>({data:true,error:null})) as unknown as typeof client.rpc;mocks.client.mockResolvedValue(client);});
describe('authenticated image-upload boundary',()=>{
 it('rejects cross-origin requests before accessing a session/body',async()=>{expect((await POST(request('https://attacker.test'),params)).status).toBe(403);expect(mocks.context).not.toHaveBeenCalled();expect(mocks.form).not.toHaveBeenCalled();});
 it('accepts the browser hostname behind the server proxy',async()=>{mocks.form.mockResolvedValue(new FormData());const proxied=new Request('http://localhost:3000/api/blog/'+site+'/images',{method:'POST',headers:{origin:'http://127.0.0.1:3000',host:'localhost:3000','x-forwarded-host':'127.0.0.1:3000'}});expect((await POST(proxied,params)).status).toBe(422);expect(mocks.form).toHaveBeenCalled();});
 it('requires sign-in',async()=>{mocks.context.mockRejectedValue(new UnauthenticatedError());expect((await POST(request(),params)).status).toBe(401);expect(mocks.admin).not.toHaveBeenCalled();});
 it('requires owner/manager authority',async()=>{mocks.role.mockRejectedValue(new ForbiddenError());expect((await POST(request(),params)).status).toBe(403);expect(mocks.form).not.toHaveBeenCalled();});
 it('does not accept a website from another organization',async()=>{const fake=new FakeAdmin({websites:[{id:site,organization_id:'another',project_id:'project'}]});mocks.client.mockResolvedValue(fake.asClient());expect((await POST(request(),params)).status).toBe(403);expect(mocks.form).not.toHaveBeenCalled();});
 it('requires the requested Blog scope before decoding any upload',async()=>{const client=await mocks.client();client.rpc.mockResolvedValue({data:false,error:null});expect((await POST(request(),params)).status).toBe(403);expect(mocks.form).not.toHaveBeenCalled();});
 it('returns validation errors without touching storage',async()=>{mocks.form.mockResolvedValue(new FormData());expect((await POST(request(),params)).status).toBe(422);expect(mocks.admin).not.toHaveBeenCalled();});
});
