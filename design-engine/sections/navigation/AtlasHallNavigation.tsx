"use client";
import type { ReactNode } from "react";
import {
  NavigationShell,
  type NavigationParts,
  type NavigationSection,
  DirectoryPanel,
} from "./shared";
function Header({
  brand,
  cta,
  menuButton,
  links,
  destination,
}: NavigationParts): ReactNode {
  return (
    <div className="de-nx-hall-header">
      {brand}
      <div className="de-nx-priorities">
        {links.slice(0, 2).map((l) => (
          <span key={l.label}>
            {destination(l.label, "", undefined, l.href)}
          </span>
        ))}
      </div>
      {menuButton}
      {cta}
    </div>
  );
}
export function AtlasHallNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={DirectoryPanel} />
  );
}
