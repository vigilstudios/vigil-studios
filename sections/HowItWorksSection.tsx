"use client";

import { useEffect, useRef, useState } from "react";
import { Orb, type AgentState } from "@/components/ui/orb";
import { clamp, ease, PHASE, rng, subscribeStory, Typer } from "@/components/site/story/progress";
import { HOW_IT_WORKS, HOW_IT_WORKS_HEAD } from "@/lib/site-copy";

/**
 * "How it works": the second act on the story's stage. Once the hero has
 * untyped, the eyebrow, title and lead type themselves in place, then a
 * horizontal timeline ravels in: one line, five stations, each with a
 * small line-drawn scene that plays as the visitor scrolls the track
 * along. The fifth grows into the centre while the others step back, and
 * from then on leads, bookings and reviews keep popping up around the
 * live site and cursors keep arriving, the way the hero's notifications
 * do. Same sequence at every size; the geometry (station spacing, node
 * height) follows the viewport.
 *
 * The scenes are static SVG markup driven imperatively (stroke-dashoffset
 * and transforms) from one subscriber; React only mounts them.
 */
const WIN = (ox: number, oy: number, cls = "w", bright = false) => `<g transform="translate(${ox} ${oy})">
  <rect class="hiw-tile ${cls}" pathLength="1" x="0" y="0" width="300" height="150" rx="8"/><line class="hiw-tile ${cls}" pathLength="1" x1="0" y1="22" x2="300" y2="22"/>
  <g><line class="hiw-tile ${cls}" pathLength="1" x1="18" y1="40" x2="80" y2="40"/><rect class="hiw-tile ${cls}" pathLength="1" x="18" y="58" width="110" height="9" rx="2"/><rect class="hiw-tile ${cls}" pathLength="1" x="18" y="73" width="80" height="9" rx="2"/><rect class="hiw-tile ${cls}" pathLength="1" x="160" y="40" width="122" height="66" rx="4"/><rect class="hiw-tile ${cls}" pathLength="1" x="18" y="112" width="80" height="26" rx="4"/><rect class="hiw-tile ${cls}" pathLength="1" x="110" y="112" width="80" height="26" rx="4"/><rect class="hiw-tile ${cls}" pathLength="1" x="202" y="112" width="80" height="26" rx="4"/></g>
  <g class="wf" opacity="0"><rect x="18" y="58" width="110" height="9" rx="2" fill="rgba(245,245,243,${bright ? 0.5 : 0.18})"/><rect x="18" y="73" width="80" height="9" rx="2" fill="rgba(245,245,243,${bright ? 0.35 : 0.12})"/><rect x="160" y="40" width="122" height="66" rx="4" fill="rgba(16,212,90,${bright ? 0.34 : 0.14})"/><rect x="18" y="112" width="80" height="26" rx="4" fill="rgba(245,245,243,${bright ? 0.22 : 0.08})"/><rect x="110" y="112" width="80" height="26" rx="4" fill="rgba(245,245,243,${bright ? 0.22 : 0.08})"/><rect x="202" y="112" width="80" height="26" rx="4" fill="rgba(245,245,243,${bright ? 0.22 : 0.08})"/>${bright ? '<rect x="18" y="112" width="80" height="26" rx="4" fill="none" stroke="rgba(16,212,90,.6)"/>' : ""}</g></g>`;
const CURSOR = '<svg viewBox="0 0 14 18"><path d="M1 1 L1 14 L4.4 10.8 L6.8 16.6 L9.2 15.6 L6.8 9.9 L11.6 9.9 Z" fill="#10d45a" stroke="#0a0a0a" stroke-width=".8"/></svg><span class="cr"></span>';

