# vigilstudios.co redesign — brief for Astra (Codex)

**Owner:** Vigil Studios. **Written:** 15 Sep 2026.
**Process:** design in Figma first → owner approves each page → implement in
`app/(site)` → owner reviews on a Vercel preview → merge to `main`.
**Product truth:** `../../../vigil-leadgen/VIGIL_STUDIOS_MASTER_ARCHITECTURE.md`
(read it first; §1, §3, §4, §10, §11 are the story). Nothing in this brief
overrides it.

---

## 1. Why now

Phase 1 of the product is live: the Vigil Express catalogue sells through a
real Stripe checkout, a paid customer is provisioned automatically, Virtue
walks them through onboarding, and the client dashboard and admin console
run on the live Supabase project. The marketing site still describes the
company Vigil used to be — a generic web-dev agency — and none of its
sections tell the story the product now tells. The site must be rebuilt
around what customers actually buy, in the voice the product already uses.

## 2. What the current site gets wrong (delete, don't polish)

- Hero: "New York-Based Web Development Agency", "Websites that turn clicks
  into customers." Generic; positions Vigil as one more agency.
- Services grid: custom sites, landing pages, SEO, e-commerce, maintenance,
  performance. This is a freelancer menu, not the product.
- **Projects / portfolio section: remove entirely.** Its projects are
  fictional placeholders.
- Testimonials: fictional people. Remove; no invented social proof anywhere.
- Process section: a four-step agency process. The real process is
  *choose → pay → Virtue onboarding → we build → you review → live*.
- Pricing: shows "Growth $2,499+" and a three-tier build ladder that no
  longer exists. The real model is two-part (§3 below) and prices are rows in
  the database.
- FAQ, CTA band, contact form: fine as patterns, but the copy is boilerplate.
- Overall tone: exclamation-mark marketing. The product speaks calmly, in
  first person when Virtue talks, never in jargon. The site must match.

## 3. The story to tell

**One line:** *You run the business. Vigil runs the digital side of it.*

**The three things** (master doc §3): **Websites** are how a customer
starts (Vigil Express $599, Professional $1,499, Custom quoted). **Vigil** is
the platform every hosted website runs on — hosting, domain, security,
updates, requests, status, billing — on a monthly, annual or three-year
plan. **Virtue** is the AI employee inside Vigil, included with Growth and
Priority, who already greets every customer during onboarding.

**Audience:** owners of small local businesses (restaurants and cafés,
boutiques, salons and spas, auto shops; soon home services and medical/dental)
who value time and outcomes over learning site builders. They are not
technical and do not want to be. Speak to the owner, not to a marketing
department.

**Positioning against builders** (§10): Wix sells tools; Vigil delivers and
operates the system. Never claim competitors lack AI or automation; claim
responsibility and execution. The exit story is a feature: customers own
their site code and their domain and can leave with them.

**Pricing story** (§11): two parts, said plainly — one payment for the
build, then a Vigil plan that keeps it running. Approved numbers (rows in
`plan_prices`, never hard-code):

| Plan | Monthly | Annual | 3 years |
|---|---:|---:|---:|
| Basic — keep me online | $29 | $290 | $779 |
| Care — take care of my website | $99 | $990 | $2,670 |
| Growth — help me grow my business (Virtue) | $199 | $1,990 | $5,370 |
| Priority — operate and grow at a higher level (Virtue) | $399 | $3,990 | $10,770 |

Builds: Vigil Express $599, Professional $1,499, Custom quoted. Sales tax is
added at checkout. Read prices at render time from the same source the
checkout uses (`lib/vigil/queries/checkout.ts` → `getCheckoutCatalog`, or
`plan_prices` + `build_prices` directly) so the site can never disagree with
the checkout.

## 4. Information architecture

Primary navigation (master doc §11): **Products · Solutions · Pricing ·
About · Sign in · Get started**. "Work" waits until there are real customer
sites to show. Keep the existing theme toggle and the *Sign in* → `/login`
link; *Get started* → `/express`.

