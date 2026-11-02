# Onboarding items, Files and Content Hub

Local implementation, 27 October 2026. No shared database migration or production deployment has been performed.

## Behavior

- Every Services, Products, Menu or Other item accepts multiple private images, up to the existing Content Hub limit of 30 per item. New uploads use the existing project Files path, checksum, quota, recording and notification flow. The picker reuses existing per-project image IDs without copying storage objects or consuming extra quota. Removing an image from an item never deletes the file.
- Section examples change with the offering type: Consultations, Skincare, Starters and Memberships. Review shows assigned thumbnails, and the creative source includes the ordered image filenames and stable asset IDs alongside each item.
- Intake retains the initial item associations until submission. Once the completed catalogue enters an authorized authoring/build flow, its entries import once into Content Hub, with group names as categories, prices, descriptions and all image references. Services/Other use the existing Services module; Products/Menu use Products, with the Menu tab labeled Menu. No item assignment controls are added to Files.
- Imports are tenant/project scoped and verify original Storage metadata. They retain existing delivered collections and subsequent Hub edits. A missing binding remains an editable draft catalogue with publication disabled in both server and database checks. An unambiguous actual Design Engine collection can adopt the catalogue without replacing its IDs or publishing it. Primary-only website sections retain the additional images in Hub and across Lab saves.
- New structured Express repository exports register frozen website runtimes and real Products/Services bindings using the existing validated renderer. Initial template collections wait for completed intake before importing customer entries. Existing HTML/standalone deployments need an explicit supported binding/export before their catalogue can publish; onboarding intent alone does not change their renderer.

## Access and deployment

The user explicitly approved Express service/product/menu editing with Care or higher. Migration `20261102000058_onboarding_catalog.sql` extends existing website-attributed eligibility and live-only customer authoring, retains Basic/downgrade/tenant/role protections, and restricts Express authoring to Products and Services modules. Menu uses Products. Staff can prepare these collections before launch. Blog/Portfolio are not enabled for Express.

Apply the additive migration as part of the eventual approved release before deploying the application. Function signatures and generated database row shapes are unchanged. The shared database remains unchanged during this local design phase.

## Verification

- Disposable PostgreSQL: all migrations and existing RLS assertions passed, including additional Express eligibility, prelaunch, Basic attribution, read-only member, pending publication and retained-draft checks.
- Unit coverage includes legacy briefs, duplicate/forged image IDs, same-project image validation, stable item identity, multi-image import without duplicate files, import replay preserving Hub edits, incomplete/foreign-tenant briefs, Storage metadata rejection and binding without publication.
- Chrome verified the real Express form, type-specific section examples, multiple-file input and the empty reusable Files picker. The upload automation was blocked by Chrome's ChatGPT extension file-URL permission; no demo image was uploaded. The demo service name is saved in the existing Express demo brief. The user can upload manually through the visible form.
- Final suite, lint, typecheck and build results are recorded in the implementation log. The local development server remains at `http://127.0.0.1:3190`.
