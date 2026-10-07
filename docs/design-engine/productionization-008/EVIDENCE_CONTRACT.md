# Pass 008 evidence contract

The twelve human-approved E01–E12 mechanisms have independent section schemas and implementations. `design-engine/evidence/types.ts` owns provider-neutral evidence; `composition/evidence-schemas.ts` owns narrow section payloads; `evidence-contracts.ts` owns serializable capabilities. Production code has no runtime dependency on creative fixtures or preview code. Original studies remain intact.

## Publication boundary

Sections default to `evidenceMode: "publication"`. Parsing a publication payload rejects any `provenance.status: "demo"` recursively. The runtime shell repeats this small guard even for direct callers. Only explicitly marked `illustrative` sections accept Lab fixtures, and they visibly disclose fictional evidence and illustrative media. A preview adaptation never promotes fictional evidence to client-supplied evidence.

Every source has `source`, `attribution`, `timeframe`, and `context`. Client-supplied records also require `recordReference` and `permission: "publication-authorized"`. Verified records additionally require an HTTP(S) source URL and a dated verification declaration (`by`, `on`, `method`). These fields describe the host's records; the engine does not independently verify truth or permission. `EvidenceSource` excludes demo records; `EvidenceRecordSource` retains the explicit illustrative branch.

Do not publish invented customers, organizations, ratings, review totals, metrics, certifications or awards. Feed validated actual records and retain their limitations. Empty or absent media does not justify a fictitious photo, logo or attribution. Client publication should validate the complete section with `parseSection` before rendering.

## Narrow records

| Contract | Required relationship | Optional material |
| --- | --- | --- |
| Testimonial | Stable id, full quote, named author, provenance | Role, organization, safe author profile URL, avatar, portrait, organization mark |
| EvidenceMetric | Before/after numeric values, label, unit, measurement basis, higher/lower/neutral direction, provenance | No synthetic KPI counters or externally claimed totals |
| Transformation | Baseline → intervention/duration → outcome; measured result, voice and limitation | Before/after imagery |
| CaseStudyEvidence | Client, challenge, intervention, metric and voice, stable id | Project media; host destination kind/key/label and optional safe href |
| Recognition | Issuer/organization, kind, title, scope, year, provenance | Expiry, logo |
| Review | Full quote, named author, integer rating 1–5, valid date, platform, provenance, verified-purchase boolean | A true purchase label requires verified provenance **and** explicit purchaseVerification (`by`, `on`, `method`) |
| InterviewEvidence | Speaker, provenance, 2–6 complete question/answer exchanges | Still or speech video |
| ClientRelationship | Organization, role, chronological since/through dates, outcome, provenance | Supplied mark |
| EvidencePoint | Ordered unique date, bounded numeric value, event, provenance | No invented intermediate observations |
| EvidenceArtifact | Title, finding, provenance, stable id | Exhibit image |

Review distributions, sample count and average are derived from the supplied records only. Selection policy is required and visible; lower ratings remain represented. There is no API for an external customer count or platform-wide average. Metrics retain the basis, unit, timeframe and context; transformations require a limitation and artifacts require a qualification.

All collection item arrays use distinct stable IDs and finite ranges. Values are finite/nonnegative, bounded at 10¹²; quotes are bounded at 1,000 characters (reviews 700). Calendar dates must be real. Destinations reject unsafe protocols and are resolved by the host; the engine neither creates detail pages nor fabricates routes. Missing href produces no imitation action.

Media reuses `SectionImage`/`SectionVideo`: intrinsic size, authored alt/decorative semantics, responsive source/focal point, optional caption, lazy decoding/delivery. Speech video requires caption/transcript metadata, native controls and preload none. The plain E06 media leaf does not load the reveal animation library.

## E06 capabilities

`proof.moving-chorus` accepts 3–24 distinct testimonials, ideally 4–9. One or two voices are rejected rather than artificially marketed as a versatile loop. Complete cycles repeat internally only for visual coverage. Duplicate density is derived from geometry, not an editor knob. Vertical movement is not offered because it would change the approved horizontal reading composition.

| Field | Effective values |
| --- | --- |
| visualStyle | typographic (open quote rhythm), editorial (indexed/rule-led), portrait-led (image/voice split when media exists), compact (dense ruled surfaces) |
| alignment | left, center, right |
| quoteScale | restrained (body role), standard (heading role), large (expanded heading role), display (display role) |
| authorTreatment | text-only (full attribution), compact (name/organization), avatar, portrait, organization |
| surface | transparent, surface, framed, full-bleed |
| direction | left, right |
| speed | slow, medium, fast |
| intensity | subtle, standard, expressive (travel rate, vertical breathing space and expressive stagger) |
| pauseOnHover | yes, no |
| pauseOnFocus | yes — fixed safety property, never a meaningless selector |
| edgeFade | none, soft |
| gap | compact, regular, spacious |
| motion | marquee; none provides the complete accessible still presentation |

Quote scale consumes the selected profile's family, weight, style, tracking, transform, axes and leading. Semantic size caps protect narrow reading. Optional media treatments fall back to attribution; portrait-led gracefully becomes quote-led without media. Surface, borders, framing, gutters and gaps consume semantic engine tokens.

The normal Design Lab and Composition Lab expose these contracts with hover/focus audition, Escape rollback and click/Enter commitment. Loop-specific controls disappear in a section's motion-none mode or are inactive under the global reduced-motion policy. Production schema rejects unsupported directions and focus-pause disabling.

## Extension boundaries

Host-owned source/permission/verification declarations and destination keys leave room for future ingestion and pages without creating integrations. `MeasuredLoop` is a small visual-only transform primitive; its owner must provide a canonical accessible reading surface. Shared page-visibility subscription is justified by E06 and E12. Broader choreography, vertical loops, coordinated pause policy, page transitions, nested pages, external verification and automatic composition remain later work.
