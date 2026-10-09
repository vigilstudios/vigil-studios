import { z } from "zod";
import { buttonShapes, hoverEffects } from "../presentation/schema";
import { actionSchema } from "../site/action-schema";
import { coreIconNames } from "../icons/names";

export const actionPresentationSchema = z.object({
  shape: z.enum(buttonShapes).optional(), hover: z.enum(hoverEffects).optional(),
  variant: z.enum(["primary", "secondary", "outline", "ghost", "text", "underline", "inverse"]).optional(),
  size: z.enum(["small", "medium", "large", "display"]).optional(),
  icon: z.enum(coreIconNames).nullable().optional(),
  iconPosition: z.enum(["leading", "trailing"]).optional(),
  alignment: z.enum(["left", "center", "right"]).optional(),
  width: z.enum(["auto", "full"]).optional(),
  surface: z.enum(["inherit", "light", "dark", "brand"]).optional(),
}).strict();
export type ActionPresentation = z.infer<typeof actionPresentationSchema>;
export const actionSlotSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false), label: z.string().trim().min(1).max(120).optional(), action: actionSchema.optional(), presentation: actionPresentationSchema.optional() }).strict(),
  z.object({ enabled: z.literal(true), label: z.string().trim().min(1).max(120), action: actionSchema, presentation: actionPresentationSchema.optional() }).strict(),
]);
export type ActionSlot = z.infer<typeof actionSlotSchema>;
export type EnabledActionSlot = Extract<ActionSlot, { enabled: true }>;
export const contextualActionsSchema = z.object({
  primary: actionSlotSchema.optional(),
  secondary: actionSlotSchema.optional(),
  items: z.array(z.object({
    group: z.string().regex(/^[a-z][a-zA-Z]*$/).max(60),
    itemId: z.string().min(1).max(100),
    display: z.enum(["link", "media", "whole-item"]).default("link"),
    slot: actionSlotSchema,
  }).strict()).max(120).optional(),
}).strict().refine(value => new Set(value.items?.map(item => `${item.group}:${item.itemId}`)).size === (value.items?.length ?? 0), "Item actions must have unique stable identities.");
export type ContextualActions = z.infer<typeof contextualActionsSchema>;
export function contextualSlots(value?: ContextualActions): ActionSlot[] {
  return [value?.primary, value?.secondary, ...(value?.items?.map(item => item.slot) ?? [])].filter((slot): slot is ActionSlot => !!slot);
}
