import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : null;
  } catch {
    return null;
  }
})();

/**
 * The content policy the site actually needs, from an inventory of what it
 * loads: Next's own inline hydration scripts and the theme bootstrap (no
 * nonce is possible on statically rendered pages, hence 'unsafe-inline' for
 * scripts and styles), Vercel Analytics and Speed Insights, Calendly's
 * widget and booking frame, Google Fonts (self-hosted by next/font, so no
 * external origin), Unsplash images, Supabase REST/Storage/Realtime, and
 * customer previews framed from any https origin. Stripe is a redirect,
 * which form-action must allow.
 *
 * It ships report-only: violations show in the browser console and reach
 * /api/csp-report without breaking a page. Move it to Content-Security-Policy
 * once a week of reports is clean; the enforced policy below already covers
 * framing.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // next dev evaluates modules with eval for Fast Refresh; a production build does not.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://va.vercel-scripts.com https://vercel.live https://assets.calendly.com`,
  "style-src 'self' 'unsafe-inline' https://assets.calendly.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://calendly.com https://api.calendly.com${supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : ""}`,
  "frame-src https:",
  "frame-ancestors 'self'",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  "report-uri /api/csp-report",
].join("; ");

/**
 * Baseline response headers. The Express catalogue frames its own template
 * pages, so framing stays allowed for this origin only; nothing else may
 * embed the dashboard or admin.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  compress: true,
  async redirects() {
    // Virtue moved under Products when the products menu arrived.
    return [{ source: "/virtue", destination: "/products/virtue", permanent: true }];
  },
  poweredByHeader: false,
  // Dev only: the dev server blocks cross-origin dev resources, and
  // 127.0.0.1 counts as a different origin from localhost. Without this,
  // pages opened at http://127.0.0.1:3000 render but never hydrate.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
