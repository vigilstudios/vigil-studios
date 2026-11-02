/** Opt-in integration check. Requires the disposable loopback Supabase stack. */
import {randomUUID,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {createClient} from '@supabase/supabase-js';
import type {Database,Json} from '@/types/database.types';
import {brandSchema,offeringsSchema} from '../onboarding/brief';
import {ensureOnboardingCatalog} from '../content/onboarding-catalog';
import {contentCollections,ensureProfessionalBindings,saveCollection} from '../content/service';
import {siteFromComposition} from '@/design-engine/site/model';
import {makeCommerceSection} from '@/design-engine/preview/commerce-fixtures';
import {makeTeamSection} from '@/design-engine/preview/team-fixture';
import {GET as runtimePage} from '@/app/api/content/[websiteId]/runtime/[runtimeId]/[pageId]/route';
import {GET as publishedMedia} from '@/app/api/content/[websiteId]/media/[mediaId]/route';

vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>admin}));
let admin:ReturnType<typeof createClient<Database>>;
const enabled=process.env.VIGIL_CONTENT_RELEASE_E2E==='1';
const org=randomUUID(),project=randomUUID(),website=randomUUID(),runtime=randomUUID(),images=[randomUUID(),randomUUID()];
const paths=images.map(id=>`${org}/${project}/${id}.webp`);
let actor:string|undefined;
function checked<T extends {data:unknown;error:unknown}>(result:T):T['data']{if(result.error)throw result.error;return result.data;}

