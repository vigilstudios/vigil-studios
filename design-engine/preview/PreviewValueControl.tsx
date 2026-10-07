"use client";
import { useEffect, useRef, useState } from "react";

/** Free-form options have the same temporary audition / explicit apply contract as choices. */
export function PreviewValueControl({ label, value, type = "text", maxLength, placeholder, onPreview, onChange, valid = value => Boolean(value.trim()) }: {
  label: string; value: string; type?: "text" | "number"; maxLength?: number; placeholder?: string;
  valid?: (value: string) => boolean; onPreview: (value: string | null) => void; onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const callback = useRef(onPreview);
  useEffect(() => { callback.current = onPreview; });
  useEffect(() => () => callback.current(null), []);
  const audition = () => onPreview(valid(draft) ? draft : null);
  const apply = () => { if (valid(draft)) onChange(draft); onPreview(null); };
  return <div className="composition-control" data-value-label={label}
    onPointerLeave={() => onPreview(null)}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onPreview(null); }}
    onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setDraft(value); onPreview(null); }
      if (event.key === "Enter" && event.target instanceof HTMLInputElement) { event.preventDefault(); apply(); }
    }}>
    <label>{label}<input aria-label={label} type={type} value={draft} maxLength={maxLength} placeholder={placeholder} min={type === "number" ? 1 : undefined}
      onPointerEnter={event => { if (event.pointerType !== "touch") audition(); }} onFocus={audition}
      onChange={event => { setDraft(event.target.value); onPreview(valid(event.target.value) ? event.target.value : null); }} /></label>
    <button type="button" disabled={!valid(draft) || draft === value} onPointerEnter={event => { if (event.pointerType !== "touch") audition(); }} onFocus={audition} onClick={apply}>Apply {label}</button>
    <small>Hover or focus to preview · apply to save</small>
  </div>;
}
