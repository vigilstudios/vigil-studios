import type { Metadata } from "next";
import { GatedFeature } from "@/components/vigil/GatedFeature";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  const ctx = await requireOrgContext("/dashboard/leads");
  const ent = await resolveEntitlements(ctx.organization.id);
  const enabled = ent.enabled(FEATURES.leads);
  return (
    <GatedFeature
      title="Leads"
      description="Every enquiry from your website, missed call or text, in one place, with follow-up handled by Virtue."
      planHint={enabled ? undefined : "Available on Vigil Growth and Priority."}
      comingSoon={enabled}
    />
  );
}
