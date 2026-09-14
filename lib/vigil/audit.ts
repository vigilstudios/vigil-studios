import "server-only";

import type { ServerSupabaseClient } from "@/lib/supabase/server";
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
 * Write an audit row through the definer function. Callers pass the client
 * they are already using so the actor is whoever is signed in; the service
 * role produces `system` rows.
 */
export async function logAuditEvent(supabase: ServerSupabaseClient, input: AuditInput): Promise<void> {
  const metadata: Record<string, Json> = {};
  for (const [k, v] of Object.entries(input.metadata ?? {})) {
    if (v !== undefined) metadata[k] = v;
  }
  const { error } = await supabase.rpc("log_audit_event", {
    p_action: input.action,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId ?? undefined,
    p_org: input.organizationId ?? undefined,
    p_before: input.before ?? undefined,
    p_after: input.after ?? undefined,
    p_metadata: metadata,
  });
  if (error) {
    // Auditing must never take down the action it describes; log loudly instead.
    console.error("log_audit_event failed:", error.message, input.action);
  }
}
