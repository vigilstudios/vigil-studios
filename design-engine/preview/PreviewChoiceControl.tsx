"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { CapabilityChoice } from "./CapabilityControl";

/** Hover/focus auditions a value; only explicit activation changes authored data. */
export function PreviewChoiceControl({ label, value, choices, note, onChange, onPreview }: {
  label: string; value: string; choices: readonly CapabilityChoice[]; note?: string;
  onChange: (value: string) => void; onPreview: (value: string | null) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const callbacks = useRef({ onPreview });
  useEffect(() => { callbacks.current = { onPreview }; });
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        callbacks.current.onPreview(null); setOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => { document.removeEventListener("pointerdown", dismiss); callbacks.current.onPreview(null); };
  }, [open]);
  const close = () => { onPreview(null); setOpen(false); };
  function focusChoice(last = false) {
    requestAnimationFrame(() => {
      const buttons = root.current?.querySelectorAll<HTMLButtonElement>(".lab-choice-options button");
      if (buttons?.length) buttons[last ? buttons.length - 1 : 0].focus();
    });
  }
  return <div ref={root} className="composition-control lab-preview-choice" data-choice-label={label}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}
    onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); trigger.current?.focus(); }
    }}>
    <span id={`${id}-label`}>{label}</span>
    <button ref={trigger} type="button" className="lab-choice-trigger" aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-choices`}
      onClick={() => { if (open) close(); else setOpen(true); }}
      onKeyDown={event => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setOpen(true); focusChoice(event.key === "ArrowUp"); } }}>
      <span id={`${id}-value`}>{choices.find(choice => choice.value === value)?.label ?? value}</span><span aria-hidden="true">▾</span>
    </button>
    {open && <div id={`${id}-choices`} className="lab-choice-options" role="group" aria-label={`${label} choices`} onPointerLeave={() => onPreview(null)}
      onKeyDown={event => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }}>
      <p>Hover to preview · click to apply</p>
      {choices.map(choice => <button key={choice.value} data-choice-value={choice.value} type="button" aria-pressed={choice.value === value} aria-disabled={Boolean(choice.reason)}
        onPointerEnter={event => { if (event.pointerType !== "touch") onPreview(choice.reason ? null : choice.value); }}
        onFocus={() => onPreview(choice.reason ? null : choice.value)}
        onClick={() => { if (choice.reason) return; onChange(choice.value); close(); trigger.current?.focus(); }}>
        <span>{choice.label ?? choice.value}</span>{choice.reason && <small>{choice.reason}</small>}
      </button>)}
    </div>}
    {note && <small>{note}</small>}
  </div>;
}
