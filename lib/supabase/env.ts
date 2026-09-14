/**
 * Supabase connection settings, read once and validated.
 *
 * The publishable key is safe in the browser; RLS is what protects data. The
 * secret (service-role) key bypasses RLS and must only ever be read on the
 * server — `admin.ts` is the single module allowed to touch it.
 */
export function getPublicSupabaseEnv(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function requirePublicSupabaseEnv(): { url: string; publishableKey: string } {
  const env = getPublicSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return env;
}
