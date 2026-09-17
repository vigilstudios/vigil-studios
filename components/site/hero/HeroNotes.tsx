"use client";

import { useEffect, useRef } from "react";
import { cursor, startCursor, tickCursor } from "./cursor";
import { watchCovered } from "./covered";

/**
 * Notifications floating around the mark. Each one arrives as a problem
 * with a pulsing red dot, holds, turns into what Vigil did about it (green
 * dot), holds, gets crossed out, and goes; a new one appears somewhere
 * else. Five at a time on desktop, three on a phone. They keep out of the
 * headline zone, off the edges, and away from each other, and they drift
 * against the pointer at their own depths. Plain DOM inside a ref: nothing
 * here re-renders React.
 */
const PAIRS: [string, string][] = [
  ["SSL certificate expires in 3 days", "SSL renewed for a year"],
  ["Is the site down?", "Up · checked 2 minutes ago"],
  ["Update 14 plugins", "Updates applied overnight"],
  ["Domain renewal · $19.99", "Domain renewed, in your name"],
  ["Contact form not sending", "Form fixed · 3 leads delivered"],
  ["Missed call (2)", "Virtue texted them back"],
  ["Backup failed", "Backup verified"],
  ["PageSpeed 41", "PageSpeed 96"],
  ["Publish failed", "Live at 9:02 AM"],
  ["Layout shifted on iPhone", "Fixed on every phone"],
  ["Booking widget broken", "Bookings running again"],
  ["Add a meta description", "SEO basics done"],
  ["Change Saturday hours", "Hours updated"],
  ["Image too large", "Images optimised"],
  ["Invoice #1042 overdue", "Paid · receipt sent"],
  ["New quote request · Maria R.", "Virtue followed up · 3 min"],
  ["Google Business · verify", "Listing verified"],
  ["404 · /services", "Redirect in place"],
  ["New lead · Priya S. · quote form", "Virtue replied in 2 min · booked"],
  ["Missed call · 6:48 PM", "Virtue texted back · appointment set"],
  ["Unread message · Instagram", "Answered · sent to your inbox"],
  ["3 leads waiting since Friday", "All 3 followed up · 1 booked"],
  ["Voicemail (4)", "Callbacks scheduled by Virtue"],
  ["Quote request · no reply in 2 days", "Quote sent · follow-up Tuesday"],
  ["No reviews this month", "New 5-star review · Daniel K."],
  ["Website visits down 18%", 'Ranking for "dentist near me"'],
  ["Newsletter overdue", "Monthly update sent to 312 customers"],
  ["Google listing out of date", "Hours, photos and offers refreshed"],
];

/** Lifecycle, in seconds. */
const T = { pop: 0.45, bad: 2.6, flip: 0.35, good: 1.7, strike: 0.5, hold: 0.55, out: 0.45 };
const TOTAL = Object.values(T).reduce((a, b) => a + b, 0);

type Slot = { el: HTMLDivElement | null; t0: number; bad: string; good: string; x: number; y: number; dx: number; dy: number; ph: number; par: number; hw: number; flipped: boolean; struck: boolean };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const back = (t: number) => 1 + 2.6 * Math.pow(t - 1, 3) + 1.6 * Math.pow(t - 1, 2);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function HeroNotes() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    startCursor();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phone = () => host.clientWidth < 760;
    const slots: Slot[] = [];
    let deck: number[] = [];
    const next = () => {
      if (!deck.length) deck = PAIRS.map((_, i) => i).sort(() => Math.random() - 0.5);
      return PAIRS[deck.pop()!];
    };
    // an ellipse around the mark (which sits at 50 % / 45 %), never over the words below it, never off the edge
    const place = () => {
      const w = host.clientWidth, h = host.clientHeight;
      const th = rnd(0, Math.PI * 2);
      const rx = w * (phone() ? rnd(0.28, 0.36) : rnd(0.3, 0.42)), ry = h * (phone() ? rnd(0.22, 0.3) : rnd(0.2, 0.32));
      let x = w / 2 + Math.cos(th) * rx, y = h * 0.45 + Math.sin(th) * ry;
      if (y > h * 0.6) y = h * 0.45 - (y - h * 0.45);
      y = Math.max(h * 0.12, y);
      x = Math.min(Math.max(x, w * 0.04), w * 0.96);
      return { x, y };
    };
    const spawn = (slot: Slot, t: number) => {
      const [bad, good] = next();
      // try a few spots and keep the one farthest from the notes already on screen
      let p = place(), best = -1;
      for (let i = 0; i < 10; i++) {
        const q = place();
        const d = Math.min(1e9, ...slots.filter((o) => o.el && o !== slot).map((o) => Math.hypot(o.x - q.x, o.y - q.y)));
        if (d > best) { best = d; p = q; }
        if (d > 220) break;
      }
      const el = document.createElement("div");
      el.className = "hero-note";
      el.innerHTML = `<i></i><b></b>`;
      el.querySelector("b")!.textContent = bad;
      host.appendChild(el);
      // keep the whole note on screen (a phone is narrower than the ellipse plus a note)
      const hw = el.offsetWidth / 2 + 12;
      p.x = Math.min(Math.max(p.x, hw), host.clientWidth - hw);
      Object.assign(slot, { el, bad, good, t0: t, x: p.x, y: p.y, dx: rnd(-6, 6), dy: rnd(-4, 4), ph: rnd(0, 6.28), par: rnd(10, 26), hw, flipped: false, struck: false });
      el.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%) scale(.6)`;
    };
    const ensure = (t: number) => {
      const n = phone() ? 3 : 5;
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
        if (a >= T.pop + T.bad && !s.flipped) { s.flipped = true; el.classList.add("good"); el.querySelector("b")!.textContent = s.good; }
        if (a >= T.pop + T.bad + T.flip + T.good && !s.struck) { s.struck = true; el.classList.add("strike"); }
        let scale = 1, opacity = 1, k = 0;
        if (a < T.pop) { k = a / T.pop; scale = 0.6 + 0.4 * back(k); opacity = Math.min(1, k * 2); }
        else if (a < (k = T.pop + T.bad)) { /* the problem, showing */ }
        else if (a < (k += T.flip)) { scale = 1 + 0.06 * Math.sin(((a - (T.pop + T.bad)) / T.flip) * Math.PI); }
        else if (a < (k += T.good)) { /* handled, showing */ }
        else if (a < (k += T.strike)) { /* the line draws (CSS transition) */ }
        else if (a < (k += T.hold)) { /* crossed out, one beat */ }
        else if (a < (k += T.out)) { const f = ease((a - (k - T.out)) / T.out); scale = 1 - 0.15 * f; opacity = 1 - f; s.y += 0.6; }
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
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      unwatch();
      document.removeEventListener("visibilitychange", onVisibility);
      host.replaceChildren();
    };
  }, []);

  return <div ref={ref} className="pointer-events-none absolute inset-0 z-[3]" aria-hidden />;
}
