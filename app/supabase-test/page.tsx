import { createClient } from "@/lib/supabase/server";

export default async function SupabaseTestPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
  .from("projects")
  .select(`
    *,
    clients (*),
    project_phase_progress (*)
  `)
  .limit(5);

  return (
    <main className="p-10">
      <h1>Supabase Test</h1>

      {error ? (
        <pre>{JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}