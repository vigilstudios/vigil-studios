> October 7 update: the four supplied Media prompts now have independent implementations. See [Media replacement](../media-replacement/README.md) for current registry names, styling and release evidence. The October 6 validation figures below are historical.

# CTA, contact, footer and gallery import pass

Implemented in `vigil-studios`, the repository that owns the shared Professional Design Engine. The pasted Design Engine brief governs the adaptation: these are native, typed section systems using the existing renderer, creative layers, Page Foundation and Action system. Source brands, placeholder hrefs, global font overrides and third-party component architectures were replaced with client data and engine contracts.

**Express Creator readiness for CTA / Contact / Footer: PARTIAL.** Composition, actions, contact discovery, global footers, email drafts and persisted editing are ready. Hosted inquiry, booking-request and newsletter delivery need a real `FormSubmissionProvider` adapter and an integration-specific acknowledgement. The portable site runtime does not supply a submission backend. Unconnected forms say so and disable submission; no success is fabricated. This pass stops at reusable production systems and QA compositions.

## Source accounting

There are **16 supplied component prompt bodies**: 13 inline bodies and three component attachments. The separate instruction to reuse an Express contact section adds one adaptation input, making **17 evaluated inputs**. These produce **10 new production systems**: two CTA, one Contact, four Footer, three Gallery. Seven redundant registrations were avoided through duplicate removal or consolidation. Blank Gallery 1, Gallery 3 and Blog/Product headings provide no component specification and are not counted as prompt bodies.

| External reference | Category | Production ID / name | Disposition and retained idea |
| --- | --- | --- | --- |
| Prompt 1 · `footer-7.tsx` | Footer | `footer.sitemap` / Sitemap Footer | New production system: brand, statement, social discovery, sitemap columns, legal rail. |
| Prompt 2 · `ruixen-footer03.tsx` | Footer | `footer.sitemap` / Sitemap Footer | Duplicate registration avoided: same sitemap structure; brand-above arrangement and optional reveal retained. |
| Prompt 3 · `footer-16.tsx` | Footer | `footer.compact` / Compact Footer | New production system: centered brand, flat destinations, social/legal close. |
| Prompt 4 · `footer-section-4.tsx` | Footer | `footer.split` / Split Footer | New production system: contrasting brand and sitemap/newsletter cards. |
| Prompt 5 · `footer-section-3.tsx` | Footer | `footer.banner` / Banner Footer | New production system: large typographic banner above newsletter, social and sitemap lanes. |
| Prompt 6 · `call-to-action.tsx` | CTA | `cta.editorial` / Editorial Conversion | New production system: concise proposition and optional primary/secondary actions. |
| Prompt 7 · `cta-section-1.tsx` | CTA | `cta.signal` / Signal Conversion | New production system: bold conversion field with eyebrow, heading and value proposition. |
| Prompt 8 · repeated `cta-section-1.tsx` | CTA | `cta.signal` / Signal Conversion | Exact duplicate avoided; same fields, layouts and capabilities as Prompt 7. |
| Prompt 9 · Contact 1, repeated `cta-section-1.tsx` | CTA, despite source label | `cta.signal` / Signal Conversion | Exact duplicate avoided. A CTA was not misclassified as a contact form. |
| Express contact reuse instruction · Salon/Spa booking section | Contact | `contact.inquiry` / Inquiry & Contact | New production system: adapts the actual `public/express-templates/salon-spa.html` booking layout into configurable discovery, inquiry and booking-request modes. |
| Prompt 12 · `image-gallery.tsx` | Gallery | `work.expand-rail` / Expanding Image Rail | Consolidated with the portfolio rail: image-strip arrangement retained; global Poppins import removed. |
| Prompt 14 · `hover-expand-gallery.tsx` | Gallery | `work.expand-rail` / Expanding Image Rail | New production system: vertical title rails, selected image, touch/keyboard selection, mobile accordion. |
| `skiper49.tsx` · Skiper 49 / Carousel_003 | Gallery | `work.card-rail` / Editorial Card Rail | Consolidated with card carousel: centered perspective arrangement retained, with explicit step controls. No automatic looping or autoplay. Source credit: Skiper UI, Gurvinder Singh; source illustrative art credit: AarzooAly. Source illustrations are not shipped. |
| Inline `carousel-08.tsx` | Gallery | `work.card-rail` / Editorial Card Rail | New production system: editorial image cards, separate item destinations and step controls. |
| Attachment `carousel-08.tsx` | Gallery | `work.apple-cards` / Apple Card Carousel | October 7: independent tall photographic cards and Embla drag-free rail. |
| Attachment `image-expansion.tsx` | Gallery | `work.image-expansion` / Image Expansion Slider | October 7: independent tabbed overlay cards with full-screen inspection. |
| Attachment `liquid-glass-carousel.tsx` | Gallery | `work.liquid-glass` / Liquid Glass Carousel | October 7 correction restores the supplied WebGL shader, infinite ribbon and GSAP choreography; see media-replacement. |

