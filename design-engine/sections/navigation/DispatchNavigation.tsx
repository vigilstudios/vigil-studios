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
  primary,
  utility,
  menuButton,
  links,
  destination,
  content,
}: NavigationParts): ReactNode {
  return (
    <>
      <div className="de-nx-colophon">
        <span>{content.kind}</span>
        <span>{content.edition}</span>
      </div>
      <div className="de-nx-masthead">
        {brand}
        {utility}
      </div>
      <div className="de-nx-register">
        {primary}
        <div className="de-nx-masthead-priority">
          {links.slice(0, 2).map((l) => (
            <span key={l.label}>
              {destination(l.label, "", undefined, l.href)}
            </span>
          ))}
        </div>
        {menuButton}
      </div>
    </>
  );
}
export function DispatchNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
