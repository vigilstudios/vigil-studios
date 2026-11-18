# Homepage story redesign

November 16, 2026

Implemented in the existing clean `codex/client-ready-site` checkout at `6baf9be`. Before editing, the marketing routes, sections, and site components matched the latest fetched `origin/main` production-source revision `b02f71f`. No remote branch named `dev` was present. The old Desktop checkout was not used for the redesign.

## Design

The existing Build → Launch → Respond → Book → Improve slider now follows one business from first impression through ongoing care. Shorter headlines and descriptions sit beside layered, custom HTML/SVG illustrations: a studio website, a domain launch, an inquiry, a calendar confirmation, and an activity overview. Fictional content is labeled as an illustrative view; the chart makes no numerical performance claim.

The hero implementation and existing scrolling, snap stops, hash navigation, and pricing section are preserved. The story gets a clean background, a numbered navigation rail, a pricing shortcut, and chapter-entry animations. Light-mode text uses a deeper green. Reduced-motion preferences disable the new animations. Inactive chapters remain inert and hidden from assistive technology.

Illustrations use CSS and inline SVG with no external image requests, added packages, timers, or animation render loops. The existing process-page illustrations are untouched.

## Verification

- TypeScript (`npm run typecheck`), scoped ESLint, and `git diff --check` passed.
- All five chapter links verified at 320×568, 375×667, 390×844, 768×1024, 844×390, and 1440×900. Compact layouts were refined after measuring artwork/control collisions. No horizontal page overflow observed.
- Light and dark visual checks; final screenshots saved alongside this report.
- Keyboard Enter activates chapter links. Mouse wheel advances and reverses one chapter per gesture.
- Native touch swipe advanced from Build to Launch in a mobile browser context. A shorter swipe settled back to its original native snap stop.
- Pricing shortcut moves focus to the pricing section; browser Back restores the prior story position.
- Reduced motion produced no active artwork animations. Only the active chapter was accessible.
- Browser console: no errors. Existing Three.js deprecation warning remains.

Local implementation only. No commit, push, or deployment performed.


## November 17 follow-up — Business platform story

- Added Products as chapter 5, before the revised chapter 6 finale, “Your business. Understood.” The copy explicitly describes Vigil as a business platform and the website as its foundation.
- Added an illustrative native product catalog with custom CSS product artwork. Product setup is qualified by website availability; no checkout, inventory integration, or sales results are claimed.
- Replaced the improvised V marks in Lead Hub, Bookings, Products, and Overview with the supplied V-star. Existing public black/white SVG files match the provided source files byte for byte. Light cards use black; dark cards use white.
- Applied a full light/dark card palette covering surfaces, borders, type, status chips, calendar details, and supplementary cards.
- Added bounded pointer parallax (at most 5px / 4px translation and 2° / 2.5° tilt), subtle hover lift, and floating-card rotation. CSS-variable updates avoid React renders; no continuous animation loop is introduced. Touch and reduced-motion users receive static hover states.
- Expanded the rail and scroll stops to six chapters. Kept the shared Process page compatible with the new stage and full two-part headings.

Follow-up checks passed: TypeScript, scoped ESLint, diff whitespace, six-stage navigation, Products-to-finale wheel navigation, pricing handoff and Back restoration, mobile widths down to 320px, landscape, dark/light card appearance and logo selection, pointer movement/reset, and zero artwork animations under reduced motion. Shared /process returned HTTP 200 with the Products stage and full finale heading. Browser console had no errors. Follow-up screenshots: products-light.png, products-dark.png, finale-dark.png, finale-mobile.png.
