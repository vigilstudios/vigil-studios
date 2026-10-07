import type { CSSProperties } from "react";
import { typeRoles, type FontBindings, type FontKey, type TypographyProfile, type TypeStyle } from "./types";

const fallback: Record<FontKey, string> = {
  fraunces: "Georgia, serif", bodoni: "Didot, Georgia, serif", public: "Arial, Helvetica, sans-serif",
  jost: "Futura, Arial, sans-serif", anton: "Impact, sans-serif", source: "'Trebuchet MS', sans-serif",
  plex: "'Courier New', monospace", archivo: "Arial, sans-serif", recursive: "'Trebuchet MS', sans-serif", cormorant: "Garamond, Georgia, serif",
};
const body = (font: FontKey = "source", patch: Partial<TypeStyle> = {}): TypeStyle => ({ font, weight: 400, style: "normal", size: "clamp(1rem, 1.3cqw, 1.125rem)", leading: 1.6, tracking: "0em", measure: "56ch", transform: "none", numerals: "normal", ...patch });
const display = (font: FontKey, weight: number, size: string, leading: number, tracking: string, measure: string, patch: Partial<TypeStyle> = {}): TypeStyle => body(font, { weight, size, leading, tracking, measure, ...patch });
function profile(id: string, name: string, description: string, d: TypeStyle, b: TypeStyle, accent: Partial<TypeStyle> = {}, italic = false): TypographyProfile {
  return { id, name, description, roles: {
    display: d,
    heading: { ...d, size: "clamp(1.65rem, 3.4cqw, 3.25rem)", leading: Math.max(d.leading, 1.05), measure: "24ch" },
    body: b,
    accent: body(b.font, { size: ".8rem", weight: 600, leading: 1.3, measure: "36ch", ...accent }),
    mono: body("plex", { size: ".78rem", leading: 1.5, numerals: "lining-nums tabular-nums" }),
  }, emphasis: { role: italic ? "display" : "accent", style: italic ? "italic" : "normal" } };
}

