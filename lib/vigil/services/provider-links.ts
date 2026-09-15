import type { DbClient, Provider } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";

/**
 * `provider_links` is the only place an external identifier lives. These
 * helpers keep the (provider, resource_kind, external_id) ↔ entity mapping
 * idempotent so retries and reconciliation never duplicate a row.
 */
export type LinkEntityType = "organization" | "subscription" | "plan_price" | "build_price" | "website" | "deployment" | "domain" | "order";

export async function upsertProviderLink(
  admin: DbClient,
  link: {
    provider: Provider;
    resourceKind: string;
    externalId: string;
    entityType: LinkEntityType;
    entityId: string;
    metadata?: Record<string, Json>;
  }
): Promise<void> {
  // Metadata is only written when given, so a re-link (provisioning
  // re-asserting a price it saw on a subscription) keeps existing stamps
  // such as the Stripe mode.
  const { error } = await admin.from("provider_links").upsert(
    {
      provider: link.provider,
      resource_kind: link.resourceKind,
      external_id: link.externalId,
      entity_type: link.entityType,
      entity_id: link.entityId,
      ...(link.metadata ? { metadata: link.metadata } : {}),
    },
    { onConflict: "provider,resource_kind,external_id" }
  );
  if (error) throw error;
}

export async function findExternalId(
  admin: DbClient,
  query: { provider: Provider; resourceKind: string; entityType: LinkEntityType; entityId: string }
): Promise<string | null> {
  const { data, error } = await admin
    .from("provider_links")
    .select("external_id")
    .eq("provider", query.provider)
    .eq("resource_kind", query.resourceKind)
    .eq("entity_type", query.entityType)
    .eq("entity_id", query.entityId)
    .maybeSingle();
  if (error) throw error;
  return data?.external_id ?? null;
}

export async function findEntityByExternalId(
  admin: DbClient,
  query: { provider: Provider; resourceKind: string; externalId: string }
): Promise<{ entityType: string; entityId: string } | null> {
  const { data, error } = await admin
    .from("provider_links")
    .select("entity_type, entity_id")
    .eq("provider", query.provider)
    .eq("resource_kind", query.resourceKind)
    .eq("external_id", query.externalId)
    .maybeSingle();
  if (error) throw error;
  return data ? { entityType: data.entity_type, entityId: data.entity_id } : null;
}

/** Map a provider adapter name onto the database enum. */
export function providerEnum(name: string): Provider {
  switch (name) {
    case "stripe":
    case "vercel":
    case "cloudflare":
    case "resend":
      return name;
    default:
      return "other";
  }
}
