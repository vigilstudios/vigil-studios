import "server-only";

import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/vigil/auth/session";
import type { Json } from "@/types/database.types";

export type AuditInput = {
  action: string; // dotted, e.g. "member.invited"
  entityType: string;
  entityId?: string | null;
  organizationId?: string | null;
  before?: Json | null;
  after?: Json | null;
  metadata?: Record<string, Json | undefined>;
};

/**
 * Write an audit row through the definer function. A customer session may
 * not call log_audit_event itself (only the server, staff and trusted
 * triggers write audit rows), so the row is written with the service role
 * and names the signed-in person as the actor; the caller's own client is
 * the fallback when no service key is configured (staff sessions still
 * succeed that way, customer rows are logged as failures instead).
 */
export async function logAuditEvent(supabase: ServerSupabaseClient, input: AuditInput): Promise<void> {
  const metadata: Record<string, Json> = {};
  for (const [k, v] of Object.entries(input.metadata ?? {})) {
    if (v !== undefined) metadata[k] = v;
  }
  const user = await getSessionUser();
  const client = hasAdminClient() ? createAdminClient() : supabase;
  const { error } = await client.rpc("log_audit_event", {
    p_action: input.action,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId ?? undefined,
    p_org: input.organizationId ?? undefined,
    p_before: input.before ?? undefined,
    p_after: input.after ?? undefined,
    p_metadata: metadata,
    p_actor_user_id: user?.id ?? undefined,
  });
  if (error) {
    // Auditing must never take down the action it describes; log loudly instead.
    console.error("log_audit_event failed:", error.message, input.action);
  }
}
