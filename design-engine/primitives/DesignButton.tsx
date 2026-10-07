import type { ReactNode } from "react";
import type { ActionPresentation } from "../actions/schema";
import { VigilIcon } from "../icons/VigilIcon";

export type DesignButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "solid" | "outline";
  size?: "compact" | "comfortable";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  presentation?: ActionPresentation;
  download?: string | true;
  unavailable?: string;
};

export function DesignButton({ children, href, variant = "solid", size = "comfortable", className = "", disabled, onClick, type = "button", presentation, download, unavailable }: DesignButtonProps) {
  const classes = presentation ? `de-action de-action--${presentation.variant ?? "auto"} de-action--${presentation.size ?? "medium"} ${className}` : `de-button de-button--${variant} de-button--${size} ${className}`;
  const attributes = { "data-action-link": presentation ? "true" : undefined, className: classes, "data-action-width": presentation?.width, "data-action-surface": presentation?.surface, "data-action-align": presentation?.alignment };
  const icon = presentation?.icon ? <VigilIcon name={presentation.icon} decorative size={18}/> : null;
  const content = <>{presentation?.iconPosition === "leading" && icon}<span className={presentation ? "de-action-label" : undefined}>{children}</span>{presentation?.iconPosition !== "leading" && icon}</>;
  if (unavailable || href && disabled) return <span {...attributes} role="link" aria-disabled="true" title={unavailable}>{content}</span>;
  if (href) return <a {...attributes} href={href} download={download} onClick={onClick}>{content}</a>;
  return <button {...attributes} type={type} disabled={disabled} onClick={onClick}>{content}</button>;
}
