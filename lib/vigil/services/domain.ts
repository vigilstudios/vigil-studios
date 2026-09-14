import type { AdminSupabaseClient } from "@/lib/supabase/admin";
import { assertTransition, domainTransitions } from "@/lib/vigil/lifecycle";
import { getDeploymentProvider } from "@/lib/vigil/providers/registry";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import { NotFoundError } from "@/lib/vigil/auth/errors";
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
  admin: AdminSupabaseClient,
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
    await admin.from("domains").update({ status_reason: "The website is still being set up." }).eq("id", domainId);
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
  admin: AdminSupabaseClient,
  domainId: string,
  provider: DeploymentProvider = getDeploymentProvider()
): Promise<{ connected: boolean }> {
  const { data: domain, error } = await admin.from("domains").select("*").eq("id", domainId).maybeSingle();
  if (error) throw error;
  if (!domain) throw new NotFoundError(`Domain ${domainId} not found.`);
  if (!domain.website_id) return { connected: false };

  const siteExternalId = await findExternalId(admin, {
    provider: providerEnum(provider.name),
    resourceKind: "site",
    entityType: "website",
    entityId: domain.website_id,
  });
  if (!siteExternalId) return { connected: false };

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
