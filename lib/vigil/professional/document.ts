import { ValidationError } from "@/lib/vigil/auth/errors";
import { parseSiteDefinition, serializeSite } from "@/design-engine/site/persistence";
import { siteFromComposition, type SiteDefinition } from "@/design-engine/site/model";
import { resolvePageComposition } from "@/design-engine/site/navigation";
import { actionIssues } from "@/design-engine/site/actions";
import { assertComposition } from "@/design-engine/composition/validation";

export type WorkspaceAsset = { id: string; file_name: string; content_type: string; caption: string | null; url: string; previewUrl: string };
export function assetUrl(asset: { id: string; file_name: string }): string {
  const extension = asset.file_name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0,10) || "bin";
  return `/_vigil/assets/${asset.id}.${extension}`;
}
export function emptyProjectSite(projectId: string, title: string): SiteDefinition {
  const site = siteFromComposition({ id: "page-home", label: "Home", site: {
    brand: { theme: "neutral" }, typography: "neo-grotesk", artDirection: "precision", motion: "restrained", icons: { id: "core", strokeWidth: 1.5 },
  }, sections: [] });
  return { ...site, id: `project-${projectId}`, title: title.slice(0,180) };
}
export function projectDocument(input: unknown, projectId: string): SiteDefinition {
  const site = parseSiteDefinition(input);
  if (site.id !== `project-${projectId}`) throw new ValidationError("This Site Definition belongs to a different project.");
  return site;
}
/** Resolve private storage only in editor display; never persist signed URLs. */
export function mapAssetSources<T>(value: T, assets: WorkspaceAsset[]): T {
  const urls = new Map(assets.map(asset => [asset.url, asset.previewUrl]));
  const visit = (item: unknown): unknown => typeof item === "string" ? urls.get(item) ?? item
    : Array.isArray(item) ? item.map(visit) : item && typeof item === "object" ? Object.fromEntries(Object.entries(item).map(([key, val]) => [key, visit(val)])) : item;
  return visit(value) as T;
}
export function selectedAssetUrls(site: SiteDefinition): string[] {
  const urls = new Set<string>();
  const visit = (item: unknown) => {
    if (typeof item === "string" && item.startsWith("/_vigil/assets/")) urls.add(item);
    else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === "object") Object.values(item).forEach(visit);
  };
  visit(site); return [...urls];
}
/** Private editor/storage addresses must never become portable client content. */
export function assertPortableSources(site: SiteDefinition, deploying = false): void {
  const visit = (item: unknown, key = "") => {
    if (typeof item === "string") {
      if (/\/api\/admin\/projects\/|\/storage\/v1\/object\/(?:sign|authenticated)\//i.test(item)) {
        throw new ValidationError("Select client media from this project's asset library instead of persisting a private or expiring URL.");
      }
      if (deploying && ["src", "mobileSrc", "lightSrc", "darkSrc", "poster"].includes(key) && item && !/^(?:\/_vigil\/assets\/|https?:\/\/|data:image\/)/i.test(item)) {
        throw new ValidationError("Replace example media with a selected project asset or a public media URL before deploying.");
      }
    } else if (Array.isArray(item)) item.forEach(value => visit(value, key));
    else if (item && typeof item === "object") Object.entries(item).forEach(([name, value]) => visit(value, name));
  };
  visit(site);
}
export function assertDeployable(site: SiteDefinition): void {
  assertPortableSources(site, true);
  const issues = actionIssues(site);
  if (issues.length) throw new Error(issues.map(issue => issue.message).join(" "));
  for (const page of site.pages) assertComposition(resolvePageComposition(site, page.id));
  if (!site.pages.some(page => page.sections.length)) throw new Error("Add production sections before deploying a preview.");
  serializeSite(site);
}
