import { z } from "zod";

const destination = z.string().refine((value) =>
  /^\/(?!\/)[^\s]*$/.test(value) || /^https:\/\/[^\s]+$/.test(value),
  "Use an internal route or an HTTPS URL",
);
const action = z.object({ label: z.string().min(1), href: destination, variant: z.enum(["primary", "secondary"]) });
export const creatorCampaignSchema = z.object({
  id: z.string().min(1),
  promotion: z.object({
    enabled: z.boolean(),
    percentOff: z.number().int().min(1).max(50),
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    terms: z.string(),
  }),
  actions: z.object({ main: action, express: action, professional: action }),
  showcase: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    image: destination,
    imageAlt: z.string().min(1),
    siteUrl: z.string().url().startsWith("https://").nullable(),
    video: destination.nullable().optional(),
  }).nullable(),
});

/** Shared campaign configuration. Base prices stay in the catalogue; the server applies the build offer below. */
export const CREATOR_CAMPAIGN = creatorCampaignSchema.parse({
  id: "creators",
  promotion: {
    enabled: true,
    percentOff: 15,
    eyebrow: "The creator promotion",
    title: "Your creator offer.",
    description: "Start with Express or build a custom Professional site. Your creator offer is applied automatically.",
    terms: "Applies to new self-service Express and Professional one-time builds. Ongoing Vigil plans, custom/staff quotes and existing orders are excluded. Cannot be combined with other promotions.",
  },
  actions: {
    main: { label: "Find your website", href: "/creators#choose-your-site", variant: "primary" },
    express: { label: "Start with Express", href: "/express", variant: "secondary" },
    professional: { label: "Build with Professional", href: "/professional", variant: "primary" },
  },
  // Replace null with approved project imagery/copy and an optional live URL. Never use a fictional client.
  showcase: null,
});
export type CampaignAction = z.infer<typeof action>;

export type CreatorBuildOffer = { amountCents: number | null; originalAmountCents: number | null; discountCents: number; percentOff: number | null };

/** Canonical catalogue amount in, cents-rounded creator build offer out. Never discounts a plan. */
export function creatorBuildOffer(kind: string, amountCents: number | null, promotion = CREATOR_CAMPAIGN.promotion): CreatorBuildOffer {
  if (amountCents !== null && (!Number.isSafeInteger(amountCents) || amountCents < 0 || amountCents > Math.floor(Number.MAX_SAFE_INTEGER / 100))) throw new RangeError("Invalid catalogue build amount");
  if (!promotion.enabled || amountCents === null || amountCents === 0 || !["express", "professional"].includes(kind)) return { amountCents, originalAmountCents: amountCents, discountCents: 0, percentOff: null };
  const discounted = Math.round(amountCents * (100 - promotion.percentOff) / 100);
  return { amountCents: discounted, originalAmountCents: amountCents, discountCents: amountCents - discounted, percentOff: promotion.percentOff };
}
