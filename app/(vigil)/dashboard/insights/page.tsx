import type { Metadata } from "next";
import { GatedFeature } from "@/components/vigil/GatedFeature";
import { requireOrgContext } from "@/lib/vigil/auth/session";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  await requireOrgContext("/dashboard/insights");
  return (
    <GatedFeature
      title="Insights"
      description="Plain-language reporting on how your website and follow-up are performing, without dashboards to configure."
      previewKind="insights"
      availability="coming_soon"
      comingSoon
    />
  );
}
