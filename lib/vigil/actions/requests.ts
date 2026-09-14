"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/vigil/audit";
import { ForbiddenError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { ATTACHMENTS_BUCKET, validateAttachments } from "@/lib/vigil/attachments";

export type RequestState = ActionResult<{ id: string }> | null;

const schema = z.object({
  title: z.string().trim().min(3, "Say a little more about the change.").max(200, "Keep the title under 200 characters."),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  website_id: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

/**
 * Requests are structure-only in V1: the row is created and submitted, staff
 * see it in /admin/requests. Allowance accounting is a later phase; the
 * entitlement gate is real today.
 */
export async function createChangeRequest(_prev: RequestState, formData: FormData): Promise<RequestState> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const ent = await resolveEntitlements(ctx.organization.id);
    if (!ent.enabled(FEATURES.requests)) throw new ForbiddenError("Website updates are not included in your current plan.");

    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const i of parsed.error.issues) (issues[i.path.join(".") || "_"] ??= []).push(i.message);
      throw new ValidationError("Check the highlighted fields.", issues);
    }
    const v = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("change_requests")
      .insert({
        organization_id: ctx.organization.id,
        website_id: v.website_id || null,
        title: v.title,
        description: v.description || null,
        priority: v.priority,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        requested_by: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) throw error;

    await logAuditEvent(supabase, {
      action: "change_request.submitted",
      entityType: "change_request",
      entityId: data.id,
      organizationId: ctx.organization.id,
      after: { title: v.title, priority: v.priority },
    });

    revalidatePath("/dashboard/requests");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export type UploadedFile = { path: string; name: string; type: string; size: number };

/**
 * Record files the browser uploaded straight to Storage (Vercel caps request
 * bodies, so bytes never pass through the server). The path must sit under
 * this organization's folder and the request must be this organization's —
 * both are enforced again by the table's check constraint and trigger.
 */
export async function attachUploadedFiles(requestId: string, uploaded: UploadedFile[]): Promise<ActionResult<{ attached: number; failed: string[] }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const problems = validateAttachments(uploaded);
    if (problems.length > 0) throw new ValidationError(problems.map((p) => (p.name === "*" ? p.reason : `${p.name}: ${p.reason}`)).join(" "));

    const supabase = await createClient();
    const failed: string[] = [];
    let attached = 0;
    for (const f of uploaded) {
      if (!f.path.startsWith(`${ctx.organization.id}/${requestId}/`)) {
        failed.push(f.name);
        continue;
      }
      const { error } = await supabase.from("change_request_attachments").insert({
        organization_id: ctx.organization.id,
        change_request_id: requestId,
        bucket_id: ATTACHMENTS_BUCKET,
        object_path: f.path,
        file_name: f.name.slice(0, 200),
        content_type: f.type,
        size_bytes: f.size,
        uploaded_by: ctx.user.id,
      });
      if (error) {
        console.error("attachment row failed:", error.message);
        await supabase.storage.from(ATTACHMENTS_BUCKET).remove([f.path]);
        failed.push(f.name);
        continue;
      }
      attached += 1;
    }

    if (attached > 0) {
      await logAuditEvent(supabase, {
        action: "change_request.attachments_added",
        entityType: "change_request",
        entityId: requestId,
        organizationId: ctx.organization.id,
        after: { attachments: attached },
      });
    }
    revalidatePath("/dashboard/requests");
    return { ok: true, data: { attached, failed } };
  } catch (error) {
    return toActionError(error);
  }
}
