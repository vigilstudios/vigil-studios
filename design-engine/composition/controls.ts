import { getSectionContract } from "./catalog";
import { inspectComposition, resolveCreativeLayers } from "./validation";
import { parseSection, type PageComposition, type SectionInstance } from "./schemas";

export function sectionChoiceReason(page: PageComposition, section: SectionInstance, patch: Record<string, unknown>): string | undefined {
  let candidate: SectionInstance;
  try { candidate = patch.component && patch.component !== section.component ? parseSection(patch) : transitionSection(section, patch).section; } catch { return "Not supported by the section schema."; }
  const next = { ...page, sections: page.sections.map(item => item.id === section.id ? candidate : item) };
  const before = inspectComposition(page).issues;
  return inspectComposition(next).issues.filter(issue => issue.section === section.id || !before.some(old => old.code === issue.code && old.section === issue.section && old.message === issue.message)).map(issue => issue.message).join(" ") || undefined;
}
export function sectionLayerChoices(page: PageComposition, section: SectionInstance, key: "typography" | "artDirection" | "motion") {
  const contract = getSectionContract(section.component);
  if (!contract.overrides.includes(key) || (key === "motion" && section.motion === "none")) return [];
  const values = key === "typography" ? contract.typography.profiles : key === "artDirection" ? contract.artDirectionChoices?.[section.structure] ?? contract.artDirections : contract.motionIntensities;
  return ["inherit", ...values].map(value => {
    const overrides = { ...section.overrides };
    if (value === "inherit") delete overrides[key]; else Object.assign(overrides, { [key]: value });
    return { value, label: value === "inherit" ? `Inherit · ${resolveCreativeLayers(page.site, page.overrides)[key]}` : value, reason: sectionChoiceReason(page, section, { overrides }) };
  });
}
/** Changing motion behavior explicitly clears a now-irrelevant local intensity. */
export function transitionSection(section: SectionInstance, patch: Record<string, unknown>): { section: SectionInstance; notice: string } {
  const overrides = { ...(patch.overrides !== undefined ? patch.overrides as SectionInstance["overrides"] : section.overrides) };
  let notice = patch.structure && patch.structure !== section.structure ? "Structural variant changed. Content and valid layer selections are retained; interactive state restarts for the new structure." : "";
  if (patch.motion === "none" && overrides.motion !== undefined) { delete overrides.motion; notice = "Motion behavior changed to none; the local intensity override was removed. Global motion is preserved."; }
  return { section: parseSection({ ...section, ...patch, overrides }), notice };
}
