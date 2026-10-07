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
  links,
  destination,
  config,
}: NavigationParts): ReactNode {
  return (
    <div className="de-nx-pocket">
      {brand}
      <div className="de-nx-pocket-priorities">
        {links
          .slice(
            0,
            config.priorityLinks === "three"
              ? 3
              : config.priorityLinks === "two"
                ? 2
                : 0,
          )
          .map((l) => (
            <span key={l.label}>
              {destination(l.label, "", undefined, l.href)}
            </span>
          ))}
      </div>
      {cta}
      {menuButton}
    </div>
  );
}
export function PocketDockNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
