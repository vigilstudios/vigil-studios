"use client";
import { configurationChoiceVisible } from "../composition/configuration";


import { ActionPreviewControls } from "./ActionPreviewControls";
import type { ContextualActions } from "../actions/schema";
import { getSectionContract } from "../composition/catalog";
import {
  clientAdaptationsFor,
  adaptSectionExample,
  clientExample,
  exampleLogo,
} from "./client-adaptations";
import { NavigationBrandControls } from "./NavigationBrandControls";
import { makeSection } from "./composition/fixtures";
import { parseSection, type SectionId } from "../composition/schemas";
import type { NavigationLogo } from "../sections/navigation/BrandMark";
import { useState, type ReactNode } from "react";
import { useMotionPolicy } from "../motion/MotionPolicy";
import { PreviewCanvas } from "./PreviewCanvas";
import { CapabilityControl } from "./CapabilityControl";
import {
  componentCapabilities,
  componentDefaultLayers,
  configurationReason,
  previewCapabilityIssues,
} from "../registry/capabilities";
import { LabEditor } from "./editor/LabEditor";
import { type TypographyProfileId } from "../foundations/typography/profiles";
import {
  type ArtDirectionId,
  type MotionDirection,
} from "../foundations/art-direction";
import { HeroExpansionGallery } from "./hero-expansion/Gallery";
import { NavigationCollectionGallery } from "./collection-003b/CollectionGallery";
import { ProofCollectionGallery } from "./collection-008/CollectionGallery";
import { CommerceCollectionGallery } from "./collection-007/CollectionGallery";
import { ServiceCollectionGallery } from "./collection-006/CollectionGallery";
import { MediaCollectionGallery } from "./collection-005/CollectionGallery";
import { CollectionGallery } from "./collection-004/CollectionGallery";
import { BatchGallery } from "./calibration/BatchGallery";
import { CalibrationLab } from "./calibration/CalibrationLab";
import { DesignThemeProvider } from "../foundations/DesignThemeProvider";
import { designThemes } from "../foundations/themes";
import {
  componentCategories,
  designComponents,
  findDesignComponents,
  getDesignComponent,
  type DesignComponentId,
} from "../registry/components";
import {
  componentStatuses,
  type DesignComponentDefinition,
  type ComponentCategory,
  type ComponentStatus,
} from "../registry/types";
import { renderDesignPreview, resolvePreviewConfig, type PreviewClientOptions } from "./render";

