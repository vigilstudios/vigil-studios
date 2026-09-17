import type { DbClient, ProjectStatus } from "@/lib/vigil/types";
import type { Updates } from "@/lib/vigil/types";
import { assertTransition, projectTransitions } from "@/lib/vigil/lifecycle";

const AUTOMATIC_PROJECT_SEQUENCE: ProjectStatus[] = ["draft", "intake", "in_progress", "review", "approved", "launched"];

/** Forward-only lifecycle path used by reliable delivery milestones. */
export function automaticProjectPath(current: ProjectStatus, target: ProjectStatus): ProjectStatus[] {
  const currentIndex = AUTOMATIC_PROJECT_SEQUENCE.indexOf(current);
  const targetIndex = AUTOMATIC_PROJECT_SEQUENCE.indexOf(target);
  if (currentIndex < 0 || targetIndex < 0 || targetIndex <= currentIndex) return [];
  return AUTOMATIC_PROJECT_SEQUENCE.slice(currentIndex + 1, targetIndex + 1);
}

/**
 * Advance a project through every valid intermediate state without regressing
 * manual exceptions or reopening terminal projects.
 */
export async function advanceProjectStatus(admin: DbClient, projectId: string, target: ProjectStatus, at = new Date().toISOString()): Promise<boolean> {
  const { data: project, error } = await admin.from("projects").select("id, status").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!project) return false;

  let current = project.status as ProjectStatus;
  const path = automaticProjectPath(current, target);
  for (const next of path) {
    assertTransition(projectTransitions, current, next, "project");
    const patch: Updates<"projects"> = { status: next };
    if (next === "launched") patch.launched_at = at;
    const { error: updateError } = await admin.from("projects").update(patch).eq("id", projectId).eq("status", current);
    if (updateError) throw updateError;
    current = next;
  }
  return path.length > 0;
}

/** Advance the project linked to a website when publishing reaches a milestone. */
export async function advanceWebsiteProjectStatus(admin: DbClient, websiteId: string, target: ProjectStatus, at?: string): Promise<boolean> {
  const { data: website, error } = await admin.from("websites").select("project_id").eq("id", websiteId).maybeSingle();
  if (error) throw error;
  if (!website?.project_id) return false;
  return advanceProjectStatus(admin, website.project_id, target, at);
}
