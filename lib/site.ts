/**
 * Single source of truth for the canonical origin.
 *
 * Production 308-redirects the apex to www, so www is the indexed host. Every
 * absolute URL we hand a crawler — canonical, Open Graph, JSON-LD, sitemap,
 * robots — must agree with it, or Google splits signals across two hosts.
 */
export const SITE_URL = "https://www.vigilstudios.co";

export const SITE_NAME = "Vigil Studios";

export const SITE_TITLE = "Vigil Studios | Keeping watch over your business online.";

export const SITE_DESCRIPTION =
  "Polished Express websites, tailored multi-page Professional experiences and bespoke Custom builds. Built for your business, with separate Vigil plans for hosting and care.";

/** Absolute URL for `path`, e.g. url("/process"). */
export function url(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
