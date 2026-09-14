"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { clsx } from "clsx";

type Theme = "dark" | "light";
const STORAGE_KEY = "site-theme"; // shared with the marketing site's toggle

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent("site-theme-change", { detail: theme }));
}

// The document's data-theme attribute is the source of truth (set by the
// bootstrap script before paint, and by either toggle afterwards).
const subscribe = (onChange: () => void) => {
  window.addEventListener("site-theme-change", onChange);
  return () => window.removeEventListener("site-theme-change", onChange);
};
const getTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getServerTheme = (): Theme => "dark";

/** Compact theme toggle for the product frame; same storage key as the marketing site. */
export function ThemeSwitch({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={clsx(
        "inline-flex h-8 items-center gap-2 rounded-md px-2 text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)] hover:text-[color:var(--text-primary)]",
        className
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel ? <span className="text-xs">{theme === "dark" ? "Light" : "Dark"}</span> : null}
    </button>
  );
}

/** Inline bootstrap: applies the saved theme before first paint to avoid a flash. */
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(!t){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){}})();`;
