# Creative Calibration 003 — feedback and convergence audit

30 September 2026. Creative decisions below preserve the user's feedback; “approved” means approved as a creative direction, **not** approved for production registration.

## Source and scope

Read the original Professional Design Engine implementation plan, architecture, contribution contract, foundation tokens, registry/types/validation, 29 previews, primitives, icons, all twelve motion behaviors, current Lab, Collection 001 and Calibration 002 Hero/Navigation documents. Inspected git status/history before editing: the engine and its docs were already untracked work; the admin layout already had changes. Those are preserved. The host is `vigil-studios`, not the adjacent Express lead generator. No Scar source, assets, design language or animations were consulted or reused.

The original [Calibration 002 Figma file](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy) was inspected through the available Figma MCP, including text-node styles, structure and rendered frames. It is unchanged. New code sketches live only in the authenticated Lab.

## Feedback ledger

| Hero | User signal | Disposition | What must survive or change |
| --- | --- | --- | --- |
| H07 | “okay”, somewhat original | Hold / promising, not approved | Keep in the archive; originality alone has not reached the quality bar. Do not promote. |
| H08 | Ugly; oval has no sense or substance | Reject this concept permanently | Remove from the shortlist. An arbitrary silhouette is not a mechanism. Do not rescue it with a font swap. |
| H09 | “very beautiful”, loves context and rounded image positioning | Preserve / approved direction | Keep the copy–object relationship and purposeful rounded media frame. No rewrite of the original. |
| H10 | Likes elongated image and left-aligned context | Preserve / approved direction | Preserve the panoramic field and left reading anchor. Future batches must include left and centered compositions, not one default alignment. |
| H11 | “meh”, outdated; misplaced “01 The Approach” | Reject this version; retire from Hero shortlist | The unrelated section marker breaks hierarchy. A different font does not fix its role or placement. |
| H12 | Unique, clean, immersive user interaction | Preserve / approved direction | Interaction should reveal meaningful content and remain usable by touch and keyboard. |
| H13 | Good idea, wants thicker/bolder type and more background | Revise | Test a substantially thicker letterform plus a genuinely exposed photographic field. Do not merely increase the old serif's weight. |
| H14 | Feels like a body section, not a Hero | Reclassify / hold | Preserve the archive as a possible section study. Do not count it as an approved Hero. |
| H15 | Bland, overly minimal/basic; asks whether motion is missing | Reject this version | A reveal cannot supply missing hierarchy, content or identity. Its static frame must earn its place first. |
| H16 | Strong approval of image; suggests left-to-middle exposure | Preserve / approved direction, requested motion experiment | Keep the central image spine; test a left-origin reveal. The final resting composition must be visible under reduced motion. |

Repeated positive signals: intelligible image/copy relationships, strong media, a clear first-screen proposition, purposeful asymmetry, distinct alignment, useful visitor agency. Repeated negative signals: arbitrary masks, decorative labels without hierarchy, body-section structures presented as Heroes, unearned emptiness, and relying on imagined motion to justify a weak frame.

## Evidence of convergence