Every source in a consolidated group receives the production capabilities detailed below. Existing production component designs extended: **0**. Shared Action, Site, rendering, contracts and editor infrastructure were extended. Thirteen thin compatibility exports retain the supplied filenames under `components/ui`; they accept native `SectionInstance` contracts rather than the source demo props.

## Project structure and common capabilities

The repository already has Next.js, React, strict TypeScript, Tailwind 4 through `@tailwindcss/postcss`, root `@/*` aliases, and `components/ui`. No framework bootstrap or dependency installation was needed. There is no `components.json` CLI initialization file; the existing application supports the requested folder/import structure. Reinitializing shadcn would risk altering its established styles. `components/ui` is retained as the recognizable import location for reference adapters; canonical production sections live in `design-engine/sections/endings`.

Application styles are in `app/globals.css`. Engine styles are scoped under `.de-root` / `.de-ending`, imported through `design-engine/styles.css`; ending-specific styles are in `design-engine/sections/endings/styles.css`. Source Tailwind recipes are expressed through the engine's semantic tokens, so they also work in the portable site renderer. No `react-icons`, Swiper, GSAP, new motion package, shadcn Button/Carousel/Card copy, or remote font import was added. Existing `DesignButton`, `BrandMark`, `Plate`/media contracts, `FadeReveal` and motion policy are reused.

All ten systems have strict serializable content/configuration schemas, declared capabilities, registry metadata, production rendering, two Design Lab presets, three client adaptations (architecture, creator, hospitality), and standard/long copy examples. Ordinary content and media fields are editable in Composition Lab. Unsupported configuration is rejected, rather than silently rendered as a generic section.

**Typography / art direction — every source:** editorial, luxury, neo-grotesk, geometric, poster, humanist, technical, brutalist, playful and fashion typography; gallery, publication, precision, billboard, salon and runway art directions. Display, heading, body, accent and mono roles follow existing profiles. Surface, gutters, rhythm, rules, corners and actions consume semantic art tokens. These are capability declarations; automated rendering covers every declared combination, while the browser matrix samples seven combinations with long copy at 320px.

**Page/Action integration — every source:** optional CTA and gallery item actions use the existing contextual Action editor. Directory, social, legal and authored sitemap records store typed `destination` Actions. Page and Section targets use stable IDs, including nested pages. External, email, phone and download actions are supported by the existing resolver. Slug/title changes and reparenting retain identity; duplicate-page operations remap self-directed content actions; deletion checks include these destinations. Broken targets are reported and disabled. Selection, inspection, pagination and form submission remain buttons with their own behavior.

**CTA customization:** enabled state, label, typed destination, supported variant/size/surface, icon and icon position are configurable. Regular action slots permit primary, secondary, outline, ghost, text, underline and inverse styles; small/medium/large sizes; left/center/right alignment; auto/full widths. Signal's primary slot also permits display size. Compact Footer and gallery item actions deliberately allow the restrained text/underline/ghost, small/medium, auto-width subset. No empty CTA placeholder appears when an optional action is off.

**Forms:** common form configuration has title, explanatory text, submission label, acknowledgement/error/unavailable copy, required flags and up to eight uniquely identified fields. Types are text, email, telephone, date, textarea, select and checkbox. Finite presets cover general inquiry, collaboration/sponsorship (organization, inquiry type, optional budget), booking request (phone, interest, preferred date/time), and newsletter. The editor can toggle forms, choose a field set, edit labels/options/required flags, and choose unavailable, email-draft or host submission. The nested email destination uses the Action editor. Host integration keys are data; credentials and arbitrary endpoints are not serialized.

