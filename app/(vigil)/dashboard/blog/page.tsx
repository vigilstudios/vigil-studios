import {requireOrgContext} from '@/lib/vigil/auth/session';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {blogSites} from '@/lib/vigil/blog/access';
import {readBlogMedia,signedBlogImages} from '@/lib/vigil/blog/images';
import {BlogLibrary} from '@/components/vigil/BlogLibrary';
import {Card,PageHeader} from '@/components/vigil/ui';
export default async function BlogDashboard(){
 const ctx=await requireOrgContext('/dashboard/blog'),client=await createClient(),sites=await blogSites(client,ctx.organization.id);
 const {data:posts,error}=sites.length?await client.from('website_blog_posts').select('id,website_id,title,excerpt,status,updated_at,published_at,media,deleted_at').eq('organization_id',ctx.organization.id).in('website_id',sites.map(s=>s.id)).order('updated_at',{ascending:false}):{data:[],error:null};if(error)throw error;
 const admin=createAdminClient(),library=await Promise.all((posts??[]).map(async post=>{const media=readBlogMedia(post.media),[cover]=await signedBlogImages(admin,post.website_id,ctx.organization.id,media.images.filter(image=>image.id===media.cover));return {...post,coverUrl:cover?.url,coverAlt:cover?.alt};}));
 const canWrite=Boolean(ctx.staffRole)||['owner','manager'].includes(ctx.role);
 return <div><PageHeader title="Blog" description="Your stories, from the first draft to the final post."/>{sites.length===0?<Card><p>Blog publishing is available for Professional and Growth Sites that requested a blog during onboarding. Ask Vigil to update the scope if your requirements have changed.</p></Card>:<BlogLibrary sites={sites} posts={library} canWrite={canWrite}/>}</div>;
}
