import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionForm } from "@/components/vigil/ActionControls";
import { Card, PageHeader, inputClass, labelClass } from "@/components/vigil/ui";
import { getLeadDetail } from "@/lib/vigil/queries/leads";
import { addLeadNote, updateLead } from "@/lib/vigil/actions/leads";
import { leadStatuses } from "@/lib/vigil/contact/contract";
import { formatDateTime, titleCase } from "@/lib/vigil/format";
export default async function LeadPage({params}:{params:Promise<{leadId:string}>}) {
 const {leadId}=await params;if(!z.string().uuid().safeParse(leadId).success)notFound();
 const detail=await getLeadDetail(leadId);if(!detail)notFound();
 const {lead,events,notification}=detail,c=lead.contact as {name?:string;email?:string;phone?:string;details?:Record<string,string>};
 return <div><Link className="text-sm underline" href="/dashboard/leads">← Lead Hub</Link><PageHeader title={c.name??'Website inquiry'} description={formatDateTime(lead.received_at)}/>
 <div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="font-semibold">Inquiry</h2><p className="mt-3">{c.email}</p>{c.phone&&<p>{c.phone}</p>}<p className="mt-4 whitespace-pre-wrap">{lead.message}</p>{Object.entries(c.details??{}).map(([key,value])=><p key={key} className="mt-2 text-sm">{titleCase(key)}: {value}</p>)}<p className="mt-4 text-xs">Source: {lead.source} · {(lead.metadata as {page?:string}).page}</p>
 <ActionForm action={updateLead.bind(null,lead.id)} submitLabel="Update inquiry" className="mt-5 space-y-3"><div><label className={labelClass} htmlFor="status">Status</label><select id="status" name="status" className={inputClass} defaultValue={lead.status}>{leadStatuses.map(s=><option key={s} value={s}>{titleCase(s)}</option>)}</select></div><div><label className={labelClass} htmlFor="read">Read state</label><select id="read" name="read" defaultValue={lead.read_at?'read':'unread'} className={inputClass}><option value="read">Read</option><option value="unread">Unread</option></select></div></ActionForm>
 <p className="mt-3 text-xs text-[color:var(--text-secondary)]">Set Booked after confirming an appointment with the visitor. Opening a scheduler does not book it here.</p>
 </Card><Card><h2 className="font-semibold">Client email notification</h2><p className="mt-3">{notification?titleCase(notification.status):'No notification queued for this earlier inquiry.'}</p>{notification&&<p className="mt-1 text-sm">Attempts: {notification.attempts}{notification.sent_at?` · Provider accepted ${formatDateTime(notification.sent_at)}`:''}</p>}{notification?.last_error&&<p role="status" className="mt-3 text-sm">{notification.last_error} Your inquiry remains saved; contact the visitor directly or ask Vigil to review delivery.</p>}<h2 className="mt-6 font-semibold">Activity</h2><ol className="mt-3 space-y-4">{events.map(e=><li key={e.id}><p className="whitespace-pre-wrap text-sm">{e.body}</p><p className="mt-1 text-xs text-[color:var(--text-secondary)]">{formatDateTime(e.created_at)}</p></li>)}</ol><ActionForm action={addLeadNote.bind(null,lead.id)} submitLabel="Add note" className="mt-6 space-y-3"><label className={labelClass} htmlFor="note">Internal follow-up note</label><textarea id="note" name="note" required maxLength={4000} className={inputClass} rows={4}/></ActionForm></Card></div></div>;
}
