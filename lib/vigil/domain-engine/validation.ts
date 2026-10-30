import { z } from "zod";

export const registrantSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    organization: z.string().trim().max(200).optional(),
    email: z.string().trim().email().max(254),
    phone: z
      .string()
      .regex(
        /^\+[1-9]\d{6,14}$/,
        "Use an international phone number, for example +12125550100.",
      ),
    address: z
      .object({
        line1: z.string().trim().min(1).max(200),
        line2: z.string().trim().max(200).optional(),
        city: z.string().trim().min(1).max(100),
        region: z.string().trim().min(1).max(100),
        postalCode: z.string().trim().min(1).max(30),
        country: z.string().regex(/^[A-Z]{2}$/),
      })
      .strict(),
    additional: z.record(z.string().max(200)).optional(),
  })
  .strict();

export const purchaseApprovalSchema = z
  .object({
    quoteId: z.string().uuid(),
    intentId: z.string().uuid(),
    totalMinor: z.number().int().positive().max(100_000_000),
    currency: z.literal("usd"),
    contact: registrantSchema,
    autoRenew: z.boolean(),
    acceptTerms: z.literal(true),
    acceptContactTransmission: z.literal(true),
  })
  .strict();
