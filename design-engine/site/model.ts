import { z } from "zod";
import { presentationSchema } from "../presentation/schema";
import { siteSchema, creativeOverrideSchema, parseSection, type SectionInstance, type PageComposition } from "../composition/schemas";
import { getSectionContract } from "../composition/catalog";
import { pageTypes } from "../registry/types";
import { actionSchema } from "./action-schema";
const identity = z.string().regex(/^[a-z][a-z0-9-]*$/).max(100);
const section = z.unknown().transform((value, ctx): SectionInstance => {
  try { return parseSection(value); } catch (error) {
    ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid section" });
    return z.NEVER;
  }
});
const slot = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("inherit") }).strict(),
  z.object({ mode: z.literal("omit") }).strict(),
  z.object({ mode: z.literal("replace"), section }).strict(),
]);
export const sitePageSchema = z.object({
  id: identity, title: z.string().trim().min(1).max(180), navLabel: z.string().trim().min(1).max(80).optional(),
  slug: z.string().max(180), routeOverride: z.string().max(2000).optional(),
  pageType: z.enum(pageTypes), parentId: identity.nullable(), order: z.number().int().nonnegative(),
  showInNavigation: z.boolean(), status: z.enum(["draft", "published"]),
  presentation: presentationSchema.optional(),
  sections: z.array(section).max(20), overrides: creativeOverrideSchema.optional(),
  seo: z.object({ title: z.string().max(180).optional(), description: z.string().max(500).optional(), noIndex: z.boolean().optional() }).strict(),
  slots: z.object({ navigation: slot, footer: slot }).strict(),
  previousRoutes: z.array(z.string()).default([]),
}).strict();
export type SitePage = z.infer<typeof sitePageSchema>;
export const siteDefinitionSchema = z.object({
  version: z.literal(1), id: identity, title: z.string().trim().min(1).max(180), settings: siteSchema,
  navigation: z.object({ homePageId: identity, includeDrafts: z.boolean(), action: z.object({ label: z.string().trim().min(1).max(80), action: actionSchema }).strict().optional() }).strict(),
  globals: z.object({ navigation: section.optional(), footer: section.optional() }).strict(),
  pages: z.array(sitePageSchema).min(1).max(500),
}).strict();
export type SiteDefinition = z.infer<typeof siteDefinitionSchema>;
export type SlotName = "navigation" | "footer";
export function effectiveSections(site: SiteDefinition, page: SitePage): SectionInstance[] {
  const resolve = (name: SlotName) => page.slots[name].mode === "replace" ? page.slots[name].section : page.slots[name].mode === "inherit" ? site.globals[name] : undefined;
  return [resolve("navigation"), ...page.sections, resolve("footer")].filter((value): value is SectionInstance => Boolean(value));
}
export function pageComposition(site: SiteDefinition, pageId: string): PageComposition {
  const page = site.pages.find(page => page.id === pageId);
  if (!page) throw new Error(`Page ${pageId} does not exist.`);
  return { id: page.id, label: page.title, site: site.settings, overrides: page.overrides, presentation: page.presentation, sections: effectiveSections(site, page) };
}
/** Legacy QA compositions migrate without copying shared defaults into every page. */
export function siteFromComposition(composition: PageComposition): SiteDefinition {
  const page: SitePage = { id: "page-home", title: composition.label, slug: "/", pageType: "home", parentId: null, order: 0, showInNavigation: true, status: "draft", sections: structuredClone(composition.sections), overrides: composition.overrides, presentation: composition.presentation, seo: {}, slots: { navigation: { mode: "inherit" }, footer: { mode: "inherit" } }, previousRoutes: [] };
  for (const name of ["navigation", "footer"] as const) {
    const instance = page.sections.find(section => getSectionContract(section.component).category === name);
    if (instance) { page.slots[name] = { mode: "replace", section: instance }; page.sections = page.sections.filter(section => section !== instance); }
  }
  return { version: 1, id: "site-draft", title: "Untitled site", settings: structuredClone(composition.site), navigation: { homePageId: page.id, includeDrafts: true }, globals: {}, pages: [page] };
}
