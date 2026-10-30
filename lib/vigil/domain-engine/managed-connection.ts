import "server-only";
import { z } from "zod";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import {
  findExternalId,
  providerEnum,
} from "@/lib/vigil/services/provider-links";
import type {
  VerifiedRegistrationRequest,
  ExpectedDnsRecord,
} from "./contracts";
import { SupabaseDomainOrderStore } from "./store";
import { domainTestRegistrar } from "./test-registrar";
import { assertDomainTestDatabase } from "./runtime";
import { NamecomProductionRegistrar } from "./namecom-production";
import { NamecomSandboxRegistrar } from "./namecom-sandbox";
import { liveOrderPolicy, liveRegistrar } from "./live-providers";
import { assertDomainLiveRuntime } from "./live-policy";
import {
  deploymentWebsiteRecords,
  sameWebsiteRecords,
} from "./deployment-records";
import { domainProductionContext } from "@/lib/vigil/services/domain-production";
import { DomainEngineError } from "./errors";
import { validatedWebsiteDnsRecords } from "./cloudflare-dns";
import { readDomainEngineConfig } from "./config";

function unavailable(message = "The managed domain connection needs review.") {
  return new DomainEngineError("managed_domain_review", message, 409);
}

/** Resolves every identity from saved records; callers cannot supply provider IDs or contacts. */
export async function loadManagedRegistrarContext(
  admin: DbClient,
  registrationId: string,
  organizationId: string,
  requirePaid = true,
) {
  const { data: registration, error } = await admin
    .from("domain_registrations")
    .select("*")
    .eq("id", registrationId)
    .eq("organization_id", organizationId)
    .single();
  if (
    error ||
    !registration ||
    !["test", "live"].includes(registration.environment) ||
    registration.registrar !== "namecom"
  )
    throw unavailable();
  let orderQuery = admin
    .from("domain_orders")
    .select("id")
    .eq("registration_id", registration.id)
    .eq("organization_id", organizationId)
    .eq("operation", "register")
    .eq("registration_state", "registered");
  if (requirePaid) orderQuery = orderQuery.eq("payment_state", "paid");
  const { data: order, error: orderError } = await orderQuery.single();
  if (orderError || !order)
    throw unavailable(
      "Complete registration and payment before connecting the website.",
    );
  const saved = await new SupabaseDomainOrderStore(admin).load(order.id);
  if (
    saved.fqdn !== registration.fqdn ||
    saved.organizationId !== organizationId ||
    saved.registrar !== "namecom" ||
    saved.environment !== registration.environment
  )
    throw unavailable();
  if (registration.environment === "test") assertDomainTestDatabase();
  else assertDomainLiveRuntime();
  const registrar =
    registration.environment === "live"
      ? liveRegistrar(
          admin,
          await liveOrderPolicy(admin, order.id),
          registration.id,
        )
      : domainTestRegistrar(admin);
  if (
    !(registrar instanceof NamecomSandboxRegistrar) &&
    !(registrar instanceof NamecomProductionRegistrar)
  )
    throw unavailable();
  const approved: VerifiedRegistrationRequest = {
    intentId: saved.id,
    organizationId,
    fqdn: saved.fqdn,
    years: saved.years,
    autoRenew: saved.autoRenew,
    acceptanceId: saved.acceptanceId,
    contact: saved.contact,
    expectedRegistrarPrice: {
      amountMinor: saved.registrarAmountMinor,
      currency: saved.currency,
    },
    registrarOrderRef: saved.registrarOrderRef ?? undefined,
  };
  const { data: link, error: linkError } = await admin
    .from("provider_links")
    .select("external_id,metadata")
    .eq("provider", "other")
    .eq("entity_type", "domain_registration")
    .eq("entity_id", registration.id)
    .eq("resource_kind", "registration")
    .single();
  const metadata = link?.metadata as {
    environment?: string;
    account_scope?: string;
    registrar?: string;
  } | null;
  if (
    linkError ||
    !link ||
    metadata?.environment !== registration.environment ||
    metadata.account_scope !== registrar.accountScope ||
    metadata.registrar !== "namecom"
  )
    throw unavailable();
  return { registration, registrar, approved, assetRef: link.external_id };
}