| Route | Page | Status |
|---|---|---|
| `/` | Home | rebuild |
| `/express` | Vigil Express catalogue | **keep exactly as it is** — the owner approved it. Do not redesign, restyle or move `components/express/*` or `app/(site)/express`; only the shared nav/footer around it changes |
| `/products/websites` | Websites: Express / Professional / Custom | new |
| `/products/vigil` | The Vigil platform | new |
| `/products/virtue` | Virtue — what it does at launch and what is coming | new |
| `/solutions` | Outcome-led: get online quickly, keep the website managed, capture and convert leads, recover missed opportunities, automate follow-up, build reviews | new (one page with anchored sections is fine for V1) |
| `/pricing` | Two-part pricing with live numbers, period toggle, plan comparison, build options, FAQ | new (replaces the home-page pricing block) |
| `/about` | Who Vigil Studios is, why it exists, the ownership/exit promise | new |
| `/contact` or `#contact` | Contact form + Calendly | keep pattern, rewrite copy |
| `/process` | Fold into Home / Products; redirect | retire |

Do not touch `app/(vigil)` (login, dashboard, admin, checkout, onboarding),
`lib/vigil`, `supabase/`, `proxy.ts` or `components/vigil` except to *read*
or reuse components.

## 5. Page-by-page

### Home
1. **Hero** — the one line, one sentence of support, primary CTA *Choose a
   template* (→ `/express`), secondary *See how it works*. Show the product,
   not a stock photo: a real dashboard frame (`components/vigil/SiteFrame`
   pattern) or a composed screenshot of the Overview, and the Virtue orb
   (`components/vigil/VirtueOrb`, size `lg`/`xl`, state `idle`) — she is the
   face of the brand.
2. **What you get** — three columns: Website / Vigil / Virtue, each with two
   sentences and a link to its product page.
3. **How it works** — the real path in five beats: choose a template and
   pay → Virtue asks about your business (10 minutes) → we build → you
   review → live on your domain, then Vigil runs it. Use the real onboarding
   screens as illustration.
4. **Industries** — the catalogue's six industries as cards (four available,
   two "coming"); links into `/express` with the industry preselected.
5. **Why Vigil, not a builder** — the §10 table as a calm two-column
   comparison; the ownership/exit paragraph.
6. **Pricing teaser** — the two-part model in one sentence, plan names and
   monthly prices from the database, link to `/pricing`.
7. **FAQ** — rewritten around real questions (Do I own the site? What if I
   cancel? Do I need to touch DNS? How fast? What does Virtue do today?).
8. **Contact / Get started** band, footer.

### Products → Websites
Express (template, $599, one to two business days, what is and is not
included), Professional (multi-page, custom design, $1,499), Custom (quoted;
what qualifies). Every website needs a Vigil plan — say it here too.

### Products → Vigil
Outcome language only (§7): Website Live · Domain Connected · Subscription
Active · SSL and Security · Website Updates · Requests · Leads · Insights ·
Virtue. Show the real dashboard (Overview, Website, Domain pages). Explain
the guided domain connection (Virtue walks you through your registrar) and
the "we register it for you" option. The four plans as *how much we take off
your plate*.

### Products → Virtue (not finished — say so honestly)
- **Today:** Virtue greets every customer, sets up their sign-in, and runs
  the onboarding — collects the business, offering, story, brand, photos and
  domain. Included for everyone.
- **At launch (Growth / Priority), coming:** lead follow-up and recovery,
  missed-call text-back, review and reputation workflows, customer
  reactivation, Lead Hub, Insights. Present as a roadmap with clear
  "coming" labels; no dates unless the owner gives them; no capability
  claims beyond master doc §4.
- The orb, large, with her spoken-line pattern (`VirtueSpeech`) is welcome
  here as long as it stays performant (one WebGL canvas per view).

### Pricing
Live numbers; Monthly / Annual / 3 years toggle with the savings badge
(mirror `app/(vigil)/checkout/CheckoutForm.tsx`, or import
`lib/vigil/billing-periods.ts` for the maths); plan comparison by outcome;
build options; "sales tax added at checkout"; FAQ on cancellation, ownership
and export. CTA → `/express`.

### About
Founder-led and short: why Vigil exists, who it is for, the promise (owner
runs the business; Vigil runs the digital side), ownership and exit, where we
are (NYC). No stock team photos, no invented history.

