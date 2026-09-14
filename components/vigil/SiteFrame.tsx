"use client";

import { useState, useSyncExternalStore } from "react";
import { clsx } from "clsx";
import { Monitor, Smartphone } from "lucide-react";

/**
 * A live preview of a website, the same way the Express catalogue shows a
 * template: the real page in an iframe at a true viewport width, scaled to
 * fit the card, inside a small browser chrome. The page keeps its own layout
 * and scrolls itself, so nothing is stretched.
 */
const DESKTOP = { width: 1200, height: 750 };
const MOBILE = { width: 390, height: 780 };

export type ViewMode = "desktop" | "mobile";

export function SiteFrame({
  src,
  title,
  address,
  initialMode = "desktop",
  className,
}: {
  src: string;
  title: string;
  /** Text shown in the address bar; defaults to the hostname of src. */
  address?: string;
  initialMode?: ViewMode;
  className?: string;
}) {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const width = useElementWidth(host);

  // The card's aspect follows the desktop viewport; the phone is centred in
  // the same box so switching modes never changes the card height.
  const boxHeight = width > 0 ? Math.round((width * DESKTOP.height) / DESKTOP.width) : 0;
  const frame = mode === "desktop" ? DESKTOP : MOBILE;
  const scale = width > 0 ? (mode === "desktop" ? width / DESKTOP.width : Math.min(boxHeight / MOBILE.height, width / MOBILE.width)) : 0;
  const shown = { width: Math.round(frame.width * scale), height: Math.round(frame.height * scale) };

  let hostname = address ?? "";
  if (!address) {
    try {
      hostname = new URL(src, "http://localhost").hostname;
    } catch {
      hostname = src;
    }
  }

  return (
    <div className={clsx("overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-secondary)]", className)}>
      <div className="flex h-8 items-center gap-2 border-b border-[color:var(--border)] px-2.5">
        <span className="flex gap-1" aria-hidden>
          <i className="h-2 w-2 rounded-full bg-[color:var(--border)]" />
          <i className="h-2 w-2 rounded-full bg-[color:var(--border)]" />
          <i className="h-2 w-2 rounded-full bg-[color:var(--border)]" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded bg-[color:var(--bg-surface-soft)] px-2 py-0.5 text-center font-mono text-[10px] text-[color:var(--text-secondary)]">{hostname}</span>
        <div className="flex gap-0.5" role="group" aria-label="Preview viewport">
          <ModeButton active={mode === "desktop"} onClick={() => setMode("desktop")} label={`Desktop, ${DESKTOP.width} px`}>
            <Monitor className="h-3.5 w-3.5" />
          </ModeButton>
          <ModeButton active={mode === "mobile"} onClick={() => setMode("mobile")} label={`Phone, ${MOBILE.width} px`}>
            <Smartphone className="h-3.5 w-3.5" />
          </ModeButton>
        </div>
      </div>

      <div ref={setHost} className="relative w-full bg-[#0b0b0b]" style={{ height: boxHeight || undefined, aspectRatio: boxHeight ? undefined : `${DESKTOP.width} / ${DESKTOP.height}` }}>
        {scale > 0 ? (
          <div
            className={clsx("absolute overflow-hidden bg-white", mode === "mobile" && "rounded-[14px] border border-[color:var(--border)] shadow-2xl")}
            style={{ width: shown.width, height: shown.height, left: (width - shown.width) / 2, top: (boxHeight - shown.height) / 2 }}
          >
            {/* Clipping without a scroll container: the page scrolls inside its own iframe. */}
            <iframe
              key={mode}
              src={src}
              title={title}
              tabIndex={-1}
              loading="lazy"
              style={{ width: frame.width, height: frame.height, transform: `scale(${scale})`, transformOrigin: "top left", border: 0, display: "block", background: "#fff" }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex h-6 w-6 items-center justify-center rounded",
        active ? "bg-[color:var(--bg-surface-soft)] text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
      )}
    >
      {children}
    </button>
  );
}

/** Width of an element, tracked with ResizeObserver; 0 before mount. */
function useElementWidth(el: HTMLElement | null): number {
  return useSyncExternalStore(
    (onChange) => {
      if (!el) return () => {};
      const ro = new ResizeObserver(onChange);
      ro.observe(el);
      return () => ro.disconnect();
    },
    () => (el ? Math.round(el.getBoundingClientRect().width) : 0),
    () => 0
  );
}
