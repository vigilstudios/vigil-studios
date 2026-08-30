# Express Sites — the storefront on this site

**Written 27 Aug 2026.** The selling side of the Express tier. The templates
themselves are built in the sibling `vigil-leadgen` repo; this repo is the shop
window and the checkout entry point.

Read `../vigil-leadgen/HANDOFF.md` for the other half, and note `AGENTS.md` here:
this Next version has breaking changes, so `node_modules/next/dist/docs/` is the
reference rather than training data.

---

## What exists

**The Starter tier is gone.** `PRICING_TIERS[0]` in `lib/constants.ts` is now
"Express Sites" at `EXPRESS_PRICE` ($599). Its CTA points at `/express` rather
than `#contact`, because this tier is self-serve — Professional and Growth still
start with a conversation. `PricingSection` reads `tier.href` and falls back to
`#contact`, so only Express diverges.

**`/express` is the catalogue** — `app/express/page.tsx` and
`components/express/ExpressCatalogue.tsx`. Six cards, one per industry, each with:

- a real screenshot of the template, bleeding to the card's top and side edges,
  which scrolls on hover to reveal the rest
- **View** and **Buy &middot; $599** side by side, an equal half of the card each

**The navbar's Projects link was replaced by Express Sites.** The portfolio
section still says "launching soon", so that slot pointed at an empty promise;
the catalogue is finished work somebody can click into.

`/express` is in `app/sitemap.ts` and prerenders static.

---

## Things that will bite you

## The catalogue direction (28 Aug 2026)

`Template-Catalogue.md` in this repo is the owner's spec for where the catalogue
goes: 24 sub-trades across six systems, organised by trade rather than by style,
under a "we already built it, you just say yes" pitch. **Its "Engineering
reconciliation" section is the part to read before building** — several of the
components it assigns need a server the templates do not have.

The variant axis described below was removed on 28 Aug 2026. It is kept here
only because the storefront still carries the machinery for a single design per
template, which is what the cards render now.

## Where the variants were

Each industry comes in two or three **layouts**, and the card cycles them in
place — comparing three layouts by opening three tabs and remembering the first
is not comparing them.

**The switcher is the coloured rule above the title.** It was already sitting
there doing nothing, and a segmented rule reads as "there are three of these"
without a label. One segment per layout, the active one at full opacity. Arrows
on the preview do the same job. Selecting updates the preview image, the
`Design · <name>` line, the description *and* the **View** button together, so
View always opens whatever is on screen and nothing on the card disagrees with
anything else.

Every layout also has its own page at `/express-templates/{slug}-{variant}.html`
— 17 in all.

**Both states of a segment are the template's own accent**, differing only in
opacity. The inactive ones were `var(--border)` first: 8% white on a 4% white
card, which measured as present and read as nothing, so the control was
invisible. The accent itself is generated into the JSON too — the hard-coded
hex per card in `constants.ts` had drifted from every template it labelled, and
the salon card was still showing the old plum.

**The preview scrolls on its own and stops when taken hold of.** It is the
inverse of the original, which moved only on hover and therefore never moved at
all on a phone. Paused from React on `onPointerEnter`/`onPointerDown`, which
covers a finger as well as a cursor; the keyframes are `previewScroll` in
`globals.css`, dwelling at each end rather than snapping back.

**Every layout has its own capture**, so `previews/` holds 23 images (six
defaults plus seventeen variants), all a uniform 900x1500. The hover-scroll
travel is still one number for every one of them.

Two touch details that are easy to lose: the arrows are hover-revealed on a
pointer device but **always visible where there is no hover**, or the control
would simply not exist on a phone; and both arrows and chips grow to 44px there,
which is the touch-target rule this codebase already holds itself to elsewhere.
The arrows sit outside the preview's `<a>` on purpose — a button inside a link
is invalid, and clicking one would follow the link.

`lib/express-variants.json` drives that list and is **generated**, never edited
by hand — `vigil-leadgen/scripts/previews.sh` writes it in the same pass that
renders the pages it points at. A hand-kept copy of the variant names in this
repo would be a second source of truth in a second repo, and the failure mode is
a card linking to a layout that no longer exists.

