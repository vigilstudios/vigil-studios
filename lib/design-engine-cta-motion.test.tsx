import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { resolveActionPresentation } from "../design-engine/actions/presentation";
import { hoverEffects, resolvePresentation, type PresentationSettings } from "../design-engine/presentation/schema";
import { PresentationProvider } from "../design-engine/presentation/PresentationContext";
import { DesignButton } from "../design-engine/primitives/DesignButton";
import { renderSection } from "../design-engine/composition/render";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import { parseSection, type SectionId } from "../design-engine/composition/schemas";
import { designComponents } from "../design-engine/registry/components";
import { getActionCapabilities } from "../design-engine/actions/capabilities";
import { InquiryForm } from "../design-engine/forms/InquiryForm";
import { inquiryPreset } from "../design-engine/preview/ending-fixtures";
import { inquiryFormPresets } from "../design-engine/forms/appearance";
import { PresentationControls } from "../design-engine/preview/composition/PresentationControls";

describe("CTA motion resolution", () => {
  it.each(hoverEffects)("explicit section %s wins over a saved CTA hover style", ctaHover => {
    const resolved = resolvePresentation({ buttons: { hover: "color" }, motion: { ctaHover: "glow" } }, undefined, { motionMode: "override", motion: { ctaHover } });
    expect(resolveActionPresentation(resolved, { hover: "icon-slide", variant: "outline" }).hover).toBe(ctaHover);
    const html = renderToStaticMarkup(<PresentationProvider value={resolved}><DesignButton href="https://example.com" presentation={{ hover: "icon-slide", icon: "mail" }}>CTA</DesignButton></PresentationProvider>);
    expect(html).toContain(`data-action-hover="${ctaHover}"`);
    expect(html).toContain('<svg');
  });
  it("inherits individual button styles when section CTA animation is unset, including with overridden entrance motion", () => {
    const defaults = resolvePresentation({ motion: { ctaHover: "glow" } }, undefined, { motionMode: "override", motion: { entrance: "blur", ctaHover: undefined } });
    expect(defaults.motion?.ctaHover).toBe("glow");
    expect(defaults.ctaAnimationOverride).toBeUndefined();
    expect(resolveActionPresentation(defaults, { hover: "icon-slide" }).hover).toBe("icon-slide");
    expect(resolveActionPresentation(defaults).hover).toBe("glow");
  });
  it("honors None in site/page defaults and motion-off sections", () => {
    const site = { buttons: { hover: "lift" as const }, motion: { ctaHover: "glow" as const } };
    expect(resolveActionPresentation(resolvePresentation(site, { motion: { ctaHover: "none" } })).hover).toBe("none");
    expect(resolveActionPresentation(resolvePresentation(site, undefined, { motionMode: "none" }), { hover: "icon-slide" }).hover).toBe("none");
    expect(resolveActionPresentation(resolvePresentation({ motion: { ctaHover: "none" } }), { hover: "color" }).hover).toBe("color");
  });
  it("restores inherited choices immediately when an override is cleared, preserving false/zero/null", () => {
    const defaults = resolvePresentation({ buttons: { shape: "square", hover: "lift", icon: "mail" }, motion: { ctaHover: "color", delay: 300, replay: true } }, undefined, { buttons: { shape: undefined, hover: undefined, icon: null }, motionMode: "override", motion: { ctaHover: undefined, delay: 0, replay: false } });
    expect(defaults.buttons).toEqual({ shape: "square", hover: "lift", icon: null });
    expect(defaults.motion).toMatchObject({ ctaHover: "color", delay: 0, replay: false });
    expect(resolveActionPresentation(defaults, { shape: undefined, hover: undefined }).shape).toBe("square");
  });
  it.each(designComponents.filter(entry => entry.status === "production" && getActionCapabilities(entry.id).primary))("$id routes its contextual CTA through section animation", entry => {
    const section = parseSection({ ...makeSection(entry.id as SectionId, "motion-check"), contextualActions: { primary: { enabled: true, label: "Motion CTA", action: { type: "external", url: "https://example.com/" }, presentation: { hover: "icon-slide", icon: "mail" } } } });
    const value = resolvePresentation(undefined, undefined, { motionMode: "override", motion: { ctaHover: "lift" } });
    const html = renderToStaticMarkup(<PresentationProvider value={value}>{renderSection(section)}</PresentationProvider>);
    expect(html).toMatch(/data-action-hover="lift"[^>]*>[\s\S]*?Motion CTA/);
  });
  it("uses the same animation resolution for form submits and ordinary buttons", () => {
    const value = resolvePresentation(undefined, undefined, { motionMode: "override", motion: { ctaHover: "sweep" } });
    const html = renderToStaticMarkup(<PresentationProvider value={value}><InquiryForm config={inquiryPreset("collaboration")} appearance={inquiryFormPresets.editorial}/></PresentationProvider>);
    expect(html).toContain('data-action-hover="sweep"');
    expect(html).toContain('disabled');
  });
  it("shows Inherit in Motion when CTA animation is not explicitly chosen", () => {
    const value: PresentationSettings = { motionMode: "override", motion: { entrance: "fade" } };
    const html = renderToStaticMarkup(<PresentationControls value={value} motionOnly onChange={() => undefined}/>);
    expect(html).toMatch(/aria-label="CTA animation"[\s\S]*?<option value="inherit" selected="">Inherit/);
  });
});
