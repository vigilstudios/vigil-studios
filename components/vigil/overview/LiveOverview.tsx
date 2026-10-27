import { createClient } from "@/lib/supabase/server";
import type { OrgContext } from "@/lib/vigil/auth/session";
import type { Domain, Project, Website } from "@/lib/vigil/types";
import type {
  getOrgSubscription,
  getRecentActivity,
} from "@/lib/vigil/queries/dashboard";
import { getRecentDeployments } from "@/lib/vigil/queries/dashboard";
import { getOverviewPalette } from "@/lib/vigil/queries/overview-palette";
import { getOverviewLeads } from "@/lib/vigil/queries/overview";
import { saveOverviewLayout } from "@/lib/vigil/actions/overview";
import {
  LAYOUT_METADATA_KEY,
  readLayout,
  type OverviewData,
} from "@/lib/vigil/overview/model";
import { auditTone, isWebsiteLive } from "@/lib/vigil/presenters";
import { humanizeAction } from "@/lib/vigil/format";
import { LiveOverviewDashboard } from "./LiveOverviewDashboard";

/** All authorization and data loading stay on the server. The client receives a minimal read model. */
export async function LiveOverview({
  ctx,
  websites,
  domains,
  projects,
  subscription,
  activity,
  canRequest,
  selectedWebsite,
}: {
  ctx: OrgContext;
  websites: Website[];
  domains: Domain[];
  projects: Project[];
  subscription: Awaited<ReturnType<typeof getOrgSubscription>>;
  activity: Awaited<ReturnType<typeof getRecentActivity>>;
  canRequest: boolean;
  selectedWebsite?: string;
}) {
  const liveSites = websites.filter(isWebsiteLive);
  const site =
    liveSites.find((row) => row.id === selectedWebsite) ?? liveSites[0];
  const domain =
    domains.find((row) => row.id === site.primary_domain_id) ??
    domains.find((row) => row.website_id === site.id) ??
    null;
  const client = await createClient();
  const asOf = new Date().toISOString();
  const [leads, releases, requests, previewAccent] = await Promise.all([
    getOverviewLeads(client, ctx.organization.id, site.id, asOf),
    getRecentDeployments(site.id, 12),
    client
      .from("change_requests")
      .select("id", { head: true, count: "exact" })
      .eq("organization_id", ctx.organization.id)
      .in("status", ["submitted", "triaged", "in_progress", "delivered"]),
    getOverviewPalette(client, ctx.organization.id, site.id),
  ]);
  if (requests.error) throw requests.error;
  const data: OverviewData = {
    ...leads,
    previewAccent,
    asOf,
    organizationName: ctx.organization.name,
    userName: ctx.profile.full_name,
    site: {
      id: site.id,
      name: site.name,
      live_url: site.live_url,
      health_ok: site.health_ok,
      last_health_at: site.last_health_at,
      last_deployed_at: site.last_deployed_at,
      export_eligible: site.export_eligible,
      code_ownership: site.code_ownership,
    },
    sites: liveSites.map((row) => ({ id: row.id, name: row.name })),
    domain: domain
      ? {
          hostname: domain.hostname,
          dns_ok: domain.dns_ok,
          ssl_ok: domain.ssl_ok,
          last_checked_at: domain.last_checked_at,
        }
      : null,
    traffic: null, // No customer website analytics source is connected yet. Never invent visitor counts.
    security: null, // Threat monitoring requires a connected source; SSL/DNS are not security scans.
    quality: null, // No website audit source is connected yet. Never invent scores.
    activity: activity.map((row) => ({
      id: String(row.id),
      title: humanizeAction(row.action),
      at: row.created_at,
      tone: auditTone(row.action, row.after),
    })),
    releases: releases.map((row) => ({
      id: row.id,
      environment: row.environment,
      status: row.status,
      created_at: row.created_at,
      finished_at: row.finished_at,
    })),
    subscription: subscription
      ? {
          name: subscription.plan?.name ?? "Vigil",
          status: subscription.status,
          renewsAt: subscription.current_period_end,
          cancels: subscription.cancel_at_period_end,
        }
      : null,
    openRequests: requests.count ?? 0,
    canExport: ctx.isImpersonating || ["owner", "manager"].includes(ctx.role),
    canRequest,
    otherProjects: projects.filter(
      (row) =>
        !["closed", "cancelled", "launched"].includes(row.status) &&
        !liveSites.some((live) => live.project_id === row.id),
    ).length,
  };
  return (
    <LiveOverviewDashboard
      key={`${ctx.user.id}:${ctx.organization.id}:${site.id}`}
      data={data}
      initialLayout={readLayout(ctx.user.user_metadata?.[LAYOUT_METADATA_KEY])}
      saveLayout={saveOverviewLayout}
    />
  );
}
