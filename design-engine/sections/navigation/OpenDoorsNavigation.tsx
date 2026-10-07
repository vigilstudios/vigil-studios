"use client";
import type { ReactNode } from "react";
import {
  NavigationShell,
  type NavigationParts,
  type NavigationSection,
  DoorsPanel,
} from "./shared";
function Header({
  brand,
  cta,
  menuButton,
  content,
}: NavigationParts): ReactNode {
  return (
    <div className="de-nx-doors-header">
      {brand}
      <p>{content.prompt}</p>
      {menuButton}
      {cta}
    </div>
  );
}
export function OpenDoorsNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={DoorsPanel} />
  );
}
