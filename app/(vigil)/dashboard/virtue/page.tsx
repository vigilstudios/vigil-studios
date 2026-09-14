import type { Metadata } from "next";
import { GatedFeature } from "@/components/vigil/GatedFeature";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";

export const metadata: Metadata = { title: "Virtue" };

export default async function VirtuePage() {
  const ctx = await requireOrgContext("/dashboard/virtue");
  const ent = await resolveEntitlements(ctx.organization.id);
  const enabled = ent.enabled(FEATURES.virtue);
  return (
    <GatedFeature
      title="Virtue"
      description="Virtue is the AI employee inside Vigil: lead follow-up, missed-call text-back, reviews and reactivation, configured for your business."
      planHint={enabled ? undefined : "Included with Vigil Growth and Priority."}
      comingSoon={enabled}
    />
  );
}