| Dimension | Observed before Phase 003 | Cause and correction |
| --- | --- | --- |
| Families and global assignment | All ten Calibration 002 desktop frames use Instrument Serif in their primary/secondary display language and Inter for support/navigation. H13 also uses Bodoni Moda for SPACE; H15 adds italic. | Primarily repeated creative choices in Figma, not a browser inheritance bug. Introduce ten materially distinct type relationships. |
| Display and headings | Light/regular serif silhouettes dominate; large headline + small sans labels recur. Engine heading/display shared one font token and much of one scale. | Both creative repetition and insufficient engine vocabulary. Separate five semantic roles, weights, measures and scales. |
| Body and accents | Inter support copy, restrained measures and similar labels repeat. Engine had shared reading/leading rather than role-level control. | Body measure, leading and accent behavior now belong to the type profile. |
| Weights, tracking, casing | Repeated Figma brand 17px semibold / tracking 2, navigation 12px medium / 1.4, eyebrows 12px semibold / 1.6, actions 16px semibold. | Repeated microtypography makes different layouts feel related. Profiles now vary sentence/capital/lowercase treatment, weight, tracking and countervoice. |
| Variable axes / italic / numerals | No broad axis exploration was evident in inspected styles; italic remained an occasional gesture. Tabular vs oldstyle figures were not a systematic choice. | Explicit useful axes for Fraunces and Recursive, actual italic files for serif directions, and numeral treatment per role. No motion of axes while reading. |
| Scale and line widths | Similar dramatic serif scale, short titles and quiet supporting copy; engine offered a limited shared scale. | Responsive container-relative display sizes, role leading, display/heading/body measures and display/body contrast vary independently. |
| Whitespace / themes | Neutral, Editorial and Technical combined font/spacing/color assumptions. Palette switches could disguise the lack of independent art direction. | Separate type, art direction and brand tokens. Profiles are tendencies, not complete website themes. |
| Lab inheritance | `.de-root` already isolated much of the engine from the product's Space Grotesk/Inter. It did not provide a type-profile control. Global palette transitions could briefly tint the preview during switching. | Retain scoped variables; disable that transition on the preview root. Lab chrome keeps the product identity. |
| Media | Chair/coastal/stage studies have useful variation but repeated warm architectural imagery and elegant framing create family resemblance. | Reuse source assets honestly for controlled testing; diversify type-only, signal, assembly, route, portrait, macro evidence, panorama and open-scene treatments. |
| Layout and hierarchy | Some genuinely distinct mechanics (H09/H10/H12/H16) were disguised by repeated typography. H14/H15 also have role/hierarchy problems. | Keep good structures. Reject or reclassify weak ones instead of treating style flexibility as quality. |
| Motion | The reusable engine already offered twelve behaviors, but quiet fades/wipes and “premium” timing were the likely default vocabulary. Figma stills cannot prove working animation. | Add a provider-level policy; none/restrained/expressive are independent choices. Document actual versus proposed motion. No uniform reveal across a batch. |
| Navigation | Similar brand/navigation sizing and spacing repeated across the creative frames even when menu placement changed. | Art direction owns nav height and action language; contribution review explicitly compares nav proportions as well as Heroes. Existing Navigation experiments are preserved, not auto-approved. |

Conclusion: repeated creative decisions are the largest cause. Typography and the theme's limited independent controls reinforced them. Structure is sometimes strong; it is not uniformly the cause. Tool count by itself will not correct curation.

## Controlled re-tests

`Creative Calibration 003` in the Lab provides the same H09/H10/H12/H13/H16 structure with independent type, art direction, color and motion controls. These are isolated structural studies, not pixel-identical replacements for Figma and not new production components. “Compare Editorial / Poster” renders exactly the same chosen structure twice.

| Study | Useful comparisons | Finding / recommendation |
| --- | --- | --- |
| H09 | Luxury + Gallery; Technical + Precision; Playful + Salon | Strong object/copy relationship survives style changes. Gallery best preserves the rounded image quality the user approved. Precision can frame the object as a technical catalog. Keep; choose art direction per brand. |
| H10 | Geometric + Publication; Editorial + Gallery; Neo-Grotesk + Precision | Left anchor and whole/detail scale relationship survive. Narrow title column needs a size cap rather than arbitrary word breaking. Keep, with deliberate landscape crop. |
| H12 | Humanist + Salon; Technical + Precision; Poster + Billboard | Comparison is meaningful under very different typography. Humanist reads as an invitation; Technical as an inspection. Poster needs concise copy so the text panel does not consume the photograph. Keep the range control and accurate day/blue-hour language. |
| H13 | Poster; Brutalist; Neo-Grotesk | The thick compressed Poster letters and larger exposed scene address the explicit feedback. Neo-Grotesk is less distinctive. Revise, then seek creative selection; the revision is not automatically approved. |
| H16 | Fashion + Runway; Neo-Grotesk + Precision; Editorial + Publication | Central spine is the durable idea. Expressive versus restrained changes exposure distance/timing; none yields the final image immediately. Keep. Protect the portrait focal point and legibility of the right-hand record. |

H08/H11/H15 remain rejected **as these concepts**; their rejection does not ban all ovals, timelines or minimal design. H14 remains a possible body section. H07 remains on hold. A new mechanism with a sound purpose is a new proposal, not a cosmetic rescue of one of these.


## Approval reaffirmation — 1 October 2026

The user explicitly reaffirmed **H09 · Object Study** and **H16 · The Vertical Record** as approved, noting that they love both and noticed their absence from Composition Lab. This confirms their existing creative approval; absence from Composition inventory must not be interpreted as rejection or a need for another creative approval.

Scope is **approval only**: “just approve them, do not move them over or do anything extra, I'll let another model handle migrating it to the composition lab”. No renderers, contracts, registry lifecycle statuses or Composition fixtures were changed. Preserve H09’s copy/object and rounded-image relationship, and H16’s central image spine and reveal potential when the separately assigned migration occurs. The canonical follow-up is `heroApprovalFollowup` in `design-engine/registry/creative-review.ts`.
