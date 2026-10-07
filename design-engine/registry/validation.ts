import { designThemes } from "../foundations/themes";
import { validateCreativeCapabilities, validateSectionContract } from "../composition/contract-validation";
import { componentStatuses, motionPresetNames, pageTypes, type ComponentStatus, type DesignComponentDefinition, type ProductionEvidence } from "./types";

export function canAdvanceStatus(from: ComponentStatus, to: ComponentStatus): boolean {
  return (from === "experimental" && to === "review") || (from === "review" && to === "production");
}

export function advanceComponentStatus(
  entry: DesignComponentDefinition,
  promotion: { to: "review" } | { to: "production"; evidence: ProductionEvidence },
): DesignComponentDefinition {
  if (!canAdvanceStatus(entry.status, promotion.to)) throw new Error(`Invalid Design Engine status transition: ${entry.status} -> ${promotion.to}`);
  const next: DesignComponentDefinition = {
    ...entry,
    status: promotion.to,
    productionEvidence: promotion.to === "production" ? promotion.evidence : entry.productionEvidence,
  };
  assertValidDesignRegistry([next]);
  return next;
}

/** Checks both shape and the evidence gate; safe to call on code-native data or JSON. */
export function validateDesignRegistry(input: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(input)) return ["Registry must be an array."];
  const ids = new Set<string>();
  const themes = new Set<string>(designThemes.map((theme) => theme.id));
  const motions = new Set<string>(motionPresetNames);
  const categories = new Set(["primitive", "navigation", "hero", "content", "motion", "icon", "recipe", "about", "storytelling", "services", "portfolio", "cta", "contact", "footer", "commerce", "proof"]);
  const pages = new Set<string>(pageTypes);
  for (const [index, raw] of input.entries()) {
    const path = `entry[${index}]`;
    if (!isRecord(raw)) { errors.push(`${path} must be an object.`); continue; }
    const id = raw.id;
    if (typeof id !== "string" || !/^[a-z]+(?:[.-][a-z]+)*$/.test(id)) errors.push(`${path}.id must be a stable dotted slug.`);
    else if (ids.has(id)) errors.push(`${path}.id duplicates ${id}.`);
    else ids.add(id);
    for (const field of ["name", "category", "description"] as const) {
      if (typeof raw[field] !== "string" || !raw[field].trim()) errors.push(`${path}.${field} is required.`);
    }
    if (!categories.has(raw.category as string)) errors.push(`${path}.category is unknown.`);
    if (typeof raw.version !== "string" || !/^\d+\.\d+\.\d+$/.test(raw.version)) errors.push(`${path}.version must be semantic version x.y.z.`);
    if (!componentStatuses.includes(raw.status as ComponentStatus)) errors.push(`${path}.status is invalid.`);
    if (!(["low", "medium", "high"] as const).includes(raw.complexity as "low")) errors.push(`${path}.complexity is invalid.`);
    if (typeof raw.mobileReady !== "boolean" || typeof raw.accessibilityReady !== "boolean") errors.push(`${path} must declare mobileReady and accessibilityReady.`);
    const responsiveReady = raw.responsiveReady;
    if (!isRecord(responsiveReady) || !["desktop", "tablet", "mobile"].every((key) => typeof responsiveReady[key] === "boolean")) errors.push(`${path}.responsiveReady must declare desktop, tablet, and mobile.`);
    else if (responsiveReady.mobile !== raw.mobileReady) errors.push(`${path}.mobileReady must match responsiveReady.mobile.`);
    if (!nonemptyStrings(raw.styles) || raw.styles.some((style) => !themes.has(style))) errors.push(`${path}.styles must contain known design directions.`);
    if (!nonemptyStrings(raw.pageTypes) || raw.pageTypes.some((page) => !pages.has(page))) errors.push(`${path}.pageTypes must contain known page types.`);
    if (!nonemptyStrings(raw.supportedMotion) || raw.supportedMotion.some((motion) => !motions.has(motion))) errors.push(`${path}.supportedMotion contains an unknown behavior.`);
    if (!Array.isArray(raw.configurations)) { errors.push(`${path}.configurations must be an array.`); continue; }
    const configurations = new Map<string, string[]>();
    for (const [configIndex, config] of raw.configurations.entries()) {
      if (!isRecord(config) || typeof config.name !== "string" || !nonemptyStrings(config.options)) {
        errors.push(`${path}.configurations[${configIndex}] is malformed.`); continue;
      }
      if (configurations.has(config.name)) errors.push(`${path}.configurations duplicates ${config.name}.`);
      if (new Set(config.options).size !== config.options.length) errors.push(`${path}.configurations[${configIndex}] repeats an option.`);
      configurations.set(config.name, config.options);
    }
    if (!Array.isArray(raw.previewVariants) || raw.previewVariants.length === 0) { errors.push(`${path}.previewVariants is required.`); continue; }
    const variants = new Set<string>();
    for (const [variantIndex, variant] of raw.previewVariants.entries()) {
      const variantPath = `${path}.previewVariants[${variantIndex}]`;
      if (!isRecord(variant) || typeof variant.id !== "string" || !variant.id || typeof variant.label !== "string" || !variant.label.trim() || !isRecord(variant.config)) {
        errors.push(`${variantPath} is malformed.`); continue;
      }
      if (variants.has(variant.id)) errors.push(`${variantPath}.id duplicates ${variant.id}.`);
      variants.add(variant.id);
      for (const [name, options] of configurations) {
        if (!options.includes(variant.config[name] as string)) errors.push(`${variantPath}.config.${name} must use a declared option.`);
      }
      for (const name of Object.keys(variant.config)) {
        if (!configurations.has(name)) errors.push(`${variantPath}.config.${name} is not declared.`);
      }
    }
    if (raw.composition === undefined) errors.push(...validateCreativeCapabilities(raw.creative).map(error => `${path}.creative.${error}`));
    if (raw.motionParameters !== undefined && (!Array.isArray(raw.motionParameters) || raw.motionParameters.some(name => !configurations.has(name)))) errors.push(`${path}.motionParameters must reference declared configurations.`);
    if (raw.status === "production") validateProductionEvidence(raw, path, errors);
    if (raw.composition !== undefined) {
      errors.push(...validateSectionContract(raw.composition).map(error => `${path}.composition.${error}`));
      if (isRecord(raw.composition) && raw.composition.category !== raw.category) errors.push(`${path}.composition.category must match registry category.`);
      if (isRecord(raw.composition) && Array.isArray(raw.composition.motion) && JSON.stringify(raw.composition.motion) !== JSON.stringify(raw.supportedMotion)) errors.push(`${path}.composition.motion must match supportedMotion.`);
    }
  }
  return errors;
}

