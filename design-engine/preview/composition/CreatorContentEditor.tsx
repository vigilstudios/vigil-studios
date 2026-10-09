"use client";
import { socialIconNames } from "../../icons/SocialIcon";
import { useState } from "react";
import { ContentTextField } from "./ContentFields";
import { parseSection, type SectionInstance } from "../../composition/schemas";
import { creatorImage, creatorImagePackages } from "../creator-image-packages";
type CreatorSection = SectionInstance<"about.creator-profile" | "proof.social-reach">;
/** Client-owned text and records use ordinary fields; layout choices live in the inspector. */
export function CreatorContentEditor({ section, onChange }: { section: SectionInstance; onChange: (section: SectionInstance) => void }) {
  const [error, setError] = useState("");
  if (section.component !== "about.creator-profile" && section.component !== "proof.social-reach") return null;
  const current: CreatorSection = section;
  function update(content: Record<string, unknown>) {
    try { onChange(parseSection({ ...current, content })); setError(""); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Invalid creator content."); }
  }
  function field(label: string, value: string | undefined, apply: (value: string | undefined) => void, required = false, multiline = false) {
    return <ContentTextField key={label} label={label} value={value ?? ""} multiline={multiline} onChange={next => apply(next || (required ? "" : undefined))}/>;
  }
  const content = current.content;
  const top = (key: string, label: string, required = false, multiline = false) => field(label, (content as Record<string, unknown>)[key] as string | undefined, value => update({ ...content, [key]: value }), required, multiline);
  return <details className="composition-action-editor" open><summary>{current.component === "proof.social-reach" ? "Audience metrics & social profiles" : "About Me content"}</summary><p>Content updates the preview and JSON automatically.</p>
    {top("title", "Heading", true)}{top("eyebrow", "Eyebrow")}
    {current.component === "proof.social-reach" ? <>
      {top("introduction", "Introduction", true, true)}{top("basis", "Analytics context / reporting basis")}
      <fieldset><legend>Following, views & reach</legend>{current.content.stats.map((stat, index) => <details key={stat.id} ><summary>{stat.label}</summary>{(["value", "label", "platform", "period", "source"] as const).map(key => field(`Metric ${index + 1} ${key}`, stat[key], value => update({ ...current.content, stats: current.content.stats.map(item => item.id === stat.id ? { ...item, [key]: value } : item) }), key === "value" || key === "label"))}<button type="button" disabled={current.content.stats.length <= 1} onClick={() => update({ ...current.content, stats: current.content.stats.filter(item => item.id !== stat.id) })}>Remove metric {index + 1}</button></details>)}<button type="button" disabled={current.content.stats.length >= 8} onClick={() => update({ ...current.content, stats: [...current.content.stats, { id: `stat-${crypto.randomUUID()}`, value: "0", label: "New metric" }] })}>Add metric</button></fieldset>
      <fieldset><legend>Social media links</legend>{current.content.socials.map((social, index) => <details key={social.id} ><summary>{social.platform}</summary><label>Social icon<select aria-label={`Profile ${index + 1} icon`} value={social.icon ?? "auto"} onChange={event => update({ ...current.content, socials: current.content.socials.map(item => item.id === social.id ? { ...item, icon: event.target.value === "auto" ? undefined : event.target.value } : item) })}><option value="auto">Match platform</option>{socialIconNames.map(name => <option key={name}>{name}</option>)}</select></label>{(["platform", "handle", "href"] as const).map(key => field(`Profile ${index + 1} ${key === "href" ? "URL" : key}`, social[key], value => update({ ...current.content, socials: current.content.socials.map(item => item.id === social.id ? { ...item, [key]: value } : item) }), key !== "handle"))}<button type="button" disabled={current.content.socials.length <= 1} onClick={() => update({ ...current.content, socials: current.content.socials.filter(item => item.id !== social.id) })}>Remove profile {index + 1}</button></details>)}<button type="button" disabled={current.content.socials.length >= 8} onClick={() => update({ ...current.content, socials: [...current.content.socials, { id: `social-${crypto.randomUUID()}`, platform: "New platform", href: "https://example.com/" }] })}>Add social profile</button></fieldset>
    </> : <>
      {top("name", "Name", true)}{top("role", "Role / tagline")}{top("location", "Location")}{top("biography", "Biography", true, true)}{top("signature", "Sign-off")}
      <fieldset><legend>Interests</legend>{current.content.interests.map((interest, index) => <div key={interest.id}>{field(`Interest ${index + 1}`, interest.label, value => update({ ...current.content, interests: current.content.interests.map(item => item.id === interest.id ? { ...item, label: value } : item) }), true)}<button type="button" onClick={() => update({ ...current.content, interests: current.content.interests.filter(item => item.id !== interest.id) })}>Remove interest {index + 1}</button></div>)}<button type="button" disabled={current.content.interests.length >= 8} onClick={() => update({ ...current.content, interests: [...current.content.interests, { id: `interest-${crypto.randomUUID()}`, label: "New interest" }] })}>Add interest</button></fieldset>
      <label><input type="checkbox" checked={!!current.content.secondaryImage} onChange={event => update({ ...current.content, secondaryImage: event.target.checked ? creatorImage(creatorImagePackages.find(pack => current.content.image.src.includes(pack.set)) ?? creatorImagePackages[0], "pov") : undefined })} />Include second snapshot</label>
      <p>Replace photographs, select a creator photo and adjust crops under Images and videos.</p>
    </>}
    <p role="alert">{error}</p>
  </details>;
}
