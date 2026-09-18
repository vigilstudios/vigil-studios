"use client";

import { useEffect, useRef } from "react";
import { cursor, startCursor, tickCursor } from "./cursor";
import { watchCovered } from "./covered";
import { PHASE, rng, subscribeStory } from "@/components/site/story/progress";

/**
 * Notifications floating around the mark. Each one arrives as a problem
 * with a pulsing dot (red when something is broken or a lead is waiting,
 * amber when something needs attention), holds, turns into what Vigil did
 * about it (green dot), holds, gets crossed out, and goes; a new one
 * appears somewhere else. Five at a time on desktop, three on a phone.
 * They keep out of the headline zone, off the edges, and away from each
 * other, and they drift against the pointer at their own depths. Plain DOM
 * inside a ref: nothing here re-renders React.
 */
type Pair = [problem: string, handled: string, tone?: "warn"];
const PAIRS: Pair[] = [
  ["SSL certificate expires in 3 days", "SSL renewed for a year", "warn"],
  ["Is the site down?", "Up · checked 2 minutes ago"],
  ["Update 14 plugins", "Updates applied overnight", "warn"],
  ["Domain renewal · $19.99", "Domain renewed, in your name", "warn"],
  ["Contact form not sending", "Form fixed · 3 leads delivered"],
  ["Missed call (2)", "Virtue texted them back"],
  ["Backup failed", "Backup verified"],
  ["PageSpeed 41", "PageSpeed 96", "warn"],
  ["Publish failed", "Live at 9:02 AM"],
  ["Layout shifted on iPhone", "Fixed on every phone"],
  ["Booking widget broken", "Bookings running again"],
  ["Add a meta description", "SEO basics done", "warn"],
  ["Change Saturday hours", "Hours updated", "warn"],
  ["Image too large", "Images optimised", "warn"],
  ["Invoice #1042 overdue", "Paid · receipt sent", "warn"],
  ["New quote request · Maria R.", "Virtue followed up · 3 min"],
  ["Google Business · verify", "Listing verified", "warn"],
  ["404 · /services", "Redirect in place"],
  ["New lead · Priya S. · quote form", "Virtue replied in 2 min · booked"],
  ["Missed call · 6:48 PM", "Virtue texted back · appointment set"],
  ["Unread message · Instagram", "Answered · sent to your inbox"],
  ["3 leads waiting since Friday", "All 3 followed up · 1 booked"],
  ["Voicemail (4)", "Callbacks scheduled by Virtue"],
  ["Quote request · no reply in 2 days", "Quote sent · follow-up Tuesday"],
  ["No reviews this month", "New 5-star review · Daniel K.", "warn"],
  ["Website visits down 18%", 'Ranking for "dentist near me"', "warn"],
  ["Newsletter overdue", "Monthly update sent to 312 customers", "warn"],
  ["Google listing out of date", "Hours, photos and offers refreshed", "warn"],
];

/** Lifecycle, in seconds. */
const T = { pop: 0.45, bad: 2.6, flip: 0.35, good: 1.7, strike: 0.5, hold: 0.55, out: 0.45 };
const TOTAL = Object.values(T).reduce((a, b) => a + b, 0);

type Slot = { el: HTMLDivElement | null; t0: number; bad: string; good: string; x: number; y: number; dx: number; dy: number; ph: number; par: number; hw: number; flipped: boolean; struck: boolean };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const back = (t: number) => 1 + 2.6 * Math.pow(t - 1, 3) + 1.6 * Math.pow(t - 1, 2);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * `good` with `items` shows only good news (no problem phase, a longer
 * hold), for the closing section. `avoid` is a box (in % of the host) the
 * notes stay out of, where the words are; the default is the hero's.
 */
