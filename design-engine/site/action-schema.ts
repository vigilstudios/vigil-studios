import { z } from "zod";
const id = z.string().regex(/^[a-z][a-z0-9-]*$/).max(100);
export const safeHref = z.string().trim().min(1).max(2000).refine(value => /^(#|\/(?!\/)|https?:\/\/|mailto:|tel:)/.test(value) && !/[\\\x00-\x20\x7f]/.test(value), "Use a safe destination.");
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("page"), pageId: id }).strict(),
  z.object({ type: z.literal("section"), pageId: id, sectionId: id }).strict(),
  z.object({ type: z.literal("external"), url: z.string().url().refine(value => /^https?:\/\//.test(value) && !/[\\\x00-\x20\x7f]/.test(value)) }).strict(),
  z.object({ type: z.literal("email"), email: z.string().email() }).strict(),
  z.object({ type: z.literal("phone"), phone: z.string().regex(/^\+?[0-9(). -]{3,40}$/) }).strict(),
  z.object({ type: z.literal("download"), url: safeHref.refine(value => /^(\/(?!\/)|https?:\/\/)/.test(value)), filename: z.string().regex(/^[^/\\\x00-\x1f]{1,180}$/).optional() }).strict(),
]);
export type Action = z.infer<typeof actionSchema>;
export const actionBindingSchema = z.object({
  path: z.array(z.union([z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/).refine(value => !["constructor", "prototype", "__proto__"].includes(value)), z.number().int().nonnegative()])).min(2).max(30),
  action: actionSchema,
}).strict().refine(binding => binding.path[0] === "content" && (binding.path.at(-1) === "href" || binding.path.length === 2 && binding.path[1] === "home"), "Actions bind only to existing content href fields or the Navigation home destination.");
export type ActionBinding = z.infer<typeof actionBindingSchema>;
export const navigationSourceSchema = z.object({ mode: z.literal("site"), depth: z.enum(["all", "top-level"]).default("all"), pageIds: z.array(id).optional() }).strict();
export type NavigationSource = z.infer<typeof navigationSourceSchema>;
