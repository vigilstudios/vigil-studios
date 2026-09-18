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

/**
 * True when a state-changing request came from this site. The Origin header
 * is compared with the Host the request arrived on (x-forwarded-host behind
 * Vercel); `nextUrl.origin` is not used because in development it reports
 * the server's configured hostname even when the page was served on
 * 127.0.0.1. Older browsers omit Origin on same-origin form posts, and a
 * cross-site fetch always carries sec-fetch-site.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