export function assertValidDesignRegistry(input: readonly DesignComponentDefinition[]): void {
  const errors = validateDesignRegistry(input);
  if (errors.length) throw new Error(`Invalid Design Engine registry:\n${errors.join("\n")}`);
}

function validateProductionEvidence(entry: Record<string, unknown>, path: string, errors: string[]) {
  const evidence = entry.productionEvidence;
  if (!isRecord(evidence)) { errors.push(`${path}.productionEvidence is required for production.`); return; }
  const responsive = evidence.responsive;
  const accessibility = evidence.accessibility;
  if (!isRecord(responsive) || !["desktop", "tablet", "mobile"].every((key) => responsive[key] === true)) errors.push(`${path}.productionEvidence.responsive must pass desktop, tablet, and mobile.`);
  if (!isRecord(accessibility) || !["semantics", "keyboard", "focus", "reducedMotion"].every((key) => accessibility[key] === true)) errors.push(`${path}.productionEvidence.accessibility is incomplete.`);
  for (const key of ["performanceReviewed", "brandNeutralReviewed", "visualDiversityReviewed"]) if (evidence[key] !== true) errors.push(`${path}.productionEvidence.${key} must be true.`);
  if (typeof evidence.approvedBy !== "string" || !evidence.approvedBy.trim() || typeof evidence.approvedAt !== "string" || Number.isNaN(Date.parse(evidence.approvedAt))) errors.push(`${path}.productionEvidence needs approver and date.`);
  if (entry.mobileReady !== true || entry.accessibilityReady !== true) errors.push(`${path} cannot be production with readiness flags false.`);
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function nonemptyStrings(value: unknown): value is string[] { return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim().length > 0); }
