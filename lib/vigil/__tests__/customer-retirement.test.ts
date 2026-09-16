import { describe, expect, it, vi } from "vitest";
import type { BillingProvider } from "../providers/types";
import type { AdminSupabaseClient } from "@/lib/supabase/admin";
import type { DeploymentProvider } from "../providers/types";
import { cancelRemoteSubscriptions, permanentlyDeleteCustomer } from "../services/customer-retirement";

const subscription = (status: "active" | "canceled" = "active") => ({
  externalId: "sub_live",
  customerExternalId: "cus_1",
  priceExternalId: "price_1",
  status,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  canceledAt: status === "canceled" ? new Date().toISOString() : null,
  trialEnd: null,
});

function provider(mode: "live" | "test" = "live", remote: ReturnType<typeof subscription> | null = subscription()) {
  return {
    name: "stripe",
    mode,
    getSubscription: vi.fn().mockResolvedValue(remote),
    cancelSubscription: vi.fn().mockResolvedValue(subscription("canceled")),
  } as unknown as BillingProvider;
}

describe("customer retirement billing safety", () => {
  it("verifies and immediately cancels every linked active subscription", async () => {
    const billing = provider();
    await cancelRemoteSubscriptions(
      [{ id: "db_sub", status: "active" }],
      [{ entity_id: "db_sub", external_id: "sub_live", metadata: { mode: "live" } }],
      billing
    );
    expect(billing.getSubscription).toHaveBeenCalledWith("sub_live");
    expect(billing.cancelSubscription).toHaveBeenCalledWith("sub_live", { atPeriodEnd: false });
  });

  it("is retry-safe when Stripe already reports the subscription canceled", async () => {
    const billing = provider("live", subscription("canceled"));
    await cancelRemoteSubscriptions(
      [{ id: "db_sub", status: "active" }],
      [{ entity_id: "db_sub", external_id: "sub_live", metadata: {} }],
      billing
    );
    expect(billing.cancelSubscription).not.toHaveBeenCalled();
  });

  it("fails closed on a mode mismatch instead of leaving billing active", async () => {
    const billing = provider("live");
    await expect(cancelRemoteSubscriptions(
      [{ id: "db_sub", status: "active" }],
      [{ entity_id: "db_sub", external_id: "sub_test", metadata: { mode: "test" } }],
      billing
    )).rejects.toThrow("different Stripe mode");
    expect(billing.cancelSubscription).not.toHaveBeenCalled();
  });

  it("fails closed when the linked subscription cannot be verified at Stripe", async () => {
    const billing = provider("live", null);
    await expect(cancelRemoteSubscriptions(
      [{ id: "db_sub", status: "active" }],
      [{ entity_id: "db_sub", external_id: "sub_missing", metadata: { mode: "live" } }],
      billing
    )).rejects.toThrow("could not be verified");
    expect(billing.cancelSubscription).not.toHaveBeenCalled();
  });

  it("treats a subscription without a provider link as manual billing", async () => {
    const billing = provider();
    await cancelRemoteSubscriptions([{ id: "manual", status: "active" }], [], billing);
    expect(billing.getSubscription).not.toHaveBeenCalled();
    expect(billing.cancelSubscription).not.toHaveBeenCalled();
  });
});

function resultBuilder(data: unknown) {
  const result = { data, error: null };
  const builder = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    maybeSingle: async () => result,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(resolve(result)),
  };
  return builder;
}

describe("customer permanent deletion orchestration", () => {
  it("cleans providers and uploads before committing the database purge", async () => {
    const events: string[] = [];
    const org = {
      id: "org_1", name: "Test", slug: "test", billing_email: "test@example.com", archived_at: "2026-01-01T00:00:00Z",
      projects: [{ id: "project_1", name: "Site", kind: "express" }],
      websites: [
        { id: "website_1", name: "Site", repository_ref: "github:vigil/client-test" },
        { id: "website_2", name: "Legacy", repository_ref: "clients/legacy" },
      ],
      subscriptions: [{ id: "sub_db", status: "canceled" }], organization_members: [],
    };
    const links = [
      { provider: "vercel", resource_kind: "site", external_id: "prj_1", entity_id: "website_1", metadata: {} },
      { provider: "other", resource_kind: "repository", external_id: "42", entity_id: "website_1", metadata: { full_name: "vigil/client-test" } },
    ];
    const tables: Record<string, unknown> = {
      organizations: org,
      provider_links: links,
      project_assets: [{ bucket_id: "project-assets", object_path: "org_1/project_1/logo.png" }],
      change_request_attachments: [],
      project_review_attachments: [],
    };
    const rpc = vi.fn(async () => { events.push("database"); return { data: null, error: null }; });
    const remove = vi.fn(async () => { events.push("storage"); return { data: [], error: null }; });
    const admin = {
      from: vi.fn((table: string) => resultBuilder(tables[table])),
      storage: { from: () => ({ remove }) },
      schema: () => ({ rpc }),
    } as unknown as AdminSupabaseClient;
    const deployment = { name: "vercel", deleteSite: vi.fn(async () => { events.push("vercel"); }) } as unknown as DeploymentProvider;
    const github = { deleteRepository: vi.fn(async () => { events.push("github"); }) };

    await permanentlyDeleteCustomer("org_1", "staff_1", { admin, deployment, github });

    expect(deployment.deleteSite).toHaveBeenCalledWith("prj_1");
    expect(github.deleteRepository).toHaveBeenCalledTimes(1);
    expect(github.deleteRepository).toHaveBeenCalledWith("vigil/client-test");
    expect(remove).toHaveBeenCalledWith(["org_1/project_1/logo.png"]);
    expect(rpc).toHaveBeenCalledWith("purge_organization", expect.objectContaining({ p_organization_id: "org_1", p_deleted_by: "staff_1" }));
    expect(events).toEqual(["vercel", "github", "storage", "database"]);
  });

  it("never purges database rows when an external cleanup fails", async () => {
    const org = {
      id: "org_1", name: "Test", slug: "test", billing_email: null, archived_at: "2026-01-01T00:00:00Z",
      projects: [], websites: [{ id: "website_1", name: "Site", repository_ref: null }], subscriptions: [], organization_members: [],
    };
    const links = [{ provider: "vercel", resource_kind: "site", external_id: "prj_1", entity_id: "website_1", metadata: {} }];
    const rpc = vi.fn();
    const admin = {
      from: vi.fn((table: string) => resultBuilder(table === "organizations" ? org : table === "provider_links" ? links : [])),
      storage: { from: () => ({ remove: vi.fn() }) },
      schema: () => ({ rpc }),
    } as unknown as AdminSupabaseClient;
    const deployment = { name: "vercel", deleteSite: vi.fn().mockRejectedValue(new Error("Vercel unavailable")) } as unknown as DeploymentProvider;

    await expect(permanentlyDeleteCustomer("org_1", "staff_1", { admin, deployment, github: { deleteRepository: vi.fn() } })).rejects.toThrow("Vercel unavailable");
    expect(rpc).not.toHaveBeenCalled();
  });
});
