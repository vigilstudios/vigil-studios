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
    <div className="de-nx-viewfinder">
      {brand}
      <span>{content.sceneLabel}</span>
      {menuButton}
    </div>
  );
}
export function ViewfinderNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
