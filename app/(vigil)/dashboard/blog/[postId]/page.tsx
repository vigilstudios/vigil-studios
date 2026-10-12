import {createAdminClient} from '@/lib/supabase/admin';
import {readBlogMedia,signedBlogImages} from '@/lib/vigil/blog/images';
import {notFound} from 'next/navigation';
import {z} from 'zod';
import {requireOrgContext} from '@/lib/vigil/auth/session';
import {createClient} from '@/lib/supabase/server';
import {blogSites} from '@/lib/vigil/blog/access';
import {PageHeader} from '@/components/vigil/ui';
import {BlogEditor} from '@/components/vigil/BlogEditor';
export default async function BlogPostEditor({params,searchParams}:{params:Promise<{postId:string}>;searchParams:Promise<{website?:string}>}){
 const ctx=await requireOrgContext('/dashboard/blog'),client=await createClient(),{postId}=await params,{website}=await searchParams;
 const sites=await blogSites(client,ctx.organization.id),site=sites.find(s=>s.id===website);if(!site)notFound();
 if(postId!=='new'&&!z.string().uuid().safeParse(postId).success)notFound();
 const {data:post,error}=postId==='new'?{data:null,error:null}:await client.from('website_blog_posts').select('*').eq('id',z.string().uuid().parse(postId)).eq('website_id',site.id).eq('organization_id',ctx.organization.id).maybeSingle();if(error)throw error;if(postId!=='new'&&!post)notFound();
 const media=readBlogMedia(post?.media),images=await signedBlogImages(createAdminClient(),site.id,ctx.organization.id,media.images);
 return <div><PageHeader title={post?'Edit your post':'A new post'} description={site.name}/><BlogEditor key={`${site.id}:${post?.id??'new'}`} website={site.id} post={post} initialImages={images} initialMedia={media} canWrite={Boolean(ctx.staffRole)||['owner','manager'].includes(ctx.role)}/></div>;
}
