import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { entranceEffects, resolvePresentation } from "../design-engine/presentation/schema";
import { observePresentationMotion } from "../design-engine/presentation/motion";
import { initializeNavigationInk } from "../design-engine/composition/navigation-ink";
import { PresentationProvider } from "../design-engine/presentation/PresentationContext";
import { renderSection } from "../design-engine/composition/render";
import type { SectionId } from "../design-engine/composition/schemas";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import { designComponents } from "../design-engine/registry/components";

afterEach(() => vi.unstubAllGlobals());

function fixture(pieceCount = 0) {
  const animations: { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }[] = [];
  const animated = () => ({ cancel: vi.fn(), onfinish: null as (() => void) | null });
  const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => ReturnType<typeof animated>>(() => { const animation = animated(); animations.push(animation); return animation; });
  const pieces = Array.from({ length: pieceCount }, () => ({ animate: vi.fn(animate), contains: () => false, closest: () => null, checkVisibility: () => true }));
  const surface = { animate, querySelectorAll: () => pieces };
  const anchor = {};
  const listeners = new Map<string, () => void>();
  const host = {
    querySelector: (selector: string) => selector === ".de-navigation-motion-anchor" ? anchor : surface,
    checkVisibility: vi.fn(() => true), contains: vi.fn(() => false),
    addEventListener: (event: string, listener: () => void) => listeners.set(event, listener),
    removeEventListener: (event: string) => listeners.delete(event),
  };
  const observe = vi.fn(), disconnect = vi.fn();
  let emit: (visible: boolean) => void = () => undefined;
  let observerOptions: IntersectionObserverInit | undefined;
  vi.stubGlobal("document", { activeElement: {} });
  vi.stubGlobal("IntersectionObserver", class {
    observe = observe;
    disconnect = disconnect;
    constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
      observerOptions = options;
      emit = visible => callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
  });
  return { host: host as unknown as HTMLElement, surface, anchor, pieces, animations, listeners, observe, disconnect, animate, emit: (visible: boolean) => emit(visible), options: () => observerOptions };
}

describe("Navigation presentation motion", () => {
  it.each(entranceEffects.filter(effect => effect !== "none"))("plays overridden %s on the painted wrapper with a stable observer", effect => {
    const f = fixture();
    const resolved = resolvePresentation({ motion: { entrance: "fade", duration: 650 } }, undefined, { motionMode: "override", motion: { entrance: effect, duration: 1800, delay: 250, distance: 140, threshold: .4 } });
    const cleanup = observePresentationMotion(f.host, resolved.motion!, true);
    expect(f.observe).toHaveBeenCalledWith(f.anchor);
    expect(f.options()?.rootMargin).toBe("0px");
    f.emit(true);
    expect(f.animate).toHaveBeenCalledWith([expect.objectContaining({ opacity: 0 }), expect.objectContaining({ opacity: 1 })], expect.objectContaining({ duration: 1800, delay: 250, fill: "both" }));
    expect(f.animate.mock.calls[0][0]).not.toEqual(expect.arrayContaining([expect.objectContaining({ color: expect.anything() })]));
    cleanup?.();
    expect(f.animations[0].cancel).toHaveBeenCalled();
    expect(f.disconnect).toHaveBeenCalledOnce();
    expect(f.listeners.size).toBe(0);
  });
  it("returns the navigation to its authored paint after finishing an entrance", () => {
    const f = fixture();
    observePresentationMotion(f.host, { entrance: "fade" }, true);
    f.emit(true);
    f.animations[0].onfinish?.();
    expect(f.animations[0].cancel).toHaveBeenCalledOnce();
  });
  it("supports exits and replay, recovering immediately on keyboard focus", () => {
    const f = fixture();
    observePresentationMotion(f.host, { entrance: "fade", exit: "blur", replay: true }, true);
    f.emit(true); f.emit(false);
    expect(f.animate.mock.calls[1][0]).toEqual([expect.objectContaining({ opacity: 1 }), expect.objectContaining({ opacity: 0, filter: "blur(10px)" })]);
    f.listeners.get("focusin")?.();
    expect(f.animations[1].cancel).toHaveBeenCalledOnce();
    f.emit(true);
    expect(f.animate).toHaveBeenCalledTimes(3);
  });
  it("does not replay a one-time entrance when returning to the viewport", () => {
    const f = fixture();
    observePresentationMotion(f.host, { entrance: "slide-down", exit: "fade", replay: false }, true);
    f.emit(true); f.emit(false); f.emit(true);
    expect(f.animate).toHaveBeenCalledTimes(2);
    expect(f.animations[1].cancel).toHaveBeenCalledOnce();
  });
  it("keeps focused navigation visible when settings are changed", () => {
    const f = fixture();
    vi.mocked(f.host.contains).mockReturnValue(true);
    observePresentationMotion(f.host, { entrance: "clip" }, true);
    f.emit(true);
    expect(f.animate).not.toHaveBeenCalled();
  });
  it("uses configured stagger and order for visible navigation groups", () => {
    const f = fixture(3);
    observePresentationMotion(f.host, { entrance: "fade", stagger: 90, delay: 50, sequence: "reverse" }, true);
    f.emit(true);
    expect(f.pieces[2].animate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ delay: 50 }));
    expect(f.pieces[0].animate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ delay: 230 }));
  });
  it("disables entrance/exit when the section motion is None", () => {
    const f = fixture();
    const settings = resolvePresentation({ motion: { entrance: "fade", exit: "blur" } }, undefined, { motionMode: "none" });
    expect(observePresentationMotion(f.host, settings.motion!, true)).toBeUndefined();
    expect(f.observe).not.toHaveBeenCalled();
  });
  it.each(designComponents.filter(entry => entry.status === "production" && entry.id.startsWith("navigation.")))("$id provides separate motion paint and observation boxes", entry => {
    const section = makeSection(entry.id as SectionId, "navigation-motion");
    const html = renderToStaticMarkup(<PresentationProvider value={{ motion: { entrance: "fade" } }}>{renderSection(section)}</PresentationProvider>);
    expect(html).toContain('class="de-navigation-motion-anchor"');
    expect(html).toContain('class="de-navigation-motion"');
    expect(html).toContain('<nav');
  });
});

describe("Initial navigation palette", () => {
  it("settles light/dark Hero ink before re-enabling native color transitions", () => {
    const properties = new Map<string, string>();
    const dataset: Record<string, string> = {};
    const header = { dataset, style: { getPropertyValue: (key: string) => properties.get(key) ?? "", setProperty: (key: string, value: string) => properties.set(key, value), removeProperty: (key: string) => properties.delete(key) } } as unknown as HTMLElement;
    const read = vi.fn(() => {
      expect(dataset.paletteReady).toBe("false");
      return { getPropertyValue: () => "resolved color" };
    });
    vi.stubGlobal("getComputedStyle", read);
    initializeNavigationInk(header, true);
    expect(properties.get("--de-navigation-auto-ink")).toBe("var(--de-palette-light)");
    expect(dataset.paletteReady).toBe("true");
    initializeNavigationInk(header, true);
    expect(read).toHaveBeenCalledOnce();
    initializeNavigationInk(header, false);
    expect(properties.get("--de-navigation-auto-ink")).toBe("var(--de-palette-dark)");
    initializeNavigationInk(header);
    expect(properties.has("--de-navigation-auto-ink")).toBe(false);
    expect(dataset.paletteReady).toBe("true");
  });
});
