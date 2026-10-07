"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import type { WorkspaceAsset } from "@/lib/vigil/professional/document";

export type SourceValue = { label: string; value: string };
export type Slot = { path: (string | number)[]; label: string; kind: "image" | "video" | "document" };
export function mediaSlots(value: unknown, path: (string | number)[] = []): Slot[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => mediaSlots(item, [...path, index]));
  const object = value as Record<string, unknown>;
  return Object.entries(object).flatMap(([key, item]) => {
    if (["src", "mobileSrc", "lightSrc", "darkSrc", "poster"].includes(key) && typeof item === "string") {
      return [{ path: [...path, key], label: [...path, key].join(" · "), kind: path.includes("captions") ? "document" as const : key === "poster" || path.includes("poster") ? "image" as const : (("transcript" in object && "label" in object) || (path.includes("playback") && key === "mobileSrc")) ? "video" as const : "image" as const }];
    }
    return mediaSlots(item, [...path, key]);
  });
}
function textSlots(value: unknown, path: (string | number)[] = []): (string | number)[][] {
  if (Array.isArray(value)) return value.flatMap((item, index) => textSlots(item, [...path, index]));
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => typeof item === "string" && !["href", "home", "src", "id", "type", "color"].includes(key)
    ? [[...path, key]] : textSlots(item, [...path, key]));
}
function patchPath(section: SectionInstance, path: (string | number)[], value: string): SectionInstance {
  const copy = structuredClone(section);
  let target = copy as unknown as Record<string | number, unknown>;
  for (const key of path.slice(0,-1)) target = target[key] as Record<string | number, unknown>;
  target[path.at(-1)!] = value;
  return copy;
}
function sourceAt(section: SectionInstance, path: (string | number)[]): unknown {
  return path.reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string | number, unknown>)[key] : undefined, section);
}
export function ProjectSectionControls({ section, assets, sources, onChange }: {
  section: SectionInstance; assets: WorkspaceAsset[]; sources: SourceValue[]; onChange: (section: SectionInstance) => void;
}) {
  const [sourceIndex, setSourceIndex] = useState("0"), [fieldIndex, setFieldIndex] = useState("0");
  const [notice, setNotice] = useState("");
  const fields = textSlots(section.content).map(path => ["content", ...path]);
  return <section className="composition-panel"><h2>Client sources</h2><p>Apply a source explicitly. New onboarding answers never replace your edited composition.</p>
    {mediaSlots(section).map(slot => <label key={slot.path.join(".")}>{slot.label}<select aria-label={`Client asset · ${slot.label}`} value={assets.find(asset => asset.url === sourceAt(section, slot.path))?.id ?? ""} onChange={event => {
      const asset = assets.find(asset => asset.id === event.target.value);
      if (!asset) return;
      const updated = patchPath(section, slot.path, asset.url);
      if (slot.path.at(-1) === "src" && !slot.path.includes("poster") && slot.kind !== "document") {
        const owner = sourceAt(updated, slot.path.slice(0,-1));
        if (owner && typeof owner === "object" && !("transcript" in owner)) Object.assign(owner, { mediaType: asset.content_type.startsWith("video/") ? "video" : "image" });
      }
      onChange(updated);
      setNotice(`Selected ${asset.file_name}. Edit alt text, captions and dimensions in Client content and media.`);
    }}><option value="">Select client asset…</option>{assets.filter(asset => slot.kind === "document" ? asset.content_type.startsWith("text/") : (asset.content_type.startsWith(`${slot.kind}/`) || (slot.kind === "image" && slot.path.at(-1) === "src" && !slot.path.includes("poster") && asset.content_type.startsWith("video/")))).map(asset => <option key={asset.id} value={asset.id}>{asset.file_name}</option>)}</select></label>)}
    {assets.length === 0 && <p>No files uploaded. Upload through the existing client onboarding or files workflow, then reload this workspace.</p>}
    {sources.length > 0 && fields.length > 0 && <><label>Source content<select aria-label="Source content" value={sourceIndex} onChange={event => setSourceIndex(event.target.value)}>{sources.map((source, index) => <option key={index} value={index}>{source.label}</option>)}</select></label>
      <p>{sources[Number(sourceIndex)]?.value}</p><label>Apply to field<select aria-label="Apply to field" value={fieldIndex} onChange={event => setFieldIndex(event.target.value)}>{fields.map((field, index) => <option key={index} value={index}>{field.join(" · ")}</option>)}</select></label>
      <button type="button" onClick={() => onChange(patchPath(section, fields[Number(fieldIndex)], sources[Number(sourceIndex)].value))}>Apply source content</button></>}
    <p role="status">{notice}</p>
  </section>;
}