A variant changes hero shape, what the hero's support block says, how the
services band is built, page density and typography. It does **not** change
colour: colour comes from the client's brand, and the showcase banner says so.

**Rebuild everything with one command.** `vigil-leadgen/scripts/previews.sh`
renders the showcases, copies them here, and recaptures the preview images, in
that order. Doing those three by hand has gone wrong every single time it was
attempted, always the same way: the images get built from yesterday's HTML and
look completely correct, because a stale page is still a valid page.

**The template HTML was re-synced on 28 Aug 2026** after the reviews marquee loop was
fixed in `vigil-leadgen`. The six files here are byte-identical to
`vigil-leadgen/demos/express/showcase-*.html` as of that date. The preview JPEGs were
*not* regenerated: the fix is only visible in motion, at the loop seam, so a static
capture is unchanged.

**The previews and the template HTML are both copies.** `public/express-templates/`
holds snapshots of `vigil-leadgen/demos/express/`, and
`public/express-templates/previews/` holds screenshots of those. **Change a
template and both go stale silently** — nothing detects it. The real fix is
publishing to R2 (step 6 in the leadgen build order) and pointing the catalogue at
those URLs instead of at local copies.

**The card's two buttons are short because they are horizontal.** At the
three-column breakpoint a card is 304px wide, leaving 246px for the pair, and
`btn-primary`/`btn-secondary` spend 96px of that on their own `px-6` before any
text is drawn — hence the `!px-3` override and the one-word labels. `min-w-0` is
load-bearing: without it the intrinsic text width is a floor and the row
overflows the card. Measured at 375, 768, 1024 and 1440: equal halves, one line.

**The preview bleeds to the card's edges, and not with negative margins.** The
card is `!p-0` and the content below the image carries the padding instead. This
matters because `.glass` has a *global* padding in `globals.css` that drops to
16px under 430px and 12px under 375px, so any negative margin hardcoded on the
image is wrong at two breakpoints — which it was, by 11px, until it was measured
in a browser.

**The previews are a uniform 900x1500 on purpose.** They are shown in a 4:3
window, so the hover travel is `(1500 - 675) / 1500 = 55%` — one number for all
six. Regenerate them at the same dimensions or that number stops being right:

```
chrome --headless --screenshot=out.png --window-size=1200,2000 file://<template>
sips --resampleWidth 900 -s format jpeg -s formatOptions 68 out.png --out <slug>.jpg
```

**`client_reference_id` is the only thing linking a payment to a template.**
`checkoutUrl()` appends it to `EXPRESS_CHECKOUT_URL`, choosing `?` or `&` — today's
link carries no query string, but one copied from Stripe with a prefilled price or
locale does, and a second `?` would silently drop the reference. A dropped
reference means a paid order nobody can route.

**`EXPRESS_CHECKOUT_URL` is empty right now, deliberately (28 Aug 2026).** The
link is live in Stripe and works — but nothing catches the payment, so taking one
means a buyer pays and hears nothing until somebody spots it in the Stripe
dashboard by hand. The decision is to sell nothing we cannot yet deliver: the
link goes back only once the `checkout.session.completed` webhook writes to
`orders` and the intake form is reachable. The URL is preserved in a comment
beside the constant in `lib/constants.ts`.

Emptying the constant is safe by design — the buttons fall back to "Enquire about
this template" rather than pointing nowhere, so the catalogue still sells the
tier, it just routes through the contact form. Verified in a browser: all six
cards render the fallback and the page contains no `buy.stripe.com` URL.

**One feature claim was changed deliberately.** The old Starter card promised a
"Contact form". The Express templates have none — a static page on R2 cannot
process one — so the card reads "Tap-to-call and email contact". Either build a
form endpoint on the Cloudflare Worker that already serves the demos, or leave the
wording as it is. Do not put the claim back without building the thing.

---

## What is missing

**Nothing catches the payment.** The buy path is live end to end *up to Stripe*:
someone can browse, preview and pay. After that there is no webhook, no order
record and no intake form — a purchase today takes the money and leaves you to
spot it in the Stripe dashboard and email the client by hand.

That work lives in `vigil-leadgen` (the `orders` and `intake` tables already
exist). See "Where to start next session" in `../vigil-leadgen/HANDOFF.md`.
