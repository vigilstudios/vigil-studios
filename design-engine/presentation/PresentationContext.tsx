"use client";
import { createContext, useContext, type ReactNode } from "react";
import { VigilIcon } from "../icons/VigilIcon";
import type { VigilIconName } from "../icons/names";
import type { PresentationSettings } from "./schema";
const PresentationContext = createContext<PresentationSettings>({});
export function PresentationProvider({ value, children }: { value: PresentationSettings; children: ReactNode }) {
  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}
export function usePresentation() { return useContext(PresentationContext); }
export function ControlIcon({ kind = "media", fallback = "arrow-up-right", size = 20 }: {
  kind?: "media" | "previous" | "next"; fallback?: VigilIconName; size?: number;
}) {
  const controls = usePresentation().controls;
  return <VigilIcon name={controls?.[`${kind}Icon`] ?? fallback} size={size} decorative/>;
}
