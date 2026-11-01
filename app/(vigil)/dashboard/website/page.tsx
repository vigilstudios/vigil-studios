import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { isWebsiteLive, previewSource, showWebsitePreview } from "@/lib/vigil/presenters";
import { previewProject } from "@/lib/vigil/overview/preview-model";
import { getCustomerExpressPreviewReview, getOrgDomains, getOrgProjects, getOrgSubscription, getOrgWebsites, getRecentDeployments } from "@/lib/vigil/queries/dashboard";
import { getCustomerProjectReviews } from "@/lib/vigil/queries/reviews";
import { getPreviewOverviewPalette } from "@/lib/vigil/queries/preview-overview-palette";
import { WebsitePreviewWorkspace } from "@/components/vigil/overview/WebsitePreviewWorkspace";
import { DeploymentStatusRefresh } from "@/components/vigil/DeploymentStatusRefresh";
import { EmptyState } from "@/components/vigil/ui";

export const metadata: Metadata = { title: "Website Preview" };

export default async function WebsitePage() {
  const ctx = await requireOrgContext("/dashboard/website");
  const orgId = ctx.organization.id;
  const [websites, projects, domains, subscription, ent] = await Promise.all([
    getOrgWebsites(orgId), getOrgProjects(orgId), getOrgDomains(orgId),
    getOrgSubscription(orgId), resolveEntitlements(orgId),
  ]);
  if (!showWebsitePreview(websites)) redirect("/dashboard");
  const canRequest = ent.enabled(FEATURES.requests);
  const canExport = ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating;
  const client = await createClient();
  const sites = websites.filter(site => !isWebsiteLive(site));
  const targets = sites.length
    ? sites.map(website => ({ website, project: previewProject(projects, website) }))
    : [{ website: null, project: previewProject(projects, null) }];

  return (
    <div className="ov-dashboard pv-dashboard wp-dashboard">
      <DeploymentStatusRefresh active={sites.some(site => ["provisioning", "building"].includes(site.status))} />
      <header className="ov-page-header">
        <h1 className="ov-eyebrow">{ctx.organization.name}<span>/</span>Website preview</h1>
        <Link className="ov-button" href="/dashboard">Overview<ArrowUpRight size={12} /></Link>
      </header>
      {sites.length > 1 ? <nav className="wp-site-jump" aria-label="Your website previews">{sites.map(site => <a key={site.id} href={`#website-${site.id}`}>{site.name}</a>)}</nav> : null}
      {await Promise.all(targets.map(async ({ website, project }) => {
        if (!website && !project) return <EmptyState key="empty" title="No website yet" description="When Vigil starts your project, this is where you can explore your design and review each build." />;
        const templateSlug = website?.template_slug ?? project?.template_slug ?? null;
        const preview = previewSource(website, templateSlug);
        const domain = domains.find(row => row.id === website?.primary_domain_id && row.website_id === website?.id) ?? domains.find(row => row.website_id === website?.id) ?? null;
        const [deployments, professionalReview, expressReview, accent] = await Promise.all([
          website ? getRecentDeployments(website.id, 5) : [],
          project?.kind === "professional" ? getCustomerProjectReviews(project.id) : null,
          website && project?.kind === "express" ? getCustomerExpressPreviewReview(website.id) : null,
          getPreviewOverviewPalette(client, website, preview, templateSlug),
        ]);
        return <WebsitePreviewWorkspace key={website?.id ?? project?.id} website={website} project={project} domain={domain} preview={preview} accent={accent} deployments={deployments} professionalReview={professionalReview} expressReview={expressReview} canExport={canExport} canRequest={canRequest} planActive={Boolean(subscription && ["active", "trialing"].includes(subscription.status))} />;
      }))}
    </div>
  );
}
