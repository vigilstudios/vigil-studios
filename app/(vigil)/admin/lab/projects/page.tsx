import Link from "next/link";
import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/vigil/ui";
export const metadata = { title: "Client design workspaces" };
export default async function ClientProjectsPage() {
 await requireStaff();
 const { data, error } = await (await createClient()).from("projects").select("id,name,status,organization:organizations(name),websites(id)").eq("kind","professional").order("created_at",{ascending:false});
 if (error) throw error;
 return <div><PageHeader eyebrow="Lab" title="Client projects" description="A separate design workspace for every Professional website." actions={<Link className="btn-secondary" href="/admin/lab">Component library</Link>}/><div className="grid gap-4 md:grid-cols-2">{(data??[]).map(project => <Card key={project.id}><h2 className="font-semibold">{project.name}</h2><p className="mt-2 text-sm">{project.organization?.name} · {project.status}</p>{project.websites.length ? <Link className="btn-primary mt-4 inline-flex" href={`/admin/lab/project/${project.id}`}>Open design workspace</Link> : <p className="mt-3 text-sm">Create the project website to begin.</p>}</Card>)}</div>{!data?.length && <Card>Professional purchases and projects will appear here once their website is provisioned.</Card>}<p className="mt-6"><Link className="underline" href="/admin/lab/express">Express catalog →</Link></p></div>;
}
