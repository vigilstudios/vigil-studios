"use client";
import type { ReactNode } from "react";
import {
  NavigationShell,
  type NavigationParts,
  type NavigationSection,
  StagedPanel,
} from "./shared";
function Header({ brand, utility, menuButton }: NavigationParts): ReactNode {
  return (
    <div className="de-nx-channel-header">
      {brand}
      {menuButton}
      {utility}
    </div>
  );
}
export function ChannelDirectoryNavigation({
  section,
}: {
  section: NavigationSection;
}) {
  return (
    <NavigationShell section={section} Header={Header} Panel={StagedPanel} />
  );
}
