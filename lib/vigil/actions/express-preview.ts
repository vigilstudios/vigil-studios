"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { NotFoundError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { assertExpressPreviewCanReceiveResponse, getExpressPreviewReview } from "@/lib/vigil/express-preview-review";

async function respond(
  websiteId: string,
  kind: "approved" | "changes_requested",
  feedback?: string,
): Promise<ActionResult> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const supabase = await createClient();
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select("id, organization_id, project_id")
      .eq("id", websiteId)
      .eq("organization_id", ctx.organization.id)
      .maybeSingle();
    if (websiteError) throw websiteError;
    if (!website) throw new NotFoundError("Website not found.");
    const review = await assertExpressPreviewCanReceiveResponse(await getExpressPreviewReview(supabase, websiteId));
    const normalizedFeedback = feedback?.trim() || null;
    if (kind === "changes_requested") {
      const parsed = z.string().min(1, "Tell us what you would like changed.").max(10_000).safeParse(normalizedFeedback);
      if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? "Tell us what you would like changed.");
      if (review.changesRemaining < 1) throw new ValidationError("The included Express revision has already been used.");
    }
    const { error } = await supabase.from("project_review_responses").insert({
      organization_id: ctx.organization.id,
      project_id: review.projectId,
      round_id: review.roundId,
      submission_id: review.currentSubmissionId!,
      kind,
      feedback: normalizedFeedback,
      responded_by: ctx.user.id,
    });
    if (error) throw error;
    const { error: notifyError } = await supabase.rpc("notify_review_staff", {
      p_round: review.roundId,
      p_title: kind === "approved" ? "Express preview approved" : "Express preview changes requested",
      p_body: kind === "approved" ? "The customer approved the latest preview. It is ready to deploy live." : "The customer submitted their included revision request.",
      p_href: `/admin/websites/${encodeURIComponent(websiteId)}`,
    });
    if (notifyError) console.error("Express preview staff notification failed:", notifyError.message);
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", ctx.user.id)
      .eq("organization_id", ctx.organization.id)
      .eq("kind", "website.preview_ready")
      .is("read_at", null);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/website");
    revalidatePath(`/admin/websites/${websiteId}`);
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function approveExpressPreview(websiteId: string): Promise<ActionResult> {
  return respond(websiteId, "approved");
}

export async function requestExpressPreviewChanges(websiteId: string, feedback: string): Promise<ActionResult> {
  return respond(websiteId, "changes_requested", feedback);
}
