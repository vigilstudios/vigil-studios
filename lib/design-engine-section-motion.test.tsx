import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { observePresentationMotion, sectionMotionPieces } from "../design-engine/presentation/motion";
import { entranceReadyAt } from "../design-engine/motion/entrance-timing";
import { makeCreatorSection } from "../design-engine/preview/creator-fixtures";
import { renderSection } from "../design-engine/composition/render";

afterEach(() => vi.unstubAllGlobals());

// A DOM tree with nested authored groups, rather than a flat selector stub.
type Piece = {
  name: string; kind: "heading" | "media" | "content" | "group"; children: Piece[]; textContent: string; parentElement: Piece | null;
  animate: ReturnType<typeof vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }>>;
  closest: (selector: string) => object | null; contains: (other: unknown) => boolean; matches: () => boolean; querySelector: () => null; querySelectorAll: (selector: string) => Piece[];
};
function node(name: string, kind: Piece["kind"] = "group", children: Piece[] = [], hidden = false): Piece {
  const element: Piece = {
    name, kind, children, textContent: name, parentElement: null,
    animate: vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }>(() => ({ cancel: vi.fn(), onfinish: null })),
    closest: (selector: string): object | null => hidden && selector.includes("[inert]") ? element : null,
    contains: (other: unknown): boolean => children.some(child => child === other || child.contains(other)),
    matches: () => false, querySelector: () => null,
    querySelectorAll: (selector: string): Piece[] => {
      const all = children.flatMap(child => [child, ...child.querySelectorAll("*")]);
      if (selector === "*") return all;
      if (selector.startsWith("header")) return all.filter(child => child.kind === "heading");
      if (selector.startsWith(".de-creator-photos")) return all.filter(child => child.kind === "media");
      return all.filter(child => child.kind === "content");
    },
  };
  children.forEach(child => { child.parentElement = element; });
  return element;
}

