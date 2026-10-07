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
}: NavigationParts): ReactNode {
  return (
    <>
      <div className="de-nx-service-line">
        {brand}
        {utility}
      </div>
      <div className="de-nx-department-band">
        {primary}
        {menuButton}
      </div>
    </>
  );
}
export function SwitchboardNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
