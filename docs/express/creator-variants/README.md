# Creator Express variants

Luxe is the first published Creator variant. Its authored handoff is `luxe.site.json`; Muse Bennett remains the fictional creator in the example. Editorial is reserved for the planned newsletter variant.

Manage production variants at `/admin/lab/express`. Open a component variant in the Lab, change Catalog settings to rename it, Save draft privately, and Publish variant when it is ready. New variants can start blank or duplicate any existing variant. Remove archives a variant; Removed variants provides Restore. Stable slugs survive renaming.

The component library remains at `/admin/lab`. Professional customers have project-bound documents at `/admin/lab/project/[projectId]`, listed under `/admin/lab/projects` and linked from Website operations. These documents never share the scratch Composition draft or Express template state.

The six original HTML templates retain their authored designs in a source editor with a sandboxed preview. New component variants and Luxe use the full design/content/motion editor and component library. Embedded original template images were extracted without alteration into immutable public media files to keep drafts and save requests small. Customer repository seeds include those assets, or a pinned Design Engine runtime and selected library media for component variants.

`scripts/seed-express-library.ts` is a one-time idempotent import, run with the linked service environment. It never overwrites an existing staff draft. Older creator-neutral, studio and field-note JSON files are historical starting points; production edits live in the database.
