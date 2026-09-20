# Creative Workspace — operator and developer notes

**Written:** 20 Sep 2026. Plan: `../../CreativePackageAutomationPlan.md`.

After **Create repository** succeeds for a Professional or Custom website, Vigil
adds a `.vigil/creative/` folder to the customer's private GitHub repository:
the customer's onboarding brief and files exactly as given, Terra's normalised
creative intelligence, an asset manifest, and a fixed `ASTRA_INSTRUCTIONS.md`
that tells Astra how to run Phase 1 (three creative directions), stop for the
human, and run Phase 2 (the selected direction's visual system).

**Deploy preview** and **Deploy live** are untouched: they do not read, write or
depend on the workspace, and the workspace job never touches deployments,
domains or website status.

## Lifecycle

```
website.repository job (Create repository)
   └─ after provisionWebsiteRepository succeeds:
      creative_workspaces row → queued
      enqueue website.creative_workspace (key website.creative_workspace:<websiteId>)

website.creative_workspace job → generateCreativeWorkspace(admin, websiteId)
   collecting_source        projects.brief + project_assets → source/ snapshot, sha256 checksum
   generating_intelligence  Terra (OpenAI Responses API, strict JSON schema) → validated, stored on the row
   packaging_assets         manifest for every file; small files downloaded and checksummed
   writing_repository       one commit on the default branch; nothing under outputs/ touched
   ready | ready_with_warnings | failed
```

Every step updates `creative_workspaces.status`; the admin website page shows
the status pill, warnings, the failure message, versions, asset counts and the
commit, with **Generate / Regenerate**. Regeneration enqueues a fresh job (key
suffixed with the minute) and runs the same idempotent service.

Which project kinds are queued automatically is `CREATIVE_WORKSPACE_PROJECT_KINDS`
(default `professional,custom`). Express template copies are skipped unless
that is set to `all`; staff can always generate one from the website page.

## Idempotency and safety

- **Idempotency key** = sha256(website id, source checksum, workflow / prompt /
  schema / template versions, model id). When the row already holds validated
  intelligence for that key, Terra is not called again. A Git failure after the
  model answered therefore costs nothing on retry.
- **No duplicate commits.** Generated files are compared by Git blob sha to what
  the branch holds; an unchanged workspace commits nothing. The ref update is
  not forced: if the branch moved meanwhile, the run re-reads and retries (3×).
- **Human work is preserved.** `outputs/` is never written once a file exists
  (only the two `.gitkeep` placeholders are added when missing). A generated
  file whose current blob differs from what Vigil last wrote (`generated_files`
  on the row) is treated as hand-edited: it is kept, and the new version lands
  beside it as `<name>.v2.<ext>` with a warning naming both.
- **Model output is data.** It is validated against the zod schema
  (`lib/vigil/creative/schema.ts`) before use, stripped of control characters,
  bounded in length, and only ever serialised into `intelligence/*.json` and
  `creative-directive.md`. No model text chooses a path or reaches
  `ASTRA_INSTRUCTIONS.md`, which is rendered from a versioned template with no
  customer text at all.
- **Prompt injection.** Customer text is fenced as data in the user message;
  the system prompt states it must be interpreted, not obeyed. The Astra
  instructions say the same about every file under `source/`, `client-assets/`
  and `intelligence/`.
- **Secrets.** Nothing from the environment, no signed URLs, no bucket names
  and no storage object paths are written to Git. Assets kept in storage are
  identified by `project_asset:<id>`; staff download them from the customer's
  Files page.
- **Personal data.** `progress`, `kickoff`, `domain.domainId` and
  `strategy.approver.email` are removed from the snapshot and from the model
  input; the list is recorded in `workspace.json` under `source.redactions`.

## Document text

PDFs of kind `document` (and any PDF at or under `CREATIVE_DOCUMENT_TEXT_MAX_BYTES`,
default 15 MB) are downloaded and their **text layer** read with `pdf-parse`
(`lib/vigil/creative/documents.ts`): no rendering, no OCR, nothing executed.
The normalised text (control characters stripped, capped at
`CREATIVE_DOCUMENT_TEXT_MAX_CHARS` per document, default 20 000) is fenced as
data in the Terra request after the brief — documents are cut before the brief
ever is — and written to `source/documents/<name>.txt` with a header saying it
is a mechanical extraction. A scanned PDF yields a warning ("no text layer")
and is otherwise listed like any asset. `CREATIVE_DOCUMENT_TEXT=false` turns
it off. Document text is part of the source checksum, so a changed PDF
re-runs Terra. Astra is expected to look at the PDFs themselves; the text is
for Terra and for search.

## Asset policy

Every `project_assets` row for the project gets a manifest entry (stable id,
original and safe filename, category, MIME type, size, sha256, availability,
reason, caption, upload time). The hash comes from the upload: since
migration `0026` the browser streams SHA-256 over each file
(`lib/vigil/checksum.ts`, slice by slice, so a 500 MB video never sits in
memory) and stores it on `project_assets.checksum`. `checksumSource` in the
manifest says what the value is: `upload` (listed as recorded; file stayed in
storage), `verified` (the stored bytes were downloaded and matched the upload
hash), `download` (computed now; the row predates 0026 or the upload could not
hash). A mismatch between stored bytes and the upload hash is a warning and is
recorded on the entry. Files at or under
`CREATIVE_ASSET_INLINE_MAX_BYTES` (default 5 MB) whose type is not in
`CREATIVE_ASSET_EXTERNAL_TYPES` (default `video/`) are copied into
`client-assets/<category>/`. Everything else stays in storage and is
represented by the manifest entry plus a small `<name>.reference.json`.
Filenames are sanitised to `[A-Za-z0-9._-]`, the extension comes from the MIME
type, and collisions get `-2`, `-3` … in upload order. A file storage cannot
return is marked `failed` and warned about; the run continues.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `CREATIVE_PROVIDER` | `openai` | `openai` or `null` (never call a model; workspace is written with a warning) |
| `OPENAI_API_KEY` | — | Required for Terra. Unset = intelligence missing, status `ready_with_warnings` |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | |
| `CREATIVE_MODEL` | `gpt-5.6-terra` | Model id sent to the Responses API |
| `CREATIVE_REASONING_EFFORT` | `medium` | `minimal` / `low` / `medium` / `high` |
| `CREATIVE_MAX_OUTPUT_TOKENS` | `16000` | |
| `CREATIVE_MAX_INPUT_CHARS` | `60000` | Brief text sent to the model; longer briefs are truncated with a marker |
| `CREATIVE_REQUEST_TIMEOUT_MS` | `180000` | |
| `CREATIVE_ASSET_INLINE_MAX_BYTES` | `5242880` | Git inclusion limit |
| `CREATIVE_ASSET_EXTERNAL_TYPES` | `video/` | MIME prefixes never committed |
| `CREATIVE_DOCUMENT_TEXT` | `true` | Read PDF text layers for Terra |
| `CREATIVE_DOCUMENT_TEXT_MAX_BYTES` | `15728640` | PDFs above this are not read |
| `CREATIVE_DOCUMENT_TEXT_MAX_CHARS` | `20000` | Characters kept per document |
| `CREATIVE_WORKSPACE_PROJECT_KINDS` | `professional,custom` | Kinds queued automatically after Create repository, or `all` |

Versions are constants in `lib/vigil/creative/config.ts`
(`CREATIVE_WORKFLOW_VERSION`, `CREATIVE_PROMPT_VERSION`,
`CREATIVE_SCHEMA_VERSION`, `CREATIVE_TEMPLATE_VERSION`). Bump the one that
changed; the idempotency key changes with it, so the next regeneration
produces fresh output instead of reusing the cache.

The GitHub token (`GITHUB_TOKEN`) needs **Contents: write**, as it already does
for Create repository. The job runner needs the service role
(`SUPABASE_SECRET_KEY`) to download from the private `project-assets` bucket.
The Terra call can take a couple of minutes on a long brief; the job's
`max_attempts` is 6 and the runner lease is 300 s.

## Database

Migration `0026` adds `project_assets.checksum` (nullable sha256 hex, set at
upload, protected from customer edits). Migration `0025` adds `creative_workspaces` (one row per website, staff-only
RLS, same-organization trigger, status check constraint). It holds the status,
versions, model id, source checksum, idempotency key, the validated
intelligence (cache), `generated_files` (path → blob sha), warnings, error,
asset counts, commit sha and timestamps. Apply with
`npx supabase@latest db push`; types were regenerated for this table.

## Failures and retries

| Symptom | Where it shows | What to do |
| --- | --- | --- |
| `ready_with_warnings` "model provider is not configured" | Website page → Creative workspace | Set `OPENAI_API_KEY`, click Regenerate |
| `failed` with `provider_error` (Terra 5xx/429, GitHub 5xx) | Same, plus Jobs | The job retries itself with backoff; otherwise Regenerate |
| `failed` "Terra output failed schema validation" | Same | Retried automatically; if persistent, check the model id and `CREATIVE_MAX_OUTPUT_TOKENS` |
| `failed` "Terra: You have no credits remaining" (429) | Same | Add credits to the OpenAI organization; the job retries on its own, or Regenerate |
| `failed` "Create the customer repository before…" | Same | Create the repository first |
| Warning "was edited by hand and was kept" | Same | Expected: the regenerated version is beside the edited file as `.v2` |
| Asset `failed` in the manifest | `assets-manifest.json`, warnings | Check the object in Storage; Regenerate |

The failed run never changes the repository: the commit is the last step and is
all-or-nothing.

## Code map

```
lib/vigil/creative/
  config.ts      env + version constants + auto-generation policy
  status.ts      status vocabulary and labels
  schema.ts      zod schema + strict JSON schema for Terra output
  source.ts      source snapshots (raw JSON, brief markdown, requirements), redaction, checksum
  assets.ts      manifest planning, safe names, inclusion policy, reference files
  documents.ts   PDF text-layer extraction (pdf-parse), normalisation, caps
  terra.ts       CreativeModelProvider: OpenAI Responses call, null provider, prompt builder
  templates.ts   ASTRA_INSTRUCTIONS.md and README.md templates
  workspace.ts   deterministic file set + workspace.json
  publish.ts     one-commit publish with preservation rules
  service.ts     orchestration + creative_workspaces status
  enqueue.ts     job kind, keys, auto-generation lookup
lib/vigil/checksum.ts           streaming SHA-256 used by the upload controls
lib/vigil/providers/github.ts   getBranchHead / listTree / commitFiles (Git Data API)
lib/vigil/jobs.ts               website.creative_workspace handler; chained from website.repository
lib/vigil/actions/admin.ts      enqueueWebsiteJob accepts "website.creative_workspace"
components/vigil/CreativeWorkspaceCard.tsx   admin card
```

Tests: `lib/vigil/__tests__/creative-*.test.ts` and the Git Data cases in
`github.test.ts`.
