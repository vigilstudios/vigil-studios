"use client";
import type { SectionInstance } from "../composition/schemas";
import { exampleLogo } from "./client-adaptations";
import type { NavigationLogo } from "../sections/navigation/BrandMark";
import { CapabilityControl } from "./CapabilityControl";
import { PreviewValueControl } from "./PreviewValueControl";
export const brandTreatments = [
  { value: "wordmark", label: "Wordmark" },
  { value: "symbol", label: "Icon only" },
  { value: "combined", label: "Icon + wordmark" },
  { value: "image", label: "Image logo" },
  { value: "text", label: "Plain text" },
] as const;
/** Brand options audition actual logo data without mutating authored content. */
export function NavigationBrandControls({ section, onChange, onPreview }: {
  section: SectionInstance;
  onChange: (patch: Record<string, unknown>) => void;
  onPreview: (patch: Record<string, unknown> | null) => void;
}) {
  if (!section.component.startsWith("navigation.") || !("brand" in section.content)) return null;
  const c = section.content, logo: NavigationLogo = c.logo ?? { kind: "wordmark" };
  const contentPatch = (patch: Record<string, unknown>) => ({ content: { ...c, ...patch } });
  const update = (patch: Record<string, unknown>) => onChange(contentPatch(patch));
  const preview = (patch: Record<string, unknown> | null) => onPreview(patch === null ? null : contentPatch(patch));
  return <fieldset className="lab-brand-controls">
    <legend>Brand treatment</legend>
    <PreviewValueControl key={`${section.id}-${c.brand}`} label="Brand name" value={c.brand} maxLength={"settings" in section ? 120 : 80}
      onPreview={value => preview(value === null ? null : { brand: value.trim() })} onChange={value => update({ brand: value.trim() })} />
    <CapabilityControl label="Brand treatment" value={logo.kind} choices={brandTreatments}
      onPreview={value => preview(value === null ? null : { logo: exampleLogo(c.brand, value as NavigationLogo["kind"]) })}
      onChange={value => update({ logo: exampleLogo(c.brand, value as NavigationLogo["kind"]) })} />
    {"src" in logo && <>
      <PreviewValueControl key={`${section.id}-${logo.src}`} label="Logo source" value={logo.src.startsWith("data:image/") ? "" : logo.src} placeholder="Example icon · paste a client logo URL"
        onPreview={value => preview(value === null ? null : { logo: { ...logo, src: value } })} onChange={value => update({ logo: { ...logo, src: value } })} />
      <p className="lab-layer-note">An example logo is loaded for this treatment. Replace its source with the client’s asset.</p>
    </>}
    {logo.kind === "image" && <div className="lab-control-grid">{(["width", "height"] as const).map(key =>
      <PreviewValueControl key={`${section.id}-${key}-${logo[key]}`} label={`Logo ${key}`} value={String(logo[key])} type="number" valid={value => Number.isFinite(Number(value)) && Number(value) > 0}
        onPreview={value => preview(value === null ? null : { logo: { ...logo, [key]: Number(value) } })}
        onChange={value => update({ logo: { ...logo, [key]: Number(value) } })} />
    )}</div>}
  </fieldset>;
}
