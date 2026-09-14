import type { Metadata } from "next";
import { Card, DefinitionList, EmptyState, PageHeader, StatusPill } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { formatDate, formatRelative } from "@/lib/vigil/format";
import { describeDomainStatus } from "@/lib/vigil/lifecycle";
import { getOrgDomains, getOrgWebsites } from "@/lib/vigil/queries/dashboard";
import { getOnboardingProject } from "@/lib/vigil/queries/onboarding";
import { ConnectDomainForm } from "./ConnectDomainForm";
import { DomainGuidePanel } from "./DomainGuidePanel";

export const metadata: Metadata = { title: "Domain" };

type RequiredRecord = { type: string; name: string; value: string };

export default async function DomainPage() {
  const ctx = await requireOrgContext("/dashboard/domain");
  const [domains, websites, onboarding] = await Promise.all([getOrgDomains(ctx.organization.id), getOrgWebsites(ctx.organization.id), getOnboardingProject(ctx.organization.id)]);
  const canManage = ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating;
  const briefDomain = onboarding?.brief.domain ?? null;

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
            const status = describeDomainStatus(domain.status);
            const records = ((domain.verification as { required_records?: RequiredRecord[] } | null)?.required_records ?? []);
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
                    { label: "Expires", value: domain.expires_at ? formatDate(domain.expires_at) : "Managed by your registrar" },
                    { label: "Last checked", value: formatRelative(domain.last_checked_at) },
                  ]}
                />
                {domain.status !== "connected" && domain.source === "customer_owned" ? (
                  <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
                    <DomainGuidePanel
                      domain={{ domainId: domain.id, hostname: domain.hostname, status: domain.status, records, dnsOk: domain.dns_ok, statusReason: domain.status_reason }}
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

      {canManage ? (
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
