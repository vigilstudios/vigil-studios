import { z } from "zod";
import { imageSchema as image, treatmentSchema } from "../media/types";
const text = (max = 220) => z.string().trim().min(1).max(max);
const id = text(80).regex(/^[a-z][a-z0-9-]*$/);

export const serviceDestinationSchema = z
  .object({
    label: text(80),
    href: text(1000).refine(
      (value) =>
        /^(#[a-zA-Z][\w-]*$|\/(?!\/)|https?:\/\/|mailto:|tel:)/.test(value) &&
        !/[\s\\\u0000-\u001f]/.test(value),
      "Use a safe client-owned destination.",
    ),
  })
  .strict();
const detail = serviceDestinationSchema.optional();
const item = { id, slug: id.optional(), title: text(100) };
const base = {
  eyebrow: text(100).optional(),
  title: text(180),
  introduction: text(600),
};
const unique = <T extends { id: string }>(rows: T[]) =>
  new Set(rows.map((r) => r.id)).size === rows.length;
const list = <T extends z.ZodTypeAny>(schema: T, min: number, max: number) =>
  z.array(schema).min(min).max(max);
export const serviceContentSchemas = {
  "services.offering-index": z
    .object({
      ...base,
      entries: list(
        z
          .object({
            ...item,
            summary: text(),
            deliverables: list(text(60), 2, 4),
            detail,
          })
          .strict(),
        3,
        7,
      ).refine(unique, "Entry IDs must be unique"),
    })
    .strict(),
  "services.capability-manifesto": z
    .object({
      ...base,
      promise: text(120),
      principles: list(
        z
          .object({ verb: text(28), pledge: text(160), boundary: text(120) })
          .strict(),
        3,
        5,
      ),
    })
    .strict(),
  "services.capability-desk": z
    .object({
      ...base,
      capabilities: list(
        z
          .object({
            ...item,
            category: text(32),
            description: text(),
            outcome: text(120),
            image,
            detail,
          })
          .strict(),
        4,
        8,
      ).refine(unique, "Capability IDs must be unique"),
    })
    .strict(),
  "services.expandable-offerings": z
    .object({
      ...base,
      services: list(
        z
          .object({
            ...item,
            summary: text(120),
            included: list(text(80), 2, 5),
            boundary: text(140),
            detail,
          })
          .strict(),
        5,
        10,
      ).refine(unique, "Service IDs must be unique"),
    })
    .strict(),
  "services.situation-responses": z
    .object({
      ...base,
      situations: list(
        z
          .object({
            need: text(120),
            response: text(140),
            outcome: text(120),
            evidence: text(160),
          })
          .strict(),
        3,
        5,
      ),
    })
    .strict(),
  "services.delivery-journey": z
    .object({
      ...base,
      stages: list(
        z
          .object({
            ...item,
            input: text(100),
            work: text(140),
            output: text(100),
            owner: text(60),
          })
          .strict(),
        3,
        6,
      ).refine(unique, "Stage IDs must be unique"),
    })
    .strict(),
  "services.capability-coverage": z
    .object({
      ...base,
      phases: list(text(32), 3, 4).refine(
        (values) => new Set(values).size === values.length,
        "Phase labels must be unique",
      ),
      groups: list(
        z
          .object({
            name: text(40),
            capabilities: list(
              z
                .object({
                  ...item,
                  coverage: list(z.enum(["Lead", "Support", "—"]), 3, 4),
                })
                .strict(),
              2,
              5,
            ).refine(unique, "Capability IDs must be unique"),
          })
          .strict(),
        3,
        4,
      ),
    })
    .strict()
    .refine(
      (v) =>
        v.groups.every((g) =>
          g.capabilities.every((c) => c.coverage.length === v.phases.length),
        ),
      "Every capability needs one coverage value per phase",
    )
    .refine(
      (v) =>
        unique(v.groups.flatMap((g) => g.capabilities)) &&
        new Set(v.groups.map((g) => g.name)).size === v.groups.length,
      "Group names and capability IDs must be unique",
    ),
  "services.connected-capabilities": z
    .object({
      ...base,
      input: text(80),
      output: text(80),
      layers: list(
        z
          .object({
            ...item,
            responsibility: text(100),
            components: list(text(50), 2, 4),
            handoff: text(80),
          })
          .strict(),
        3,
        5,
      ).refine(unique, "Layer IDs must be unique"),
    })
    .strict(),
  "services.service-field-atlas": z
    .object({
      ...base,
      plates: list(
        z
          .object({
            ...item,
            image,
            caption: text(160),
            application: text(140),
            detail,
          })
          .strict(),
        3,
        5,
      ).refine(unique, "Plate IDs must be unique"),
    })
    .strict(),
  "services.evidence-in-practice": z
    .object({
      ...base,
      cases: list(
        z
          .object({
            ...item,
            before: z
              .object({ image, label: text(60), note: text(140) })
              .strict(),
            after: z
              .object({ image, label: text(60), note: text(140) })
              .strict(),
            capability: text(80),
            evidence: text(180),
          })
          .strict(),
        2,
        4,
      ).refine(unique, "Case IDs must be unique"),
    })
    .strict(),
  "services.starting-point": z
    .object({
      ...base,
      question: text(100),
      paths: list(
        z
          .object({
            ...item,
            need: text(90),
            recommendation: text(100),
            reason: text(160),
            alternative: text(120),
            detail,
          })
          .strict(),
        3,
        5,
      ).refine(unique, "Path IDs must be unique"),
    })
    .strict(),
  "services.scope-companions": z
    .object({
      ...base,
      criteria: list(text(60), 5, 10).refine(
        (values) => new Set(values).size === values.length,
        "Criteria must be unique",
      ),
      offerings: list(
        z
          .object({
            ...item,
            bestFor: text(140),
            values: list(text(70), 5, 10),
            boundary: text(120),
            detail,
          })
          .strict(),
        2,
        3,
      ).refine(unique, "Offering IDs must be unique"),
    })
    .strict()
    .refine(
      (v) => v.offerings.every((o) => o.values.length === v.criteria.length),
      "Every offering needs a value for each comparison criterion",
    ),
};

const still = { structure: z.literal("authored"), motion: z.literal("none") };
const media = {
  structure: z.literal("authored"),
  motion: z.enum(["none", "media-reveal"]),
  treatment: treatmentSchema.extend({ geometry: z.literal("contained") }),
};
export const serviceSectionSchemas = {
  "services.offering-index": z
    .object({
      ...still,
      content: serviceContentSchemas["services.offering-index"],
    })
    .strict(),
  "services.capability-manifesto": z
    .object({
      ...still,
      content: serviceContentSchemas["services.capability-manifesto"],
    })
    .strict(),
  "services.capability-desk": z
    .object({
      ...media,
      content: serviceContentSchemas["services.capability-desk"],
      initialSelectedId: id.optional(),
    })
    .strict()
    .refine(
      (v) =>
        !v.initialSelectedId ||
        v.content.capabilities.some((item) => item.id === v.initialSelectedId),
      "Selected ID must belong to this section",
    ),
  "services.expandable-offerings": z
    .object({
      ...still,
      content: serviceContentSchemas["services.expandable-offerings"],
    })
    .strict(),
  "services.situation-responses": z
    .object({
      ...still,
      content: serviceContentSchemas["services.situation-responses"],
    })
    .strict(),
  "services.delivery-journey": z
    .object({
      ...still,
      content: serviceContentSchemas["services.delivery-journey"],
    })
    .strict(),
  "services.capability-coverage": z
    .object({
      ...still,
      content: serviceContentSchemas["services.capability-coverage"],
    })
    .strict(),
  "services.connected-capabilities": z
    .object({
      ...still,
      content: serviceContentSchemas["services.connected-capabilities"],
    })
    .strict(),
  "services.service-field-atlas": z
    .object({
      ...media,
      content: serviceContentSchemas["services.service-field-atlas"],
    })
    .strict(),
  "services.evidence-in-practice": z
    .object({
      ...media,
      content: serviceContentSchemas["services.evidence-in-practice"],
      initialSelectedId: id.optional(),
    })
    .strict()
    .refine(
      (v) =>
        !v.initialSelectedId ||
        v.content.cases.some((item) => item.id === v.initialSelectedId),
      "Selected ID must belong to this section",
    ),
  "services.starting-point": z
    .object({
      ...still,
      content: serviceContentSchemas["services.starting-point"],
      initialSelectedId: id.optional(),
    })
    .strict()
    .refine(
      (v) =>
        !v.initialSelectedId ||
        v.content.paths.some((item) => item.id === v.initialSelectedId),
      "Selected ID must belong to this section",
    ),
  "services.scope-companions": z
    .object({
      ...still,
      content: serviceContentSchemas["services.scope-companions"],
      initialBaselineId: id.optional(),
      initialCandidateId: id.optional(),
    })
    .strict()
    .refine(
      (v) =>
        [v.initialBaselineId, v.initialCandidateId].every(
          (id) => !id || v.content.offerings.some((item) => item.id === id),
        ),
      "Comparison IDs must belong to this section",
    ),
} as const;
export type ServiceSectionId = keyof typeof serviceSectionSchemas;
export type ServiceContent<K extends ServiceSectionId> = z.infer<
  (typeof serviceContentSchemas)[K]
>;
