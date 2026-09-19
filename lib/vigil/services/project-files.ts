import "server-only";

import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { OrgContext } from "@/lib/vigil/auth/session";
import { NotFoundError, ValidationError } from "@/lib/vigil/auth/errors";
import { button, escapeHtml, layout, sendEmail, staffNotificationAddress } from "@/lib/vigil/email";
import type { Entitlements } from "@/lib/vigil/entitlements";
import { FILE_FEATURES, MB, isVideo, kindForType, validateFileBatch, type FileLimits, type FileUsage } from "@/lib/vigil/files";
import { logAuditEvent } from "@/lib/vigil/audit";
import { PROJECT_ASSETS_BUCKET, type AssetKind } from "@/lib/vigil/onboarding/assets";

export type UploadedFile = { path: string; name: string; type: string; size: number; caption?: string | null };
export type RecordedFile = { id: string; path: string; kind: AssetKind };

export function fileLimitsFor(ent: Entitlements): FileLimits {
  const mb = (code: string) => {
    const v = ent.limit(code);
    return v === null ? null : Math.round(v * MB);
  };
  return {
    maxCount: ent.limit(FILE_FEATURES.maxCount),
    maxFileBytes: mb(FILE_FEATURES.maxFileMb),
    maxTotalBytes: mb(FILE_FEATURES.maxTotalMb),
    videoEnabled: ent.enabled(FILE_FEATURES.video),
  };
}

/** Everything the organization keeps across its projects: the quota is per customer. */
export async function fileUsageFor(supabase: ServerSupabaseClient, organizationId: string): Promise<FileUsage> {
  const { data, error } = await supabase.from("project_assets").select("size_bytes").eq("organization_id", organizationId);
  if (error) throw error;
  const rows = data ?? [];
  return { count: rows.length, bytes: rows.reduce((n, r) => n + (r.size_bytes ?? 0), 0) };
}

/**
 * Record files the browser already put in the bucket. The batch is checked
 * against the organization's limits first (the row trigger is the backstop);
 * a row that fails is removed from storage again so nothing lingers unseen.
 */
export async function recordUploadedFiles(
  supabase: ServerSupabaseClient,
  ctx: OrgContext,
  project: { id: string; name: string; kind: string },
  uploaded: UploadedFile[],
  limits: FileLimits,
  kindOverride?: AssetKind,
): Promise<{ recorded: RecordedFile[]; failed: string[] }> {
  const prefix = `${ctx.organization.id}/${project.id}/`;
  const inPlace = uploaded.filter((f) => f.path.startsWith(prefix));
  const usage = await fileUsageFor(supabase, ctx.organization.id);
  const problems = validateFileBatch(inPlace, limits, usage);
  const batchProblem = problems.find((p) => p.name === "*");
  if (batchProblem) {
    // Nothing is kept: the objects already uploaded come out of the bucket.
    await supabase.storage.from(PROJECT_ASSETS_BUCKET).remove(inPlace.map((f) => f.path)).catch(() => undefined);
    throw new ValidationError(batchProblem.reason);
  }
  const bad = new Set(problems.map((p) => p.name));
  const recorded: RecordedFile[] = [];
  const failed: string[] = [];
  for (const file of uploaded) {
    const kind = kindOverride ?? kindForType(file.type);
    if (!file.path.startsWith(prefix) || bad.has(file.name) || !kind) {
      failed.push(file.name);
      await supabase.storage.from(PROJECT_ASSETS_BUCKET).remove([file.path]).catch(() => undefined);
      continue;
    }
    const { data, error } = await supabase
      .from("project_assets")
      .insert({
        organization_id: ctx.organization.id,
        project_id: project.id,
        kind,
        bucket_id: PROJECT_ASSETS_BUCKET,
        object_path: file.path,
        file_name: file.name.slice(0, 200),
        content_type: file.type,
        size_bytes: file.size,
        caption: file.caption ?? null,
        uploaded_by: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) {
      failed.push(file.name);
      await supabase.storage.from(PROJECT_ASSETS_BUCKET).remove([file.path]).catch(() => undefined);
    } else {
      recorded.push({ id: data.id, path: file.path, kind });
    }
  }
  if (recorded.length > 0) {
    await logAuditEvent(supabase, {
      action: "project.files_added",
      entityType: "project",
      entityId: project.id,
      organizationId: ctx.organization.id,
      after: { count: recorded.length, videos: recorded.filter((r) => r.kind === "video").length },
    }).catch(() => undefined);
    await notifyStaffOfFiles(ctx, project, uploaded.filter((f) => recorded.some((r) => r.path === f.path))).catch((error) => {
      console.error("project file notification failed:", error);
    });
  }
  return { recorded, failed };
}

/** One email and one in-app notification per upload batch, never per file. */
async function notifyStaffOfFiles(ctx: OrgContext, project: { id: string; name: string }, files: UploadedFile[]): Promise<void> {
  const videos = files.filter((f) => isVideo(f.type)).length;
  const summary = `${files.length} file${files.length === 1 ? "" : "s"}${videos ? ` (${videos} video${videos === 1 ? "" : "s"})` : ""}`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co").replace(/\/$/, "");
  const href = `/admin/organizations/${ctx.organization.id}`;
  const who = ctx.profile.full_name?.trim() || ctx.profile.email;
  const title = `${ctx.organization.name} added ${summary}`;
  const names = files.slice(0, 12).map((f) => f.name);
  const more = files.length > names.length ? ` and ${files.length - names.length} more` : "";

  await sendEmail({
    to: staffNotificationAddress(),
    subject: `${title} · ${project.name}`,
    text: `${who} added ${summary} to "${project.name}".\n\n${names.join("\n")}${more}\n\nOpen the customer: ${appUrl}${href}`,
    html: layout(title, `<p><b>${escapeHtml(who)}</b> added ${escapeHtml(summary)} to “${escapeHtml(project.name)}”.</p><ul>${names.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>${more ? `<p>${escapeHtml(more.trim())}</p>` : ""}${button(`${appUrl}${href}`, "Open in Vigil Admin")}`),
  });

  if (!hasAdminClient()) return;
  const admin = createAdminClient();
  const { data: staff, error } = await admin.from("staff_members").select("user_id");
  if (error) throw error;
  for (const member of staff ?? []) {
    const { error: notificationError } = await admin.from("notifications").insert({
      user_id: member.user_id,
      organization_id: ctx.organization.id,
      kind: "project.files_added",
      title,
      body: `${who} added ${summary} to ${project.name}.`,
      href,
    });
    if (notificationError) console.error("staff file notification failed:", notificationError.message);
  }
}

export async function loadOrgProject(supabase: ServerSupabaseClient, ctx: OrgContext, projectId: string) {
  const { data, error } = await supabase.from("projects").select("id, name, kind, organization_id").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!data || data.organization_id !== ctx.organization.id) throw new NotFoundError("That project is not in your workspace.");
  return data;
}
