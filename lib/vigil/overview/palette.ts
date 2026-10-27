import { getDesignTheme } from "@/design-engine/foundations/themes";
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export function safePreviewAccent(value: unknown): string | null {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : null;
}
/** Read only the public brand token, never serialize the design document to the dashboard. */
export function previewAccentFromSite(definition: unknown): string | null {
  const settings = object(object(definition).settings),
    brand = object(settings.brand);
  const explicit = safePreviewAccent(object(brand.colors).accent);
  if (explicit) return explicit;
  return ["neutral", "editorial", "technical"].includes(String(brand.theme))
    ? getDesignTheme(String(brand.theme)).tokens.color.accent
    : null;
}

/** Legacy custom sites publish their palette as CSS variables rather than a design document. */
export function previewAccentFromCss(css: string): string | null {
  let best: { color: string; score: number } | null = null;
  for (const match of css.matchAll(
    /(--[\w-]+)\s*:\s*(#[\da-f]{6}|#[\da-f]{3})\b/gi,
  )) {
    const name = match[1].toLowerCase();
    if (
      /(?:^|[-_])(error|danger|warning|success|border|background|surface|text|ink|muted|line|shadow|track)(?:[-_]|$)/.test(
        name,
      )
    )
      continue;
    const color =
      match[2].length === 4
        ? `#${[...match[2].slice(1)].map((c) => c + c).join("")}`
        : match[2].toLowerCase();
    const channels = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    const chroma = Math.max(...channels) - Math.min(...channels);
    if (chroma < 30) continue; // Quiet neutrals should not become an arbitrary colored tint.
    const score = chroma + (/accent|brand|primary/.test(name) ? 256 : 0);
    if (!best || score > best.score) best = { color, score };
  }
  return best?.color ?? null;
}
