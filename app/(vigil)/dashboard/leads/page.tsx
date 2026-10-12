import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/vigil/ActionControls";
import { Card, PageHeader, inputClass, labelClass } from "@/components/vigil/ui";
import { getLeadHub } from "@/lib/vigil/queries/leads";
import { saveLeadPreferences } from "@/lib/vigil/actions/leads";
import { leadStatuses } from "@/lib/vigil/contact/contract";
import { formatDateTime, titleCase } from "@/lib/vigil/format";
export const metadata: Metadata = { title: "Lead Hub" };
export default async function LeadsPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;source?:string;page?:string}>}) {
  const filters=await searchParams,hub=await getLeadHub(filters);
  function pageLink(page:number){const params=new URLSearchParams();for(const key of ['q','status','source'] as const)if(filters[key])params.set(key,filters[key]!);params.set('page',String(page));return `/dashboard/leads?${params}`;}
  return <div><PageHeader eyebrow="Website inquiries" title="Lead Hub" description={`${hub.unread} unread · Contact details, follow-up notes and notification status in one place.`}/>
    <Card><form className="grid gap-3 sm:grid-cols-4" action="/dashboard/leads">
      <div><label className={labelClass} htmlFor="lead-search">Search inquiries</label><input id="lead-search" name="q" className={inputClass} defaultValue={filters.q} maxLength={200} placeholder="Name, email or message"/></div>
      <div><label className={labelClass} htmlFor="lead-status">Status</label><select id="lead-status" name="status" className={inputClass} defaultValue={filters.status??''}><option value="">All statuses</option>{leadStatuses.map(s=><option key={s} value={s}>{titleCase(s)}</option>)}</select></div>
      <div><label className={labelClass} htmlFor="lead-source">Source form</label><input id="lead-source" name="source" className={inputClass} defaultValue={filters.source} maxLength={80} placeholder="All sources"/></div>
      <button className="btn-secondary self-end" type="submit">Apply filters</button></form>
      <ul className="mt-5 divide-y divide-[color:var(--border)]">{hub.leads.map(lead=>{
        const c=lead.contact as {name?:string;email?:string};return <li key={lead.id}><Link className="flex flex-wrap justify-between gap-3 py-4" href={`/dashboard/leads/${lead.id}`}><div><p className="font-semibold">{lead.read_at?null:<span className="mr-2 text-[color:var(--accent)]" aria-label="Unread">●</span>}{c.name||'Website visitor'}</p><p className="text-sm text-[color:var(--text-secondary)]">{c.email} · {hub.sites.find(s=>s.id===lead.website_id)?.name??'Website'} · {lead.source}</p><p className="mt-1 line-clamp-2 max-w-xl text-sm">{lead.message}</p></div><p className="text-xs text-[color:var(--text-secondary)]">{titleCase(lead.status)}<br/>{formatDateTime(lead.received_at)}</p></Link></li>;
      })}</ul>{hub.leads.length===0&&<p className="py-10 text-sm text-[color:var(--text-secondary)]">No inquiries match these filters. Connected website inquiries will appear here.</p>}
      <div className="mt-4 flex justify-between text-sm"><span>{hub.count} inquiries</span><div className="flex gap-4">{hub.page>1&&<Link href={pageLink(hub.page-1)}>Previous</Link>}{hub.page*25<hub.count&&<Link href={pageLink(hub.page+1)}>Next</Link>}</div></div>
    </Card>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">{hub.settings.map(setting=><Card key={setting.website_id}><h2 className="font-semibold">{hub.sites.find(s=>s.id===setting.website_id)?.name??'Website'} settings</h2><p className="mt-1 text-sm">{setting.enabled?'Contact submissions connected.':'Contact submissions awaiting launch or activation.'}</p>
      <ActionForm action={saveLeadPreferences.bind(null,setting.website_id)} submitLabel="Save preferences" className="mt-4 space-y-3"><div><label className={labelClass} htmlFor={`recipient-${setting.website_id}`}>Notify this email address</label><input id={`recipient-${setting.website_id}`} type="email" name="recipient" required maxLength={254} defaultValue={setting.notification_email} className={inputClass}/></div><div><label className={labelClass} htmlFor={`booking-${setting.website_id}`}>Booking link (optional)</label><input id={`booking-${setting.website_id}`} type="url" name="booking" maxLength={2048} defaultValue={setting.booking_url??''} className={inputClass} placeholder="https://…"/></div></ActionForm><p className="mt-3 text-xs text-[color:var(--text-secondary)]">Booking opens your scheduler. Appointments are not synchronized with Lead Hub yet.</p></Card>)}</div>
    <p className="mt-5 text-xs text-[color:var(--text-secondary)]">Website inquiry capture is included for connected sites. Virtue AI and advanced automation retain their plan requirements. No automatic replies are sent.</p>
  </div>;
}
