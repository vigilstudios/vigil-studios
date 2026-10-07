"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Keep the live design mounted while a separate, non-interactive audition is visible. */
export function PreviewCanvas({ authored, audition }: { authored: ReactNode; audition?: ReactNode }) {
  const live = useRef<HTMLDivElement>(null);
  const auditioning = useRef(false);
  const position = useRef({ top: 0, left: 0 });
  useLayoutEffect(() => {
    const canvas = live.current?.closest<HTMLElement>(".lab-editor-canvas");
    if (!canvas) return;
    const remember = () => {
      if (!auditioning.current) position.current = { top: canvas.scrollTop, left: canvas.scrollLeft };
    };
    remember();
    canvas.addEventListener("scroll", remember, { passive: true });
    return () => canvas.removeEventListener("scroll", remember);
  }, []);
  const active = Boolean(audition);
  useLayoutEffect(() => {
    const canvas = live.current?.closest<HTMLElement>(".lab-editor-canvas");
    if (active) { auditioning.current = true; return; }
    if (!auditioning.current || !canvas) return;
    const board = live.current?.closest<HTMLElement>(".lab-artboard");
    const reserve = live.current?.closest<HTMLElement>(".lab-artboard-size");
    const restore = () => {
      canvas.scrollTo({ top: position.current.top, left: position.current.left, behavior: "instant" });
      auditioning.current = false;
    };
    // The editor reserves scaled height asynchronously; wait before restoring a position
    // that a shorter audition temporarily clamped out of the canvas's scroll range.
    if (!board || !reserve || Math.abs(reserve.offsetHeight - board.getBoundingClientRect().height) < 2) { restore(); return; }
    const observer = new ResizeObserver(() => {
      if (Math.abs(reserve.offsetHeight - board.getBoundingClientRect().height) < 2) { restore(); observer.disconnect(); }
    });
    observer.observe(board);
    observer.observe(reserve);
    return () => observer.disconnect();
  }, [active]);
  return <>
    <div ref={live} data-lab-canvas="authored" hidden={active}>{authored}</div>
    {audition && <div data-lab-canvas="audition" inert>{audition}</div>}
  </>;
}
