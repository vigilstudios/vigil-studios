import type { Metadata } from "next";
import { Card, DefinitionList, EmptyState, PageHeader, StatusPill } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { formatDate, formatRelative } from "@/lib/vigil/format";
import { describeDomainStatus } from "@/lib/vigil/lifecycle";
import { getOrgDomains, getOrgWebsites } from "@/lib/vigil/queries/dashboard";
import { ConnectDomainForm } from "./ConnectDomainForm";

export const metadata: Metadata = { title: "Domain" };

type RequiredRecord = { type: string; name: string; value: string };

export default async function DomainPage() {
  const ctx = await requireOrgContext("/dashboard/domain");
  const [domains, websites] = await Promise.all([getOrgDomains(ctx.organization.id), getOrgWebsites(ctx.organization.id)]);
  const canManage = ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating;

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
                {records.length > 0 && domain.status !== "connected" ? (
                  <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
                    <h3 className="text-sm font-semibold">Add these records at your registrar</h3>
                    <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                      Sign in where you bought the domain, open its DNS settings, and add the records below. Vigil checks automatically.
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-[color:var(--text-secondary)]">
                            <th className="pb-1 pr-4 font-medium">Type</th>
                            <th className="pb-1 pr-4 font-medium">Name</th>
                            <th className="pb-1 font-medium">Value</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono">
                          {records.map((r, i) => (
                            <tr key={i}>
                              <td className="py-1 pr-4">{r.type}</td>
                              <td className="py-1 pr-4">{r.name}</td>
                              <td className="py-1 break-all">{r.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
