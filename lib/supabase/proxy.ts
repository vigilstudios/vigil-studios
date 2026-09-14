import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseEnv } from "./env";

export type ProxySession = {
  response: NextResponse;
  userId: string | null;
};

/**
 * Refresh the auth cookies on every request and report whether a session is
 * present. Only an optimistic signal: real authorization happens in the Data
 * Access Layer and in row-level security.
 */
export async function refreshSession(request: NextRequest): Promise<ProxySession> {
  let response = NextResponse.next({ request });
  const env = getPublicSupabaseEnv();
  if (!env) return { response, userId: null };

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getClaims verifies the JWT signature (locally with asymmetric keys, or
  // against the Auth server otherwise) and refreshes the cookie when needed.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;

  return { response, userId };
}
