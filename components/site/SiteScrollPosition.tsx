"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function SiteScrollPosition() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const restoring = useRef<string | null>(null);
  const positions = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const onPopState = () => {
      restoring.current = location.pathname === previous.current ? null : location.pathname;
    };
    const root = document.getElementById("site-root");
    if (!root) return;
    const savePosition = () => {
      if (location.pathname === previous.current && !location.hash) {
        positions.current.set(location.pathname + location.search, root.scrollTop);
      }
    };
    root.addEventListener("scroll", savePosition, { passive: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      root.removeEventListener("scroll", savePosition);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const fromHistory = restoring.current === pathname;
    restoring.current = null;
    // The persistent scroll container needs its own position on cross-page navigation.
    // Fragment links are positioned by the browser or Next's link handler.
    if (location.hash) return;
    const top = fromHistory ? positions.current.get(pathname + location.search) ?? 0 : 0;
    document.getElementById("site-root")?.scrollTo({ top, behavior: "instant" });
  }, [pathname]);

  return null;
}
