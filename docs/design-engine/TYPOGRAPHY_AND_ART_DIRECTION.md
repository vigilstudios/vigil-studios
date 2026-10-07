# Typography, art direction and font boundaries

Phase 003 adds independent directions without changing the existing registry or forcing a style on older consumers.

Milestone 4A adds the narrower [production composition contract](./COMPOSITION_ARCHITECTURE.md): site-owned brand/icons; explicit site typography/art/motion; optional page replacements; declared section overrides. Existing individual-study provider behavior remains valid. Both internal labs bind the preview font catalog at their route boundaries; reusable section source imports no font or calibration fixture.

## Composition contract

`DesignThemeProvider` accepts `theme`, partial brand `overrides`, `typography`, `artDirection`, optional `fonts` and `motion`. Theme tokens are the baseline; art-direction variables replace spatial values; typography variables replace type values. Explicit motion overrides an art direction's default. Color stays with the theme/brand tokens. Omitting the new inputs preserves legacy rendering.

```tsx
<DesignThemeProvider
  theme="neutral"
  overrides={{ color: { accent: "#853523" } }}
  typography="editorial"
  artDirection="publication"
  motion="restrained"
>
  <ExistingHero />
</DesignThemeProvider>
```

This is a compositional vocabulary, not six complete themes. Component structure may protect constraints such as comparison-image alignment, a panorama crop, or a legible title width. Such exceptions must explain their structural purpose. A profile cannot make every arbitrary structure/profile combination a good creative choice.

## Five roles, small meaningful controls

`foundations/typography/types.ts` defines display, heading, body, accent and mono. A role controls family key, real weight/style, responsive size, leading, tracking, maximum measure, case, numeral treatment and optional supported variable axes. An emphasis rule selects a role and italic behavior. `typographyVariables` creates semantic CSS properties consumed by scoped classes and existing primitives; components never call a font loader.

| Profile | Display / body | Relationships that change |
| --- | --- | --- |
| Editorial | Fraunces / Source Sans 3 | Optical serif at 500, tight dramatic display, oldstyle figures, humanist paragraphs, italic emphasis. SOFT 0, WONK 1, opsz 96. |
| Luxury | Bodoni Moda / Public Sans | Fine 400 display, restrained scale, open tracking, wide small labels, narrow body measure and long leading. |
| Neo-Grotesk | Public Sans / Public Sans | Heavy 800 display, close tracking, tight line rhythm, compact sans hierarchy. |
| Geometric | Jost / Jost | Medium weight, positive tracking, measured scale, wider leading and architectural intervals. |
| Condensed / Poster | Anton / Public Sans | Compressed capitals, aggressive scale ratio, short title measure, mono supporting labels. |
| Humanist | Source Sans 3 / Source Sans 3 | Moderate sentence-case display, readable 600 weight, warmer proportions and generous body leading. |
| Technical | IBM Plex Mono / Public Sans | Smaller mono display, tabular figures, precision labels, clear sans reading text. |
| Brutalist | Archivo Black / IBM Plex Mono | Dense black capitals, blunt scale jumps, short measure, mono countervoice. |
| Playful / Expressive | Recursive / Source Sans 3 | Lowercase 800 display, casual variable forms and lively contrast. CASL 1, MONO 0, slnt 0, CRSV .5. |
| Fashion / Art Direction | Cormorant Garamond italic / Public Sans | Very large italic 500 display, close leading, narrow quiet sans countervoice, oldstyle figures. |

The profiles do not expose arbitrary animation sliders or a giant site configuration. Custom profile objects are accepted for a client's chosen values. Font keys are logical slots; bindings can substitute appropriately licensed client families. A substituted face must support the requested style/weight/axes; adjust that client's profile if it does not.

## Loading only what a client needs

The internal Lab is the only surface importing `preview/lab-fonts.ts`. It deliberately offers all ten families for comparison. Each `next/font/local` call uses `display: "swap"`, explicit weight/style ranges, fallbacks, CSS variables and `preload: false`. This avoids a catalog-wide preload; browser CSS demand selects the faces actually used by the visible composition. Visiting more profiles naturally loads more faces during that Lab session. The catalog is roughly one megabyte of source WOFF2, not a client-site budget.

A client site must **not import `lab-fonts.ts`**. Create a small client-owned font module with only that client's selected faces, and inject the resulting families or variables:

```tsx
// In the client repository/application boundary, with licensed files:
import localFont from "next/font/local";
const clientDisplay = localFont({
  src: "./fonts/client-display.woff2",
  weight: "100 900", // Use the actual range; use separate static faces otherwise.
  display: "swap",
  fallback: ["Georgia"],
});

<DesignThemeProvider
  typography="editorial"
  fonts={{ fraunces: clientDisplay.style.fontFamily }}
>
  <ExistingHero />
</DesignThemeProvider>
```

Bind/load the remaining used roles as well; `requiredFonts(profile)` lists deduplicated role-family keys for planning. It is not a dynamic loader. Next font calls and source paths remain static. A client choosing one custom family for several roles can bind those keys to the same loaded family. Unbound roles have safe fallback stacks. Only keep axis values present in the supplied font.

`next/font/google` is an alternative at the same client boundary for a chosen open-source family, with subsets and axes selected explicitly. It does not belong in reusable section components. Approved client-owned CSS/web-kit loading can supply a family binding too, subject to the provider's license and privacy requirements. Proprietary binaries never belong in the global catalog by default.

Lab assets came from official Fontsource npm packages at version 5.3.0. The manifest records package integrity and per-file SHA-256. Every family retains its OFL LICENSE and metadata. Actual normal/italic files are included where used. Current subsets cover Latin study copy; multilingual projects must select and test needed subsets, glyphs and fallback behavior.

## Six art directions

`foundations/art-direction.ts` defines Gallery, Publication, Precision, Billboard, Salon and Runway. They control spacing density/section rhythm, grid tendency, alignment, asymmetry offset, gutters/gaps, borders/radius, media width/fit/position/frame, navigation height, action style, decorative restraint and default motion. They do not assign a client palette or lock typography. The Lab deliberately combines any type profile with any art direction.

Scoped `data-*` attributes expose grid/alignment/action/decorative tendencies. Consumers must use supported primitives/classes to receive their behavior. They are not an automatic layout solver. Example: the primary navigation receives different height and actions; a section receives different rhythm; an image receives frame/radius/crop; a Hero retains its structural arrangement.

## Motion and accessibility

`MotionPolicyProvider` combines direction with the existing reduced-motion hook. None means immediate readable content and still media. Restrained scales transform distances down; expressive increases selected distances/durations. The policy does not change content, enable every behavior, or make a weak static composition acceptable. Motion remains opt-in at the component level. Marquee pauses offscreen and becomes one track for reduced motion/none; pointer/scroll mechanisms keep their touch/narrow safeguards.

H12 uses a native labeled range input and visible percentage; the two images share exactly the same crop geometry. H16 demonstrates the requested left-origin image reveal using `MediaReveal.fromX`, with final resting content under no motion. Batch 003 sketches intentionally run with motion none; their other interaction/motion ideas are explicitly proposals.

MediaReveal and MaskReveal observe an unclipped outer wrapper and animate the inner surface. Observing a fully clipped target can prevent the intersection trigger from ever firing. This was found in H16 browser QA and corrected in the shared mechanism; the resting composition and class/layout boundary stay on the wrapper. The implementation follows the [Motion useInView pattern](https://motion.dev/docs/react-scroll-animations), verified through Context7.
