"use client";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

const desktopQuery = "(min-width: 1024px)";
function subscribeDesktop(notify: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}
const isDesktop = () => window.matchMedia(desktopQuery).matches;
const serverDesktop = () => true;

/** Shared staff desktop boundary; client artboards remain responsive. */
export function DesktopLabShell({ children }: { children: ReactNode }) {
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, serverDesktop);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!desktop) return;
    const covered = root.current?.closest(".vigil-frame")?.querySelectorAll<HTMLElement>(":scope > aside, :scope > div > header") ?? [];
    const previous = Array.from(covered, element => ({ element, inert: element.inert }));
    previous.forEach(({ element }) => { element.inert = true; });
    return () => previous.forEach(({ element, inert }) => { element.inert = inert; });
  }, [desktop]);

  return <div ref={root} className="professional-lab">
    {desktop ? children : <section className="lab-desktop-required"><p>Professional Design Engine</p><h1>Lab is a desktop workspace</h1><p>Open Lab in a desktop window at least 1024px wide to inspect and compose sections.</p><a href="/admin">Return to admin ↗</a></section>}
  </div>;
}
