import { z } from "zod";

/**
 * The customer's brief: everything the guided onboarding collects, stored
 * as one JSON document in `projects.brief`. Every step writes its own key,
 * so a half-finished onboarding is just a brief with fewer keys. Keep the
 * schema forgiving on read (old briefs must still load) and strict on
 * write (each step validates only its own section).
 */

export const BRIEF_VERSION = 3;

export const STEP_KEYS = ["welcome", "basics", "kickoff", "strategy", "offerings", "about", "brand", "domain", "review"] as const;
export type StepKey = (typeof STEP_KEYS)[number];
export type ProjectKind = "express" | "professional" | "custom";

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABELS: Record<Day, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => trimmed(max).optional().or(z.literal("")).transform((v) => v ?? "");

export const hoursDaySchema = z.object({
  day: z.enum(DAYS),
  closed: z.boolean().default(false),
  open: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal("")).default(""),
  close: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal("")).default(""),
});

export const basicsSchema = z.object({
  businessName: trimmed(160).min(1, "What is the business called?"),
  tagline: optionalText(160),
  phone: optionalText(40),
  email: optionalText(160),
  address: z.object({
    line1: optionalText(160),
    line2: optionalText(160),
    city: optionalText(80),
    region: optionalText(80),
    postal: optionalText(20),
    country: optionalText(80),
  }).default({ line1: "", line2: "", city: "", region: "", postal: "", country: "" }),
  hours: z.object({
    sameEveryDay: z.boolean().default(false),
    byAppointment: z.boolean().default(false),
    days: z.array(hoursDaySchema).default(() => DAYS.map((day) => ({ day, closed: false, open: "", close: "" }))),
    notes: optionalText(300),
  }).default({ sameEveryDay: false, byAppointment: false, days: DAYS.map((day) => ({ day, closed: false, open: "", close: "" })), notes: "" }),
});

export const kickoffSchema = z.object({
  mode: z.enum(["guided", "call", "both"]).nullable().default(null),
  callBooked: z.boolean().default(false),
});

export const strategySchema = z.object({
  primaryGoal: z.enum(["leads", "sales", "bookings", "inform", "portfolio", "other"]).nullable().default(null),
  success: optionalText(600),
  audience: optionalText(1000),
  estimatedPageCount: z.number().int().min(1).max(100).nullable().default(null),
  pages: z.array(z.enum(["home", "about", "services", "products", "menu", "portfolio", "gallery", "testimonials", "blog", "faq", "contact", "other"])).max(12).default([]),
  otherPages: optionalText(500),
  features: z.array(z.enum(["contact_form", "multi_step_forms", "booking", "booking_embed", "payments", "simple_payments", "maps_reviews", "analytics_tracking", "email_crm", "live_chat", "social", "cms_blog", "newsletter", "blog", "events", "gallery", "multilingual", "basic_automation", "ecommerce", "memberships", "native_booking", "custom_api", "other"])).max(23).default([]),
  featureNotes: optionalText(1000),
  contentStatus: z.enum(["ready", "partial", "needs_help"]).nullable().default(null),
  references: z.array(z.object({
    url: optionalText(300),
    notes: optionalText(500),
  })).max(3).default([]),
  approver: z.object({
    name: optionalText(120),
    email: optionalText(160),
  }).default({ name: "", email: "" }),
  targetLaunch: optionalText(120),
  notes: optionalText(1200),
});

export const offeringItemSchema = z.object({
  id: z.string().min(1),
  name: trimmed(120),
  description: optionalText(400),
  price: optionalText(40),
});

export const offeringSectionSchema = z.object({
  id: z.string().min(1),
  name: optionalText(80),
  items: z.array(offeringItemSchema).max(100),
});

export const offeringsSchema = z.object({
  /** What the customer calls these: menu items, services, products. */
  noun: z.enum(["services", "menu", "products", "other"]).default("services"),
  sections: z.array(offeringSectionSchema).max(20).default([]),
  notes: optionalText(600),
});

export const aboutSchema = z.object({
  story: optionalText(2000),
  different: optionalText(1000),
  hero: optionalText(200),
});

export const brandSchema = z.object({
  colours: z.object({
    mode: z.enum(["logo", "pick", "vigil"]).default("logo"),
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal("")).default(""),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal("")).default(""),
  }).default({ mode: "logo", primary: "", secondary: "" }),
  social: z.object({
    instagram: optionalText(200),
    facebook: optionalText(200),
    tiktok: optionalText(200),
    google: optionalText(300),
    yelp: optionalText(300),
    other: optionalText(300),
  }).default({ instagram: "", facebook: "", tiktok: "", google: "", yelp: "", other: "" }),
  direction: optionalText(1000),
  avoid: optionalText(600),
  notes: optionalText(1000),
});

