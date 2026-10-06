# Creator campaign — `/creators`

Production source lives in `vigil-studios`, not the sibling `vigil-leadgen` checkout. The campaign reuses public routing, site primitives, buttons, canonical website tiers, database pricing, existing checkout/onboarding and Vercel Analytics. No new dependency or database migration.

## Current page

1. Full-viewport white hero: centered “Your brand. Beyond the bio.” copy in the existing Bodoni Moda font, the shared primary button and a seven-photo floating collage adapted from the supplied React component. Generated candid digital-camera photos cover creator life, cars, beauty, fitness, food, fashion and music, with no visible faces. Random hearts, likes, comments, views and emoji surround the photos. A visible scroll cue leads to the offers.
2. Compact Express / Professional comparison: canonical features, current discounted build prices, ongoing-plan note, collapsed offer conditions and a single process line.
3. Full-viewport Scarlen López spotlight: one sentence, a minimal browser frame showing the real website startup animation on entry, and both final package CTAs. Existing footer follows.

Separate promotion, benefits, verbose process and repeated final CTA sections were removed. Soft pink accents, flat surfaces and route-only Bodoni Moda typography pair with existing Inter. Prices use Vigil’s Space Grotesk and the campaign accent. All purchase CTAs retain the shared `.btn-primary`/`.btn-secondary` styles, including their shape, hover and focus behavior; only campaign color tokens change. There are no campaign gradient backgrounds. Public navigation/footer colors are scoped to `/creators`; other marketing pages retain their existing palette. Copy and links are real markup and remain accessible without JavaScript. No animation dependency or external project embed is loaded.

The supplied `HeroCollage` is integrated under `components/ui/modern-hero-section.tsx` with CSS Modules, the existing `clsx` dependency and separate wrappers for positioning, floating and entrance motion. Existing TypeScript/Tailwind support is reused; no shadcn scaffolding or dependency changes were needed. Demonstration statistics were omitted. The 21 optimized local WebPs provide 300/450/600px responsive sources with intrinsic 3:4 dimensions; only the selected sizes are loaded. All assets, exact built-in imagegen prompts and original paths are recorded in [GENERATED-CREATOR-PHOTOS.md](./GENERATED-CREATOR-PHOTOS.md).

Reactions use bounded, short-lived elements with random types, positions and timing. They carry no invented engagement counts. Timers stop offscreen, when the tab is hidden and for reduced motion. The visible hero pause/resume control has been removed at the user’s request. Reduced motion uses static decorative reactions. All hero copy/links render on the server, with stable initial client state.

Hero copy now enters over 1.6 seconds with a 30px rise; photos enter over 1.8 seconds with a 40px rise and up to 450ms stagger. Cards, section headings, the project preview and footer enter over 1.5 seconds with a 36px rise and a more visible fade. Reactions use a slower 4.4-second lifecycle. Cards retain their responsive hover lift. Collage floats pause offscreen automatically. Reduced motion removes entrance/float/hover transforms and video playback. Animation never gates links or content visibility.

## Promotion and fulfillment

The requested recommendation is implemented as **15% off new self-service Express and Professional one-time build fees**. The creator page displays discounted offer prices and the owner-selected code **INFLUENCE**. Promotion purchase links carry `promo=INFLUENCE` through Express template selection and the Professional fit guide. Checkout prefills and applies the valid code immediately. Ordinary visits and analytics attribution do not grant the discount; visitors can still enter and apply the code manually. Ongoing Vigil plans, custom/staff quotes and existing orders are excluded. Promotion codes cannot stack with an order carrying this offer.

The one source is `lib/creator-campaign.ts`: `promotion.enabled`, `promotion.percentOff` (validated integer, 1–50), `promotion.code`, conditions and CTA labels/destinations/variants. Setting `enabled: false` and deploying hides the banner/offer terms, hides the published code and rejects new code redemptions. Existing orders retain their trusted quoted amount. No expiry or capacity limit has been invented. INFLUENCE is the owner-provided code. Legacy editorial fields remain available without adding another promotion section.