`InquiryForm` uses associated labels, native required/email validation and autocomplete; pending submission prevents duplicate requests. A host must acknowledge success before success copy appears; failure retains entered data, and a 15-second timeout aborts the request. Email-draft mode opens encoded content in the visitor's mail app and states that they must send it there. A booking request does not reserve inventory or claim a confirmed appointment.

## Production dossiers

### Editorial Conversion — `cta.editorial`

**External reference:** CallToAction / Prompt 6. **Category:** CTA. **Disposition:** new production component.

**Structural idea:** measured proposition followed by two independent actions. **Customization:** title, introduction, optional eyebrow; spacing density, reading/wide measure, transparent/surface/brand treatment. **Layout options:** left, center, right. **Typography/art:** common profiles and directions above. **CTA capability:** optional primary and secondary, including either alone or neither; regular customization. **Page/Action:** shared stable-ID resolver/editor. **Contact/form:** none; can direct to email, phone, booking page or contact section. **Footer/site:** ordinary section, with no global footer role. **Motion:** none or optional existing fade reveal. **Responsive:** bounded copy measure; wrapping/stacking actions; long labels remain readable at 320px. **Accessibility:** labelled section, h2, native destination semantics and visible focus.

### Signal Conversion — `cta.signal`

**External references:** Prompts 7–9, CtaSection1 repeated three times. **Category:** CTA. **Disposition:** new production component; two exact duplicates avoided.

**Structural idea:** prominent conversion field with an optional image and protected opaque copy/action surface. **Customization:** common copy, density, measure, surface, optional intrinsic/focal-point image, section/viewport height. **Layout options:** poster, split, reversed split. **Typography/art:** common profiles, with poster/billboard default. **CTA capability:** optional primary/secondary; display primary size additionally supported. **Page/Action:** shared resolver/editor. **Contact/form:** no form; the Contact 1 paste was a CTA duplicate. **Footer/site:** ordinary section. **Motion:** none/fade. **Responsive:** full-scene treatment on wide canvases, stacked copy/media on narrow containers; long actions wrap. **Accessibility:** h2 and native links; copy does not rely on imagery for contrast.

### Inquiry & Contact — `contact.inquiry`

**External reference:** authorized reuse of Vigil Express Salon/Spa booking layout. **Category:** Contact. **Disposition:** new production component.

**Structural idea:** direct discovery, copy paired with an inquiry slip, or social-first contact directory. **Customization:** common copy/spacing/surface, independent contact and social records, location, hours, optional form and finite field presets. **Layout options:** information, split, social; split exposes the optional form. **Typography/art:** common profiles/directions. **CTA capability:** optional primary and secondary for booking, management, collaboration, media-kit/download or other destinations. **Page/Action:** shared resolver; contact/social records are typed independently. **Contact/form:** general, collaboration, sponsorship and booking-request fields; provider or email-draft boundary described above. **Footer/site:** section-and-page capable, usable on a Contact page without hardcoded routes. **Motion:** none/fade. **Responsive:** copy/form stack and narrow field grids become single-column. **Accessibility:** labelled contact navigation, h2, associated form labels, required/email validation, status/error announcements and visible focus.

### Sitemap Footer — `footer.sitemap`

**External references:** Footer7 and Ruixen Footer03. **Category:** Footer. **Disposition:** new production component; redundant second registration avoided.

**Structural idea:** client brand/social lane with structured site destinations and legal close. **Customization:** brand, five native logo modes (wordmark/text/image/combined/symbol), statement, copyright with `{year}`, social/legal records, navigation label, authored groups or Site Tree source, selected pages, depth, density/surface/measure. **Layout options:** brand-left, brand-above. **Typography/art:** common profiles/directions. **CTA capability:** optional primary, regular presentation. **Page/Action:** every destination uses typed Actions. **Contact/form:** email/phone/management records may be authored; no newsletter form. **Footer/site:** shared global, page replacement or omission; top-level/two-level/all sitemap depths. **Motion:** none/fade. **Responsive:** wide sitemap lanes become two-column groups and stacked brand content. **Accessibility:** footer landmark, labelled navigation groups, h3 group labels, accessible logo/text recovery, semantic links and focus.

### Compact Footer — `footer.compact`

