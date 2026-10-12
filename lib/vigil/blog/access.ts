import 'server-only';
import type {DbClient} from '../types';
export async function blogSites(client:DbClient,organizationId:string){
 const {data,error}=await client.from('websites').select('id,name,status,live_url').eq('organization_id',organizationId).order('created_at');if(error)throw error;
 const checks=await Promise.all((data??[]).map(async site=>{const {data:enabled,error:scopeError}=await client.rpc('website_blog_available',{p_website:site.id});if(scopeError)throw scopeError;return enabled?site:null;}));
 return checks.filter((site):site is NonNullable<typeof site>=>site!==null);
}