/** Directions are typographic relationships, not client themes or font loaders. */
export const typographyProfiles: readonly TypographyProfile[] = [
  profile("editorial", "Editorial", "Large optical serif, readable humanist text, publication measure and oldstyle figures.",
    display("fraunces", 500, "clamp(2.6rem, 7.5cqw, 7rem)", .98, "-.025em", "15ch", { axes: { SOFT: 0, WONK: 1, opsz: 96 }, numerals: "oldstyle-nums proportional-nums" }), body(), { tracking: ".08em", transform: "uppercase" }, true),
  profile("luxury", "Luxury", "Fine upright display, restrained scale, long pauses and widely spaced small labels.",
    display("bodoni", 400, "clamp(2.3rem, 5.8cqw, 5.8rem)", 1.08, ".015em", "17ch"), body("public", { size: "1rem", leading: 1.75, measure: "43ch" }), { tracking: ".18em", transform: "uppercase", weight: 400 }, true),
  profile("neo-grotesk", "Neo-Grotesk", "Heavy sans with close-set headlines, firm baselines and compact information.",
    display("public", 800, "clamp(2.7rem, 6.9cqw, 6.8rem)", .98, "-.055em", "17ch"), body("public", { leading: 1.45, measure: "52ch" }), { tracking: "-.015em", weight: 700 }),
  profile("geometric", "Geometric", "Medium geometric forms, open tracking, measured hierarchy and architectural intervals.",
    display("jost", 500, "clamp(2.2rem, 5.6cqw, 5.6rem)", 1.13, ".035em", "19ch"), body("jost", { leading: 1.65, measure: "48ch" }), { tracking: ".14em", transform: "uppercase", weight: 500 }),
  profile("poster", "Condensed / Poster", "Tall compressed capitals, extreme display/body contrast and tight vertical rhythm.",
    display("anton", 400, "clamp(3.4rem, 11.8cqw, 12rem)", .94, "-.018em", "12ch", { transform: "uppercase" }), body("public", { leading: 1.4, measure: "36ch" }), { font: "plex", weight: 500, tracking: ".02em", transform: "uppercase" }),
  profile("humanist", "Humanist", "Warm proportions, sentence case, generous leading and approachable display scale.",
    display("source", 600, "clamp(2.1rem, 5.2cqw, 4.8rem)", 1.15, "-.015em", "21ch"), body("source", { size: "clamp(1.05rem, 1.55cqw, 1.25rem)", leading: 1.7, measure: "54ch" }), { weight: 600 }),
  profile("technical", "Technical", "Mono display and tabular figures, smaller scale, sans reading text and explicit data hierarchy.",
    display("plex", 500, "clamp(1.9rem, 4.4cqw, 4.4rem)", 1.12, "-.04em", "20ch", { numerals: "lining-nums tabular-nums" }), body("public", { leading: 1.5, measure: "48ch" }), { font: "plex", weight: 400, tracking: ".04em", transform: "uppercase", numerals: "lining-nums tabular-nums" }),
  profile("brutalist", "Brutalist", "Dense black letterforms, blunt scale jumps, short measures and emphatic capitals.",
    display("archivo", 400, "clamp(2.7rem, 8.3cqw, 8.5rem)", .97, "-.06em", "13ch", { transform: "uppercase" }), body("plex", { size: "1rem", leading: 1.4, measure: "40ch" }), { font: "public", weight: 800, size: "1rem", transform: "uppercase" }),
  profile("playful", "Playful / Expressive", "Casual variable forms, rounded rhythm, lowercase display and lively weight contrast.",
    display("recursive", 800, "clamp(2.6rem, 7.3cqw, 7rem)", 1.06, "-.04em", "17ch", { transform: "lowercase", axes: { CASL: 1, MONO: 0, slnt: 0, CRSV: .5 } }), body("source", { leading: 1.65, measure: "45ch" }), { font: "recursive", weight: 600, axes: { CASL: 1, MONO: 0 } }),
  profile("fashion", "Fashion / Art Direction", "Overscale italic serif with narrow text, expressive whitespace and a quiet sans countervoice.",
    display("cormorant", 500, "clamp(3rem, 9.5cqw, 9.5rem)", .88, "-.055em", "13ch", { style: "italic", numerals: "oldstyle-nums proportional-nums" }), body("public", { size: ".95rem", leading: 1.65, measure: "36ch" }), { tracking: ".12em", transform: "uppercase", weight: 400 }),
];
export type TypographyProfileId = "editorial" | "luxury" | "neo-grotesk" | "geometric" | "poster" | "humanist" | "technical" | "brutalist" | "playful" | "fashion";
export function getTypographyProfile(id: string): TypographyProfile {
  const result = typographyProfiles.find((item) => item.id === id);
  if (!result) throw new Error(`Unknown typography profile: ${id}`);
  return result;
}
export function requiredFonts(profile: TypographyProfile): FontKey[] {
  return [...new Set(typeRoles.map((role) => profile.roles[role].font))];
}
export function typographyVariables(profile: TypographyProfile, bindings: FontBindings = {}): CSSProperties {
  const vars: Record<string, string | number> = {};
  for (const role of typeRoles) {
    const t = profile.roles[role];
    vars[`--de-font-${role}`] = bindings[t.font] ?? `var(--de-face-${t.font}, ${fallback[t.font]})`;
    for (const key of ["weight", "style", "size", "leading", "tracking", "measure", "transform", "numerals"] as const) vars[`--de-${role}-${key}`] = t[key];
    vars[`--de-${role}-axes`] = t.axes ? Object.entries(t.axes).map(([axis, value]) => `"${axis}" ${value}`).join(", ") : "normal";
  }
  vars["--de-leading"] = profile.roles.body.leading;
  vars["--de-reading"] = profile.roles.body.measure;
  vars["--de-emphasis-font"] = vars[`--de-font-${profile.emphasis.role}`];
  vars["--de-emphasis-style"] = profile.emphasis.style;
  return vars as CSSProperties;
}
