"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { requirePublicSupabaseEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = requirePublicSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
