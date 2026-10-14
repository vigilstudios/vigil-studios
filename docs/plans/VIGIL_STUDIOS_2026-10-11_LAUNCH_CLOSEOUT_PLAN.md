# Vigil Studios — Launch Closeout & Sunday Execution Plan

**Date:** Sunday, October 11, 2026 (America/New_York)  
**Document owner:** Vigil Studios founder  
**Suggested repository location:** `docs/plans/2026-10-11-launch-closeout.md`  
**Status:** Proposed execution plan — **not** a claim that the repository has been inspected or any work has been completed.  
**Scope:** Vigil Studios marketing site and dashboard; Express site variants; Professional production engine; Scar's creator project; shared integrations; company setup.

> **North star:** Make Vigil *safe to sell, reliable to deliver, and capable of producing customer value*. Do not confuse launching with completing every feature in the roadmap.
>
> **Reality check:** This represents multiple engineering workdays. October 11 is for closing the highest-risk items and starting independent stretch tasks in parallel. Do not declare an audit complete because an agent generated a checklist.

---

## 0. Operating rules for all agents

1. **Read before writing.** Inspect the actual repository, package manager, frameworks, schema/migrations, RLS policies, routes, env documentation, deployment workflow, billing, auth and test commands. Do not assume filenames or paths in this document exist. Create a short `AS_IS` inventory before proposing changes. Reuse working infrastructure.
2. **No unauthorized actions.** Do not deploy to production, purchase domains, submit LLC filings, charge customers, change DNS, send real bulk emails, rotate production secrets, delete databases, or enable autonomous AI sending without explicit founder approval.
3. **No credentials in code or logs.** Use server-only env vars, secret stores, least-privilege access and redact all customer information from tickets, screenshots and agent prompts.
4. **Work in bounded branches/PRs.** One owner for shared auth, database migrations, integration configuration and route contracts at a time. Declare which files are touched. No parallel agents editing the same migration or shared component.
5. **Protect existing customer experiences.** Preserve working template designs, Scar-specific assets and public URLs. Do not refactor visually finished sites merely to impose a new abstraction.
6. **Prove behavior.** Each PR requires tests or documented manual verification, build/lint/typecheck (as supported by repo), a rollback plan and a short changelog. Never claim “secure,” “SEO-complete,” or “live” without evidence.
7. **Treat external text and AI output as untrusted.** Server-side validation, authorization and human approval are mandatory at sensitive boundaries. Do not let lead text instruct Virtue to execute privileged actions.
8. **Fail closed on launch blockers.** If payment, identity, tenant isolation, form delivery or a security control fails, preserve a disabled feature or manual fallback rather than silently claiming it works.
9. **Budget discipline.** Do not introduce paid dependencies, high-volume model processing, auto-renewing domains, or email sends without documenting unit costs, quotas, alert thresholds and who is billed.
10. **Record results in this document (or linked PRs):** `NOT STARTED | IN PROGRESS | BLOCKED | VERIFIED | DEFERRED`, owner, evidence link, and known issues.

### Classification key

- **G0 — Release blocker:** Must work before **taking payment and promising delivery** of the feature/service in question. A security failure is G0 across the platform.
- **G1 — Launch readiness:** Must be done before publicly advertising a *specific capability* (for example “automated booking” or “SEO-ready”). Can be deferred if the claim/feature is removed from the sales offer and a clear manual workflow exists.
- **G2 — After launch:** Worth building, but do **not** delay initial paid sales for it.
- **BIZ — Founder-owned business action:** Important to company setup; distinct from whether code can ship.

**Business product assumptions to verify before changes:** Express is approximately **$599** and should feel premium, not throwaway; Professional is a curated mix of reusable components and design systems; Growth is reserved for genuinely unique/custom builds. Express/Professional share central production infrastructure. Existing client subscriptions are Basic Hosting, Vigilance Care, Growth, Priority. **Basic lead capture/inbox must work for applicable customers; Virtue AI is reserved for Growth/Priority unless the founder explicitly changes entitlements.** Client ownership of code and subscription/hosting support must remain consistent with contract language. Do not silently change pricing or product definitions.

---

## 1. Decision snapshot and prioritized backlog

**Planning estimates below are rough engineering time ranges, NOT promises, and assume the actual repo may contain reusable work.** Rows with separate code owners can run concurrently; **merge/release order still matters**.

| ID | Workstream | Class / launch gate | Rough scope | GPT assignment | Claude assignment | Success for October 11 |
|---|---|---|---|---|---|---|
| 00 | Repo inventory, worktrees, dependency map | **G0 process** | 30–75 min | GPT-6 Sol, Medium | Sonnet 5.5, Medium | Owners, interfaces and blockers identified; safety baseline established |
| 01 | Finish **Scar** production site | **G1** for creator promo; **G0** if promised/launching it | 2–6+ hr | GPT-6 Sol, High; **Astra Pro only for unresolved art direction** | Sonnet 5.5, High; Opus 5.5 for difficult design review | Mobile/desktop QA and deployment-ready review link |
| 02 | Shared contact submission → **Lead Hub** → email | **G0** for any site advertising contact forms | 4–12+ hr | GPT-6 Sol, High | Sonnet 5.5, High; Opus 5.5 architecture review | Cross-tenant-safe lead reaches dashboard and correct client inbox |
| 03 | Booking link/embed on applicable sites | **G1**, **G0** where booking is promised | 1–3+ hr | GPT-6 Sol, Medium | Sonnet 5.5, Medium | Configurable tested booking link/embedded provider |
| 04 | Security threat model, audit, fixes, re-test | **G0** | 4–12+ hr | GPT-6 Sol, High; independent GPT-6 High review | **Opus 5.5, High** review; Sonnet 5.5 fixes | No unresolved critical/high exploitable release issues; evidence archived |
| 05 | Shared SEO foundation + site QA | **G1** before claiming SEO-ready | 2–7+ hr | GPT-6 Sol, Medium/High | Sonnet 5.5, Medium/High | Correct indexability, canonical, sitemap and structured metadata per launch site |
| 06 | Stripe/onboarding/deploy journey validation | **G0** for paid onboarding | 2–5+ hr | GPT-6 Sol, High | Sonnet 5.5, High; Opus 5.5 for money-state review | Test purchase → intake → preview → live (or documented manual domain step) |
| 07 | NY LLC formation/admin checklist | **BIZ**, not an absolute technical prerequisite to write code | 1–3 hr plus external processing | GPT-6, Medium drafting/research | Sonnet 5.5, Medium | Name/filing/approval/compliance obligations handled by founder |
| 08 | Repo cleanup and CI reliability | **G0 for dangerous issues**, otherwise G2 | 1–4+ hr | GPT-6 Sol, Medium | Sonnet 5.5, Medium; Haiku 5.5 for inventory | Clean, reproducible repo; no destructive reorganization |
| 09 | Vercel domain **discovery + pricing** | **G2**, optional near-term sales enhancement | 2–5+ hr | GPT-6 Sol, Medium/High | Sonnet 5.5, Medium/High | Flagged, safe domain-search UI and price disclosure |
| 10 | Domain **purchasing + automated attach** | **G2** unless currently marketed as automatic | 1–3+ days depending on payment/ownership choices | GPT-6 Sol, High | Opus 5.5, High architecture; Sonnet 5.5 implementation | Secure order workflow, consent, reconciliation, recovery and manual fallback |
| 11 | Virtue AI lead copilot + qualified booking sync | **G2**; **G1** before marketing specific AI features | 1–4+ days | GPT-6 Sol, High; Astra Pro **not needed** | Opus 5.5, High architecture; Sonnet 5.5 implementation | Opt-in, tier-gated AI drafts/summary; booking sync only where supported |
| 12 | Audit legacy Express variants / migration plan | **G1 per variant**, engine migration **G2** | 2–6 hr audit; migration separate | GPT-6 Sol, Medium; Astra Pro limited visual critique | Sonnet 5.5, Medium/High | Sell / fix / retire decision per existing variant |
| 13 | Create additional Creator Express variants | **G2** | 1–3+ days | GPT-6 Sol, High; Astra Pro only for unique exploration | Sonnet 5.5, High; Opus 5.5 for novel exploration | Later: distinct, reusable, tested second/third designs |
| 14 | Business cards, contracts, offer and outreach | **BIZ/G1** (contracts before paid sales; cards G2) | 1–4 hr | GPT-6, Medium; Astra Pro optional graphic concept | Sonnet 5.5, Medium | Approved legal/contact info, ordered small print run, usable sales scripts |
| 15 | Final end-to-end release signoff | **G0** | 1–3+ hr | GPT-6 Sol, High | Opus 5.5, High independent audit | Founder sees green/amber/red evidence and approves release |