export async function bindManagedDomain(
  admin: DbClient,
  registrationId: string,
  websiteId: string,
  organizationId: string,
  actorId: string,
) {
  const ctx = await loadManagedRegistrarContext(
    admin,
    registrationId,
    organizationId,
  );
  const asset = await ctx.registrar.getRegisteredDomainStatus(
    ctx.registration.fqdn,
    ctx.approved,
    ctx.assetRef,
  );
  if (!asset || !["registered", "contact_hold"].includes(asset.status))
    throw unavailable();
  const { data, error } = await admin.rpc(
    ctx.registration.environment === "live"
      ? "bind_live_managed_domain"
      : "bind_managed_domain",
    {
      p_registration_id: registrationId,
      p_website_id: websiteId,
      p_actor_id: actorId,
    },
  );
  if (error || !data)
    throw unavailable(
      "Choose a website in this account. Existing domain bindings cannot be moved automatically.",
    );
  return { domainId: data };
}

/** A sandbox registration must never use the user's real Vercel deployment provider. */
export function assertManagedTestProvider(provider: DeploymentProvider) {
  assertDomainTestDatabase();
  if (provider.name !== "mock")
    throw unavailable(
      "This sandbox domain requires the isolated test deployment provider.",
    );
}

export async function prepareManagedDns(
  admin: DbClient,
  registrationId: string,
  organizationId: string,
  actorId: string,
  provider: DeploymentProvider,
) {
  const ctx = await loadManagedRegistrarContext(
    admin,
    registrationId,
    organizationId,
  );
  if (ctx.registration.environment === "test")
    assertManagedTestProvider(provider);
  else if (
    provider.name !== "vercel" ||
    !ctx.registration.website_id ||
    !(await domainProductionContext(
      admin,
      ctx.registration.website_id,
      organizationId,
      provider,
    ))
  )
    throw unavailable(
      "Approve Deploy Live and wait for its production build before connecting website routing.",
    );
  const { data: domain, error } = await admin
    .from("domains")
    .select("id,website_id,hostname,verification_token")
    .eq("managed_registration_id", registrationId)
    .eq("organization_id", organizationId)
    .single();
  if (
    error ||
    !domain?.website_id ||
    domain.website_id !== ctx.registration.website_id
  )
    throw unavailable("Choose the website for this domain first.");
  const site = await findExternalId(admin, {
    provider: providerEnum(provider.name),
    resourceKind: "site",
    entityType: "website",
    entityId: domain.website_id,
  });
  if (!site || !provider.getRecommendedDnsRecords)
    throw unavailable(
      "Create the website preview before preparing its DNS connection.",
    );
  const expected: ExpectedDnsRecord[] = [];
  for (const hostname of [domain.hostname, `www.${domain.hostname}`]) {
    const records = await provider.getRecommendedDnsRecords(site, hostname);
    if (!records.length) throw unavailable();
    for (const record of records) {
      if (record.type !== "A" && record.type !== "CNAME")
        throw unavailable(
          "The provider requires an additional record that needs review.",
        );
      expected.push({
        type: record.type,
        name: record.name,
        value: record.value,
        ttl: 300,
      });
    }
  }
  expected.push({
    type: "TXT",
    name: `_vigil.${domain.hostname}`,
    value: `vigil-verify=${domain.verification_token}`,
    ttl: 300,
  });
  // This rejects off-domain names, private IPs, non-Vercel CNAMEs and unsupported hostnames.
  validatedWebsiteDnsRecords(domain.hostname, expected);
  const plan = await ctx.registrar.prepareWebsiteDns(
    ctx.approved,
    expected,
    ctx.assetRef,
  );
  const { data, error: saveError } = await admin.rpc(
    ctx.registration.environment === "live"
      ? "create_live_managed_dns_plan"
      : "create_managed_dns_plan",
    {
      p_registration_id: registrationId,
      p_actor_id: actorId,
      p_plan: plan as unknown as Json,
    },
  );
  const parsed = z
    .object({
      id: z.string().uuid(),
      expiresAt: z.string().datetime({ offset: true }),
    })
    .safeParse(data);
  if (saveError || !parsed.success)
    throw unavailable(
      "An earlier DNS submission needs reconciliation, or the plan could not be saved.",
    );
  return {
    ...parsed.data,
    records: expected,
    changes: plan.creates.length,
    environment: ctx.registration.environment,
  };
}

