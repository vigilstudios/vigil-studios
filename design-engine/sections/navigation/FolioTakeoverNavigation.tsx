"use client";
import type { ReactNode } from "react";
import {
  NavigationShell,
  type NavigationParts,
  type NavigationSection,
  IndexPanel,
} from "./shared";
function Header({ brand, menuButton, content }: NavigationParts): ReactNode {
  return (
    <div className="de-nx-folio-header">
      {brand}
      <span className="de-nx-context-label">
        {content.kind}
        <br />
        {content.sceneLabel}
      </span>
      {menuButton}
    </div>
  );
}
export function FolioTakeoverNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
