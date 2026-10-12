import "server-only";
import { escapeHtml, layout } from "@/lib/vigil/email";
import { ProviderError } from "@/lib/vigil/auth/errors";
import type { DbClient, ProvisioningJob, Updates } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { z } from "zod";

const messageSchema = z.object({from:z.string(),to:z.array(z.string().email()).length(1),subject:z.string(),html:z.string(),text:z.string()}).strict();
type Message = z.infer<typeof messageSchema>;
export type ContactMailTransport = (message: Message, idempotencyKey: string) => Promise<string>;
export const sendContactMail: ContactMailTransport = async (message, key) => {
  if (!process.env.RESEND_API_KEY) throw new ProviderError("resend", "Email provider is unavailable.", {retryable:true});
  const response = await fetch("https://api.resend.com/emails", {
    method:"POST", signal:AbortSignal.timeout(10_000), headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":key},
    body:JSON.stringify(message),
  });
  if (!response.ok) throw new ProviderError("resend", `Email provider returned HTTP ${response.status}.`, {retryable:response.status===429||response.status>=500});
  const result = await response.json() as {id?:string};
  if (!result.id) throw new ProviderError("resend", "Email provider did not confirm acceptance.", {retryable:true});
  return result.id;
};
/** The existing leased job queue is the outbox. Payload is fixed before any provider call. */
export async function notifyWebsiteLead(admin: DbClient, job: ProvisioningJob, transport: ContactMailTransport = sendContactMail): Promise<Json> {
  const id = (job.payload as {lead_id?:string} | null)?.lead_id;
  if (!id || !job.organization_id || !job.website_id) throw new Error("Lead notification identity is missing.");
  const [{data:lead,error:leadError},{data:notification,error:notificationError}] = await Promise.all([
    admin.from("leads").select("*").eq("id",id).eq("organization_id",job.organization_id).eq("website_id",job.website_id).maybeSingle(),
    admin.from("lead_notifications").select("*").eq("lead_id",id).eq("organization_id",job.organization_id).maybeSingle(),
  ]);
  if (leadError) throw leadError; if (notificationError) throw notificationError;
  if (!lead || !notification) throw new ProviderError("resend", "Lead notification does not match its website.");
  if (notification.status === "sent") return {status:"sent",provider_id:notification.provider_id};
  if (notification.status === "review_required") throw new ProviderError("resend", "Delivery requires staff review.");
  const now = new Date().toISOString();
  async function persist(update: Updates<"lead_notifications">) {
    // Concrete table type below avoids accidental writes to other tenant rows.
    const {error} = await admin.from("lead_notifications").update(update).eq("lead_id",id!).eq("organization_id",job.organization_id!);
    if (error) throw error;
  }
  if (notification.first_attempt_at && Date.now()-Date.parse(notification.first_attempt_at)>23*3600_000) {
    await persist({status:"review_required",last_error:"Provider deduplication window expired; review before resending.",updated_at:now});
    throw new ProviderError("resend", "Provider deduplication window expired; review before resending.");
  }
  const contact = lead.contact as {name?:string;email?:string;phone?:string;details?:Record<string,string>};
  const details = Object.entries(contact.details ?? {}).map(([key,value])=>`${key}: ${value}`).join("\n");
  const title = "New website inquiry";
  const text = `${title}\n\nName: ${contact.name ?? ""}\nEmail: ${contact.email ?? ""}\nPhone: ${contact.phone ?? ""}\n\n${lead.message ?? ""}\n\n${details}\n\nOpen your Lead Hub: https://www.vigilstudios.co/dashboard/leads/${lead.id}\nThis is an inquiry, not an appointment confirmation.`;
  const message = notification.message ? messageSchema.parse(notification.message) : messageSchema.parse({
    from:process.env.EMAIL_FROM || "Vigil Studios <hello@vigilstudios.co>",to:[notification.recipient],subject:title,
    html:layout(title,`<p style="white-space:pre-wrap">${escapeHtml(text)}</p>`),text,
  });
  const attempts = notification.attempts+1;
  await persist({first_attempt_at:notification.first_attempt_at ?? now,message:message as Json,attempts,updated_at:now});
  try {
    const providerId = await transport(message,`lead-notify/${lead.id}`);
    const {error} = await admin.rpc("acknowledge_lead_notification",{p_lead:lead.id,p_org:lead.organization_id,p_provider:providerId});
    if (error) throw error;
    return {status:"sent",provider_id:providerId};
  } catch (error) {
    // A lost acknowledgement after provider acceptance stays safe on the stable deduplication key.
    if (error && typeof error === "object" && "code" in error && !(error instanceof ProviderError)) throw error;
    const failure = error instanceof ProviderError ? error : new ProviderError("resend","Email provider could not be reached.",{retryable:true});
    const terminal = !failure.retryable || job.attempts>=job.max_attempts;
    await persist({status:terminal?"failed":"queued",last_error:failure.message,updated_at:new Date().toISOString()});
    const {error:eventError} = await admin.from("lead_events").insert({lead_id:lead.id,organization_id:lead.organization_id,kind:"notification_failed",body:`Notification attempt ${attempts}: ${terminal?"failed; contact remains saved":"waiting to retry"}. ${failure.message}`});
    if (eventError) throw eventError;
    throw failure;
  }
}
