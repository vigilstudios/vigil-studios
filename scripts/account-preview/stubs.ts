import type { ActionResult } from "@/lib/vigil/auth/errors";
const preview = async (): Promise<ActionResult> => ({
  ok: false,
  error: "Fictional preview. No changes were made.",
});
export const signInWithEmail = preview,
  signInWithPassword = preview,
  registerWithPassword = preview,
  signInWithGoogle = preview,
  saveAccountName = preview;
export async function getMyPurchases() {
  return [];
}
export const openPurchasedBusiness = preview;
export const accountRows = [
  {
    id: "da000000-0000-4000-8000-000000000001",
    full_name: "Avery Parker",
    email: "avery@example.test",
    created_at: "2026-11-07T14:00:00Z",
    email_verified: true,
    purchase_count: 0,
    pending_count: 0,
    refunded_count: 0,
    live_sites: 0,
    businesses: [],
  },
  {
    id: "da000000-0000-4000-8000-000000000002",
    full_name: "Jordan Rivera",
    email: "jordan@example.test",
    created_at: "2026-11-06T14:00:00Z",
    email_verified: true,
    purchase_count: 1,
    pending_count: 0,
    refunded_count: 0,
    live_sites: 0,
    businesses: [
      { id: "da000000-0000-4000-8000-000000000012", name: "Marlow Kitchen" },
    ],
  },
  {
    id: "da000000-0000-4000-8000-000000000003",
    full_name: "Jamie Chen",
    email: "jamie@example.test",
    created_at: "2026-11-05T14:00:00Z",
    email_verified: true,
    purchase_count: 0,
    pending_count: 1,
    refunded_count: 0,
    live_sites: 0,
    businesses: [],
  },
  {
    id: "da000000-0000-4000-8000-000000000004",
    full_name: "Morgan Lee",
    email: "morgan@example.test",
    created_at: "2026-10-30T14:00:00Z",
    email_verified: true,
    purchase_count: 1,
    pending_count: 0,
    refunded_count: 0,
    live_sites: 1,
    businesses: [
      { id: "da000000-0000-4000-8000-000000000013", name: "Oak & Stone" },
    ],
  },
];
