import { z } from "zod";

/**
 * What the checkout form must contain before an order row is created. Kept
 * out of the server action so it can be tested on its own.
 */
export const checkoutSchema = z.object({
  email: z.string().trim().email("Enter the email you want to use to sign in."),
  contact_name: z.string().trim().max(120).optional().or(z.literal("")),
  business_name: z.string().trim().min(2, "Enter your business name.").max(120),
  plan_code: z.string().trim().min(1, "Choose a plan."),
  billing_period: z.enum(["month", "year", "year3"]).default("month"),
  project_kind: z.enum(["express", "professional", "custom"]).default("express"),
  template_slug: z.string().trim().max(80).optional().or(z.literal("")),
  order_id: z.string().uuid().optional().or(z.literal("")),
  checkout_token: z.string().trim().optional().or(z.literal("")),
  agree: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Field → messages, the shape the form renders. */
export function checkoutIssues(error: z.ZodError): Record<string, string[]> {
  const issues: Record<string, string[]> = {};
  for (const i of error.issues) (issues[i.path.join(".") || "_"] ??= []).push(i.message);
  return issues;
}
