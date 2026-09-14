import "server-only";

import type { NextRequest } from "next/server";

/**
 * The origin the visitor actually used, for building redirects.
 *
 * `request.url` / `nextUrl.origin` report the hostname the server was
 * started with (localhost in development, the deployment host on Vercel),
 * which is not necessarily what the browser typed and therefore not where
 * its cookies live. NEXT_PUBLIC_APP_URL wins when set, so production links
 * never point at a preview alias.
 */
export function requestOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  return `${proto}://${host}`;
}
