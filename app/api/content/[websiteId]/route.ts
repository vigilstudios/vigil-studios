import {z} from 'zod';
import {createAdminClient} from '@/lib/supabase/admin';
import {contentCollections} from '@/lib/vigil/content/service';
import {publicRecords} from '@/lib/vigil/content/media';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{websiteId:string}>}){
 const {websiteId}=await params,review=new URL(request.url).searchParams.get('review')==='published',headers={'Cache-Control':'no-store','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'};
 if(!z.string().uuid().safeParse(websiteId).success)return Response.json({error:'Content unavailable.'},{status:404,headers});
 try{const admin=createAdminClient(),{data:website,error}=await admin.from('websites').select('organization_id').eq('id',websiteId).maybeSingle();if(error)throw error;if(!website)return Response.json({error:'Content unavailable.'},{status:404,headers});
  const {data:available,error:gate}=await admin.rpc('website_content_delivery',{p_website:websiteId,p_review:review});if(gate)throw gate;if(!available)return Response.json({error:'Content unavailable.'},{status:404,headers});
  const collections=await contentCollections(admin,websiteId,website.organization_id,'published');
  return Response.json({version:1,websiteId,collections:collections.filter(c=>c.binding.module!=='blog').map(c=>({id:c.id,binding:c.binding,revision:c.publishedRevision,records:publicRecords(c.records,websiteId,c.id,review)}))},{headers});
 }catch{return Response.json({error:'Content temporarily unavailable.'},{status:503,headers});}
}
