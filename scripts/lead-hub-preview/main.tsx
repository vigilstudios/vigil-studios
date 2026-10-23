import { useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppFrame } from '@/components/vigil/AppFrame';
import { ActionForm } from '@/components/vigil/ActionControls';
import { LeadHubView, type LeadHubData } from '@/components/vigil/LeadHubView';
import { LeadDetailView, type LeadDetailData } from '@/components/vigil/LeadDetailView';
import { readLeadFilters, leadHubHref } from '@/lib/vigil/leads/presentation';
import { leadStatuses } from '@/lib/vigil/contact/contract';
import { LeadReplyPreferencesForm } from '@/components/vigil/LeadReplyPreferencesForm';
import { readLeadReplyPlatform } from '@/lib/vigil/leads/reply';
import { titleCase } from '@/lib/vigil/format';
import Link from './next-stubs';
import '@/app/globals.css';
import '@/components/vigil/vigil.css';
import './preview.css';
const site = 'local-sample-site';
const timestamp = '2026-10-22T14:30:00Z';
const examples = [
  ['Maya Carter', 'maya@example.com', 'new', 'I’d love to collaborate on a fall lifestyle campaign. Your creative direction feels like a perfect fit for our launch.'],
  ['Oliver Bennett', 'oliver@example.com', 'qualified', 'Could you share your availability for a product storytelling project next month?'],
  ['Amelia Rivera', 'amelia@example.com', 'contacted', 'Thank you for the proposal. We’d love to discuss the campaign details.'],
  ['Noah Park', 'noah@example.com', 'booked', 'Looking forward to our upcoming shoot! Sending the final brief this week.'],
  ['Isabella Chen', 'isabella@example.com', 'won', 'The content turned out beautifully. We would love to work together again.'],
] as const;
const baseLeads: LeadHubData['leads'] = examples.map(([name,email,status,message], i) => ({
  id:`sample-${i}`, organization_id:'local-sample-org', website_id:site, contact:{name,email,phone:'+1 (555) 010-0200', details:{'project-type':'Brand collaboration'}}, message, status, source:'inquiries', read_at:i>1?timestamp:null, received_at:timestamp, created_at:timestamp, updated_at:timestamp, metadata:{page:'/contact'}, search_document:null, submission_key:null, submission_hash:null,
}));
function Preview() {
 const params = new URLSearchParams(location.search);
 const filters = readLeadFilters(Object.fromEntries(params));
 const [replyPlatform,setReplyPlatform] = useState(() => readLeadReplyPlatform({lead_reply_platform:sessionStorage.getItem('lead-preview-reply-platform')}));
 const [empty,setEmpty] = useState(params.has('empty'));
 const [leads,setLeads] = useState(baseLeads);
 const [recipient,setRecipient] = useState('hello@example.com');
 const [booking,setBooking] = useState('');
 const [events,setEvents] = useState<LeadDetailData['events']>([]);
 const [fail,setFail] = useState(false);
 const all = empty?[]:leads;
 const matched = all.filter(lead => (!filters.status || lead.status===filters.status) && (!filters.source || lead.source===filters.source) && (filters.view!=='unread' || !lead.read_at) && (!filters.q || JSON.stringify([lead.contact,lead.message]).toLowerCase().includes(filters.q.toLowerCase())));
 const data: LeadHubData = { leads: matched.slice((filters.page-1)*25, filters.page*25), count:matched.length, unread:all.filter(row=>!row.read_at).length, page:filters.page, sites:[{id:site,name:'Scarlen Lopez',status:'building'}], settings:[{website_id:site,organization_id:'local-sample-org',enabled:false,notification_email:recipient,booking_url:booking||null,allowed_origins:[],daily_limit:100,updated_at:timestamp}] };
 const result = () => fail ? {ok:false as const,error:'Preview: save failed. Your changes have not been saved.',code:'validation' as const} : {ok:true as const,data:undefined};
 const form = <ActionForm key={`${recipient}-${booking}`} className="lead-form" submitLabel="Save preferences" action={async form=>{ const r=result(); if(r.ok){setRecipient(String(form.get('recipient')));setBooking(String(form.get('booking')));}return r; }}><div className="lead-form-fields"><label className="lead-field">Notification email<input name="recipient" type="email" required defaultValue={recipient} /><small>We’ll send new inquiry notifications to this address.</small></label><label className="lead-field">Booking link<input name="booking" type="url" defaultValue={booking} placeholder="https://calendly.com/your-link" /><small>Optional. Use the public HTTPS link to your scheduler.</small></label></div></ActionForm>;
 const selected = leads.find(row=>row.id===params.get('detail'));
 let content: ReactNode = <LeadHubView data={data} filters={filters} Link={PreviewLink} preferenceForms={{[site]:form}} replyPreferencesForm={<LeadReplyPreferencesForm platform={replyPlatform} action={async form=>{const r=result();if(r.ok){const value=readLeadReplyPlatform({lead_reply_platform:form.get('reply_platform')});sessionStorage.setItem('lead-preview-reply-platform',value);setReplyPlatform(value);}return r;}} />} />;
 if(selected) content=<LeadDetailView replyPlatform={replyPlatform} detail={{lead:selected,events,notification:{status:'sent',attempts:1,sent_at:timestamp,last_error:null}}} Link={PreviewLink} backHref={params.get('back')||leadHubHref(filters)} updateForm={<ActionForm key={`${selected.status}-${selected.read_at}`} className="lead-form mt-5" submitLabel="Save changes" action={async form=>{const r=result();if(r.ok)setLeads(rows=>rows.map(row=>row.id===selected.id?{...row,status:String(form.get('status')) as typeof row.status,read_at:form.get('read')==='read'?timestamp:null}:row));return r;}}><div className="lead-form-fields"><label className="lead-field">Status<select name="status" defaultValue={selected.status}>{leadStatuses.map(value=><option key={value} value={value}>{titleCase(value)}</option>)}</select></label><label className="lead-field">Read state<select name="read" defaultValue={selected.read_at?'read':'unread'}><option value="read">Read</option><option value="unread">Unread</option></select></label></div></ActionForm>} noteForm={<ActionForm className="lead-form mt-6" submitLabel="Add note" action={async form=>{const r=result();if(r.ok)setEvents(rows=>[{id:String(Date.now()),lead_id:selected.id,organization_id:'local-sample-org',kind:'note',body:String(form.get('note')),created_at:timestamp,actor_user_id:null},...rows]);return r;}}><label className="lead-field">Internal follow-up note<textarea name="note" required maxLength={4000} placeholder="What’s the next step?" /><small>Only your team can see these notes.</small></label></ActionForm>} />;
 return <AppFrame initialCollapsed={false} homeHref="/" groups={[{items:[{href:'/dashboard',label:'Overview',icon:'overview',exact:true},{href:'/dashboard/website',label:'My Website',icon:'website'},{href:'/dashboard/content',label:'Content Hub',icon:'blog'},{href:'/dashboard/leads',label:'Lead Hub',icon:'leads'},{href:'/dashboard/insights',label:'Insights',icon:'insights'}]},{items:[{href:'/dashboard/domain',label:'Domain',icon:'domain'},{href:'/dashboard/billing',label:'Billing',icon:'billing'},{href:'/dashboard/requests',label:'Requests',icon:'requests'},{href:'/dashboard/files',label:'Files',icon:'files'},{href:'/dashboard/settings',label:'Settings',icon:'settings'}]}]} workspace={<span className="font-medium">Scarlen Lopez</span>} account={<span className="block p-3 text-xs text-[color:var(--text-secondary)]">Local design preview</span>}><div className="preview-tools"><strong>Design preview · sample data</strong><label><input type="checkbox" checked={empty} onChange={e=>setEmpty(e.target.checked)} />Empty inbox</label><label><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)} />Simulate save error</label><button onClick={()=>document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light'}>Switch theme</button></div>{content}</AppFrame>;
}
function PreviewLink({href,...props}: Parameters<typeof Link>[0]) {
 let target=href||'/';
 if(target.startsWith('/dashboard/leads/')){const url=new URL(target,location.origin);url.searchParams.set('detail',url.pathname.split('/').pop()!);target=`/?${url.searchParams}`;}
 else if(target.startsWith('/dashboard/leads')) target=`/${target.slice('/dashboard/leads'.length)}`;
 else target='/?view=settings';
 return <Link {...props} href={target} />;
}
// This standalone Vite lab intentionally uses native full-page navigation.
/* eslint-disable @next/next/no-location-assign-relative-destination */
// Native GET search remains real, but points to this local fixture instead of a dashboard route.
window.addEventListener('submit',event=>{const form=event.target;if(form instanceof HTMLFormElement && form.getAttribute('action')==='/dashboard/leads'){event.preventDefault();location.href=`/?${new URLSearchParams(new FormData(form) as unknown as Record<string,string>)}`;}});
createRoot(document.getElementById('root')!).render(<Preview />);
