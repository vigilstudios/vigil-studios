import type { DbClient } from "@/lib/vigil/types";
import { assertTransition, domainTransitions } from "@/lib/vigil/lifecycle";
import { getDeploymentProvider } from "@/lib/vigil/providers/registry";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import { NotFoundError } from "@/lib/vigil/auth/errors";
import { checkDnsRecords, checkHttpsReachable, platformDnsRecords, type DnsCheck, type DnsRecord } from "./dns";
import { findExternalId, providerEnum } from "./provider-links";

export type ManagedDomainConfig = {
  hostname: string;
  canonicalHostname: string;
  redirectTo?: string;
};

type ConnectionChecks = {
  checkDns?: (hostname: string, records: DnsRecord[]) => Promise<DnsCheck[]>;
  checkHttps?: (hostname: string) => Promise<boolean>;
};

/**
 * Vercel recommends www as the canonical host for an apex domain. We attach
 * both so either address works, and permanently redirect the apex to www.
 * An explicitly supplied subdomain is left alone.
 */
export function managedDomainConfigs(hostname: string, kind: "apex" | "subdomain"): ManagedDomainConfig[] {
  if (kind !== "apex") return [{ hostname, canonicalHostname: hostname }];
  const canonicalHostname = `www.${hostname}`;
  return [
    { hostname: canonicalHostname, canonicalHostname },
    { hostname, canonicalHostname, redirectTo: canonicalHostname },
  ];
}