/** The five scenes, in the order of the steps. Step 2's orb is a React child, not markup. */
const SCENES: string[] = [
  `<svg viewBox="0 0 400 210"><g>
    <text x="14" y="20">Website</text>
    <rect class="hiw-tile pk" pathLength="1" x="14" y="30" width="108" height="76" rx="8"/><text x="28" y="52">Express</text><text class="big" x="28" y="72">Launch in days</text><text class="sm" x="28" y="92">Industry template</text>
    <rect class="hiw-tile pk" pathLength="1" x="146" y="30" width="108" height="76" rx="8"/><text x="160" y="52">Professional</text><text class="big" x="160" y="72">Launch in weeks</text><text class="sm" x="160" y="92">Up to 8 pages</text>
    <rect class="hiw-tile pk" pathLength="1" x="278" y="30" width="108" height="76" rx="8"/><text x="292" y="52">Growth</text><text class="big" x="292" y="72">Scoped</text><text class="sm" x="292" y="92">Apps and portals</text>
    <text x="14" y="128">+ Plan</text>
    <rect class="hiw-tile pl" pathLength="1" x="14" y="136" width="88" height="60" rx="8"/><text x="26" y="158">Basic</text><text class="sm" x="26" y="176">Keep me online</text>
    <rect class="hiw-tile pl" pathLength="1" x="110" y="136" width="88" height="60" rx="8"/><text x="122" y="158">Care</text><text class="sm" x="122" y="176">Changes handled</text>
    <rect class="hiw-tile pl" pathLength="1" x="206" y="136" width="88" height="60" rx="8"/><text x="218" y="158">Growth</text><text class="sm" x="218" y="176">Virtue inside</text>
    <rect class="hiw-tile pl" pathLength="1" x="302" y="136" width="88" height="60" rx="8"/><text x="314" y="158">Priority</text><text class="sm" x="314" y="176">Most capable</text>
    <circle class="clickring" cx="68" cy="68" r="6" fill="none" stroke="#10d45a" opacity="0"/><circle class="cur" cx="392" cy="204" r="5"/></g></svg>
    <span class="hiw-pill p1" style="left:2%;top:6%">Selected</span><span class="hiw-pill p2" style="left:26%;top:58%">Selected</span>`,
  `<svg viewBox="0 0 400 210"><g>
    <rect class="hiw-tile" pathLength="1" x="14" y="26" width="176" height="160" rx="8"/><text x="30" y="50">Kickoff call</text>
    <rect class="hiw-tile" pathLength="1" x="66" y="82" width="72" height="58" rx="4"/><line class="hiw-tile" pathLength="1" x1="66" y1="98" x2="138" y2="98"/><line class="hiw-tile" pathLength="1" x1="82" y1="74" x2="82" y2="88"/><line class="hiw-tile" pathLength="1" x1="122" y1="74" x2="122" y2="88"/><circle cx="102" cy="120" r="5" fill="rgba(245,245,243,.32)"/>
    <text x="30" y="172">15 min · a person</text>
    <rect class="hiw-tile sel2" pathLength="1" x="210" y="26" width="176" height="160" rx="8"/><text x="226" y="50">Guided brief</text><text x="226" y="172">Virtue · saves as you go</text></g></svg>
    <div class="hiw-bubble" style="left:53%"><span class="who">Virtue</span><span class="t"></span></div>`,
  `<svg viewBox="0 0 400 210">${WIN(50, 30)}</svg>`,
  `<svg viewBox="0 0 400 210"><g>
    <rect class="hiw-tile d" pathLength="1" x="20" y="14" width="360" height="182" rx="8"/><line class="hiw-tile d" pathLength="1" x1="110" y1="14" x2="110" y2="196"/>
    <text x="34" y="36" class="big" style="font-size:9px">Vigil</text>
    <line class="hiw-tile d" pathLength="1" x1="34" y1="56" x2="84" y2="56"/><line class="hiw-tile d" pathLength="1" x1="34" y1="74" x2="76" y2="74"/><line class="hiw-tile d sel" pathLength="1" x1="34" y1="92" x2="92" y2="92"/><line class="hiw-tile d" pathLength="1" x1="34" y1="110" x2="70" y2="110"/><line class="hiw-tile d" pathLength="1" x1="34" y1="128" x2="80" y2="128"/>
    <text x="126" y="40">Requests</text>
    <rect class="hiw-tile d" pathLength="1" x="124" y="52" width="76" height="130" rx="4"/><rect class="hiw-tile d" pathLength="1" x="206" y="52" width="76" height="130" rx="4"/><rect class="hiw-tile d" pathLength="1" x="288" y="52" width="76" height="130" rx="4"/>
    <text class="sm" x="130" y="66">Requested</text><text class="sm" x="212" y="66">In progress</text><text class="sm" x="294" y="66">Done</text></g></svg>
    <span class="hiw-chip bad sm req" style="left:40.5%;top:46%"><i></i><b>Make the hours bigger</b></span>`,
  `<div class="hiw-glow"></div><svg viewBox="0 0 400 210">${WIN(50, 30, "lv bright", true)}
    <g class="up" opacity="0"><rect x="64" y="124" width="118" height="42" rx="6" fill="rgba(10,10,10,.9)" stroke="rgba(16,212,90,.55)"/><text class="sm" x="72" y="138">Uptime · 99.98%</text><path class="hiw-tile spark" pathLength="1" d="M72 158 L86 156 100 158 114 155 128 158 142 157 156 158 170 156 176 158" style="stroke:#10d45a;stroke-width:1.5"/></g>
    <g class="lock" opacity="0"><rect x="333" y="37" width="9" height="8" rx="2" fill="none" stroke="#10d45a" stroke-width="1.2"/><path d="M335 37 v-3 a2.5 2.5 0 0 1 5 0 v3" fill="none" stroke="#10d45a" stroke-width="1.2"/></g></svg>
    <span class="hiw-pill lp">Live</span>
    <span class="hiw-cur2 c1">${CURSOR}</span><span class="hiw-cur2 c2">${CURSOR}</span><span class="hiw-cur2 c3">${CURSOR}</span>
    <span class="hiw-chip sm n" style="left:8%;top:14%"><i></i>New lead · Priya S.</span>
    <span class="hiw-chip sm n" style="left:94%;top:30%"><i></i>Booked · Tue 10:00</span>
    <span class="hiw-chip sm n" style="left:12%;top:92%"><i></i>5★ review · Daniel K.</span>
    <span class="hiw-chip sm n" style="left:92%;top:78%"><i></i>Visits +38% this week</span>
    <span class="hiw-chip sm n" style="left:52%;top:-8%"><i></i>Ranking for “salon near me”</span>
    <span class="hiw-chip sm n" style="left:86%;top:104%"><i></i>Order · $180</span>`,
];
const VB = "I'll take it from here.";
const draw = (el: Element, q: number) => ((el as SVGElement).style.strokeDashoffset = String(1 - q));
const pop = (el: HTMLElement, u: number) => (el.style.transform = `translate(-50%,-50%) scale(${Math.max(0, u)})`);
const moveCursor = (el: Element, a: number[], b: number[], u: number) => { el.setAttribute("cx", String(a[0] + (b[0] - a[0]) * u)); el.setAttribute("cy", String(a[1] + (b[1] - a[1]) * u)); };
const ringAt = (r: Element, cx: number, cy: number, u: number) => { r.setAttribute("cx", String(cx)); r.setAttribute("cy", String(cy)); r.setAttribute("r", String(6 + 20 * u)); r.setAttribute("opacity", String(u > 0 && u < 1 ? 1 - u : 0)); };

