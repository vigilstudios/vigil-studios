"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { readDomainEngineConfig } from "@/lib/vigil/domain-engine/config";
import { logAuditEvent } from "@/lib/vigil/audit";
export async function updateDomainSupport(form: FormData) {
  const staff = await requireStaffOrThrow();
  if (!readDomainEngineConfig().enabled)
    throw new Error("Domain Engine is disabled.");
  const id = z.string().uuid().parse(form.get("request_id"));
  const status = z.enum(["assigned", "resolved"]).parse(form.get("status"));
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("domain_support_requests")
    .update({
      status,
      assigned_to: staff.user.id,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .neq("status", "resolved")
    .select("organization_id")
    .maybeSingle();
  if (error) throw new Error("The support request could not be updated.");
  if (data)
    await logAuditEvent(admin, {
      action: "domain.support_updated",
      organizationId: data.organization_id,
      entityType: "domain_support_request",
      entityId: id,
      after: { status, assigned_to: staff.user.id },
    });
  revalidatePath("/admin/domains/engine");
}
