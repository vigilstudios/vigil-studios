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

## 2026-09-15 — Home page, second pass (branch `claude/site-redesign`, not merged)

Owner's review of the first pass, desktop first; mobile and the other pages
are next.

- **Velaris fix** — page switches and the theme toggle left the hero blank:
  `velaris.tsx` lost the WebGL context in its effect cleanup and re-ran on
  the same canvas, and a canvas only ever has one context. The context now
  lives in a ref for the canvas's life, palette changes update uniforms in
  place, the deliberate `loseContext()` is deferred a tick so a remount can
  cancel it, and a context the browser takes away is restored. Shader
  untouched. (`getExtension("WEBGL_lose_context")` returns null on a lost
  context, so there is no way to restore after the fact; hence the deferral.)
- **Section rhythm** — `Section fill` (home only): each section is a full
  viewport with content centred, `py-24`, so the desktop snap in
  `globals.css` lands on one room at a time. Content trimmed so every
  section fits 1440×900. Footer is a `snap-end` target again.
- **Reveals** — `components/site/Reveal.tsx` (`Reveal`, `RevealGroup`,
  `RevealItem`): fade-and-rise once in view, staggered grids and lists.
- **How it works** — step one is choosing the kind of website (Express /
  Professional / Custom; only Express checks out self-serve, the others
  start with a call and a staff checkout link). Connector centred under the
  numbers and stops at step five. Eyebrow lost its dot so labels sit flush
  with headings.
- **Start where you are** (`sections/StartSection.tsx`) replaces the Vigil
  Express industries block: the three builds from `build_prices` as three
  starting points, Express listing its industries; the hero and nav CTAs
  point here (`#start`) instead of the catalogue. Behind it the owner's 3D
  marquee (`components/ui/3d-marquee.tsx`, next/image, still under reduced
  motion) shows 25 section screenshots of the four available templates
  (`public/express-templates/sections/*.webp`, index
  `lib/express-section-shots.json`), shuffled per visit, client-only
  (`StartMarquee` → `StartMarqueeBackdrop`). Regenerate with
  `node scripts/capture-express-sections.mjs` against a running dev server
  (local Chrome over the DevTools protocol; no dependencies).
- **Pricing** — centred title, then Websites / Subscriptions tabs
  (`PricingTabs`, sliding pill, cross-fading panels). `BuildCards` and a
  rewritten `PricingTable` (one centred row, Most chosen inside the Care
  card, hover lift, staggered entry); prices roll digit by digit on the
  period toggle (`FlipNumber`). The pricing page uses the same table with
  the full bullet list.
- **Get started** absorbs Contact: Virtue, "Ready when you are", three ways
  in (Find your starting point · Book a call · Email us), copy for every
  kind of customer. `ContactSection` deleted; Contact links → `/#get-started`.
- Restarted the dev server: the old one was serving a `globals.css` compiled
  before the `--accent-2/3/4` tokens existed, so teal/violet/amber rendered
  transparent.
- Verified at 1440×900 in the in-app browser, both themes, snap on;
  typecheck, tests (91), `next build` clean. `Navigation.tsx` has a
  pre-existing lint error (setState in effect) left alone.

## 2026-09-15 — Owner's fixes, then live

Approved with minor fixes, then fast-forwarded to `main` (vigilstudios.co).

- Hero copy is *You run the business. Vigil runs the online presence.*
  (`TAGLINE`, site title too); each sentence stays on one line from `lg`,
  and the headline, lead and buttons arrive in that order.
- One card system (`components/site/Cards.tsx`: `CardRow`, `Card`) for
  Pillars, Start, builds and plans: cards float in one after another as the
  row scrolls into view and lift on hover; below `md` every row scrolls
  sideways with snap points instead of stacking.
- Pricing tabs bug: after a period change, switching back to Websites left
  the old panel invisible and never mounted the new one. Cause: the period
  toggle's `layoutId` pill inside the exiting `AnimatePresence` panel.
  `SegmentedControl` now slides one pill by index (no `layoutId`) and is
  used for both the tabs and the period toggle. `FlipNumber` also lost its
  nested `AnimatePresence`.
- Plan card buttons sit at the bottom of every card.

## Handoff for the next session (15 Sep 2026)

- Branch **`claude/site-redesign`**, merged to `main` on 15 Sep 2026 (the
  home page is live); keep iterating on the branch and fast-forward again.
  Preview: `https://vigil-studios-git-claude-site-redesign-belierjaviers-projects.vercel.app`
  (Vercel SSO-protected; the owner signs in). Locally: `npm run dev` on the
  branch, `http://127.0.0.1:3000`.
- Files: hero `sections/HeroSection.tsx` (Velaris: `components/ui/velaris.tsx`
  + `components/site/VelarisBackground.tsx`, palettes at the top of the
  latter); sections in `sections/*` (Pillars, HowItWorks, Start, WhyVigil,
  Pricing, FAQ, GetStarted); pages `app/(site)/{pricing,products,virtue}`;
  shared bits `components/site/{primitives,Reveal,PricingTabs,PricingTable,
  BuildCards,FlipNumber,StartMarquee}.tsx`, marquee
  `components/ui/3d-marquee.tsx`; copy `lib/site-copy.ts`; prices
  `lib/vigil/queries/public-pricing.ts` (never hard-code); tokens
  `--accent-2/3/4` in `app/globals.css`.
- Next, in the owner's order: mobile pass on the home page (375px; `fill`
  sections are natural height below `md`, snap is off), then `/pricing`,
  `/products`, `/virtue`.
- Do not touch: `app/(vigil)`, `lib/vigil` (except queries above),
  `components/express/*`, `EXPRESS_TEMPLATES`.
- Approval flow: iterate on the branch → owner approves → fast-forward
  `main` (`git checkout main && git merge --ff-only claude/site-redesign &&
  git push`) → Vercel deploys vigilstudios.co.
- Chrome MCP tab renders but throttles animation when the window is hidden;
  use the in-app Browser pane (must be visible) for orb/Velaris checks.