describe.skipIf(!enabled)('isolated real Files → Content Hub → published renderer',()=>{
 beforeAll(async()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Never allow this fixture to create records in a hosted or customer database.
  if(new URL(url).hostname!=='127.0.0.1'||new URL(url).port!=='55431')throw Error('Use the disposable loopback Supabase stack.');
  admin=createClient<Database>(url,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const user=checked(await admin.auth.admin.createUser({email:`content-release-${org}@example.test`,password:randomUUID()+randomUUID(),email_confirm:true}));if(!user.user)throw Error('Fixture account was not created.');actor=user.user.id;
  checked(await admin.from('organizations').insert({id:org,name:'Disposable content release check',slug:`content-release-${org}`}));
  checked(await admin.from('organization_members').insert({organization_id:org,user_id:actor,role:'owner',status:'active'}));
  const offerings=offeringsSchema.parse({noun:'products',sections:[{id:'audio',name:'Audio',items:[{id:'headphones',name:'Studio headphones',description:'Private product photos',price:'$149',imageAssetIds:images}]}]});
  const brand=brandSchema.parse({team:{enabled:true,members:[{id:randomUUID(),name:'Sample team member',role:'Founder',bio:'Fictional release test profile.',imageAssetIds:[images[0]]}]}});
  checked(await admin.from('projects').insert({id:project,organization_id:org,name:'Disposable content test',kind:'professional',brief:{offerings,brand} as unknown as Json,intake_completed_at:new Date().toISOString()}));
  checked(await admin.from('websites').insert({id:website,organization_id:org,project_id:project,name:'Disposable content test',status:'live'}));
  const plan=checked(await admin.from('plans').select('id').eq('code','care').single());if(!plan)throw Error('Care plan is missing from the fixture.');
  checked(await admin.from('subscriptions').insert({organization_id:org,website_id:website,plan_id:plan.id,status:'active',current_period_end:new Date(Date.now()+3600000).toISOString()}));
  for(let i=0;i<images.length;i++){
   const bytes=readFileSync(i?'public/design-engine-commerce/audio-detail-240.webp':'public/design-engine-commerce/audio-headphones-640.webp');
   checked(await admin.storage.from('project-assets').upload(paths[i],bytes,{contentType:'image/webp',upsert:false}));
   checked(await admin.from('project_assets').insert({id:images[i],organization_id:org,project_id:project,uploaded_by:actor,kind:'photo',bucket_id:'project-assets',object_path:paths[i],file_name:`release-test-${i}.webp`,content_type:'image/webp',size_bytes:bytes.length,checksum:createHash('sha256').update(bytes).digest('hex')}));
  }
 },30000);

 afterAll(async()=>{
  if(!admin)return;
  checked(await admin.storage.from('project-assets').remove(paths));
  checked(await admin.from('websites').delete().eq('id',website));
  checked(await admin.from('subscriptions').delete().eq('organization_id',org));
  checked(await admin.from('projects').delete().eq('id',project));
  checked(await admin.from('organizations').delete().eq('id',org));
  if(actor)checked(await admin.auth.admin.deleteUser(actor));
 },30000);

 it('imports the original private files, preserves drafts, publishes through actual service/RPC validation and serves HTML/media',async()=>{
  await ensureOnboardingCatalog(admin,website,org);
  const imported=await contentCollections(admin,website,org);
  expect(imported.map(c=>c.binding.module).sort()).toEqual(['products','team']);
  expect(imported.every(c=>c.config.deliveryPending&&c.publishedRevision===null)).toBe(true);
  const site=siteFromComposition({id:'release',label:'Release check',site:{brand:{theme:'neutral'},typography:'neo-grotesk',artDirection:'precision',motion:'restrained',icons:{id:'core',strokeWidth:1.5}},sections:[makeCommerceSection('commerce.catalog-ledger','products','audio'),makeTeamSection('team')]});
  const connected=await ensureProfessionalBindings(admin,website,org,site);
  expect(connected).toHaveLength(2);
  expect(connected.every(c=>!c.config.deliveryPending&&c.publishedRevision===null)).toBe(true);
  expect(connected.find(c=>c.binding.module==='products')!.id).toBe(imported.find(c=>c.binding.module==='products')!.id);
  checked(await admin.from('website_content_runtimes').insert({id:runtime,website_id:website,organization_id:org,site_definition:site as unknown as Json,engine_version:JSON.parse(readFileSync('public/design-engine-runtime/manifest.json','utf8')).version,binding_keys:connected.map(c=>c.binding.key)}));
  const products=connected.find(c=>c.binding.module==='products')!,team=connected.find(c=>c.binding.module==='team')!;
  const edited=structuredClone(products.records);edited[0].data.title='Published QA headphones';
  const draft=await saveCollection(admin,org,actor!,products.id,products.revision,edited,'draft');
  expect((await contentCollections(admin,website,org,'published')).find(c=>c.id===products.id)!.records).toEqual([]);
  await saveCollection(admin,org,actor!,products.id,draft.revision,edited,'publish');
  await saveCollection(admin,org,actor!,team.id,team.revision,team.records,'publish');
  const response=await runtimePage(new Request(`http://127.0.0.1/content/${website}`),{params:Promise.resolve({websiteId:website,runtimeId:runtime,pageId:site.pages[0].id})});
  expect(response.status).toBe(200);const html=await response.text();
  expect(html).toContain('Published QA headphones');expect(html).toContain('Sample team member');expect(html).toContain(images[0]);
  const image=await publishedMedia(new Request(`http://127.0.0.1/media?collection=${products.id}&record=${edited[0].id}`),{params:Promise.resolve({websiteId:website,mediaId:images[0]})});
  expect(image.status).toBe(307);
  const bytes=await fetch(image.headers.get('Location')!);expect(bytes.status).toBe(200);
  expect(Buffer.from(await bytes.arrayBuffer())).toEqual(readFileSync('public/design-engine-commerce/audio-headphones-640.webp'));
  const denied=await publishedMedia(new Request(`http://127.0.0.1/media?collection=${randomUUID()}&record=${edited[0].id}`),{params:Promise.resolve({websiteId:website,mediaId:images[0]})});expect(denied.status).toBe(404);
  await ensureOnboardingCatalog(admin,website,org);
  expect((await contentCollections(admin,website,org)).find(c=>c.id===products.id)!.records[0].data.title).toBe('Published QA headphones');
  expect(checked(await admin.from('project_assets').select('id').eq('organization_id',org))).toHaveLength(2);
  expect(checked(await admin.from('website_content_media').select('id').eq('website_id',website))).toHaveLength(2);
 },60000);
});
