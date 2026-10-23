import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, CircleCheck, Clock3, FileText, History, Mail, MessageSquareText, SlidersHorizontal } from 'lucide-react';
import type { getLeadDetail } from '@/lib/vigil/queries/leads';
import { formatDateTime, titleCase } from '@/lib/vigil/format';
import { contactInitials, sourceLabel } from '@/lib/vigil/leads/presentation';
import { LeadStatus, type HubLink } from './LeadHubView';
import { leadReplyLink, type LeadReplyPlatform } from '@/lib/vigil/leads/reply';

export type LeadDetailData = Omit<NonNullable<Awaited<ReturnType<typeof getLeadDetail>>>, 'ctx'>;
export function LeadDetailView({ detail, Link, backHref, updateForm, noteForm, replyPlatform }: { detail: LeadDetailData; Link: HubLink; backHref: string; updateForm: ReactNode; noteForm: ReactNode; replyPlatform: LeadReplyPlatform }) {
  const { lead, events, notification } = detail;
  const contact = lead.contact as { name?: string; email?: string; phone?: string; details?: Record<string, string> };
  const name = contact.name || 'Website inquiry';
  const reply = leadReplyLink(replyPlatform, contact.email);
  const delivered = notification?.status === 'sent';
  return <div className="lead-hub">
    <Link href={backHref} className="lead-back"><ArrowLeft size={14} aria-hidden="true" />Back to inbox</Link>
    <header className="lead-page-heading lead-detail-heading"><div className="lead-detail-person"><span className="lead-avatar" aria-hidden="true">{contactInitials(name)}</span><div><h1>{name}</h1><p>Received {formatDateTime(lead.received_at)}</p></div></div>
      {reply && <a className="lead-button" data-primary="true" href={reply.href} target={reply.external ? '_blank' : undefined} rel={reply.external ? 'noopener noreferrer' : undefined}><Mail size={15} aria-hidden="true" />{reply.label}<ArrowUpRight size={14} aria-hidden="true" />{reply.external && <span className="lead-sr-only"> (opens a new tab)</span>}</a>}
    </header>
    <div className="lead-detail-grid"><div className="lead-detail-main">
      <section className="lead-detail-panel" aria-labelledby="lead-message-title"><h2 className="lead-panel-heading" id="lead-message-title"><FileText size={16} aria-hidden="true" />The inquiry</h2><div className="lead-panel-body">
        <dl className="lead-contact-facts"><div><dt>Email address</dt><dd>{contact.email || 'Not provided'}</dd></div><div><dt>Phone number</dt><dd>{contact.phone || 'Not provided'}</dd></div></dl>
        <p className="lead-message">{lead.message}</p>
        <dl className="lead-facts">{Object.entries(contact.details || {}).map(([key, value]) => <div key={key}><dt>{titleCase(key.replace(/-/g, ' '))}</dt><dd>{value}</dd></div>)}<div><dt>Source form</dt><dd>{sourceLabel(lead.source)}</dd></div>{typeof (lead.metadata as { page?: unknown })?.page === 'string' && <div><dt>Submitted from</dt><dd>{(lead.metadata as { page: string }).page}</dd></div>}</dl>
      </div></section>
      <section className="lead-detail-panel" aria-labelledby="lead-activity-title"><h2 className="lead-panel-heading" id="lead-activity-title"><History size={16} aria-hidden="true" />Activity & notes</h2><div className="lead-panel-body">
        {events.length ? <ol className="lead-activity">{events.map(event => <li key={event.id}><span className="lead-activity-icon"><MessageSquareText size={13} aria-hidden="true" /></span><div><strong>{titleCase(event.kind)}</strong><p>{event.body}</p><time dateTime={event.created_at}>{formatDateTime(event.created_at)}</time></div></li>)}</ol> : <p className="lead-delivery-note">No follow-up activity yet. Add a note to keep the next step clear.</p>}
        {noteForm}
      </div></section>
    </div><aside className="lead-detail-aside" aria-label="Manage this inquiry">
      <section className="lead-detail-panel" aria-labelledby="lead-manage-title"><h2 className="lead-panel-heading" id="lead-manage-title"><SlidersHorizontal size={16} aria-hidden="true" />Manage inquiry</h2><div className="lead-panel-body"><LeadStatus status={lead.status} />{updateForm}<p className="lead-settings-note">Set Booked once you’ve confirmed an appointment. Opening a scheduler does not book it here.</p></div></section>
      <section className="lead-detail-panel" aria-labelledby="lead-notification-title"><h2 className="lead-panel-heading" id="lead-notification-title"><Mail size={16} aria-hidden="true" />Email notification</h2><div className="lead-panel-body"><p className="lead-delivery">{delivered ? <CircleCheck size={16} aria-hidden="true" /> : <Clock3 size={16} aria-hidden="true" />}{notification ? delivered ? 'Accepted by email provider' : titleCase(notification.status) : 'No notification recorded'}</p>
        <p className="lead-delivery-note">{notification ? `${notification.attempts} ${notification.attempts === 1 ? 'delivery attempt' : 'delivery attempts'}${notification.sent_at ? ` · ${formatDateTime(notification.sent_at)}` : ''}` : 'This earlier inquiry has no queued notification. It is still saved in your inbox.'}</p>
        {notification?.last_error && <p className="lead-delivery-error" role="status">{notification.last_error}<br />Your inquiry is saved. You can reply directly, or ask Vigil to review notification delivery.</p>}
      </div></section>
    </aside></div>
  </div>;
}
