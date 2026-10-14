import type { Metadata } from "next";
import { GatedFeature } from "@/components/vigil/GatedFeature";
import { requireOrgContext } from "@/lib/vigil/auth/session";

export const metadata: Metadata = { title: "Virtue" };

export default async function VirtuePage() {
  await requireOrgContext("/dashboard/virtue");
  return (
    <GatedFeature
      title="Virtue"
      description="Virtue is the AI employee inside Vigil: lead follow-up, missed-call text-back, reviews and reactivation, configured for your business."
      previewKind="virtue"
      availability="coming_soon"
      comingSoon
    />
  );
}
