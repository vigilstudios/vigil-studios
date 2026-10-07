# Staff editor production release

Release scope: standalone staff Design/Composition Lab, native Design Engine and generated review assets, admin Lab navigation, typed variant export/import, code handoff guide. Customer-project provisioning/repository/deployment workflows, provider changes, checkout changes and new database migrations are excluded from this release. Existing staff authorization is retained; neither a public editing route nor an auth bypass is introduced.

Open https://www.vigilstudios.co/admin/lab?workspace=composition on a desktop with a staff account. Legacy Design Lab and Composition Lab URLs redirect into the unified Lab. The Admin sidebar exposes **Lab** on desktop. Design previews individual components; Composition builds the complete Site Definition.

**Pages → Portable site document → Variant name → Export site JSON** produces a separately named `.site.json` file, including all pages, sections, creative layers, action IDs and global slots. Local browser draft saves one working site. It does not commit files, sync multiple devices, or save three named variants on the server. JSON export/import is the portable source handoff. The three-variant workflow and repository folder are documented in [the handoff guide](../../express/creator-variants/README.md).

Isolated release verification: 1,350 tests / 73 files, standalone typecheck, lint and optimized Next production build pass. The existing 28 lab checks pass. Five named export/import roundtrip checks pass without browser errors. This release excludes two uncommitted customer-project test files (16 tests) from the previously reported 1,366-test workspace inventory. No schema change is required.

Production verification and exact release commit are recorded in `evidence/live.json` after deployment. The generated runtime remains content-addressed and pinned; hosted form delivery still requires a verified form adapter. Email drafts and honest disabled unconnected forms are available.
