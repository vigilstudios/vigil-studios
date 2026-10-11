import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { observeCountUp, parseCountUpValue } from "../design-engine/motion/count-up";
import { StatCountUp } from "../design-engine/motion/StatCountUp";
import { parseSection } from "../design-engine/composition/schemas";
import { makeCreatorSection } from "../design-engine/preview/creator-fixtures";
import { serializeSite, deserializeSite } from "../design-engine/site/persistence";
import { siteFromComposition } from "../design-engine/site/model";
import { makeBlankComposition } from "../design-engine/preview/composition/fixtures";
import { ComponentMotionControls } from "../design-engine/preview/composition/ComponentMotionControls";
import { clearEntranceTiming, setEntranceReadyAt } from "../design-engine/motion/entrance-timing";

afterEach(() => vi.unstubAllGlobals());

describe("Audience metric count formatting", () => {
  it.each([
    ["128K", "0K", "64K"], ["2.4M", "0.0M", "1.2M"], ["860K", "0K", "430K"],
    ["42,818", "0", "21,409"], ["87.5%", "0.0%", "43.8%"], ["$1,200.00", "$0.00", "$600.00"],
    ["1.20B+", "0.00B+", "0.60B+"], ["~ 500", "~ 0", "~ 250"], ["-30%", "-0%", "-15%"],
  ])("preserves %s units and precision", (value, start, half) => {
    const metric = parseCountUpValue(value);
    expect(metric?.at(0)).toBe(start);
    expect(metric?.at(.5)).toBe(half);
    expect(metric?.at(1)).toBe(value);
  });
  it.each(["10–20K", "Top 5", "1,2M", "Coming soon", "1.2.3", "9007199254740992"])("leaves ambiguous/non-numeric %s unchanged", value => {
    expect(parseCountUpValue(value)).toBeUndefined();
  });
  it("keeps authored leading zeros and exact final spelling", () => {
    expect(parseCountUpValue("001.00 k")?.at(1)).toBe("001.00 k");
  });
});

function fixture(value = "128K") {
  const frames = new Map<number, FrameRequestCallback>(), listeners = new Map<string, () => void>();
  let next = 0, emit: (visible: boolean) => void = () => undefined;
  const root = { contains: vi.fn(() => false), addEventListener: (name: string, callback: () => void) => listeners.set(name, callback), removeEventListener: (name: string) => listeners.delete(name) };
  const target = { textContent: value, closest: () => root, checkVisibility: () => true } as unknown as HTMLElement;
  const observe = vi.fn(), disconnect = vi.fn();
  const cancel = vi.fn((id: number) => frames.delete(id));
  vi.stubGlobal("document", { activeElement: {} });
  vi.stubGlobal("performance", { now: () => 0 });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { const id = ++next; frames.set(id, callback); return id; });
  vi.stubGlobal("cancelAnimationFrame", cancel);
  vi.stubGlobal("IntersectionObserver", class {
    observe = observe; disconnect = disconnect;
    constructor(callback: IntersectionObserverCallback) { emit = visible => callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  });
  return { target, root, observe, disconnect, frames, listeners, cancel, emit: (visible: boolean) => emit(visible), step: (time: number) => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); } };
}

