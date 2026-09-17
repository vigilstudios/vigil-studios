"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cursor, startCursor, tickCursor } from "./cursor";

/**
 * The V* mark in three dimensions, drawn as edges only: the V and the
 * eight-point star straight from the logo's SVG, extruded, no faces. It
 * turns once every ~29 s with a slow nod, leans toward the pointer, and
 * pauses when the hero is off screen or the tab is hidden. Under reduced
 * motion it renders one still frame; without WebGL the flat outline shows.
 */
const V: [number, number][] = [[292.1, 130.44], [339.48, 0.04], [471.68, 0], [296.29, 420.45], [174.58, 420.45], [0.5, 0.5], [132.86, 0.03], [180.42, 132.1], [236.17, 274.69]];
const STAR_POINTS = "488.85 412.76 448.48 412.8 449.91 377.59 419.48 396.62 399.29 361.38 430.03 344.52 399.28 328.33 419.47 292.72 449.93 312.15 448.48 276.64 488.86 276.63 487.78 311.79 517.86 292.74 538.42 328.36 507.26 344.48 538.44 361.37 517.86 396.65 487.77 377.93";
const STAR: [number, number][] = (() => {
  const n = STAR_POINTS.split(" ").map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
})();
const V_PATH = "M292.1,130.44L339.48.04l132.2-.04-175.39,420.45h-121.71S.46,1.1.46,1.1L0,.22C-.06.08.56.01.99.01l131.87.02,47.56,132.07,55.75,142.59,55.93-144.26Z";
const CX = 538.44 / 2, CY = 420.45 / 2, UNIT = 1 / 100, WIDTH = 5.38, DEPTH = 0.95, CAMERA_Z = 16, FOV = 30;

export function WireMark({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      // No WebGL: show the flat outline in the same place instead.
      canvas.hidden = true;
      fallbackRef.current?.removeAttribute("hidden");
      return;
    }
    startCursor();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const shapeFrom = (pts: [number, number][]) => {
      const s = new THREE.Shape();
      pts.forEach(([x, y], i) => (i ? s.lineTo((x - CX) * UNIT, -(y - CY) * UNIT) : s.moveTo((x - CX) * UNIT, -(y - CY) * UNIT)));
      s.closePath();
      return s;
    };
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const geometries: THREE.BufferGeometry[] = [];
    const group = new THREE.Group();
    for (const pts of [V, STAR]) {
      const solid = new THREE.ExtrudeGeometry(shapeFrom(pts), { depth: DEPTH, bevelEnabled: false, curveSegments: 1 });
      solid.translate(0, 0, -DEPTH / 2);
      const edges = new THREE.EdgesGeometry(solid, 20);
      solid.dispose();
      geometries.push(edges);
      group.add(new THREE.LineSegments(edges, material));
    }
    const scene = new THREE.Scene();
    scene.add(group);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, CAMERA_Z);

    let baseY = 0.9;
    const fit = () => {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // ~34 % of the hero's width on desktop, ~70 % on a phone, sitting a little above centre so the words fit under it
      const phone = w < 760;
      const visibleWidth = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camera.aspect;
      group.scale.setScalar((visibleWidth * (phone ? 0.7 : 0.34)) / WIDTH);
      baseY = phone ? 0.7 : 0.9;
      group.position.y = baseY;
    };
    fit();

    let raf = 0, visible = true, hidden = document.hidden;
    const t0 = performance.now();
    const frame = (now: number) => {
      raf = 0;
      if (!visible || hidden) return;
      tickCursor(now);
      const t = (now - t0) / 1000;
      group.rotation.y = (reduced ? -0.4 : t * 0.22) + cursor.x * 0.22; // one turn every ~29 s, plus a lean toward the pointer
      group.rotation.x = (reduced ? 0.1 : 0.1 + Math.sin(t * 0.35) * 0.08) + cursor.y * 0.14;
      group.position.x = cursor.x * 0.18;
      group.position.y = baseY - cursor.y * 0.12;
      renderer.render(scene, camera);
      if (!reduced) raf = requestAnimationFrame(frame);
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
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      geometries.forEach((g) => g.dispose());
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className={className} aria-hidden />
      <svg ref={fallbackRef} {...{ hidden: true }} viewBox="0 0 538.44 420.45" className="pointer-events-none absolute left-1/2 top-[40%] w-[70vw] -translate-x-1/2 -translate-y-1/2 md:w-[34vw]" aria-hidden>
        <path d={V_PATH} fill="none" stroke="#f5f5f3" strokeWidth="3" />
        <polygon points={STAR_POINTS} fill="none" stroke="#f5f5f3" strokeWidth="3" />
      </svg>
    </>
  );
}
