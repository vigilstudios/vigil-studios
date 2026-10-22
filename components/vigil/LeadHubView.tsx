import type { ComponentType, ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, CheckCheck, CircleCheck, Clock3, Inbox, Mail, Search, Settings2, SlidersHorizontal } from 'lucide-react';
import type { getLeadHub } from '@/lib/vigil/queries/leads';
import { leadStatuses } from '@/lib/vigil/contact/contract';
import { formatDateTime, titleCase } from '@/lib/vigil/format';
import { contactInitials, hasLeadFilters, leadHubHref, sourceLabel, type LeadFilters } from '@/lib/vigil/leads/presentation';
import './lead-hub.css';

export type LeadHubData = Omit<Awaited<ReturnType<typeof getLeadHub>>, 'ctx'>;
export type HubLink = ComponentType<{ href: string; children: ReactNode; className?: string; 'aria-current'?: 'page'; 'aria-label'?: string }>;
export function LeadStatus({ status }: { status: string }) {
  const tone = ['booked', 'won'].includes(status) ? 'good' : status === 'new' ? 'accent' : ['qualified', 'contacted'].includes(status) ? 'info' : 'neutral';
  return <span className="lead-status" data-tone={tone}><span aria-hidden="true" />{titleCase(status)}</span>;
}
export function LeadHubView({ data, filters, Link, preferenceForms }: { data: LeadHubData; filters: LeadFilters; Link: HubLink; preferenceForms: Record<string, ReactNode> }) {
  const filtered = hasLeadFilters(filters), settingsView = filters.view === 'settings';
  const connected = data.settings.filter(setting => setting.enabled && data.sites.find(site => site.id === setting.website_id)?.status === 'live');
  const waitingLaunch = data.sites.some(site => ['building', 'provisioning'].includes(site.status));
  const connectionTitle = connected.length ? 'Website inquiries connected' : waitingLaunch ? 'Website capture is waiting for launch' : 'Website capture is not active';
  const pageEmpty = !data.leads.length && data.count > 0 && data.page > 1;
  const clearHref = leadHubHref({ view: filters.view === 'unread' ? 'unread' : 'inbox' });
  return <div className="lead-hub">
    <header className="lead-page-heading"><div><h1>Lead Hub</h1><p>Every website inquiry. One place to follow through.</p></div>
      <Link className="lead-button" href={leadHubHref({ ...filters, view: settingsView ? 'inbox' : 'settings', page: 1 })}>{settingsView ? <Inbox size={15} aria-hidden="true" /> : <Settings2 size={15} aria-hidden="true" />}{settingsView ? 'Back to inbox' : 'Contact settings'}</Link>
    </header>
    <nav className="lead-tabs" aria-label="Lead Hub views">
      <Link href={leadHubHref({ ...filters, view: 'inbox', page: 1 })} aria-current={filters.view === 'inbox' ? 'page' : undefined}><Inbox size={15} aria-hidden="true" />Inbox</Link>
      <Link href={leadHubHref({ ...filters, view: 'unread', page: 1 })} aria-current={filters.view === 'unread' ? 'page' : undefined}><Mail size={15} aria-hidden="true" />Unread<span className="lead-count">{data.unread}</span></Link>
      <Link href={leadHubHref({ ...filters, view: 'settings', page: 1 })} aria-current={settingsView ? 'page' : undefined}><SlidersHorizontal size={15} aria-hidden="true" />Settings</Link>
    </nav>
    <div className="lead-connection" data-connected={connected.length > 0}>
      {connected.length ? <CircleCheck size={16} aria-hidden="true" /> : <Clock3 size={16} aria-hidden="true" />}
      <div><strong>{connectionTitle}</strong><span>{connected.length ? `${connected.length} ${connected.length === 1 ? 'website is' : 'websites are'} ready to receive inquiries.` : waitingLaunch ? 'Your inbox is here. Inquiries begin after your website is launched and connected.' : 'Your saved inquiries are available. Contact capture needs an active website connection.'}</span></div>
      {!connected.length && <Link href={waitingLaunch ? '/dashboard/domain' : '/dashboard/website'}>{waitingLaunch ? 'View launch progress' : 'View website'}<ArrowUpRight size={13} aria-hidden="true" /></Link>}
    </div>
    {settingsView ? <section className="lead-settings" aria-labelledby="lead-settings-title">
      <div className="lead-section-heading"><div><h2 id="lead-settings-title">Contact settings</h2><p>Choose where inquiry notifications go, and add a booking link if you use one.</p></div></div>
      {data.settings.length ? data.settings.map(setting => {
        const site = data.sites.find(site => site.id === setting.website_id);
        const active = connected.some(row => row.website_id === setting.website_id);
        return <section className="lead-settings-panel" key={setting.website_id} aria-labelledby={`settings-${setting.website_id}`}>
          <div className="lead-settings-summary"><span className="lead-setting-icon"><Mail size={19} aria-hidden="true" /></span><div><h3 id={`settings-${setting.website_id}`}>{site?.name || 'Website'}</h3><p>{active ? 'New inquiries are saved in your inbox and queued for email notification.' : 'Preferences are saved. Contact capture activates with your website connection.'}</p></div><span className="lead-status" data-tone={active ? 'good' : 'neutral'}><span aria-hidden="true" />{active ? 'Connected' : 'Awaiting activation'}</span></div>
          {preferenceForms[setting.website_id]}
          <p className="lead-settings-note">A booking link opens your scheduler. Appointments are not synchronized with Lead Hub.</p>
        </section>;
      }) : <div className="lead-empty"><Settings2 size={25} aria-hidden="true" /><h3>Contact setup is on its way</h3><p>Vigil will connect your website’s inquiry form. Its notification preferences will appear here.</p><Link className="lead-button" href="/dashboard/website">View your website<ArrowRight size={14} aria-hidden="true" /></Link></div>}
      <p className="lead-footnote">These settings control website inquiry notifications. No automatic replies are sent to visitors.</p>
    </section> : <>
      <form className="lead-toolbar" action="/dashboard/leads" role="search" aria-label="Search website inquiries">
        {filters.view === 'unread' && <input type="hidden" name="view" value="unread" />}
        <label className="lead-search"><span className="lead-sr-only">Search inquiries</span><Search size={17} aria-hidden="true" /><input type="search" name="q" defaultValue={filters.q} maxLength={200} placeholder="Search name, email or message…" /></label>
        <div className="lead-filters"><label><span className="lead-sr-only">Status</span><select name="status" defaultValue={filters.status}><option value="">All statuses</option>{leadStatuses.map(status => <option value={status} key={status}>{titleCase(status)}</option>)}</select></label>
          <label className="lead-source-filter"><span className="lead-sr-only">Source form</span><input name="source" defaultValue={filters.source} maxLength={80} placeholder="Source form" /></label>
          <button className="lead-button" type="submit"><SlidersHorizontal size={14} aria-hidden="true" />Apply</button>{filtered && <Link href={clearHref} className="lead-clear">Clear</Link>}
        </div>
      </form>
      <section aria-labelledby="lead-inquiries-title"><div className="lead-section-heading"><div><h2 id="lead-inquiries-title">{filters.view === 'unread' ? 'Unread inquiries' : 'Inquiries'}<span className="lead-heading-count">{data.count}</span></h2><p>{filtered ? 'Results for your selected filters.' : 'Keep the details close and the next step clear.'}</p></div><span className="lead-sort"><ArrowDown size={13} aria-hidden="true" />Most recent first</span></div>
        {data.leads.length ? <div className="lead-table-wrap"><table className="lead-table"><caption className="lead-sr-only">Website inquiries</caption><thead><tr><th scope="col">Contact</th><th scope="col">Website / source</th><th scope="col">Status</th><th scope="col">Received</th><th scope="col"><span className="lead-sr-only">Open inquiry</span></th></tr></thead><tbody>{data.leads.map(lead => {
          const contact = lead.contact as { name?: string; email?: string };
          const name = contact.name || 'Website visitor';
          const back = new URLSearchParams({ back: leadHubHref(filters) });
          return <tr className="lead-row" key={lead.id} data-unread={!lead.read_at}><td className="lead-person"><div className="lead-record"><span className="lead-avatar" aria-hidden="true">{contactInitials(name)}</span><div><Link className="lead-name" href={`/dashboard/leads/${lead.id}?${back}`}>{!lead.read_at && <span className="lead-unread-dot" aria-label="Unread" />}{name}</Link><p className="lead-email">{contact.email}</p><p className="lead-excerpt">{lead.message}</p></div></div></td>
            <td className="lead-origin"><span>{data.sites.find(site => site.id === lead.website_id)?.name || 'Website'}</span><small>{sourceLabel(lead.source)}</small></td>
            <td className="lead-status-cell"><LeadStatus status={lead.status} /></td><td className="lead-date"><time dateTime={lead.received_at}>{formatDateTime(lead.received_at)}</time></td><td className="lead-open"><ArrowUpRight size={16} aria-hidden="true" /></td></tr>;
        })}</tbody></table></div> : <div className="lead-empty">
          <span className="lead-empty-icon">{filters.view === 'unread' ? <CheckCheck size={26} aria-hidden="true" /> : filtered ? <Search size={26} aria-hidden="true" /> : <Inbox size={26} aria-hidden="true" />}</span>
          <h3>{pageEmpty ? 'This page has no inquiries' : filtered ? 'No inquiries match your search' : filters.view === 'unread' ? 'You’re all caught up' : 'Your next conversation starts here'}</h3>
          <p>{pageEmpty ? 'Return to the first page to see your current results.' : filtered ? 'Try a different name, status or source form, or clear your filters.' : filters.view === 'unread' ? 'There are no unread inquiries. You can find your saved inquiries in the inbox.' : 'New website inquiries will appear here with contact details, a status and space for your follow-up notes.'}</p>
          <Link className="lead-button" href={pageEmpty ? leadHubHref({ ...filters, page: 1 }) : filtered ? clearHref : filters.view === 'unread' ? leadHubHref() : leadHubHref({ view: 'settings' })}>{pageEmpty ? 'Back to first page' : filtered ? 'Clear filters' : filters.view === 'unread' ? 'View inbox' : 'Review contact settings'}<ArrowRight size={14} aria-hidden="true" /></Link>
        </div>}
        <footer className="lead-pagination"><span>{pageEmpty ? `${data.count} inquiries · no results on this page` : data.count ? `${(data.page - 1) * 25 + 1}–${Math.min(data.page * 25, data.count)} of ${data.count}` : '0 inquiries'}</span><nav aria-label="Inquiry pagination">{data.page > 1 && <Link href={leadHubHref({ ...filters, page: data.page - 1 })}><ArrowLeft size={14} aria-hidden="true" />Previous</Link>}{data.page * 25 < data.count && <Link href={leadHubHref({ ...filters, page: data.page + 1 })}>Next<ArrowRight size={14} aria-hidden="true" /></Link>}</nav></footer>
      </section>
    </>}
  </div>;
}
