import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import { parseBrief } from "@/lib/vigil/onboarding/brief";

export function hasTeamComponent(document: unknown): boolean {
  const pages = (document as { pages?: { sections?: { component?: string }[] }[] } | null)?.pages;
  return Array.isArray(pages) && pages.some(page => page && Array.isArray(page.sections) && page.sections.some(section => section?.component === "about.team"));
}

/** Admin-only caller supplies the already authorized project and website, scoped again on every read. */
export async function teamReadiness(db: DbClient, org: string, project: { id: string; kind: string; brief: unknown }, website?: { id: string }) {
  const team = parseBrief(project.brief).brand?.team;
  if (!team?.enabled || !team.members.some(member => member.name.trim())) return null;
  const count = team.members.filter(member => member.name.trim()).length;
  if (!website) return { count, ready: false, message: "Team profiles were requested. Create the website and connect its Team component before launch." };
  const { data: collections, error } = await db.from("website_content_collections").select("adapter,config").eq("organization_id", org).eq("website_id", website.id).eq("module", "team").eq("enabled", true);
  if (error) throw error;
  let supported = false;
  if (project.kind === "express") {
    const { data: runtime, error } = await db.from("website_content_runtimes").select("site_definition").eq("organization_id", org).eq("website_id", website.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    supported = hasTeamComponent(runtime?.site_definition);
  } else {
    const { data: workspace, error } = await db.from("design_workspaces").select("site_definition").eq("organization_id", org).eq("website_id", website.id).eq("project_id", project.id).maybeSingle();
    if (error) throw error;
    supported = hasTeamComponent(workspace?.site_definition);
  }
  const ready = supported && Boolean(collections?.some(collection => collection.adapter === "professional" && !(collection.config as Record<string, unknown>).deliveryPending));
  return { count, ready, message: ready ? "The Team component is connected to Content Hub." : !supported && project.kind === "express" ? "This Express site has no exported Team component. Implement the section and connect it to Content Hub before publishing the requested profiles." : !supported ? "Add The Team component in this project's Lab, then save to connect these profiles to Content Hub." : "A Team component exists. Connect its member collection to Content Hub before publishing these profiles." };
}
