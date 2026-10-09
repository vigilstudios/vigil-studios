import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";
import { designThemes, mergeDesignTokens } from "@/design-engine/foundations/themes";
import { DesignLab } from "@/design-engine/preview/DesignLab";
import { renderDesignPreview, resolvePreviewConfig } from "@/design-engine/preview/render";
import { designComponents, findDesignComponents } from "@/design-engine/registry/components";
import { advanceComponentStatus, canAdvanceStatus, validateDesignRegistry } from "@/design-engine/registry/validation";
import { coreIconNames } from "@/design-engine/icons/names";
import { VigilIcon } from "@/design-engine/icons/VigilIcon";
import type { IconVisualProps } from "@/design-engine/icons/registry";
import { DesignMedia } from "@/design-engine/primitives/DesignPrimitives";

describe("Professional Design Engine component factory", () => {
  it("has unique, serializable definitions and discoverable categories", () => {
    expect(new Set(designComponents.map((item) => item.id)).size).toBe(designComponents.length);
    expect(designComponents).toHaveLength(126);
    expect(findDesignComponents({ category: "primitive" })).toHaveLength(13);
    expect(findDesignComponents({ category: "motion" })).toHaveLength(12);
    expect(findDesignComponents({ category: "icon" })).toHaveLength(1);
    expect(findDesignComponents({ query: "mobile disclosure" }).map((item) => item.id)).toEqual(["navigation.primary"]);
    expect(findDesignComponents({ status: "review" })).toHaveLength(6);
    expect(() => JSON.stringify(designComponents)).not.toThrow();
    expect(validateDesignRegistry(designComponents)).toEqual([]);
    for (const item of designComponents) {
      expect(item.previewVariants.length).toBeGreaterThan(0);
      expect(new Set(item.previewVariants.map((variant) => variant.id)).size).toBe(item.previewVariants.length);
      expect(item.status).toBe("sourceConcept" in item ? (/^(?:[SMCPE]|NX|HX|H09$|H12$|H16$)/.test(item.sourceConcept) || item.sourceConcept.startsWith("external-") || item.sourceConcept.startsWith("readiness-") || item.sourceConcept.startsWith("creator-")) ? "production" : "review" : "experimental");
      for (const variant of item.previewVariants) {
        for (const [key, value] of Object.entries(variant.config)) {
          expect(item.configurations.find((config) => config.name === key)?.options).toContain(value);
        }
      }
    }
  });

  it("renders every registered preview variant under multiple scoped themes", () => {
    for (const item of designComponents) {
      for (const variant of item.previewVariants) {
        for (const theme of designThemes) {
          const html = renderToStaticMarkup(createElement(
            DesignThemeProvider, { theme: theme.id }, renderDesignPreview(item.id, variant.id),
          ));
          expect(html).toContain("de-root");
          expect(html).toContain(`--de-accent:${theme.tokens.color.accent}`);
          expect(html.length).toBeGreaterThan(200);
        }
      }
    }
  });

  it("accepts only declared Lab controls and applies them to a real preview", () => {
    expect(resolvePreviewConfig("hero.statement", "quiet", { alignment: "center" })).toMatchObject({ alignment: "center", emphasis: "quiet" });
    expect(() => resolvePreviewConfig("hero.statement", "quiet", { alignment: "diagonal" })).toThrow(/Unsupported configuration/);
    expect(() => resolvePreviewConfig("hero.statement", "missing")).toThrow(/Unknown preview variant/);
    const html = renderToStaticMarkup(renderDesignPreview("hero.statement", "quiet", { alignment: "center" }));
    expect(html).toContain("de-hero--center");
  });

  it("requires evidence to promote a registry entry to production", () => {
    expect(canAdvanceStatus("experimental", "review")).toBe(true);
    expect(canAdvanceStatus("review", "production")).toBe(true);
    expect(canAdvanceStatus("experimental", "production")).toBe(false);
    expect(advanceComponentStatus(designComponents[0], { to: "review" }).status).toBe("review");
    expect(() => advanceComponentStatus(designComponents[0], { to: "production", evidence: {
      responsive: { desktop: true, tablet: true, mobile: true },
      accessibility: { semantics: true, keyboard: true, focus: true, reducedMotion: true },
      performanceReviewed: true, brandNeutralReviewed: true, visualDiversityReviewed: true,
      approvedBy: "Reviewer", approvedAt: "2026-09-29",
    } })).toThrow(/Invalid Design Engine status transition/);
    const data = JSON.parse(JSON.stringify(designComponents)) as Array<Record<string, unknown>>;
    data[0].status = "production";
    expect(validateDesignRegistry(data)).toContain("entry[0].productionEvidence is required for production.");
    data[0].productionEvidence = {
      responsive: { desktop: true, tablet: true, mobile: true },
      accessibility: { semantics: true, keyboard: true, focus: true, reducedMotion: true },
      performanceReviewed: true, brandNeutralReviewed: true, visualDiversityReviewed: true,
      approvedBy: "Reviewer", approvedAt: "2026-09-29",
    };
    expect(validateDesignRegistry(data)).toEqual([]);
    data[0].previewVariants = [{ id: "broken", label: "Broken", config: { variant: "unknown" } }];
    expect(validateDesignRegistry(data).some((error) => error.includes("config.variant"))).toBe(true);
    data[0].id = data[1].id;
    expect(validateDesignRegistry(data).some((error) => error.includes("duplicates"))).toBe(true);
  });

  it("renders named icons as either informative or decorative", () => {
    expect(coreIconNames).toContain("search");
    const informative = renderToStaticMarkup(createElement(VigilIcon, { name: "search", label: "Search catalog" }));
    const decorative = renderToStaticMarkup(createElement(VigilIcon, { name: "arrow-right", decorative: true }));
    expect(informative).toContain('aria-label="Search catalog"');
    expect(informative).toContain('role="img"');
    expect(informative).not.toContain('aria-hidden="true"');
    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).not.toContain("aria-label");
    const localPack = { search: (props: IconVisualProps) => createElement("svg", { "data-local-pack": "yes", role: props.role, "aria-hidden": props["aria-hidden"] }) };
    const local = renderToStaticMarkup(createElement(VigilIcon, { name: "search", decorative: true, pack: localPack }));
    expect(local).toContain('data-local-pack="yes"');
  });

  it("keeps image and video content accessible inside portable media primitives", () => {
    const image = renderToStaticMarkup(createElement(DesignMedia, { kind: "image", src: "/example.jpg", alt: "Abstract example", fit: "contain" }));
    const video = renderToStaticMarkup(createElement(DesignMedia, { kind: "video", src: "/example.mp4", label: "Process film" }));
    expect(image).toContain('alt="Abstract example"');
    expect(image).toContain("de-media--contain");
    expect(video).toContain('aria-label="Process film"');
    expect(video).toContain("controls");
  });

  it("lets client identity override a single semantic token without replacing the theme", () => {
    const merged = mergeDesignTokens(designThemes[0].tokens, { color: { accent: "#123456" } });
    expect(merged.color.accent).toBe("#123456");
    expect(merged.color.background).toBe(designThemes[0].tokens.color.background);
    const html = renderToStaticMarkup(createElement(DesignThemeProvider, {
      theme: "editorial", overrides: { color: { accent: "#123456" } },
    }, "Client preview"));
    expect(html).toContain("--de-accent:#123456");
    expect(html).toContain("--de-background:#f3ede3");
  });

  it.each([
    { theme: "neutral", background: "#f5f4f1", foreground: "#20232a", light: "#f5f4f1", dark: "#20232a" },
    { theme: "technical", background: "#111927", foreground: "#f5f7fa", light: "#f5f7fa", dark: "#111927" },
    { theme: "editorial", background: "#fff2df", foreground: "#532239", light: "#fff2df", dark: "#532239" },
    { theme: "neutral", background: "#532239", foreground: "#fff2df", light: "#fff2df", dark: "#532239" },
    { theme: "neutral", background: "#ff0000", foreground: "#00ff00", light: "#00ff00", dark: "#ff0000" },
  ])("derives contrast tones from the $theme site palette ($background / $foreground)", ({ theme, background, foreground, light, dark }) => {
    const html = renderToStaticMarkup(createElement(DesignThemeProvider, {
      theme, overrides: { color: { background, foreground } },
    }, "Palette preview"));
    expect(html).toContain(`--de-background:${background}`);
    expect(html).toContain(`--de-foreground:${foreground}`);
    expect(html).toContain(`--de-palette-light:${light}`);
    expect(html).toContain(`--de-palette-dark:${dark}`);
  });

  it("renders the Lab with catalog, theme controls, preview, and registry metadata", () => {
    const html = renderToStaticMarkup(createElement(DesignLab));
    expect(html).toContain("Design Lab");
    expect(html).toContain("Action Button");
    expect(html).toContain('data-choice-label="Theme"');
    expect(html).toContain('data-choice-label="Viewport"');
    expect(html).toContain("Lifecycle status");
    expect(html).toContain("Supported motion");
    expect(html).toContain("Preset");
    expect(html).toContain("Raw registry metadata");
    expect(html).toContain("Explore the work");
  });
});