const GOOD_NEWS = ["New lead · Priya S.", "Booked · Tue 10:00", "5★ review · Daniel K.", "Visits +38% this week", "Ranking for \u201csalon near me\u201d", "Order · $180", "New lead · Marcus T.", "Booked · Thu 2:30", "5★ review · Ana P.", "Quote request · answered", "Missed call · texted back", "Newsletter · 312 opens", "Instagram DM · answered", "Repeat customer · Leo M."];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** A spot on the ring just outside the site (in % of the scene box), so a chip never sits on the page itself. */
const ringSpot = () => {
  if (window.innerWidth < 768) return { x: rnd(22, 78), y: Math.random() < 0.5 ? rnd(-14, -2) : rnd(102, 114) }; // a phone has no room beside the site
  return Math.random() < 0.5 ? { x: Math.random() < 0.5 ? rnd(-14, 2) : rnd(98, 114), y: rnd(8, 92) } : { x: rnd(12, 88), y: Math.random() < 0.5 ? rnd(-12, -2) : rnd(102, 112) };
};

export function HowItWorksSection() {
  const root = useRef<HTMLDivElement>(null);
  const [orbState, setOrbState] = useState<AgentState>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const head = el.querySelector<HTMLElement>(".hiw-head")!, trackwrap = el.querySelector<HTMLElement>(".hiw-trackwrap")!, track = el.querySelector<HTMLElement>(".hiw-track")!;
    const lineSvg = el.querySelector<SVGSVGElement>(".hiw-line")!, lineBase = lineSvg.querySelector<SVGPathElement>(".base")!, lineDraw = lineSvg.querySelector<SVGPathElement>(".draw")!;
    const stations = [...el.querySelectorAll<HTMLElement>(".hiw-station")];
    const eyebrow = new Typer(head.querySelector(".hiw-eyebrow")!), h2 = new Typer(head.querySelector("h2")!), lead = new Typer(head.querySelector(".hiw-lead")!);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let orb: AgentState = null;
    const orbTo = (s: AgentState) => { if (s !== orb) { orb = s; setOrbState(s); } };

    // Geometry follows the viewport: station spacing, the node's height, the line through the nodes.
    let GAP = 520, NODE_Y = 278, TRACK_H = 520, ZOOM = 0.38;
    // Scene windows on the film's 0–0.9 track: on a wide screen a scene starts as its station comes in from the
    // right; on a phone the station has to be nearly centred before its scene starts, and it finishes just past
    // centre, or it would play off screen. The line is paced so it reaches each node as its scene begins.
    let WIN_START = (i: number) => i * 0.175, WIN_LEN = 0.2, LINE_A = 0.1, LINE_B = 1.143;
    const layout = () => {
      const phone = window.innerWidth < 768;
      GAP = phone ? Math.min(360, Math.round(window.innerWidth * 0.94)) : 520;
      NODE_Y = phone ? 212 : 278; TRACK_H = phone ? 400 : 520; ZOOM = phone ? 0.14 : 0.38;
      if (phone) { WIN_START = (i) => Math.max(0, i * 0.225 - 0.09); WIN_LEN = 0.15; LINE_A = 0.18; LINE_B = 0.889; }
      else { WIN_START = (i) => i * 0.175; WIN_LEN = 0.2; LINE_A = 0.1; LINE_B = 1.143; }
      const width = phone ? GAP - 24 : GAP - 80, total = 5 * GAP;
      track.style.width = `${total}px`;
      lineSvg.setAttribute("viewBox", `0 0 ${total} ${TRACK_H}`); lineSvg.style.width = `${total}px`;
      let d = `M0 ${NODE_Y} Q${GAP * 0.25} ${NODE_Y - 14} ${GAP * 0.5} ${NODE_Y}`;
      for (let i = 1; i < 5; i++) d += ` T${GAP * 0.5 + i * GAP} ${NODE_Y}`;
      d += ` T${total} ${NODE_Y}`;
      lineBase.setAttribute("d", d); lineDraw.setAttribute("d", d);
      stations.forEach((st, i) => { st.style.left = `${GAP * 0.5 + i * GAP}px`; st.style.width = `${width}px`; st.style.marginLeft = `${-width / 2}px`; });
    };
    layout();

    const lit = stations.map(() => false);
    const renderStation = (i: number, q: number, st: HTMLElement) => {
      const ill = st.querySelector<HTMLElement>(".hiw-ill")!;
      if (i === 0) {
        const pk = ill.querySelectorAll("rect.pk"), pl = ill.querySelectorAll("rect.pl");
        pk.forEach((t, k) => draw(t, ease.out(rng(q, k * 0.05, 0.22 + k * 0.05))));
        pl.forEach((t, k) => draw(t, ease.out(rng(q, 0.16 + k * 0.04, 0.36 + k * 0.04))));
        const cur = ill.querySelector(".cur")!, ring = ill.querySelector(".clickring")!;
        const m1 = ease.io(rng(q, 0.36, 0.52)), m2 = ease.io(rng(q, 0.6, 0.74));
        if (q < 0.6) moveCursor(cur, [392, 204], [68, 68], m1); else moveCursor(cur, [68, 68], [154, 166], m2);
        if (q < 0.7) ringAt(ring, 68, 68, rng(q, 0.52, 0.62)); else ringAt(ring, 154, 166, rng(q, 0.74, 0.84));
        pk[0].classList.toggle("sel", q > 0.53); pl[1].classList.toggle("sel", q > 0.75);
        ill.querySelector<HTMLElement>(".p1")!.style.transform = `scale(${Math.max(0, ease.back(rng(q, 0.54, 0.64)))})`;
        ill.querySelector<HTMLElement>(".p2")!.style.transform = `scale(${Math.max(0, ease.back(rng(q, 0.76, 0.86)))})`;
      } else if (i === 1) {
        ill.querySelectorAll(".hiw-tile").forEach((t, k) => draw(t, ease.out(rng(q, k * 0.04, 0.3 + k * 0.04))));
        ill.querySelector(".sel2")!.classList.toggle("sel", q > 0.5);
        const b = ill.querySelector<HTMLElement>(".hiw-bubble")!;
        b.style.opacity = q > 0.52 ? "1" : "0"; b.style.transform = `translateY(${6 * (1 - rng(q, 0.52, 0.6))}px)`;
        b.querySelector(".t")!.textContent = VB.slice(0, Math.round(VB.length * rng(q, 0.55, 0.85)));
        orbTo(q > 0.5 && q < 0.9 ? "talking" : q > 0.2 ? "thinking" : null);
        ill.querySelector<HTMLElement>(".hiw-orb")!.style.opacity = String(rng(q, 0.2, 0.4));
      } else if (i === 2) {
        ill.querySelectorAll(".hiw-tile.w").forEach((t, k) => draw(t, ease.out(rng(q, 0.05 + k * 0.05, 0.4 + k * 0.05))));
        ill.querySelector(".wf")!.setAttribute("opacity", String(rng(q, 0.7, 0.95)));
      } else if (i === 3) {
        ill.querySelectorAll(".hiw-tile.d").forEach((t, k) => draw(t, ease.out(rng(q, k * 0.03, 0.28 + k * 0.03))));
        const req = ill.querySelector<HTMLElement>(".req")!;
        const a = ease.back(rng(q, 0.4, 0.5)), m1 = ease.io(rng(q, 0.56, 0.66)), m2 = ease.io(rng(q, 0.72, 0.82));
        // column centres: 40.5 %, 61 %, 81.5 % of the box
        req.style.left = `${40.5 + 20.5 * m1 + 20.5 * m2}%`; pop(req, a);
        const done = q > 0.8; req.classList.toggle("bad", !done);
        req.querySelector("b")!.textContent = done ? "Done · 2 hours later" : "Make the hours bigger";
      } else {
        ill.querySelectorAll(".hiw-tile.lv").forEach((t, k) => draw(t, ease.out(rng(q, k * 0.05, 0.3 + k * 0.05))));
        ill.querySelector(".wf")!.setAttribute("opacity", String(ease.out(rng(q, 0.45, 0.7))));
        ill.querySelector<HTMLElement>(".hiw-glow")!.style.opacity = String(rng(q, 0.55, 0.8));
        ill.querySelector<HTMLElement>(".lp")!.style.transform = `translate(-50%,-50%) scale(${Math.max(0, ease.back(rng(q, 0.6, 0.72)))})`;
        ill.querySelector(".lock")!.setAttribute("opacity", String(rng(q, 0.66, 0.74)));
        ill.querySelector(".up")!.setAttribute("opacity", String(rng(q, 0.74, 0.82))); draw(ill.querySelector(".spark")!, rng(q, 0.8, 0.96));
      }
    };

    /* ---- the finale's crowd: good news pops in and out, cursors keep arriving, for as long as the zoom holds ---- */
    const finale = stations[4].querySelector<HTMLElement>(".hiw-ill")!;
    const chipEls = [...finale.querySelectorAll<HTMLElement>(".hiw-chip.n")], curEls = [...finale.querySelectorAll<HTMLElement>(".hiw-cur2")];
    type ChipFx = { phase: "in" | "hold" | "out" | "wait"; t0: number; dur: number };
    type CurFx = { phase: "fly" | "click" | "leave" | "wait"; t0: number; dur: number; from: { x: number; y: number }; to: { x: number; y: number } };
    const chipFx: ChipFx[] = chipEls.map((_, k) => ({ phase: "wait", t0: -1, dur: 300 + k * 260 }));
    const curFx: CurFx[] = curEls.map((_, k) => ({ phase: "wait", t0: -1, dur: 400 + k * 700, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const edgeSpot = () => (Math.random() < 0.5 ? { x: Math.random() < 0.5 ? -8 : 104, y: rnd(0, 100) } : { x: rnd(0, 100), y: Math.random() < 0.5 ? -10 : 110 });
    const clickSpot = () => ({ x: rnd(22, 72), y: rnd(26, 72) });
    let fxRaf = 0, fxOn = false;
    const fxFrame = (now: number) => {
      fxRaf = 0;
      if (!fxOn) return;
      chipFx.forEach((c, k) => {
        if (c.t0 < 0) c.t0 = now;
        const u = clamp((now - c.t0) / c.dur, 0, 1), elc = chipEls[k];
        if (c.phase === "in") pop(elc, ease.back(u));
        else if (c.phase === "out") pop(elc, 1 - ease.out(u));
        if (u >= 1) {
          c.t0 = now;
          if (c.phase === "wait") { const s = ringSpot(); elc.style.left = `${s.x}%`; elc.style.top = `${s.y}%`; elc.lastChild!.textContent = GOOD_NEWS[Math.floor(Math.random() * GOOD_NEWS.length)]; c.phase = "in"; c.dur = 380; }
          else if (c.phase === "in") { c.phase = "hold"; c.dur = rnd(1500, 2600); }
          else if (c.phase === "hold") { c.phase = "out"; c.dur = 260; }
          else { c.phase = "wait"; c.dur = rnd(300, 900); }
        }
      });
      curFx.forEach((c, k) => {
        if (c.t0 < 0) c.t0 = now;
        const u = clamp((now - c.t0) / c.dur, 0, 1), elc = curEls[k], ring = elc.querySelector<HTMLElement>(".cr")!;
        if (c.phase === "fly" || c.phase === "leave") { const m = ease.io(u); elc.style.left = `${c.from.x + (c.to.x - c.from.x) * m}%`; elc.style.top = `${c.from.y + (c.to.y - c.from.y) * m}%`; elc.style.opacity = c.phase === "fly" ? "1" : String(1 - u); }
        if (c.phase === "click") { ring.style.opacity = String(1 - u); ring.style.transform = `scale(${1 + 2.5 * u})`; } else ring.style.opacity = "0";
        if (u >= 1) {
          c.t0 = now;
          if (c.phase === "wait") { c.from = edgeSpot(); c.to = clickSpot(); elc.style.opacity = "1"; c.phase = "fly"; c.dur = rnd(650, 900); }
          else if (c.phase === "fly") { c.phase = "click"; c.dur = 420; }
          else if (c.phase === "click") { c.from = c.to; c.to = edgeSpot(); c.phase = "leave"; c.dur = 520; }
          else { c.phase = "wait"; c.dur = rnd(300, 1100); }
        }
      });
      fxRaf = requestAnimationFrame(fxFrame);
    };
    const fxStart = () => { if (!fxOn) { fxOn = true; fxRaf = requestAnimationFrame(fxFrame); } };
    const fxStop = () => { fxOn = false; cancelAnimationFrame(fxRaf); fxRaf = 0; chipFx.forEach((c) => { c.phase = "wait"; c.t0 = -1; }); curFx.forEach((c) => { c.phase = "wait"; c.t0 = -1; }); chipEls.forEach((c) => pop(c, 0)); curEls.forEach((c) => (c.style.opacity = "0")); };

    const render = (p: number) => {
      // the header types itself once the hero is clear
      const t = rng(p, PHASE.head[0], PHASE.head[1]);
      el.style.opacity = p > PHASE.head[0] - 0.02 ? "1" : "0"; el.style.pointerEvents = p > PHASE.head[0] ? "auto" : "none";
      const a = rng(t, 0, 0.14), b = rng(t, 0.12, 0.72), c = rng(t, 0.7, 1);
      eyebrow.set(eyebrow.full.length * a, a > 0 && a < 1); h2.set(h2.full.length * b, b > 0 && b < 1); lead.set(lead.full.length * c, c > 0 && c < 1);
      // then the timeline ravels in and the visitor scrolls it along; the line reaches each node exactly as its scene begins
      const ravel = rng(p, PHASE.ravel[0], PHASE.ravel[1]), pf = rng(p, PHASE.film[0], PHASE.film[1]);
      trackwrap.style.opacity = String(ravel);
      track.style.transform = `translateX(${window.innerWidth / 2 - GAP / 2 - (4 * GAP * Math.min(pf, 0.9)) / 0.9}px)`;
      const drawn = clamp(ravel * LINE_A + pf * LINE_B, 0, 1);
      lineDraw.style.strokeDashoffset = String(1 - drawn);
      const z = ease.io(rng(pf, 0.84, 1));
      stations.forEach((st, i) => {
        const on = drawn >= (0.5 + i) / 5;
        if (on !== lit[i]) {
          lit[i] = on; st.classList.toggle("on", on);
          const pulse = st.querySelector<HTMLElement>(".hiw-pulse")!; pulse.classList.remove("go"); if (on && !reduced) { void pulse.offsetWidth; pulse.classList.add("go"); }
        }
        renderStation(i, clamp((pf - WIN_START(i)) / WIN_LEN, 0, 1), st);
        const last = i === 4; st.style.transform = `scale(${last ? 1 + ZOOM * z : 1 - 0.22 * z})`; st.style.opacity = String(last ? 1 : 1 - 0.7 * z);
      });
      lineSvg.style.opacity = String(1 - 0.6 * z);
      head.style.opacity = String(1 - 0.85 * z); head.style.transform = `translateY(${-24 * z}px)`;
      if (z > 0.05 && !reduced) fxStart(); else if (fxOn) fxStop();
    };

    let raf = 0, last = 0;
    const paint = () => { raf = 0; render(last); };
    const unsubscribe = subscribeStory((p) => { last = p; if (!raf) raf = requestAnimationFrame(paint); });
    const onResize = () => { layout(); if (!raf) raf = requestAnimationFrame(paint); };
    window.addEventListener("resize", onResize);
    const onVisibility = () => { if (document.hidden) fxStop(); else if (!raf) raf = requestAnimationFrame(paint); };
    document.addEventListener("visibilitychange", onVisibility);
    paint();
    return () => { cancelAnimationFrame(raf); fxStop(); unsubscribe(); window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  return (
    <div ref={root} className="hiw absolute inset-0 z-[1] text-[#f5f5f3] opacity-0" style={{ pointerEvents: "none" }}>
      <div className="hiw-head">
        <p className="hiw-eyebrow story-typing-pending" data-text={HOW_IT_WORKS_HEAD.eyebrow}>{HOW_IT_WORKS_HEAD.eyebrow}</p>
        <h2 className="story-typing-pending" data-text={HOW_IT_WORKS_HEAD.title}>{HOW_IT_WORKS_HEAD.title}</h2>
        <p className="hiw-lead story-typing-pending" data-text={HOW_IT_WORKS_HEAD.lead}>{HOW_IT_WORKS_HEAD.lead}</p>
      </div>
      <div className="hiw-trackwrap">
        <div className="hiw-track">
          <svg className="hiw-line" viewBox="0 0 2600 520" preserveAspectRatio="none" aria-hidden>
            <path className="base" d="M0 278 Q130 264 260 278 T780 278 T1300 278 T1820 278 T2340 278 T2600 278" />
            <path className="draw" pathLength="1" d="M0 278 Q130 264 260 278 T780 278 T1300 278 T1820 278 T2340 278 T2600 278" />
          </svg>
          <ol className="contents">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.n} className="hiw-station" style={{ left: `${260 + i * 520}px` }}>
                <div className="hiw-ill" aria-hidden>
                  <div className="contents" dangerouslySetInnerHTML={{ __html: SCENES[i] }} />
                  {i === 1 ? (
                    <div className="hiw-orb" style={{ left: "62.5%", top: "27%", width: "24%", opacity: 0 }}>
                      <Orb agentState={orbState} seed={7} className="absolute inset-0" />
                    </div>
                  ) : null}
                </div>
                <span className="hiw-node" aria-hidden />
                <span className="hiw-pulse" aria-hidden />
                <div className="hiw-card">
                  <div className="k">
                    Step 0{step.n} · <b>{step.who}</b>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
