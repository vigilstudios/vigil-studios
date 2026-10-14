import {beforeEach,describe,it,expect,vi} from 'vitest';
import {FakeAdmin} from './fake-admin';
const m=vi.hoisted(()=>({context:vi.fn(),role:vi.fn(),client:vi.fn(),admin:vi.fn(),authorize:vi.fn(),info:vi.fn(),sign:vi.fn()}));
vi.mock('@/lib/vigil/auth/session',()=>({requireOrgContextOrThrow:m.context,assertOrgRole:m.role}));
vi.mock('@/lib/supabase/server',()=>({createClient:m.client}));vi.mock('@/lib/supabase/admin',()=>({createAdminClient:m.admin}));
vi.mock('@/lib/vigil/content/service',()=>({authorizeCollection:m.authorize}));
import {PATCH} from '@/app/api/content/[websiteId]/uploads/route';
const site='ba000000-0000-4000-8000-000000000021',collection='ba000000-0000-4000-8000-000000000022',id='ba000000-0000-4000-8000-000000000023',org='owned-org';
const request=()=>new Request(`http://localhost:3000/api/content/${site}/uploads?collection=${collection}`,{method:'PATCH',headers:{origin:'http://127.0.0.1:3000',host:'127.0.0.1:3000','Content-Type':'application/json'},body:JSON.stringify({id})});
const params={params:Promise.resolve({websiteId:site})};let fake:FakeAdmin;
beforeEach(()=>{vi.resetAllMocks();m.context.mockResolvedValue({organization:{id:org},user:{id:'owner'}});m.authorize.mockResolvedValue({website_id:site,module:'portfolio'});m.client.mockResolvedValue({});fake=new FakeAdmin({website_content_media:[{id,website_id:site,organization_id:org,type:'video',ready:false}],project_assets:[{id,organization_id:org,bucket_id:'content-media',object_path:'owned/file.mp4',size_bytes:123,content_type:'video/mp4'}]});const admin=fake.asClient();Object.assign(admin,{storage:{from:()=>({info:m.info,createSignedUrl:m.sign})}});m.admin.mockReturnValue(admin);m.info.mockResolvedValue({data:{size:123,contentType:'video/mp4',metadata:null},error:null});m.sign.mockResolvedValue({data:{signedUrl:'https://store.test/private-preview'},error:null});});
describe('resumable upload completion',()=>{
 it('uses actual storage info fields and makes only the matched reserved video ready',async()=>{const response=await PATCH(request(),params);expect(response.status).toBe(200);expect((await response.json()).media).toMatchObject({id,type:'video'});expect(fake.rows('website_content_media')[0].ready).toBe(true);});
 it('rejects a size or MIME mismatch without marking ready or issuing a preview URL',async()=>{m.info.mockResolvedValue({data:{size:124,contentType:'video/mp4'},error:null});expect((await PATCH(request(),params)).status).toBe(422);expect(fake.rows('website_content_media')[0].ready).toBe(false);expect(m.sign).not.toHaveBeenCalled();});
 it('does not complete a different tenant upload',async()=>{fake.rows('website_content_media')[0].organization_id='foreign-org';expect((await PATCH(request(),params)).status).toBe(403);expect(m.info).not.toHaveBeenCalled();});
});