**Choose the smallest sellable set:** If 01, 02, 03 (when advertised), 04, 05, 06, 08-critical and 15 are green, launch the capable site(s). Do **not** wait for 09–13 or physical cards. LLC/company readiness is a founder decision with legal/accounting input; do not treat the $200 filing itself as a substitute for compliance, contractual readiness or KPMG outside-activity approval.

---

## 2. Execution phases and dependencies

### Phase A — Today: establish the baseline (00)

**Goal:** Prevent five agents from creating conflicting implementations.

- Inventory package scripts, workspaces/packages, deployment configs, site/template catalog, shared engine components, existing contact components, booking hooks, webhooks, Stripe flows, Supabase schema/RLS, admin/client roles, domain/DNS code and CI.
- Identify **source of truth** for reusable site metadata, tenants, deployments, prices, subscriptions and contact schemas.
- Capture baseline build/test results, production health, outstanding bugs and known secrets exposure without printing secrets.
- Identify which environments are **sandbox, preview and production**; confirm real customers and existing subscriptions aren't affected by test work.
- Write `docs/launch/as-is-inventory.md`, `docs/launch/interfaces.md` and `docs/launch/launch-issues.md` or equivalent files following existing conventions.
- Reserve ownership: **Lead service + migrations** in one branch; **Scar UI** in another; **SEO** in another; **domain discovery** in another; security audit is read-only until fixes are assigned. Shared auth, tenant membership and deployment service must have one responsible integrator.

**Acceptance:** No duplicate service invented; PR owners/paths listed; reproducible baseline and safe test environment known.

### Phase B — Finish Scar's creator site (01)

**Objective:** One stunning, complete client project that makes a compelling promotional case study. Preserve Scar's one-of-one creative treatment; do **not** add her paper/pixel art direction into generic templates.

1. Compare client brief/approved direction against actual page, sections, links and assets. Identify incomplete work and obtain client approval for subjective decisions.
2. Finish responsive states (small phone, large phone, tablet, desktop), navigation, footer, CTA, forms, booking (if in scope), accessibility keyboard path and focus states.
3. Optimize images/video; check layout shifts, loading fallback, media accessibility and links to socials/collaborations.
4. Apply shared SEO infrastructure from 05; customize profile metadata, social preview and canonical domain; avoid false or unverified Person/Organization claims.
5. Connect the shared contact system from 02; confirm lead routes only to the correct client. If the feature is not ready, label/disable its CTA rather than launching a dead form.
6. Run production-like previews; have founder/Scar approve assets, content, photography permission and final site; create launch screenshot/video only after approval.
7. Deploy only with founder authorization. Archive QA evidence and customer handoff checklist.

**Definition of done:** No obvious UI or functional defects; proper permissions; working conversion CTA; reviewed production URL and owner signoff.

**Business upside:** Scar's promo becomes useful proof for creator outreach. **Financial guardrail:** Free promo work must not become unbounded; track real hours, out-of-pocket tools and agreed scope.

### Phase C — Shared website lead ingestion, dashboard and email (02)

**Decision:** Every active contact form feeds a client-specific **Lead Hub** in Vigil Dashboard. Lead capture is a universal infrastructure service; **Virtue adds intelligence** to that data for eligible plans, not a separate database or chat silo.

**Architecture to implement or adapt (not mandates for exact file paths):**

```text
Visitor → Express/Professional/Growth contact component
  → public submission endpoint (schema validation + abuse controls)
  → resolve target tenant from verified deployed-site registry
  → database transaction creates/links lead + immutable activity event
  → durable notification outbox/job
  → Resend sends to server-configured client destination
  → delivery/webhook status updates → Vigil Dashboard Lead Hub
  → optional, entitlement-checked Virtue job (post-launch AI phase)

Booking URL/embed (phase 03) → external scheduler
  → optional signed booking webhook (phase 11)
  → linked lead event and appointment status
```

**Implementation steps:**

1. **Inventory existing components.** Normalize shared schema: name, contact method, consent flag if applicable, message, source form, source page, business/site ID, timestamps and optional validated extensions. No per-template email credentials.
2. **Tenant model.** Reuse verified tenant/site/deployment relationships; do not trust `tenant_id` or recipient email submitted by browser. Public site identifiers are not secret authentication. Match submissions to registered, active deployments; use Turnstile server verification, abuse controls and per-site quotas; CORS/Origin checks supplement rather than replace security.
3. **Data model (suggested, adjust existing schema):** `leads`, `lead_events`, `lead_sources`, `lead_contact_methods`, `notification_outbox`, `delivery_attempts`, `tenant_lead_settings`, and optional `appointments`. Add appropriate unique/idempotency constraints, indexes, timestamps, status enum and retention rules.
4. **Authorization:** RLS and least-privilege grants for all exposed tables. Members read/update only authorized tenant leads; anonymous visitors cannot query lead tables; service key stays exclusively server-side. Audit admin cross-tenant access. Test tenant A cannot list, fetch, search, update, export or subscribe to tenant B data; include IDOR and realtime/storage checks.
5. **Notification pipeline:** Verify a Vigil sending domain/subdomain with SPF/DKIM (and appropriate DMARC); server-configured recipient from client settings; email-to-client and optional acknowledgement; avoid turning endpoint into a general-purpose email relay; idempotent outbox, exponential retry, bounce/failure tracking; store the lead even if sending fails.
6. **Anti-abuse:** Field validation/length limits; sanitization/escaping for HTML email and dashboard; Cloudflare Turnstile with mandatory server-side Siteverify; bounded rate limits; bot/honeypot optional; no sensitive health/financial fields unless separately reviewed and necessary.
7. **Dashboard:** An authenticated Lead Hub list, search/filter by status/source, lead detail/timeline, mark `new/contacted/qualified/booked/won/lost`, unread count, and manual notes. Avoid implying a conversation was actually sent when it's merely drafted.
8. **Entitlements:** Baseline lead capture and basic notifications available to the appropriate clients; AI processors and advanced automations behind Growth/Priority feature flags and usage budgets.
9. **Auditability:** Delivery attempts, created-by actor, status transitions, safe operational logs, alert if lead events succeed but notifications repeatedly fail.
10. **Test fixtures:** At least two tenants/two domains, malicious forged tenant ID, invalid CAPTCHA, duplicate submit, mail provider failure, retry, unsubscribed/disabled tenant, malformed payload, inaccessible lead detail, correct sender/recipient.

