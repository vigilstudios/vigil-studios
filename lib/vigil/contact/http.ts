import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTACT_BODY_LIMIT, contactSubmissionSchema, registeredOrigin, type ContactSubmission, type PublicContactConfig } from "./contract";
import type { DbClient } from "@/lib/vigil/types";

export class ContactError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export type ContactDependencies = {
  admin: () => DbClient;
  secret: () => string | undefined;
  siteKey: () => string | undefined;
  verify: (token: string, hostname: string, ip: string, secret: string) => Promise<boolean>;
};
export async function verifyTurnstile(token: string, hostname: string, ip: string, secret: string): Promise<boolean> {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ secret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
  });
  if (!response.ok) throw new ContactError(503, "Verification is unavailable. Please try again or use email.");
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
  return result.success === true && result.hostname === hostname && result.action === "contact";
}
const defaults: ContactDependencies = {
  admin: createAdminClient, secret: () => process.env.TURNSTILE_SECRET_KEY,
  siteKey: () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, verify: verifyTurnstile,
};
function configured(deps: ContactDependencies) {
  const secret = deps.secret(), siteKey = deps.siteKey();
  // Cloudflare dummy keys are for fixtures only and must never activate a live service.
  if (!secret || !siteKey || /^(1x|2x|3x)0+/.test(secret) || /^(1x|2x|3x)0+/.test(siteKey))
    throw new ContactError(503, "The contact form is not connected yet. Please use the email contact option.");
  return { secret, siteKey };
}
async function registration(admin: DbClient, websiteId: string, origin: string) {
  const { data: settings, error } = await admin.from("website_contact_settings").select("*").eq("website_id", websiteId).maybeSingle();
  if (error) throw new ContactError(503, "The contact service is unavailable. Please use email.");
  if (!settings?.enabled || !settings.allowed_origins.includes(origin)) throw new ContactError(403, "This website’s contact form is not connected.");
  const [{ data: website, error: websiteError }, { data: org, error: orgError }] = await Promise.all([
    admin.from("websites").select("status,organization_id").eq("id", websiteId).maybeSingle(),
    admin.from("organizations").select("archived_at").eq("id", settings.organization_id).maybeSingle(),
  ]);
  if (websiteError || orgError) throw new ContactError(503, "The contact service is unavailable. Please use email.");
  if (!website || website.status !== "live" || website.organization_id !== settings.organization_id || !org || org.archived_at)
    throw new ContactError(403, "This website’s contact form is not connected.");
  return settings;
}
async function limit(admin: DbClient, scope: string, subject: string, hits: number, seconds: number) {
  const key = `${scope}:${createHash("sha256").update(subject).digest("hex").slice(0,32)}`;
  const { data, error } = await admin.rpc("rate_limit", { p_key: key, p_limit: hits, p_window_seconds: seconds });
  if (error || typeof data !== "boolean") throw new ContactError(503, "The contact service is unavailable. Please use email.");
  if (!data) throw new ContactError(429, "Too many inquiries. Please wait a few minutes or use email.");
}
export async function readBoundedJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ContactError(415, "Use a JSON request.");
  if (Number(request.headers.get("content-length")) > CONTACT_BODY_LIMIT) throw new ContactError(413, "Your inquiry is too long.");
  const reader = request.body?.getReader();
  if (!reader) throw new ContactError(400, "Add your inquiry.");
  const parts: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > CONTACT_BODY_LIMIT) { await reader.cancel(); throw new ContactError(413, "Your inquiry is too long."); }
      parts.push(value);
    }
    return JSON.parse(Buffer.concat(parts).toString("utf8"));
  } catch (error) {
    if (error instanceof ContactError) throw error;
    throw new ContactError(400, "Check your inquiry and try again.");
  } finally { reader.releaseLock(); }
}
export function submissionFingerprint(input: ContactSubmission): string {
  // Object key order cannot create a different submission; CAPTCHA tokens change on retry.
  return createHash("sha256").update(JSON.stringify({name: input.name, email: input.email, phone: input.phone ?? "", message: input.message,
    source: input.source, sourcePage: input.sourcePage, details: Object.entries(input.details).sort(([a],[b])=>a.localeCompare(b))})).digest("hex");
}
export async function handleContact(request: Request, websiteId: string, deps = defaults): Promise<Response> {
  const origin = registeredOrigin(request.headers.get("origin"));
  const headers: Record<string,string> = { "Cache-Control": "no-store", "Vary": "Origin", "X-Content-Type-Options": "nosniff" };
  try {
    if (!z.string().uuid().safeParse(websiteId).success) throw new ContactError(404, "Contact form unavailable.");
    if (!origin) throw new ContactError(403, "Open the form on its registered website.");
    const { secret, siteKey } = configured(deps);
    const admin = deps.admin();
    const settings = await registration(admin, websiteId, origin);
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers});
    if (request.method === "GET") {
      const config: PublicContactConfig = { websiteId, siteKey, bookingUrl: settings.booking_url };
      return Response.json(config, {headers});
    }
    if (request.method !== "POST") throw new ContactError(405, "Use the contact form.");
    const parsed = contactSubmissionSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) throw new ContactError(422, "Check your name, email and message, then try again.");
    const input = parsed.data;
    let page: URL;
    try { page = new URL(input.sourcePage); } catch { throw new ContactError(422, "Invalid source page."); }
    if (page.origin !== origin || page.username || page.password) throw new ContactError(422, "Invalid source page.");
    // Query/hash may contain personal or sensitive data; retain path only.
    input.sourcePage = page.origin + page.pathname;
    // On Vercel this platform-owned header is overwritten at the edge; no visitor forwarded-IP trust.
    const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "unknown";
    await limit(admin, "contact:ip", ip, 12, 600);
    await limit(admin, "contact:verification", websiteId, 300, 3600);
    if (!await deps.verify(input.captchaToken, new URL(origin).hostname, ip, secret))
      throw new ContactError(403, "Verification failed or expired. Please try again.");
    const { data, error } = await admin.rpc("capture_website_lead", {
      p_website: websiteId, p_origin: origin, p_key: input.submissionId, p_hash: submissionFingerprint(input),
      p_contact: { name: input.name, email: input.email, ...(input.phone ? {phone: input.phone} : {}), details: input.details },
      p_message: input.message, p_source: input.source, p_page: input.sourcePage,
    });
    if (error) {
      if (error.code === "23505") throw new ContactError(409, "This inquiry changed after sending. Start a new inquiry.");
      if (error.code === "P0001") throw new ContactError(429, "This website has reached its inquiry limit. Please use email.");
      if (error.code === "42501") throw new ContactError(403, "This contact form is no longer connected.");
      throw new ContactError(503, "Your inquiry could not be saved. Please try again or use email.");
    }
    if (!data) throw new ContactError(503, "Your inquiry could not be saved. Please try again.");
    // No tenant/recipient/lead-id disclosure. Saved does not mean email delivered or appointment booked.
    return Response.json({ ok: true, status: "received" }, {status: 202, headers});
  } catch (error) {
    const known = error instanceof ContactError;
    return Response.json({ok: false, error: known ? error.message : "The contact service is unavailable. Please use email."},
      {status: known ? error.status : 503, headers: {...headers, ...(known && error.status === 429 ? {"Retry-After": "600"} : {})}});
  }
}
