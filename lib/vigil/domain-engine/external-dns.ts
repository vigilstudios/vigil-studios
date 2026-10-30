import "server-only";
import {
  deploymentWebsiteRecords,
  sameWebsiteRecords,
} from "./deployment-records";
import { normalizeDomain } from "./normalize";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { createDomainSecretCodec } from "./secrets";
import {
  CloudflareDnsClient,
  type CloudflareDnsPlan,
  validatedWebsiteDnsRecords,
} from "./cloudflare-dns";
import { discoverDomainDns } from "./domain-connect";
import { domainProductionContext } from "@/lib/vigil/services/domain-production";
import { getDeploymentProvider } from "@/lib/vigil/providers/registry";
import {
  findExternalId,
  providerEnum,
} from "@/lib/vigil/services/provider-links";
import { managedDomainConfigs } from "@/lib/vigil/services/domain";
import { enqueueJob, JOB_KINDS } from "@/lib/vigil/jobs";
import { liveUnavailable } from "./live-policy";
import type { ExpectedDnsRecord } from "./contracts";
export function assertCloudflareIntegration() {
  if (
    process.env.VIGIL_DOMAIN_ENGINE_ENABLED !== "true" ||
    process.env.VIGIL_DOMAIN_CLOUDFLARE_ENABLED !== "true"
  )
    throw liveUnavailable("Authorized Cloudflare setup is not enabled.");
}
async function release(
  admin: DbClient,
  domainId: string,
  org: string,
  actor: string,
) {
  assertCloudflareIntegration();
  const { data, error } = await admin.rpc("external_dns_release", {
    p_domain_id: domainId,
    p_actor_id: actor,
  });
  const d = z
    .object({
      id: z.string().uuid(),
      organization_id: z.string().uuid(),
      website_id: z.string().uuid(),
      hostname: z.string(),
      verification_token: z.string(),
    })
    .safeParse(data);
  if (error || !d.success || d.data.organization_id !== org)
    throw liveUnavailable(
      "This exact domain and website need an approved DNS release.",
    );
  return d.data;
}
async function ready(
  admin: DbClient,
  d: { website_id: string; organization_id: string; hostname: string },
) {
  const provider = getDeploymentProvider();
  if (
    !(await domainProductionContext(
      admin,
      d.website_id,
      d.organization_id,
      provider,
    ))
  )
    throw liveUnavailable(
      "Approve Deploy Live and wait for its production build before changing website routing.",
    );
  const discovery = await discoverDomainDns(d.hostname);
  if (discovery.dnsProvider !== "cloudflare")
    throw liveUnavailable(
      "Cloudflare is not the authoritative DNS provider for this domain.",
    );
  return provider;
}
export async function prepareExternalDns(
  admin: DbClient,
  domainId: string,
  org: string,
  actor: string,
  token: string,
) {
  const d = await release(admin, domainId, org, actor),
    provider = await ready(admin, d);
  const site = await findExternalId(admin, {
    provider: providerEnum(provider.name),
    resourceKind: "site",
    entityType: "website",
    entityId: d.website_id,
  });
  if (!site || !provider.getRecommendedDnsRecords) throw liveUnavailable();
  const expected: ExpectedDnsRecord[] = [];
  for (const host of managedDomainConfigs(
    d.hostname,
    normalizeDomain(d.hostname).registrableDomain === d.hostname
      ? "apex"
      : "subdomain",
  )) {
    for (const r of await provider.getRecommendedDnsRecords(
      site,
      host.hostname,
    ))
      if (r.type === "A" || r.type === "CNAME")
        expected.push({ ...r, type: r.type, ttl: 300 });
      else throw liveUnavailable();
  }
  expected.push({
    type: "TXT",
    name: `_vigil.${d.hostname}`,
    value: `vigil-verify=${d.verification_token}`,
    ttl: 300,
  });
  validatedWebsiteDnsRecords(d.hostname, expected);
  const plan = await new CloudflareDnsClient(token).prepare(
      d.hostname,
      expected,
    ),
    id = randomUUID();
  const encrypted = createDomainSecretCodec().encrypt(
    { token },
    { organizationId: org, recordId: id, purpose: "dns_authorization" },
  );
  const { error } = await admin.rpc("create_external_dns_plan", {
    p_id: id,
    p_domain_id: domainId,
    p_actor_id: actor,
    p_token: encrypted,
    p_plan: plan as unknown as Json,
  });
  if (error)
    throw liveUnavailable(
      "Resume the existing DNS plan before preparing another.",
    );
  return {
    id,
    status: "planned",
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    changes: plan.changes.map((c) => ({
      operation: c.operation,
      before: c.before
        ? {
            type: c.before.type,
            name: c.before.name,
            content: c.before.content,
          }
        : null,
      after: c.after,
    })),
    records: expected,
  };
}
export async function applyExternalDns(
  admin: DbClient,
  id: string,
  org: string,
  actor: string,
) {
  assertCloudflareIntegration();
  const { data, error } = await admin.rpc("claim_external_dns_plan", {
    p_id: id,
    p_actor_id: actor,
    p_organization_id: org,
  });
  const parsed = z
    .object({
      claimed: z.boolean(),
      record: z.object({
        id: z.string().uuid(),
        organization_id: z.string().uuid(),
        domain_id: z.string().uuid(),
        website_id: z.string().uuid(),
        status: z.string(),
        claim_token: z.string().uuid().nullable(),
        consented_at: z.string().nullable(),
        created_at: z.string(),
        encrypted_token: z.string().nullable(),
        plan: z.unknown(),
      }),
    })
    .safeParse(data);
  if (error || !parsed.success || parsed.data.record.organization_id !== org)
    throw liveUnavailable("The DNS approval is unavailable or expired.");
  const { claimed, record: p } = parsed.data;
  if (p.status === "applied") return { applied: true, reconciled: true };
  if (
    !["claimed", "review"].includes(p.status) ||
    !p.claim_token ||
    !p.encrypted_token
  )
    throw liveUnavailable();
  if (
    !claimed &&
    p.status === "claimed" &&
    Date.now() - Date.parse(p.consented_at ?? "") < 600000
  )
    return { applied: false, working: true };
  if (Date.now() - Date.parse(p.created_at) > 86400000)
    throw liveUnavailable(
      "This recovery token has expired. Vigil must review the prior DNS result before a new plan.",
    );
  const d = await release(admin, p.domain_id, org, actor);
  await ready(admin, d);
  const { token } = createDomainSecretCodec().decrypt<{ token: string }>(
    p.encrypted_token,
    { organizationId: org, recordId: id, purpose: "dns_authorization" },
  );
  const client = new CloudflareDnsClient(token),
    plan = p.plan as CloudflareDnsPlan;
  if (plan.fqdn !== d.hostname) throw liveUnavailable();
  let applied = false;
  try {
    if (claimed) {
      applied = (
        await client.apply(plan, async () => {
          await release(admin, p.domain_id, org, actor);
          const provider = await ready(admin, d);
          if (
            !sameWebsiteRecords(
              d.hostname,
              plan.expected,
              await deploymentWebsiteRecords(admin, provider, d),
            )
          )
            throw liveUnavailable(
              "The deployment records changed. Review a new plan.",
            );
          const zone = await client.findZone(d.hostname);
          if (zone.id !== plan.zoneId || zone.name !== plan.zoneName)
            throw liveUnavailable();
          const { error } = await admin.rpc("authorize_external_dns_write", {
            p_id: id,
            p_claim: p.claim_token!,
            p_organization_id: org,
          });
          if (error) throw liveUnavailable();
        })
      ).applied;
    } else
      applied =
        (await client.prepare(d.hostname, plan.expected)).changes.length === 0;
  } catch {
    /* Never repeat a claimed or uncertain batch. Read-only recovery remains available. */
  }
  const { error: finishError } = await admin.rpc("finish_external_dns_plan", {
    p_id: id,
    p_claim: p.claim_token,
    p_applied: applied,
  });
  if (finishError)
    throw liveUnavailable("The existing DNS result needs reconciliation.");
  if (applied)
    await enqueueJob(admin, {
      kind: JOB_KINDS.domainVerify,
      idempotencyKey: `domain.verify:cloudflare:${id}`,
      organizationId: org,
      websiteId: d.website_id,
      domainId: d.id,
      maxAttempts: 200,
      requeueFailed: true,
    });
  if (!applied)
    throw liveUnavailable(
      "The existing DNS submission needs review. No duplicate batch was submitted.",
    );
  return { applied: true, reconciled: !claimed };
}
