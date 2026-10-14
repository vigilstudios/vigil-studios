import {describe,it,expect,vi} from 'vitest';
import {contentExportFiles} from '../content/export';
import type {DbClient} from '../types';
vi.mock('server-only',()=>({}));
describe('retained content export',()=>{
 it('exports draft, publication, Trash and file references while excluding binding templates and credentials',async()=>{
  const id='ad000000-0000-4000-8000-000000000001',asset='ad000000-0000-4000-8000-000000000002';
  const row={id,slug:'owned-work',deleted:true,featured:false,data:{title:'Owned draft',description:'',category:'',media:[{type:'image',id:asset,src:`/api/content/${id}/media/${asset}`,alt:'Owned photo',caption:''}],link:''}};
  const scoped:string[]=[];const tables:Record<string,unknown[]>={website_content_collections:[{key:'work',module:'portfolio',label:'Portfolio',enabled:false,revision:4,published_revision:3,draft:[row],published:[{...row,deleted:false,data:{...row.data,title:'Published title'}}]}],website_blog_posts:[],project_assets:[{id:asset,file_name:'photo.jpg',content_type:'image/jpeg',size_bytes:123}]};
  const client={from:(table:string)=>{const q={select:()=>q,eq:(field:string,value:string)=>{scoped.push(`${table}:${field}:${value}`);return q;},in:()=>q,then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:tables[table],error:null}).then(resolve)};return q;}} as unknown as DbClient;
  const files=await contentExportFiles(client,id,'owner-org'),raw=files.map(f=>f.content).join(''),snapshot=JSON.parse(String(files[0].content));
  expect(snapshot.collections[0].draft[0].deleted).toBe(true);expect(snapshot.collections[0].published[0].data.title).toBe('Published title');expect(raw).toContain(`media/${asset}`);expect(raw).not.toContain('/api/content');expect(raw).not.toContain('config');
  expect(scoped).toContain(`website_content_collections:website_id:${id}`);expect(scoped).toContain('website_content_collections:organization_id:owner-org');expect(scoped).toContain('project_assets:organization_id:owner-org');
 });
});
