import type { NavGroup } from "@/components/vigil/nav";
export const prospectNavigation: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: "overview", exact: true },
    ],
  },
  {
    id: "website",
    label: "Website",
    items: [
      {
        href: "/dashboard/website",
        label: "Website Preview",
        icon: "website",
        locked: true,
        disabled: true,
        disabledReason: "Available after purchase and setup",
      },
      {
        href: "/dashboard/content",
        label: "Content Hub",
        icon: "blog",
        premium: true,
        locked: true,
        disabled: true,
        disabledReason: "Available after purchase and setup",
      },
      {
        href: "/dashboard/files",
        label: "Files",
        icon: "files",
        locked: true,
        disabled: true,
        disabledReason: "Available after purchase and setup",
      },
      {
        href: "/dashboard/requests",
        label: "Requests",
        icon: "requests",
        premium: true,
        locked: true,
        disabled: true,
        disabledReason: "Available after purchase and setup",
      },
      {
        href: "/dashboard/domain",
        label: "Domain",
        icon: "domain",
        locked: true,
        disabled: true,
        disabledReason: "Available after purchase and setup",
      },
      {
        href: "/dashboard/billing",
        label: "Subscription",
        icon: "billing",
        locked: true,
        disabled: true,
        disabledReason: "Available after purchase and setup",
      },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    items: [
      {
        href: "/dashboard/leads",
        label: "Lead Hub",
        icon: "leads",
        locked: true,
        disabled: true,
        disabledReason: "Available after purchase and setup",
      },
      {
        href: "/dashboard/bookings",
        label: "Bookings",
        icon: "bookings",
        premium: true,
        locked: true,
        disabled: true,
        disabledReason: "Available after purchase and setup",
      },
      {
        href: "/dashboard/insights",
        label: "Insights",
        icon: "insights",
        locked: true,
        disabled: true,
        badge: "Soon",
      },
      {
        href: "/dashboard/virtue",
        label: "Virtue",
        icon: "virtue",
        locked: true,
        disabled: true,
        badge: "Soon",
      },
    ],
  },
  {
    items: [
      { href: "/dashboard/purchases", label: "Purchases", icon: "billing" },
      { href: "/dashboard/settings", label: "Settings", icon: "settings" },
    ],
  },
];