`getPublicPricing` returns regular database prices for the homepage, pricing/products pages and Express catalog; the Professional fit guide and ordinary initial checkout also show the regular amount. Its versioned cache retains five-minute revalidation and the existing `pricing` tag. Only `/creators` uses `creatorBuildOffer` to display conditional offer prices. `creatorCodeOffer` powers the checkout preview and server order pricing after valid code redemption (prefilled from promotion links or entered manually). The server validates the code, eligibility and current catalog amount independently of browser totals. Invalid/disabled codes and redemption on staff/existing orders are rejected before order creation. Base catalog rows and approved/synced-price guards are unchanged.

At the currently configured base prices:

| Build | Canonical amount | Offer amount |
| --- | ---: | ---: |
| Express | $599.00 | $509.15 |
| Professional | $1,499.00 | $1,274.15 |

The selected ongoing plan is charged at its canonical rate (currently Basic from $29/month). Prices above are examples of the current catalog, not duplicated constants in the UI. Public pages and order summaries disclose build-only eligibility.

After code redemption, the existing billing adapter sends the selected recurring plan price plus an ad-hoc one-time build line at the discounted amount. INFLUENCE is redeemed in Vigil’s checkout, not created as a Stripe-wide coupon; it cannot reduce the recurring plan or stack with hosted Stripe codes. Stripe subscription-mode Checkout bills the one-time line only on the initial invoice. Order metadata records `creator_promotion` with campaign, redeemed code, percentage, original build amount and discount amount, plus the checkout session. Existing metadata is preserved. Trusted token retries reuse the saved build amount and cannot apply the percentage twice. Existing custom/staff quotes are unaffected. Supporting primary docs: [Checkout session creation](https://docs.stripe.com/api/checkout/sessions/create), [mixed recurring and one-time prices](https://docs.stripe.com/payments/checkout/migrating-prices).

## Site-wide banner

A shared pink banner links to `/creators#creator-hero` across all public marketing pages, login and checkout/success routes. The hero anchor reserves the banner offset so the introductory line remains below the fixed navigation after a click. On marketing pages it is fixed above navigation, with explicit space reserved for both. Product checkout/login use a flow banner. Authenticated `/admin` and `/dashboard` workspaces retain their existing chrome.

The banner establishes campaign attribution only when clicked. Ordinary public visitors are not silently marked as creator traffic. The banner is driven by the same percentage/enable flag as server fulfillment.

Its continuous loop reads “For creators & influencers” alongside the actual offer, in Vigil’s Space Grotesk. Two matching groups create a seamless 70-second marquee; duplicated visual copy is hidden from assistive technology, which receives one complete link label. It keeps moving while hovered, focused and after its link is clicked. An explicit pause/resume control remains available. Reduced motion presents a static message.

## Every CTA

| Placement/action | Destination | Event |
| --- | --- | --- |
| Site-wide 15% banner | `/creators#creator-hero` | `creator_promotion_banner_click`, site_banner |
| Hero: Find your website | `/creators#choose-your-site` | `creator_campaign_cta_click`, hero |
| Scroll to find your fit | `/creators#choose-your-site` | `creator_campaign_cta_click`, scroll |
| Express package / final | `/express` | `creator_express_cta_click`, package / final |
| Professional package / final | `/professional` | `creator_professional_cta_click`, package / final |
| Configured live spotlight | Configured HTTPS project URL, new tab | `creator_showcase_click`, showcase |
| Express catalog Buy | `/checkout?template=<available slug>` | `creator_checkout_cta_click` |
| Professional fit check, included scope | `/checkout?build=professional` | `creator_checkout_cta_click` |
| Checkout form submission | Existing validated server action → Stripe | `creator_checkout_submitted` |
| Confirmed provisioned success | Existing dashboard/welcome-email onboarding | `creator_purchase_confirmed` |

Express suits a curated single-page start. Professional supports up to eight tailored primary pages composed from premium design systems. Bespoke components and original interactions belong to Custom (Growth-level scope), including Scar’s standalone project. See `../business/PACKAGES.md` for current language. The existing Professional qualifier routes larger scope to its Calendly consultation. No qualifier is bypassed. Express requires an available template: the dedicated `creator`/Muse template remains `coming`, explicitly disclosed on this page. Complete/publish it through the existing production engine before offering it for self-service purchase. Other available templates retain their existing checkout paths.

Online-unavailable states retain the existing Express assisted email and Professional real Calendly widget. No dead links, `#` placeholders or fabricated checkout destinations.

## Update the influencer spotlight

The current fallback is the real Scarlen López portfolio at `public/creators/scarlen-portfolio.webp` (1920×1196, WebP quality 90, approximately 195KB), plus `public/creators/scarlen-startup.mp4`. Both come from a fresh native-resolution capture of the existing local client site at port 5173. The silent 10.03-second H.264 recording includes the real collage, speech bubble, typewriter and hearts. Lossless PNG frames were captured at native 1920×1196 and approximately 58fps, then encoded once to 30fps, CRF 16, YUV420p with fast-start metadata. The final file is approximately 2.35MB and is not upscaled. This replaces the earlier 960px, twice-compressed preview. The client workspace was not modified. User authorization in this session explicitly requested Scar's portfolio.

The video source is assigned only when the preview enters view, then restarts on each new entry. It pauses offscreen or in a hidden tab. The player supports pause/resume/replay, with the real still image available if playback fails or reduced motion is enabled. The animation needs no live project URL. To replace imagery/copy or enable the live project link, edit `showcase` in `lib/creator-campaign.ts`:

```ts
showcase: {
  name: "Made for Scar.",
  description: "Approved client-facing project copy",
  image: "/creators/final-scar-portfolio.webp",
  imageAlt: "Describe the actual client screenshot",
  video: "/creators/final-scar-startup.mp4", // optional; null/omitted gives a still preview
  siteUrl: "https://the-final-client-domain.example", // null until live
}
```

Use a compressed image near the current 1445×900 aspect ratio. Fixed intrinsic dimensions and lazy loading reserve space. HTTPS image URLs are accepted. A null URL omits the external link while both final package CTAs remain. No internal client terms or unverified outcomes are exposed.

## Measurement and SEO

The existing Vercel Analytics integration records `/creators` views and the events in the CTA table. Placement distinguishes hero/scroll/package/final/banner. A bounded allowlist carries `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `ref` and campaign through links, the public/product root transition and a same-tab Stripe return using sessionStorage. Checkout submission adds package/plan/billing period. Confirmation fires once per order/session only after confirmed provisioning. External showcase links do not receive Vigil attribution. No personal customer data, arbitrary query fields or click IDs are saved.

Analytics/storage failures never block navigation. Browser tracking can undercount blocked analytics or different-tab returns; server payment/order/webhook records remain the payment source of truth. Analytics is mounted in CheckoutShell; no dashboard/admin analytics was added. Verify deployed custom-event ingestion in the project's existing Vercel Analytics account. Suggested influencer URL: `/creators?utm_source=<creator-handle>&utm_medium=social&utm_campaign=<campaign-name>`.

Creator title/description, canonical URL, Open Graph, Twitter metadata, native social PNG endpoints and sitemap entry are implemented. No new sharing-image stack.

## Validation and release

209 production-preview Chrome checks pass at 320×568, 375×812, 430×932, 768×1024, 1366×768 and 1440×900, plus a desktop Retina context at device-pixel ratio 2. Checks include full-viewport fit, no overflow, seven responsive generated photos, slower copy/photo entrances, removal of the hero pause control, six accessible campaign CTAs with shared styling, random reactions, collage floats, automatic offscreen suspension, reduced motion, deferred high-resolution Scar startup playback/poster, sufficient native pixels at Retina display size, project manual-pause persistence/replay, full-viewport spotlight, looping Vigil-font banners, cross-page and same-page banner links landing at the hero, uninterrupted motion while clicked/hovered/focused, colored offer prices, metadata/PNG sharing, touch/keyboard, no-JS offers, blocked storage, ordinary-visitor isolation and preserved downstream attribution. No hydration/runtime errors were reported. The actual in-app preview was refreshed and verified playing the new 1920×1196 video without a media error. Browser events are instrumented for emission, not live analytics ingestion. No payment or booking was submitted.

Current validation is recorded in `evidence/browser-results.json` and responsive screenshots beside it. Browser runner: `scripts/creators-browser.mjs`; override `PLAYWRIGHT_MODULE` and `CREATORS_TEST_URL` as needed. Local production preview uses `http://127.0.0.1:4318/creators`.

Full lint, standalone typecheck, production build and 70 test files / 1,252 tests passed. Added offer tests cover cents rounding, exclusions, disabling, configuration bounds, canonical-sync/currency guards, recurring-price preservation, staff quotes, token retry, non-stacking metadata and the actual Stripe request shape for mixed recurring/one-time lines. Initial campaign implementation also passed all existing migrations/RLS assertions on a temporary local PostgreSQL cluster. This revision has no schema changes. A concurrent build/test run hit the existing five-second timeout in two large Design Engine rendering tests; the unchanged full suite passed all 1,252 tests when rerun without simultaneous build load.

Development validation did not submit a live payment or booking. Production deploys from `main` through the repository’s existing Vercel Git integration. Unrelated dirty admin/Design Engine work is excluded from the campaign release.

Release preflight on October 6, 2026 exported the exact staged campaign tree into a clean temporary directory, without local provider environment files or uncommitted Design Engine work. That isolated release passed full lint, standalone typecheck, all 290 tests across 48 files and the optimized production build. The earlier 1,252-test result above includes local Design Engine work that is intentionally outside this release. The final banner-anchor offset also passed another isolated production build and 12 same-page/cross-page checks across six viewports, including a 1280×720 desktop: the root returns to scroll position zero, the introductory line stays below navigation and the banner continues moving.

The local `.env.production.local` profile supplies no Stripe secret, so its existing not-configured provider leaves online checkout unavailable; working assisted fallbacks were tested. This does not establish hosted Vercel configuration. Before influencer traffic goes live, verify hosted live Stripe credentials/webhook and synced approved catalog prices, test the payment-to-onboarding path, confirm custom-event ingestion and provide the final Scar URL/assets. The page and offer need no new environment variable. Choose a promotion end date only if wanted; otherwise disable it deliberately through the shared flag when the campaign ends.

## Changed campaign files

- `app/(site)/creators/{layout.tsx,page.tsx,creators.module.css,opengraph-image.tsx,twitter-image.tsx}`
- `app/(site)/layout.tsx`, `app/(site)/express/page.tsx`, `app/(site)/professional/{page.tsx,ProfessionalWalkthrough.tsx}`
- `app/(vigil)/layout.tsx`, `app/(vigil)/checkout/{page.tsx,CheckoutForm.tsx,CheckoutShell.tsx,success/SuccessPanel.tsx}`
- `app/globals.css`, `app/sitemap.ts`, `components/layout/Navigation.tsx`
- `components/creators/{CampaignLink.tsx,CampaignTracking.tsx,CreatorHeroScene.tsx,CreatorMotion.tsx,CreatorSpotlightPreview.tsx,PromoBanner.tsx}`
- `components/ui/{modern-hero-section.tsx,modern-hero-section.module.css}`
- `components/express/ExpressCatalogue.tsx`
- `lib/{creator-campaign.ts,creator-campaign.test.ts,campaign-attribution.ts}`
- `lib/vigil/{queries/public-pricing.ts,services/orders.ts,__tests__/orders.test.ts,__tests__/stripe.test.ts}`
- `public/creators/scarlen-portfolio.webp`, `public/creators/scarlen-startup.mp4`, `public/creators/collage/*.webp`
- `scripts/creators-browser.mjs`, `docs/campaigns/`, `docs/dashboard-v1/IMPLEMENTATION_LOG.md`
