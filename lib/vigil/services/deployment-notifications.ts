import "server-only";

import { NotFoundError, ValidationError } from "@/lib/vigil/auth/errors";
import { button, escapeHtml, layout, sendEmail } from "@/lib/vigil/email";
import { reviewRoundDefinition } from "@/lib/vigil/project-reviews";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";

type ReviewContext = { projectId: string; label: string; version: number };

/**
 * A Professional preview is published into a review round before this
 * runs (publishPreviewToReview). When the round under review shows this
 * very URL, the customer is told about the review, not just the build, and
 * sent to the Design review page where their decision lives.
 */
async function reviewContextFor(admin: DbClient, websiteId: string, previewUrl: string): Promise<ReviewContext | null> {
  const { data: website } = await admin.from("websites").select("project_id").eq("id", websiteId).maybeSingle();
  if (!website?.project_id) return null;
  const { data: project } = await admin.from("projects").select("id, kind").eq("id", website.project_id).maybeSingle();
  if (!project || project.kind !== "professional") return null;
  const { data: rounds } = await admin
    .from("project_review_rounds")
    .select("round_number, status, current_submission_id")
    .eq("project_id", project.id)
    .eq("status", "awaiting_feedback");
  for (const round of rounds ?? []) {
    if (!round.current_submission_id) continue;
    const { data: submission } = await admin.from("project_review_submissions").select("preview_url, version").eq("id", round.current_submission_id).maybeSingle();
    if (submission?.preview_url === previewUrl) {
      return { projectId: project.id, label: reviewRoundDefinition(round.round_number)?.label ?? "Design review", version: submission.version };
    }
  }
  return null;
}

type DeliveryMarker = {
  event: "preview_ready" | "site_live";
  sent_at: string;
  email_id?: string;
};

