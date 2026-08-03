/**
 * Single source of truth for the canonical origin.
 *
 * Production 308-redirects the apex to www, so www is the indexed host. Every
 * absolute URL we hand a crawler — canonical, Open Graph, JSON-LD, sitemap,
 * robots — must agree with it, or Google splits signals across two hosts.
 */
export const SITE_URL = "https://www.vigilstudios.co";

export const SITE_NAME = "Vigil Studios";

export const SITE_TITLE = "Vigil Studios | Web Development Agency";

export const SITE_DESCRIPTION =
  "Custom-coded websites built for speed, search visibility, and measurable growth. No templates. No compromises.";

/** Absolute URL for `path`, e.g. url("/process"). */
export function url(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
