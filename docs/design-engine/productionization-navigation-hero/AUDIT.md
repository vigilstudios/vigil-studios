# Approved capability inventory and implementation checklist

2 October 2026. User brief approves NX01–NX12, modified H12, HX01 and HX02. Creative originals remain unchanged. Earlier pending HX review text is historical.

Source audit: Collection 003B Study, studies, contracts, fixtures, CSS, approval follow-up; FullViewportHero and its gallery controls/CSS; ComparisonHero and current section schema; registry and composition contracts; typography/art/media/icon/motion foundations; previous collection implementation and QA.

## Navigation preservation checklist

For **each NX01–NX12** preserve the authored DNA, destination scale, one-level/flat hierarchy, independent brand/primary/action choices, position, solid background, contrast, density, utility whitelist, sticky/reveal/Hero-centric behavior, desktop and mobile reading structure, expanded menu geometry and route-neutral destinations. Carry these into strict schemas, SectionContract, registry, both Lab inspectors, runtime and regression/browser tests.

| Study | Identity / navigation / actions | Architecture and mobile |
|---|---|---|
| NX01 Datum | left / left, center, right / right | Baseline and native disclosures; attached mobile index |
| NX02 Meridian | center / split / left, right | Equal wings; centered brand and bottom sheet |
| NX03 Dispatch | left, center / left, center / right | Masthead and register; numbered editorial modal |
| NX04 Pocket Dock | left / left / right | Zero-footprint dock and fan; attached mobile sheet |
| NX05 Viewfinder | left / right / right | Corner signature; cinematic side modal / full-height mobile |
| NX06 Switchboard | left / left, center / right | Utility and department rows; hierarchical mobile index |
| NX07 Atlas Hall | left / left / right | Priority gate and grouped hall; mobile group accordions |
| NX08 Folio Takeover | left, right / left / right | Colophon; fullscreen editorial index |
| NX09 Margin Rail | left / left / left | Reserved margin column; top strip and side modal |
| NX10 Threshold | left, center / split / right | Signature before Hero, destination shelf after Hero |
| NX11 Channel Directory | left / left / right | Two-pane departments; staged mobile, heading focus and Back |
| NX12 Open Doors | left, center / split / right | Oversized destination board; priority door spans mobile grid |

NX04 additionally retains four dock styles, three docking positions, two widths, two edge offsets, zero/two/three priority links, CTA and utility visibility. It supports Compact; NX03 supports Compact. All support static/sticky/reveal/solidify. Flow switches to overlay intentionally for solidify; floating and edge stay structural. Flat architectures reject nested data; complex systems support up to six children per parent and semantic parent destinations.

## Hero preservation checklist

- H12: existing ID and balanced/inspection structures; 22rem context; left/center/right context independent of seam; matched ratios/focals; range/steps/reset/CTA; full-bleed natural/monochrome/high-contrast images; responsive image behind panel. Promote intentionally as v1.0.0, backward-compatible missing alignment.
- HX01: continuous full viewport photograph, grouped title/context/action, edge provenance; nine placements, subtle/loud voice, light/dark ink, long-copy growth, focal/mobile crop, independent typography/art/brand.
- HX02: independent headline and bottom context register, continuous photograph and exposed reading distance; same nine placements/voices/ink, context alignment and responsive stacked register. Separate component, no generic Hero switch.
- Both: optional metadata and zero/one/two semantic CTAs; fixed full-bleed cover geometry, supported tones; static motion and no autoplay. The approved studies demonstrated images only. Video, custom fit, arbitrary content width, overlays and new density controls are not invented in this pass.

## Production fixes to verify

Native dialog containment/Escape/restoration, nonmodal outside/blur dismissal, staged Back focus, touch targets, no hover-only destinations, safe hrefs/logo fallback, long labels, measured closed geometry, no menu layout shift, scroll ancestor discovery with one passive/rAF listener per mounted navigation, reduced-motion stable state, transparent contrast authoring, safe zone for every existing Hero, margin rail reservation and post-Hero shelf independent of Hero implementation. Registry evidence must follow current-pass checks.
