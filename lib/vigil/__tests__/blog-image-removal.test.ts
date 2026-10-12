import {beforeEach,describe,it,expect,vi} from 'vitest';
import {FakeAdmin} from './fake-admin';
import {ForbiddenError} from '../auth/errors';
const mocks=vi.hoisted(()=>({context:vi.fn(),role:vi.fn(),client:vi.fn(),admin:vi.fn(),remove:vi.fn(),legacy:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/vigil/auth/session',()=>({requireOrgContextOrThrow:mocks.context,assertOrgRole:mocks.role}));
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.client}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocks.admin,hasAdminClient:()=>true}));
import {removeProjectAsset} from '../actions/onboarding';
const org='ba000000-0000-4000-8000-000000000011',id='ba000000-0000-4000-8000-000000000041';
let fake:FakeAdmin;
beforeEach(()=>{vi.resetAllMocks();mocks.context.mockResolvedValue({organization:{id:org}});mocks.role.mockResolvedValue(undefined);mocks.remove.mockResolvedValue({error:null});mocks.legacy.mockResolvedValue({error:null});fake=new FakeAdmin({project_assets:[{id,organization_id:org,bucket_id:'blog-images',object_path:'untrusted-metadata.webp'}],website_blog_images:[{id,organization_id:org,object_path:'verified-server-path.webp'}]});const client=fake.asClient();Object.defineProperty(client,'storage',{value:{from:()=>({remove:mocks.legacy})}});mocks.client.mockResolvedValue(client);mocks.admin.mockReturnValue({storage:{from:()=>({remove:mocks.remove})}});});
describe('Blog image library removal',()=>{
 it('cleans the correct bucket using immutable server registration, never client file metadata',async()=>{expect((await removeProjectAsset(id)).ok).toBe(true);expect(mocks.remove).toHaveBeenCalledWith(['verified-server-path.webp']);expect(mocks.legacy).not.toHaveBeenCalled();});
 it('blocks cross-tenant asset IDs before deleting data',async()=>{mocks.context.mockResolvedValue({organization:{id:'other'}});expect((await removeProjectAsset(id)).ok).toBe(false);expect(fake.rows('project_assets')).toHaveLength(1);expect(mocks.remove).not.toHaveBeenCalled();});
 it('requires owner/manager permission for Blog media removal',async()=>{mocks.role.mockRejectedValue(new ForbiddenError());expect((await removeProjectAsset(id)).ok).toBe(false);expect(mocks.remove).not.toHaveBeenCalled();});
 it('keeps the object when database references protect an attached image',async()=>{const client=fake.asClient(),original=fake.from.bind(fake);client.from=((table:string)=>{const q=original(table),run=q.run.bind(q);q.run=()=>table==='project_assets'&&q._mode==='delete'?{data:null,error:{code:'23503',message:'FK'}}:run();return q;}) as unknown as typeof client.from;const result=await removeProjectAsset(id);expect(result).toEqual({ok:false,error:'Remove this image from its Blog posts and save them before deleting the file.',code:'validation',issues:{}});expect(mocks.remove).not.toHaveBeenCalled();});
 it('does not use a forged unregistered asset path for service-role storage removal',async()=>{fake.rows('website_blog_images').splice(0);expect((await removeProjectAsset(id)).ok).toBe(true);expect(mocks.remove).not.toHaveBeenCalled();expect(mocks.legacy).not.toHaveBeenCalled();});
});