**External reference:** Footer16. **Category:** Footer. **Disposition:** new production component.

**Structural idea:** small brand and flat destination rail with social/legal close. **Customization:** same brand/logo/copyright/social/legal fields and source selection as Sitemap Footer. **Layout options:** center stack, horizontal row. **Typography/art:** common profiles/directions. **CTA capability:** optional restrained primary; compact presentation subset. **Page/Action:** shared resolver. **Contact/form:** typed contact destinations, no form. **Footer/site:** global/override/omit, top-level navigation only. **Motion:** none/fade. **Responsive:** destination row wraps; brand/legal rails stack. **Accessibility:** footer landmark, named flat navigation and focus; no invented nested capability.

### Split Footer — `footer.split`

**External reference:** Solace Footer4. **Category:** Footer. **Disposition:** new production component.

**Structural idea:** contrasting brand/CTA and sitemap/newsletter cards. **Customization:** all common footer fields plus large title and optional newsletter configuration; authored/site source and depth controls. **Layout options:** brand-left, brand-right. **Typography/art:** common profiles/directions; source blue/black/noise branding replaced with semantic colors. **CTA capability:** optional regular primary in brand card, independent of newsletter Submit. **Page/Action:** typed site/social/legal/continuation destinations. **Contact/form:** optional newsletter through honest common submission boundary. **Footer/site:** global/override/omit, selected roots and configurable depth. **Motion:** none/fade, no source-only stagger dependency. **Responsive:** cards stack, directories stay readable in two columns, newsletter controls stack. **Accessibility:** footer and navigation semantics, form labels/status, visible focus; contrast tested on brand card.

### Banner Footer — `footer.banner`

**External reference:** Solace Footer3 and its AnimatedGroup dependency. **Category:** Footer. **Disposition:** new production component.

**Structural idea:** large typographic brand field over newsletter/social and sitemap lanes. **Customization:** common footer fields, title, optional newsletter, source/depth/density/measure. **Layout options:** centered or left banner. **Typography/art:** common profiles/directions; inherited client type replaces imported word animation styles. **CTA capability:** optional regular primary following banner; independent form submit and destinations. **Page/Action:** shared resolver. **Contact/form:** optional newsletter. **Footer/site:** global/override/omit and site-derived hierarchy. **Motion:** none/fade; title remains complete without word-by-word animation or an AnimatedGroup import. **Responsive:** banner size wraps and bottom lanes stack. **Accessibility:** footer landmark, visible title, labelled navigation/form and focus; essential words never wait for animation.

### Expanding Image Rail — `work.expand-rail`

**External references:** image-gallery and HoverExpandGallery. **Category:** Gallery/Portfolio. **Disposition:** new production component, one redundant gallery registration avoided.

**Structural idea:** a selected image opens among vertical label rails or neighboring image strips. **Customization:** heading/context, two–sixteen stable image records, title/category/note, intrinsic dimensions, alt, focal/mobile crop; density/surface, height and rail width. **Layout options:** label-rails or image-strips; portrait/landscape; compact/comfortable rails. **Typography/art:** common profiles/directions. **CTA capability:** optional section primary plus independent restrained per-image links. **Page/Action:** item destinations use stable record IDs and typed Actions. **Contact/form/footer:** none; can sit beside a global footer in a portfolio page. **Motion:** none/depth-shift selection transitions scaled by policy; no autoplay. **Responsive:** vertical desktop rails become a labelled mobile accordion. **Accessibility:** mouse preview also opens by focus/click; explicit aria-expanded/controls; visible focus and complete selected record. No hover-only access or global font selector.

### Editorial Card Rail — `work.card-rail`

**External references:** inline and attached AppleCardCarousel, Skiper49, image-expansion. **Category:** Gallery/Portfolio. **Disposition:** new production component; one exact duplicate and two redundant registrations avoided.

**Structural idea:** editorial image card strip, optionally centered in perspective, with independent category filtering and inspection. **Customization:** common image records/copy, density/surface, portrait/square/landscape ratio, filter none/category, inspection none/dialog. **Layout options:** cards, coverflow. **Typography/art:** common profiles/directions. **CTA capability:** optional section primary and independent per-card link; inspection remains a named button. **Page/Action:** shared resolver; filters/selection preserve stable records. **Contact/form/footer:** none; portfolio-page capable. **Motion:** none/depth-shift; native scroll-snap and bounded perspective, no automatic loop. **Responsive:** horizontal native swipe on narrow screens with readable card width. **Accessibility:** named region and Previous/Next buttons, live count, pressed category controls; native dialog supports Escape, initial close focus and return focus to opener. The source's decorative arrow is an actual inspection control or actual typed destination, never a dead button.