function uniqueRecords(configs: Awaited<ReturnType<DeploymentProvider["getDomainConfig"]>>[]): DnsRecord[] {
  const seen = new Set<string>();
  return configs.flatMap((config) => config.requiredRecords).filter((record) => {
    const key = `${record.type}:${record.name}:${record.value}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function addManagedDomains(provider: DeploymentProvider, siteExternalId: string, hostname: string, kind: "apex" | "subdomain") {
  const plan = managedDomainConfigs(hostname, kind);
  const configs = [];
  for (const item of plan) {
    configs.push(await provider.addDomain(siteExternalId, item.hostname, item.redirectTo
      ? { redirect: item.redirectTo, redirectStatusCode: 308 }
      : undefined));
  }
  return { plan, configs };
}

function pendingReason(status: string, dnsOk: boolean, sslOk: boolean, reachable: boolean): string {
  if (!dnsOk) {
    return status === "verifying"
      ? "The DNS record is not visible yet. We will keep checking automatically."
      : "The connection details are ready. Add the DNS record below, then select I've added the records."
  }
  if (!sslOk) return "Your DNS record is correct. We are issuing the secure certificate now.";
  if (!reachable) return "DNS and SSL are ready. We are waiting for the website to respond before opening the domain.";
  return "The domain is connected.";
}

function verificationState(
  records: DnsRecord[],
  checks: DnsCheck[],
  hostnames: string[],
  canonicalHostname: string,
  reachable: boolean
) {
  return {
    required_records: records,
    source: "provider",
    hostnames,
    canonical_hostname: canonicalHostname,
    connection_reachable: reachable,
    checks: checks.map((check) => ({ type: check.record.type, name: check.record.name, ok: check.ok, found: check.found })),
  };
}

async function restoreProviderAddress(admin: DbClient, websiteId: string | null) {
  if (!websiteId) return;
  const { data: website } = await admin.from("websites").select("preview_url").eq("id", websiteId).maybeSingle();
  if (!website) return;
  await admin.from("websites").update({ primary_domain_id: null, live_url: website.preview_url ?? null }).eq("id", websiteId);
}

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

/**
 * Prepare DNS without attaching the custom hostname to the provider project.
 * This lets the customer configure DNS during preview without allowing the
 * hostname to route to a preview or an automatic Git deployment.
 */
export async function beginDomainVerification(
  admin: DbClient,
  domainId: string,
  provider: DeploymentProvider = getDeploymentProvider(),
  connectionChecks: ConnectionChecks = {}
): Promise<void> {
  const { data: domain, error } = await admin.from("domains").select("*").eq("id", domainId).maybeSingle();
  if (error) throw error;
  if (!domain) throw new NotFoundError(`Domain ${domainId} not found.`);
  if (domain.status === "released") return;
  // A later preview deployment must never detach an already-live hostname.
  if (domain.status === "connected") return;
  const records = platformDnsRecords(domain.hostname);
  const checkDns = connectionChecks.checkDns ?? checkDnsRecords;
  const publicChecks = records.length > 0 ? await checkDns(domain.hostname, records) : [];
  const dnsOk = publicChecks.length > 0 && publicChecks.every((check) => check.ok);
  let nextStatus = domain.status;
  if (dnsOk && domain.status !== "verifying") {
    assertTransition(domainTransitions, domain.status, "verifying", "domain");
    nextStatus = "verifying";
  }

  // Undo the earlier preview-era behavior for existing rows before recording
  // the staged state. If the provider call fails, a retry still sees the
  // provider source and can safely try the removal again.
  const priorSource = (domain.verification as { source?: string } | null)?.source;
  if (domain.website_id && priorSource === "provider") {
    const siteExternalId = await findExternalId(admin, {
      provider: providerEnum(provider.name), resourceKind: "site", entityType: "website", entityId: domain.website_id,
    });
    if (siteExternalId) {
      for (const item of managedDomainConfigs(domain.hostname, domain.kind)) {
        await provider.removeDomain(siteExternalId, item.hostname);
      }
    }
    await admin.from("websites").update({ primary_domain_id: null, live_url: null }).eq("id", domain.website_id).neq("status", "live");
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("domains")
    .update({
      status: nextStatus,
      verification: {
        required_records: records,
        source: "platform",
        launch_ready: dnsOk,
        connection_reachable: false,
        checks: publicChecks.map((check) => ({ type: check.record.type, name: check.record.name, ok: check.ok, found: check.found })),
      },
      dns_ok: dnsOk,
      ssl_ok: false,
      last_checked_at: now,
      status_reason: records.length === 0
        ? "The website is still being set up."
        : dnsOk
          ? "Your DNS is configured and ready. Vigil will activate the secure domain when your website is published."
          : "The connection details are ready. Add the DNS record below, then select I've added the records.",
    })
    .eq("id", domainId);
  if (updateError) throw updateError;
}

/** Attach a staged domain after the approved production deployment is ready. */
export async function activateDomainVerification(
  admin: DbClient,
  domainId: string,
  provider: DeploymentProvider = getDeploymentProvider(),
  connectionChecks: ConnectionChecks = {}
): Promise<{ connected: boolean }> {
  const { data: domain, error } = await admin.from("domains").select("*").eq("id", domainId).maybeSingle();
  if (error) throw error;
  if (!domain) throw new NotFoundError(`Domain ${domainId} not found.`);
  if (domain.status === "released") return { connected: false };
  if (!domain.website_id) throw new NotFoundError("No website is attached to this domain.");
  const siteExternalId = await findExternalId(admin, {
    provider: providerEnum(provider.name), resourceKind: "site", entityType: "website", entityId: domain.website_id,
  });
  if (!siteExternalId) throw new NotFoundError("The provider website is not ready for domain activation.");

  const { plan, configs } = await addManagedDomains(provider, siteExternalId, domain.hostname, domain.kind);
  const records = uniqueRecords(configs);
  const checkDns = connectionChecks.checkDns ?? checkDnsRecords;
  const checkHttps = connectionChecks.checkHttps ?? checkHttpsReachable;
  const publicChecks = records.length > 0 ? await checkDns(domain.hostname, records) : [];
  const dnsOk = publicChecks.length > 0 && publicChecks.every((check) => check.ok);
  const sslOk = dnsOk && configs.every((config) => config.sslReady && !config.misconfigured);
  const reachable = sslOk ? await checkHttps(plan[0].canonicalHostname) : false;
  const connected = dnsOk && sslOk && reachable;
  let nextStatus = domain.status;
  if (connected && domain.status !== "connected") {
    if (domain.status !== "verifying") {
      assertTransition(domainTransitions, domain.status, "verifying", "domain");
      nextStatus = "verifying";
    }
    assertTransition(domainTransitions, nextStatus, "connected", "domain");
    nextStatus = "connected";
  } else if (!connected && domain.status === "connected") {
    assertTransition(domainTransitions, "connected", "verifying", "domain");
    nextStatus = "verifying";
  }
  const now = new Date().toISOString();
  const { error: updateError } = await admin.from("domains").update({
    status: nextStatus,
    verification: { ...verificationState(records, publicChecks, plan.map((item) => item.hostname), plan[0].canonicalHostname, reachable), launch_ready: false },
    dns_ok: dnsOk,
    ssl_ok: sslOk,
    ...(connected ? { verified_at: now, connected_at: now } : {}),
    last_checked_at: now,
    status_reason: connected ? null : pendingReason(nextStatus, dnsOk, sslOk, reachable),
  }).eq("id", domainId);
  if (updateError) throw updateError;
  return { connected };
}

/** Re-check DNS and SSL; move to connected when both are good. */
export async function verifyDomain(
  admin: DbClient,
  domainId: string,
  provider: DeploymentProvider = getDeploymentProvider(),
  connectionChecks: ConnectionChecks = {}
): Promise<{ connected: boolean; readyForLaunch?: boolean; reason?: "no_site"; dnsOk?: boolean }> {
  const { data: domain, error } = await admin.from("domains").select("*").eq("id", domainId).maybeSingle();
  if (error) throw error;
  if (!domain) throw new NotFoundError(`Domain ${domainId} not found.`);
  if (domain.status === "released") return { connected: false };
  const checkDns = connectionChecks.checkDns ?? checkDnsRecords;
  const checkHttps = connectionChecks.checkHttps ?? checkHttpsReachable;

  const currentVerification = (domain.verification as Record<string, unknown> | null) ?? {};
  if (currentVerification.source !== "provider") {
    const records = (currentVerification.required_records as DnsRecord[] | undefined) ?? platformDnsRecords(domain.hostname);
    if (records.length === 0) return { connected: false, reason: "no_site" };
    const checks = await checkDns(domain.hostname, records);
    const dnsOk = checks.length > 0 && checks.every((check) => check.ok);
    let nextStatus = domain.status;
    if (dnsOk && domain.status !== "verifying") {
      assertTransition(domainTransitions, domain.status, "verifying", "domain");
      nextStatus = "verifying";
    }
    await admin.from("domains").update({
      status: nextStatus,
      dns_ok: dnsOk,
      ssl_ok: false,
      last_checked_at: new Date().toISOString(),
      status_reason: dnsOk
        ? "Your DNS is configured and ready. Vigil will activate the secure domain when your website is published."
        : "The DNS record is not visible yet. We will keep checking automatically.",
      verification: {
        ...currentVerification,
        required_records: records,
        source: "platform",
        launch_ready: dnsOk,
        connection_reachable: false,
        checks: checks.map((check) => ({ type: check.record.type, name: check.record.name, ok: check.ok, found: check.found })),
      },
    }).eq("id", domainId);
    return { connected: false, readyForLaunch: dnsOk, dnsOk };
  }

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
    const checks = await checkDns(domain.hostname, records);
    const dnsOk = checks.every((c) => c.ok);
    await admin
      .from("domains")
      .update({
        dns_ok: dnsOk,
        ssl_ok: false,
        last_checked_at: new Date().toISOString(),
        status_reason: dnsOk ? "Your DNS records are correct. Vigil finishes the connection when your website is published." : null,
        verification: { ...(domain.verification as Record<string, unknown> | null), connection_reachable: false, checks: checks.map((c) => ({ type: c.record.type, name: c.record.name, ok: c.ok, found: c.found })) },
      })
      .eq("id", domainId);
    return { connected: false, reason: "no_site", dnsOk };
  }

  const plan = managedDomainConfigs(domain.hostname, domain.kind);
  const configs = await Promise.all(plan.map((item) => provider.getDomainConfig(siteExternalId, item.hostname)));
  const records = uniqueRecords(configs);
  const publicChecks = records.length > 0 ? await checkDns(domain.hostname, records) : [];
  const dnsOk = publicChecks.length > 0 && publicChecks.every((check) => check.ok);
  const sslOk = dnsOk && configs.every((config) => config.sslReady && !config.misconfigured);
  const reachable = sslOk ? await checkHttps(plan[0].canonicalHostname) : false;
  const connected = dnsOk && sslOk && reachable;
  const wasConnected = domain.status === "connected";
  const now = new Date().toISOString();
  const verification = verificationState(records, publicChecks, plan.map((item) => item.hostname), plan[0].canonicalHostname, reachable);

  if (connected && domain.status !== "connected") {
    if (domain.status !== "verifying") {
      assertTransition(domainTransitions, domain.status, "verifying", "domain");
      await admin.from("domains").update({ status: "verifying" }).eq("id", domainId).eq("status", domain.status);
      domain.status = "verifying";
    }
    assertTransition(domainTransitions, domain.status, "connected", "domain");
    await admin
      .from("domains")
      .update({ status: "connected", dns_ok: true, ssl_ok: true, verification, verified_at: now, connected_at: now, last_checked_at: now, status_reason: null })
      .eq("id", domainId);
  } else if (connected) {
    await admin
      .from("domains")
      .update({ dns_ok: true, ssl_ok: true, verification, last_checked_at: now, status_reason: null })
      .eq("id", domainId);
  } else if (!connected) {
    let nextStatus = domain.status;
    if (domain.status === "connected") {
      assertTransition(domainTransitions, "connected", "verifying", "domain");
      nextStatus = "verifying";
    }
    await admin
      .from("domains")
      .update({
        status: nextStatus,
        dns_ok: dnsOk,
        ssl_ok: sslOk,
        last_checked_at: now,
        status_reason: pendingReason(nextStatus, dnsOk, sslOk, reachable),
        verification,
      })
      .eq("id", domainId);
    if (wasConnected) await restoreProviderAddress(admin, domain.website_id);
  }

  return { connected };
}
