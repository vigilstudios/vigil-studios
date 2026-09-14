import type { Metadata } from "next";
import { GatedFeature } from "@/components/vigil/GatedFeature";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const ctx = await requireOrgContext("/dashboard/insights");
  const ent = await resolveEntitlements(ctx.organization.id);
  const enabled = ent.enabled(FEATURES.insights);
  return (
    <GatedFeature
      title="Insights"
      description="Plain-language reporting on how your website and follow-up are performing, without dashboards to configure."
      planHint={enabled ? undefined : "Available on Vigil Growth and Priority."}
      comingSoon={enabled}
    />
  );
}
