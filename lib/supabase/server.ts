import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { requirePublicSupabaseEnv } from "./env";

/**
 * Request-scoped Supabase client for Server Components, Server Actions and
 * Route Handlers. Runs as the signed-in user (or anon) under RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = requirePublicSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the
          // session so this is safe to ignore there.
        }
      },
    },
  });
}

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;
