import "server-only";

import { z } from "zod";
import { escapeHtml, layout, staffNotificationAddress } from "@/lib/vigil/email";
import { ProviderError, ValidationError } from "@/lib/vigil/auth/errors";
import type { DbClient, ProvisioningJob } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { checkDnsRecords, ownershipRecord, type DnsCheck, type DnsRecord } from "./dns";

const messageSchema = z.object({ from: z.string(), to: z.string().email(), reply_to: z.string(), subject: z.string(), html: z.string(), text: z.string() }).strict();
type Message = z.infer<typeof messageSchema>;
type Transport = (message: Message, key: string) => Promise<string>;

/** Raw HTTP keeps the provider's stable idempotency header on the installed SDK version. */
export const sendDomainReadinessEmail: Transport = async (message, key) => {
  if (!process.env.RESEND_API_KEY) throw new ProviderError("resend", "Staff email is not configured.", { retryable: true });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(message),
  });
  if (!response.ok) {
    // Concurrent requests with the same key can briefly return 409.
    const body = await response.json().catch(() => ({})) as { name?: string };
    throw new ProviderError("resend", "Staff email could not be accepted.", { retryable: response.status === 408 || response.status === 429 || response.status >= 500 || body.name === "concurrent_idempotent_requests" });
  }
  const result = await response.json() as { id?: string };
  if (!result.id) throw new ProviderError("resend", "Staff email acceptance was not confirmed.", { retryable: true });
  return result.id;
};

/** Inbox delivery is transactional in SQL; email retries never repeat DNS work. */
export async function notifyDomainReadiness(admin: DbClient, job: ProvisioningJob, options: {
  transport?: Transport;
  checkDns?: (hostname: string, records: DnsRecord[]) => Promise<DnsCheck[]>;
} = {}): Promise<Json & { status: string }> {
  if (!job.domain_id || !job.organization_id || !job.website_id || !job.locked_by || job.kind !== "domain.readiness.notify") throw new ValidationError("Domain notification identity is missing.");
  const [{ data: domain, error: domainError }, { data: website, error: websiteError }, { data: organization, error: orgError }, { data: current, error: jobError }] = await Promise.all([
    admin.from("domains").select("*").eq("id", job.domain_id).eq("organization_id", job.organization_id).eq("website_id", job.website_id).maybeSingle(),
    admin.from("websites").select("id, status").eq("id", job.website_id).eq("organization_id", job.organization_id).maybeSingle(),
    admin.from("organizations").select("name").eq("id", job.organization_id).maybeSingle(),
    admin.from("provisioning_jobs").select("payload").eq("id", job.id).eq("organization_id", job.organization_id).eq("website_id", job.website_id).eq("domain_id", job.domain_id).eq("kind", job.kind).eq("status", "running").eq("locked_by", job.locked_by).maybeSingle(),
  ]);
  for (const error of [domainError, websiteError, orgError, jobError]) if (error) throw error;
  if (!domain || !website || !organization || !current) throw new ValidationError("Domain notification no longer matches its website or lease.");
  const state = (current.payload ?? {}) as Record<string, Json | undefined>;
  if (state.email_sent_at) return { status: "sent", alreadySent: true };
  if (domain.status === "released" || ["live", "archived", "suspended"].includes(website.status)) return { status: "skipped" };
  const verification = domain.verification as { source?: string; launch_ready?: boolean } | null;
  if (domain.status !== "verifying" || domain.source !== "customer_owned" || verification?.source !== "platform" || !verification.launch_ready || !domain.dns_ok || !domain.verification_token) return { status: "waiting" };
  const checks = await (options.checkDns ?? checkDnsRecords)(domain.hostname, [ownershipRecord(domain.hostname, domain.verification_token)]);
  if (checks.length === 0 || !checks.every(check => check.ok)) return { status: "waiting" };
  const firstAttempt = typeof state.first_attempt_at === "string" ? state.first_attempt_at : null;
  if (firstAttempt && !Number.isFinite(Date.parse(firstAttempt))) throw new ValidationError("Staff email attempt time needs manual review.");
  // Resend deduplicates for 24h. An uncertain attempt must stop before expiry.
  if (firstAttempt && Date.now() - Date.parse(firstAttempt) >= 23 * 3600_000) throw new ProviderError("resend", "Staff email needs manual delivery review before retrying.");
  const root = (process.env.NEXT_PUBLIC_APP_URL || "https://www.vigilstudios.co").replace(/\/$/, "");
  const href = `${root}/admin/organizations/${job.organization_id}?domain=${job.domain_id}`;
  const text = `${organization.name} has completed the domain ownership step for ${domain.hostname}.\n\nThe ownership record is verified. The website is ready for your launch review and remains unpublished. Review approvals and launch requirements before deploying live. Website-routing records may need a further guided step after the production build is prepared.\n\nReview: ${href}`;
  const message = state.email_message ? messageSchema.parse(state.email_message) : messageSchema.parse({
    from: process.env.EMAIL_FROM || "Vigil Studios <hello@vigilstudios.co>", to: staffNotificationAddress(), reply_to: process.env.EMAIL_REPLY_TO || "hello@vigilstudios.co",
    subject: `${organization.name}: domain setup ready for launch review`, text,
    html: layout("Domain setup ready for launch review", `<p style="white-space:pre-wrap">${escapeHtml(text)}</p>`),
  });
  async function persist(payload: Record<string, Json | undefined>) {
    const { data, error } = await admin.from("provisioning_jobs").update({ payload }).eq("id", job.id).eq("status", "running").eq("locked_by", job.locked_by!).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new ValidationError("The notification lease changed. Retry from the job queue.");
  }
  const pending = { ...state, first_attempt_at: firstAttempt ?? new Date().toISOString(), email_message: message as Json };
  await persist(pending);
  const id = await (options.transport ?? sendDomainReadinessEmail)(message, `domain-readiness/${job.id}`);
  await persist({ ...pending, email_sent_at: new Date().toISOString(), email_provider_id: id });
  return { status: "sent", providerId: id };
}
