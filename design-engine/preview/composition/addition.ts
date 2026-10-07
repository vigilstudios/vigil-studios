import { getSectionContract } from "../../composition/catalog";
import type { PageComposition, SectionId, SectionInstance } from "../../composition/schemas";
import { inspectComposition, resolveCreativeLayers } from "../../composition/validation";
import { makeSection } from "./fixtures";

/** New example styles may need a local layer, without rewriting the host page. */
export function adaptSectionToPageLayers(page: PageComposition, section: SectionInstance): SectionInstance {
  const contract = getSectionContract(section.component);
  const layers = resolveCreativeLayers(page.site, page.overrides, section.overrides);
  const overrides = { ...section.overrides };
  const arts = contract.artDirectionChoices?.[section.structure] ?? contract.artDirections;
  if (!arts.includes(layers.artDirection) && contract.overrides.includes("artDirection")) overrides.artDirection = arts[0];
  if (!contract.typography.profiles.includes(layers.typography) && contract.overrides.includes("typography")) overrides.typography = contract.typography.profiles[0];
  return { ...section, overrides };
}

/** Hover and commit validate the same exact insertion. */
export function prepareSectionAddition(page: PageComposition, component: SectionId) {
  const category = getSectionContract(component).category;
  const base = category === "navigation" ? "navigation" : category === "hero" ? "opening" : "approach";
  const identifiers = new Set([page.id, ...page.sections.map(section => section.id)]);
  let id = base, suffix = 1;
  while (identifiers.has(id)) id = `${base}-${suffix++}`;
  const section = adaptSectionToPageLayers(page, makeSection(component, id));
  const sections = [...page.sections];
  // Landmarks have fixed positions; body sections stay ahead of any footer.
  const footer = sections.findIndex(item => getSectionContract(item.component).category === "footer");
  const index = category === "navigation" ? 0
    : category === "hero" ? (sections[0] && getSectionContract(sections[0].component).category === "navigation" ? 1 : 0)
    : category === "footer" || footer < 0 ? sections.length : footer;
  sections.splice(index, 0, section);
  const composition = { ...page, sections };
  const reason = inspectComposition(composition).issues.map(issue => issue.message).join(" ") || undefined;
  return { section, composition, reason };
}
