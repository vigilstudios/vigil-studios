import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ActionForm } from '@/components/vigil/ActionControls';
import { LeadDetailView } from '@/components/vigil/LeadDetailView';
import { getLeadDetail } from '@/lib/vigil/queries/leads';
import { addLeadNote, updateLead } from '@/lib/vigil/actions/leads';
import { leadStatuses } from '@/lib/vigil/contact/contract';
import { titleCase } from '@/lib/vigil/format';
import { leadBackHref } from '@/lib/vigil/leads/presentation';
import { readLeadReplyPlatform } from '@/lib/vigil/leads/reply';
import { ArrowUpRight, Mail } from 'lucide-react';
import { gmailConnectionStatus } from '@/lib/vigil/gmail/connection';

export default async function LeadPage({ params, searchParams }: { params: Promise<{ leadId: string }>; searchParams: Promise<{ back?: string | string[]; gmail?: string | string[] }> }) {
  const { leadId } = await params;
  if (!z.string().uuid().safeParse(leadId).success) notFound();
  const detail = await getLeadDetail(leadId);
  if (!detail) notFound();
  const { lead } = detail;
  const input = await searchParams, replyPlatform = readLeadReplyPlatform(detail.ctx.user.user_metadata);
  const gmail = replyPlatform === 'gmail' ? await gmailConnectionStatus(detail.ctx.user.id) : null;
  const gmailReplyAction = gmail?.email && gmail.configured ? <form method="post" action={`/api/gmail/drafts/${lead.id}`} target="_blank" rel="noopener"><button className="lead-button" data-primary="true" type="submit"><Mail size={15} aria-hidden="true" />Reply in Gmail<ArrowUpRight size={14} aria-hidden="true" /><span className="lead-sr-only"> (opens a new tab)</span></button></form> : undefined;
  const updateForm = <ActionForm action={updateLead.bind(null, lead.id)} submitLabel="Save changes" className="lead-form mt-5">
    <div className="lead-form-fields"><label className="lead-field" htmlFor="lead-status">Status<select id="lead-status" name="status" defaultValue={lead.status}>{leadStatuses.map(status => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
    <label className="lead-field" htmlFor="lead-read">Read state<select id="lead-read" name="read" defaultValue={lead.read_at ? 'read' : 'unread'}><option value="read">Read</option><option value="unread">Unread</option></select></label></div>
  </ActionForm>;
  const noteForm = <ActionForm action={addLeadNote.bind(null, lead.id)} submitLabel="Add note" className="lead-form mt-6"><label className="lead-field" htmlFor="lead-note">Internal follow-up note<textarea id="lead-note" name="note" required maxLength={4000} rows={4} placeholder="What’s the next step? Add context for your follow-up…" /><small>Only your team can see these notes.</small></label></ActionForm>;
  return <LeadDetailView detail={detail} Link={Link} backHref={leadBackHref(input.back)} updateForm={updateForm} noteForm={noteForm} replyPlatform={replyPlatform} gmailReplyAction={gmailReplyAction} gmailError={input.gmail === 'error'} />;
}
