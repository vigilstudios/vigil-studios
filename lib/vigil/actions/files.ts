"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { resolveEntitlements } from "@/lib/vigil/entitlements";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/vigil/rate-limit";
import { fileLimitsFor, loadOrgProject, recordUploadedFiles, type RecordedFile, type UploadedFile } from "@/lib/vigil/services/project-files";

/**
 * The project library: files the customer adds after onboarding (photos,
 * videos, documents for the build). The browser uploads straight to the
 * bucket, then records the batch here; limits are the organization's
 * files.* entitlements and staff hear about every batch.
 */
export async function recordProjectFiles(projectId: string, uploaded: UploadedFile[]): Promise<ActionResult<{ recorded: RecordedFile[]; failed: string[] }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    await enforceRateLimit(`files:org:${ctx.organization.id}`, RATE_LIMITS.filesOrg);
    const supabase = await createClient();
    const project = await loadOrgProject(supabase, ctx, projectId);
    const limits = fileLimitsFor(await resolveEntitlements(ctx.organization.id));
    const result = await recordUploadedFiles(supabase, ctx, project, uploaded, limits);
    revalidatePath("/dashboard/files");
    revalidatePath(`/admin/organizations/${ctx.organization.id}`);
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}
