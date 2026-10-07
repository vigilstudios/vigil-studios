import { z } from "zod";
import { imageSchema } from "../media/types";
const text = (max = 500) => z.string().trim().min(1).max(max);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Valid calendar date required",
  );
const url = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//.test(v), "HTTP(S) source required");
export const evidenceLinkSchema = z.string().min(1).refine(v=>/^(\/(?!\/)|https?:\/\/|#)/.test(v) && !/[\\\x00-\x20\x7f]/.test(v), "Safe destination required");
const sourceFields = {
  source: text(180),
  timeframe: text(100),
  context: text(),
  attribution: text(180),
};
/** A provenance declaration is not an automatic truth/permission verifier. Explicit illustrative records are accepted only by the Lab-mode section envelope. */
export const provenanceSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("demo"),
      ...sourceFields,
      disclosure: text(180),
    })
    .strict(),
  z
    .object({
      status: z.literal("client-supplied"),
      ...sourceFields,
      sourceUrl: url.optional(),
      recordReference: text(180),
      permission: z.literal("publication-authorized"),
    })
    .strict(),
  z
    .object({
      status: z.literal("verified"),
      ...sourceFields,
      sourceUrl: url,
      recordReference: text(180),
      permission: z.literal("publication-authorized"),
      verification: z
        .object({ by: text(120), on: date, method: text() })
        .strict(),
    })
    .strict(),
]);
export type Provenance = z.infer<typeof provenanceSchema>;
export const evidenceIdSchema = text(80).regex(/^[a-z][a-z0-9-]*$/);
const evidence = { id: evidenceIdSchema, provenance: provenanceSchema };
export const testimonialAuthorSchema = z
  .object({ name: text(80), profileUrl: evidenceLinkSchema.optional(), role: text(120).optional(), organization: text(100).optional(), avatar: imageSchema.optional(), logo: imageSchema.optional() })
  .strict();
export const testimonialSchema = z
  .object({
    ...evidence,
    quote: text(1000),
    author: testimonialAuthorSchema,
    portrait: imageSchema.optional(),
  })
  .strict();
export const evidenceMetricSchema = z
  .object({
    ...evidence,
    label: text(100),
    before: z.number().finite().nonnegative().max(1e12),
    after: z.number().finite().nonnegative().max(1e12),
    unit: text(40),
    basis: text(),
    direction: z.enum(["higher", "lower", "neutral"]),
  })
  .strict();
const destination = z
  .object({
    kind: z.enum(["work", "case-study", "customer-story"]),
    key: text(80),
    label: text(80),
  })
  .strict();
export const caseStudyEvidenceSchema = z
  .object({
    id: evidenceIdSchema,
    client: text(100),
    challenge: text(),
    intervention: text(),
    result: evidenceMetricSchema,
    voice: testimonialSchema,
    media: imageSchema.optional(),
    destination: destination.extend({ href: z.string().refine(v => /^(\/(?!\/)|https?:\/\/|#)/.test(v) && !/[\\\x00-\x20\x7f]/.test(v), "Safe host destination required").optional() }).optional(),
  })
  .strict();
export const recognitionSchema = z
  .object({
    ...evidence,
    organization: text(100),
    kind: z.enum(["award", "certification", "press", "partner"]),
    title: text(140),
    scope: text(220),
    year: z.number().int().min(1900).max(2200),
    expires: date.optional(),
    logo: imageSchema.optional(),
  })
  .strict();
export const reviewSchema = z
  .object({
    ...evidence,
    quote: text(700),
    author: testimonialAuthorSchema,
    rating: z.number().int().min(1).max(5),
    date,
    platform: text(80),
    verifiedPurchase: z.boolean(),
    purchaseVerification: z.object({by:text(120),on:date,method:text()}).strict().optional(),
  })
  .strict()
  .refine(
    (v) => !v.verifiedPurchase || (v.provenance.status === "verified" && Boolean(v.purchaseVerification)),
    "Verified purchase requires a verified source and an explicit purchase verification record",
  );
export const evidenceArtifactSchema = z
  .object({
    ...evidence,
    title: text(120),
    finding: text(),
    media: imageSchema.optional(),
  })
  .strict();
export const evidencePointSchema = z
  .object({
    ...evidence,
    date,
    value: z.number().finite().nonnegative().max(1e12),
    event: text(180),
  })
  .strict();

export type EvidenceRecordSource = z.infer<typeof provenanceSchema>;
/** Publication type excludes illustrative records; declarations are host-owned, never automatic verification. */
export type EvidenceSource = Exclude<EvidenceRecordSource, {status: "demo"}>;
export type TestimonialAuthor = z.infer<typeof testimonialAuthorSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type EvidenceMetric = z.infer<typeof evidenceMetricSchema>;
export type CaseStudyEvidence = z.infer<typeof caseStudyEvidenceSchema>;
export type Recognition = z.infer<typeof recognitionSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type EvidenceArtifact = z.infer<typeof evidenceArtifactSchema>;
export type EvidencePoint = z.infer<typeof evidencePointSchema>;
export { evidencePublicationIssues } from "./integrity";
