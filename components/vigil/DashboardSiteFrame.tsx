import type { ComponentProps } from "react";
import { SiteFrame } from "./SiteFrame";
import "./dashboard-site-frame.css";

/** One viewport and browser treatment for live, pre-launch and full-page previews. */
export function DashboardSiteFrame({ className = "", ...props }: Omit<ComponentProps<typeof SiteFrame>, "desktopHeight">) {
  return <SiteFrame {...props} desktopHeight={900} className={`dashboard-site-frame ${className}`} />;
}
