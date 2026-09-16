/**
 * Canonical website-build boundaries. Prices remain database rows and Vigil
 * subscription entitlements remain in plan_features; this file defines what
 * the one-time website build itself promises.
 */
export const WEBSITE_TIERS = {
  express: {
    kind: "express",
    name: "Vigil Express",
    summary: "A polished one-page website built from an industry template.",
    primaryPages: 1,
    design: "Industry template, branded for the customer",
    integrations: "Preconfigured or template-supported integrations",
    booking: "Booking links and compatible template embeds",
    revisions: 1,
    included: [
      "One-page industry template",
      "Client colours, logo, photos and content",
      "Responsive design and basic SEO",
      "Contact, click-to-call and social links",
      "Template-supported booking, maps, reviews and simple payment links",
    ],
    excluded: ["Custom UX/UI", "Custom applications or APIs", "Complex ecommerce", "Advanced automation", "Vigil Lead Hub or Vigil Insights"],
  },
  professional: {
    kind: "professional",
    name: "Professional Site",
    summary: "A fully custom business website with up to eight primary pages.",
    primaryPages: 8,
    design: "Fully custom responsive UI/UX",
    integrations: "Standard configurable third-party integrations",
    booking: "Booking links and third-party booking embeds",
    revisions: 2,
    included: [
      "Up to 8 custom primary pages",
      "Fully custom responsive design",
      "Advanced forms and standard booking integrations",
      "Standard payments, maps, reviews, social and marketing integrations",
      "CMS for blogs, portfolios, services or similar content where appropriate",
      "Analytics, conversion tracking and SEO foundations",
      "Performance optimization and two revision rounds",
    ],
    utilityPages: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility statement"],
    excluded: [
      "Custom web applications, dashboards or customer portals",
      "Complex authentication or membership platforms",
      "Native booking infrastructure",
      "Large or operationally complex ecommerce",
      "Custom APIs, multi-system synchronization or complex automation",
      "Vigil Lead Hub, advanced Vigil Insights or Virtue as an AI employee",
    ],
  },
  custom: {
    kind: "custom",
    name: "Custom Build",
    summary: "Software, advanced commerce and complex integrations with a written scope.",
    primaryPages: null,
    design: "Custom",
    integrations: "Advanced or custom, as scoped",
    booking: "Native/custom booking may be separately scoped",
    revisions: null,
    included: ["Custom applications and portals", "Advanced ecommerce", "Custom APIs and workflows", "Complex system integrations", "Written scope and timeline"],
    excluded: [],
  },
} as const;

export type WebsiteTierKind = keyof typeof WEBSITE_TIERS;

export const PROFESSIONAL_QUALIFIERS = [
  { id: "business_site", label: "A custom business or marketing website", detail: "Up to eight primary pages", outcome: "included" },
  { id: "forms", label: "Contact, quote or multi-step forms", detail: "Including basic lead routing", outcome: "included" },
  { id: "booking_embed", label: "Booking through a service I already use", detail: "Calendly, Acuity, Square, Vagaro, Fresha, Mindbody or similar", outcome: "included" },
  { id: "basic_payments", label: "Simple payments or deposits", detail: "Stripe, PayPal, Square, payment links or simple service checkout", outcome: "included" },
  { id: "cms", label: "A blog, portfolio, case studies or editable content", detail: "CMS included where it suits the site", outcome: "included" },
  { id: "standard_integrations", label: "Standard third-party integrations", detail: "Analytics, maps, reviews, email, CRM forms, chat and social tools", outcome: "included" },
  { id: "extra_pages", label: "More than eight primary pages", detail: "Additional pages can be quoted as an add-on", outcome: "consult" },
  { id: "advanced_store", label: "A large or operationally complex online store", detail: "Catalogs, inventory, variants, shipping, fulfillment or marketplace features", outcome: "consult" },
  { id: "portal", label: "Customer accounts, memberships, dashboards or a portal", detail: "This is custom application work", outcome: "custom" },
  { id: "native_booking", label: "A new custom booking system", detail: "Availability, calendars, reminders, workflows or a booking database", outcome: "custom" },
  { id: "custom_systems", label: "Custom APIs or complex automation", detail: "Multi-system synchronization or custom backend logic", outcome: "custom" },
] as const;

export type ProfessionalQualifierId = (typeof PROFESSIONAL_QUALIFIERS)[number]["id"];

export function professionalPurchaseRoute(selected: readonly ProfessionalQualifierId[]): "checkout" | "consult" {
  return selected.some((id) => PROFESSIONAL_QUALIFIERS.find((item) => item.id === id)?.outcome !== "included") ? "consult" : "checkout";
}
