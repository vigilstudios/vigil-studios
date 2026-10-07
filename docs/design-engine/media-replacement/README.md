# Media / Featured Content replacement — October 7, 2026

Four independent implementations now preserve the supplied reference layouts and interactions. Glass Lens Gallery is removed from the active Media registry, section selection, preview fixtures, render dispatch, source adapters and styles. The existing Expanding Image Rail and Editorial Card Rail remain functional.

| Prompt | Exact library name | React export | Registry ID | Source file |
| --- | --- | --- | --- | --- |
| 1 | Image Expansion Slider | `ImageExpansionSlider` | `work.image-expansion` | `components/ui/image-expansion.tsx` |
| 2 | Hover Expanding Image Gallery | `ImageGallery` (also default) | `work.image-gallery` | `components/ui/image-gallery.tsx` |
| 3 | Apple Card Carousel | `AppleCardCarousel` (also default) | `work.apple-cards` | `components/ui/carousel-08.tsx` |
| 4 / attachment | Liquid Glass Carousel | `LiquidGlassCarousel` (also default) | `work.liquid-glass` | `components/ui/liquid-glass-carousel.tsx` |

Review at [the live Composition Lab](https://www.vigilstudios.co/admin/lab?workspace=composition), under Layout → Media & Work. Staff authentication is required by the existing editor. Each component also has a Design Lab preview and a Media & Work composition fixture.

## Reference appearance and customization

`skin: reference` retains each source's visual identity: the slider's dark/light rounded shell, tabs, landscape cards, pills, vignette and dots; the expanding gallery's centered copy and flush 400px photographic strips; the Apple carousel's 280/320/370px tall rounded cards, top-aligned titles, white circular arrows and free dragging; and the liquid carousel's actual infinite ribbon, chromatic refraction shader, GSAP entrance and focused-image choreography. Supplied demo brands, image URLs and copy are removed. Typography reads the client's existing font roles; no imported global Poppins rule affects the website.

`skin: site` reads existing client foreground/background, surface, border, radius, accent, action contrast, grid gap and section-space tokens. The existing typography, art-direction and motion layers continue to apply. The liquid renderer observes client palette changes without restarting its image ribbon. Image sizes remain intentionally bounded to preserve source geometry.

Common controls: skin, alignment, density, surface, motion and existing section typography/art/motion overrides. Component controls:

- Slider: dark/light reference appearance, category filtering, landscape/square media, optional inspection. Theme toggle is reference-only; site mode uses the authored client palette.
- Expanding gallery: standard/tall image height and optional inspection. Hover, keyboard focus and touch select the same image; narrow screens retain a horizontally scrolling strip with the selected image brought into view.
- Apple carousel: standard/tall cards and optional inspection. Native Embla dragging, keyboard arrows and bounded Previous/Next controls remain available.
- Liquid carousel: section/viewport height, rise/grow entrance or no entrance, and tight/open spacing. It initializes near the viewport, pauses rendering when offscreen/hidden, caps pixel density, disposes textures/materials/tweens/listeners, and shows authored native images when motion is disabled, reduced motion is requested, WebGL is unavailable, textures fail, or the context is lost. Horizontal gestures move images while vertical gestures continue scrolling the page. Asset changes permit retry after an effect failure.

All four consume the existing strict `content.works` photo records: stable ID, category, title, note, authored image and optional thumbnail. Responsive source/focal metadata remain available through the shared image primitive and inspection/fallback view. Creator photography and campaign/video thumbnails can link to their original TikTok, Instagram or YouTube content through the existing typed per-item Actions. Selection and inspection are independent of destination links.

No content schema fields or database migrations were added. The new schemas declare component configuration only. Old serialized `work.glass-lens` sections migrate on import to `work.liquid-glass`, preserving identity, authored content, overrides and actions. Immutable older exported runtime distributions and historical screenshots remain available for already-pinned sites; they are not active component options.

## Project structure and dependencies

The project already has React, TypeScript, Tailwind 4 and the root `components/ui` directory. `components.json` now declares the shadcn aliases and existing `app/globals.css` entry point; no application scaffolding is required. The UI directory provides the exact import paths requested by the supplied prompts.

Client-gallery styling is scoped in `components/ui/media-galleries.css`, so it can travel with the independent Design Engine runtime without relying on marketing-page Tailwind output. Shared engine tokens remain in `design-engine/styles.css` and existing foundations.

Added reusable supporting code: `media-gallery-shared.tsx` (frame, heading, named controls, native image dialog with keyboard navigation and focus restoration), `liquid-glass-carousel-engine.ts` (the supplied shader/physics core with lifecycle/palette boundaries), shadcn-compatible Button, Carousel and Card primitives, and `lib/utils.ts`.

Added dependencies: `@radix-ui/react-slot`, `embla-carousel-react`, `gsap`. Existing `lucide-react`, `class-variance-authority`, `three` and Three types are reused.

Changed registry/configuration wiring: ending schemas/contracts/names/defaults, action capabilities, composition dispatch, Design Lab preview dispatch and ending fixtures. The existing generic content editor, section chooser and persistence automatically expose the new components. Counts in existing inventory assertions were updated for four additions and one removal.

## Verification and release scope

- Clean release tree: lint, TypeScript, optimized production build and 1,369 tests across 74 files pass without provider environment files.
- Shared working tree: 1,385 tests across 76 files pass; unrelated existing changes are excluded from the release.
- 42 desktop/tablet/phone layout checks, including long copy, 16 records, reference/site styling and reduced motion.
- Eight WCAG accessibility audits with no violations; fourteen image/dialog/filter/theme/keyboard/touch/carousel/WebGL-fallback interaction checks pass.
- Seventeen Design/Composition Lab checks cover discovery, removal of the old option, authored titles, site styling and saved-draft reload.
- Browser checks report no runtime errors. Two liquid controls were rechecked directly in the browser after the fixed-duration software-WebGL checks completed too early; the automation now waits for the visible counter/focus state. Existing two Media galleries remain renderable at all five tested widths.

Evidence: [browser.json](evidence/browser.json), [lab.json](evidence/lab.json), desktop/mobile screenshots in `evidence/`. Repeatable loopback checks: `scripts/design-engine-media-browser.mjs` and `scripts/design-engine-media-lab.mjs`; the existing readiness fixture supplies actual production renderer/editor code without adding a public QA route.

Implementation files are the four UI modules above, shared UI/CSS/engine modules, reusable primitives, `components.json`, `lib/utils.ts`, package manifests, the ending registry/schema/contracts/actions/render/preview files, removal of the old gallery implementation/styles, relevant inventory/persistence tests and readiness documentation/scripts. Hero, About, Socials, Services, CTA, Contact, Footer and Navigation implementations are unchanged.

Fresh-checkout validation now generates Next.js framework/image/route declarations with `next typegen` before TypeScript, following the installed framework documentation. This one-command compatibility fix prevents CI from depending on an earlier build.

The existing Supabase Preview integration reports a remote/local migration-history mismatch on both the prior editor commit and this release. It is outside Media replacement scope; no database schema was changed. Website production deployment completes independently.

Production uses the established main → Vercel Git integration. Final commit/deployment status is recorded in `evidence/release.json` after live verification.