const claimedPlan = z.object({
  claimed: z.boolean(),
  record: z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    registration_id: z.string().uuid(),
    domain_id: z.string().uuid(),
    website_id: z.string().uuid(),
    status: z.string(),
    claim_token: z.string().uuid().nullable(),
    consented_at: z.string().nullable(),
    plan: z.object({
      fqdn: z.string(),
      accountScope: z.string(),
      snapshotDigest: z.string(),
      expected: z.array(
        z.object({
          type: z.enum(["A", "CNAME", "TXT"]),
          name: z.string(),
          value: z.string(),
          ttl: z.number(),
        }),
      ),
      creates: z.array(
        z.object({
          type: z.enum(["A", "CNAME", "TXT"]),
          host: z.string(),
          answer: z.string(),
          ttl: z.number(),
        }),
      ),
    }),
  }),
});

/** Claims once before any external write. Unknown results only permit read-back reconciliation. */
export async function applyManagedDns(
  admin: DbClient,
  planId: string,
  organizationId: string,
  actorId: string,
  consent: boolean,
  expectedEnvironment?: "test" | "live",
) {
  const config = readDomainEngineConfig();
  if (!config.enabled || config.registrar !== "namecom")
    throw unavailable("Managed DNS is not enabled.");
  if (consent !== true)
    throw unavailable("Approve the exact website records before continuing.");
  const { data, error } = await admin.rpc(
    expectedEnvironment
      ? "claim_managed_dns_plan_environment"
      : "claim_managed_dns_plan",
    {
      p_plan_id: planId,
      p_organization_id: organizationId,
      p_actor_id: actorId,
      ...(expectedEnvironment ? { p_environment: expectedEnvironment } : {}),
    },
  );
  const parsed = claimedPlan.safeParse(data);
  if (
    error ||
    !parsed.success ||
    parsed.data.record.organization_id !== organizationId
  )
    throw unavailable();
  const { claimed, record } = parsed.data;
  if (record.status === "applied")
    return {
      applied: true,
      domainId: record.domain_id,
      reconciled: true,
      publicDnsVerified: false,
    };
  if (!["claimed", "review"].includes(record.status) || !record.claim_token)
    throw unavailable(
      "This DNS plan has expired. Prepare and review a fresh plan.",
    );
  if (
    !claimed &&
    record.status === "claimed" &&
    Date.now() - Date.parse(record.consented_at ?? "") < 600_000
  )
    return { applied: false, working: true, publicDnsVerified: false };
  const ctx = await loadManagedRegistrarContext(
    admin,
    record.registration_id,
    organizationId,
  );
  if (
    (expectedEnvironment &&
      ctx.registration.environment !== expectedEnvironment) ||
    ctx.registration.website_id !== record.website_id ||
    ctx.registration.fqdn !== record.plan.fqdn ||
    ctx.registrar.accountScope !== record.plan.accountScope
  )
    throw unavailable();
  if (ctx.registration.environment === "live") {
    try {
      const { getDeploymentProvider } = await import(
        "@/lib/vigil/providers/registry"
      );
      const provider = getDeploymentProvider();
      await assertManagedDomainDeployment(
        admin,
        record.domain_id,
        provider,
        true,
      );
      const { data: d, error } = await admin
        .from("domains")
        .select("hostname,website_id,verification_token")
        .eq("id", record.domain_id)
        .eq("organization_id", organizationId)
        .single();
      if (
        error ||
        !d?.website_id ||
        !sameWebsiteRecords(
          d.hostname,
          record.plan.expected,
          await deploymentWebsiteRecords(admin, provider, {
            ...d,
            website_id: d.website_id,
          }),
        )
      )
        throw unavailable(
          "The deployment records changed. Review a fresh connection plan.",
        );
    } catch (error) {
      if (claimed)
        await admin.rpc("invalidate_unsubmitted_managed_dns_plan", {
          p_plan_id: planId,
          p_claim_token: record.claim_token,
        });
      throw error;
    }
  }
  let applied = false;
  try {
    if (claimed) {
      const result = await ctx.registrar.applyWebsiteDns(
        ctx.approved,
        record.plan,
        ctx.assetRef,
      );
      applied = result.applied;
    } else {
      // An interrupted worker cannot resume POSTs. Confirm all intended records or require assistance.
      const current = await ctx.registrar.prepareWebsiteDns(
        ctx.approved,
        record.plan.expected,
        ctx.assetRef,
      );
      applied = current.creates.length === 0;
    }
  } catch {
    // Retain the claim for read-only recovery. Never re-submit uncertain DNS creates.
  }
  const { error: finishError } = await admin.rpc("finish_managed_dns_plan", {
    p_plan_id: planId,
    p_claim_token: record.claim_token,
    p_applied: applied,
  });
  if (finishError)
    throw unavailable(
      "The DNS result needs reconciliation before another submission.",
    );
  if (!applied)
    throw unavailable(
      "Vigil is reviewing the existing DNS submission. No duplicate records were submitted.",
    );
  return {
    applied: true,
    domainId: record.domain_id,
    reconciled: !claimed,
    publicDnsVerified: false,
  };
}

