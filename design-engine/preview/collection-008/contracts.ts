import { z } from "zod";
import { imageSchema, videoSchema } from "../../media/types";
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
const sourceFields = {
  source: text(180),
  timeframe: text(100),
  context: text(),
  attribution: text(180),
};
/** A provenance declaration is not an automatic truth/permission verifier. Study-only contracts. */
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
const evidence = { provenance: provenanceSchema };
const person = z
  .object({ name: text(80), role: text(120), organization: text(100) })
  .strict();
const testimony = z
  .object({
    ...evidence,
    quote: text(1000),
    author: person,
    portrait: imageSchema.optional(),
  })
  .strict();
const metric = z
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
const base = { title: text(160), introduction: text(500) };
const caseRecord = z
  .object({
    client: text(100),
    challenge: text(),
    intervention: text(),
    result: metric,
    voice: testimony,
    media: imageSchema.optional(),
    destination,
  })
  .strict();
const recognition = z
  .object({
    ...evidence,
    organization: text(100),
    kind: z.enum(["award", "certification", "press", "partner"]),
    title: text(140),
    scope: text(220),
    year: z.number().int().min(1900).max(2200),
    expires: date.optional(),
  })
  .strict();
const review = z
  .object({
    ...evidence,
    quote: text(700),
    author: person,
    rating: z.number().int().min(1).max(5),
    date,
    platform: text(80),
    verifiedPurchase: z.boolean(),
  })
  .strict()
  .refine(
    (v) => !v.verifiedPurchase || v.provenance.status === "verified",
    "Verified purchase requires verified source evidence",
  );
const artifact = z
  .object({
    ...evidence,
    title: text(120),
    finding: text(),
    media: imageSchema.optional(),
  })
  .strict();
const point = z
  .object({
    ...evidence,
    date,
    value: z.number().finite().nonnegative().max(1e12),
    event: text(180),
  })
  .strict();
export const proofStudySchemas = {
  E01: z.object({ ...base, testimony, annotation: text(300) }).strict(),
  E02: z
    .object({ ...base, result: metric, explanation: text(), voice: testimony })
    .strict(),
  E03: z
    .object({
      ...base,
      subject: text(120),
      baseline: z
        .object({
          title: text(100),
          body: text(),
          media: imageSchema.optional(),
        })
        .strict(),
      intervention: z
        .object({ title: text(100), body: text(), duration: text(100) })
        .strict(),
      outcome: z
        .object({
          title: text(100),
          body: text(),
          media: imageSchema.optional(),
        })
        .strict(),
      result: metric,
      voice: testimony,
      limitation: text(),
    })
    .strict(),
  E04: z.object({ ...base, case: caseRecord }).strict(),
  E05: z
    .object({ ...base, records: z.array(recognition).min(3).max(12) })
    .strict(),
  E06: z.object({ ...base, voices: z.array(testimony).min(4).max(9) }).strict(),
  E07: z
    .object({
      ...base,
      reviews: z.array(review).min(3).max(30),
      selectionPolicy: text(),
    })
    .strict(),
  E08: z
    .object({
      ...base,
      speaker: person,
      provenance: provenanceSchema,
      still: imageSchema.optional(),
      video: videoSchema.optional(),
      exchanges: z
        .array(z.object({ question: text(180), answer: text(1000) }).strict())
        .min(2)
        .max(6),
    })
    .strict(),
  E09: z
    .object({
      ...base,
      relationships: z
        .array(
          z
            .object({
              ...evidence,
              organization: text(100),
              role: text(140),
              since: z.number().int().min(1900).max(2200),
              through: z.number().int().min(1900).max(2200),
              outcome: text(260),
            })
            .strict()
            .refine(
              (v) => v.through >= v.since,
              "Relationship dates must be chronological",
            ),
        )
        .min(4)
        .max(18),
    })
    .strict(),
  E10: z
    .object({
      ...base,
      label: text(100),
      unit: text(40),
      basis: text(),
      points: z.array(point).min(3).max(6),
    })
    .strict()
    .refine(
      (v) => v.points.every((p, i) => !i || p.date > v.points[i - 1].date),
      "Unique chronological measurement dates required",
    ),
  E11: z
    .object({
      ...base,
      claim: text(220),
      qualification: text(),
      artifacts: z.array(artifact).min(2).max(5),
    })
    .strict(),
  E12: z
    .object({ ...base, stories: z.array(caseRecord).min(2).max(6) })
    .strict(),
};
export type ProofId = keyof typeof proofStudySchemas;
export type ProofContent<K extends ProofId> = z.infer<
  (typeof proofStudySchemas)[K]
>;
export type ProofModel = {
  [K in ProofId]: { id: K; content: ProofContent<K> };
}[ProofId];
export type Testimony = z.infer<typeof testimony>;
export type Metric = z.infer<typeof metric>;
export type EvidenceCase = z.infer<typeof caseRecord>;
/** Future publication preflight, not a production component or automatic approval gate. */
export function evidencePublicationIssues(model: ProofModel): string[] {
  const issues: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (!value || typeof value !== "object") return;
    if ("status" in value && value.status === "demo")
      issues.push(`${path}: demo evidence cannot be published`);
    Object.entries(value).forEach(([key, item]) =>
      walk(item, `${path}.${key}`),
    );
  };
  const parsed = proofStudySchemas[model.id].safeParse(model.content);
  if (!parsed.success)
    return parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  walk(parsed.data, model.id);
  return issues;
}
