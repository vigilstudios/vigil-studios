# Handoff prompt for Astra (Codex) — vigilstudios.co redesign

Paste the block below into Codex.

---

You are Astra, working in `Websites/vigil-studios` (Next.js 16, Tailwind 4,
Supabase). Read, in order: `docs/site-redesign/BRIEF.md`,
`../vigil-leadgen/VIGIL_STUDIOS_MASTER_ARCHITECTURE.md` (§1, §3, §4, §10,
§11), `docs/dashboard-v1/IMPLEMENTATION_LOG.md` (the last six entries), and
`CLAUDE.md`.

Task: redesign the public marketing site (`app/(site)`, `sections/`,
`components/layout/*`, `lib/constants.ts` marketing constants) so it tells
the Vigil story — Websites → Vigil platform → Virtue — to small-business
owners, with the information architecture, pages and design direction in
the brief. The current sections are generic agency copy; replace them, and
delete the Projects/portfolio and testimonials sections outright.

Non-negotiables:
1. **Figma first.** Produce the full design in Figma (desktop + 375px per
   page, light and dark for Home and Pricing, real copy, real prices) and
   stop for my approval before writing any code. Iterate in Figma until I
   approve each page.
2. **Virtue is green and is always the shader orb** —
   `components/vigil/VirtueOrb` on top of `components/ui/orb.tsx`. Reuse it;
   never a static icon or another colour. Virtue's page describes what she
   does today (onboarding, for every customer) and what is coming for
   Growth/Priority, labelled honestly as coming.
3. **Prices come from the database** (`plan_prices`, `build_prices`, via
   `getCheckoutCatalog()` or `lib/vigil/billing-periods.ts`), never
   constants. The two-part model (build + Vigil plan) is stated plainly.
4. **Do not touch** `app/(vigil)`, `lib/vigil`, `supabase/`, `proxy.ts`,
   `components/vigil` (read/reuse only), the Express template HTML, or the
   leadgen repo. **Do not modify the Vigil Express catalogue** (`/express`,
   `components/express/*`, `EXPRESS_TEMPLATES`) — it is approved and
   finished; only the shared nav/footer around it changes. Scope is the home
   page and sections, the new pages (Products ×3, Solutions, Pricing, About),
   navigation and footer.
5. **No invented social proof**: no fake customers, testimonials, logos or
   metrics. No stock photography of people. Real product screenshots only.
6. **Voice:** calm, plain, no exclamation marks, no "seamless / elevate /
   AI-powered". Mobile-first, both themes, accessible (icon + label + colour
   for status; reduced motion respected).
7. Work on a branch; verify in a real browser at 375px and desktop;
   `npm run typecheck`, `npm run lint`, `npm run build` clean; open a PR to
   `main` (which deploys vigilstudios.co) only after my preview review. Log
   what you did in `docs/site-redesign/LOG.md`.

Start by replying with (a) the Figma file link, (b) a one-paragraph read-back
of the story you will tell and to whom, and (c) any question whose answer
would change the design. Then design Home and Pricing first.