## 6. Design direction

- **Continuity with the product.** The dashboard and onboarding are the
  brand now: tokens in `app/globals.css` (`--bg-*`, `--text-*`, `--accent`
  green, `--border`), both themes, 13–14px UI scale, calm spacing. The
  marketing site should feel like the front door to that same building, not
  a different company.
- **Virtue is green, everywhere, always the shader orb.** Reuse
  `components/vigil/VirtueOrb` (`components/ui/orb.tsx` underneath). Never a
  static icon or a different colour.
- **Real screens over illustrations.** Capture the actual Overview,
  onboarding rail, domain guide and checkout at 1200px and 390px; frame them
  with `SiteFrame` or a simple browser chrome. Blur or fake nothing.
- **Typography and motion:** keep the existing type stack; motion is quiet
  (framer-motion is available), never bouncing.
- **Copy voice:** plain, warm, no exclamation marks, no "unlock", "elevate",
  "seamless", "cutting-edge", "AI-powered". Short sentences. Where Virtue
  speaks, first person ("I'll…"). Read `lib/vigil/onboarding/virtue-copy.ts`
  for the register.
- **Mobile-first.** Design 375px first, then desktop; the home page must
  read completely on a phone.
- **Accessibility:** status is icon + label + colour; contrast ≥ 4.5:1 for
  text in both themes; reduced-motion respected (the orb already does).

## 7. Sources of truth to use, not re-describe

| Thing | Where |
|---|---|
| Product story, tiers, positioning | `vigil-leadgen/VIGIL_STUDIOS_MASTER_ARCHITECTURE.md` |
| Plan prices, build prices | `plan_prices`, `build_prices` (live project); `getCheckoutCatalog()` |
| Templates, order, availability | `lib/constants.ts` `EXPRESS_TEMPLATES` (`status: "available" | "coming"`) |
| Virtue visual and voice | `components/vigil/VirtueOrb.tsx`, `VirtueSpeech.tsx`, `lib/vigil/onboarding/virtue-copy.ts` |
| Dashboard screens for screenshots | run locally, sign in, Marlow & Fen demo tenant |
| Tokens and theme | `app/globals.css`, `components/ui/ThemeToggle.tsx` |
| What the product actually does | `docs/dashboard-v1/IMPLEMENTATION_LOG.md` (latest entries) |

## 8. Process and deliverables

1. **Figma first.** One Figma file, a page per route, desktop and 375px
   frames for each, light and dark for Home and Pricing at minimum. Real
   copy in the frames (no lorem ipsum); real prices. Share the link in the
   handoff thread with a short note per page on what changed and why.
2. **Owner approval per page** before any code. Iterate in Figma, not in
   code.
3. **Implement** in `app/(site)` and `sections/` (replace, don't append):
   new sections may live under `sections/` or `components/site/`; delete the
   retired ones (`PortfolioSection`, `TestimonialsSection`, the agency
   `ServicesSection`/`ProcessSection`, old `PRICING_TIERS`/`PROJECTS`/
   `TESTIMONIALS` constants). Keep `app/(vigil)` untouched. Keep
   `EXPRESS_PRICE` only if the catalogue still needs it.
4. **Verify** in a real browser at 375px and desktop, both themes; Lighthouse
   accessibility ≥ 95 on Home and Pricing; `npm run typecheck`, `npm run
   lint`, `npm run build` clean.
5. **Ship** on a branch, PR to `main` (main deploys vigilstudios.co) after
   the owner's preview review. Log the work in `docs/site-redesign/LOG.md`.

## 9. Out of scope

**The Vigil Express catalogue** (`/express`, `components/express/*`,
`lib/constants.ts` → `EXPRESS_TEMPLATES`) — approved and finished; it stays
as it is. Checkout, dashboard, onboarding, admin, emails, the Express
templates themselves, the leadgen pipeline. New product claims. Fake
customers, logos, testimonials or metrics.

Scope is: the home page and its sections, the new pages (Products ×3,
Solutions, Pricing, About), the shared navigation and footer, and the
marketing constants those pages use.
