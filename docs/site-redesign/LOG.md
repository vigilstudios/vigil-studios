# Site redesign — log

## 2026-09-15 — First pass (branch `claude/site-redesign`, not merged)

Built by Claude after Astra's Figma pass did not land. Everything is on the
branch so the live site is untouched until the owner approves.

- **Hero** — the owner's Velaris shader (`components/ui/velaris.tsx`, kept
  faithful; only pause-offscreen, reduced-motion and a DPR cap added) behind
  the one line: *You run the business. Vigil runs the digital side of it.*
  `components/site/VelarisBackground.tsx` colours it green-led for both
  themes. Virtue chip links to `/virtue`.
- **Home sections** (all new; old Services / Process / Portfolio /
  Testimonials / CTA band deleted, snap-scrolling and the dot nav removed):
  Pillars (Websites · Vigil · Virtue, each with its own accent), How it works
  (the real five beats), Industries (from `EXPRESS_TEMPLATES`, coming ones
  marked), Why not a builder (responsibility comparison), Pricing teaser,
  FAQ, Get started (Velaris again, Virtue, two ways in), Contact (kept,
  rewritten), new Footer.
- **Pages**: `/pricing` (builds once + plans with the period toggle, live
  numbers), `/products` (Websites, the platform in outcome words, four
  service levels, Virtue teaser), `/virtue` (she introduces herself with
  `VirtueSpeech`; what she does today vs. what is coming, labelled).
- **Nav**: Products · Vigil Express · Virtue · Pricing · Contact · Sign in ·
  Get started (→ `/express`).
- **Data**: `lib/vigil/queries/public-pricing.ts` reads `plans`,
  `plan_prices`, `build_prices`, `plan_features` with the anon key, cached
  five minutes, so the site can never disagree with the checkout. Plans were
  marked `is_public` in the database. Copy lives in `lib/site-copy.ts`.
  Secondary accents `--accent-2/3/4` (violet, amber, teal) added to the
  tokens; green leads.
- Removed: legacy marketing constants (services, projects, process,
  testimonials, old tiers, FAQ, differentiators), the three.js wireframe
  hero, `ProgressNav`. Site title/description/keywords updated.
- Verified locally: home, pricing, products, virtue at desktop; home and
  pricing at 375px; typecheck, lint (new files), tests, `next build` clean.

## Handoff for the next session (15 Sep 2026)

- Branch **`claude/site-redesign`** (pushed; `main` still serves the old site).
  Preview: `https://vigil-studios-git-claude-site-redesign-belierjaviers-projects.vercel.app`
  (Vercel SSO-protected; the owner signs in). Locally: `npm run dev` on the
  branch, `http://127.0.0.1:3000`.
- Files: hero `sections/HeroSection.tsx` (Velaris: `components/ui/velaris.tsx`
  + `components/site/VelarisBackground.tsx`, palettes at the top of the
  latter); sections in `sections/*` (Pillars, HowItWorks, Industries,
  WhyVigil, Pricing, FAQ, GetStarted, Contact); pages `app/(site)/{pricing,
  products,virtue}`; shared bits `components/site/primitives.tsx`,
  `components/site/PricingTable.tsx`; copy `lib/site-copy.ts`; prices
  `lib/vigil/queries/public-pricing.ts` (never hard-code); tokens
  `--accent-2/3/4` in `app/globals.css`.
- Do not touch: `app/(vigil)`, `lib/vigil` (except queries above),
  `components/express/*`, `EXPRESS_TEMPLATES`.
- Approval flow: iterate on the branch → owner approves → fast-forward
  `main` (`git checkout main && git merge --ff-only claude/site-redesign &&
  git push`) → Vercel deploys vigilstudios.co.
- Chrome MCP tab renders but throttles animation when the window is hidden;
  use the in-app Browser pane (must be visible) for orb/Velaris checks.
