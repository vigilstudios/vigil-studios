import { z } from "zod";
import { parseSiteDefinition } from "@/design-engine/site/persistence";
import { assertComposition } from "@/design-engine/composition/validation";
import { resolvePageComposition } from "@/design-engine/site/navigation";
import { resolveRoutes } from "@/design-engine/site/routes";
import { actionIssues } from "@/design-engine/site/actions";
import { emptyProjectSite, assertPortableSources, selectedAssetUrls } from "@/lib/vigil/professional/document";
import { ValidationError } from "@/lib/vigil/auth/errors";
import type { SiteDefinition } from "@/design-engine/site/model";

const metadata = z.object({
 variant: z.string().trim().min(1).max(80), industry: z.string().trim().min(1).max(80),
 example: z.string().trim().max(120), description: z.string().trim().max(1000),
 accent: z.string().regex(/^#[0-9a-f]{6}$/i), engineVersion: z.string().regex(/^v1-[a-f0-9]{20}$/).optional(),
});
export type ExpressDraft = z.infer<typeof metadata> & ({ kind: "site"; site: SiteDefinition } | { kind: "html"; html: string });
export type ExpressTemplate = { slug: string; variant: string; industry: string; example: string; description: string; accent: string; status: "available" | "coming"; previewUrl?: string };
export function parseExpressDraft(input: unknown, id?: string, publishing = false): ExpressDraft {
 if (JSON.stringify(input).length > 2_000_000) throw new ValidationError("A variant can contain up to 2 MB of content.");
 const base = metadata.parse(input);
 const source = z.object({ kind: z.enum(["site", "html"]), site: z.unknown().optional(), html: z.string().max(1_900_000).optional() }).parse(input);
 if (source.kind === "html") {
  if (!source.html?.trim()) throw new ValidationError("Add the template HTML before saving.");
  return { ...base, kind: "html", html: source.html };
 }
 const site = parseSiteDefinition(source.site);
 if (id && site.id !== `express-${id}`) throw new ValidationError("This document belongs to another Express variant.");
 assertPortableSources(site);
 if (selectedAssetUrls(site).length) throw new ValidationError("Express templates must use library media or public images, not private customer assets.");
 if (publishing) {
  if (site.pages.length !== 1) throw new ValidationError("Express variants must have one page.");
  if (resolveRoutes(site).get(site.pages[0].id) !== "/") throw new ValidationError("The Express page must use the root route /.");
  if (!site.pages[0].sections.length) throw new ValidationError("Add sections before publishing this variant.");
  const issues = actionIssues(site);
  if (issues.length) throw new ValidationError(issues.map(issue => issue.message).join(" "));
  assertComposition(resolvePageComposition(site, site.pages[0].id));
 }
 return { ...base, kind: "site", site };
}
export function blankExpressSite(id: string, title: string): SiteDefinition {
 return { ...emptyProjectSite(id, title), id: `express-${id}` };
}
export function catalogEntry(slug: string, draft: ExpressDraft): ExpressTemplate {
 return { slug, variant: draft.variant, industry: draft.industry, example: draft.example, description: draft.description, accent: draft.accent, status: "available", previewUrl: `/express-preview/${slug}` };
}
