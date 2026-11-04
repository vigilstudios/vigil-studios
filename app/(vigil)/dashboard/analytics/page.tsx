import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWebsiteMeasurements } from "@/lib/vigil/queries/measurements";
import { WebsiteReport } from "@/components/vigil/WebsiteReport";
import {
  measurementRange,
  measurementReport,
  measurementReports,
} from "@/lib/vigil/measurements/navigation";
import { PageHeader } from "@/components/vigil/ui";
export const metadata: Metadata = { title: "Overview report" };
export default async function WebsiteAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ website?: string; range?: string; report?: string }>;
}) {
  const ctx = await requireOrgContext("/dashboard/analytics"),
    client = await createClient();
  const { data: sites, error } = await client
    .from("websites")
    .select("id,name,status")
    .eq("organization_id", ctx.organization.id)
    .order("created_at");
  if (error) throw error;
  const query = await searchParams;
  const range = measurementRange(query.range),
    report = measurementReport(query.report);
  const selected =
      typeof query.website === "string" ? query.website : undefined,
    site = selected
      ? sites?.find((row) => row.id === selected)
      : (sites?.find((row) => row.status === "live") ?? sites?.[0]);
  if (selected && !site) notFound();
  if (!site)
    return (
      <PageHeader
        title={measurementReports[report].title}
        description="Reports will become available when your website is ready."
      />
    );
  const measurements = await getWebsiteMeasurements(
    client,
    ctx.organization.id,
    site.id,
  );
  return (
    <WebsiteReport
      site={site}
      sites={sites ?? []}
      data={measurements}
      report={report}
      range={range}
    />
  );
}
