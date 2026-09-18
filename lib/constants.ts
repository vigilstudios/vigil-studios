// The Express tier replaces the old manually built Starter. Same deliverable —
// single page, responsive, basic SEO, one revision — but produced from a
// per-industry template rather than a bespoke build, which is what makes the
// lower price and the 1-2 day turnaround possible.
export const EXPRESS_PRICE = "599";

// The old Stripe payment link is retired: the catalogue's Buy button opens
// /checkout (Stripe Checkout Sessions, provisioning and Virtue onboarding
// behind it). Kept empty so nothing can link to it by accident.
export const EXPRESS_CHECKOUT_URL = "";

export type ExpressTemplateStatus = "available" | "coming";

// One finished example per industry, each built from the exact template a real
// order is produced from. The businesses are fictional and each page says so.
// Order is the catalogue order; "coming" templates sit at the end, locked,
// until their build is finished.
export const EXPRESS_TEMPLATES: {
  slug: string;
  variant: string;
  industry: string;
  example: string;
  description: string;
  accent: string;
  status: ExpressTemplateStatus;
}[] = [
  {
    slug: "restaurant",
    variant: "Savor",
    industry: "Restaurant and cafe",
    example: "Marlow & Fen",
    description:
      "An all-day menu, warm food photography, and an invitation to stay. Designed for neighborhood restaurants and cafes.",
    accent: "#4a1728",
    status: "available",
  },
  {
    slug: "home-services",
    variant: "Foundation",
    industry: "Home services",
    example: "Fieldwork Home Services",
    description:
      "Warm and architectural, with clear services, project imagery, local coverage, and a straightforward estimate request.",
    accent: "#eab65b",
    status: "available",
  },
  {
    slug: "retail",
    variant: "Atelier",
    industry: "Retail and boutique",
    example: "Morrow",
    description:
      "A bright editorial boutique with curated collections, an interactive outfit edit, and a visit-first path to the shop.",
    accent: "#243cca",
    status: "available",
  },
  {
    slug: "medical",
    variant: "Clarity",
    industry: "Medical and dental",
    example: "Harbor Health",
    description:
      "Calm and restrained. A wide reception photograph, care written plainly, your team, and what to expect before a visit — with no prices and no claims about outcomes.",
    accent: "#173e40",
    status: "available",
  },
  {
    slug: "salon-spa",
    variant: "Serene",
    industry: "Salon and spa",
    example: "still & form",
    description:
      "Quiet and editorial. A service menu by category with durations and prices, the people you book by name, and a booking slip.",
    accent: "#263c35",
    status: "available",
  },
  {
    slug: "auto-services",
    variant: "Torque",
    industry: "Auto shop",
    example: "Torque & Theory",
    description:
      "Editorial and motion-rich, with a transparent brake inspection, service ledger, and a review rail that stays alive.",
    accent: "#dcf763",
    status: "available",
  },
  {
    slug: "creator",
    variant: "Muse",
    industry: "Creator",
    example: "The Muse Edit",
    description:
      "Editorial and expressive, with cinematic imagery, social-first storytelling, a living portfolio, and a polished home for brand partnerships.",
    accent: "#f2b8c6",
    status: "coming",
  },
];

export const AVAILABLE_EXPRESS_TEMPLATES = EXPRESS_TEMPLATES.filter((template) => template.status === "available");
const availableExpressTemplateSlugs = new Set(AVAILABLE_EXPRESS_TEMPLATES.map((template) => template.slug));

/** True when a slug belongs to a finished, assignable Express template. */
export function isAvailableExpressTemplateSlug(slug: string): boolean {
  return availableExpressTemplateSlugs.has(slug);
}