function fixture() {
  const heading = [node("Eyebrow", "heading"), node("Title", "heading"), node("Description", "heading")];
  const content = [node("Biography", "content"), node("Coffee pill", "content"), node("Design pill", "content"), node("Signature", "content")];
  const media = node("Photos", "media", [node("Photo caption")]);
  const fallback = node("Unmarked body group", "group", [node("Authored card")]);
  const hidden = node("Hidden dialog", "content", [], true);
  const section = node("section", "group", [node("Inner grid", "group", [node("Copy", "group", [node("Header", "group", heading), ...content]), media]), fallback, hidden]);
  const listeners = new Map<string, () => void>();
  const host = { querySelector: () => section, checkVisibility: () => true, contains: vi.fn(() => false), addEventListener: (name: string, callback: () => void) => listeners.set(name, callback), removeEventListener: (name: string) => listeners.delete(name) };
  const observe = vi.fn(), disconnect = vi.fn();
  let emit: (visible: boolean) => void = () => undefined;
  vi.stubGlobal("document", { activeElement: {} });
  vi.stubGlobal("performance", { now: () => 100 });
  vi.stubGlobal("IntersectionObserver", class {
    observe = observe; disconnect = disconnect;
    constructor(callback: IntersectionObserverCallback) { emit = visible => callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  });
  return { host: host as unknown as HTMLElement, section, heading, content, media, fallback, hidden, listeners, observe, disconnect, emit: (visible: boolean) => emit(visible) };
}

describe("Complete section motion coverage", () => {
  it("covers biography, pills and unmarked content without animating ancestors twice", () => {
    const f = fixture();
    const pieces = sectionMotionPieces(f.section as unknown as HTMLElement);
    expect(pieces.heading).toEqual(f.heading);
    expect(pieces.body).toEqual([...f.content, f.fallback]);
    expect(pieces.media).toEqual([f.media]);
    expect(pieces.body).not.toContain(f.hidden);
    const all = [...pieces.heading, ...pieces.body, ...pieces.media];
    expect(all.some(parent => all.some(child => parent !== child && parent.contains(child)))).toBe(false);
  });
  it("uses an authored parent group when it contains another selected piece", () => {
    const child = node("Portrait", "media");
    const parent = node("Card", "content", [child]);
    expect(sectionMotionPieces(node("section", "group", [parent]) as unknown as HTMLElement)).toEqual({ heading: [], media: [], body: [parent] });
  });
  it.each(["heading-first", "media-first", "reverse", "together"] as const)("applies %s sequencing to all pieces", sequence => {
    const f = fixture();
    const cleanup = observePresentationMotion(f.host, { entrance: "blur-slide", stagger: 75, delay: 50, sequence });
    f.emit(true);
    const natural = [...f.heading, ...f.content, f.fallback, f.media];
    const ordered = sequence === "media-first" ? [f.media, ...f.heading, ...f.content, f.fallback] : sequence === "reverse" ? natural.toReversed() : natural;
    ordered.forEach((piece, index) => expect(piece.animate).toHaveBeenCalledWith([
      expect.objectContaining({ opacity: 0, transform: "translateY(32px)", filter: "blur(10px)" }),
      expect.objectContaining({ opacity: 1 }),
    ], expect.objectContaining({ delay: 50 + (sequence === "together" ? 0 : index * 75), duration: 650 })));
    expect(f.section.animate).not.toHaveBeenCalled();
    cleanup?.();
  });
  it("animates the entire section with zero stagger and releases count-up timing on cleanup", () => {
    const f = fixture();
    const cleanup = observePresentationMotion(f.host, { entrance: "fade", delay: 800, stagger: 0 });
    expect(entranceReadyAt(f.section as unknown as HTMLElement)).toBe(Infinity);
    f.emit(true);
    expect(f.section.animate).toHaveBeenCalledOnce();
    expect(entranceReadyAt(f.content[0] as unknown as HTMLElement)).toBe(900);
    cleanup?.();
    expect(entranceReadyAt(f.content[0] as unknown as HTMLElement)).toBe(0);
    expect(f.disconnect).toHaveBeenCalledOnce();
  });
  it("supports stagger without headings, including social links inside a nav", () => {
    const f = fixture(); f.heading.forEach(piece => { piece.kind = "content"; });
    observePresentationMotion(f.host, { entrance: "fade", stagger: 80 });
    f.emit(true);
    expect(f.content[0].animate).toHaveBeenCalledOnce();
    expect(f.section.animate).not.toHaveBeenCalled();
  });
  it("applies exits to the body and restores visibility on focus and re-entry", () => {
    const f = fixture();
    const cleanup = observePresentationMotion(f.host, { entrance: "fade", exit: "blur", stagger: 80 });
    f.emit(true); f.emit(false);
    expect(f.content[0].animate.mock.calls[1]).toEqual([[
      expect.objectContaining({ opacity: 1 }), expect.objectContaining({ opacity: 0, filter: "blur(10px)" }),
    ], expect.objectContaining({ delay: 0 })]);
    f.listeners.get("focusin")?.();
    expect(f.content[0].animate.mock.results[1].value.cancel).toHaveBeenCalledOnce();
    f.emit(true);
    expect(f.content[0].animate).toHaveBeenCalledTimes(2);
    cleanup?.();
  });
  it("keeps authored transforms and filters, and does not replace them for fade", () => {
    const f = fixture();
    vi.stubGlobal("getComputedStyle", () => ({ opacity: ".8", transform: "matrix(1,0,0,1,0,12)", filter: "grayscale(1)", clipPath: "none" }));
    const cleanup = observePresentationMotion(f.host, { entrance: "blur-slide", stagger: 80 });
    f.emit(true);
    expect(f.content[0].animate.mock.calls[0][0]).toEqual([
      expect.objectContaining({ transform: "translateY(32px) matrix(1,0,0,1,0,12)", filter: "blur(10px) grayscale(1)" }),
      { opacity: .8, transform: "matrix(1,0,0,1,0,12)", filter: "grayscale(1)" },
    ]);
    cleanup?.();
    observePresentationMotion(f.host, { entrance: "fade", stagger: 80 }); f.emit(true);
    expect(f.content[0].animate.mock.calls[1][0]).toEqual([{ opacity: 0 }, { opacity: .8 }]);
  });
  it("leaves every piece static with None", () => {
    const f = fixture();
    expect(observePresentationMotion(f.host, { entrance: "none", exit: "none", stagger: 90 })).toBeUndefined();
    expect(f.observe).not.toHaveBeenCalled();
  });
  it("marks each About biography paragraph, interest and signature as a motion piece", () => {
    const section = makeCreatorSection("about.creator-profile", "about");
    const html = renderToStaticMarkup(renderSection(section));
    expect(html).toContain('class="de-text" data-de-motion-piece="content"');
    expect(html.match(/<li data-de-motion-piece="content"/g)).toHaveLength(section.content.interests.length);
    expect(html).toContain('class="de-creator-signature" data-de-motion-piece="content"');
  });
  it("marks every stat, source note and social profile including icon-only links", () => {
    const section = makeCreatorSection("proof.social-reach", "reach");
    const html = renderToStaticMarkup(renderSection({ ...section, linkStyle: "icons" }));
    expect(html.match(/class="de-creator-stat" data-de-motion-piece="content"/g)).toHaveLength(section.content.stats.length);
    expect(html).toContain('class="de-creator-basis de-mono" data-de-motion-piece="content"');
    expect(html.match(/data-de-motion-piece="content" aria-label=/g)).toHaveLength(section.content.socials.length);
  });
});
