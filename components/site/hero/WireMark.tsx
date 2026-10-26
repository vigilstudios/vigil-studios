"use client";

import { useEffect, useRef } from "react";
import { WIRE_EDGES, wireRotation, projectWireVertex } from "./wire-geometry";
import { InitialPaintScript } from "./InitialPaintScript";
import { WIRE_BOOTSTRAP } from "./wire-bootstrap";
import { cursor, startCursor, tickCursor } from "./cursor";
import { watchCovered } from "./covered";
import { PHASE, rng, subscribeStory } from "@/components/site/story/progress";

/**
 * The V* mark in three dimensions, projected onto a 2D canvas as edges only: the V and the
 * eight-point star straight from the logo's SVG, extruded, no faces. It
 * turns once every ~29 s with a slow nod, leans toward the pointer, and
 * pauses when the hero is covered by the page, off screen or in a hidden
 * tab. As the visitor scrolls into the story it unravels: it spins loose
 * while every edge flies off along its own line and the lines fade. Under
 * reduced motion it renders one still frame; without canvas the flat
 * outline shows.
 */
const STAR_POINTS =
  "488.85 412.76 448.48 412.8 449.91 377.59 419.48 396.62 399.29 361.38 430.03 344.52 399.28 328.33 419.47 292.72 449.93 312.15 448.48 276.64 488.86 276.63 487.78 311.79 517.86 292.74 538.42 328.36 507.26 344.48 538.44 361.37 517.86 396.65 487.77 377.93";
const V_PATH =
  "M292.1,130.44L339.48.04l132.2-.04-175.39,420.45h-121.71S.46,1.1.46,1.1L0,.22C-.06.08.56.01.99.01l131.87.02,47.56,132.07,55.75,142.59,55.93-144.26Z";
const WIDTH = 5.38,
  CAMERA_Z = 16,
  FOV = 30;

/**
 * `size` is the mark's share of the container's width, `lift` how far above
 * centre it sits (world units; the visible height is ~8.6), and `story`
 * whether it takes part in the home page story (unravelling on scroll).
 */
