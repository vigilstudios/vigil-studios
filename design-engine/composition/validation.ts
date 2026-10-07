import { z } from "zod";
import { getSectionContract } from "./catalog";
import { creativeOverrideSchema, parseSection, siteSchema, type CreativeLayers, type CreativeOverrides, type PageComposition, type SectionInstance, type SiteConfiguration } from "./schemas";

export type CompositionIssue = { code: string; section?: string; message: string };
export function resolveCreativeLayers(site: SiteConfiguration, page: CreativeOverrides = {}, section: CreativeOverrides = {}): CreativeLayers {
  return { typography: section.typography ?? page.typography ?? site.typography,
    artDirection: section.artDirection ?? page.artDirection ?? site.artDirection,
    motion: section.motion ?? page.motion ?? site.motion };
}
const envelopeSchema = z.object({ id: z.string().regex(/^[a-z][a-z0-9-]*$/), label: z.string().min(1), site: siteSchema, overrides: creativeOverrideSchema.optional(), sections: z.array(z.unknown()).max(20) }).strict();

/** JSON and code callers pass through the same strict boundary. No CSS/style escape hatch. */
export function inspectComposition(input: unknown): { composition?: PageComposition; issues: CompositionIssue[] } {
  const envelope = envelopeSchema.safeParse(input);
  if (!envelope.success) return { issues: envelope.error.issues.map(issue => ({ code: "schema", message: `${issue.path.join(".")}: ${issue.message}` })) };
  const issues: CompositionIssue[] = [];
  const sections: SectionInstance[] = [];
  envelope.data.sections.forEach((raw, index) => {
    try { sections.push(parseSection(raw)); }
    catch (error) { issues.push({ code: "schema", message: `Section ${index + 1}: ${error instanceof Error ? error.message : "Invalid section"}` }); }
  });
  if (issues.length) return { issues };
  const composition: PageComposition = { ...envelope.data, sections };
  const identifiers = new Set<string>([composition.id]);
  let heroes = 0, navs = 0, footers = 0;
  sections.forEach((section, index) => {
    const contract = getSectionContract(section.component);
    const add = (code: string, message: string) => issues.push({ code, section: section.id, message });
    if (identifiers.has(section.id)) add("identifier", `Duplicate page/section identifier: ${section.id}.`);
    identifiers.add(section.id);
    if (contract.category === "navigation") { navs++; if (index !== 0) add("order", "Navigation must be first."); }
    if (contract.category === "hero") { heroes++; if (index !== (navs ? 1 : 0)) add("order", "Hero must be the first content section."); }
    if (contract.category === "footer") { footers++; if (index !== sections.length - 1) add("order", "Footer must be last."); }
    for (const key of Object.keys(section.overrides ?? {}) as (keyof CreativeOverrides)[]) {
      if (!contract.overrides.includes(key)) add("override", `${section.component} does not support a section ${key} override.`);
    }
    if (section.overrides?.motion !== undefined && section.motion === "none") add("motion-inactive", "Local motion intensity has no effect while behavior is none; remove the override or choose an implemented behavior.");
    if (section.overrides?.artDirection && contract.artDirectionChoices?.[section.structure] && !contract.artDirectionChoices[section.structure].includes(section.overrides.artDirection)) add("art-context", `This variant offers ${contract.artDirectionChoices[section.structure].join(", ")}. ${contract.artBehavior}`);
    if (section.overrides?.motion && !contract.motionIntensities.includes(section.overrides.motion)) add("motion-intensity", "This section does not implement the selected local intensity.");
    const layers = resolveCreativeLayers(composition.site, composition.overrides, section.overrides);
    if (!contract.typography.profiles.includes(layers.typography)) add("typography", `${section.component} does not support ${layers.typography} typography.`);
    if (!contract.artDirections.includes(layers.artDirection)) add("art-direction", `${section.component} does not support ${layers.artDirection}. Choose ${contract.artDirections.join(", ")} or a supported section override.`);
    if (!contract.motion.includes(section.motion)) add("motion", `${section.component} does not implement ${section.motion}.`);
    if (!contract.variants.includes(section.structure)) add("structure", `${section.component} does not implement ${section.structure}.`);
    if ("treatment" in section && (!contract.media?.geometries.includes(section.treatment.geometry) || !contract.media.tones.includes(section.treatment.tone))) add("media-treatment", `${section.component} does not support ${section.treatment.geometry}/${section.treatment.tone}.`);
    const exclusion = contract.compatibility.exclusions?.find(rule => rule.structure === section.structure && rule.motion === section.motion);
    if (exclusion) add("motion-structure", exclusion.reason);
    const expansion="settings" in section;
    const placement = expansion && ["overlay","floating"].includes(String(section.settings.position)) ? "overlay" : "placement" in section ? section.placement : "in-flow";
    const navigation = contract.compatibility.navigation;
    if (navigation && !navigation.placements.includes(placement)) add("navigation-placement", "This navigation does not support overlay placement.");
    if (navigation && placement === "overlay") {
      const next = sections[index + 1];
      const hero = next && getSectionContract(next.component).compatibility.hero;
      if (!hero || (!expansion && !hero.overlaySafeZone) || !navigation.covers.includes(hero.surface)) add("navigation-overlay", "Overlay navigation requires the following Hero to declare a compatible surface and safe zone.");
    }
    if (expansion && section.settings.scroll === "solidify") {
      const next=sections[index+1],hero=next&&getSectionContract(next.component).compatibility.hero;
      if(!hero)add("navigation-context","Hero-centric behavior needs a following Hero with a declared surface.");
      if(next && "ink" in next && section.settings.heroContrast !== "brand" && section.settings.heroContrast !== (next.ink === "light" ? "light-on-dark" : "dark-on-light"))add("navigation-contrast","Transparent Navigation ink must match the following Hero's classified ink.");
    }
    if (contract.compatibility.hero?.requiresOverlayNavigation) {
      const previous = sections[index - 1];
      if (!previous || !("placement" in previous) || previous.placement !== "overlay") add("navigation-required", "This Hero requires compatible overlay navigation.");
    }
    if (section.component === "hero.assembly" && new Set(section.media.assembly.parts.map(part => part.id)).size !== section.media.assembly.parts.length) add("parts", "Assembly part identifiers must be unique.");
    if (section.component === "hero.comparison") {
      const { before, after } = section.media;
      if (before.width / before.height !== after.width / after.height || JSON.stringify(before.focal) !== JSON.stringify(after.focal) || JSON.stringify(before.mobileFocal) !== JSON.stringify(after.mobileFocal)) add("comparison-geometry", "Comparison images require matching ratios and focal points; verify actual camera registration separately.");
    }
  });
  if (navs > 1 || heroes > 1 || footers > 1) issues.push({ code: "landmarks", message: "A page supports at most one Navigation, Hero and Footer." });
  return { composition, issues };
}

