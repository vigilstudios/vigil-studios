/**
 * The contact address, rendered so Cloudflare leaves it alone.
 *
 * The domain is proxied by Cloudflare with Email Address Obfuscation on,
 * which rewrites every address it finds in the served HTML (text and
 * mailto: hrefs alike) into a decoder link. The DOM React then hydrates no
 * longer matches what it rendered, and every page falls back to a client
 * render (React error #418). Cloudflare skips anything between
 * <!--email_off--> and <!--/email_off-->, and React never diffs the inside
 * of dangerouslySetInnerHTML, so every address on the marketing pages goes
 * through here. Keep the vigil app's own pages out of this: they have
 * their own conventions.
 */
export const CONTACT_EMAIL = "hello@vigilstudios.co";

const guard = (html: string) => `<!--email_off-->${html}<!--/email_off-->`;
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** lucide's `mail` icon, as markup, so it can live inside the guarded anchor. */
const mailIcon = (className: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail ${escapeHtml(className)}" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`;

/** The address as plain text, inline. */
export function EmailText({ className }: { className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: guard(CONTACT_EMAIL) }} />;
}

/**
 * A mailto link. `label` is the visible text (the address by default);
 * `icon` adds the mail icon before it with the given classes. The wrapper
 * takes no space of its own, so the anchor lays out exactly as it would
 * have as a direct child.
 */
export function EmailLink({ className, label = CONTACT_EMAIL, icon }: { className?: string; label?: string; icon?: string }) {
  const html = `<a href="mailto:${CONTACT_EMAIL}"${className ? ` class="${escapeHtml(className)}"` : ""}>${icon ? mailIcon(icon) + " " : ""}${escapeHtml(label)}</a>`;
  return <span className="contents" dangerouslySetInnerHTML={{ __html: guard(html) }} />;
}
