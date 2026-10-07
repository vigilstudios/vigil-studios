"use client";
import { useEffect, useId, useRef, useState } from "react";

/** Free-form colors stay drafts until an explicit swatch/apply activation. */
export function PreviewColorControl({ label, value, fallback, palette, onPreview, onChange }: {
  label: string; value: string; fallback: string; palette: readonly string[];
  onPreview: (value: string | null) => void; onChange: (value: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(value);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const callback = useRef(onPreview);
  useEffect(() => { callback.current = onPreview; });
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) { callback.current(null); setOpen(false); } };
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("pointerdown", outside); callback.current(null); };
  }, [open]);
  const close = () => { onPreview(null); setOpen(false); };
  const apply = (color: string) => { onChange(color); close(); trigger.current?.focus(); };
  const validDraft = /^#[0-9a-fA-F]{6}$/.test(draft);
  return <div ref={root} className="lab-color-choice" data-color-label={label}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}
    onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); trigger.current?.focus(); } }}>
    <button ref={trigger} type="button" className="lab-color-trigger" aria-label={`Edit ${label} color`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => { if (open) close(); else { setDraft(value); setOpen(true); } }}>
      <span>{label}</span><span aria-hidden="true" className="lab-color-swatch" style={{ backgroundColor: value }} />
    </button>
    {open && <div id={`${id}-panel`} className="lab-color-options" role="group" aria-label={`${label} color choices`} onPointerLeave={() => onPreview(null)}>
      <p>Hover to preview · click to apply</p>
      <div className="lab-color-palette">{Array.from(new Set([fallback, value, ...palette])).map(color => <button key={color} type="button" aria-label={`${label} ${color}`} title={color} aria-pressed={color === value}
        onPointerEnter={event => { if (event.pointerType !== "touch") onPreview(color); }} onFocus={() => onPreview(color)} onClick={() => apply(color)}><span aria-hidden="true" style={{ backgroundColor: color }} /></button>)}</div>
      <label>Draft {label} color<input aria-label={`Draft ${label} color`} type="color" value={validDraft ? draft : value} onFocus={() => onPreview(validDraft ? draft : null)} onChange={event => { setDraft(event.target.value); onPreview(event.target.value); }} /></label>
      <label>Hex value<input aria-label={`${label} hex value`} value={draft} maxLength={7} spellCheck={false} onFocus={() => onPreview(validDraft ? draft : null)} onChange={event => { const color = event.target.value; setDraft(color); onPreview(/^#[0-9a-fA-F]{6}$/.test(color) ? color : null); }} /></label>
      <button type="button" disabled={!validDraft} onPointerEnter={event => { if (event.pointerType !== "touch") onPreview(validDraft ? draft : null); }} onFocus={() => onPreview(validDraft ? draft : null)} onClick={() => apply(draft)}>Apply {label} color <span>{draft}</span></button>
      <button type="button" onClick={() => { close(); trigger.current?.focus(); }}>Cancel</button>
    </div>}
  </div>;
}
