import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm } from '@/components/vigil/ActionControls';
import { LeadHubView } from '@/components/vigil/LeadHubView';
import { getLeadHub } from '@/lib/vigil/queries/leads';
import { saveLeadPreferences } from '@/lib/vigil/actions/leads';
import { readLeadFilters } from '@/lib/vigil/leads/presentation';
import { LeadReplyPreferencesForm } from '@/components/vigil/LeadReplyPreferencesForm';
import { saveLeadReplyPreference } from '@/lib/vigil/actions/lead-reply';
import { readLeadReplyPlatform } from '@/lib/vigil/leads/reply';

export const metadata: Metadata = { title: 'Lead Hub' };
export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = readLeadFilters(await searchParams), hub = await getLeadHub(filters);
  const canManage = Boolean(hub.ctx.staffRole) || ['owner', 'manager'].includes(hub.ctx.role);
  const preferenceForms = Object.fromEntries(hub.settings.map(setting => [setting.website_id,
    canManage ? <ActionForm key={setting.website_id} action={saveLeadPreferences.bind(null, setting.website_id)} submitLabel="Save preferences" className="lead-form">
      <div className="lead-form-fields"><label className="lead-field" htmlFor={`recipient-${setting.website_id}`}>Notification email<input id={`recipient-${setting.website_id}`} type="email" name="recipient" required maxLength={254} defaultValue={setting.notification_email} autoComplete="email" /><small>We’ll send new inquiry notifications to this address.</small></label>
      <label className="lead-field" htmlFor={`booking-${setting.website_id}`}>Booking link <span className="lead-sr-only">(optional)</span><input id={`booking-${setting.website_id}`} type="url" name="booking" maxLength={2048} defaultValue={setting.booking_url || ''} placeholder="https://calendly.com/your-link" /><small>Optional. Use the public HTTPS link to your scheduler.</small></label></div>
    </ActionForm> : <div key={setting.website_id}><dl className="lead-contact-facts"><div><dt>Notification email</dt><dd>{setting.notification_email}</dd></div><div><dt>Booking link</dt><dd>{setting.booking_url || 'Not set'}</dd></div></dl><p className="lead-footnote">An owner or manager can update these preferences.</p></div>,
  ]));
  return <LeadHubView data={hub} filters={filters} Link={Link} preferenceForms={preferenceForms} replyPreferencesForm={<LeadReplyPreferencesForm platform={readLeadReplyPlatform(hub.ctx.user.user_metadata)} action={saveLeadReplyPreference} />} />;
}
