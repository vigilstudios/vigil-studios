import Link from "next/link";
import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseExpressDraft } from "@/lib/vigil/express/document";
import { ExpressLibrary } from "@/components/vigil/ExpressLibrary";
import { PageHeader } from "@/components/vigil/ui";
export const metadata = { title: "Express catalog workspace" };
export default async function ExpressLibraryPage() {
 await requireStaff();
 const {data,error}=await(await createClient()).from("express_variants").select("id,slug,draft,revision,published_revision,archived_at").order("sort_order").order("created_at");
 if(error)throw error;
 return <div><PageHeader eyebrow="Lab" title="Express catalog" description="Design, name, save, and publish reusable Express variants." actions={<div className="flex flex-wrap gap-2"><Link className="btn-secondary" href="/admin/lab">Component library</Link><Link className="btn-secondary" href="/admin/lab/projects">Client projects</Link><Link className="btn-secondary" href="/express">Public catalog ↗</Link></div>}/><ExpressLibrary variants={(data??[]).map(v=>({...v,draft:parseExpressDraft(v.draft,v.id)}))}/></div>;
}
