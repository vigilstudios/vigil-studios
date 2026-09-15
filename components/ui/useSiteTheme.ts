"use client";

import { useSyncExternalStore } from "react";

export type SiteTheme = "dark" | "light";

/**
 * The site's theme is whatever `data-theme` on <html> says (ThemeToggle
 * writes it, the bootstrap script sets it before hydration). Components
 * read it through this store instead of copying it into state in effects.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
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
