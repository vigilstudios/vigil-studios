import type { Metadata } from "next";
import { Card, DefinitionList, EmptyState, PageHeader, StatusPill } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { formatDateTime, formatRelative } from "@/lib/vigil/format";
import { describeProjectStatus, describeWebsiteStatus } from "@/lib/vigil/lifecycle";
import { getOrgProjects, getOrgWebsites, getRecentDeployments } from "@/lib/vigil/queries/dashboard";
import { SiteFrame } from "@/components/vigil/SiteFrame";
import { previewSource } from "@/lib/vigil/presenters";

export const metadata: Metadata = { title: "Website" };

export default async function WebsitePage() {
  const ctx = await requireOrgContext("/dashboard/website");
  const [websites, projects] = await Promise.all([getOrgWebsites(ctx.organization.id), getOrgProjects(ctx.organization.id)]);

  if (websites.length === 0) {
    const project = projects[0] ?? null;
    return (
      <div>
        <PageHeader title="Website" description="Status of the website Vigil hosts and operates for you." />
        {project ? (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{project.name}</h2>
              <StatusPill tone={describeProjectStatus(project.status).tone}>{describeProjectStatus(project.status).label}</StatusPill>
            </div>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              Your website will appear here once it is published. Until then, this page tracks the build.
            </p>
          </Card>
        ) : (
          <EmptyState title="No website yet" description="When Vigil Studios starts building your site, its status will show here." />
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Website" description="Status of the website Vigil hosts and operates for you." />
      <div className="space-y-4">
        {await Promise.all(
          websites.map(async (site) => {
            const status = describeWebsiteStatus(site.status);
            const deployments = await getRecentDeployments(site.id);
            const lastPublish = deployments.find((d) => d.environment === "production" && d.status === "ready");
            const preview = previewSource(site, projects.find((p) => p.id === site.project_id)?.template_slug ?? null);
            return (
              <Card key={site.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{site.name}</h2>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
                {preview.kind !== "none" ? (
                  <div className="mt-3">
                    <SiteFrame src={preview.src} address={preview.address} title={`${site.name} preview`} />
                    {preview.kind === "template" ? (
                      <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">Showing the template your site is built from; your content replaces this as the build progresses.</p>
                    ) : null}
                  </div>
                ) : null}
                {site.status_reason ? (
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{site.status_reason}</p>
                ) : status.hint ? (
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{status.hint}</p>
                ) : null}
                <DefinitionList
                  items={[
                    {
                      label: "Live address",
                      value: site.live_url ? (
                        <a className="underline" href={site.live_url} target="_blank" rel="noreferrer">
                          {site.live_url.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "Not published yet"
                      ),
                    },
                    { label: "SSL and security", value: site.status === "live" ? <span className="text-[color:var(--accent)]">Active</span> : "—" },
                    { label: "Last published", value: lastPublish ? formatRelative(lastPublish.finished_at ?? lastPublish.created_at) : formatDateTime(site.last_deployed_at) },
                    { label: "Site code ownership", value: site.code_ownership === "customer_owned" ? "Yours (export eligible)" : "Vigil" },
                  ]}
                />
                <p className="mt-3 text-xs text-[color:var(--text-secondary)]">
                  Want something changed? Use Requests, or reply to any email from Vigil Studios.
                </p>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