export function HeroNotes({ good = false, items, avoid, count }: { good?: boolean; items?: string[]; avoid?: { x: [number, number]; y: [number, number] }; count?: { desktop: number; phone: number } } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items), avoidRef = useRef(avoid), countRef = useRef(count);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const goodItems = itemsRef.current, avoidBox = avoidRef.current, counts = countRef.current;
    startCursor();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phone = () => host.clientWidth < 760;
    const slots: Slot[] = [];
    let deck: number[] = [];
    const pool: Pair[] = goodItems ? goodItems.map((t) => [t, t]) : PAIRS;
    const next = () => {
      if (!deck.length) deck = pool.map((_, i) => i).sort(() => Math.random() - 0.5);
      return pool[deck.pop()!];
    };
    // an ellipse around the mark (which sits at 50 % / 45 %), never over the words below it, never off the edge;
    // with an avoid box, anywhere in the viewport except that box
    const place = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (avoidBox) {
        for (let i = 0; i < 12; i++) {
          const x = rnd(w * 0.06, w * 0.94), y = rnd(h * 0.12, h * 0.94);
          const inside = x > w * avoidBox.x[0] / 100 && x < w * avoidBox.x[1] / 100 && y > h * avoidBox.y[0] / 100 && y < h * avoidBox.y[1] / 100;
          if (!inside) return { x, y };
        }
        return { x: w * 0.1, y: h * 0.2 };
      }
      const th = rnd(0, Math.PI * 2);
      const rx = w * (phone() ? rnd(0.28, 0.36) : rnd(0.3, 0.42)), ry = h * (phone() ? rnd(0.22, 0.3) : rnd(0.2, 0.32));
      let x = w / 2 + Math.cos(th) * rx, y = h * 0.45 + Math.sin(th) * ry;
      if (y > h * 0.6) y = h * 0.45 - (y - h * 0.45);
      y = Math.max(h * 0.12, y);
      x = Math.min(Math.max(x, w * 0.04), w * 0.96);
      return { x, y };
    };
    const spawn = (slot: Slot, t: number) => {
      const [problem, handled, tone] = next();
      // try a few spots and keep the one farthest from the notes already on screen
      let p = place(), best = -1;
      for (let i = 0; i < 10; i++) {
        const q = place();
        const d = Math.min(1e9, ...slots.filter((o) => o.el && o !== slot).map((o) => Math.hypot(o.x - q.x, o.y - q.y)));
        if (d > best) { best = d; p = q; }
        if (d > 220) break;
      }
      const el = document.createElement("div");
      el.className = good ? "hero-note good" : tone === "warn" ? "hero-note warn" : "hero-note";
      el.innerHTML = `<i></i><b></b>`;
      el.querySelector("b")!.textContent = problem;
      host.appendChild(el);
      // keep the whole note on screen (a phone is narrower than the ellipse plus a note)
      const hw = el.offsetWidth / 2 + 12;
      p.x = Math.min(Math.max(p.x, hw), host.clientWidth - hw);
      Object.assign(slot, { el, bad: problem, good: handled, t0: t, x: p.x, y: p.y, dx: rnd(-6, 6), dy: rnd(-4, 4), ph: rnd(0, 6.28), par: rnd(10, 26), hw, flipped: false, struck: false });
      el.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%) scale(.6)`;
    };
    const ensure = (t: number) => {
      const n = phone() ? (counts?.phone ?? 3) : (counts?.desktop ?? 5);
      while (slots.length < n) slots.push({ el: null, t0: t + slots.length * (TOTAL / n) * 0.9 + rnd(0, 0.4), bad: "", good: "", x: 0, y: 0, dx: 0, dy: 0, ph: 0, par: 0, hw: 0, flipped: false, struck: false });
      while (slots.length > n) slots.pop()!.el?.remove();
    };

    let raf = 0, visible = true, hidden = document.hidden, covered = false;
    const start = performance.now();
    const frame = (now: number) => {
      raf = 0;
      if (!visible || hidden || covered) return;
      tickCursor(now);
      const t = (now - start) / 1000;
      ensure(t);
      for (const s of slots) {
        if (!s.el) {
          if (t >= s.t0) spawn(s, t);
          continue;
        }
        const a = t - s.t0, el = s.el;
        // State changes are keyed on elapsed time, not on which frame happens to run, so a throttled tab never skips one.
        if (!good && a >= T.pop + T.bad && !s.flipped) { s.flipped = true; el.classList.remove("warn"); el.classList.add("good"); el.querySelector("b")!.textContent = s.good; }
        if (!good && a >= T.pop + T.bad + T.flip + T.good && !s.struck) { s.struck = true; el.classList.add("strike"); }
        let scale = 1, opacity = 1, k = 0;
        const holdEnd = good ? T.pop + 3.4 : T.pop + T.bad + T.flip + T.good + T.strike + T.hold;
        if (a < T.pop) { k = a / T.pop; scale = 0.6 + 0.4 * back(k); opacity = Math.min(1, k * 2); }
        else if (a < holdEnd) { if (!good && a >= T.pop + T.bad && a < T.pop + T.bad + T.flip) scale = 1 + 0.06 * Math.sin(((a - (T.pop + T.bad)) / T.flip) * Math.PI); }
        else if (a < holdEnd + T.out) { const f = ease((a - holdEnd) / T.out); scale = 1 - 0.15 * f; opacity = 1 - f; s.y += 0.6; }
        else { el.remove(); s.el = null; s.t0 = t + rnd(0.4, 1.6); continue; }
        const bob = reduced ? 0 : Math.sin(t * 1.3 + s.ph) * 4;
        if (!reduced) { s.x = Math.min(Math.max(s.x + s.dx / 60, s.hw), host.clientWidth - s.hw); s.y += s.dy / 60; }
        el.style.opacity = String(opacity);
        el.style.transform = `translate(${s.x - cursor.x * s.par}px,${s.y + bob - cursor.y * s.par * 0.7}px) translate(-50%,-50%) scale(${scale})`;
      }
      raf = requestAnimationFrame(frame);
    };
    const loop = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loop();
    });
    io.observe(host);
    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden) loop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const unwatch = watchCovered(host, (c) => {
      covered = c;
      if (!c) loop();
    });
    // The hero's notes fade with its words as the story begins.
    const unsubscribe = good ? () => {} : subscribeStory((p) => {
      host.style.opacity = String(1 - rng(rng(p, PHASE.untype[0], PHASE.untype[1]), 0, 0.35));
    });
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      unwatch();
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      host.replaceChildren();
    };
  }, [good]);

  return <div ref={ref} className="pointer-events-none absolute inset-0 z-[3]" aria-hidden />;
}
