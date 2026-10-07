import type { ReactNode } from "react";

export function DesignContainer({ children, width = "wide", className = "" }: {
  children: ReactNode;
  width?: "wide" | "reading";
  className?: string;
}) {
  return <div className={`de-container de-container--${width} ${className}`}>{children}</div>;
}
