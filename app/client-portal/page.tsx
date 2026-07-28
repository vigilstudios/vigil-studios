import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ClientPortalDashboard from "@/components/portal/ClientPortalDashboard";

export const metadata: Metadata = {
  title: "Client Portal | Vigil Studios",
  description: "Your private dashboard for your Vigil Studios website project.",
};

export default async function ClientPortalPage() {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      clients (*),
      project_phase_progress (*)
    `)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !project) {
    return (
      <main className="min-h-screen bg-[color:var(--bg-primary)] p-10 text-[color:var(--text-primary)]">
        <h1 className="mb-4 text-2xl font-bold">Unable to load portal data.</h1>
        <pre className="whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-sm">
          {JSON.stringify({ error, project }, null, 2)}
        </pre>
      </main>
    );
  }

  return <ClientPortalDashboard project={project} />;
}