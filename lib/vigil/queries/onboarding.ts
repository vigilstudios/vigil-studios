import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { parseBrief, type Brief } from "@/lib/vigil/onboarding/brief";
import type { Project } from "@/lib/vigil/types";

/**
 * The project the guided onboarding is about: the newest one that is still
 * collecting details, else the newest that is not closed. Null means the
 * organization has no project to onboard.
 */
export const getOnboardingProject = cache(async (organizationId: string): Promise<{ project: Project; brief: Brief } | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", organizationId)
    .not("status", "in", "(closed,cancelled)")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  const rows = data ?? [];
  const project = rows.find((p) => p.status === "intake" && !p.intake_completed_at) ?? rows.find((p) => p.status === "intake" || p.status === "draft") ?? rows[0] ?? null;
  if (!project) return null;
  return { project, brief: parseBrief(project.brief) };
});

/** True when the customer should be steered into the wizard. */
export function needsOnboarding(project: Project | null | undefined): boolean {
  return Boolean(project && (project.status === "intake" || project.status === "draft") && !project.intake_completed_at);
}

export type SignedAsset = { id: string; kind: string; file_name: string; content_type: string; size_bytes: number; caption: string | null; url: string | null; object_path: string };

export const getProjectAssets = cache(async (projectId: string): Promise<SignedAsset[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .select("id, kind, file_name, content_type, size_bytes, caption, object_path, bucket_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const { data: signed } = await supabase.storage.from(rows[0].bucket_id).createSignedUrls(rows.map((r) => r.object_path), 60 * 30);
  const urls = new Map<string, string>();
  for (const s of signed ?? []) if (s.signedUrl && s.path) urls.set(s.path, s.signedUrl);
  return rows.map((r) => ({ id: r.id, kind: r.kind, file_name: r.file_name, content_type: r.content_type, size_bytes: r.size_bytes, caption: r.caption, url: urls.get(r.object_path) ?? null, object_path: r.object_path }));
});
