"use client";
import type { ReactNode } from "react";
import {
  NavigationShell,
  type NavigationParts,
  type NavigationSection,
  IndexPanel,
} from "./shared";
function Header({
  list,
  brand,
  utility,
  menuButton,
  links,
  destination,
  content,
}: NavigationParts): ReactNode {
  return (
    <>
      <div className="de-nx-service-line">
        <span>{content.kind}</span>
        {utility}
      </div>
      <div className="de-nx-meridian">
        <div className="de-nx-wing">
          {list(links.slice(0, Math.ceil(links.length / 2)), "left")}
        </div>
        {brand}
        <div className="de-nx-wing">
          {list(links.slice(Math.ceil(links.length / 2)), "right")}
        </div>
      </div>
      <div className="de-nx-mobile-priority">
        {links.slice(0, 2).map((l) => (
          <span key={l.label}>
            {destination(l.label, "", undefined, l.href)}
          </span>
        ))}
        {menuButton}
      </div>
    </>
  );
}
export function MeridianNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
