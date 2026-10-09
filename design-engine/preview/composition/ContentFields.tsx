"use client";
import { useState } from "react";
import { parseSection, type SectionInstance } from "../../composition/schemas";

type Path = (string | number)[];
const labelFor = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").replace(/^./, letter => letter.toUpperCase());
const omitted = new Set(["id", "src", "poster", "destination", "provenance", "kind", "type", "width", "height", "mimeType"]);
/** A controlled field retains invalid intermediate input without remounting the caret. */
export function ContentTextField({ label, value, onChange, multiline = false, type = "text", bare = false }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: "text" | "number"; bare?: boolean;
}) {
  const [pending, setPending] = useState<{ value: string; base: string } | null>(null);
  const shown = pending?.base === value ? pending.value : value;
  const change = (next: string) => { setPending({ value: next, base: value }); onChange(next); };
  const input = multiline ? <textarea aria-label={label} rows={4} value={shown} onChange={event => change(event.target.value)}/> : <input aria-label={label} type={type} value={shown} onChange={event => change(event.target.value)}/>;
  return bare ? input : <label className="composition-content-field">{label}{input}</label>;
}

export function ContentFields({ section, onChange }: { section: SectionInstance; onChange: (next: SectionInstance) => void }) {
  const [error, setError] = useState("");
  function patch(path: Path, value: unknown) {
    const next = structuredClone(section);
    let target = next.content as unknown as Record<string | number, unknown>;
    for (const part of path.slice(0, -1)) target = target[part] as Record<string | number, unknown>;
    target[path.at(-1)!] = value;
    try { onChange(parseSection(next)); setError(""); } catch (error) { setError(error instanceof Error ? error.message : "Invalid content."); }
  }
  function fields(value: unknown, path: Path = [], context = ""): React.ReactNode {
    if (typeof value === "string" || typeof value === "number") return <ContentTextField label={context} value={String(value)} type={typeof value === "number" ? "number" : "text"} onChange={next => patch(path, typeof value === "number" ? Number(next) : next)}/>;
    if (!value || typeof value !== "object") return null;
    if ("src" in value || "destination" in value && "type" in value) return null;
    return Object.entries(value).map(([key, item]) => {
      if (omitted.has(key)) return null;
      const location = [...path, Array.isArray(value) ? Number(key) : key];
      const label = context ? `${context} · ${labelFor(key)}` : labelFor(key);
      if (typeof item === "string" || typeof item === "number") return <ContentTextField key={location.join(".")} label={label} value={String(item)} type={typeof item === "number" ? "number" : "text"} multiline={item.toString().length > 140 || /description|introduction|body|quote|biography|answer/i.test(key)} onChange={next => patch(location, typeof item === "number" ? Number(next) : next)}/>;
      if (typeof item === "boolean") return <label key={key}><input type="checkbox" checked={item} onChange={event => patch(location, event.target.checked)}/>{label}</label>;
      if (Array.isArray(item)) return <details key={key} className="composition-content-group"><summary>{labelFor(key)} <small>{item.length} items</small></summary>{item.map((record, index) => <details key={record?.id ?? index}><summary>{record?.title ?? record?.name ?? record?.label ?? record?.platform ?? `Item ${index + 1}`}</summary>{fields(record, [...location, index], `${labelFor(key)} ${index + 1}`)}<button type="button" onClick={() => patch(location, item.filter((_, position) => position !== index))}>Remove item {index + 1}</button></details>)}{item.length > 0 && typeof item[0] === "object" && <button type="button" onClick={() => { const record = structuredClone(item.at(-1)); if (record.id) record.id = `item-${crypto.randomUUID()}`; patch(location, [...item, record]); }}>Add {labelFor(key).toLowerCase()} item</button>}</details>;
      return <details key={key} className="composition-content-group"><summary>{labelFor(key)}</summary>{fields(item, location, labelFor(key))}</details>;
    });
  }
  return <section className="composition-content-fields"><h2>Copy and records</h2>{fields(section.content)}{error && <p role="alert">{error}</p>}</section>;
}
