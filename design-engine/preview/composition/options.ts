import type { PageComposition, SectionId } from "../../composition/schemas";
import type { DesignComponentDefinition } from "../../registry/types";
import { getSectionContract } from "../../composition/catalog";

/** Friendly Lab labels; registry identity and source-concept provenance remain canonical. */
export function sectionTitle(
  entry: Pick<DesignComponentDefinition, "name">,
): string {
  return entry.name
    .replace(/\s*\/\s*(?:[NHSMCPE]|NX|HX)\d{2}$/, "")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

const sectionCategories = [
  ["navigation", "Navigation"],
  ["hero", "Heroes"],
  ["about", "About"],
  ["storytelling", "Brand & Story"],
  ["services", "Services & Capabilities"],
  ["portfolio", "Media & Work"],
  ["commerce", "Commerce & Product"],
  ["proof", "Social Proof & Results"],
  ["content", "Content"],
  ["cta", "Calls to Action"],
  ["contact", "Contact / Inquiry"],
  ["footer", "Footers"],
] as const;
export function sectionOptionGroups(
  entries: readonly DesignComponentDefinition[],
) {
  return sectionCategories
    .map(([category, label]) => ({
      category,
      label,
      options: entries
        .filter((entry) => entry.composition?.category === category)
        .map((entry) => ({
          value: entry.id as SectionId,
          label: sectionTitle(entry),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .filter((group) => group.options.length);
}

const fixtureCategories = [
  ["hero", "Heroes"],
  ["storytelling", "Brand & Story"],
  ["services", "Services & Capabilities"],
  ["portfolio", "Media & Work"],
  ["commerce", "Commerce & Product"],
  ["proof", "Social Proof & Results"],
  ["footer", "Footer / Readiness Endings"],
  ["other", "Other Compositions"],
] as const;
type FixtureCategory = (typeof fixtureCategories)[number][0];
const heroContexts: Record<string, string> = {
  "composition-a": "Architecture",
  "composition-b": "Energy Platform",
  "composition-c": "Performance Ensemble",
  "composition-d": "Modular Furniture",
  "composition-e": "Architecture Comparison",
};
const storyContexts: Record<string, string> = {
  "story-a": "Workshop",
  "story-b": "Research",
  "story-c": "Community",
  "story-d": "Workshop",
  "story-e": "Workshop",
  "story-f": "Research",
};
/** Fixture families are authored in fixtures.ts; runtime page contracts do not gain UI metadata. */
function fixtureOption(
  page: PageComposition,
  entries: readonly DesignComponentDefinition[],
) {
  let category: FixtureCategory = "other",
    target: string | undefined,
    context: string | undefined;
  if (page.id in heroContexts) {
    category = "hero";
    target = "opening";
    context = heroContexts[page.id];
  } else if (page.id.startsWith("readiness-ending-")) {
    category="footer";target="footer";context="Conversion / Contact QA";
  } else if (page.id.startsWith("readiness-work-")) {
    category="portfolio";target="gallery";context="External import";
  } else if (page.id.startsWith("hero-followup-")) {
    category = "hero";
    target = "opening";
    context = page.id.endsWith("-0") ? "Practice" : "Learning Program";
  } else if (page.id in storyContexts) {
    category = "storytelling";
    target = "story";
    context = storyContexts[page.id];
  } else if (page.id.startsWith("evidence-")) {
    category="proof";target="evidence";context=page.id.endsWith("-0")?"Services / Work":"Commerce";
  } else if (page.id.startsWith("commerce-")) {
    category="commerce";target="merchandising";context=page.id.endsWith("-0")?"Apparel":"Beauty / Audio";
  } else if (page.id.startsWith("services-")) {
    category = "services";
    target = "offerings";
    context = page.id.endsWith("-0") ? "Practice" : "Platform";
  } else if (page.id.startsWith("external-")) {
    target=page.sections.find(s=>s.id === "imported")?.id ?? "opening";
    category=getSectionContract(page.sections.find(s=>s.id === target)!.component).category as FixtureCategory;
    context=page.id.endsWith("-0")?"Architecture":"Hospitality";
  } else if (page.id.startsWith("production-")) {
    category = "portfolio";
    target = "work-first";
    context = page.id.endsWith("-0") ? "Apparel" : "Hospitality";
  }
  const primary = page.sections.find((section) => section.id === target);
  const entry =
    primary && entries.find((entry) => entry.id === primary.component);
  return {
    category,
    value: page.id,
    label: entry ? `${sectionTitle(entry)} · ${context}` : page.label,
  };
}
export function compositionOptionGroups(
  pages: readonly PageComposition[],
  entries: readonly DesignComponentDefinition[],
) {
  const options = pages.map((page) => fixtureOption(page, entries));
  return fixtureCategories
    .map(([category, label]) => ({
      category,
      label,
      options: options
        .filter((option) => option.category === category)
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .filter((group) => group.options.length);
}

export function sectionCategoryLabel(id: SectionId): string {
  const category = getSectionContract(id).category;
  return (
    sectionCategories.find(([value]) => value === category)?.[1] ?? category
  );
}
