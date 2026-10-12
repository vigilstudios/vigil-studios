# Scar Blog dashboard and visual authoring

## Approved scope

Connect the three review articles to editable customer drafts. Provide a clean table/feed Blog library, a distinct Blog icon, customer navigation ordered Overview → Website → Blog → Files → Requests → Domain → Subscription, and hide Design review once the associated website is live. Replace syntax-based authoring with a visual editor for text, headings and photos. Add homepage Blog features below Services, opaque native-page navigation paper from Camera Roll onward, and side navigation Work → Fotos → Blog → Love. After these changes, use the shared fixed dotted backdrop for the testimonials section.

## Release boundaries

Shared Vigil dashboard/API changes deploy to production under the standing authorization. Scar's website remains on its review branch; production/main and the website launch approval state remain unchanged. Review examples are explicitly selected sample drafts, excluded from normal production Blog reads and prohibited from publishing. Ordinary tenant drafts remain private. Existing onboarding eligibility and owner/manager/staff authorization remain in force.

## Implementation and validation

Use the existing safe paragraph/heading/photo storage contract behind a visual editor, preserving existing drafts and private uploads. Staff-selected sample rows are the only building-site content exposed by the review API. Schema migration/RLS tests, API tenant/media tests, draft preservation tests, typecheck, lint and builds must pass. Verify table/feed switching, visual editing and saving against Scar's actual staff-view account, and desktop/mobile homepage navigation, articles and testimonials. Confirm hosted deployment sources before completion.
