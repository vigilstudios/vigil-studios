"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { VigilIconPack } from "./registry";
const IconSystem = createContext<{ strokeWidth: 1.5 | 2; pack?: VigilIconPack }>({ strokeWidth: 2 });
export function IconSystemProvider({ children, strokeWidth = 2, pack }: { children: ReactNode; strokeWidth?: 1.5 | 2; pack?: VigilIconPack }) {
  return <IconSystem.Provider value={{ strokeWidth, pack }}>{children}</IconSystem.Provider>;
}
export function useIconSystem() { return useContext(IconSystem); }
