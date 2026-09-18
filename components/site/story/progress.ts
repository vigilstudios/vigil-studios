/**
 * The story's scroll progress, 0 at the top of the hero and 1 when "How it
 * works" has finished, shared by everything on the stage. One listener
 * measures; the pieces subscribe and draw themselves. Kept outside React
 * state on purpose: it changes every frame while the visitor scrolls.
 */
type Listener = (p: number) => void;
const listeners = new Set<Listener>();
let current = 0;

export function subscribeStory(fn: Listener): () => void {
  listeners.add(fn);
  fn(current);
  return () => {
    listeners.delete(fn);
  };
}

export function setStoryProgress(p: number) {
  if (p === current) return;
  current = p;
  listeners.forEach((fn) => fn(p));
}

export function getStoryProgress() {
  return current;
}

/** Where each beat sits on the 0–1 scroll of the stage (desktop). */
export const PHASE = {
  untype: [0.05, 0.2],
  markExit: [0.09, 0.3],
  head: [0.3, 0.46],
  ravel: [0.44, 0.52],
  film: [0.5, 1],
} as const;

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const rng = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);
export const ease = {
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  io: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t: number) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2),
};

/**
 * A typewriter over one element: `set(n)` shows the first n characters,
 * with a caret while the count is moving. The element keeps its full text
 * in the server HTML for crawlers; the first `set` takes over.
 */
export class Typer {
  readonly full: string;
  private shown = -1;
  private caret: HTMLElement;
  private text: Text;
  constructor(private el: HTMLElement) {
    this.full = el.dataset.text ?? el.textContent?.trim() ?? "";
    el.dataset.text = this.full;
    this.text = document.createTextNode("");
    this.caret = document.createElement("i");
    this.caret.className = "story-caret story-caret-off";
    el.replaceChildren(this.text, this.caret);
    el.classList.remove("story-typing-pending");
  }
  set(n: number, active: boolean) {
    n = clamp(Math.round(n), 0, this.full.length);
    if (n !== this.shown) {
      this.shown = n;
      this.text.textContent = this.full.slice(0, n);
    }
    this.caret.classList.toggle("story-caret-off", !active);
  }
}
