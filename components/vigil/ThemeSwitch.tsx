"use client";

import { Moon, Sun } from "lucide-react";
import { clsx } from "clsx";
import { setSiteTheme, useSiteTheme } from "@/components/ui/useSiteTheme";

/** Compact theme toggle for the product frame; same storage key as the marketing site. */
export function ThemeSwitch({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const theme = useSiteTheme();
  const toggle = () => setSiteTheme(theme === "dark" ? "light" : "dark");

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
