import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWebsiteMeasurements } from "@/lib/vigil/queries/measurements";
import { WebsiteMeasurementsView } from "@/components/vigil/WebsiteMeasurements";
import { PageHeader } from "@/components/vigil/ui";
export const metadata: Metadata = { title: "Website analytics" };
export default async function WebsiteAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ website?: string }>;
}) {
  const ctx = await requireOrgContext("/dashboard/analytics"),
    client = await createClient();
  const { data: sites, error } = await client
    .from("websites")
    .select("id,name,status")
    .eq("organization_id", ctx.organization.id)
    .order("created_at");
  if (error) throw error;
  const selected = (await searchParams).website,
    site = selected
      ? sites?.find((row) => row.id === selected)
      : (sites?.find((row) => row.status === "live") ?? sites?.[0]);
  if (selected && !site) notFound();
  if (!site)
    return (
      <PageHeader
        title="Website analytics"
        description="Reports will become available when your website is ready."
      />
    );
  const measurements = await getWebsiteMeasurements(
    client,
    ctx.organization.id,
    site.id,
  );
  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title="Website analytics"
        description="Traffic, search visibility, speed and security checks, with the evidence behind each result."
        actions={
          <Link
            href={`/dashboard?website=${site.id}`}
            className="btn-secondary text-sm"
          >
            Back to overview
          </Link>
        }
      />
      {(sites?.length ?? 0) > 1 ? (
        <form method="get" className="vm-site-picker">
          <label htmlFor="measurement-website">Website</label>
          <select
            id="measurement-website"
            name="website"
            defaultValue={site.id}
          >
            {sites?.map((row) => (
              <option value={row.id} key={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <button className="btn-secondary text-sm" type="submit">
            View reports
          </button>
        </form>
      ) : null}
      <WebsiteMeasurementsView data={measurements} />
    </div>
  );
}
