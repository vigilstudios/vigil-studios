"use client";
import { ComponentPresentationControls, TestimonialPortraitControls } from "./ComponentPresentationControls";
import { PresentationControls } from "./PresentationControls";
import { resolvePresentation } from "../../presentation/schema";
import { ClientDataEditor, type ClientDataDraft } from "./ClientDataEditor";
import { ContentFields } from "./ContentFields";
import { endingSectionIds, type EndingSectionId } from "../../composition/ending-schemas";
import { CreatorContentEditor } from "./CreatorContentEditor";
import { EndingContentEditor } from "./EndingContentEditor";
import {getDesignComponent} from "../../registry/components";
import type {DesignComponentDefinition} from "../../registry/types";
import { configurationValue, configurationPatch, configurationVisible } from "../../composition/configuration";
import {clientAdaptationsFor,adaptationDataPatch} from "../client-adaptations";
import {NavigationBrandControls} from "../NavigationBrandControls";
import { useEffect, useMemo, useRef, useState, type ReactNode, type SetStateAction } from "react";
import { designComponents } from "../../registry/components";
import { getSectionContract } from "../../composition/catalog";
import { CompositionPreview } from "../../composition/render";
import { inspectComposition, compositionTransitionNotices } from "../../composition/validation";
import { MediaControls } from "./MediaControls";
import { parseSection, type CreativeOverrides, type PageComposition, type SectionId, type SectionInstance, type SiteConfiguration } from "../../composition/schemas";
import { typographyProfiles } from "../../foundations/typography/profiles";
import { artDirections } from "../../foundations/art-direction";
import { designThemes, getDesignTheme } from "../../foundations/themes";
import { compositionFixtures, makeBlankComposition, makeSection } from "./fixtures";
import { compositionOptionGroups, sectionTitle, sectionCategoryLabel } from "./options";
import { AddSectionCard } from "./AddSectionCard";
import { adaptSectionToPageLayers, prepareSectionAddition } from "./addition";

import { PreviewCanvas } from "../PreviewCanvas";
import { CapabilityControl } from "../CapabilityControl";
import { PreviewColorControl } from "../PreviewColorControl";
import { sectionChoiceReason, sectionLayerChoices, transitionSection } from "../../composition/controls";
import { staticMotion } from "../../registry/capabilities";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import { LabEditor } from "../editor/LabEditor";

import { ActionBoundary } from "../../site/ActionBoundary";
import { resolveRoutes } from "../../site/routes";
import { siteFromComposition, pageComposition, type SiteDefinition } from "../../site/model";
import { applyPageComposition, updatePage } from "../../site/operations";
import { deserializeSite, serializeSite, parseSiteDefinition, siteDraftKey } from "../../site/persistence";
import { materializeComposition, navigationIssues } from "../../site/navigation";
import { actionIssues } from "../../site/actions";
import { SiteTree, SiteStructureControls } from "./SiteTree";
import { ActionEditor, SiteActionControl } from "./ActionEditor";
import { ProjectSectionControls, type SourceValue } from "./ProjectControls";
import { mapAssetSources, type WorkspaceAsset } from "@/lib/vigil/professional/document";

export type ComposerProject = { id: string; site: SiteDefinition; assets: WorkspaceAsset[]; sources: SourceValue[];
  context: ReactNode; save: (site: SiteDefinition) => Promise<void>; deploy: () => Promise<void> };

