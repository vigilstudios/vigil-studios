import {z} from 'zod';
import {requireOrgContextOrThrow} from '@/lib/vigil/auth/session';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {contentCollections} from '@/lib/vigil/content/service';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{websiteId:string;mediaId:string}>}){
 const {websiteId,mediaId}=await params,url=new URL(request.url),review=url.searchParams.get('review')==='published',headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},unavailable=(status=404)=>new Response('Media unavailable.',{status,headers});
 if(![websiteId,mediaId,url.searchParams.get('collection'),url.searchParams.get('record')].every(v=>z.string().uuid().safeParse(v).success))return unavailable();
 try{const admin=createAdminClient(),{data:site,error}=await admin.from('websites').select('organization_id').eq('id',websiteId).maybeSingle();if(error)throw error;if(!site)return unavailable();
  const draft=url.searchParams.get('draft')==='1';
  if(draft){const ctx=await requireOrgContextOrThrow();if(ctx.organization.id!==site.organization_id)return unavailable();const {data:access,error:gate}=await (await createClient()).rpc('website_content_access',{p_website:websiteId});if(gate||!access)return unavailable();}
  else{const {data:available,error:gate}=await admin.rpc('website_content_delivery',{p_website:websiteId,p_review:review});if(gate)throw gate;if(!available)return unavailable();}
  const collections=await contentCollections(admin,websiteId,site.organization_id,draft?'draft':'published'),c=collections.find(c=>c.id===url.searchParams.get('collection')),r=c?.records.find(r=>r.id===url.searchParams.get('record')&&!r.deleted);
  if(!r||!('media' in r.data)||!r.data.media.some(m=>m.id===mediaId||m.posterId===mediaId))return unavailable();
  const {data:m,error:lookup}=await admin.from('website_content_media').select('id').eq('id',mediaId).eq('website_id',websiteId).eq('organization_id',site.organization_id).eq('ready',true).maybeSingle();if(lookup)throw lookup;if(!m)return unavailable();
  const {data:a,error:assetError}=await admin.from('project_assets').select('object_path,bucket_id').eq('id',m.id).eq('organization_id',site.organization_id).in('bucket_id',['content-media','project-assets']).maybeSingle();if(assetError)throw assetError;if(!a)return unavailable();
  const {data:signed,error:signError}=await admin.storage.from(a.bucket_id).createSignedUrl(a.object_path,60);if(signError)throw signError;
  // Redirect preserves the browser's Range request; Storage serves byte-range video responses.
  return new Response(null,{status:307,headers:{...headers,Location:signed.signedUrl}});
 }catch{return unavailable(503);}
}
