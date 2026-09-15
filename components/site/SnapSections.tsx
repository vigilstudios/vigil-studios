"use client";

import { useEffect } from "react";

/**
 * Turns on the desktop scroll snap for the page that renders it (the home
 * page, where every section is a full viewport). The scroll container is
 * the layout's <main>, so the page flags it rather than styling itself.
 */
export function SnapSections() {
  useEffect(() => {
    const main = document.getElementById("site-root");
    main?.classList.add("snap-sections");
    return () => main?.classList.remove("snap-sections");
  }, []);
  return null;
}
