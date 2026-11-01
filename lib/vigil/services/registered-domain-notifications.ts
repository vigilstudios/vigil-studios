import "server-only";
import { z } from "zod";
import type { DbClient, ProvisioningJob } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { escapeHtml, layout, staffNotificationAddress } from "@/lib/vigil/email";
import { ProviderError, ValidationError } from "@/lib/vigil/auth/errors";
import { sendDomainReadinessEmail } from "./domain-readiness-notifications";
import { syncManagedRegistration } from "../domain-engine/registrar-sync";

const messageSchema = z.object({ from: z.string(), to: z.string().email(), reply_to: z.string(), subject: z.string(), html: z.string(), text: z.string() }).strict();

/** The SQL trigger has already delivered the staff inbox alert transactionally.
 * Email is separately retried, with frozen content and provider idempotency. */
export async function notifyRegisteredDomainReady(admin: DbClient, job: ProvisioningJob, options: {
  transport?: typeof sendDomainReadinessEmail;
  sync?: typeof syncManagedRegistration;
} = {}) {
  const { registration_id: registrationId } = z.object({ registration_id: z.string().uuid() }).parse(job.payload);
  if (job.kind !== "domain.registration.ready.notify" || !job.organization_id || !job.website_id || !job.locked_by || !job.locked_at)
    throw new ValidationError("Domain handoff notification identity is missing.");
  const [{ data: current, error: jobError }, { data: registration, error: regError }, { data: website, error: siteError }, { data: organization, error: orgError }] = await Promise.all([
    admin.from("provisioning_jobs").select("payload").eq("id", job.id).eq("organization_id", job.organization_id).eq("website_id", job.website_id).eq("kind", job.kind).eq("status", "running").eq("locked_by", job.locked_by).eq("locked_at", job.locked_at).maybeSingle(),
    admin.from("domain_registrations").select("*").eq("id", registrationId).eq("organization_id", job.organization_id).eq("website_id", job.website_id).eq("environment", "live").eq("registrar", "namecom").maybeSingle(),
    admin.from("websites").select("status").eq("id", job.website_id).eq("organization_id", job.organization_id).maybeSingle(),
    admin.from("organizations").select("name").eq("id", job.organization_id).maybeSingle(),
  ]);
  for (const error of [jobError, regError, siteError, orgError]) if (error) throw error;
  if (!current || !registration || !website || !organization) throw new ValidationError("Domain handoff no longer matches its website or notification lease.");
  const state = (current.payload ?? {}) as Record<string, Json | undefined>;
  if (state.registration_id !== registrationId) throw new ValidationError("Domain handoff registration changed.");
  if (state.email_sent_at) return { status: "sent", alreadySent: true };
  if (["live", "archived", "suspended"].includes(website.status) || registration.registration_status === "released") return { status: "skipped" };
  const observed = await (options.sync ?? syncManagedRegistration)(admin, registrationId, job.organization_id);
  if (observed.status !== "registered" || observed.contactVerification !== "verified") return { status: "waiting" };
  const { data: order, error } = await admin.from("domain_orders").select("id").eq("registration_id", registrationId).eq("organization_id", job.organization_id).eq("environment", "live").eq("operation", "register").eq("registration_state", "registered").eq("payment_state", "paid").maybeSingle();
  if (error) throw error;
  if (!order) return { status: "waiting" };
  const first = typeof state.first_attempt_at === "string" ? state.first_attempt_at : null;
  if (first && (!Number.isFinite(Date.parse(first)) || Date.now() - Date.parse(first) >= 23 * 3600_000)) throw new ProviderError("resend", "Domain readiness email needs manual delivery review before retrying.");
  const root = (process.env.NEXT_PUBLIC_APP_URL || "https://www.vigilstudios.co").replace(/\/$/, "");
  const href = `${root}/admin/organizations/${job.organization_id}?registration=${registrationId}`;
  const { data: handoff, error: handoffError } = await admin.rpc("managed_domain_handoff_status", { p_order_id: order.id, p_organization_id: job.organization_id });
  if (handoffError) throw handoffError;
  const automatic = (handoff as { automaticConnection?: boolean } | null)?.automaticConnection === true;
  const text = `${organization.name} has completed setup for ${registration.fqdn}. The domain is registered, payment is confirmed and the registrar has verified the owner’s email.\n\n${automatic ? "The customer authorized automatic website connection when Vigil deploys the finished, approved website." : "This older purchase has no saved automatic-connection permission. Arrange the customer’s connection authorization before launch."}\n\nThis is domain readiness only. Complete the existing client and Vigil website reviews and approvals, then deploy from the admin console. No website has been approved or published by this notification.\n\nReview: ${href}`;
  const message = state.email_message ? messageSchema.parse(state.email_message) : messageSchema.parse({
    from: process.env.EMAIL_FROM || "Vigil Studios <hello@vigilstudios.co>", to: staffNotificationAddress(), reply_to: process.env.EMAIL_REPLY_TO || "hello@vigilstudios.co",
    subject: `${organization.name}: domain ready for website launch`, text,
    html: layout("Customer domain setup complete", `<p style="white-space:pre-wrap">${escapeHtml(text)}</p>`),
  });
  async function persist(payload: Record<string, Json | undefined>) {
    const { data, error } = await admin.from("provisioning_jobs").update({ payload }).eq("id", job.id).eq("status", "running").eq("locked_by", job.locked_by!).eq("locked_at", job.locked_at!).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new ValidationError("Domain notification lease changed.");
  }
  const pending = { ...state, first_attempt_at: first ?? new Date().toISOString(), email_message: message as Json };
  await persist(pending);
  const id = await (options.transport ?? sendDomainReadinessEmail)(message, `domain-registration-ready/${job.id}`);
  await persist({ ...pending, email_sent_at: new Date().toISOString(), email_provider_id: id });
  return { status: "sent", providerId: id };
}
