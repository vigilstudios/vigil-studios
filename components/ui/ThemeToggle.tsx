"use client";

import { Moon, Sun } from "lucide-react";
import { setSiteTheme, useSiteTheme } from "./useSiteTheme";

/** A small outlined control in the navbar's quiet, monochrome HUD style. */
export function ThemeToggle() {
  const theme = useSiteTheme();
  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={() => setSiteTheme(theme === "dark" ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[color:var(--border)] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-surface-soft)] hover:text-[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]"
    >
      {theme === "dark" ? <Sun size={14} aria-hidden /> : <Moon size={14} aria-hidden />}
    </button>
  );
}
