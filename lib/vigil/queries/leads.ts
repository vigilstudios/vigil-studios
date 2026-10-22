import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { readLeadFilters } from "@/lib/vigil/leads/presentation";
import type { leadStatuses } from "@/lib/vigil/contact/contract";
export async function getLeadHub(input: Record<string, unknown>) {
  const filters = readLeadFilters({ ...input, page: typeof input.page === 'number' ? String(input.page) : input.page });
  const ctx = await requireOrgContext("/dashboard/leads"), client = await createClient();
  const page = filters.page;
  let query = client.from("leads").select("*",{count:"exact"}).eq("organization_id",ctx.organization.id);
  if (filters.status) query = query.eq("status",filters.status as typeof leadStatuses[number]);
  if (filters.source) query = query.eq("source",filters.source);
  if (filters.view === 'unread') query = query.is("read_at",null);
  if (filters.q?.trim()) query = query.textSearch("search_document",filters.q.trim().slice(0,200),{type:"websearch",config:"simple"});
  const [rows, unread,settings,sites] = await Promise.all([
    query.order("received_at",{ascending:false}).order("id",{ascending:false}).range((page-1)*25,page*25-1),
    client.from("leads").select("id",{head:true,count:"exact"}).eq("organization_id",ctx.organization.id).is("read_at",null),
    client.from("website_contact_settings").select("*").eq("organization_id",ctx.organization.id),
    client.from("websites").select("id,name,status").eq("organization_id",ctx.organization.id),
  ]);
  for (const result of [rows,unread,settings,sites]) if (result.error) throw result.error;
  return {ctx,leads:rows.data??[],count:rows.count??0,unread:unread.count??0,settings:settings.data??[],sites:sites.data??[],page};
}
export async function getLeadDetail(id: string) {
  const ctx = await requireOrgContext("/dashboard/leads"), client = await createClient();
  const {data:lead,error} = await client.from("leads").select("*").eq("id",id).eq("organization_id",ctx.organization.id).maybeSingle();
  if (error) throw error; if (!lead) return null;
  const [events,notification] = await Promise.all([
    client.from("lead_events").select("*").eq("lead_id",id).eq("organization_id",ctx.organization.id).order("created_at",{ascending:false}),
    client.from("lead_notifications").select("status,attempts,last_error,sent_at").eq("lead_id",id).eq("organization_id",ctx.organization.id).maybeSingle(),
  ]);
  if (events.error) throw events.error; if (notification.error) throw notification.error;
  return {lead,events:events.data??[],notification:notification.data,ctx};
}
