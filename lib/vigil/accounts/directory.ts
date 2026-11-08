import { z } from "zod";
export const accountFilters = [
  "all",
  "purchased",
  "no_purchase",
  "pending",
  "active",
] as const;
export type AccountFilter = (typeof accountFilters)[number];
export const accountFilterLabels: Record<AccountFilter, string> = {
  all: "All accounts",
  purchased: "Purchased",
  no_purchase: "No purchase",
  pending: "Checkout started",
  active: "Live websites",
};
export const accountDirectorySchema = z.object({
  total: z.number(),
  counts: z.object({
    all: z.number(),
    purchased: z.number(),
    no_purchase: z.number(),
    pending: z.number(),
    active: z.number(),
  }),
  rows: z.array(
    z.object({
      id: z.string(),
      full_name: z.string().nullable(),
      email: z.string(),
      created_at: z.string(),
      email_verified: z.boolean(),
      purchase_count: z.number(),
      pending_count: z.number(),
      refunded_count: z.number(),
      live_sites: z.number(),
      businesses: z.array(z.object({ id: z.string(), name: z.string() })),
    }),
  ),
});
export type CustomerAccount = z.infer<
  typeof accountDirectorySchema
>["rows"][number];
export function accountStatus(
  a: Pick<
    CustomerAccount,
    "purchase_count" | "pending_count" | "refunded_count"
  >,
) {
  return a.purchase_count > 0
    ? "Purchased"
    : a.pending_count > 0
      ? "Checkout started"
      : a.refunded_count > 0
        ? "Refunded"
        : "No purchase";
}
