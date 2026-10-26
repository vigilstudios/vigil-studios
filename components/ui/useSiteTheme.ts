"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type SiteTheme } from "@/lib/site-theme";

export type { SiteTheme } from "@/lib/site-theme";

function savedTheme(): SiteTheme | null {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

/** CSS owns the palette. Toggles only select and persist a theme. */
export function setSiteTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Theme switching still works when storage is unavailable. */
  }
  window.dispatchEvent(new CustomEvent("site-theme-change", { detail: theme }));
}

function subscribe(onChange: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(onChange);
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  const system = window.matchMedia("(prefers-color-scheme: light)");
  const syncPreference = () => {
    root.dataset.theme = savedTheme() ?? (system.matches ? "light" : "dark");
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) syncPreference();
  };
  system.addEventListener("change", syncPreference);
  window.addEventListener("storage", onStorage);
  return () => {
    observer.disconnect();
    system.removeEventListener("change", syncPreference);
    window.removeEventListener("storage", onStorage);
  };
}

const read = (): SiteTheme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

export function useSiteTheme(): SiteTheme {
  return useSyncExternalStore(subscribe, read, () => "dark");
}

/** true after hydration; false during SSR and the first client render. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
