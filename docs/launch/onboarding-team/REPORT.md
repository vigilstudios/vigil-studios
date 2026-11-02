# Optional Team onboarding and website component

Release preparation and updated verification: [RELEASE_20261102.md](RELEASE_20261102.md). The local-only status and pending prerequisites below describe the earlier review.

Local implementation, 27 October 2026. No production deployment or shared database migration has been performed.

## Behavior

- Brand and photos now includes an optional “The team” section, off by default for existing and new briefs. Customers can add up to 50 named profiles with optional role, short bio and one portrait. Switching it off retains the entries without requesting their use. Continue validates enabled profiles.
- Portraits upload to or reuse the customer's existing project Files. Stable asset IDs retain assignments; unlinking a portrait does not delete the original. Save, submission and eventual import validate tenant, project and image ownership. Files remains a file library; employee assignments belong to onboarding and Content Hub.
- Completed intake imports a Team collection only when the feature is enabled and named profiles exist. This creates the conditional “The team” Content Hub tab under the existing plan and lifecycle rules. Import is idempotent and preserves subsequent Hub edits. Profiles use the same canonical records in onboarding handoff, Content Hub and website rendering.
- Professional/Growth Lab includes `about.team` / “The Team”, with responsive portrait cards and a compact directory. Names, roles, biographies and optional portraits are editable. Empty sections render nothing; missing portraits use initials. Real section discovery connects an unambiguous pending Team collection without publishing it. Removing an unused section hides its discovered collection; re-adding the same section restores the original records.
- Admin organization details display “Team component needs attention” when profiles were requested but no real component/binding is present. Professional/Growth projects link to their project Lab. Express checks its frozen structured export and requires a real authored Team section plus binding; missing implementation remains flagged and cannot publish. This does not add Express projects to the Lab.
- Review and creative-source handoff include the requested profiles and portrait references so implementation is visible to staff.

## Access and release

Migration `20261102000059_optional_team.sql` adds the Team module, strict image-only payload checks and the existing authorized authoring paths. It follows the earlier onboarding-catalog migration 51. Express Care+ is included; Basic restrictions, website-attributed plans, live-only customer authoring, staff preparation and member/tenant protections remain enforced.

Both additive migrations are unapplied to the shared backend. Apply them before the eventual application release. Until then, the local onboarding JSON form and Lab preview can be tested, but the new Team Content Hub module cannot be persisted against the shared database. No intake was submitted, no sample files uploaded and no customer notifications were sent during this QA.

## Verification

- Complete suite: 2,726 tests across 144 files passed. New cases cover opt-out defaults, stable identity, portrait constraints, conditional one-time import, edit preservation, Lab/canonical round trips, semantic rendering, and tenant-scoped Express readiness. Library-wide registry, action and client-adaptation checks include the added component.
- Full lint, typecheck, optimized production build and diff whitespace checks passed. The generated frozen Design Engine runtime includes the Team renderer and styling.
- Disposable PostgreSQL migration/RLS validation passed. Team assertions cover Express staff drafting, blocked unimplemented publication, image/count validation and denied read-only member editing. No shared backend mutation was used for these checks.
- Real Chrome local QA verified optional fields and employee add/remove. Lab preview checked desktop, 768px tablet and 390px mobile, including compact list mode. Cards change from three to two to one column through container queries. Typography and wrapping were reviewed. Team rendering is static with semantic headings/lists and no keyboard actions or motion.
- File upload automation remains limited by Chrome extension file-URL access, as recorded in the preceding catalogue report. Portrait upload uses the same validated Files pipeline; a real browser upload was not verified. The temporary blank QA profile was removed and the demo feature returned to its original off state.

The local application remains available at `http://127.0.0.1:3190/dashboard/onboarding?step=brand`.