export function WireMark({
  className,
  size = { desktop: 0.34, phone: 0.7 },
  lift = { desktop: 0.9, phone: 0.7 },
  story = true,
}: {
  className?: string;
  size?: { desktop: number; phone: number };
  lift?: { desktop: number; phone: number };
  story?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      canvas.hidden = true;
      fallbackRef.current?.removeAttribute("hidden");
      return;
    }
    canvas.dataset.wireOwner = "react";
    if (canvas.dataset.wireStart) {
      cursor.x = Number(canvas.dataset.wireX || 0);
      cursor.y = Number(canvas.dataset.wireY || 0);
      cursor.tx = Number(canvas.dataset.wireTx || 0);
      cursor.ty = Number(canvas.dataset.wireTy || 0);
    }
    startCursor();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // These are the exact edges from the original ExtrudeGeometry + EdgesGeometry.
    // Only the renderer changes: the camera, Euler rotation and breakup stay the same.
    const parts = WIRE_EDGES.map((vertices) => {
      const base = Float32Array.from(vertices),
        pos = Float32Array.from(vertices);
      const n = base.length / 6,
        dirs = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const th = Math.random() * Math.PI * 2,
          ph = Math.acos(2 * Math.random() - 1),
          r = 3 + Math.random() * 7;
        dirs[i * 3] = Math.sin(ph) * Math.cos(th) * r;
        dirs[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r;
        dirs[i * 3 + 2] = Math.cos(ph) * r;
      }
      return { pos, base, dirs, n };
    });
    let exitU = 0,
      appliedU = -1;
    const applyExit = () => {
      if (exitU === appliedU) return;
      appliedU = exitU;
      const k = exitU * exitU;
      for (const { pos: a, base, dirs, n } of parts) {
        for (let i = 0; i < n; i++)
          for (let v = 0; v < 2; v++) {
            const o = (i * 2 + v) * 3;
            a[o] = base[o] + dirs[i * 3] * k;
            a[o + 1] = base[o + 1] + dirs[i * 3 + 1] * k;
            a[o + 2] = base[o + 2] + dirs[i * 3 + 2] * k;
          }
      }
    };
    let baseY = 0.9,
      scale = 1,
      w = 1,
      h = 1,
      dpr = 1;
    const fit = () => {
      w = canvas.clientWidth || 1;
      h = canvas.clientHeight || 1;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(w * dpr),
        ph = Math.round(h * dpr);
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const phone = w < 760;
      const visibleWidth =
        (2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360) * w) / h;
      scale = (visibleWidth * (phone ? size.phone : size.desktop)) / WIDTH;
      baseY = phone ? lift.phone : lift.desktop;
    };
    fit();

    let ink = getComputedStyle(document.documentElement).getPropertyValue("--scene-ink-rgb").trim();
    let raf = 0,
      visible = false,
      hidden = document.hidden,
      covered = false;
    const t0 = Number(canvas.dataset.wireStart) || performance.now();
    const frame = (now: number) => {
      raf = 0;
      if (!visible || hidden || covered) return;
      tickCursor(now);
      const t = (now - t0) / 1000;
      const rotation = wireRotation(
        (reduced ? 0.1 : 0.1 + Math.sin(t * 0.35) * 0.08) + cursor.y * 0.14,
        (reduced ? -0.4 : t * 0.22) + cursor.x * 0.22 + exitU * 2.4,
        exitU * 0.5,
      );
      applyExit();
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(${ink},${0.9 * (1 - exitU)})`;
      // WebGL LineBasicMaterial used one physical pixel, including on Retina.
      ctx.lineWidth = 1 / dpr;
      const focal = h / (2 * Math.tan((FOV * Math.PI) / 360));
      for (const { pos, n } of parts) {
        for (let i = 0; i < n; i++) {
          const a = projectWireVertex(
            pos,
            i * 6,
            rotation,
            scale,
            cursor.x * 0.18,
            baseY - cursor.y * 0.12,
            w,
            h,
            focal,
          );
          const b = projectWireVertex(
            pos,
            i * 6 + 3,
            rotation,
            scale,
            cursor.x * 0.18,
            baseY - cursor.y * 0.12,
            w,
            h,
            focal,
          );
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        }
      }
      // Fully disintegrated, there is nothing to animate until the visitor scrolls back up.
      if (!reduced && exitU < 1) raf = requestAnimationFrame(frame);
    };
    const loop = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loop();
    });
    io.observe(canvas);
    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden) loop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const ro = new ResizeObserver(() => {
      fit();
      loop();
    });
    ro.observe(canvas);
    const unwatch = watchCovered(canvas, (c) => {
      covered = c;
      if (!c) loop();
    });
    const unsubscribe = story
      ? subscribeStory((p) => {
          const u = rng(p, PHASE.markExit[0], PHASE.markExit[1]);
          if (u !== exitU) {
            exitU = u;
            loop();
          }
        })
      : () => {};
    const themeObserver = new MutationObserver(() => {
      ink = getComputedStyle(document.documentElement).getPropertyValue("--scene-ink-rgb").trim();
      loop();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    loop();

    return () => {
      themeObserver.disconnect();
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      unwatch();
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      ctx.clearRect(0, 0, w, h);
    };
  }, [size.desktop, size.phone, lift.desktop, lift.phone, story]);

  return (
    <>
      <canvas
        ref={ref}
        id={story ? "hero-wire" : undefined}
        data-size-desktop={size.desktop}
        data-size-phone={size.phone}
        data-lift-desktop={lift.desktop}
        data-lift-phone={lift.phone}
        suppressHydrationWarning
        className={className}
        aria-hidden
      />
      <svg
        ref={fallbackRef}
        {...{ hidden: true }}
        viewBox="0 0 538.44 420.45"
        className="pointer-events-none absolute left-1/2 top-[40%] w-[70vw] -translate-x-1/2 -translate-y-1/2 md:w-[34vw]"
        aria-hidden
      >
        <path d={V_PATH} fill="none" stroke="var(--text-primary)" strokeWidth="3" />
        <polygon
          points={STAR_POINTS}
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="3"
        />
      </svg>
      {story ? <InitialPaintScript html={WIRE_BOOTSTRAP} /> : null}
    </>
  );
}