export function DesignLab({
  workspaceSwitch,
}: {
  workspaceSwitch?: ReactNode;
}) {
  const systemMotion = useMotionPolicy();
  const [mode, setMode] = useState<
    | "hero-expansion"
    | "navigation"
    | "catalog"
    | "calibration"
    | "batch"
    | "story"
    | "media"
    | "services"
    | "commerce"
    | "proof"
  >("catalog");
  const [typography, setTypography] = useState<TypographyProfileId | "legacy">(
    "legacy",
  );
  const [art, setArt] = useState<ArtDirectionId | "legacy">("legacy");
  const [motion, setMotion] = useState<MotionDirection | "legacy">("legacy");
  const [clientAdaptation, setClientAdaptation] = useState("authored");
  const [brandDraft, setBrandDraft] = useState<{
    id: string;
    brand?: string;
    logo?: NavigationLogo;
  }>({ id: "" });
  const [notice, setNotice] = useState("");
  const [replay, setReplay] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ComponentCategory | "all">("all");
  const [status, setStatus] = useState<ComponentStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<DesignComponentId>(
    designComponents[0].id,
  );
  const [theme, setTheme] =
    useState<(typeof designThemes)[number]["id"]>("neutral");
  const [device, setDevice] = useState("desktop");
  const [tab, setTab] = useState("component");
  const [variantId, setVariantId] = useState("");
  const [editor, setEditor] = useState<{
    id: string;
    variant: string;
    values: Record<string, string>;
  }>({ id: "", variant: "", values: {} });
  const [audition, setAudition] = useState<{
    id: string; variant: string; tab: string;
    preset?: string; values?: Record<string, string>; client?: PreviewClientOptions;
    device?: string; theme?: typeof theme; typography?: typeof typography; artDirection?: typeof art; motion?: typeof motion;
  } | null>(null);
  const [actionPreview, setActionPreview] = useState<{ id: string; value?: ContextualActions }>({ id: "" });
  const results = findDesignComponents({
    query,
    category: category === "all" ? undefined : category,
    status: status === "all" ? undefined : status,
  });
  const selected =
    results.find((entry) => entry.id === selectedId) ?? results[0];
  if (actionPreview.id && (actionPreview.id !== selected?.id || mode !== "catalog")) {
    setActionPreview({ id: "" });
  }
  const variant =
    selected?.previewVariants.find((item) => item.id === variantId) ??
    selected?.previewVariants[0];
  const overrides =
    selected &&
    variant &&
    editor.id === selected.id &&
    editor.variant === variant.id
      ? editor.values
      : {};
  const previewConfig =
    selected && variant
      ? resolvePreviewConfig(selected.id, variant.id, overrides)
      : {};

  const clientChoices = selected ? clientAdaptationsFor(selected.id) : [];
  const activeAdaptation = clientChoices.some(
    (c) => c.value === clientAdaptation,
  )
    ? clientAdaptation
    : (previewConfig.adaptation ?? "authored");
  const activeBrand: { brand?: string; logo?: NavigationLogo } =
    brandDraft.id === selected?.id ? brandDraft : {};
  const navExample =
    selected?.category === "navigation"
      ? adaptSectionExample(
          makeSection(selected.id as SectionId, "brand-preview"),
          activeAdaptation,
        )
      : undefined;
  const navBrand = navExample
    ? parseSection({
        ...navExample,
        content: {
          ...navExample.content,
          ...(activeBrand.brand ? { brand: activeBrand.brand } : {}),
          ...(activeBrand.logo ? { logo: activeBrand.logo } : {}),
        },
      })
    : undefined;
  const width = device === "mobile" ? 390 : device === "tablet" ? 768 : 1440;
  const capabilities = selected
    ? componentCapabilities(selected, previewConfig)
    : undefined;
  const layersValue = {
    typography: typography === "legacy" ? undefined : typography,
    artDirection: art === "legacy" ? undefined : art,
    motion: motion === "legacy" ? undefined : motion,
  };
  const issues = selected
    ? previewCapabilityIssues(selected, previewConfig, layersValue, width)
    : [];
  const shown = audition?.id === selected?.id && audition?.variant === variant?.id && audition?.tab === tab ? audition : null;
  const shownVariant = shown?.preset ?? variant?.id;
  const shownOverrides = shown?.preset ? {} : (shown?.values ?? overrides);
  const shownTypography = shown?.typography ?? typography;
  const shownArt = shown?.artDirection ?? art;
  const shownMotion = shown?.motion ?? motion;
  function preview(patch: Omit<NonNullable<typeof audition>, "id" | "variant" | "tab"> | null) {
    setAudition(patch && selected && variant ? { id: selected.id, variant: variant.id, tab, ...patch } : null);
  }
  function clientChoice(value: string): PreviewClientOptions {
    return { adaptation: value, ...(activeBrand.logo && selected?.category === "navigation"
      ? { logo: exampleLogo(clientExample(value).brand, activeBrand.logo.kind) } : {}) };
  }
  function configurationChoice(field: string, value: string) {
    return { ...overrides, [field]: value,
      ...(field === "settings.scroll" && value === "solidify" && previewConfig["settings.position"] === "flow" ? { "settings.position": "overlay" } : {}),
      ...(field === "settings.position" && value === "flow" && previewConfig["settings.scroll"] === "solidify" ? { "settings.scroll": "sticky" } : {}) };
  }
  function resetLayers(
    id = selected?.id,
    preset: string | undefined = variant?.id,
  ) {
    const entry = id
      ? (getDesignComponent(id) as DesignComponentDefinition)
      : undefined;
    const defaults = entry
      ? componentDefaultLayers(
          entry,
          resolvePreviewConfig(id!, preset || entry.previewVariants[0].id),
        )
      : undefined;
    setTypography(defaults?.typography ?? "legacy");
    setArt(defaults?.artDirection ?? "legacy");
    setMotion(defaults?.motion ?? "legacy");
  }
  function selectComponent(id: DesignComponentId) {
    setAudition(null);
    setBrandDraft({ id: "" });
    setSelectedId(id);
    setActionPreview({ id });
    setVariantId("");
    resetLayers(id, "");
    setEditor({ id: "", variant: "", values: {} });
    setNotice(
      "Component changed: preset and creative layers reset to component defaults. Inspect the new capability notes.",
    );
  }
  const workspace = (
    <div className="lab-mode-switch" aria-label="Design Lab workspace">
      <button
        type="button"
        aria-pressed={mode === "catalog"}
        onClick={() => setMode("catalog")}
      >
        Component catalog
      </button>
      <button
        type="button"
        aria-pressed={mode === "calibration"}
        onClick={() => setMode("calibration")}
      >
        Creative Calibration 003
      </button>
      <button
        type="button"
        aria-pressed={mode === "hero-expansion"}
        onClick={() => setMode("hero-expansion")}
      >
        Hero Expansion
      </button>
      <button
        type="button"
        aria-pressed={mode === "navigation"}
        onClick={() => setMode("navigation")}
      >
        Collection 003B · Navigation Expansion
      </button>
      <button
        type="button"
        aria-pressed={mode === "story"}
        onClick={() => setMode("story")}
      >
        Collection 004 · Brand / Story
      </button>
      <button
        type="button"
        aria-pressed={mode === "media"}
        onClick={() => setMode("media")}
      >
        Collection 005 · Media / Work
      </button>
      <button
        type="button"
        aria-pressed={mode === "services"}
        onClick={() => setMode("services")}
      >
        Collection 006 · Services / Capabilities
      </button>
      <button
        type="button"
        aria-pressed={mode === "commerce"}
        onClick={() => setMode("commerce")}
      >
        Collection 007 · Commerce / Product
      </button>
      <button type="button" aria-pressed={mode === "proof"} onClick={() => setMode("proof")}>Collection 008 · Social Proof / Results</button>
      <button
        type="button"
        aria-pressed={mode === "batch"}
        onClick={() => setMode("batch")}
      >
        Batch 003 concepts
      </button>
    </div>
  );
  const catalog = (
    <aside className="lab-component-catalog" aria-label="Component catalog">
      <label className="block text-xs font-semibold" htmlFor="de-search">
        Search components
      </label>
      <input
        id="de-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Name or capability"
        className="mt-2 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3 py-2 text-sm"
      />
      <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Categories">
        {(["all", ...componentCategories] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`rounded-md border px-2 py-1 text-xs capitalize ${category === item ? "border-[color:var(--accent)] text-[color:var(--accent)]" : "border-[color:var(--border)]"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-xs font-semibold">
        Lifecycle status
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ComponentStatus | "all")
          }
          className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {componentStatuses.map((item) => (
            <option key={item} value={item}>
              {item[0].toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-4 text-[11px] text-[color:var(--text-secondary)]">
        {results.length} registered{" "}
        {results.length === 1 ? "component" : "components"}
      </p>
      <div className="mt-2 max-h-[55vh] space-y-1 overflow-y-auto">
        {results.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-current={selected?.id === entry.id ? "true" : undefined}
            onClick={() => {
              selectComponent(entry.id);
              setTab("component");
            }}
            className={`w-full rounded-lg border p-3 text-left ${selected?.id === entry.id ? "border-[color:var(--accent)] bg-[color:var(--bg-surface-soft)]" : "border-transparent hover:border-[color:var(--border)]"}`}
          >
            <span className="block text-sm font-semibold">{entry.name}</span>
            <span className="block text-[11px] capitalize text-[color:var(--text-secondary)]">
              {entry.category} ·{" "}
              <span className={`de-lab-status de-lab-status--${entry.status}`}>
                {entry.status}
              </span>
            </span>
          </button>
        ))}
        {results.length === 0 ? (
          <p className="p-3 text-sm text-[color:var(--text-secondary)]">
            No entries match these filters.
          </p>
        ) : null}
      </div>
    </aside>
  );
  const componentControls =
    selected && variant ? (
      <>
        <p role="status">{notice}</p>
        <div className="lab-selected-summary">
          <span>
            {selected.status === "production"
              ? "Production System"
              : "Component implementation"}{" "}
            · {selected.category} · {selected.status}
          </span>
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
        </div>
        <div
          className="lab-control-grid"
          aria-label="Component configuration controls"
        >
          <label className="lab-control-wide">
            Selected component
            <select
              value={selected.id}
              onChange={(event) => {
                selectComponent(event.target.value as DesignComponentId);
              }}
            >
              {results.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          {"composition" in selected && selected.status === "production" && <ActionPreviewControls key={selected.id} section={makeSection(selected.id as SectionId, "action-preview")} onChange={value => setActionPreview({ id: selected.id, value })}/>}
          <CapabilityControl key={`preset-${selected.id}`} label="Preset" value={variant.id}
            choices={selected.previewVariants.map(item => ({ value: item.id, label: item.label }))}
            onPreview={value => {
              if (value === null) { preview(null); return; }
              const defaults = componentDefaultLayers(selected, resolvePreviewConfig(selected.id, value));
              preview({ preset: value, typography: defaults?.typography ?? "legacy", artDirection: defaults?.artDirection ?? "legacy", motion: defaults?.motion ?? "legacy" });
            }}
            onChange={value => { setAudition(null); setVariantId(value); resetLayers(selected.id, value); setNotice("Preset changed: configuration and creative layers reset to defaults."); }} />
          <CapabilityControl
            key={`client-${selected.id}`}
            label="Client adaptation"
            value={activeAdaptation}
            choices={clientChoices}
            onPreview={value => preview(value === null ? null : { client: clientChoice(value) })}
            onChange={(value) => {
              setClientAdaptation(value);
              setBrandDraft(
                activeBrand.logo && selected.category === "navigation"
                  ? {
                      id: selected.id,
                      logo: exampleLogo(
                        clientExample(value).brand,
                        activeBrand.logo.kind,
                      ),
                    }
                  : { id: "" },
              );
              setNotice(
                "Client example content and media changed. Structural settings and creative layers are retained.",
              );
            }}
          />
          {navBrand && (
            <div className="lab-control-wide">
              <NavigationBrandControls
                key={selected.id}
                section={navBrand}
                onPreview={patch => {
                  if (!patch) { preview(null); return; }
                  try {
                    const next = parseSection({ ...navBrand, ...patch });
                    if ("brand" in next.content) preview({ client: { adaptation: activeAdaptation, brand: next.content.brand, logo: next.content.logo } });
                  } catch { preview(null); }
                }}
                onChange={(patch) => {
                  try {
                    const next = parseSection({ ...navBrand, ...patch });
                    if ("brand" in next.content)
                      setBrandDraft({
                        id: selected.id,
                        brand: next.content.brand,
                        logo: next.content.logo,
                      });
                    setNotice("Brand treatment updated.");
                  } catch (error) {
                    setNotice(
                      error instanceof Error
                        ? error.message
                        : "Invalid brand data.",
                    );
                  }
                }}
              />
            </div>
          )}
          {selected.configurations
            .filter((field) => field.name !== "adaptation" && configurationChoiceVisible(selected.id,previewConfig,field.name))
            .filter(
              (field) =>
                field.name !== "settings.heroContrast" ||
                previewConfig["settings.scroll"] === "solidify",
            )
            .map((field) =>
              (motion === "none" || systemMotion.reduced) &&
              (
                selected as DesignComponentDefinition
              ).motionParameters?.includes(field.name) ? (
                <p key={field.name} className="lab-layer-note">
                  {field.name}: inactive while motion is none
                  {systemMotion.reduced ? " (OS reduced motion)" : ""}. Authored
                  value {previewConfig[field.name]} is retained.
                </p>
              ) : (
                  selected as DesignComponentDefinition
                ).responsiveInvariants?.find(
                  (rule) => rule.field === field.name && width <= rule.maxWidth,
                ) ? (
                <p key={field.name} className="lab-layer-note">
                  {field.name}:{" "}
                  {
                    (
                      selected as DesignComponentDefinition
                    ).responsiveInvariants?.find(
                      (rule) =>
                        rule.field === field.name && width <= rule.maxWidth,
                    )?.reason
                  }
                </p>
              ) : (
                <CapabilityControl
                  key={`${selected.id}-${field.name}`}
                  label={field.name}
                  value={previewConfig[field.name]}
                  choices={field.options.map((value) => ({
                    value,
                    reason: configurationReason(selected, field.name, value, {
                      ...layersValue,
                      width,
                    }),
                  }))}
                  onPreview={value => preview(value === null ? null : { values: configurationChoice(field.name, value), ...(field.name === "motion" && value === "none" ? { motion: "legacy" as const } : {}) })}
                  onChange={(value) => {
                    setEditor({
                      id: selected.id,
                      variant: variant.id,
                      values: configurationChoice(field.name, value),
                    });
                    if (field.name === "motion" && value === "none") {
                      setMotion("legacy");
                      setNotice(
                        "Motion behavior is now none; local intensity was reset. The composition remains fully visible.",
                      );
                    }
                  }}
                />
              ),
            )}
        </div>
      </>
    ) : (
      <p>Select a registered component to inspect its preview.</p>
    );
  const layers = (
    <>
      <h2>Creative layers</h2>
      <div className="lab-control-grid">
        <CapabilityControl label="Theme" value={theme} choices={designThemes.map(item => ({value:item.id,label:item.name}))}
          onPreview={value => preview(value === null ? null : {theme:value as typeof theme})}
          onChange={value => setTheme(value as typeof theme)} />
        {capabilities
          ? (["typography", "artDirection", "motion"] as const).map((key) => {
              const cap = capabilities[key],
                value =
                  key === "typography"
                    ? typography
                    : key === "artDirection"
                      ? art
                      : motion;
              const fixed = cap.values.length <= 1;
              if (key === "motion" && systemMotion.reduced)
                return (
                  <p key={key} className="lab-layer-note">
                    Motion intensity: fixed none under OS reduced motion.
                    Authored selection {motion} is retained for a non-reduced
                    context.
                  </p>
                );
              return (
                <CapabilityControl
                  key={`${selected?.id}-${key}`}
                  label={
                    key === "typography"
                      ? "Typography Profile"
                      : key === "artDirection"
                        ? "Art Direction"
                        : "Motion intensity"
                  }
                  value={fixed ? (cap.values[0] ?? "fixed") : value}
                  choices={
                    fixed
                      ? cap.values.map((value) => ({ value }))
                      : [
                          {
                            value: "legacy",
                            label: "Theme / component default",
                          },
                          ...cap.values.map((value) => ({
                            value,
                            reason:
                              key === "artDirection" && selected
                                ? Object.entries(previewConfig)
                                    .map(([field, choice]) =>
                                      configurationReason(
                                        selected,
                                        field,
                                        choice,
                                        {
                                          ...layersValue,
                                          artDirection: value,
                                          width,
                                        },
                                      ),
                                    )
                                    .filter(Boolean)
                                    .join(" ") || undefined
                                : undefined,
                          })),
                        ]
                  }
                  note={cap.reason}
                  onPreview={value => preview(value === null ? null : { [key]: value })}
                  onChange={(value) => {
                    if (key === "typography")
                      setTypography(value as typeof typography);
                    else if (key === "artDirection")
                      setArt(value as typeof art);
                    else setMotion(value as typeof motion);
                  }}
                />
              );
            })
          : null}
      </div>
      <p className="lab-layer-note">
        {designThemes.find((item) => item.id === theme)?.description}
      </p>
    </>
  );
  if (mode === "hero-expansion")
    return (
      <HeroExpansionGallery
        toolbar={workspace}
        workspaceSwitch={workspaceSwitch}
      />
    );
  if (mode === "navigation")
    return (
      <NavigationCollectionGallery
        toolbar={workspace}
        workspaceSwitch={workspaceSwitch}
      />
    );
  if (mode === "proof") return <ProofCollectionGallery toolbar={<>{workspace}<p className="lab-layer-note">Current decision: E01–E12 approved and Production v1.0.0. This preserved creative workspace contains historical review notes. Edit production systems in the normal inventory.</p></>} workspaceSwitch={workspaceSwitch} />;
  if (mode === "commerce")
    return (
      <CommerceCollectionGallery
        toolbar={workspace}
        workspaceSwitch={workspaceSwitch}
      />
    );
  if (mode === "services")
    return (
      <ServiceCollectionGallery
        toolbar={workspace}
        workspaceSwitch={workspaceSwitch}
      />
    );
  if (mode === "media")
    return (
      <MediaCollectionGallery
        toolbar={workspace}
        workspaceSwitch={workspaceSwitch}
      />
    );
  if (mode === "story")
    return (
      <CollectionGallery
        toolbar={workspace}
        workspaceSwitch={workspaceSwitch}
        onInspect={(id) => {
          setCategory("all");
          setStatus("all");
          setQuery("");
          selectComponent(id);
          setTab("component");
          setMode("catalog");
        }}
      />
    );
  if (mode === "batch")
    return (
      <BatchGallery toolbar={workspace} workspaceSwitch={workspaceSwitch} />
    );
  if (mode === "calibration")
    return (
      <CalibrationLab toolbar={workspace} workspaceSwitch={workspaceSwitch} />
    );
  return (
    <LabEditor
      title="Design Lab"
      workspaceSwitch={workspaceSwitch}
      resetKey={selected?.id}
      canvasWidth={(shown?.device ?? device) === "mobile" ? 390 : (shown?.device ?? device) === "tablet" ? 768 : 1440}
      activeTab={tab}
      onTabChange={value => { setAudition(null); setTab(value); }}
      viewportControl={<CapabilityControl label="Viewport" value={device} choices={[{value:"desktop",label:"Desktop"},{value:"tablet",label:"Tablet · 768px"},{value:"mobile",label:"Mobile · 390px"}]}
        onPreview={value => preview(value === null ? null : {device:value})} onChange={setDevice} />}
      toolbar={
        <>
          {workspace}
          <button type="button" onClick={() => setReplay((value) => value + 1)}>
            Replay preview
          </button>
        </>
      }
      tabs={[
        { id: "component", label: "Component", content: componentControls },
        { id: "catalog", label: "Catalog", content: catalog },
        { id: "layers", label: "Layers", content: layers },
        {
          id: "metadata",
          label: "Metadata",
          content: selected ? (
            <section
              className="lab-component-metadata"
              aria-label="Registry metadata"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold">{selected.name}</h2>
                <code className="text-xs text-[color:var(--text-secondary)]">
                  {selected.id}
                </code>
              </div>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                {selected.description}
              </p>
              {"composition" in selected && <p className="mt-3 text-xs">Actions: {getSectionContract(selected.id as SectionId).actions?.classification} · {getSectionContract(selected.id as SectionId).actions?.reason}</p>}
              <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-semibold">Category / complexity</dt>
                  <dd className="mt-1 capitalize">
                    {selected.category} / {selected.complexity}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Status / version</dt>
                  <dd className="mt-1">
                    <span
                      className={`de-lab-status de-lab-status--${selected.status}`}
                    >
                      {selected.status}
                    </span>{" "}
                    / {selected.version}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Styles</dt>
                  <dd className="mt-1">{selected.styles.join(", ")}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Page types</dt>
                  <dd className="mt-1">{selected.pageTypes.join(", ")}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Supported motion</dt>
                  <dd className="mt-1">
                    {selected.supportedMotion.join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Readiness</dt>
                  <dd className="mt-1">
                    Desktop: {selected.responsiveReady.desktop ? "yes" : "no"} ·
                    Tablet: {selected.responsiveReady.tablet ? "yes" : "no"} ·
                    Mobile: {selected.responsiveReady.mobile ? "yes" : "no"} ·
                    Accessibility: {selected.accessibilityReady ? "yes" : "no"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-[color:var(--border)] pt-3 text-xs">
                <h3 className="font-semibold">Available configurations</h3>
                <ul className="mt-2 space-y-1">
                  {selected.configurations.map((config) => (
                    <li key={config.name}>
                      <code>{config.name}</code>: {config.options.join(" / ")}
                    </li>
                  ))}
                </ul>
              </div>
              <details className="mt-4 border-t border-[color:var(--border)] pt-3">
                <summary className="cursor-pointer text-xs font-semibold">
                  Raw registry metadata
                </summary>
                <pre className="mt-2 overflow-auto rounded-md bg-[color:var(--bg-primary)] p-3 text-[11px]">
                  {JSON.stringify(selected, null, 2)}
                </pre>
              </details>
            </section>
          ) : (
            <p>No component selected.</p>
          ),
        },
      ]}
    >
      {issues.length ? (
        <div className="composition-blocked">
          <h2>Resolve unsupported choices</h2>
          <ul>
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              resetLayers();
              setEditor({ id: "", variant: "", values: {} });
              setNotice(
                "Unsupported selections cleared explicitly; component defaults restored.",
              );
            }}
          >
            Use component defaults
          </button>
        </div>
      ) : selected && variant ? (
        <PreviewCanvas key={selected.id} authored={
        <DesignThemeProvider
          key={`${selected.id}-${replay}-${motion}-${art}`}
          theme={theme}
          typography={typography === "legacy" ? undefined : typography}
          artDirection={art === "legacy" ? undefined : art}
          motion={motion === "legacy" ? undefined : motion}
          className={
            selected.category === "primitive" || selected.category === "icon"
              ? "min-h-[14rem]"
              : "min-h-[28rem]"
          }
        >
          {renderDesignPreview(selected.id, variant.id, overrides, {
            adaptation: activeAdaptation,
            ...activeBrand,
            contextualActions: actionPreview.id === selected.id ? actionPreview.value : undefined,
          })}
        </DesignThemeProvider>
        } audition={shown ? (
        <DesignThemeProvider
          key={`${selected.id}-${replay}-${motion}-${art}`}
          theme={shown?.theme ?? theme}
          typography={shownTypography === "legacy" ? undefined : shownTypography}
          artDirection={shownArt === "legacy" ? undefined : shownArt}
          motion={shownMotion === "legacy" ? undefined : shownMotion}
          className={
            selected.category === "primitive" || selected.category === "icon"
              ? "min-h-[14rem]"
              : "min-h-[28rem]"
          }
        >
          {renderDesignPreview(selected.id, shownVariant!, shownOverrides, shown?.client ?? {
            adaptation: activeAdaptation,
            ...activeBrand,
            contextualActions: actionPreview.id === selected.id ? actionPreview.value : undefined,
          })}
        </DesignThemeProvider>
        ) : undefined} />
      ) : (
        <div className="lab-empty-preview">
          Select a registered component to inspect its preview.
        </div>
      )}
    </LabEditor>
  );
}
