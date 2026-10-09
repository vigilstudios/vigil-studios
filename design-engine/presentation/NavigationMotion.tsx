import type { ReactNode } from "react";

/** The outer box is observed/measured; only the inner box receives entrance motion. */
export function NavigationMotion({ children }: { children: ReactNode }) {
  return <div className="de-navigation-motion-anchor"><div className="de-navigation-motion">{children}</div></div>;
}
