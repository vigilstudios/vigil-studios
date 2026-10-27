import "server-only";

import type { ServerSupabaseClient } from "@/lib/supabase/server";
import { loginDestination } from "./redirects";

/** Read the verified user's role under RLS, after their new session is set. */
export async function resolveLoginDestination(client: ServerSupabaseClient, userId: string, next: string): Promise<string> {
  const { data, error } = await client.from("staff_members").select("role").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return loginDestination(next, data?.role ?? null);
}
