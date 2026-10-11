import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { presentationSchema, resolvePresentation } from "../design-engine/presentation/schema";
import { PresentationControls } from "../design-engine/preview/composition/PresentationControls";
import { PresentationSurface } from "../design-engine/presentation/PresentationSurface";
import { PresentationProvider } from "../design-engine/presentation/PresentationContext";
import { MediaReveal } from "../design-engine/motion/MediaReveal";
import { sectionSchemas, parseSection, type SectionId } from "../design-engine/composition/schemas";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import { deserializeSite, serializeSite } from "../design-engine/site/persistence";
import muse from "../docs/design-engine/creator-express-editor/muse-bennett.site.json";

describe("Independent image transitions", () => {
  it("inherits site and page image choices, and lets a section override without overriding content motion", () => {
    const site = { imageMotion: "static" as const, motion: { entrance: "fade" as const, stagger: 90 } };
    expect(resolvePresentation(site).imageMotion).toBe("static");
    const inherited = resolvePresentation(site, { imageMotion: "animate" });
    expect(inherited.imageMotion).toBe("animate");
    const section = resolvePresentation(site, { imageMotion: "animate" }, { imageMotion: "static", motionMode: "inherit" });
    expect(section.imageMotion).toBe("static");
    expect(section.motion).toEqual(site.motion);
    expect(resolvePresentation(site, undefined, { imageMotion: "animate", motionMode: "none" }).motion?.entrance).toBe("none");
    expect(resolvePresentation().imageMotion).toBeUndefined();
  });
  it.each(Object.keys(sectionSchemas) as SectionId[])("%s accepts, persists and exposes image transitions", id => {
    const section = parseSection({ ...makeSection(id, "image-motion"), presentation: { imageMotion: "static" } });
    expect(parseSection(JSON.parse(JSON.stringify(section))).presentation?.imageMotion).toBe("static");
    const html = renderToStaticMarkup(<PresentationControls motionOnly value={section.presentation} navigation={id.startsWith("navigation.")} onChange={() => undefined}/>);
    expect(html).toContain('aria-label="Image transitions"');
    expect(html).toContain('<option value="static" selected="">Stay static</option>');
    expect(html).toContain('<option value="animate">Follow section motion</option>');
  });
  it("round-trips all three scopes and keeps the Muse hero image static", () => {
    const site = deserializeSite(JSON.stringify(muse));
    site.settings.presentation = { ...site.settings.presentation, imageMotion: "static" };
    site.pages[0].presentation = { ...site.pages[0].presentation, imageMotion: "animate" };
    const restored = deserializeSite(serializeSite(site));
    expect(restored.settings.presentation?.imageMotion).toBe("static");
    expect(restored.pages[0].presentation?.imageMotion).toBe("animate");
    expect(restored.pages[0].sections.find(section => section.id === "opening")?.presentation?.imageMotion).toBe("static");
  });
  it("rejects malformed choices and leaves older drafts unchanged", () => {
    expect(presentationSchema.safeParse({ imageMotion: "sometimes" }).success).toBe(false);
    expect(presentationSchema.parse({ motion: { entrance: "fade" } })).toEqual({ motion: { entrance: "fade" } });
  });
  it("marks the presentation surface for native image reveal suppression", () => {
    expect(renderToStaticMarkup(<PresentationSurface value={{ imageMotion: "static" }}><section>Copy</section></PresentationSurface>)).toContain('data-image-motion="static"');
  });
  it("renders legacy image reveals visibly from first paint when static is selected", () => {
    const html = renderToStaticMarkup(<PresentationProvider value={{ imageMotion: "static" }}><MediaReveal><picture><img src="/photo.webp" alt="Photo"/></picture></MediaReveal></PresentationProvider>);
    expect(html).toContain('class="de-motion-media__surface"');
    expect(html).not.toMatch(/opacity:0|clip-path:inset|transform:translate/);
  });
});
