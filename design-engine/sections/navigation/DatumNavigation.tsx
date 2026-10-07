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
  cta,
  menuButton,
}: NavigationParts): ReactNode {
  return (
    <div className="de-nx-datum">
      {brand}
      {primary}
      {cta}
      {menuButton}
    </div>
  );
}
export function DatumNavigation({ section }: { section: NavigationSection }) {
  return (
    <NavigationShell section={section} Header={Header} Panel={IndexPanel} />
  );
}
