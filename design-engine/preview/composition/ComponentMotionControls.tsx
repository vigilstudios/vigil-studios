"use client";
import { ContentTextField } from "./ContentFields";
import { countUpDefaults } from "../../motion/count-up";
import { parseSection, type SectionInstance } from "../../composition/schemas";

export function ComponentMotionControls({ section, onChange }: { section: SectionInstance; onChange: (section: SectionInstance) => void }) {
  if (section.component !== "proof.social-reach") return null;
  const settings = { ...countUpDefaults, ...section.numberAnimation };
  const patch = (key: string, value: unknown) => onChange(parseSection({ ...section, numberAnimation: { ...section.numberAnimation, [key]: value } }));
  const number = (label: string, key: string, value: number, min: number, max: number) => <ContentTextField label={label} type="number" value={String(value)} onChange={text => { const next = Number(text); if (text !== "" && Number.isFinite(next) && next >= min && next <= max) patch(key, next); }}/>;
  return <section className="composition-presentation"><h2>Stat number animation</h2>
    <label>Number animation<select aria-label="Number animation" value={settings.effect} onChange={event => patch("effect", event.target.value)}><option value="count-up">Count up</option><option value="none">None</option></select></label>
    {settings.effect === "count-up" && <><div className="composition-controls">{number("Count-up duration (ms)", "duration", settings.duration, 200, 5000)}{number("Count-up delay (ms)", "delay", settings.delay, 0, 3000)}{number("Count-up stagger (ms)", "stagger", settings.stagger, 0, 500)}</div>
      <label>Count-up easing<select aria-label="Count-up easing" value={settings.easing} onChange={event => patch("easing", event.target.value)}><option value="ease-out">Ease out</option><option value="linear">Linear</option></select></label>
      <label><input type="checkbox" checked={settings.replay} onChange={event => patch("replay", event.target.checked)}/>Replay numbers when returning into view</label></>}
    <p>{section.presentation?.motionMode === "none" ? "Section motion is disabled. Choose Inherit or override above to animate numbers." : "Counts from zero when each metric enters view. Replay in the toolbar restarts the count. Reduced motion shows the final values."}</p>
  </section>;
}
