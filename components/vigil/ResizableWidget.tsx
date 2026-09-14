"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { clsx } from "clsx";

/**
 * A widget the viewer can resize by dragging its right edge (or with the
 * arrow keys on the handle). The chosen width is remembered per `storageKey`
 * in localStorage; under `sm` it is always full width and the handle hides.
 */
export function ResizableWidget({
  storageKey,
  defaultWidth,
  minWidth = 320,
  children,
  className,
}: {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  children: ReactNode;
  className?: string;
}) {
  const [width, setWidth] = useState<number>(defaultWidth);
  const [dragging, setDragging] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const isSmall = useMediaQuery("(max-width: 639px)");

  // Restore the remembered width after mount (never on the server).
  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(`vigil-widget:${storageKey}`));
      if (Number.isFinite(saved) && saved >= minWidth) {
        // Deferred to avoid a synchronous setState inside the effect body.
        const id = window.requestAnimationFrame(() => setWidth(saved));
        return () => window.cancelAnimationFrame(id);
      }
    } catch {
      /* storage unavailable */
    }
  }, [storageKey, minWidth]);

  const clamp = useCallback(
    (w: number) => {
      const max = hostRef.current?.parentElement?.getBoundingClientRect().width ?? Infinity;
      return Math.round(Math.max(minWidth, Math.min(max, w)));
    },
    [minWidth]
  );

  const persist = useCallback(
    (w: number) => {
      try {
        window.localStorage.setItem(`vigil-widget:${storageKey}`, String(w));
      } catch {
        /* storage unavailable */
      }
    },
    [storageKey]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = hostRef.current?.getBoundingClientRect().width ?? width;
    setDragging(true);
    const move = (ev: PointerEvent) => setWidth(clamp(startW + (ev.clientX - startX)));
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragging(false);
      persist(clamp(startW + (ev.clientX - startX)));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 80 : 24;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = clamp(width + (e.key === "ArrowRight" ? step : -step));
      setWidth(next);
      persist(next);
    }
  };

  return (
    <div
      ref={hostRef}
      className={clsx("relative max-w-full", dragging && "select-none", className)}
      style={isSmall ? undefined : { width }}
    >
      {children}
      {!isSmall ? (
        <button
          type="button"
          aria-label="Resize preview"
          title="Drag to resize"
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          className={clsx(
            "absolute -right-2 top-1/2 h-12 w-4 -translate-y-1/2 cursor-col-resize rounded-full",
            "flex items-center justify-center text-[color:var(--text-secondary)] opacity-60 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          )}
        >
          <span className="h-8 w-1 rounded-full bg-current" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
