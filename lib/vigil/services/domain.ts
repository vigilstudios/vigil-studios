import type { DbClient } from "@/lib/vigil/types";
import { assertTransition, domainTransitions } from "@/lib/vigil/lifecycle";
import { getDeploymentProvider } from "@/lib/vigil/providers/registry";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import { NotFoundError } from "@/lib/vigil/auth/errors";
import { checkDnsRecords, platformDnsRecords, type DnsRecord } from "./dns";
import { findExternalId, providerEnum } from "./provider-links";

/**
 * DomainService: guided connection for a customer-owned domain (Flow B).
 * Registration through a DomainProvider (Flow A) is a later phase; the
 * interface exists in providers/types.ts.
 */
export function normalizeHostname(input: string): string | null {
  const host = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) return null;
  return host;
}

/** Attach the domain to the website's provider project and record the DNS the customer must set. */
export async function beginDomainVerification(
  admin: DbClient,
  domainId: string,
  provider: DeploymentProvider = getDeploymentProvider()
): Promise<void> {
  const { data: domain, error } = await admin.from("domains").select("*").eq("id", domainId).maybeSingle();
  if (error) throw error;
  if (!domain) throw new NotFoundError(`Domain ${domainId} not found.`);
  if (!domain.website_id) {
    await admin.from("domains").update({ status_reason: "No website is attached to this domain yet." }).eq("id", domainId);
    return;
  }

  const siteExternalId = await findExternalId(admin, {
    provider: providerEnum(provider.name),
    resourceKind: "site",
    entityType: "website",
    entityId: domain.website_id,
  });
  if (!siteExternalId) {
    // No provider site yet (the build has not been published). The platform's
    // standard records are still known, so the customer can do their part now;
    // the provider's exact values replace them when the site exists.
    const records = platformDnsRecords(domain.hostname);
    if (records.length > 0) {
      await admin
        .from("domains")
        .update({ verification: { required_records: records, source: "platform" }, status_reason: null })
        .eq("id", domainId);
    } else {
      await admin.from("domains").update({ status_reason: "The website is still being set up." }).eq("id", domainId);
    }
    return;
  }

  const config = await provider.addDomain(siteExternalId, domain.hostname);
  if (domain.status === "pending") assertTransition(domainTransitions, domain.status, "verifying", "domain");

  const { error: updateError } = await admin
    .from("domains")
    .update({
      status: domain.status === "pending" ? "verifying" : domain.status,
      verification: { required_records: config.requiredRecords },
      dns_ok: config.verified,
      ssl_ok: config.sslReady,
      last_checked_at: new Date().toISOString(),
      status_reason: null,
    })
    .eq("id", domainId);
  if (updateError) throw updateError;
}

/** Re-check DNS and SSL; move to connected when both are good. */
export async function verifyDomain(
  admin: DbClient,
  domainId: string,
  provider: DeploymentProvider = getDeploymentProvider()
): Promise<{ connected: boolean; reason?: "no_site"; dnsOk?: boolean }> {
  const { data: domain, error } = await admin.from("domains").select("*").eq("id", domainId).maybeSingle();
  if (error) throw error;
  if (!domain) throw new NotFoundError(`Domain ${domainId} not found.`);

  const siteExternalId = domain.website_id
    ? await findExternalId(admin, {
        provider: providerEnum(provider.name),
        resourceKind: "site",
        entityType: "website",
        entityId: domain.website_id,
      })
    : null;
  if (!siteExternalId) {
    // Nothing to attach to yet: still check public DNS so the customer sees
    // real progress ("your records are right; the site is next").
    const records = (domain.verification as { required_records?: DnsRecord[] } | null)?.required_records ?? [];
    if (records.length === 0) return { connected: false, reason: "no_site" };
    const checks = await checkDnsRecords(domain.hostname, records);
    const dnsOk = checks.every((c) => c.ok);
    await admin
      .from("domains")
      .update({
        dns_ok: dnsOk,
        last_checked_at: new Date().toISOString(),
        status_reason: dnsOk ? "Your DNS records are correct. Vigil finishes the connection when your website is published." : null,
        verification: { ...(domain.verification as Record<string, unknown> | null), checks: checks.map((c) => ({ type: c.record.type, name: c.record.name, ok: c.ok, found: c.found })) },
      })
      .eq("id", domainId);
    return { connected: false, reason: "no_site", dnsOk };
  }

  const config = await provider.getDomainConfig(siteExternalId, domain.hostname);
  const connected = config.verified && config.sslReady && !config.misconfigured;
  const now = new Date().toISOString();

  if (connected && domain.status !== "connected") {
    assertTransition(domainTransitions, domain.status, "connected", "domain");
    await admin
      .from("domains")
      .update({ status: "connected", dns_ok: true, ssl_ok: true, verified_at: now, connected_at: now, last_checked_at: now, status_reason: null })
      .eq("id", domainId);
  } else if (!connected) {
    await admin
      .from("domains")
      .update({
        dns_ok: config.verified,
        ssl_ok: config.sslReady,
        last_checked_at: now,
        verification: { required_records: config.requiredRecords },
      })
      .eq("id", domainId);
  }

  return { connected };
}
