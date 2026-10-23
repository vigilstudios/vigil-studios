import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { leadReplyLink, leadReplyPlatforms, readLeadReplyPlatform } from '../leads/reply';
import { UnauthenticatedError } from '../auth/errors';

const mocks = vi.hoisted(() => ({ viewer: vi.fn(), client: vi.fn(), update: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/vigil/auth/session', () => ({ requireViewerOrThrow: mocks.viewer }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { saveLeadReplyPreference } from '../actions/lead-reply';
import { LeadDetailView, type LeadDetailData } from '@/components/vigil/LeadDetailView';
import { LeadReplyPreferencesForm } from '@/components/vigil/LeadReplyPreferencesForm';
import type { HubLink } from '@/components/vigil/LeadHubView';

const Link: HubLink = props => <a {...props} />;
const detail = {
  lead: { id: 'lead', contact: { name: 'Maya', email: 'maya+campaign@example.com' }, message: 'Campaign inquiry', received_at: '2026-10-22T14:30:00Z', status: 'new', source: 'inquiries', metadata: {} },
  events: [], notification: null,
} as unknown as LeadDetailData;
function form(platform: string) { const data = new FormData(); data.set('reply_platform', platform); return data; }

beforeEach(() => {
  vi.clearAllMocks();
  mocks.viewer.mockResolvedValue({ user: { id: 'signed-in-user' }, role: 'member' });
  mocks.client.mockResolvedValue({ auth: { updateUser: mocks.update } });
  mocks.update.mockResolvedValue({ data: { user: { id: 'signed-in-user' } }, error: null });
});

describe('Personal reply preference', () => {
  it.each(leadReplyPlatforms)('reads the persisted %s preference', platform => {
    expect(readLeadReplyPlatform({ lead_reply_platform: platform, full_name: 'Unchanged' })).toBe(platform);
  });
  it.each([null, undefined, [], 'gmail', {}, { lead_reply_platform: 'https://evil.example' }, { lead_reply_platform: 123 }, { lead_reply_platform: ['gmail'] }])('falls back safely for unsupported metadata %j', metadata => {
    expect(readLeadReplyPlatform(metadata)).toBe('default');
  });
  it.each(leadReplyPlatforms)('saves %s for the signed-in user without accepting another user id or replacing other metadata', async platform => {
    const data = form(platform);
    data.set('user_id', 'someone-else');
    data.set('role', 'admin');
    expect(await saveLeadReplyPreference(data)).toEqual({ ok: true, data: undefined });
    expect(mocks.viewer).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ data: { lead_reply_platform: platform } });
    expect(mocks.revalidate).toHaveBeenCalledWith('/dashboard/leads', 'layout');
  });
  it('rejects unsupported platforms before making a write', async () => {
    expect(await saveLeadReplyPreference(form('https://evil.example'))).toMatchObject({ ok: false, code: 'validation' });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('requires authentication for personal preferences', async () => {
    mocks.viewer.mockRejectedValueOnce(new UnauthenticatedError());
    expect(await saveLeadReplyPreference(form('gmail'))).toMatchObject({ ok: false, code: 'unauthenticated' });
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it.each([
    { data: { user: null }, error: { message: 'provider private detail' } },
    { data: { user: null }, error: null },
  ])('reports persistence failure without success or revalidation', async response => {
    mocks.update.mockResolvedValueOnce(response);
    const result = await saveLeadReplyPreference(form('gmail'));
    expect(result).toMatchObject({ ok: false, error: 'Your reply preference could not be saved. Please try again.' });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});

describe('Draft links', () => {
  it.each([
    ['outlook', 'outlook.live.com', 'subject'],
    ['microsoft365', 'outlook.office.com', 'subject'],
  ] as const)('opens %s with exactly the intended recipient and subject', (platform, host, subjectKey) => {
    const link = leadReplyLink(platform, ' maya+film%20@example.com ')!;
    const url = new URL(link.href);
    expect(url.hostname).toBe(host);
    expect(url.searchParams.get('to')).toBe('maya+film%20@example.com');
    expect(url.searchParams.get(subjectKey)).toBe('Re: Your website inquiry');
    expect(url.searchParams.has('body')).toBe(false);
    expect(url.searchParams.has('bcc')).toBe(false);
    expect(link.external).toBe(true);
  });
  it('preserves the default mail app fallback', () => {
    expect(leadReplyLink('default', 'maya+film@example.com')).toEqual({ href: 'mailto:maya%2Bfilm%40example.com?subject=Re%3A%20Your%20website%20inquiry', label: 'Reply by email', external: false });
  });
  it.each([undefined, null, 123, {}, '', 'broken', 'a@b.com?bcc=hidden@example.com', 'a@b.com\r\nBcc:hidden@example.com', 'a@b.com,other@b.com', 'a@b.com;other@b.com', 'a@b.com&bcc=other@b.com', 'a@@b.com', '<a@b.com>', `${'a'.repeat(250)}@b.com`])('does not render a draft link for unsafe recipient %j', recipient => {
    for (const platform of leadReplyPlatforms) expect(leadReplyLink(platform, recipient)).toBeNull();
  });
  it('uses the saved platform on the detail page and keeps the inbox context', () => {
    const html = renderToStaticMarkup(<LeadDetailView detail={detail} replyPlatform="gmail" Link={Link} backHref="/dashboard/leads?view=unread" updateForm={<p>Update</p>} noteForm={<p>Notes</p>} />);
    expect(html).toContain('Connect Gmail to reply');
    expect(html).not.toContain('mail.google.com');
    expect(html).toContain('/dashboard/leads?view=unread');
    expect(html).toContain('Update');
    expect(html).toContain('Notes');
  });
  it('omits reply actions when the contact address is invalid', () => {
    const html = renderToStaticMarkup(<LeadDetailView detail={{ ...detail, lead: { ...detail.lead, contact: { email: 'broken' } } }} replyPlatform="gmail" Link={Link} backHref="/dashboard/leads" updateForm={null} noteForm={null} />);
    expect(html).not.toContain('mail.google.com');
    expect(html).not.toContain('mailto:');
  });
  it('shows the saved platform in the accessible settings control', () => {
    const html = renderToStaticMarkup(<LeadReplyPreferencesForm platform="gmail" action={saveLeadReplyPreference} />);
    expect(html).toContain('value="gmail" selected=""');
    expect(html).toContain('Save reply preference');
    expect(html).toContain('aria-describedby="lead-reply-help"');
    expect(html).toContain('Default email app');
    expect(html).toContain('Outlook.com');
  });
});
