/** Personal presentation preference only; never used for authorization. */
export const leadReplyPlatforms = ['default', 'gmail', 'outlook', 'microsoft365'] as const;
export type LeadReplyPlatform = typeof leadReplyPlatforms[number];
export const leadReplyPlatformLabels: Record<LeadReplyPlatform, string> = {
  default: 'Default email app',
  gmail: 'Gmail',
  outlook: 'Outlook.com',
  microsoft365: 'Microsoft 365 Outlook',
};

export function isLeadReplyPlatform(value: unknown): value is LeadReplyPlatform {
  return typeof value === 'string' && leadReplyPlatforms.some(platform => platform === value);
}

export function readLeadReplyPlatform(metadata: unknown): LeadReplyPlatform {
  const value = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>).lead_reply_platform : undefined;
  return isLeadReplyPlatform(value) ? value : 'default';
}

/** Fixed draft links for mail apps; Gmail uses the authenticated server handoff. */
export function leadReplyLink(platform: LeadReplyPlatform, recipient: unknown) {
  if (typeof recipient !== 'string') return null;
  const email = recipient.trim();
  // One mailbox only: reject header injection, recipient lists and URL delimiters.
  if (email.length > 254 || !/^[^\s<>?&#,;:"\\@]+@[^\s<>?&#,;:"\\@]+\.[^\s<>?&#,;:"\\@]+$/.test(email)) return null;
  const to = encodeURIComponent(email);
  const subject = encodeURIComponent('Re: Your website inquiry');
  switch (platform) {
    // Gmail needs the authenticated draft handoff; compose URLs lose the inbox.
    case 'gmail': return null;
    case 'outlook': return { href: `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${subject}`, label: 'Reply in Outlook.com', external: true };
    case 'microsoft365': return { href: `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subject}`, label: 'Reply in Outlook', external: true };
    default: return { href: `mailto:${to}?subject=${subject}`, label: 'Reply by email', external: false };
  }
}
