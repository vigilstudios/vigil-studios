"use client";

import { useLayoutEffect } from "react";

/**
 * Turns on native scroll snap for the homepage. The scroll container is
 * the layout's <main>, so the page flags it rather than styling itself.
 */
export function SnapSections() {
  useLayoutEffect(() => {
    const main = document.getElementById("site-root");
    main?.classList.add("snap-sections");
    return () => main?.classList.remove("snap-sections");
  }, []);
  return null;
}