/** Used at existing deployment boundaries, before either public checks or domain attachment. */
export async function assertManagedDomainDeployment(
  admin: DbClient,
  domainId: string,
  provider: DeploymentProvider,
  activating = false,
) {
  const { data: domain, error } = await admin
    .from("domains")
    .select("managed_registration_id,organization_id,website_id,hostname")
    .eq("id", domainId)
    .single();
  if (error || !domain) throw unavailable();
  if (!domain.managed_registration_id) {
    if (!readDomainEngineConfig().enabled) return;
    // A managed purchase cannot bypass contact/ownership checks by entering the
    // same name through the older customer-owned connection flow before binding.
    const { data: managed, error: managedError } = await admin
      .from("domain_registrations")
      .select("id")
      .eq("fqdn", domain.hostname)
      .neq("registration_status", "released")
      .limit(1)
      .maybeSingle();
    if (managedError) throw unavailable();
    if (managed)
      throw unavailable(
        "Link this managed registration to its approved website before publishing.",
      );
    return;
  }
  const ctx = await loadManagedRegistrarContext(
    admin,
    domain.managed_registration_id,
    domain.organization_id,
  );
  if (ctx.registration.website_id !== domain.website_id) throw unavailable();
  if (ctx.registration.environment === "test")
    assertManagedTestProvider(provider);
  else if (provider.name !== "vercel")
    throw unavailable("The approved Vercel deployment provider is required.");
  if (activating) {
    const asset = await ctx.registrar.getRegisteredDomainStatus(
      ctx.registration.fqdn,
      ctx.approved,
      ctx.assetRef,
    );
    if (
      !asset ||
      asset.status !== "registered" ||
      asset.contactVerification !== "verified" ||
      (ctx.registration.environment === "live" && asset.autoRenew)
    )
      throw unavailable(
        "Verify the registrant email and resolve any domain hold before launching.",
      );
    const { data: ready, error: readyError } = await admin
      .from("deployments")
      .select("id")
      .eq("website_id", domain.website_id!)
      .eq("environment", "production")
      .eq("status", "ready")
      .limit(1)
      .maybeSingle();
    if (readyError || !ready)
      throw unavailable(
        "Complete the approved production deployment before attaching this domain.",
      );
    const { assertProductionDeployAllowed } = await import(
      "@/lib/vigil/project-reviews"
    );
    await assertProductionDeployAllowed(admin, domain.website_id!);
  }
}
