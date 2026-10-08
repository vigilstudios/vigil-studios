# Runtime reliability and cost audit — 2026-10-08

## Scope and conclusion

Audited published commit `4d08cd5` after its private-image egress fix. Reviewed
media signing/rendering, refresh/polling, uploads and ZIP downloads; job claiming,
retry/lease/result handling; billing event delivery and checkout recovery;
creative asset/model budgets; and the standalone Express authoring Lab.

Three additional failure paths were reproduced and corrected. These are separate
from the confirmed minute-by-minute gallery downloads that caused the egress
incident. There is no evidence that these additional paths caused that incident.
This is a targeted reliability/cost audit, not proof that every major bug is gone
or a complete security/tenant-isolation review of the entire application.

## Corrected findings

### 1. Canceled archives left upstream work alive

`lib/vigil/services/files-zip.ts` lacked a stream cancellation callback and fetch
AbortSignal. Closing an archive download could leave its original Storage fetch
open and the producer waiting for browser capacity until the invocation ended.
Its buffer limit counted 64 chunks, rather than bytes.

Cancellation now aborts the fetch, cancels its reader, terminates the archive,
and wakes producer waiters. The response has a 1 MiB queue threshold, plus the
current upstream chunk and archive metadata; this is not a total-memory cap.
Backpressure pauses source reads without a timer loop. Tests verify a canceled
pending fetch cancels even a late response, never starts the next file, and a
paused browser stops reading the current source around the queue threshold.

### 2. Failed or abandoned billing deliveries could be lost

The published inbox treated any existing event as an acknowledged duplicate,
even when its first handler failed. A Stripe retry could receive success without
recovering paid-order work. An unpublished failed-event retry patch was already
present in the working checkout; this release completes that recovery behavior.

Only processed/ignored events are acknowledged as completed duplicates. Failed
events are claimed atomically. Active duplicates return a retryable route error;
received records abandoned for ten minutes can be reclaimed atomically. The
Stripe route declares a 300-second platform duration, below that reclaim window.
Result/failure writes compare the delivery's claim timestamp so a superseded
handler cannot overwrite a newer delivery. No database migration is required.

Tests cover failed delivery then successful redelivery, concurrent retry,
completed duplicate, abandoned receipt, and superseded completion/failure writes.
Stripe's retry behavior is documented at
https://docs.stripe.com/webhooks#automatic-retries.

### 3. Jobs were leased before they could start

The runner claimed a batch under 300-second leases, then executed it sequentially.
A slow early job could consume the leases of later jobs, permitting another
worker to reclaim them before their handlers started. Final writes filtered only
by job ID and did not check database errors.

The runner claims one job immediately before executing it. It stops starting
jobs after a default 200-second budget and respects the caller's count limit.
Success/retry/failure writes require running status and the same worker/claim
timestamp, check write errors, and reject lost ownership. The jobs route declares
300 seconds. These checks protect queue state; they do not make external provider
side effects transactional or interrupt a handler that has already started.

The background runner may pick up child jobs created during its invocation.
Checkout/webhook callers explicitly run at most one job so repository/model work
stays in the background. Tests cover waiting jobs retaining their original
queued state, elapsed budget, lost ownership, and database failure on completion.
Existing checkout/reconciliation behavior remains covered.

## Other paths reviewed

- The initial image fix retains valid signed URLs and refreshes only when needed;
  domain/deployment polling pauses in hidden/offline tabs; Lab automatic refresh
  is disabled. No additional repeating download loop was found in these paths.
- Upload retries are bounded. Archive links are explicit downloads. Video gallery
  tiles do not automatically fetch source videos.
- Creative source budgets cap individual files at 25 MB and the asset workspace
  at 600 MB; model calls have a 180-second timeout and bounded input/output.
  Persisted intelligence is reused. These limits do not establish a spending cap.
- Standalone Lab drafts and JSON exports use browser storage/downloads. Authoring
  the three Express designs does not make a Supabase request per keystroke.
  Authentication, data reads and intentional uploads/downloads still use services.

## Validation

- 77 test files / 1,594 tests passed (nine new regression cases versus the initial
  release); focused cancellation, jobs, webhook, checkout and reconciliation
  tests also passed.
- Type checking and full ESLint passed.
- Optimized production build passed with production configuration. Public-pricing
  reads reported Supabase's existing `exceed_egress_quota` restriction and used
  the existing fallback. A successful build does not prove live login is restored.
- All committed migrations and RLS assertions passed in a disposable local
  PostgreSQL database. No production database or billing setting was changed.

## Remaining limits and follow-up

- Live authenticated login, Stripe delivery, Storage disconnect propagation and
  real concurrent provider jobs were not exercised against production. The
  quota restriction blocks full authenticated verification. Unit regressions use
  real Node Web Streams and a fake database client; local RLS tests use PostgreSQL.
- Platform termination or a lost provider response can still leave an external
  side effect uncertain. Queue ownership checks prevent stale row updates, not
  every possible repeated external operation. Long-running handlers must retain
  provider idempotency and need separate fault-injection verification.
- The pre-existing Supabase Preview migration-history check fails because remote
  versions are absent from the published migration tree. It is separate from
  these application fixes; migration history must be reconciled deliberately.
- Login still labels infrastructure/auth failures as incorrect credentials. This
  is a separate error-message issue, not a cause of the egress incident.
- Unpublished Professional pipeline/provider/schema edits in the shared working
  checkout were excluded from this release. They require their own release audit.
- Post-restoration traffic must be checked in Supabase to confirm actual Storage
  transfer falls and that no other traffic source is producing large responses.
  Passing tests alone cannot guarantee a future invoice amount.

## Release

Follow-up patch is isolated on `codex/runtime-audit`, based on the deployed
image fix. Owner previously authorized pushing the incident fix; these related
reliability corrections follow that authorization. Deployment state is recorded
in the shared implementation log after verification.