export function assertComposition(input: unknown): PageComposition {
  const result = inspectComposition(input);
  if (!result.composition || result.issues.length) throw new Error(`Invalid composition:\n${result.issues.map(issue => `${issue.section ?? "page"}: ${issue.message}`).join("\n")}`);
  return result.composition;
}

/** Non-blocking seam notices derive from capabilities, never component pairing lists. */
export function compositionTransitionNotices(page: PageComposition): CompositionIssue[] {
 const notices: CompositionIssue[] = [];
 page.sections.forEach((section,index)=>{
  if("settings" in section && section.settings.scroll==="solidify")notices.push({code:"transparent-context",section:section.id,message:"Hero-centric chrome is transparent until the measured Hero exits. Full Scene/Scene Poster classify inherited ink automatically; other Heroes need author-reviewed light/dark text contrast for the actual image or surface."});
  const flow=getSectionContract(section.component).compatibility.flow;
  const previous=page.sections[index-1];
  if(previous && (flow?.surface === "dark-room" || getSectionContract(previous.component).compatibility.flow?.surface === "dark-room")) notices.push({code:"surface-transition",section:section.id,message:"A deliberate dark viewing room meets the inherited site surface. Captions stay on opaque surfaces; review the visual seam."});
  if(previous && flow?.density === "dense" && getSectionContract(previous.component).compatibility.flow?.density === "dense") notices.push({code:"density-transition",section:section.id,message:"Two dense information structures are adjacent. Review reading rhythm and consider an open narrative or evidence section between them."});
  if(flow?.bleed === "full") notices.push({code:"full-bleed",section:section.id,message:"This section uses the full-width composition field; its authored content gutters remain local. No overlay safe zone is provided."});
  if(flow?.scrolling === "horizontal-region") notices.push({code:"scroll-region",section:section.id,message:"Horizontal browsing is contained in a keyboard-accessible region. Document scrolling and neighboring sections remain independent."});
 });
 return notices;
}
