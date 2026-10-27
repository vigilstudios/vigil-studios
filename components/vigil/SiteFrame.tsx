"use client";

import { useState, type CSSProperties } from "react";
import { clsx } from "clsx";
import { Monitor, Smartphone } from "lucide-react";
import { useElementBox } from "./useElementBox";

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
  desktopHeight = DESKTOP.height,
}: {
  src: string;
  title: string;
  /** Text shown in the address bar; defaults to the hostname of src. */
  address?: string;
  initialMode?: ViewMode;
  className?: string;
  /** Virtual desktop viewport height; other previews retain the full default height. */
  desktopHeight?: number;
}) {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [browser, setBrowser] = useState<HTMLDivElement | null>(null);
  const [page, setPage] = useState<HTMLIFrameElement | null>(null);
  const { width } = useElementBox(host, "width");
  const displayed = useElementBox(browser, "width");
  const viewport = useElementBox(page);

  const frameWidth = mode === "desktop" ? DESKTOP.width : MOBILE.width;
  // The outer browser includes its two one-pixel borders.
  const shownWidth = browser
    ? displayed.width
    : Math.max(0, Math.min(width, frameWidth) - 2);
  const frame =
    mode === "desktop" ? { ...DESKTOP, height: desktopHeight } : MOBILE;
  // During a mode transition both the browser and the real iframe viewport
  // animate. Fit their current dimensions uniformly, without stretching or reloading.
  const scale = shownWidth / (viewport.width || frame.width);
  const boxHeight =
    width > 0 ? Math.round((viewport.height || frame.height) * scale) : 0;

  let hostname = address ?? "";
  if (!address) {
    try {
      hostname = new URL(src, "http://localhost").hostname;
    } catch {
      hostname = src;
    }
  }

  return (
    <div
      ref={setHost}
      className="w-full min-w-0"
      data-viewport={mode}
      style={
        { "--site-preview-ratio": frame.width / frame.height } as CSSProperties
      }
    >
      <div
        ref={setBrowser}
        className={clsx(
          "site-preview-frame mx-auto w-full overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-secondary)]",
          className,
        )}
        data-viewport={mode}
        style={{ maxWidth: mode === "mobile" ? MOBILE.width : DESKTOP.width }}
      >
        <div className="flex h-8 items-center gap-2 border-b border-[color:var(--border)] px-2.5">
          <span className="flex gap-1" aria-hidden>
            <i className="h-2 w-2 rounded-full bg-[color:var(--border)]" />
            <i className="h-2 w-2 rounded-full bg-[color:var(--border)]" />
            <i className="h-2 w-2 rounded-full bg-[color:var(--border)]" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded bg-[color:var(--bg-surface-soft)] px-2 py-0.5 text-center font-mono text-[10px] text-[color:var(--text-secondary)]">
            {hostname}
          </span>
          <div
            className="flex gap-0.5"
            role="group"
            aria-label="Preview viewport"
          >
            <ModeButton
              active={mode === "desktop"}
              onClick={() => setMode("desktop")}
              label={`Desktop, ${DESKTOP.width} px`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </ModeButton>
            <ModeButton
              active={mode === "mobile"}
              onClick={() => setMode("mobile")}
              label={`Phone, ${MOBILE.width} px`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </ModeButton>
          </div>
        </div>

        <div
          className="site-preview-viewport relative w-full bg-[color:var(--bg-primary)]"
          style={{
            height: boxHeight || undefined,
            aspectRatio: boxHeight
              ? undefined
              : `${frame.width} / ${frame.height}`,
          }}
        >
          {width > 0 ? (
            <div className="absolute inset-0 overflow-hidden bg-white">
              {/* Clipping without a scroll container: the page scrolls inside its own iframe. */}
              <iframe
                ref={setPage}
                className="site-preview-page"
                src={src}
                title={title}
                tabIndex={-1}
                loading="lazy"
                style={{
                  width: frame.width,
                  height: frame.height,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  border: 0,
                  display: "block",
                  background: "#fff",
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex h-6 w-6 items-center justify-center rounded",
        active
          ? "bg-[color:var(--bg-surface-soft)] text-[color:var(--text-primary)]"
          : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]",
      )}
    >
      {children}
    </button>
  );
}
