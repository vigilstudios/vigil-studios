import { z } from "zod";
import { imageSchema, videoSchema } from "../media/types";
import { evidenceIdSchema, testimonialAuthorSchema, testimonialSchema, evidenceMetricSchema, caseStudyEvidenceSchema, recognitionSchema, reviewSchema, evidenceArtifactSchema, evidencePointSchema, provenanceSchema, evidencePublicationIssues } from "../evidence/types";
const text = (max = 500) => z.string().trim().min(1).max(max);
const base = { title: text(180), introduction: text(600), eyebrow: text(100).optional() };
const unique = <T extends { id: string }>(v:T[]) => new Set(v.map(i=>i.id)).size === v.length;
export const evidenceContentSchemas = {
  "proof.margin-voice": z.object({ ...base, testimony: testimonialSchema, annotation: text(300) }).strict(),
  "proof.outcome-equation": z
    .object({ ...base, result: evidenceMetricSchema, explanation: text(), voice: testimonialSchema })
    .strict(),
  "proof.change-dossier": z
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
      result: evidenceMetricSchema,
      voice: testimonialSchema,
      limitation: text(),
    })
    .strict(),
  "proof.case-cross-section": z.object({ ...base, case: caseStudyEvidenceSchema }).strict(),
  "proof.credential-library": z
    .object({ ...base, records: z.array(recognitionSchema).min(3).max(12).refine(unique) })
    .strict(),
  "proof.moving-chorus": z.object({ ...base, voices: z.array(testimonialSchema).min(3).max(24).refine(unique, "Distinct voice IDs required") }).strict(),
  "proof.review-reading-room": z
    .object({
      ...base,
      reviews: z.array(reviewSchema).min(3).max(30).refine(unique),
      selectionPolicy: text(),
    })
    .strict(),
  "proof.in-conversation": z
    .object({
      ...base,
      speaker: testimonialAuthorSchema,
      provenance: provenanceSchema,
      still: imageSchema.optional(),
      video: videoSchema.optional(),
      exchanges: z
        .array(z.object({ question: text(180), answer: text(1000) }).strict())
        .min(2)
        .max(6),
    })
    .strict(),
  "proof.relationship-register": z
    .object({
      ...base,
      relationships: z
        .array(
          z
            .object({
              id: evidenceIdSchema, provenance: provenanceSchema,
              organization: text(100),
              logo: imageSchema.optional(),
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
        .max(18).refine(unique),
    })
    .strict(),
  "proof.progress-trail": z
    .object({
      ...base,
      label: text(100),
      unit: text(40),
      basis: text(),
      points: z.array(evidencePointSchema).min(3).max(6).refine(unique),
    })
    .strict()
    .refine(
      (v) => v.points.every((p, i) => !i || p.date > v.points[i - 1].date),
      "Unique chronological measurement dates required",
    ),
  "proof.evidence-desk": z
    .object({
      ...base,
      claim: text(220),
      qualification: text(),
      artifacts: z.array(evidenceArtifactSchema).min(2).max(5).refine(unique),
    })
    .strict(),
  "proof.story-switchboard": z
    .object({ ...base, stories: z.array(caseStudyEvidenceSchema).min(2).max(6).refine(unique) })
    .strict(),
};

export type EvidenceSectionId = keyof typeof evidenceContentSchemas;
export type EvidenceContent<K extends EvidenceSectionId> = z.infer<(typeof evidenceContentSchemas)[K]>;
export const chorusOptions = {
 layout: ["ribbon", "columns", "perspective"],
 columns: ["two", "three"],
 visualStyle: ["typographic", "editorial", "portrait-led", "compact"],
 alignment: ["left", "center", "right"],
 quoteScale: ["restrained", "standard", "large", "display"],
 authorTreatment: ["text-only", "compact", "avatar", "portrait", "organization"],
 surface: ["transparent", "surface", "framed", "full-bleed"],
 direction: ["left", "right"],
 speed: ["slow", "medium", "fast"],
 intensity: ["subtle", "standard", "expressive"],
 pauseOnHover: ["yes", "no"],
 pauseOnFocus: ["yes"],
 edgeFade: ["none", "soft"],
 gap: ["compact", "regular", "spacious"],
} as const;
export const chorusDefaults = { layout:"ribbon", columns:"three", visualStyle:"typographic", alignment:"center", quoteScale:"standard", authorTreatment:"text-only", surface:"transparent", direction:"left", speed:"slow", intensity:"standard", pauseOnHover:"yes", pauseOnFocus:"yes", edgeFade:"soft", gap:"regular" } as const;
export const chorusConfiguration = Object.entries(chorusOptions).map(([name,options])=>({name,options}));
export const chorusSettingsSchema = z.object({
 layout:z.enum(chorusOptions.layout).default("ribbon"), columns:z.enum(chorusOptions.columns).default("three"),
 visualStyle:z.enum(chorusOptions.visualStyle), alignment:z.enum(chorusOptions.alignment), quoteScale:z.enum(chorusOptions.quoteScale), authorTreatment:z.enum(chorusOptions.authorTreatment), surface:z.enum(chorusOptions.surface), direction:z.enum(chorusOptions.direction), speed:z.enum(chorusOptions.speed), intensity:z.enum(chorusOptions.intensity), pauseOnHover:z.enum(chorusOptions.pauseOnHover), pauseOnFocus:z.enum(chorusOptions.pauseOnFocus), edgeFade:z.enum(chorusOptions.edgeFade), gap:z.enum(chorusOptions.gap)
}).strict();
export type ChorusSettings = z.infer<typeof chorusSettingsSchema>;
/** No motion mode can publish placeholder evidence. The explicit Lab envelope keeps it visible. */
const integrity = <T extends {content:unknown;evidenceMode:"publication"|"illustrative"}>(v:T,ctx:z.RefinementCtx) => {
 if(v.evidenceMode === "publication") evidencePublicationIssues(v.content).forEach(message=>ctx.addIssue({code:z.ZodIssueCode.custom,path:["content"],message}));
};
const common = { structure:z.literal("authored"), evidenceMode:z.enum(["publication","illustrative"]).default("publication") };
export const evidenceSectionSchemas = {
 "proof.margin-voice": z.object({...common, motion:z.enum(["none","media-reveal"]), content:evidenceContentSchemas["proof.margin-voice"]}).strict().superRefine(integrity),
 "proof.outcome-equation": z.object({...common, motion:z.enum(["none","fade"]), content:evidenceContentSchemas["proof.outcome-equation"]}).strict().superRefine(integrity),
 "proof.change-dossier": z.object({...common, motion:z.enum(["none","media-reveal"]), content:evidenceContentSchemas["proof.change-dossier"]}).strict().superRefine(integrity),
 "proof.case-cross-section": z.object({...common, motion:z.enum(["none","media-reveal"]), content:evidenceContentSchemas["proof.case-cross-section"]}).strict().superRefine(integrity),
 "proof.credential-library": z.object({...common, motion:z.enum(["none","fade"]), content:evidenceContentSchemas["proof.credential-library"]}).strict().superRefine(integrity),
 "proof.moving-chorus": z.object({...common, motion:z.enum(["none","marquee"]), content:evidenceContentSchemas["proof.moving-chorus"], ...chorusSettingsSchema.shape}).strict().superRefine(integrity),
 "proof.review-reading-room": z.object({...common, motion:z.literal("none"), content:evidenceContentSchemas["proof.review-reading-room"]}).strict().superRefine(integrity),
 "proof.in-conversation": z.object({...common, motion:z.enum(["none","media-reveal"]), content:evidenceContentSchemas["proof.in-conversation"]}).strict().superRefine(integrity),
 "proof.relationship-register": z.object({...common, motion:z.enum(["none","fade"]), content:evidenceContentSchemas["proof.relationship-register"]}).strict().superRefine(integrity),
 "proof.progress-trail": z.object({...common, motion:z.enum(["none","stagger"]), content:evidenceContentSchemas["proof.progress-trail"]}).strict().superRefine(integrity),
 "proof.evidence-desk": z.object({...common, motion:z.enum(["none","media-reveal"]), content:evidenceContentSchemas["proof.evidence-desk"]}).strict().superRefine(integrity),
 "proof.story-switchboard": z.object({...common, motion:z.enum(["none","fade"]), content:evidenceContentSchemas["proof.story-switchboard"]}).strict().superRefine(integrity),
} as const;

export type Transformation = EvidenceContent<"proof.change-dossier">;
export type InterviewEvidence = EvidenceContent<"proof.in-conversation">;
export type ClientRelationship = EvidenceContent<"proof.relationship-register">["relationships"][number];
