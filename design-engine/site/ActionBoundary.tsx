"use client";
import { useEffect, useRef, type ReactNode } from "react";
import type { PageComposition } from "../composition/schemas";
import type { SiteDefinition } from "./model";
import { ActionSiteProvider } from "../actions/ActionContext";
import { resolveAction } from "./actions";
/** Existing components keep narrow props. Download semantics are applied at the host boundary. */
export function ActionBoundary({ site, composition, children }: { site: SiteDefinition; composition: PageComposition; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    for (const section of composition.sections) {
      const downloads = (section.actions ?? []).filter(binding => binding.action.type === "download").map(binding => resolveAction(site, binding.action));
      const slot = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-section-id]") ?? []).find(element => element.dataset.sectionId === section.id);
      for (const anchor of slot?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []) {
        if (anchor.hasAttribute("data-action-link")) continue;
        const match = downloads.find(action => action.href === anchor.getAttribute("href"));
        if (match) anchor.setAttribute("download", typeof match.download === "string" ? match.download : "");
        else anchor.removeAttribute("download");
      }
    }
  }, [site, composition]);
  return <ActionSiteProvider site={site}><div ref={root} className="de-site-actions">{children}</div></ActionSiteProvider>;
}
