"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { SectionInstance } from "../composition/schemas";
import type { SiteDefinition } from "../site/model";
import { resolveAction } from "../site/actions";
import { getActionCapabilities } from "./capabilities";
import type { ActionSlot, EnabledActionSlot } from "./schema";

const SiteContext = createContext<SiteDefinition | undefined>(undefined);
const SectionContext = createContext<SectionInstance | undefined>(undefined);
export function ActionSiteProvider({ site, children }: { site: SiteDefinition; children?: ReactNode }) {
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}
export function SectionActionProvider({ section, children }: { section: SectionInstance; children: ReactNode }) {
  return <SectionContext.Provider value={section}>{children}</SectionContext.Provider>;
}
export function useSectionActions() {
  const section = useContext(SectionContext);
  return { section, capability: section ? getActionCapabilities(section.component) : undefined };
}
export function useActionResolution(slot?: ActionSlot): (EnabledActionSlot & {href?:string;download?:string|true;issue?:string}) | undefined {
  const site = useContext(SiteContext);
  if (!slot?.enabled) return undefined;
  return { ...slot, ...resolveAction(site, slot.action) };
}
