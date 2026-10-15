import {beforeEach,describe,it,expect,vi} from 'vitest';
import {FakeAdmin} from './fake-admin';
const m=vi.hoisted(()=>({client:vi.fn(),bucket:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:m.client}));
vi.mock('react',()=>({cache:(fn:unknown)=>fn}));
import {getProjectAssets} from '@/lib/vigil/queries/onboarding';
let fake:FakeAdmin;
beforeEach(()=>{vi.resetAllMocks();fake=new FakeAdmin({project_assets:[{id:'video',project_id:'project',bucket_id:'project-assets',object_path:'org/project/original.mov',kind:'video',file_name:'original.mov',content_type:'video/quicktime',size_bytes:100,caption:null},{id:'poster',project_id:'project',bucket_id:'content-media',object_path:'org/project/poster.webp',kind:'photo',file_name:'poster.webp',content_type:'image/webp',size_bytes:10,caption:null},{id:'foreign',project_id:'other',bucket_id:'project-assets',object_path:'org/other/foreign.mov'}]});const client=fake.asClient();Object.assign(client,{storage:{from:m.bucket}});m.client.mockResolvedValue(client);m.bucket.mockImplementation(bucket=>({createSignedUrls:vi.fn(async(paths:string[])=>({data:paths.map(path=>({path,signedUrl:`https://private.test/${bucket}/${path}`})),error:null}))}));});
describe('Files previews with uploaded videos and generated posters',()=>{
 it('signs each original and poster in its own bucket without including another project',async()=>{const result=await getProjectAssets('project');expect(result).toHaveLength(2);expect(result[0].url).toBe('https://private.test/project-assets/org/project/original.mov');expect(result[1].url).toBe('https://private.test/content-media/org/project/poster.webp');expect(m.bucket.mock.calls.map(c=>c[0])).toEqual(['project-assets','content-media']);});
 it('does not confuse equal object paths in distinct buckets',async()=>{fake.rows('project_assets')[1].object_path='org/project/original.mov';const rows=await getProjectAssets('project');expect(rows[0].url).toContain('/project-assets/');expect(rows[1].url).toContain('/content-media/');});
 it('keeps other previews available if one bucket cannot sign',async()=>{const working=m.bucket.getMockImplementation()!;m.bucket.mockImplementation(bucket=>bucket==='content-media'?{createSignedUrls:async()=>({data:null,error:{message:'Unavailable'}})}:working(bucket));const rows=await getProjectAssets('project');expect(rows[0].url).toContain('/project-assets/');expect(rows[1].url).toBeNull();});
});
