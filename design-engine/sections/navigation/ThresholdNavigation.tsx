"use client";
import type { ReactNode } from "react";
import {
  NavigationShell,
  type NavigationParts,
  type NavigationSection,
  IndexPanel,
} from "./shared";
function Header({
  brand,
  cta,
  menuButton,
  content,
}: NavigationParts): ReactNode {
  return (
    <div className="de-nx-threshold-header">
      {brand}
      <span className="de-nx-context-label">{content.kind}</span>
      {menuButton}
      {cta}
    </div>
  );
}
export function ThresholdNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
