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
  content,
}: NavigationParts): ReactNode {
  return (
    <div className="de-nx-rail">
      {brand}
      <p className="de-nx-context-label">{content.kind}</p>
      <div className="de-nx-rail-links">
        {links.map((l, i) => (
          <span key={l.label}>{destination(l.label, "", i, l.href)}</span>
        ))}
      </div>
      {cta}
      {menuButton}
    </div>
  );
}
export function MarginRailNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
