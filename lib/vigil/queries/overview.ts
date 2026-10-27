import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import {
  DAY,
  leadReport,
  rangeStart,
  type InboxLead,
  type LeadDatum,
} from "@/lib/vigil/overview/model";

/** Bounded, minimal read model; every read is scoped to both organization and website under RLS. */
export async function getOverviewLeads(
  client: DbClient,
  organizationId: string,
  websiteId: string,
  asOf: string,
) {
  const rows: LeadDatum[] = [];
  let historyCount = 0;
  for (let offset = 0; offset < 10_000; offset += 1000) {
    const result = await client
      .from("leads")
      .select("received_at,status,source", { count: "exact" })
      .eq("organization_id", organizationId)
      .eq("website_id", websiteId)
      .gte(
        "received_at",
        new Date(rangeStart(asOf, 90) - 90 * DAY).toISOString(),
      )
      .lte("received_at", asOf)
      .order("received_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 999);
    if (result.error) throw result.error;
    historyCount = result.count ?? 0;
    rows.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 1000 || rows.length >= historyCount) break;
  }
  const [queue, recent, awaiting, unread, settings] = await Promise.all([
    client
      .from("leads")
      .select("id,contact,status,received_at,read_at,source")
      .eq("organization_id", organizationId)
      .eq("website_id", websiteId)
      .eq("status", "new")
      .order("received_at", { ascending: true })
      .limit(5),
    client
      .from("leads")
      .select("id,contact,status,received_at,read_at,source")
      .eq("organization_id", organizationId)
      .eq("website_id", websiteId)
      .neq("status", "spam")
      .order("received_at", { ascending: false })
      .limit(5),
    client
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("website_id", websiteId)
      .eq("status", "new"),
    client
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("website_id", websiteId)
      .neq("status", "spam")
      .is("read_at", null),
    client
      .from("website_contact_settings")
      .select("enabled")
      .eq("organization_id", organizationId)
      .eq("website_id", websiteId)
      .maybeSingle(),
  ]);
  for (const result of [queue, recent, awaiting, unread, settings])
    if (result.error) throw result.error;
  return {
    reports: {
      7: leadReport(rows, 7, asOf),
      30: leadReport(rows, 30, asOf),
      90: leadReport(rows, 90, asOf),
    },
    completeHistory: rows.length >= historyCount,
    historyCount,
    queue: (queue.data ?? []) as InboxLead[],
    recent: (recent.data ?? []) as InboxLead[],
    awaiting: awaiting.count ?? 0,
    unread: unread.count ?? 0,
    captureEnabled: settings.data?.enabled === true,
  };
}