const entries = designComponents.filter(entry => "composition" in entry);
const compositionGroups = compositionOptionGroups(compositionFixtures, entries);
const entryTitle = (id: SectionId) => { const entry = entries.find(entry => entry.id === id); return entry ? sectionTitle(entry) : id; };
const motions = ["none", "restrained", "expressive"];
function Control({ label, value, values, onChange, onPreview }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void; onPreview: (value: string | null) => void }) {
  return <CapabilityControl label={label} value={value} choices={values.map(value => ({ value }))} onChange={onChange} onPreview={onPreview} />;
}
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="composition-panel"><h2>{title}</h2>{children}</section>; }
function CategoryChoices({ groups, value, kind, onChange }: {
  groups: readonly { category: string; label: string; options: readonly { value: string; label: string }[] }[];
  value: string; kind: "demo" | "section"; onChange: (value: string) => void;
}) {
  return <div className="composition-category-choices">{groups.map(group => <label key={group.category} className="composition-category-card">
    <span>{group.label}<small>{group.options.length}</small></span>
    <select aria-label={`${group.label} ${kind}`} value={group.options.some(option => option.value === value) ? value : ""} onChange={event => { if (event.target.value) onChange(event.target.value); }}>
      <option value="" disabled>Choose {kind === "section" ? "a section" : "a demo"}…</option>
      {group.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>)}</div>;
}

export function CompositionLab({ workspaceSwitch, project }: { workspaceSwitch?: ReactNode; project?: ComposerProject }) {
  const systemMotion = useMotionPolicy();
  const [site, setSite] = useState<SiteDefinition>(() => project?.site ?? siteFromComposition(makeBlankComposition()));
  const [pageId, setPageId] = useState(project?.site.navigation.homePageId ?? "page-home");
  const [saving, setSaving] = useState(false);
  const [clientDrafts, setClientDrafts] = useState<Record<string, ClientDataDraft | undefined>>({});
  const [inspectorTab, setInspectorTab] = useState("design");
  const [savedDocument, setSavedDocument] = useState(() => project ? serializeSite(project.site) : "");
  const dirty = Boolean(project && serializeSite(site) !== savedDocument);
  async function saveProject() {
    if (!project || saving) return;
    setSaving(true);
    try { await project.save(site); setSavedDocument(serializeSite(site)); setStorageNotice("Project saved."); }
    catch (failure) { setStorageNotice(failure instanceof Error ? failure.message : "Save failed. Your edits remain here."); }
    finally { setSaving(false); }
  }
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const composition = useMemo(() => pageComposition(site, pageId), [site, pageId]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [siteError, setSiteError] = useState("");
  function setComposition(value: SetStateAction<PageComposition>) {
    try { const next = typeof value === "function" ? value(composition) : value; setSite(previous => applyPageComposition(previous, pageId, typeof value === "function" ? value(pageComposition(previous, pageId)) : next)); setSiteError(""); }
    catch (error) { setSiteError(error instanceof Error ? error.message : "Invalid site edit."); }
  }
  function commitSite(next: SiteDefinition) { try { setSite(parseSiteDefinition(next)); setSiteError(""); } catch (error) { setSiteError(error instanceof Error ? error.message : "Invalid site definition."); } }
  useEffect(() => {
    if (project) return;
    const timer = setTimeout(() => {
      try { const json = localStorage.getItem(siteDraftKey); if (json) { const saved = deserializeSite(json); setSite(saved); setPageId(saved.navigation.homePageId); } setStorageReady(true); }
      catch { setStorageNotice("Saved draft could not be loaded. It is preserved; export or import a valid document, then choose Save local draft to replace it."); }
    }, 0);
    return () => clearTimeout(timer);
  }, [project]);
  useEffect(() => {
    if (project || !storageReady) return;
    const timer = setTimeout(() => { try { localStorage.setItem(siteDraftKey, serializeSite(site)); setStorageNotice("Local draft saved. Export JSON for repository storage."); } catch { setStorageNotice("Local draft could not be saved. Export JSON to retain your work."); } }, 250);
    return () => clearTimeout(timer);
  }, [site, storageReady, project]);
  const [fixture, setFixture] = useState("blank-canvas");
  const [selected, setSelected] = useState("");
  const [device, setDevice] = useState("desktop");
  const [previewDevice, setPreviewDevice] = useState<string | null>(null);
  const shownDevice = previewDevice ?? device;
  const [replay, setReplay] = useState(0);
  const [tab, setTab] = useState("sections");
  const [inspect, setInspect] = useState(true);
  const [previewStyle, setPreviewStyle] = useState<SectionId | null>(null);
  const [sectionPreview, setSectionPreview] = useState<{ base: SectionInstance; candidate: SectionInstance; label: string } | null>(null);
  const [layerPreview, setLayerPreview] = useState<{ base: PageComposition; candidate: PageComposition; scope: "site" | "page"; label: string } | null>(null);
  const clearDialog = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const presetPicker = useRef<HTMLDetailsElement>(null);
  const current = composition.sections.find(section => section.id === selected) ?? composition.sections[0];
  const addition = useMemo(() => previewStyle && tab === "sections" ? prepareSectionAddition(composition, previewStyle) : null, [previewStyle, tab, composition]);
  const pending = addition && !addition.reason ? addition : null;
  const editing = sectionPreview?.base === current ? sectionPreview : null;
  const layerEditing = layerPreview?.scope === (tab === "pages" ? "page" : tab) && layerPreview.base === composition ? layerPreview : null;
  const shownComposition = useMemo(() => pending?.composition ?? layerEditing?.candidate ?? (editing ? { ...composition, sections: composition.sections.map(section => section.id === editing.candidate.id ? editing.candidate : section) } : composition), [pending, editing, layerEditing, composition]);
  const auditionId = pending?.section.id ?? editing?.candidate.id;
  const actionWarnings = actionIssues(site);
  const pageWarnings = actionWarnings.filter(issue => !issue.pageId || issue.pageId === pageId).map(issue => ({ code: "action", section: issue.sectionId, message: issue.message }));
  const navWarnings = composition.sections.flatMap(section => navigationIssues(site, section).map(message => ({ code: "navigation-tree", section: section.id, message })));
  let renderedComposition = composition, renderedAudition = shownComposition;
  if (!pageWarnings.length && !navWarnings.length) {
    try { renderedComposition = materializeComposition(site, composition); renderedAudition = materializeComposition(site, shownComposition); }
    catch (error) { pageWarnings.push({ code: "action", section: undefined, message: String(error) }); }
  }
  const authoredInspection = inspectComposition(renderedComposition);
  if (project) {
    renderedComposition = mapAssetSources(renderedComposition, project.assets);
    renderedAudition = mapAssetSources(renderedAudition, project.assets);
  }
  const inspection = { ...authoredInspection, issues: [...authoredInspection.issues, ...pageWarnings, ...navWarnings] };
  function selectPage(id: string) { setPreviewStyle(null); setSectionPreview(null); setLayerPreview(null); setPageId(id); setSelected(""); setFixture("site-page"); setReplay(value => value + 1); }
  function layerIssues(candidate: PageComposition, scope: "site" | "page") {
    if (scope === "page") return inspectComposition(candidate).issues;
    return site.pages.flatMap(page => inspectComposition(page.id === pageId ? candidate : { ...pageComposition(site, page.id), site: candidate.site }).issues.map(issue => ({ ...issue, message: `${page.title}: ${issue.message}` })));
  }
  const transitions = compositionTransitionNotices(composition);
  function updateSection(section: SectionInstance) { setSectionPreview(null); setLayerPreview(null); setComposition(value => ({ ...value, sections: value.sections.map(item => item.id === section.id ? section : item) })); }
  function move(id: string, direction: -1 | 1) {
    setComposition(value => {
      const sections = [...value.sections], index = sections.findIndex(section => section.id === id), next = index + direction;
      if (index < 0 || next < 0 || next >= sections.length) return value;
      [sections[index], sections[next]] = [sections[next], sections[index]];
      return { ...value, sections };
    });
  }
  function sitePatch(patch: Partial<SiteConfiguration>): PageComposition {
    return { ...composition, site: { ...composition.site, ...patch } };
  }
  function globalLayer(key: keyof CreativeOverrides, value: string, scope: "site" | "page"): PageComposition {
    if (scope === "site") return { ...composition, site: { ...composition.site, [key]: value } };
    const overrides = { ...composition.overrides };
    if (value === "inherit") delete overrides[key]; else Object.assign(overrides, { [key]: value });
    return { ...composition, overrides };
  }
  function previewLayer(candidate: PageComposition | null, scope: "site" | "page", label: string) {
    if (!candidate || layerIssues(candidate, scope).length) {
      setLayerPreview(previous => previous?.label === label ? null : previous); return;
    }
    setLayerPreview({ base: composition, candidate, scope, label });
  }
  function commitLayers(candidate: PageComposition) {
    if (layerIssues(candidate, tab === "site" ? "site" : "page").length) return;
    setLayerPreview(null); setComposition(candidate);
  }
  function colorCandidate(key: string, color: string) {
    return sitePatch({ brand: { ...composition.site.brand, colors: { ...composition.site.brand.colors, [key]: color } } });
  }
  const clearedColors = () => sitePatch({ brand: { theme: composition.site.brand.theme } });
  useEffect(() => {
    preview.current?.querySelectorAll<HTMLElement>("[data-section-id]").forEach(node => {
      node.toggleAttribute("data-lab-selected", inspect && node.dataset.sectionId === current?.id);
      node.toggleAttribute("data-lab-preview", Boolean(layerEditing) || node.dataset.sectionId === auditionId);
    });
  }, [shownComposition, auditionId, layerEditing, current?.id, inspect, replay]);
  const previewSectionId = pending?.section.id;
  useEffect(() => {
    if (!previewSectionId) return;
    const frame = requestAnimationFrame(() => {
      preview.current?.querySelectorAll<HTMLElement>("[data-section-id]").forEach(node => {
        if (node.dataset.sectionId === previewSectionId) node.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [previewStyle, previewSectionId]);
  function findSection(id: string) {
    preview.current?.querySelectorAll<HTMLElement>("[data-section-id]").forEach(node => {
      if (node.dataset.sectionId === id) node.scrollIntoView({ block: "start", inline: "nearest" });
    });
  }
  function selectSection(id: string) { setSectionPreview(null); setLayerPreview(null); setSelected(id); setTab("sections"); requestAnimationFrame(() => findSection(id)); }
  const globalReason = (key: keyof CreativeOverrides, value: string, scope: "site" | "page") => layerIssues(globalLayer(key, value, scope), scope).map(issue => `${issue.section ?? "Page"}: ${issue.message}`).join(" ") || undefined;
  const siteControls = <><Panel title="Site presentation"><PresentationControls scope="site" value={composition.site.presentation} onChange={presentation => setComposition(sitePatch({presentation}))}/><PresentationControls scope="site" motionOnly value={composition.site.presentation} onChange={presentation => setComposition(sitePatch({presentation}))}/></Panel><SiteStructureControls site={site} pageId={pageId} onChange={commitSite}/><SiteActionControl site={site} onChange={commitSite}/><Panel title="Site layers"><p>Shared defaults for pages across the site. Page and section overrides take precedence.</p><div className="composition-controls">
    <CapabilityControl label="Typography profile" value={composition.site.typography} choices={typographyProfiles.map(profile => ({ value: profile.id, reason: globalReason("typography", profile.id, "site") }))}
      onPreview={value => previewLayer(value === null ? null : globalLayer("typography", value, "site"), "site", "Typography profile")} onChange={value => commitLayers(globalLayer("typography", value, "site"))} />
    <CapabilityControl label="Art direction" value={composition.site.artDirection} choices={artDirections.map(art => ({ value: art.id, reason: globalReason("artDirection", art.id, "site") }))}
      onPreview={value => previewLayer(value === null ? null : globalLayer("artDirection", value, "site"), "site", "Art direction")} onChange={value => commitLayers(globalLayer("artDirection", value, "site"))} />
    <Control label="Brand theme" value={composition.site.brand.theme} values={designThemes.map(theme => theme.id)}
      onPreview={value => previewLayer(value === null ? null : sitePatch({ brand: { ...composition.site.brand, theme: value as SiteConfiguration["brand"]["theme"] } }), "site", "Brand theme")}
      onChange={value => commitLayers(sitePatch({ brand: { ...composition.site.brand, theme: value as SiteConfiguration["brand"]["theme"] } }))} />
    {systemMotion.reduced ? <p className="lab-layer-note">Effective motion: none under OS reduced motion. Authored site intensity {composition.site.motion} is retained.</p> : <CapabilityControl label="Motion intensity" value={composition.site.motion} choices={motions.map(value => ({ value, reason: globalReason("motion", value, "site") }))}
      onPreview={value => previewLayer(value === null ? null : globalLayer("motion", value, "site"), "site", "Motion intensity")} onChange={value => commitLayers(globalLayer("motion", value, "site"))} />}
    <Control label="Icon stroke" value={String(composition.site.icons.strokeWidth)} values={["1.5", "2"]}
      onPreview={value => previewLayer(value === null ? null : sitePatch({ icons: { id: "core", strokeWidth: Number(value) as 1.5 | 2 } }), "site", "Icon stroke")}
      onChange={value => commitLayers(sitePatch({ icons: { id: "core", strokeWidth: Number(value) as 1.5 | 2 } }))} />
  </div><details><summary>Semantic brand colors</summary><p>Navbar contrast uses the lighter and darker colors from this background/foreground pair. Brand keeps their normal order.</p><div className="composition-colors">{Object.entries(getDesignTheme(composition.site.brand.theme).tokens.color).map(([key, fallback]) => <PreviewColorControl key={key} label={key} fallback={fallback}
    value={composition.site.brand.colors?.[key as keyof NonNullable<SiteConfiguration["brand"]["colors"]>] ?? fallback}
    palette={designThemes.flatMap(theme => Object.values(theme.tokens.color))}
    onPreview={value => previewLayer(value === null ? null : colorCandidate(key, value), "site", `${key} color`)} onChange={value => commitLayers(colorCandidate(key, value))} />)}</div>
    <button type="button" onPointerEnter={event => { if (event.pointerType !== "touch") previewLayer(clearedColors(), "site", "Clear color overrides"); }} onPointerLeave={() => previewLayer(null, "site", "Clear color overrides")}
      onFocus={() => previewLayer(clearedColors(), "site", "Clear color overrides")} onBlur={() => previewLayer(null, "site", "Clear color overrides")} onClick={() => commitLayers(clearedColors())}>Clear color overrides</button>
  </details></Panel><p role="status">{storageNotice}</p>{!project && <button type="button" onClick={() => { try { localStorage.setItem(siteDraftKey, serializeSite(site)); setStorageReady(true); setStorageNotice("Local draft saved."); } catch { setStorageNotice("Storage unavailable. Export site JSON."); } }}>Save local draft</button>}</>;
  const pageControls = <><Panel title="Page presentation"><PresentationControls scope="page" value={composition.presentation} inherited={composition.site.presentation} onChange={presentation => setComposition({...composition,presentation})}/><PresentationControls scope="page" motionOnly value={composition.presentation} inherited={composition.site.presentation} onChange={presentation => setComposition({...composition,presentation})}/></Panel><Panel title="Page overrides"><p>Overrides for this page. Inherit uses the site defaults; section overrides take precedence.</p><div className="composition-controls">
    <CapabilityControl label="Page typography" value={composition.overrides?.typography ?? "inherit"} choices={["inherit", ...typographyProfiles.map(profile => profile.id)].map(value => ({ value, reason: globalReason("typography", value, "page") }))}
      onPreview={value => previewLayer(value === null ? null : globalLayer("typography", value, "page"), "page", "Page typography")} onChange={value => commitLayers(globalLayer("typography", value, "page"))} />
    <CapabilityControl label="Page art direction" value={composition.overrides?.artDirection ?? "inherit"} choices={["inherit", ...artDirections.map(art => art.id)].map(value => ({ value, reason: globalReason("artDirection", value, "page") }))}
      onPreview={value => previewLayer(value === null ? null : globalLayer("artDirection", value, "page"), "page", "Page art direction")} onChange={value => commitLayers(globalLayer("artDirection", value, "page"))} />
    {systemMotion.reduced ? <p className="lab-layer-note">Effective motion: none under OS reduced motion. Authored page intensity {composition.overrides?.motion ?? "inherit"} is retained.</p> : <CapabilityControl label="Page motion" value={composition.overrides?.motion ?? "inherit"} choices={["inherit", ...motions].map(value => ({ value, reason: globalReason("motion", value, "page") }))}
      onPreview={value => previewLayer(value === null ? null : globalLayer("motion", value, "page"), "page", "Page motion")} onChange={value => commitLayers(globalLayer("motion", value, "page"))} />}
  </div></Panel></>;
  const sectionList = <Panel title="Layout"><ol className="composition-sections">{composition.sections.map((section, index) => <li key={section.id}>
          <button type="button" className="composition-section-choice" aria-pressed={selected === section.id} onClick={() => selectSection(section.id)}>{entryTitle(section.component)}<span>{section.id} · {sectionCategoryLabel(section.component)}</span></button>
          <div><button type="button" disabled={index === 0} aria-label={`Move ${section.id} up`} onClick={() => move(section.id, -1)}>↑</button><button type="button" disabled={index === composition.sections.length - 1} aria-label={`Move ${section.id} down`} onClick={() => move(section.id, 1)}>↓</button><button type="button" aria-label={`Remove ${section.id}`} onClick={() => setComposition(previous => ({ ...previous, sections: previous.sections.filter(item => item.id !== section.id) }))}>Remove</button></div>
        </li>)}</ol>
          <AddSectionCard key={`${fixture}-${replay}`} composition={composition} onPreview={setPreviewStyle} onAdd={(next, section) => {
            if (section.component.startsWith("footer.")) {
              const derived = parseSection({ ...section, navigationSource: { mode: "site", depth: "all" } });
              if (!navigationIssues(site, derived).length) { section = derived; next = { ...next, sections: next.sections.map(item => item.id === section.id ? section : item) }; }
            }
            setPreviewStyle(null); setComposition(next); setSelected(section.id); setTab("sections"); requestAnimationFrame(() => { findSection(section.id); preview.current?.closest(".lab-editor")?.querySelector<HTMLButtonElement>('.lab-panel-tabs [aria-selected="true"]')?.focus(); }); }} />
        </Panel>;
  const selectionControls = <>    <p className="lab-layer-note">{site.pages.find(page => page.id === pageId)?.title} · {current ? entryTitle(current.component) : "Choose a section"}</p><div className="composition-selection"><label className="composition-control">Selected section<select aria-label="Selected section" value={current?.id ?? ""} onChange={event => selectSection(event.target.value)}>{composition.sections.map(section => <option key={section.id} value={section.id}>{entryTitle(section.component)} · {section.id}</option>)}</select></label><button type="button" disabled={!current} onClick={() => current && findSection(current.id)}>Find in preview ↗</button></div>
</>;
  const sectionControls = <>{selectionControls}{current && <ComponentPresentationControls key={`custom-${pageId}-${current.id}`} section={current} onChange={updateSection}/>}{current && <PresentationControls key={`presentation-${pageId}-${current.id}-${current.component}`} value={current.presentation} inherited={resolvePresentation(composition.site.presentation,composition.presentation)} navigation={current.component.startsWith("navigation.")} onChange={presentation => updateSection(transitionSection(current,{presentation}).section)}/>}{current ? <SectionInspector key={`design-${pageId}-${current.id}-${current.component}`} section={current} composition={composition} width={device === "mobile" ? 390 : device === "tablet" ? 768 : 1440} onChange={updateSection} onPreview={(candidate, label) => setSectionPreview(previous => candidate ? { base: current, candidate, label } : previous?.label === label ? null : previous)} /> : <p>Add a section to begin.</p>}</>;
  const contentControls = <>{selectionControls}{current && <>
    <ActionEditor key={`actions-${pageId}-${current.id}-${current.component}`} site={site} section={current} onChange={updateSection} onPreview={candidate => setSectionPreview(candidate ? { base: current, candidate, label: "Contextual actions" } : null)} onSiteChange={commitSite} onOpenPages={() => setTab("pages")}/>
    <CreatorContentEditor key={`creator-${pageId}-${current.id}-${current.component}`} section={current} onChange={updateSection}/>
    <EndingContentEditor key={`ending-${pageId}-${current.id}-${current.component}`} site={site} section={current} onChange={updateSection}/>
    {!current.component.startsWith("navigation.") && !["about.creator-profile", "proof.social-reach"].includes(current.component) && !endingSectionIds.includes(current.component as EndingSectionId) && <ContentFields key={`copy-${pageId}-${current.id}-${current.component}`} section={current} onChange={updateSection}/>}
    {project && <ProjectSectionControls key={`project-${pageId}-${current.id}`} section={current} assets={project.assets} sources={project.sources} onChange={section => { try { updateSection(transitionSection(current, { content: section.content, ...("media" in section ? { media: section.media } : {}) }).section); setSiteError(""); } catch (failure) { setSiteError(failure instanceof Error ? failure.message : "Invalid client data."); } }}/>}
    <TestimonialPortraitControls section={current} onChange={updateSection}/>
    <MediaControls key={`media-${pageId}-${current.id}`} section={current} onChange={patch => updateSection(transitionSection(current, patch).section)}/>
    <ClientDataEditor key={`json-${pageId}-${current.id}-${current.component}`} section={current} draft={clientDrafts[`${pageId}-${current.id}-${current.component}`]} onChange={updateSection} onDraft={draft => setClientDrafts(previous => ({ ...previous, [`${pageId}-${current.id}-${current.component}`]: draft }))}/>
  </>}</>;
  const qaControls = <><Panel title="Compatibility"><div aria-live="polite" role="status">{inspection.issues.length ? <ul className="composition-issues">{inspection.issues.map((issue, index) => <li key={index}><strong>{issue.section ?? "Page"}</strong>: {issue.message}</li>)}</ul> : <p>Declared capabilities are compatible. Review content, contrast and media at each width.</p>}</div>{transitions.length ? <ul className="composition-transitions">{transitions.map((notice,index)=><li key={index}><strong>{notice.section}</strong>: {notice.message}</li>)}</ul> : null}</Panel><Panel title="Site action diagnostics"><p role="alert">{siteError}</p>{actionWarnings.length ? <ul>{actionWarnings.map((issue, index) => <li key={index}>{issue.pageId ?? "Site"} / {issue.sectionId ?? "Navigation"}: {issue.message}</li>)}</ul> : <p>No broken typed actions.</p>}</Panel><details><summary>Site Definition / JSON</summary><pre>{JSON.stringify(site, null, 2)}</pre></details><p className="composition-footnote">Images are retained generated review studies. Client projects supply their own content, licensed media and font bindings. Footers can be shared globally or overridden per page.</p></>;
  return <div className="composition-lab" onKeyDown={event => { if (event.key === "Escape") { setPreviewStyle(null); setSectionPreview(null); setLayerPreview(null); } }}><LabEditor title="Composition Lab" workspaceSwitch={workspaceSwitch} resetKey={fixture} canvasWidth={shownDevice === "mobile" ? 390 : shownDevice === "tablet" ? 768 : 1440} activeTab={tab} onTabChange={value => { setPreviewStyle(null); setSectionPreview(null); setLayerPreview(null); setTab(value); }}
    viewportControl={<Control label="Viewport" value={device} values={["desktop", "tablet", "mobile"]} onChange={setDevice} onPreview={setPreviewDevice} />}
    toolbar={<>
      {project && <><button type="button" disabled={saving} onClick={saveProject}>{saving ? "Saving…" : dirty ? "Save project · unsaved" : "Save project"}</button><button type="button" disabled={dirty || saving} title={dirty ? "Save the current edits before deployment" : "Export this saved project and deploy its preview"} onClick={async () => { try { await project.deploy(); setStorageNotice("Preview job queued. Open Project to follow deployment status."); } catch (failure) { setStorageNotice(failure instanceof Error ? failure.message : "Could not deploy preview."); } }}>Deploy preview</button><span role="status">{storageNotice}</span></>}
      <button type="button" onClick={() => setTab("pages")}>Site Tree · {site.pages.find(page => page.id === pageId)?.title}</button>
      <details ref={presetPicker} className="composition-preset-picker" onKeyDown={event => { if (event.key === "Escape" && presetPicker.current) { presetPicker.current.open = false; presetPicker.current.querySelector("summary")?.focus(); } }}>
        <summary>Demo <span>{compositionGroups.flatMap(group => group.options).find(option => option.value === fixture)?.label ?? "Blank canvas"}</span></summary>
        <div className="composition-preset-bar"><div className="composition-preset-heading"><strong>Choose a demo</strong><button type="button" aria-label="Close composition categories" onClick={() => { if (presetPicker.current) { presetPicker.current.open = false; presetPicker.current.querySelector("summary")?.focus(); } }}>×</button></div>
        <CategoryChoices groups={compositionGroups} value={fixture} kind="demo" onChange={value => {
        const next = compositionFixtures.find(item => item.id === value)!;
        setPreviewStyle(null); setSectionPreview(null); setLayerPreview(null); setFixture(next.id); const seed = { ...structuredClone(next), id: composition.id, label: composition.label, site: composition.site, overrides: { ...next.overrides, typography: next.overrides?.typography ?? next.site.typography, artDirection: next.overrides?.artDirection ?? next.site.artDirection, motion: next.overrides?.motion ?? next.site.motion } };
        seed.sections = seed.sections.map(section => adaptSectionToPageLayers(seed, section)); setComposition(seed); setSelected(next.sections.find(section => getSectionContract(section.component).category === "hero")?.id ?? next.sections[0]?.id ?? ""); setTab("sections");
        if (presetPicker.current) { presetPicker.current.open = false; presetPicker.current.querySelector("summary")?.focus(); }
      }} /></div></details>
      <button type="button" onClick={() => { setPreviewStyle(null); setSectionPreview(null); setLayerPreview(null); clearDialog.current?.showModal(); }}>Clear canvas</button>
      <button type="button" aria-pressed={inspect} onClick={() => setInspect(value => !value)}>{inspect ? "Select on canvas" : "Interact with preview"}</button>
      <button type="button" title="Replay motion" onClick={() => { setSectionPreview(null); setLayerPreview(null); setReplay(value => value + 1); }}>Replay</button>
      {siteError && <span role="alert">{siteError}</span>}
      <span className={`composition-health ${inspection.issues.length ? "composition-health--error" : ""}`}><button type="button" onClick={() => setTab("qa")}>{inspection.issues.length ? `${inspection.issues.length} issues` : "Compatible"}</button></span>
    </>}
    inspectorTabs={[{ id: "design", label: "Design", content: sectionControls }, { id: "content", label: "Content", content: contentControls }, { id: "motion", label: "Motion", content: <>{selectionControls}{current && <PresentationControls key={`motion-${pageId}-${current.id}-${current.component}`} motionOnly value={current.presentation} inherited={resolvePresentation(composition.site.presentation,composition.presentation)} navigation={current.component.startsWith("navigation." )} onChange={presentation => updateSection(transitionSection(current,{presentation}).section)}/>}</> }]} inspectorTab={inspectorTab} onInspectorTabChange={setInspectorTab}
    tabs={[
      ...(project ? [{ id: "project", label: "Project", content: project.context }] : []),
      { id: "sections", label: "Sections", content: sectionList },
      { id: "pages", label: "Pages", content: <><SiteTree site={site} pageId={pageId} onChange={commitSite} onImport={next => { setClientDrafts({}); commitSite(next); }} onSelect={selectPage}/>{pageControls}</> },
      { id: "site", label: "Site", content: siteControls },
      { id: "qa", label: "QA", content: qaControls },
    ]}>
      <div ref={preview} className="composition-selectable" data-inspect={inspect} onClickCapture={event => {
        if (!(event.target instanceof Element)) return;
        const fullPreview = event.currentTarget.closest(".lab-editor")?.getAttribute("data-full-preview") === "true";
        if (!inspect || fullPreview) {
          const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
          if (anchor && !anchor.hasAttribute("download")) {
            const href = anchor.getAttribute("href")!, [path, sectionId] = href.split("#");
            const target = [...resolveRoutes(site)].find(([, route]) => route === path);
            if (target) { event.preventDefault(); selectPage(target[0]); if (sectionId) requestAnimationFrame(() => requestAnimationFrame(() => findSection(sectionId))); }
          }
          return;
        }
        const slot = event.target.closest<HTMLElement>("[data-section-id]");
        if (!slot?.dataset.sectionId) return;
        event.preventDefault(); event.stopPropagation(); setSelected(slot.dataset.sectionId); setTab("sections");
      }}>
        {(pending || editing || layerEditing) && <p className="composition-preview-notice" role="status">{pending ? "Preview · click the style to add" : `Preview · ${layerEditing?.label ?? editing?.label} · click to apply`}</p>}
        {inspection.issues.length === 0 ? composition.sections.length === 0 && !pending ? <div className="composition-empty-canvas"><h2>Blank canvas</h2><p>Choose a style in Layout, or start from a demo composition.</p><button type="button" onClick={() => setTab("sections")}>Browse layouts</button></div> : <PreviewCanvas key={`${fixture}-${replay}`} authored={<ActionBoundary site={site} composition={renderedComposition}><CompositionPreview key={replay} composition={renderedComposition} /></ActionBoundary>} audition={pending || editing || layerEditing ? <ActionBoundary site={site} composition={renderedAudition}><CompositionPreview key={replay} composition={renderedAudition} /></ActionBoundary> : undefined} /> : <div className="composition-blocked"><h2>Resolve compatibility to preview</h2><ul>{inspection.issues.map((issue, index) => <li key={index}>{issue.section ?? "Page"}: {issue.message}</li>)}</ul><button type="button" onClick={() => setTab("qa")}>Open diagnostics</button></div>}
      </div>
  </LabEditor>
    <dialog ref={clearDialog} className="composition-clear-dialog" aria-labelledby="clear-canvas-title" aria-describedby="clear-canvas-description">
      <h2 id="clear-canvas-title">Clear this page’s canvas?</h2>
      <p id="clear-canvas-description">This page’s sections and page overrides will be removed. Shared site settings and other pages are preserved. This cannot be undone.</p>
      <div><button type="button" autoFocus onClick={() => clearDialog.current?.close()}>Cancel</button><button type="button" onClick={() => {
        setPreviewStyle(null); setSectionPreview(null); setLayerPreview(null); commitSite(updatePage(site, pageId, { sections: [], overrides: undefined, slots: { navigation: { mode: "omit" }, footer: { mode: "omit" } } })); setFixture("blank-canvas"); setSelected(""); setTab("sections"); setReplay(value => value + 1); clearDialog.current?.close();
      }}>Confirm clear canvas</button></div>
    </dialog>
  </div>;
}

function SectionInspector({ section, composition, width, onChange, onPreview }: { section: SectionInstance; composition: PageComposition; width:number; onChange: (section: SectionInstance) => void; onPreview: (section: SectionInstance | null, label: string) => void }) {
  const contract = getSectionContract(section.component);
  const systemMotion = useMotionPolicy();
  const [clientAdaptation,setClientAdaptation]=useState("authored");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const previewPatch = (patch: Record<string, unknown> | null, label: string) => {
    if (!patch) { onPreview(null, label); return; }
    try {
      const next = transitionSection(section, patch).section;
      onPreview(sectionChoiceReason(composition, section, next) ? null : next, label);
    } catch { onPreview(null, label); }
  };
  const layerPatch = (key: keyof CreativeOverrides, value: string) => {
    const overrides = { ...section.overrides };
    if (value === "inherit") delete overrides[key]; else Object.assign(overrides, { [key]: value });
    return { overrides };
  };
  const update = (patch: Record<string, unknown>) => { try { const next = transitionSection(section, patch); const reason = sectionChoiceReason(composition, section, next.section); if (reason) throw new Error(reason); onChange(next.section); setNotice(next.notice); setError(""); } catch (error) { setError(error instanceof Error ? error.message : "Invalid section."); } };
  const replacements = entries.filter(entry => entry.category === contract.category).map(entry => {
    const candidate = adaptSectionToPageLayers(composition, makeSection(entry.id as SectionId, section.id));
    return { entry, candidate, reason: sectionChoiceReason(composition, section, candidate) };
  });
  return <Panel title={`Section · ${section.id}`}><details className="composition-dna"><summary>Structural identity</summary><p>{contract.structuralDNA}</p>{contract.usage ? <p>Usage: {contract.usage}</p> : null}{contract.commerce ? <><p>Merchandising: {contract.commerce.merchandisingIntent}</p><p>Catalog: {contract.commerce.catalogScale.join(", ")}</p>{contract.commerce.productDetail.length > 0 && <p>Product Detail: {contract.commerce.productDetail.join(", ")}</p>}</> : null}{contract.evidence ? <><p>Evidence: {contract.evidence.model} · {contract.evidence.scale} scale</p>{contract.evidence.idealRange && <p>Ideal: {contract.evidence.idealRange.min}–{contract.evidence.idealRange.max} distinct records</p>}<p>{contract.evidence.integrity}</p></> : null}{contract.supportedContentTypes ? <p>Content: {contract.supportedContentTypes.join(", ")}</p> : null}{contract.itemRange ? <p>Range: {contract.itemRange.min}–{contract.itemRange.max} {contract.itemRange.unit}</p> : null}{contract.contentConstraints ? <p>{contract.contentConstraints}</p> : null}{contract.mediaRequirements ? <p>{contract.mediaRequirements}</p> : null}</details><div className="composition-controls">
    <p className="lab-layer-note">Replacing the registered structure loads its example content, media and defaults, and chooses supported local layers where needed. Global layers remain unchanged.</p><div className="composition-control--wide"><CapabilityControl label="Registered structure" value={section.component} choices={replacements.map(({ entry, reason }) => ({ value: entry.id, label: sectionTitle(entry), reason }))} onPreview={value => { const replacement = replacements.find(item => item.entry.id === value); onPreview(replacement && !replacement.reason ? replacement.candidate : null, "Registered structure"); }} onChange={value => { const replacement = replacements.find(item => item.entry.id === value); if (replacement && !replacement.reason) { onChange(replacement.candidate); if (replacement.candidate.component !== section.component) requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.composition-lab .lab-panel-tabs [aria-selected="true"]')?.focus()); } }} /></div>
    <CapabilityControl label="Client adaptation" value={clientAdaptation} choices={[{value:"authored",label:"Current client data"},...clientAdaptationsFor(section.component).filter(c=>c.value!=="authored")]} note="Loads example content and media while retaining structure, creative layers and behavior."
      onPreview={value=>{try{previewPatch(value===null?null:adaptationDataPatch(section,value),"Client adaptation");}catch{previewPatch(null,"Client adaptation");}}}
      onChange={value=>{try{update(adaptationDataPatch(section,value));setClientAdaptation(value);}catch(error){setError(error instanceof Error?error.message:"Invalid client example.");}}}/>
    <div className="composition-control--wide"><NavigationBrandControls section={section} onChange={update} onPreview={patch=>previewPatch(patch,"Brand treatment")}/></div>
    <CapabilityControl label="Section width" value={section.sectionWidth ?? "default"} choices={[{value:"default",label:"Original / contained"},{value:"full",label:"Full width · keep gutters"},{value:"edge",label:"Edge to edge · no gutters"}]} onPreview={value => previewPatch(value === null ? null : {sectionWidth:value}, "Section width")} onChange={value => update({sectionWidth:value})}/>
    <CapabilityControl label="Structural variant" value={section.structure} choices={contract.variants.map(value => ({ value, reason: sectionChoiceReason(composition, section, { structure: value }) }))} onPreview={value => previewPatch(value === null ? null : { structure: value }, "Structural variant")} onChange={value => update({ structure: value })} />
    <CapabilityControl label="Motion behavior" value={section.motion} note={section.motion === "none" ? staticMotion.reason : "OS reduced motion overrides selected intensity."} choices={contract.motion.map(value => ({ value, reason: sectionChoiceReason(composition, section, { motion: value }) }))} onPreview={value => previewPatch(value === null ? null : { motion: value }, "Motion behavior")} onChange={value => update({ motion: value })} />
    {(contract.configuration??[]).filter(field=>configurationVisible(section,field.name)).map(field=>{const invariant=(getDesignComponent(section.component) as DesignComponentDefinition).responsiveInvariants?.find(rule=>rule.field===field.name&&width<=rule.maxWidth);return invariant?<p key={field.name} className="lab-layer-note">{field.name}: {invariant.reason}</p>:<CapabilityControl key={field.name} label={field.name.replace("settings.","").replace(/([A-Z])/g," $1")} value={configurationValue(section,field.name)} choices={field.options.map(value=>({value,reason:sectionChoiceReason(composition,section,configurationPatch(section,field.name,value))}))} onPreview={value=>previewPatch(value===null?null:configurationPatch(section,field.name,value),field.name)} onChange={value=>update(configurationPatch(section,field.name,value))}/>;})}
    {"placement" in section ? <CapabilityControl label="Navigation placement" value={section.placement} choices={contract.compatibility.navigation!.placements.map(value => ({ value, reason: sectionChoiceReason(composition, section, { placement: value }) }))} onPreview={value => previewPatch(value === null ? null : { placement: value }, "Navigation placement")} onChange={value => update({ placement: value })} /> : null}
    {systemMotion.reduced && section.motion !== "none" ? <p className="lab-layer-note">Effective motion: none under OS reduced motion. Authored behavior and intensity ({section.overrides?.motion ?? "inherit"}) are retained.</p> : null}
    {contract.overrides.filter(key => key !== "motion" || (section.motion !== "none" && !systemMotion.reduced)).map(key => <CapabilityControl key={key} label={`Section ${key === "artDirection" ? "art direction" : key}`} value={section.overrides?.[key] ?? "inherit"} choices={sectionLayerChoices(composition, section, key)} note={key === "artDirection" ? contract.artBehavior : undefined} onPreview={value => previewPatch(value === null ? null : layerPatch(key, value), `Section ${key === "artDirection" ? "art direction" : key}`)} onChange={value => update(layerPatch(key, value))} />)}
    {"treatment" in section && contract.media ? <><Control label="Media geometry" value={section.treatment.geometry} values={contract.media.geometries} onPreview={value => previewPatch(value === null ? null : { treatment: { ...section.treatment, geometry: value } }, "Media geometry")} onChange={value => update({ treatment: { ...section.treatment, geometry: value } })} /><Control label="Media tone" value={section.treatment.tone} values={contract.media.tones} onPreview={value => previewPatch(value === null ? null : { treatment: { ...section.treatment, tone: value } }, "Media tone")} onChange={value => update({ treatment: { ...section.treatment, tone: value } })} /></> : null}
  </div><p role="status">{notice}</p><p role="alert">{error}</p>
    <details><summary>Section capability contract</summary><pre>{JSON.stringify(contract, null, 2)}</pre></details>
  </Panel>;
}