### Liquid Glass Carousel — `work.liquid-glass`

Replaced by the supplied shader/GSAP carousel in the October 7 Media correction. See [Media replacement](../media-replacement/README.md) for current components and validation. The earlier imitation is removed from active registries, rendering, styles, previews and exports; saved old sections migrate on import.

## Shared integration and verification

New common helpers: EndingHeading, EndingReveal, DestinationLink, DestinationList, InquiryForm and FormSubmissionProvider. FooterBrand/Map/Close/Shell are local structure helpers. Existing Actions, media, brand marks, motion, Creative Layers and Page Foundation remain canonical.

Footer derivation consumes real page order, navigation label, visibility, draft policy and stable identity. Depth is capability-specific, with bounded groups/destinations; missing selections, overlapping IDs and oversize trees produce diagnostics. Newly added footers derive from Site Tree when valid. Editors can choose authored groups instead. Actual nonembedded pages render a single effective footer after `main`; global inheritance, page replacement and omit modes use existing Site slots.

Design Lab: ten discoverable entries, structural/content-length/client previews, actual hover/keyboard commit and rollback. Composition Lab: CTA, Contact and Footer addition categories, native content/media/action/form/source editing, and seven QA demos (four ending compositions and three gallery compositions). Serialized drafts survive reload with content, action presentation, forms and footer slots. Registry grows **111 → 121 total**, **76 → 86 production**; QA fixture inventory grows **137 → 144**. No new Collection 009, Creator Express variant, Scar variant or page recipe is introduced.

| Verification | Result |
| --- | --- |
| Full unit suite, `npm run test -- --maxWorkers=2` | 75 files, 1,366 tests pass, no unhandled errors. Default high-concurrency retry passed tests but hit a Vitest reporting timeout; bounded run is clean. |
| `npm run typecheck` | Pass. |
| `npm run lint` | Pass, no warnings. |
| `npm run build` | Optimized Next production build and pinned portable Design Engine runtime pass. |
| Responsive/browser matrix | 187 checks: widths 1920, 1440, 1280, 1024, 768, 390 and 320; sampled typography/art directions, long copy, max 16 records, reversed/full-width CTA and reduced motion. No page overflow, clipped tested copy, duplicate IDs or broken fixture images. |
| Automated accessibility | 26 axe WCAG A/AA audits: zero violations in tested sections. This is automated evidence, not a certification of every possible client color/content combination. |
| Interaction checks | 12 pass: keyboard/touch rail, inspection dialog and focus restoration, card navigation/category filter, centered coverflow, lens selection, host success/failure, missing host disabled, footer outside main. |
| Lab workflow | 28 checks pass: ten discoveries, design preview/rollback/commit, blank-canvas additions, content edits, booking/email-draft preset, site-derived footer, global sharing, page override, persistence, seven QA demos and gallery/action editor. No console/page errors. |
| Performance review | Native bounded galleries, max 16 records, lazy/intrinsic media, no auto-advance or perpetual custom render loop, policy-aware transitions. No added third-party runtime dependencies. Static review and local browser verification; no deployed Core Web Vitals or remote-provider performance claim. |

Evidence: [browser.json](evidence/browser.json), [lab.json](evidence/lab.json), desktop/mobile section PNGs and lab screenshots in [evidence](evidence). Visual review included the brand CTA's opaque color treatment, split footer mobile sitemap/newsletter, desktop expanding rails, narrow card rail and glass lens. The isolated loopback harness renders production sections and labs; it does not bypass application authentication or add a public route.

Outstanding boundary: connect and verify a host-specific form provider before declaring online delivery or real newsletter subscription ready. Replace example contact addresses/social profiles/media with approved client data; review client colors/font licensing and provider behavior during rollout. The generated site runtime intentionally retains disabled unconnected forms. Email drafts and typed booking-page links are available now. No commit, push, hosting deployment, customer message or live form submission was performed.
