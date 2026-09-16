/**
 * Navigation model shared by the server layouts (which decide what appears)
 * and the client frame (which renders it). Icons are named, not imported, so
 * server components can describe the nav without shipping component
 * references across the RSC boundary.
 */
export type NavIcon =
  | "overview"
  | "website"
  | "domain"
  | "billing"
  | "requests"
  | "review"
  | "leads"
  | "insights"
  | "virtue"
  | "settings"
  | "customers"
  | "websites"
  | "domains"
  | "subscriptions"
  | "jobs"
  | "audit"
  | "plans";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  exact?: boolean;
  /** Rendered dimmed with a lock; the page explains why. */
  locked?: boolean;
  /** Small trailing tag such as "Soon". */
  badge?: string;
  /** Unresolved work exists in this section. */
  attention?: boolean;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const SIDEBAR_COOKIE = "vigil-sidebar";
