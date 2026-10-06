/**
 * Canonical website-build boundaries. Prices remain database rows and Vigil
 * subscription entitlements remain in plan_features; this file defines what
 * the one-time website build itself promises. The bespoke/Growth-level tier
 * retains the existing Custom Build name and `custom` catalog key. Recurring
 * Vigil Growth is a separate product, not a website-build entitlement.
 */
export const WEBSITE_TIERS = {
  express: {
    kind: "express",
    name: "Vigil Express",
    summary: "A polished single-page website, customized around your brand.",
    description: "A professionally designed single-page experience built from a curated Vigil industry design system, then customized with your brand, content, imagery, services and business details. A streamlined route to a responsive, polished site with one proven design direction.",
    firstLook: "Within two business days of completed onboarding",
    primaryPages: 1,
    design: "Curated industry design, customized around your brand",
    integrations: "Preconfigured or template-supported integrations",
    booking: "Booking links and compatible template embeds",
    revisions: 1,
    included: [
      "One page from a curated industry design",
      "Your colours, logo, photos, services and content",
      "Responsive design and basic SEO",
      "Contact, click-to-call and social links",
      "Supported booking embeds, maps, reviews and payment links",
    ],
    excluded: ["Multi-page architecture", "Arbitrary layout changes or bespoke art direction", "Custom applications or APIs", "Complex ecommerce", "Advanced automation"],
  },
  professional: {
    kind: "professional",
    name: "Professional Site",
    summary: "A premium multi-page website, composed and art-directed for your brand.",
    description: "A premium multi-page experience composed from Vigil’s curated design systems and art-directed for your business. We select and configure sections, typography, layouts, media, supported motion, nested pages and contextual calls to action around your brand and customer journey. Proven responsive systems make production more reliable while leaving room for a highly individual composition.",
    firstLook: "Confirmed after intake",
    primaryPages: 8,
    design: "Tailored composition from Vigil’s premium design systems",
    integrations: "Standard configurable third-party integrations",
    booking: "Booking links and third-party booking embeds",
    revisions: 2,
    included: [
      "Up to 8 tailored primary pages",
      "Brand-led composition from premium design systems",
      "Advanced forms and standard booking integrations",
      "Standard payments, maps, reviews, social and marketing integrations",
      "CMS for blogs, portfolios, services or similar content where appropriate",
      "Analytics, conversion tracking and SEO foundations",
      "Performance optimization and two revision rounds",
    ],
    composition: ["Navigation and heroes", "Brand and story", "Media and portfolios", "Services and capabilities", "Product presentation", "Social proof and results"],
    architecture: "Independent pages, nested navigation and contextual calls to action within the primary-page scope",
    customization: "Section selection, page layouts, typography, art direction, brand colours, client media and compatible motion",
    utilityPages: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility statement"],
    excluded: [
      "Custom web applications, dashboards or customer portals",
      "Complex authentication or membership platforms",
      "Native booking infrastructure",
      "Large or operationally complex ecommerce",
      "Custom APIs, multi-system synchronization or complex automation",
      "New bespoke components, design systems or experimental interactions",
    ],
  },
  custom: {
    kind: "custom",
    name: "Custom Build",
    summary: "Bespoke design and advanced functionality, scoped around your ambitions.",
    description: "For a visual identity or experience that calls for invention: original design systems, components, motion, specialized functionality or complex integrations beyond our existing premium systems. We reuse proven infrastructure where useful and scope the bespoke work around your project.",
    firstLook: "Agreed in the written scope",
    primaryPages: null,
    design: "Original design systems, components and interactions as scoped",
    integrations: "Advanced or custom, as scoped",
    booking: "Native/custom booking may be separately scoped",
    revisions: null,
    included: ["Bespoke visual direction and original components", "Unique motion and interactions as scoped", "Custom applications, commerce and integrations as scoped", "Written scope, price and timeline"],
    excluded: [],
  },
} as const;

export type WebsiteTierKind = keyof typeof WEBSITE_TIERS;

export const PROFESSIONAL_QUALIFIERS = [
  { id: "business_site", label: "A tailored business or marketing website", detail: "Up to eight primary pages", outcome: "included" },
  { id: "forms", label: "Contact, quote or multi-step forms", detail: "Including basic lead routing", outcome: "included" },
  { id: "booking_embed", label: "Booking through a service I already use", detail: "Calendly, Acuity, Square, Vagaro, Fresha, Mindbody or similar", outcome: "included" },
  { id: "basic_payments", label: "Simple payments or deposits", detail: "Stripe, PayPal, Square, payment links or simple service checkout", outcome: "included" },
  { id: "cms", label: "A blog, portfolio, case studies or editable content", detail: "CMS included where it suits the site", outcome: "included" },
  { id: "standard_integrations", label: "Standard third-party integrations", detail: "Analytics, maps, reviews, email, CRM forms, chat and social tools", outcome: "included" },
  { id: "bespoke_design", label: "Original components or a unique interaction system", detail: "Bespoke design beyond our premium design systems", outcome: "custom" },
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
