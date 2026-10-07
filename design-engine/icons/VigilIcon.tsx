"use client";
import { createElement, type CSSProperties } from "react";
import { useIconSystem } from "./IconSystemProvider";
import type { VigilIconName } from "./names";
import { resolveIcon, type VigilIconPack } from "./registry";

type Accessibility = { decorative: true; label?: never } | { decorative?: false; label: string };

export type VigilIconProps = Accessibility & {
  name: VigilIconName;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  pack?: VigilIconPack;
};

export function VigilIcon({ name, size = 20, className, style, strokeWidth, absoluteStrokeWidth = false, pack, ...accessibility }: VigilIconProps) {
  const system = useIconSystem();
  const decorative = accessibility.decorative === true;
  return createElement(resolveIcon(name, pack ?? system.pack), {
    size, className, style, strokeWidth: strokeWidth ?? system.strokeWidth, absoluteStrokeWidth,
    "aria-hidden": decorative ? true : undefined,
    "aria-label": decorative ? undefined : accessibility.label,
    role: decorative ? undefined : "img",
    focusable: "false",
  });
}
