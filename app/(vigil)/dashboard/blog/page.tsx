import Link from 'next/link';
import {requireOrgContext} from '@/lib/vigil/auth/session';
import {createClient} from '@/lib/supabase/server';
import {blogSites} from '@/lib/vigil/blog/access';
import {Card,PageHeader} from '@/components/vigil/ui';
export default async function BlogDashboard(){
 const ctx=await requireOrgContext('/dashboard/blog'),client=await createClient(),sites=await blogSites(client,ctx.organization.id);
 const {data:posts,error}=sites.length?await client.from('website_blog_posts').select('id,website_id,title,status,updated_at,published_at').eq('organization_id',ctx.organization.id).in('website_id',sites.map(s=>s.id)).order('updated_at',{ascending:false}):{data:[],error:null};if(error)throw error;
 const canWrite=Boolean(ctx.staffRole)||['owner','manager'].includes(ctx.role);
 return <div><PageHeader title="Blog" description="Write drafts, preview your articles and publish to your website."/>
 {sites.length===0&&<Card><p>Blog publishing is available for Professional and Growth Sites that requested a blog during onboarding. Ask Vigil to update the scope if your requirements have changed.</p></Card>}
 {sites.map(site=><Card key={site.id} className="mb-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{site.name}</h2>{canWrite&&<Link className="btn-primary text-sm" href={`/dashboard/blog/new?website=${site.id}`}>Write a post</Link>}</div>
 <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{site.status==='live'?'Published posts appear on your website without a new deployment.':'You can prepare and preview drafts now. Public articles appear after website launch approval.'}</p>
 <ul className="mt-4 divide-y divide-[color:var(--border)]">{(posts??[]).filter(p=>p.website_id===site.id).map(post=><li key={post.id}><Link className="flex justify-between gap-3 py-3" href={`/dashboard/blog/${post.id}?website=${site.id}`}><span>{post.title}</span><span className="text-sm text-[color:var(--text-secondary)]">{post.status==='published'?'Published':'Draft'}</span></Link></li>)}</ul>
 {!(posts??[]).some(p=>p.website_id===site.id)&&<p className="py-8 text-sm">Your journal starts here. No posts yet.</p>}</Card>)}</div>;
}