**Definition of done:** A visitor submits once; the correct client sees exactly one lead and activity event; the authorized client's destination receives a notification or sees an actionable delivery error; another client cannot see/alter the record; no visitor-controlled email-recipient or tenant escape is possible.

**Financial impact:** Centralized service avoids per-client integration labor. Track per-tenant volume, outbound email cost, abuse costs, storage, and retention; alerts before paid quota spikes. Resend supports idempotency keys. See [Resend idempotency](https://www.resend.com/changelog/idempotency-keys), [Cloudflare Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Phase D — Booking V1 (03) versus true booking synchronization (11)

**V1: today, if booking is advertised.** Store a customer-configurable and validated external booking URL (e.g. Calendly); render a mobile-friendly button, modal or embed. Test its open/close/fallback, accessibility, consent/privacy disclosures and absence of broken links. A booking embed **is not yet a fully synchronized appointment system**.

**V2: after launch.** To make bookings appear reliably in Lead Hub: select provider integration and authorization per client; register and verify signed webhooks; deduplicate by provider event ID; handle scheduling, cancel/reschedule, timezone/PII, and link attendee to a lead with safe matching. Show unlinked bookings for manual review rather than wrongly merging people. Calendly webhooks require qualifying plans; not every customer can use them. A Calendly embed is supported on all plans but webhook API features differ; verify plans before promising sync. **Do not describe V1 embed clicks as confirmed appointments.**

**Definition of done V1:** Client configures provider link; website renders functioning booking CTA. **V2:** signed webhook events update a tenant-scoped appointment timeline, and cancellation/rescheduling is idempotent.

Sources: [Calendly embed vs API](https://calendly.com/help/calendly-embed-and-the-api), [webhook availability](https://calendly.com/help/webhooks-overview), [signature verification](https://developer.calendly.com/api-docs/overview/webhooks/webhook-signatures).

### Phase E — Security review and mandatory fixes (04)

**Security is two passes:** (1) baseline inventory and threat model; (2) post-merge regression/independent signoff. An automated `npm audit` is a useful input, not a full security review. Unresolved critical/high **exploitable** risks block launch; lower risks have an owner, documented rationale, deadline and compensating control.

Audit checklist:

- **Auth/session/roles:** server-side authorization everywhere; admin actions restricted; cookies secure/HttpOnly/SameSite where appropriate; session invalidation and MFA for sensitive admin; no authorization based only on client UI.
- **Supabase:** RLS/grants/default privileges on exposed tables; service-role leaks; SQL/RPC functions and security-definer risks; storage bucket and realtime channels; migration reviews and backups.
- **Tenant isolation:** cross-client lead read/write, client settings, documents, assets, domains, Vercel project IDs, admin impersonation, uploaded files, and export APIs. Run explicit two-tenant adversarial tests.
- **Public forms:** server-side schema validation, email routing, Turnstile verification, rate controls, spam, content injection, duplicate/replay, PII retention and safe logs.
- **Payments:** Stripe webhook signature verification, duplicate/out-of-order events, server-side price/product mapping, subscription entitlement checks, refunds/failed payments, no browser-asserted `paid=true`, privileged actions requiring confirmed state.
- **Infrastructure:** Vercel project/team permissions, commercial plan compliance, preview access, secure environment separation, Cloudflare DNS/token privileges, leaked secrets in git history, webhook secrets, dependency advisories, safe CSP/headers and redirects.
- **Production workflow:** authenticated repository creation/deployment/DNS changes, idempotent retries, unauthorized request prevention, backups, rollback, observability and incident contact.
- **Vulnerability controls:** secret scanning, dependency and static scans, targeted tests (IDOR, XSS, CSRF, SSRF on URL fetchers, auth bypass, malicious file uploads, brute force, race conditions), review logs without leaking real customer data.
- **Privacy/communications:** data minimization, stated use of leads and AI, retention/deletion controls, applicable opt-in/unsubscribe rules for marketing, processor disclosures, terms/privacy review; no AI training on client data by default.

**Deliverables:** `security/threat-model.md`, `security/findings.md` (severity, exploit scenario, owner, remediation and test evidence), relevant unit/e2e/security tests, documented open risks. Conduct independent second-model review focused on *actual diffs*.

**Do not** force major version upgrades just to silence audit output; test compatibility, migration and rollback. Do not run destructive pentesting against live third-party/customer systems without authorization.

### Phase F — Central SEO foundation and validation (05)

1. Identify a shared SEO adapter in the production engine that generates **site-level**, **page-level**, and **client-specific** metadata; do not embed SEO copy or schema into every decorative UI component.
2. Ensure unique titles/descriptions, absolute canonical URLs per client domain, social/Open Graph/Twitter cards, favicon, meaningful headings, descriptive links/alt text, correct link crawlability and non-placeholder content.
3. Generate client-specific `sitemap.xml`/`robots.txt`, choosing the correct canonical hostname. Preview and unapproved template/demo URLs should not compete in search; use deployment protection for private previews and correct `noindex` rules for public demos. Never assume `robots.txt` alone enforces `noindex`.
4. Use truthful industry-appropriate JSON-LD, e.g. Organization/LocalBusiness only where supported by real client information. Avoid invented reviews, ratings, hours and credentials; don't inject identical bogus structured data across template sites.
5. Test accessibility and Core Web Vitals/performance on representative mobile and desktop pages; optimize fonts/assets/media and server-render important content when suitable.
6. Audit Vigil Studios main domain, Scar's domain/previews, the finished Creator Express, each active Express template and any public Professional demos. Identify canonical duplication risks for clone/demo sites.
7. Validate generated HTML metadata, crawlability, status codes, structured data and canonical/sitemap agreement. Save evidence and manual remediation notes. Search Console setup and client-specific keyword/content work can follow after deployment/verification.

**Definition of done:** Every live client domain emits correct per-client metadata, canonical and crawl directives; preview URLs don't inadvertently compete; no bogus structured data; all site/preview pages have appropriate status and CTA. **No SEO guarantee:** indexation/ranking are not assured.

Sources: [Google technical requirements](https://developers.google.com/search/docs/essentials/technical), [canonicals](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

### Phase G — Payment → build → deployment delivery path (06)

Map and test the actual new-customer workflow:

```text
Plan selection → Stripe Checkout (server-created amount/plan)
→ verified payment/subscription webhook → customer record/entitlement
→ onboarding questionnaire / brand assets
→ choose Express variant or curated Professional composition
→ create repo → generate site with correct tenant identifiers
→ Vercel preview → client review/revisions → launch approval
→ production deployment → domain connect (manual permitted)
→ verify live site, form, booking, SSL, SEO and portal access
```

- Test success, failed payment, duplicate webhook, canceled subscription, refund/chargeback, interrupted onboarding and failed deployments.
- Preserve client code ownership provisions, delivery definitions, subscription services, maintenance responsibilities, third-party costs, revision limits and ownership of domains/IP in service agreement.
- Make pricing and recurring charges explicit; confirm manual launch/domain handling doesn't contradict checkout claims.
- Use test-mode transactions and sandbox webhooks. Never charge a real card just to prove a code path unless approved.

**Definition of done:** One representative customer can be fulfilled end-to-end with known steps, clear human checkpoints and recovery after partial failure. An unverified paid order must never auto-provision a purchased domain.

### Phase H — Repository cleanup, with a safety-first order (08)

**Do some today, leave broad refactors for later.**

**Before editing:** capture git status, branch, tests, file ownership and backup strategy. Do **not** `rm -rf` uncertain directories, rewrite git history, delete migrations/assets or regenerate lockfiles without review.

- **G0 critical:** remove/revoke committed credentials and exposed keys (rotate only with approval and coordinated deployment), validate `.gitignore` and `.env.example`, remove hardcoded client addresses/secrets, correct broken build scripts or unsafe permissions.
- **High ROI:** deduplicate shared forms/SEO utilities without changing output; remove dead import paths and unreachable flags only after usage search; centralize client/site config; repair lint/type errors; add smoke tests and seed fixtures.
- **Docs:** update architecture map, env/setup README, component/variant manifest, ADR for lead architecture, migration/runbook, deploy rollback, support triage, ownership and release checklist.
- **CI:** install from lockfile; lint/typecheck/tests/build; secret scan; schema migration verification; preview smoke test; restrict required branch checks and production deploy permissions.
- **After launch:** reorganize folders, consolidate packages, prune truly unused dependencies/assets, replace legacy template internal architecture if justified by measured maintenance pain.

**Definition of done:** Fresh clone can build, tests run, docs reflect architecture, no unapproved deletion, and affected output is regression-tested. Cleanup is **not** permission for a repo-wide aesthetic refactor during launch day.

### Phase I — Domains: fast discovery (09), purchase after safeguards (10)

**Discovery milestone — viable today:** Build provider adapter using Vercel **Domains Registrar API**, normalizing domain input, supported TLDs, real availability, registration price, renewal price and price freshness. Show distinction between current quoted price and final confirmed amount. Validate domain normalization, unsupported names, API errors and rate limits. Cache cautiously, never present stale availability as guaranteed, never include private tokens client-side. Make optional in dashboard via feature flag.

As of September 28, 2026, Vercel's domain **search** endpoint can be used without authentication; purchases/management still require authentication. Use the newer `/v1/registrar/` APIs instead of the deprecated legacy domain endpoints. Sources: [Vercel public search](https://vercel.com/changelog/search-domains-without-authentication), [Registrar API](https://vercel.com/docs/domains/registrar-api).

**Purchasing milestone — deliberate, not a quick button:**

1. Decide **registrant/beneficial owner**: client-registered, Vigil-managed as an agent, or client-owned external registrar with guided DNS. Put domain transfer/offboarding and renewal responsibilities in agreement.
2. Inspect Vercel billing authorization, applicable TLD/ICANN contact and registration requirements, tax and renewals. Plan pricing policy (pass-through vs margin) and separate initial registration from annual renewal disclosure.
3. Capture explicit customer confirmation for exact domain, registrant contacts, term, amount and renewal terms; confirm payment with Stripe server-side before purchasing.
4. Use server-only provider token, per-tenant access control, idempotent purchase intent and outbox/state machine (`quoted → authorized → purchasing → registered → attached` or `failed/manual_review`); protect against duplicate orders, amount changes and provider timeouts.
5. Recheck availability and final amount immediately before checkout/purchase; handle out-of-stock, premium TLD pricing and order status reconciliation; never auto-repeat a purchase after an ambiguous timeout.
6. Attach domain to correct Vercel project, verify DNS/SSL/canonical redirects, log purchase and ownership, schedule renewal and cancellation controls, and provide manual recovery.
7. Test all paths with mocks and safe environments; real purchases are irreversible-cost actions and require founder approval.

**Fallback:** Allow clients to bring domains or have Vigil set up domains manually. **Do not block sales** while automated purchase is built. Consider Cloudflare Registrar API beta only after explicit vendor selection rather than maintaining two registrars at launch.

### Phase J — Virtue AI in the Lead Hub (11): design now, autonomy later

**Product principle:** Virtue = the client's AI lead assistant. Every lead is in Lead Hub; Virtue augments the lead lifecycle for entitled Growth/Priority customers. It must not be the only way to see inquiries or book visits.

**Suggested design:** `lead.created` event → per-tenant entitlement/consent/budget check → worker → safe structured classification, intent, summary, urgency and suggested next step → store with provenance/model/version → show **draft only** in Lead Hub. Booking and conversation events can enrich the history when connected.

**V1 (post-launch):** summaries, tagged intent, priority recommendation, suggested responses (human approval), rules and per-tenant opt-out, audited token spend and outcomes. **V2:** opt-in scheduled follow-ups, limited templates/business hours, stop-on-reply, consent and unsubscribe checks as required, escalation, human takeover, feedback loop. **Do not** activate autonomous sending or claims of actual sales conversion from sentiment alone.

**Security:** prompt-injection isolation; no cross-client retrieval; deterministic guardrails around actions; PII minimization; queue/retry/idempotency; enforce tier quotas in backend (not UI); no accidental AI usage bills for Basic Hosting/Vigilance Care.

**Metrics:** lead response time, contact-to-booking rate when verified, lead source mix, AI suggestion acceptance, conversion only when accurately marked, cost per AI-action and cost per tenant. Ship measurable business value, not just AI branding.

### Phase K — Existing Express variants: sellability versus migration (12–13)

**Decision:** New variants default to the Professional production engine. **Do not automatically replace a good legacy design.** Audit the existing Restaurant/Café, Home Services, Retail/Boutique, Medical/Dental, Salon/Spa, Auto Shop and other actual variants discovered in repo.

For each variant, record:

- visual identity and differentiation; polish compared with credible commercial templates;
- mobile/desktop, accessibility, loading/performance, real asset licensing;
- functional CTA, contact/email, booking when relevant, navigation and footer;
- safe tenant identity and form routing, correct pricing/claims, SEO metadata and per-client customization;
- realistic fulfillment time with/without engine and expected maintenance cost.

Score each `SELL NOW (minor fixes only) / FIX BEFORE SELL / RETIRE / MIGRATE LATER`. One founder-reviewed screenshot set, mobile QA and test inquiry per variant. Record known omissions and don't sell unsupported features. **Legacy engine migration is G2** unless architecture causes direct security/fulfillment failures (then fix those as G0).

Additional Creator Express variants #2 and #3 are **G2**. Generate from engine after shared contact, CTA, footer, SEO and launch workflow are proven. Require materially different visual direction and measurable customer-choice value, not near-duplicates. Scar's unique artwork must not be repurposed.

---

## 3. Founder-owned business and financial work (parallel to coding)

### 3A. Form Vigil Studios LLC in New York (07)

**Founder owns submission and payments. Agents may draft/check, not file or pay without authorization.**

1. Confirm **Vigil Studios LLC** availability using NY Department of State records and perform a separate preliminary USPTO/common-law trademark/confusion check. State name acceptance does not equal trademark clearance.
2. Review outside-employment/independence approval from KPMG **before paid engagements**; if pending, resolve per employer policy and avoid assumptions.
3. Review official NY instructions, file Articles of Organization directly with the state if the founder chooses, and securely retain filing receipt. NY filing fee is **$200**.
4. Create a single-member written Operating Agreement if applicable; New York requires adopting an operating agreement within **90 days** of filing. Have a lawyer review when sensible.
5. Request free EIN directly through IRS **after entity formation**; verify service hours at time of application. Do not pay a third party solely for an EIN.
6. Arrange required publication in two county-clerk-designated newspapers for six consecutive weeks and submit Certificate of Publication plus affidavits and **$50** filing fee within **120 days**, unless a valid exception applies. Publication quotes vary; solicit approved Suffolk County options rather than guessing cost.
7. Open a separate business checking account, update Stripe legal entity/tax setup, invoice names, contracts and accounting; preserve expense receipts and reconcile payments. Evaluate business insurance and any NY sales-tax implications with a CPA; do not assume all bundled digital products/services have identical tax treatment.
8. Record state biennial-report and other tax/compliance reminders. Consult NY counsel/CPA for legal/financial advice, licensing/privacy and publication questions.

**Financial note:** $200 + $50 state fees **plus** newspaper publication, possible name/expedite/professional charges; register exact quotes in the spend ledger. Do not equate an LLC with insurance or immunity from all liability.

Official reference: [NYS formation](https://dos.ny.gov/forming-limited-liability-company-new-york), [Articles of Organization](https://dos.ny.gov/articles-organization-domestic-limited-liability-company).

### 3B. Contracts, positioning, operational billing (14)

- Standardize Express versus Professional versus Growth deliverables; website ownership, hosting subscription, included revisions, launch timeline, cancellation/termination, support levels, third-party services, AI/lead-data handling, DNS/domain ownership and portability.
- Create an onboarding acceptance checklist and client sign-off for copy/assets, publication, booking tool and domain data.
- Verify Stripe products/prices and subscriptions match site marketing and checkout (including one-time site fee versus recurring hosting/services).
- Ensure `vigilstudios.co` shows accurate contact information, privacy, terms, refund/service policies as appropriate, schedule-a-call CTA and a case-study/demo pathway.
- Separate **acquisition funnels**: Lead Engine, Social (Scar creator promo + Vigil IG/TikTok), Direct/Referral. Begin targeted outbound once promises are deliverable; do not wait for every automation.

### 3C. Print the first business cards (14; after confirming brand/contact details)

- Premium dark style, established green accent (`#10D45A`), genuine approved Vigil mark, readable typography, enough print bleed/safe margins.
- Front: Vigil Studios identity; back: founder name/title, site, business email, optional phone, and a real QR code to tracked booking/creator/landing page as appropriate.
- Verify QR from multiple phones, no placeholder links, actual landing page works. Avoid printing an `LLC` legal suffix until legally approved/confirmed and ensure business identity is accurate.
- Request print-proof from reputable vendor; order a **small batch of 50–100** first, track unit cost/shipping and avoid expensive finishes until design is validated.
- Cards are useful for person-to-person outreach but **not** a launch gate.

### 3D. Cost and cash-control register

| Expense/obligation | Cost treatment | Decision |
|---|---|---|
| NY Articles of Organization | $200 official state fee | Founder approves filing |
| NY Certificate of Publication | $50 state filing + variable newspaper costs | Obtain county-designated publication quotes |
| EIN | $0 when obtained directly from IRS | Do not buy from reseller |
| Vercel production hosting | Verify applicable commercial **Pro/Enterprise** plan and variable usage | Do not run paid customer production on noncommercial Hobby |
| Supabase | Current tier + compute/storage/DB/email/network overages | Set budgets/alerts and validate backup/recovery |
| Resend | Free/paid quotas vary; email volume plus domain verification | Set sending cap and track provider cost |
| Stripe | Current processing fees, disputes, refunds and payout delay | Price services on **net** contribution margin |
| Domain registrations | TLD-specific registration/renewal, possible premium domains/tax | Require confirmed customer payment and consent |
| Virtue AI | Per-model usage, retries, context size and per-client caps | Growth/Priority only until pricing is revised |
| Business cards | Quote for 50–100 plus shipping/tax | Small initial batch |

**Unit-economics requirement:** For each Express sale, calculate `site fee – processor fees – direct fulfillment costs – allocated tool usage – support/revision labor`; separately model subscription monthly contribution margin after hosting, database, email and AI costs. Set a per-client default infrastructure budget and overage alert. High-interest personal debt payoff is an owner finance decision: retain cash for taxes, operating runway, renewals and customer obligations before withdrawing profit.

---

## 4. Parallel execution layout (avoid wasted GPT/Claude credits)

| Lane | Workstream | Branch/worktree | Dependency/merge rule | Agent |
|---|---|---|---|---|
| A | Scar visual/composition QA | `launch/scar-finish` | Do not modify shared lead schema; integrate after Lane B contract | GPT-6 Sol High or Claude Sonnet 5.5 High |
| B | Lead service, outbox, dashboard | `launch/leads-core` | Own schema/migrations/contact API until reviewed | GPT-6 Sol High; independent Claude Opus 5.5 High review |
| C | Read-only security reconnaissance | `audit/security-baseline` | Report first; assign security fixes to owners of touched code | Claude Opus 5.5 High or GPT-6 Sol High |
| D | SEO shared metadata + audit | `launch/seo-core` | Avoid touching Scar-specific design; document interface | Claude Sonnet 5.5 Medium/High |
| E | Domain discovery behind feature flag | `feature/domain-discovery` | No purchase/order code; integrate only after release blockers | GPT-6 Sol Medium/High |
| F | Repo docs/test inventory | `chore/launch-readiness` | Limit to safe cleanup and CI/doc PRs | Claude Sonnet 5.5 Medium; Haiku 5.5 for mechanical inventory |
| Founder | LLC, approvals, print proofs, clients | **No code branch** | Founder signs/authorizes legal, financial and production changes | GPT-6 Medium as advisor/drafter |

**Avoid simultaneous writes** to shared package lockfiles, auth middleware, DB migrations, environment configs and deployment scripts. Assign a single integrator to reconcile and merge these changes in order. Suggested merge sequence: lead contract/migrations → security fixes → shared contact UI → SEO → Scar integration → deployment path/e2e QA → optional domain discovery. Re-run security and regression tests after each impactful merge.

**Model spending policy:** GPT-6 **Sol Medium** or Claude **Sonnet 5.5 Medium** for inventories, docs, straightforward components, config and SEO. **Sol High / Sonnet 5.5 High** for backend coding, RLS and integrations. **Opus 5.5 High** for second-opinion threat modeling, state-machine design or difficult cross-service debugging; use sparingly. **Astra Pro** only for truly unresolved creative direction and high-value aesthetic reviews (Scar or novel Creator variants), *not* routine productization. **Haiku 5.5** for mechanical summaries/checklists only, not security signoff. Available model/effort labels may differ across product surfaces; select nearest available equivalent. Independent review should use a different model/family when practical.

**Do not let agents burn expensive effort re-generating the same concept.** Require a written architectural proposal and acceptance test before large code sessions; batch narrowly scoped diffs; cache/reuse settled briefs; escalate to stronger model only on genuine ambiguity or failures.

---

## 5. Launch acceptance / go-no-go

**These are verification items, not automatically completed tasks.** The final reviewer should attach evidence/links to each. A green build alone is insufficient.

### Required before taking customers or advertising the relevant service

- [ ] Correct offer, prices, obligations and subscription terms reflected in site, Stripe and agreements.
- [ ] Founder has resolved employer outside-business/independence approval as applicable; company/tax setup approach documented.
- [ ] Client checkout/onboarding path succeeds in test mode, idempotently and with correct entitlements.
- [ ] Representative Express/Professional generation, preview, revision, deploy and rollback path verified; any manual domain step is explicit.
- [ ] All marketed forms are functional: valid submission creates tenant-correct lead, correct notification, recoverable email failure and no cross-tenant access.
- [ ] Book buttons on relevant sites actually work; no false claim of automatic synced appointments.
- [ ] No exposed secrets or exploitable critical/high security defects; authorization, tenant isolation, webhook signatures, rate limits, backups and release controls verified.
- [ ] Live sites have real CTAs/content, mobile and desktop QA, privacy/consent considerations, basic accessibility/performance and correct SEO/indexing settings.
- [ ] Scar's site has founder/client signoff **before its associated creator promotion**.
- [ ] Production deployments, Stripe activity, lead submissions and outbound mail failures have operational visibility and a named escalation owner.
- [ ] Release reviewer has signed off a test matrix, known-risk log and rollback instructions.

### Can ship *after* initial paid sales (provided not promised as included)

- [ ] Automated Vercel domain discovery and pricing (nice-to-have, can launch as standalone soon).
- [ ] Fully automated domain purchasing, registration/transfer and renewal.
- [ ] Calendly/customer-calendar OAuth, signed webhook booking reconciliation and full appointment CRM.
- [ ] Virtue AI qualification, follow-up drafts and any approved autonomous sequences.
- [ ] Migrating all legacy Express UIs to Professional engine internals.
- [ ] Two more Creator Express variants and expansion of nonessential design collections.
- [ ] Deep repo reorganization, extra animations, advanced SEO content programs and advanced analytics.
- [ ] Printed business cards (can order now; not required for first sale).

**Three allowed end states:**

- **GREEN — Public sales**: G0 evidence complete; sell only verified capabilities.
- **AMBER — Promotion/lead collection only**: good enough for case study, demos, waitlist, appointments, or prospecting, but paid ordering/unsupported features are disabled until blocker cleared.
- **RED — Hold deployment**: critical security, tenancy, billing or data-loss risks; diagnose and remediate first.

---

## 6. Suggested Sunday sequence (starting around midday, flexible)

This is **priority order**, not a claim everything will fit within one Sunday.

1. **First 45–75 minutes:** founder brief + repo inventory, save current state, branch ownership, security baseline. In parallel, founder checks NY name/employer compliance and gathers LLC documentation.
2. **Next main coding block:** Scar finalization (A), Lead Hub/contact backend (B) and read-only security audit (C) in separate branches. Confirm acceptance tests before implementation. Founder may complete LLC filing steps during agent runs.
3. **Integration block:** Connect Scar + representative Express contact to shared service; implement Resend/Turnstile and dashboard pipeline; test tenant isolation and mail failure. Fix any G0 security issues before expanding features.
4. **SEO/fulfillment block:** central SEO, Stripe→onboarding→preview→deploy smoke path, correct product promises, controlled merge and independent security re-test.
5. **Founder admin block:** document publication deadlines, estimate print/order cards, verify landing/QR and customer agreement; do not block active builds for polishing a business card.
6. **Stretch only if gates are green:** Vercel search UI (not purchase), audit one legacy Express variant; capture design gaps for later. Domain purchase, Virtue autonomous action, deep cleanup and additional variants remain follow-on PRs unless completed safely with full tests.
7. **Final 30–60 minutes:** integrate, verify the release matrix, classify GREEN/AMBER/RED, record next-day owner and status, and make a **human-approved** deploy/marketing decision.

**If today must be narrowed to three engineering outcomes:** (1) one finished Scar promotional site, (2) contact→Lead Hub→email on a representative sellable site, (3) secure, tested paid-order delivery. Security signoff governs all three. SEO minimums are folded into each site's release QA. Domain automation should not preempt these.

---

## 7. Handoff template for each coding agent

Copy the below into an issue/agent task and fill from the repo's actual structure:

```text
Task ID and title:
Business reason / launch classification (G0, G1, G2):
Repository and branch/worktree:
What exists already (verified; with paths):
In-scope modules and ownership:
Out-of-scope files/services:
Inputs, schema/API contracts and dependencies:
Implementation steps:
Acceptance criteria (automated + manual):
Two-tenant/security and failure cases:
Secrets / data-handling rules:
Cost/usage, observability and rollback implications:
Commands/tests to run (adapt to package manager):
Deliverables (diff/PR, migrations, docs, screenshots, test evidence):
Assumptions/questions that genuinely block safe work:
DO NOT deploy, purchase, charge, email real users, modify prod data or DNS without authorization.
Return: Summary; changed files; tests and evidence; unresolved risks; exact follow-up owner.
```

### Required review output format

```text
STATUS: NOT STARTED | IN PROGRESS | BLOCKED | VERIFIED | DEFERRED
BRANCH/PR:
CHANGE SUMMARY:
ACCEPTANCE TESTS:
SECURITY / TENANCY EVIDENCE:
COST / INFRA IMPACT:
DEPLOY / ROLLBACK:
REMAINING RISKS (severity, owner, due date):
FOUNDER DECISION REQUIRED:
```

---

## 8. Founder's final decision rubric

**Ship for customers when:** the core funnel creates value for real businesses, the offer is accurately scoped, forms and payments do not fail silently, data is tenant-safe, delivery is repeatable, and support is affordable.

**Delay the ship when:** clients can access one another's data, payments or domain orders can duplicate, a site promises but does not deliver contact/booking, secrets are exposed, security testing is incomplete on changed critical paths, or nobody can recover a failed deployment.

**Improve after first customers:** domain purchasing automation, more template variety, Virtue advanced autonomy, expanded analytics, sophisticated design tools, deep re-architecture. Fund this work with evidence from first-customer demand and real measured unit economics, not assumptions.

### Official sources / vendor reference checks (review during implementation)

- Vercel Registrar API: https://vercel.com/docs/domains/registrar-api
- Vercel no-auth domain search (2026-09-28): https://vercel.com/changelog/search-domains-without-authentication
- Vercel commercial plan restriction: https://vercel.com/docs/limits/fair-use-guidelines
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Cloudflare Turnstile server-side verification: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Resend idempotency: https://www.resend.com/changelog/idempotency-keys
- Calendly embeds/API: https://calendly.com/help/calendly-embed-and-the-api
- Calendly webhooks/plans: https://calendly.com/help/webhooks-overview
- Google technical indexing requirements: https://developers.google.com/search/docs/essentials/technical
- NY LLC formation: https://dos.ny.gov/forming-limited-liability-company-new-york
- NY LLC Articles: https://dos.ny.gov/articles-organization-domestic-limited-liability-company
- Anthropic current model details: https://platform.claude.com/docs/en/models/overview

**Document maintenance:** Reevaluate all external fees, product tiers, API permissions and model labels on the day of implementation. This document establishes intended behavior, **not evidence of completed development or legal advice**.


### 11 October 2026 — Task 02 execution update

Shared contact/Lead Hub/booking V1 implementation deployed to Vigil and Scar; hosted CI passed 2136 tests. Task status remains **IN PROGRESS — activation pending**, because real Turnstile configuration and Scar's reviewed production origin/launch registration remain outstanding. No real customer email or appointment was generated by validation. See [Task 02 verification and release](../launch/contact-booking/VERIFICATION.md), [plan](../launch/contact-booking/PLAN.md), and [operations](../launch/contact-booking/OPERATIONS.md). Continue this same task when activation inputs are available; do not add a standalone security workstream or bypass launch approval.


### 12 October 2026 — Task 02 contact automation extension

Founder-approved Turnstile provisioning automation is deployed live at Vigil source 2702670; hosted CI #191 passed 91 files / 2160 tests and all release checks. Additive production migration 0034 applied. Existing launch/domain/archive hooks and minute cron now configure/reuse one managed widget per website, store its secret in Supabase Vault, and activate only the current verified registry. Staff pause/retry and per-site server credentials are verified. Scar's existing browser binding requires no new key build. Its automatic mode is saved in production, while website=building / setup=waiting_launch / contact=disabled / widgets=0. One-time Cloudflare account connection, existing website launch approval and authorized inquiry/inbox acceptance remain pending. No real mail, booking or widget was created during testing. See [automation operations](../launch/contact-automation/OPERATIONS.md) and [release verification](../launch/contact-automation/VERIFICATION.md). Continue Task02 activation when inputs arrive; no new workstream is approved.


### 12 October 2026 — Task 02 account connection verified

Founder installed the account connection and authorized activation. Production redeployment loaded settings; staff-only read-only widget API verification succeeded against real Cloudflare. Final source cc15fb5 is deployed Ready/Current; hosted CI #192 passed 92 files / 2164 tests and release checks. No schema/dependency change in this follow-up. Task02 remains activation pending because Scar's Professional full-site review round2 has no current submission or customer approval, and its application registry has only a preview deployment. This is now a website review/launch gate, not a missing token. Next recommendation: publish/obtain round2 full-site review approval, then use existing Deploy live flow; contact provisioning follows the live transition automatically. No launch gate, real test recipient or customer approval was bypassed. See [account activation handoff](../launch/contact-automation/ACTIVATION.md).


### 12 October 2026 — Scar Blog/Contact review candidate and reusable Blog service

Founder redirected work to finish Scar before round2 and requested self-service Blog publishing, reusable only for Professional/Growth Site customers explicitly requesting Blog in onboarding. Implementation is complete: Vigil source 4abd393 is live, migration0035 applied, hosted CI #193 passed 93 files / 2180 tests. Both packages already had a Blog page checkbox; added a specific Blog publishing feature checkbox and excluded generic CMS-only scope. Scar already opted in. Tenant-safe drafts/editor/public API and native Blog empty state, Contact, Privacy, 404 plus marked sample testimonials are verified. Scar source 3991c9f is a Ready feature-branch Preview; main remains45d4358. Website remainsbuilding, with no live_url/posts/leads/widgets/domains. Task02 contact activation still pending the real full-site review and live transition. No real email, post, booking, purchase or customer approval was generated. Her actual domain dashboard has existing-domain connection only; search/price/purchase is a follow-up gap, not verified purchasing functionality. Next: review/submit the concrete round2 candidate and obtain approval, then merge/deploy/activate through the existing gate. Complete real-phone/Safari and authorized inbox acceptance before declaring launch verified. See [review verification](../launch/scar-blog-contact/VERIFICATION.md) and [shared Blog operations](../launch/scar-blog-contact/OPERATIONS.md).


### 12 October 2026 — Blog image uploads and sample review layouts

Founder requested image uploads and a few sample posts in Scar’s actual UI. Completed reusable private cover/inline upload, alt/caption editing, sanitized WebP output, tenant/website validation, existing quota integration and protected file-library deletion. Vigil6f14ff2 is Ready in Production; hosted CI #195 passed96 files /2204 tests. Additive migrations0036/0037 applied. Scar review45cab3e is Ready on the feature branch; production/main45d4358 remains unchanged. Three visibly marked review-only articles use existing gallery photos and placeholder writing; Production builds omit their data. Real authenticated upload, draft save, inline insertion and private rendering were verified; one clearly marked private sample draft/image is retained, with0 published posts. Website remains building and contact launch/acceptance pending. No real inquiry, email, domain purchase or approval was generated. Next remains full-site round2 review/approval. See [image verification](../launch/scar-blog-images/VERIFICATION.md) and [operations](../launch/scar-blog-images/OPERATIONS.md).


## 2026-10-12 — Scar visual Blog authoring and homepage follow-up completed

Shared Vigil production `3a07f1b` is Ready; normal hosted CI #198 passes (97 files / 2,213 tests). Scar review branch `be111cd` is Ready; main/production remains `45d4358`. Static preview examples were imported as three selected editable sample drafts with five uploaded photos, gated from production. The dashboard has Table/Post feed, a distinct Blog icon and requested section order; Design review hides after launch. Authoring uses visual text/headings/photos with no exposed syntax. A saved heading edit was verified on the hosted review article. Home has journal features below Services, protected native-page navigation from Camera Roll onward, Work/Fotos/Blog/Love rail order, and shared fixed dotted testimonials background. Desktop/390px checks passed; no real Safari claim. Migration 0038 applied and actual types regenerated. Website remains building, live_url null, published articles zero. No inquiry, domain purchase or launch approval generated. See `docs/launch/scar-blog-dashboard/REPORT.md` and verified evidence/checksums. Next: customer review and remaining contact/domain launch flow after approval; preserve unrelated original checkouts.


## 2026-10-12 — Scar normal Blog articles and SEO audit completed

Shared Vigil bdd2e00 is live, migration0039 applied, hosted main CI201 green. Scar699ebeb is Ready feature-branch Preview; main/production45d4358 unchanged. Three normal Published articles retain the customer’s saved media/heading and are editable/removable with reversible Trash/Restore; Blog sample labels/banner gone. Animated featured Blog scrolls horizontally on mobile, journal index uses two phone columns. Contact-only intent confirmed and reflected in UI/privacy. Request-rendered native/article HTML, canonical/schema/social/sitemap/error handling and image/font delivery audited:76routes/317resources,0issues/broken assets,11tests in both final build modes,0known npm vulnerabilities. PageSpeed Mobile93/100/100/69, desktop74/100/100/69; SEO69 is intentional Preview noindex, other9checks pass. Desktop animation/TBT and synthetic mobileLCP2.9s remain disclosed; no field CWV or Safari claim. Site building/live_urlnull, round2pending/no submission,0domains, contact waiting_launch/disabled. Before live: actual round2 approval, final origin, real/hide testimonial decision, Production rebuild then contact/inbox acceptance. No customer notifications/inquiries/purchases/approval bypass. Handoff and checked evidence:docs/launch/scar-blog-seo/REPORT.md and SHA256SUMS. Next recommendation is second review, then the reusable Vercel domain dashboard pilot after authorization.


## 2026-10-13 — Scar desktop performance minimum achieved

Founder-requested desktop minimum93 achieved on Ready Preview sourcea0f9f2f: fresh stable-alias PageSpeed94 and independent immutable-deployment98, accessibility100/best-practices100. Baseline74; reduced actual animation/layout startup, independent pin geometry, deterministic homepage hydration, CSS first-paint viewport/entrance poses. Same-alias cached repeat excluded from fresh-run count; earlier99→66 and97→87 receipts retained. Final mobile93 on review alias,92 on immutable confirmation; Preview SEO69 solely intentional noindex, other9checks pass. Both build modes/typechecking and14tests pass; hosted76routes/317resources0issues/broken assets. Browser paging/deep-links/Services bag/mobile Blog/no hydration warnings verified. Main/production45d4358 and shared Vigilbdd2e00 unchanged; no CMS write/inquiry/email/domain order/approval bypass. Real round2 review, final origin/testimonials decision, approved launch/contact acceptance and real-device/Safari remain outstanding. Evidence/checksums/handoff:docs/launch/scar-desktop-performance/REPORT.md. This supersedes the prior desktop74 finding only; next recommended task is second full-site review and approval, then the authorized reusable Vercel domain dashboard pilot.


## 2026-10-13 — Staged hero bubble and typed copy restored

Founder requested preservation of collage→bubble→typed copy. Restored with CSS letter reveals and stable full accessible server markup, finishing around2.1s without per-letter JavaScript. Ready Preview1395080; fresh desktop93 on stable alias and98 on immutable same deployment, mobile93 in both; accessibility100/best practices100. Both build modes and14tests pass; hosted initial/revealed/early-leave/return-home verified without hydration warnings. Main/production45d4358/shared Vigilbdd2e00 unchanged. No live launch or new workstream authorized. Handoff:docs/launch/scar-hero-reveal/REPORT.md and checked SHA256SUMS; previous performance report remains historical. Next remains actual second review and approval before production.


## 2026-10-13 — Hero initial flash fixed and head bob restored

Founder reported apparent double collage entrance and choppy text, and requested the lost head bob. Fixed server-first-paint→hydration reset with a pending pose before body paint, ready artwork/fonts and4.5s fail-open expiry. Replaced110 visibility animations with four transform text covers; restored desktop transform head bob, paused offscreen/reduced motion respected. Ready Preview2a73e23; fresh desktop96/94 above minimum93, mobile93/92; no guaranteed98 claim. Both build modes and15tests pass; hosted76routes/317resources0issues/broken assets; early-scroll/return/head-motion/no hydration warnings verified. Main/production45d4358/shared Vigilbdd2e00 unchanged. No inquiry/CMS write/customer approval/live launch/domain order. Handoff:docs/launch/scar-hero-smooth/REPORT.md and checked SHA256SUMS. Next remains actual second review and approval before production.

## 2026-10-14 — Reusable Content Hub implemented and shared feature live

The latest founder policy supersedes the implementation prompt's Basic entitlement: self-service Content Hub is included with Care and higher on Professional/custom websites. Basic and every Express site stay locked, with Content Hub visible on every customer dashboard and an upgrade wall. Actual configured bindings determine modules. Vigil's existing staff-only Lab can still deliver a paid eligible Basic website; this does not unlock customer self-service or Express collections.

Shared implementation source 6ce58a7 and staff-Lab compatibility follow-up e78eb12 are Ready in Production at https://www.vigilstudios.co. Migrations 40–43 are applied after disposable SQL/RLS validation; linked generated types match. Shared CI is green, including 2,235 unit tests, typecheck, lint, production build and PostgreSQL 17 checks. Browser evidence covers two tenants, Basic/Express walls, member read-only access, foreign-site 404, draft/save/reload/conflict, actual video/poster upload/private 404/public range 206/playback, Trash/Restore/unpublish, 390 px layout and atomic Lab/Hub stale-save rejection. All isolated test organizations, websites, subscriptions, media objects and auth users were removed.

Scar's final adapter source 3954ad5 is Ready Preview on the existing codex/scar-blog-contact review alias. Both build modes and 21 renderer tests pass; hosted 76 routes / 317 resources have zero issues. Fresh final review PageSpeed measures 96 desktop / 95 mobile, with accessibility and best practices 100. The earlier immutable 89/91 capture is retained as measured variability. Approved hero/head-bob/choreography remains intact. No new cinematic chapters are appended; publication edits reach existing curated slots, while complete collections/detail routes remain independent. Original three Published articles, customer café heading/camera cover, 10 Portfolio records, 56 Gallery records and six marked testimonial placeholders remain intact.

The dashboard preview URL is updated through an audited verified-source operation. Scar's website remains Building, live_url null, round two Pending, production/main 45d4358, zero domains and contact automation waiting_launch/disabled. No customer notification, inquiry, appointment, payment product/price or launch approval was generated. Next: receive the actual additional videos/approved URLs and intended placement, decide real testimonials versus hiding placeholders, and obtain actual second full-site approval before the existing production/contact acceptance workflow. No unrelated domain work started.

Evidence, changed files, backfill/export/rollback notes and integrity hashes: docs/launch/content-hub/REPORT.md and OPERATIONS.md. This continuation supersedes older Content Hub billing and implementation status only. Original dirty application checkouts were preserved.
