import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { loadManagedRegistrarContext } from "./managed-connection";
import { assertDomainTestDatabase } from "./runtime";
import { liveRegistrarScope, assertDomainLiveRuntime } from "./live-policy";
import { namecomSandboxScope } from "./namecom-sandbox";
import { DomainEngineError } from "./errors";

/** Reads the original receipt and approved client owner; payment refunds do not remove ownership. */
export async function syncManagedRegistration(
  admin: DbClient,
  registrationId: string,
  organizationId: string,
  observedAt = new Date(),
) {
  const ctx = await loadManagedRegistrarContext(
    admin,
    registrationId,
    organizationId,
    false,
  );
  const snapshot = await ctx.registrar.getRegisteredDomainStatus(
    ctx.registration.fqdn,
    ctx.approved,
    ctx.assetRef,
  );
  if (!snapshot)
    throw new DomainEngineError(
      "registrar_state_unknown",
      "The registrar state needs review. No release or purchase was submitted.",
      503,
    );
  const { data, error } = await admin.rpc("sync_managed_domain_state", {
    p_registration_id: registrationId,
    p_snapshot: snapshot as unknown as Json,
    p_external_id: snapshot.externalId,
    p_account_scope: ctx.registrar.accountScope,
    p_observed_at: observedAt.toISOString(),
  });
  if (error)
    throw new DomainEngineError(
      "registrar_sync_failed",
      "The registrar state could not be saved.",
      503,
    );
  return {
    changed: data === true,
    status: snapshot.status,
    contactVerification: snapshot.contactVerification,
  };
}

/** Bounded polling fallback. Webhook bodies only wake this authenticated read path. */
export async function syncManagedRegistrations(
  admin: DbClient,
  options: {
    accountScope?: string;
    cursor?: string;
    force?: boolean;
    limit?: number;
    environment?: "test" | "live";
  } = {},
) {
  const environment =
    options.environment ??
    (options.accountScope?.startsWith("namecom:live:") ? "live" : "test");
  if (environment === "test") assertDomainTestDatabase();
  else assertDomainLiveRuntime();
  const scope =
    environment === "live"
      ? liveRegistrarScope()
      : namecomSandboxScope(process.env.VIGIL_NAMECOM_SANDBOX_USERNAME ?? "");
  if (options.accountScope && options.accountScope !== scope)
    throw new DomainEngineError(
      "registrar_scope_mismatch",
      "Reconcile this event with its original registrar account.",
      503,
    );
  const limit = Math.min(5, Math.max(1, options.limit ?? 5));
  let query = admin
    .from("domain_registrations")
    .select("id,organization_id,next_check_at")
    .eq("registrar", "namecom")
    .eq("environment", environment)
    .neq("registration_status", "released")
    .gt("id", options.cursor ?? "00000000-0000-0000-0000-000000000000")
    .order("id")
    .limit(limit);
  if (!options.force)
    query = query.lte("next_check_at", new Date().toISOString());
  const { data: rows, error } = await query;
  if (error)
    throw new DomainEngineError(
      "registrar_sync_failed",
      "The registrar check queue could not be loaded.",
      503,
    );
  let checked = 0,
    changed = 0,
    failed = 0;
  for (const row of rows ?? []) {
    checked++;
    try {
      if (
        (await syncManagedRegistration(admin, row.id, row.organization_id))
          .changed
      )
        changed++;
    } catch {
      failed++;
      const { error: retryError } = await admin
        .from("domain_registrations")
        .update({
          next_check_at: new Date(Date.now() + 30 * 60_000).toISOString(),
        })
        .eq("id", row.id)
        .eq("environment", environment);
      if (retryError)
        throw new DomainEngineError(
          "registrar_sync_failed",
          "The registrar retry could not be saved.",
          503,
        );
    }
  }
  return {
    checked,
    changed,
    failed,
    nextCursor: rows?.length === limit ? rows[rows.length - 1].id : null,
  };
}
