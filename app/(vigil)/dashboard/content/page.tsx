import {featuredPolicy} from '@/lib/vigil/content/featured';
import {notFound} from 'next/navigation';
import {requireOrgContext} from '@/lib/vigil/auth/session';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {contentSites,contentCollections} from '@/lib/vigil/content/service';
import {standaloneMediaPreviews} from '@/lib/vigil/content/preview';
import {mediaPreviews} from '@/lib/vigil/content/media';
import {readBlogMedia,signedBlogImages} from '@/lib/vigil/blog/images';
import {ContentHub} from '@/components/vigil/ContentHub';
import {PageHeader} from '@/components/vigil/ui';
import './content.css';
export default async function ContentDashboard({searchParams}:{searchParams:Promise<{website?:string}>}){
 const ctx=await requireOrgContext('/dashboard/content'),client=await createClient(),sites=await contentSites(client,ctx.organization.id),{website}=await searchParams,site=sites.find(s=>s.id===website)??sites[0];
 if(website&&!sites.some(s=>s.id===website))notFound();
 const collections=site?.access?await contentCollections(client,site.id,ctx.organization.id):[],admin=createAdminClient();
 const previews=site?.access?await mediaPreviews(admin,site.id,ctx.organization.id,collections.flatMap(c=>c.records)):{};
 if(site?.access)Object.assign(previews,standaloneMediaPreviews(collections.filter(c=>c.binding.adapter==='standalone').flatMap(c=>c.records),site));
 const {data:posts,error}=site?.access&&collections.some(c=>c.binding.module==='blog')?await client.from('website_blog_posts').select('id,website_id,title,excerpt,status,updated_at,published_at,media,deleted_at').eq('website_id',site.id).eq('organization_id',ctx.organization.id).order('updated_at',{ascending:false}):{data:[],error:null};if(error)throw error;
 const library=await Promise.all((posts??[]).map(async post=>{const media=readBlogMedia(post.media),[cover]=await signedBlogImages(admin,post.website_id,ctx.organization.id,media.images.filter(image=>image.id===media.cover));return {...post,coverUrl:cover?.url,coverAlt:cover?.alt};}));
 const canWrite=Boolean(ctx.staffRole)||['owner','manager'].includes(ctx.role);
 return <div><PageHeader title="Content Hub" description="Manage the stories, work and details on your website."/><ContentHub key={site?.id??'empty'} sites={sites} selected={site?.id??''} canWrite={canWrite} previews={previews} collections={collections.map(c=>({id:c.id,key:c.binding.key,module:c.binding.module,label:c.binding.label,records:c.records,publishedRecords:c.publishedRecords,revision:c.revision,publishedRevision:c.publishedRevision,editableFields:c.config.editableFields,featuredPolicy:featuredPolicy(c.config,c.binding.module,c.binding.adapter),maxMedia:c.config.maxMedia??(c.binding.adapter==='professional'?1:30),hasDetailLinks:c.config.hasDetailLinks??(c.binding.adapter==='standalone'&&['portfolio','gallery'].includes(c.binding.module))}))} blog={site?{sites:[site],posts:library,canWrite}:null}/></div>;
}
