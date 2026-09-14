import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Feature codes are rows in `features`; this list only names the ones the
 * application reads directly. Adding a feature means a migration (or the
 * admin Plans screen) plus, optionally, a constant here.
 */
export const FEATURES = {
  dashboard: "dashboard.enabled",
  hostingManaged: "hosting.managed",
  domainManaged: "domain.managed",
  requests: "requests.enabled",
  requestsMonthlyAllowance: "requests.monthly_allowance",
  leads: "leads.enabled",
  insights: "insights.enabled",
  insightsLevel: "insights.level",
  virtue: "virtue.enabled",
  virtueLevel: "virtue.level",
  supportLevel: "support.level",
} as const;

export type FeatureCode = (typeof FEATURES)[keyof typeof FEATURES];

export type EntitlementSource = "default" | "plan" | "override";

export type Entitlement = {
  code: string;
  value: unknown;
  source: EntitlementSource;
};

export type Entitlements = {
  planCode: string | null;
  byCode: Map<string, Entitlement>;
  enabled(code: string): boolean;
  limit(code: string): number | null;
  text(code: string): string | null;
};

export function buildEntitlements(
  rows: { feature_code: string; value: unknown; source: string; plan_code: string | null }[]
): Entitlements {
  const byCode = new Map<string, Entitlement>();
  let planCode: string | null = null;
  for (const row of rows) {
    byCode.set(row.feature_code, {
      code: row.feature_code,
      value: row.value,
      source: (row.source as EntitlementSource) ?? "default",
    });
    if (row.plan_code) planCode = row.plan_code;
  }
  return {
    planCode,
    byCode,
    enabled(code) {
      return byCode.get(code)?.value === true;
    },
    limit(code) {
      const v = byCode.get(code)?.value;
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    },
    text(code) {
      const v = byCode.get(code)?.value;
      return typeof v === "string" ? v : null;
    },
  };
}

/** Resolved on the database side (plan → override) and memoised per request. */
export const resolveEntitlements = cache(async (organizationId: string): Promise<Entitlements> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_entitlements", { p_org: organizationId });
  if (error) throw error;
  return buildEntitlements(data ?? []);
});
