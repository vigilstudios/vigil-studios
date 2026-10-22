import { leadStatuses } from '../contact/contract';

export type LeadFilters = { q: string; status: string; source: string; page: number; view: 'inbox' | 'unread' | 'settings' };
export function readLeadFilters(input: Record<string, unknown>): LeadFilters {
  const text = (key: string) => typeof input[key] === 'string' ? input[key] as string : '';
  const status = text('status'), source = text('source');
  return {
    q: text('q').trim().slice(0, 200),
    status: leadStatuses.includes(status as typeof leadStatuses[number]) ? status : '',
    source: /^[a-z][a-z0-9-]{0,79}$/.test(source) ? source : '',
    page: Math.min(10_000, Math.max(1, Number.parseInt(text('page'), 10) || 1)),
    view: text('view') === 'unread' ? 'unread' : text('view') === 'settings' ? 'settings' : 'inbox',
  };
}
export function leadHubHref(filters: Partial<LeadFilters> = {}) {
  const params = new URLSearchParams();
  for (const key of ['q', 'status', 'source'] as const) if (filters[key]) params.set(key, filters[key]!);
  if (filters.view && filters.view !== 'inbox') params.set('view', filters.view);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  return `/dashboard/leads${params.size ? `?${params}` : ''}`;
}
export function leadBackHref(value: unknown) {
  if (typeof value !== 'string') return leadHubHref();
  try {
    const url = new URL(value, 'https://internal.invalid');
    if (url.origin !== 'https://internal.invalid' || url.pathname !== '/dashboard/leads') return leadHubHref();
    return leadHubHref(readLeadFilters(Object.fromEntries(url.searchParams)));
  } catch { return leadHubHref(); }
}
export const hasLeadFilters = (filters: LeadFilters) => Boolean(filters.q || filters.status || filters.source);
export const contactInitials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0] || '').join('').toUpperCase() || 'WV';
export const sourceLabel = (source: string | null | undefined) => (source || 'website inquiry').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
