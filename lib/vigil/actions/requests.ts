"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/vigil/audit";
import { ForbiddenError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";

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