export const REGISTRARS = [
  "godaddy",
  "namecheap",
  "squarespace",
  "cloudflare",
  "wix",
  "bluehost",
  "ionos",
  "hover",
  "other",
] as const;
export type RegistrarKey = (typeof REGISTRARS)[number];

export const domainSchema = z.object({
  answer: z.enum(["own", "need", "unsure"]).nullable().default(null),
  hostname: optionalText(253),
  registrar: z.enum(REGISTRARS).nullable().default(null),
  /** The `domains` row created for an owned domain. */
  domainId: z.string().uuid().nullable().default(null),
  preferredNames: z.array(trimmed(253)).max(3).default([]),
  /** Customer asked Vigil to handle the DNS change for them. */
  delegate: z.boolean().default(false),
  /** Customer chose to come back to this later. */
  later: z.boolean().default(false),
});

export const briefSchema = z.object({
  version: z.number().default(BRIEF_VERSION),
  basics: basicsSchema.optional(),
  kickoff: kickoffSchema.optional(),
  strategy: strategySchema.optional(),
  offerings: offeringsSchema.optional(),
  about: aboutSchema.optional(),
  brand: brandSchema.optional(),
  domain: domainSchema.optional(),
  progress: z.object({
    lastStep: z.enum(STEP_KEYS).default("welcome"),
    completed: z.array(z.enum(STEP_KEYS)).default([]),
  }).default({ lastStep: "welcome", completed: [] }),
  /** Agreed scope for a custom or extended build (staff-written; visible to both sides). */
  scope: z.object({ summary: optionalText(2000), items: z.array(trimmed(200)).max(50).default([]) }).optional(),
});

export type Brief = z.infer<typeof briefSchema>;
export type Basics = z.infer<typeof basicsSchema>;
export type Kickoff = z.infer<typeof kickoffSchema>;
export type Strategy = z.infer<typeof strategySchema>;
export type Offerings = z.infer<typeof offeringsSchema>;
export type About = z.infer<typeof aboutSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type DomainAnswers = z.infer<typeof domainSchema>;

/** Steps that persist a section; `welcome` and `review` do not. */
export const SECTION_SCHEMAS = {
  basics: basicsSchema,
  kickoff: kickoffSchema,
  strategy: strategySchema,
  offerings: offeringsSchema,
  about: aboutSchema,
  brand: brandSchema,
  domain: domainSchema,
} as const;
export type SectionKey = keyof typeof SECTION_SCHEMAS;

/** Parse whatever is in the column; anything unreadable becomes an empty brief. */
export function parseBrief(raw: unknown): Brief {
  const res = briefSchema.safeParse(raw && typeof raw === "object" ? raw : {});
  return res.success ? res.data : briefSchema.parse({});
}

export function emptyBasics(businessName: string): Basics {
  return basicsSchema.parse({ businessName });
}

/** Where the customer should land when they come back. */
export function stepsForProjectKind(kind: ProjectKind): StepKey[] {
  return STEP_KEYS.filter((step) => kind !== "express" || (step !== "kickoff" && step !== "strategy"));
}

export function resumeStep(brief: Brief, kind: ProjectKind = "express"): StepKey {
  const steps = stepsForProjectKind(kind);
  const last = brief.progress.lastStep;
  if (last === "welcome") return "welcome";
  if (!steps.includes(last)) return steps[Math.min(steps.length - 1, 1)];
  return last;
}

/** Ordered checklist for the review step and the dashboard card. */
export function briefCompletion(brief: Brief, kind: ProjectKind = "express"): { key: SectionKey; label: string; done: boolean }[] {
  const items: { key: SectionKey; label: string; done: boolean }[] = [
    { key: "basics", label: "Business basics", done: Boolean(brief.basics?.businessName) },
    { key: "kickoff", label: "How we'll begin", done: brief.kickoff?.mode != null },
    { key: "strategy", label: "Site goals and scope", done: brief.progress.completed.includes("strategy") },
    { key: "offerings", label: "What you offer", done: (brief.offerings?.sections ?? []).some((s) => s.items.length > 0) || Boolean(brief.offerings?.notes) },
    { key: "about", label: "About you", done: Boolean(brief.about?.story || brief.about?.hero) },
    { key: "brand", label: "Brand and photos", done: brief.progress.completed.includes("brand") },
    { key: "domain", label: "Domain", done: brief.domain?.answer != null && (brief.domain.answer !== "own" || Boolean(brief.domain.hostname) || brief.domain.later) },
  ];
  return kind === "express" ? items.filter((item) => item.key !== "kickoff" && item.key !== "strategy") : items;
}

export function stepIndex(step: StepKey): number {
  return STEP_KEYS.indexOf(step);
}