describe("Count-up viewport lifecycle", () => {
  it("waits for its containing piece's staggered entrance before counting", () => {
    const f = fixture();
    const parent = {} as HTMLElement;
    Object.assign(f.target, { parentElement: parent });
    setEntranceReadyAt(parent, Infinity);
    observeCountUp(f.target, "128K", { duration: 1000, easing: "linear" });
    f.emit(true); f.step(500);
    expect(f.target.textContent).toBe("0K");
    setEntranceReadyAt(parent, 1500);
    f.step(1000); expect(f.target.textContent).toBe("0K");
    f.step(2000); expect(f.target.textContent).toBe("64K");
    f.step(2500); expect(f.target.textContent).toBe("128K");
    clearEntranceTiming(parent);
  });
  it("waits for visibility and delay, advances by elapsed time and lands on the exact value", () => {
    const f = fixture();
    observeCountUp(f.target, "128K", { duration: 1000, delay: 200, easing: "linear" });
    expect(f.target.textContent).toBe("0K");
    expect(f.frames.size).toBe(0);
    expect(f.observe).toHaveBeenCalledWith(f.target);
    f.emit(true); f.step(100);
    expect(f.target.textContent).toBe("0K");
    f.step(700);
    expect(f.target.textContent).toBe("64K");
    f.step(1200);
    expect(f.target.textContent).toBe("128K");
    expect(f.frames.size).toBe(0);
  });
  it("slows towards the final value with ease-out", () => {
    const f = fixture();
    observeCountUp(f.target, "128K", { duration: 1000 });
    f.emit(true); f.step(500);
    expect(f.target.textContent).toBe("112K");
  });
  it("settles an offscreen count and only replays when requested", () => {
    const f = fixture();
    observeCountUp(f.target, "128K", { duration: 1000 });
    f.emit(true); f.step(500); f.emit(false);
    expect(f.target.textContent).toBe("128K");
    expect(f.frames.size).toBe(0);
    f.emit(true);
    expect(f.frames.size).toBe(0);
  });
  it("starts from zero again when replay is enabled", () => {
    const f = fixture();
    observeCountUp(f.target, "128K", { replay: true });
    f.emit(true); f.step(500); f.emit(false); f.emit(true);
    expect(f.target.textContent).toBe("0K");
    expect(f.frames.size).toBe(1);
  });
  it("shows final values on focus and cleans up observers, frames and listeners", () => {
    const f = fixture();
    const cleanup = observeCountUp(f.target, "128K", {});
    f.emit(true); f.step(100); f.listeners.get("focusin")?.();
    expect(f.target.textContent).toBe("128K");
    expect(f.frames.size).toBe(0);
    cleanup?.();
    expect(f.disconnect).toHaveBeenCalledOnce();
    expect(f.listeners.size).toBe(0);
  });
  it("does not hide a currently focused section", () => {
    const f = fixture(); f.root.contains.mockReturnValue(true);
    observeCountUp(f.target, "128K", {});
    expect(f.target.textContent).toBe("128K");
    expect(f.observe).not.toHaveBeenCalled();
  });
  it.each([{ effect: "none" as const, disabled: false }, { effect: "count-up" as const, disabled: true }])("keeps final values when disabled: %j", ({ effect, disabled }) => {
    const f = fixture();
    observeCountUp(f.target, "128K", { effect }, disabled);
    expect(f.target.textContent).toBe("128K");
    expect(f.observe).not.toHaveBeenCalled();
  });
  it("falls back to final values without browser animation APIs", () => {
    const f = fixture(); vi.stubGlobal("IntersectionObserver", undefined);
    observeCountUp(f.target, "128K", {});
    expect(f.target.textContent).toBe("128K");
  });
  it("retains accessible final values and stable-width fallback markup before hydration", () => {
    const html = renderToStaticMarkup(<StatCountUp value="2.4M"/>);
    expect(html).toContain('class="de-stat-count-up-reserve" aria-hidden="true">2.4M');
    expect(html).toContain('class="de-stat-count-up-display" aria-hidden="true">2.4M');
    expect(html).toContain('class="de-visually-hidden">2.4M');
    expect(html).not.toContain("aria-live");
  });
});

describe("Social Reach animation settings", () => {
  it("round-trips customized timing through the portable site document", () => {
    const original = makeCreatorSection("proof.social-reach", "reach");
    const numberAnimation = { effect: "count-up", duration: 2200, delay: 150, stagger: 200, easing: "linear", replay: true };
    const section = parseSection({ ...original, numberAnimation });
    const site = siteFromComposition({ ...makeBlankComposition(), sections: [section] });
    expect(deserializeSite(serializeSite(site)).pages[0].sections[0]).toEqual(section);
    const html = renderToStaticMarkup(<ComponentMotionControls section={section} onChange={() => undefined}/>);
    expect(html).toContain("Stat number animation");
    expect(html).toContain('aria-label="Count-up duration (ms)"');
    expect(html).toContain('value="2200"');
  });
  it.each([{ duration: 199 }, { duration: 5001 }, { delay: -1 }, { stagger: 501 }, { easing: "bounce" }, { unknown: true }])("rejects invalid settings %j", numberAnimation => {
    expect(() => parseSection({ ...makeCreatorSection("proof.social-reach", "reach"), numberAnimation })).toThrow();
  });
});
