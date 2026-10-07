import type { CSSProperties } from "react";

export type DesignTokens = {
  color: {
    background: string; surface: string; surfaceElevated: string;
    foreground: string; muted: string; accent: string; accentForeground: string; border: string;
  };
  typography: { display: string; body: string; scale: string; leading: string };
  spacing: { unit: string; section: string; stack: string; gridGap: string };
  shape: { radius: string; borderWidth: string; shadow: string };
  layout: { container: string; reading: string; columns: string };
};

export type DesignTheme = {
  id: string;
  name: string;
  description: string;
  tokens: DesignTokens;
};

export type DesignTokenOverrides = { [Group in keyof DesignTokens]?: Partial<DesignTokens[Group]> };

export function mergeDesignTokens(base: DesignTokens, overrides: DesignTokenOverrides = {}): DesignTokens {
  return {
    color: { ...base.color, ...overrides.color },
    typography: { ...base.typography, ...overrides.typography },
    spacing: { ...base.spacing, ...overrides.spacing },
    shape: { ...base.shape, ...overrides.shape },
    layout: { ...base.layout, ...overrides.layout },
  };
}

const neutral: DesignTokens = {
  color: {
    background: "#f5f4f1", surface: "#ffffff", surfaceElevated: "#eae8e3",
    foreground: "#20232a", muted: "#52565d", accent: "#354d80",
    accentForeground: "#ffffff", border: "#b9bab8",
  },
  typography: {
    display: "Georgia, 'Times New Roman', serif", body: "Arial, Helvetica, sans-serif",
    scale: "1.18", leading: "1.5",
  },
  spacing: { unit: "0.5rem", section: "clamp(3rem, 7vw, 7rem)", stack: "1.5rem", gridGap: "1.5rem" },
  shape: { radius: "0.5rem", borderWidth: "1px", shadow: "0 12px 32px rgb(24 30 42 / 0.09)" },
  layout: { container: "76rem", reading: "42rem", columns: "12" },
};

/** Lab directions are examples; a client can override every token. */
export const designThemes = [
  { id: "neutral", name: "Neutral", description: "Quiet baseline with balanced spacing.", tokens: neutral },
  {
    id: "editorial", name: "Editorial", description: "Expressive type, warm surfaces, and spacious rhythm.",
    tokens: {
      color: {
        background: "#f3ede3", surface: "#fffaf2", surfaceElevated: "#e7dbca",
        foreground: "#322620", muted: "#665950", accent: "#7d3140",
        accentForeground: "#fff9f2", border: "#b9a999",
      },
      typography: {
        display: "Georgia, 'Times New Roman', serif", body: "Arial, Helvetica, sans-serif",
        scale: "1.32", leading: "1.6",
      },
      spacing: { unit: "0.625rem", section: "clamp(4rem, 9vw, 9rem)", stack: "2rem", gridGap: "2rem" },
      shape: { radius: "0.125rem", borderWidth: "1px", shadow: "0 18px 40px rgb(50 38 32 / 0.1)" },
      layout: { container: "80rem", reading: "44rem", columns: "12" },
    },
  },
  {
    id: "technical", name: "Technical", description: "Compact rhythm, crisp edges, and deep contrast.",
    tokens: {
      color: {
        background: "#111927", surface: "#1a2738", surfaceElevated: "#26364a",
        foreground: "#f5f7fa", muted: "#bdcad8", accent: "#fac77e",
        accentForeground: "#182233", border: "#63758a",
      },
      typography: {
        display: "Arial, Helvetica, sans-serif", body: "Arial, Helvetica, sans-serif",
        scale: "1.12", leading: "1.45",
      },
      spacing: { unit: "0.375rem", section: "clamp(2.5rem, 6vw, 6rem)", stack: "1.25rem", gridGap: "1rem" },
      shape: { radius: "0.125rem", borderWidth: "1px", shadow: "0 14px 32px rgb(0 0 0 / 0.22)" },
      layout: { container: "72rem", reading: "40rem", columns: "12" },
    },
  },
] as const satisfies readonly DesignTheme[];

export type DesignThemeId = (typeof designThemes)[number]["id"];

export function getDesignTheme(id: string): DesignTheme {
  return designThemes.find((theme) => theme.id === id) ?? designThemes[0];
}

/** Rank the site's ink/surface pair without assuming the site has a light theme. */
function relativeLuminance(color: string): number | null {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return null;
  const channels = [1, 3, 5].map(offset => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function themeVariables(tokens: DesignTokens): CSSProperties {
  const { background, foreground } = tokens.color;
  const backgroundLuminance = relativeLuminance(background);
  const foregroundLuminance = relativeLuminance(foreground);
  const darkSite = backgroundLuminance !== null && foregroundLuminance !== null && backgroundLuminance < foregroundLuminance;
  const variables: Record<string, string> = {
    "--de-palette-light": darkSite ? foreground : background,
    "--de-palette-dark": darkSite ? background : foreground,
    "--de-background": tokens.color.background,
    "--de-surface": tokens.color.surface,
    "--de-surface-elevated": tokens.color.surfaceElevated,
    "--de-foreground": tokens.color.foreground,
    "--de-muted": tokens.color.muted,
    "--de-accent": tokens.color.accent,
    "--de-accent-foreground": tokens.color.accentForeground,
    "--de-border": tokens.color.border,
    "--de-font-display": tokens.typography.display,
    "--de-font-body": tokens.typography.body,
    "--de-type-scale": tokens.typography.scale,
    "--de-leading": tokens.typography.leading,
    "--de-unit": tokens.spacing.unit,
    "--de-section-space": tokens.spacing.section,
    "--de-stack": tokens.spacing.stack,
    "--de-grid-gap": tokens.spacing.gridGap,
    "--de-radius": tokens.shape.radius,
    "--de-border-width": tokens.shape.borderWidth,
    "--de-shadow": tokens.shape.shadow,
    "--de-container": tokens.layout.container,
    "--de-reading": tokens.layout.reading,
    "--de-columns": tokens.layout.columns,
  };
  return variables as CSSProperties;
}
