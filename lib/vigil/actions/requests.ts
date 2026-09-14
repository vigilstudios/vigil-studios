"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/vigil/audit";
import { ForbiddenError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { ATTACHMENTS_BUCKET, attachmentPath, validateAttachments } from "@/lib/vigil/attachments";
import { randomUUID } from "node:crypto";

export type RequestState = ActionResult<{ id: string; attached: number; failed: string[] }> | null;

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

    const fields = Object.fromEntries([...formData.entries()].filter(([k]) => k !== "attachments"));
    const parsed = schema.safeParse(fields);
    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const i of parsed.error.issues) (issues[i.path.join(".") || "_"] ??= []).push(i.message);
      throw new ValidationError("Check the highlighted fields.", issues);
    }
    const v = parsed.data;

    // Files are validated before the request row exists, so a bad upload
    // never leaves a half-made request behind.
    const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
    const problems = validateAttachments(files);
    if (problems.length > 0) {
      throw new ValidationError(problems.map((p) => (p.name === "*" ? p.reason : `${p.name}: ${p.reason}`)).join(" "), { attachments: problems.map((p) => p.reason) });
    }

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

    // Upload under the user's own session: storage RLS only allows the
    // organization's folder, and the row's check constraint agrees.
    const failed: string[] = [];
    let attached = 0;
    for (const file of files) {
      const path = attachmentPath(ctx.organization.id, data.id, file.type, randomUUID());
      const { error: uploadError } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        console.error("attachment upload failed:", uploadError.message);
        failed.push(file.name);
        continue;
      }
      const { error: rowError } = await supabase.from("change_request_attachments").insert({
        organization_id: ctx.organization.id,
        change_request_id: data.id,
        bucket_id: ATTACHMENTS_BUCKET,
        object_path: path,
        file_name: file.name.slice(0, 200),
        content_type: file.type,
        size_bytes: file.size,
        uploaded_by: ctx.user.id,
      });
      if (rowError) {
        console.error("attachment row failed:", rowError.message);
        await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path]);
        failed.push(file.name);
        continue;
      }
      attached += 1;
    }

    await logAuditEvent(supabase, {
      action: "change_request.submitted",
      entityType: "change_request",
      entityId: data.id,
      organizationId: ctx.organization.id,
      after: { title: v.title, priority: v.priority, attachments: attached },
    });

    revalidatePath("/dashboard/requests");
    return { ok: true, data: { id: data.id, attached, failed } };
  } catch (error) {
    return toActionError(error);
  }
}