/** Email and notify the customer once for a completed deployment. */
export async function notifyCustomerDeployment(
  admin: DbClient,
  deploymentId: string,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co",
): Promise<{ sent: boolean; alreadySent: boolean }> {
  const { data: deployment, error: deploymentError } = await admin
    .from("deployments")
    .select("id, organization_id, website_id, environment, status, url, metadata")
    .eq("id", deploymentId)
    .maybeSingle();
  if (deploymentError) throw deploymentError;
  if (!deployment) throw new NotFoundError(`Deployment ${deploymentId} not found.`);
  if (deployment.status !== "ready") throw new ValidationError("The deployment is not ready to announce yet.");

  const metadata = (deployment.metadata as Record<string, unknown> | null) ?? {};
  if ((metadata.customer_notification as DeliveryMarker | undefined)?.sent_at) {
    return { sent: true, alreadySent: true };
  }

  const [{ data: organization, error: organizationError }, { data: website, error: websiteError }, { data: members, error: membersError }] = await Promise.all([
    admin.from("organizations").select("name, billing_email").eq("id", deployment.organization_id).maybeSingle(),
    admin.from("websites").select("name, preview_url, live_url, metadata").eq("id", deployment.website_id).maybeSingle(),
    admin.from("organization_members").select("user_id").eq("organization_id", deployment.organization_id).eq("status", "active"),
  ]);
  if (organizationError) throw organizationError;
  if (websiteError) throw websiteError;
  if (membersError) throw membersError;
  if (!organization || !website) throw new NotFoundError("The website or customer organization no longer exists.");

  const memberIds = (members ?? []).map((member) => member.user_id);
  let recipient = organization.billing_email?.trim() || null;
  if (!recipient && memberIds.length > 0) {
    const { data: profiles, error: profilesError } = await admin.from("profiles").select("email").in("id", memberIds).limit(1);
    if (profilesError) throw profilesError;
    recipient = profiles?.[0]?.email?.trim() || null;
  }
  if (!recipient) throw new ValidationError("The customer has no billing or member email for deployment notifications.");

  const root = appUrl.replace(/\/$/, "");
  const isPreview = deployment.environment === "preview";
  const event: DeliveryMarker["event"] = isPreview ? "preview_ready" : "site_live";
  const websiteMetadata = (website.metadata as Record<string, unknown> | null) ?? {};
  const priorNotifications = (websiteMetadata.customer_notifications as Record<string, unknown> | undefined) ?? {};
  const lifecycleMarker = isPreview ? priorNotifications.preview_ready_at : priorNotifications.site_live_at;
  // Every revised preview is a new customer decision point. Production is a
  // one-time lifecycle event, but preview notifications are per deployment.
  if (lifecycleMarker && !isPreview) return { sent: true, alreadySent: true };
  const publicUrl = (isPreview ? website.preview_url : website.live_url) || deployment.url;
  if (!publicUrl) throw new ValidationError("The completed deployment has no customer URL.");

  const review = isPreview ? await reviewContextFor(admin, deployment.website_id, publicUrl) : null;
  const href = review ? `/dashboard/review?project=${review.projectId}` : "/dashboard/website";
  const title = review ? `${review.label} is ready for review` : isPreview ? "Your website preview is ready" : "Your website is live";
  const subject = review
    ? `${organization.name}: ${review.label} is ready for review`
    : isPreview
      ? `${organization.name}: your website preview is ready`
      : `${organization.name}: your website is live`;
  const intro = review
    ? `Version ${review.version} of your ${review.label.toLowerCase()} is ready. Open the preview, then return to the Design review page in your Vigil dashboard to approve it or send one consolidated round of changes.`
    : isPreview
      ? `Your new website preview is ready. Open it to review the latest build, then return to your Vigil dashboard for the next step.`
      : `Your website has been published and is now live. You can open it below or view its current status in your Vigil dashboard.`;
  const dashboardUrl = `${root}${href}`;
  const delivery = await sendEmail({
    to: recipient,
    subject,
    text: `${intro}\n\nOpen your website: ${publicUrl}\nDashboard: ${dashboardUrl}`,
    html: layout(
      title,
      `<p>${escapeHtml(intro)}</p>${button(publicUrl, isPreview ? "Open your preview" : "Open your website")}<p style="color:#666;font-size:13px">You can also check status and next steps in your <a href="${dashboardUrl}">Vigil dashboard</a>.</p>`,
    ),
  });
  if (!delivery.sent) throw new Error(delivery.error || "The deployment email could not be sent.");

  const marker: DeliveryMarker = { event, sent_at: new Date().toISOString(), ...(delivery.id ? { email_id: delivery.id } : {}) };
  const { error: websiteMarkerError } = await admin
    .from("websites")
    .update({
      metadata: {
        ...websiteMetadata,
        customer_notifications: {
          ...priorNotifications,
          [isPreview ? "preview_ready_at" : "site_live_at"]: marker.sent_at,
          [isPreview ? "preview_email_id" : "site_live_email_id"]: delivery.id ?? null,
        },
      } as unknown as Json,
    })
    .eq("id", deployment.website_id);
  if (websiteMarkerError) throw websiteMarkerError;

  const { error: markerError } = await admin
    .from("deployments")
    .update({ metadata: { ...metadata, customer_notification: marker } as unknown as Json })
    .eq("id", deploymentId);
  if (markerError) throw markerError;

  for (const userId of memberIds) {
    const { error: notificationError } = await admin.from("notifications").insert({
      user_id: userId,
      organization_id: deployment.organization_id,
      kind: review ? "project_review.submission" : isPreview ? "website.preview_ready" : "website.live",
      title,
      body: review
        ? `Version ${review.version} is ready for your consolidated feedback or approval.`
        : isPreview
          ? "Your latest build is ready to review."
          : "Your website has been published.",
      href,
    });
    if (notificationError) console.error("deployment customer notification failed:", notificationError.message);
  }

  await admin.rpc("log_audit_event", {
    p_action: isPreview ? "website.preview_notified" : "website.live_notified",
    p_entity_type: "deployment",
    p_entity_id: deploymentId,
    p_org: deployment.organization_id,
    p_after: { email: recipient, url: publicUrl },
  });

  return { sent: true, alreadySent: false };
}
