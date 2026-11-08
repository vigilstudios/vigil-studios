"use client";

import {
  createBrowserClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { requirePublicSupabaseEnv } from "./env";
import {
  SESSION_MODE_COOKIE,
  sessionCookieOptions,
} from "@/lib/vigil/auth/persistence";

export function createClient() {
  const { url, publishableKey } = requirePublicSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () =>
        typeof document === "undefined"
          ? []
          : parseCookieHeader(document.cookie).map(({ name, value }) => ({
              name,
              value: value ?? "",
            })),
      setAll(values) {
        if (typeof document === "undefined") return;
        const mode = parseCookieHeader(document.cookie).find(
          (c) => c.name === SESSION_MODE_COOKIE,
        )?.value;
        for (const { name, value, options } of values)
          document.cookie = serializeCookieHeader(
            name,
            value,
            sessionCookieOptions(options, mode),
          );
      },
    },
  });
}
