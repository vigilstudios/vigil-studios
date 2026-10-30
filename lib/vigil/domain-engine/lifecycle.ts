import "server-only";
import type { DbClient } from "@/lib/vigil/types";

export function renewalNoticeKind(
  expiresAt: string,
  now = new Date(),
): "renewal_60" | "renewal_30" | "renewal_14" | "renewal_7" | "expired" | null {
  const remaining = Math.ceil(
    (Date.parse(expiresAt) - now.getTime()) / 86_400_000,
  );
  if (!Number.isFinite(remaining)) return null;
  if (remaining <= 0) return "expired";
  if (remaining <= 7) return "renewal_7";
  if (remaining <= 14) return "renewal_14";
  if (remaining <= 30) return "renewal_30";
  if (remaining <= 60) return "renewal_60";
  return null;
}

/** Safe reminders only. Renewal billing/registrar changes remain behind approval. */
export async function reconcileDomainLifecycle(
  admin: DbClient,
  now = new Date(),
) {
  let checked = 0,
    delivered = 0,
    cursor = "";
  for (;;) {
    const { data: registrations, error } = await admin
      .from("domain_registrations")
      .select(
        "id,organization_id,fqdn,environment,expires_at,contact_verification,contact_verification_deadline,registration_status,created_at",
      )
      .neq("registration_status", "released")
      .order("id")
      .gt("id", cursor || "00000000-0000-0000-0000-000000000000")
      .limit(200);
    if (error) throw new Error("Domain lifecycle records could not be loaded.");
    for (const asset of registrations ?? []) {
      checked++;
      const renewal = asset.expires_at
        ? renewalNoticeKind(asset.expires_at, now)
        : null;
      const kinds: string[] = renewal ? [renewal] : [];
      if (asset.registration_status === "contact_hold")
        kinds.push("contact_hold");
      else if (asset.contact_verification !== "verified")
        kinds.push("contact_verification");
      for (const kind of kinds) {
        const period =
          kind.startsWith("renewal") || kind === "expired"
            ? asset.expires_at!
            : (asset.contact_verification_deadline ??
              asset.created_at ??
              asset.id);
        const { data, error: noticeError } = await admin.rpc(
          "record_domain_lifecycle_notice",
          {
            p_registration_id: asset.id,
            p_kind: kind,
            p_period_key: period,
          },
        );
        if (noticeError)
          throw new Error("Domain reminder could not be recorded.");
        if (data) delivered++;
      }
    }
    if (!registrations || registrations.length < 200) break;
    cursor = registrations[registrations.length - 1].id;
  }
  return { checked, delivered };
}
