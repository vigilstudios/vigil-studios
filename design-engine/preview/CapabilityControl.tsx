"use client";
import { PreviewChoiceControl } from "./PreviewChoiceControl";
export type CapabilityChoice = { value: string; label?: string; reason?: string };
/** A single effective value is a property, never a one-option selector. */
export function CapabilityControl({ label, value, choices, note, onChange, onPreview }: { label: string; value: string; choices: readonly CapabilityChoice[]; note?: string; onChange: (value: string) => void; onPreview: (value: string | null) => void }) {
  const available = choices.filter(choice => !choice.reason);
  if (!choices.length) return note ? <p className="lab-layer-note">{label}: {note}</p> : null;
  if (available.length === 1 && available[0].value === value) return <div className="lab-fixed-property"><span>{label}</span><strong>{available[0].label ?? value} · fixed</strong>{note ? <small>{note}</small> : null}{choices.filter(choice => choice.reason).map(choice => <small key={choice.value}>{choice.label ?? choice.value}: {choice.reason}</small>)}</div>;
  return <PreviewChoiceControl label={label} value={value} choices={choices} note={note} onChange={onChange} onPreview={onPreview} />;
}
