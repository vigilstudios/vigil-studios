import type { Metadata } from "next";
import { Card, DefinitionList, EmptyState, PageHeader, StatusPill } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { formatDate, formatRelative } from "@/lib/vigil/format";
import { describeDomainStatus } from "@/lib/vigil/lifecycle";
import { getOrgDomains, getOrgWebsites } from "@/lib/vigil/queries/dashboard";
import { getOnboardingProject } from "@/lib/vigil/queries/onboarding";
import { requiredRecords } from "@/lib/vigil/services/dns";
import { ConnectDomainForm } from "./ConnectDomainForm";
import { DomainGuidePanel } from "./DomainGuidePanel";

export const metadata: Metadata = { title: "Domain" };

export default async function DomainPage() {
  const ctx = await requireOrgContext("/dashboard/domain");
  const [domains, websites, onboarding] = await Promise.all([getOrgDomains(ctx.organization.id), getOrgWebsites(ctx.organization.id), getOnboardingProject(ctx.organization.id)]);
  const canManage = ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating;
  const briefDomain = onboarding?.brief.domain ?? null;
  const hasConnectedDomain = domains.some((domain) => domain.status === "connected");

  return (
    <div>
      <PageHeader title="Domain" description="Your domain stays yours. Vigil manages the technical connection while you are subscribed." />

      {domains.length === 0 ? (
        <EmptyState
          title="No domain connected"
          description="Already own a domain? Start the guided connection below. Need one? Vigil Studios can register it for you during onboarding."
        />
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => {
            const reachable = (domain.verification as { connection_reachable?: boolean } | null)?.connection_reachable ?? null;
            const launchReady = (domain.verification as { launch_ready?: boolean } | null)?.launch_ready === true;
            const status = describeDomainStatus(domain.status, { dnsOk: domain.dns_ok, sslOk: domain.ssl_ok, reachable, launchReady });
            const records = requiredRecords(domain.hostname, domain.verification, domain.verification_token);
            const linkedWebsite = websites.find((website) => website.id === domain.website_id);
            // Older previews were deployed before preview completion attached
            // the domain to the provider. Do not keep those customers locked
            // out of the DNS guide when the site is visibly ready to review.
            const cutoverReady =
              (domain.verification as { source?: string } | null)?.source === "provider" ||
              domain.status === "connected" ||
              Boolean(linkedWebsite?.preview_url);
            return (
              <Card key={domain.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{domain.hostname}</h2>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
                {domain.status_reason ? (
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{domain.status_reason}</p>
                ) : status.hint ? (
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{status.hint}</p>
                ) : null}
                <DefinitionList
                  items={[
                    { label: "Owner", value: domain.source === "purchased_via_vigil" ? "You (registered through Vigil)" : "You" },
                    { label: "DNS", value: domain.dns_ok === null ? "Not checked yet" : domain.dns_ok ? "Correct" : "Needs changes" },
                    { label: "SSL", value: domain.ssl_ok ? "Active" : "Pending" },
                    { label: "Website", value: domain.status === "connected" && reachable ? "Reachable" : domain.ssl_ok ? "Establishing connection" : "Waiting" },
                    { label: "Expires", value: domain.expires_at ? formatDate(domain.expires_at) : "Managed by your registrar" },
                    { label: "Last checked", value: formatRelative(domain.last_checked_at) },
                  ]}
                />
                {domain.status !== "connected" && domain.source === "customer_owned" ? (
                  <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
                    <DomainGuidePanel
                      key={`${domain.id}:${domain.updated_at}`}
                      domain={{
                        domainId: domain.id,
                        hostname: domain.hostname,
                        status: domain.status,
                        records,
                        dnsOk: domain.dns_ok,
                        sslOk: domain.ssl_ok,
                        reachable,
                        launchReady,
                        statusReason: domain.status_reason,
                        cutoverReady,
                      }}
                      initialRegistrar={briefDomain?.domainId === domain.id && briefDomain.registrar ? briefDomain.registrar : "other"}
                      canManage={canManage}
                    />
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {canManage && !hasConnectedDomain ? (
        <Card className="mt-6">
          <h2 className="text-base font-semibold">Connect a domain you already own</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            Enter the domain and we will show you exactly what to change at your registrar.
          </p>
          <ConnectDomainForm websites={websites.map((w) => ({ id: w.id, name: w.name }))} />
        </Card>
      ) : null}
    </div>
  );
}
