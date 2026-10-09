import { z } from "zod";
import { actionPresentationSchema } from "../actions/schema";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color.");
export const inquiryFormAppearanceSchema = z.object({
  treatment: z.enum(["minimal", "outline", "panel"]).optional(),
  shape: z.enum(["square", "soft", "rounded"]).optional(),
  fieldStyle: z.enum(["underline", "outline", "filled"]).optional(),
  fieldShape: z.enum(["square", "soft", "rounded"]).optional(),
  columns: z.union([z.literal(1), z.literal(2)]).optional(),
  alignment: z.enum(["left", "center", "right"]).optional(),
  headingAlignment: z.enum(["left", "center", "right"]).optional(),
  maxWidth: z.number().min(320).max(1400).optional(),
  padding: z.number().min(0).max(80).optional(),
  gap: z.number().min(8).max(56).optional(),
  fieldHeight: z.number().min(40).max(80).optional(),
  textareaRows: z.number().int().min(3).max(12).optional(),
  titleSize: z.number().min(18).max(64).optional(),
  labelSize: z.number().min(10).max(20).optional(),
  textSize: z.number().min(14).max(24).optional(),
  labelCase: z.enum(["normal", "uppercase"]).optional(),
  background: color.optional(), fieldBackground: color.optional(),
  textColor: color.optional(), borderColor: color.optional(), focusColor: color.optional(),
  submit: actionPresentationSchema.optional(),
}).strict();
export type InquiryFormAppearance = z.infer<typeof inquiryFormAppearanceSchema>;
export const inquiryFormDefaults = {
  treatment: "minimal", shape: "square", fieldStyle: "underline", fieldShape: "square",
  columns: 2, alignment: "center", headingAlignment: "left", maxWidth: 1080,
  padding: 0, gap: 28, fieldHeight: 52, textareaRows: 5,
  titleSize: 36, labelSize: 12, textSize: 16, labelCase: "uppercase",
} as const satisfies InquiryFormAppearance;
export const inquiryFormPresets = {
  editorial: { ...inquiryFormDefaults, submit: { shape: "square", variant: "outline", hover: "color", icon: "arrow-up-right", size: "medium" } },
  minimal: { ...inquiryFormDefaults, fieldStyle: "outline", labelCase: "normal", gap: 20, titleSize: 28, submit: { shape: "square", variant: "primary", hover: "lift" } },
  soft: { ...inquiryFormDefaults, treatment: "panel", shape: "rounded", fieldStyle: "filled", fieldShape: "soft", padding: 32, gap: 24, titleSize: 32, labelCase: "normal", submit: { shape: "soft", variant: "primary", hover: "lift", width: "full" } },
} as const satisfies Record<string, InquiryFormAppearance>;
