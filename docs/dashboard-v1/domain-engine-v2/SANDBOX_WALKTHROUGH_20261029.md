# Vigil domain walkthrough — October 29, 2026

**Sandbox only.** Actual application + local Supabase + Name.com sandbox + Stripe test. No real charge, production registration, production DNS change or release.

Created **Vigil — Test Client** and tested `vigil-domain-pilot-20261029.com`. The requested `vigil.com` is unavailable; `.co`/`.ai` are outside the currently supported registration scope and are already in use/offered for resale.

**Verified money flow:** $17.99 registrar test credit + $5.00 Vigil test fee = $22.99 captured in Stripe test mode. One order, one asset and one matching Stripe charge survived three reconciliation replays and two locally signed replays of an actual received event. No new jobs or registrar writes resulted from those replays.

**Verified DNS:** three website records added; all four original mail/security records unchanged; seven records total; zero missing website records; consumed DNS approval replay made no write.

**Acceptance boundary:** Email verification remains pending for the fictional address. Public DNS, HTTPS, a real Vercel project and the production dashboard/onboarding entry points are not accepted by this sandbox run.

This is the standalone `/domain-engine-test` surface using the actual domain components, not a deployed production dashboard screenshot. The existing test environment was backed up before applying prepared migrations 51–53 locally. No production policy or credential was installed.

The sandbox quote route was updated to include a configurable test-only fee and total ceiling. Production pricing continues to use durable approved policy rows. The test backend enforces the isolated database and test-mode keys.

[Machine-readable acceptance evidence](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/acceptance.json)

1. **Choose a setup path.** The fictional Vigil client opens the actual domain workspace in the local Next.js app.

![Step 1: Choose a setup path — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/01-domain-options.jpg)

2. **Requested domain unavailable.** The sandbox correctly refuses vigil.com. The real registry also reports it registered. The test uses a separate sandbox-only name.

![Step 2: Requested domain unavailable — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/02-requested-domain-unavailable.jpg)

3. **Search and first-year price.** Name.com sandbox quotes $17.99; Vigil adds the approved $5 test fee, showing $22.99 to the client. The renewal estimate shown is $19.99.

![Step 3: Search and first-year price — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/03-availability-and-price.jpg)

4. **Registrant, itemized total and consent.** Fictional client details, manual renewal, registrar disclosure and exact one-year $22.99 test approval. Tax is zero only for this fixture.

![Step 4: Registrant, itemized total and consent — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/04-registrant-price-and-consent.jpg)

5. **Restore the existing unpaid order.** An interrupted checkout restored the same unpaid order. Resume reopened the same Stripe session; no replacement order or registration was submitted.

![Step 5: Restore the existing unpaid order — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/05-order-restored-before-payment.jpg)

6. **Embedded Stripe test checkout.** Actual embedded Stripe Checkout shows $22.99 and Test Mode. Only Stripe test card details were used; this screenshot excludes entered card data.

![Step 6: Embedded Stripe test checkout — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/06-stripe-test-checkout.jpg)

7. **Stripe authorization accepted.** Stripe confirms the test authorization. This screen alone is not capture proof; subsequent server reconciliation verified capture.

![Step 7: Stripe authorization accepted — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/07-stripe-test-authorization-confirmed.jpg)

8. **Uncertain registrar response handled safely.** Name.com sandbox initially returned an uncertain result. Vigil paused and reconciled the original receipt, without another purchase.

![Step 8: Uncertain registrar response handled safely — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/08-registrar-reconciliation.jpg)

9. **Registration and exact capture confirmed.** The original receipt and approved owner reconciled. Vigil captured $22.99 in Stripe test mode and displayed registration, expiry, manual renewal and pending email verification.

![Step 9: Registration and exact capture confirmed — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/09-registered-and-payment-confirmed.jpg)

10. **Choose the website.** The paid registration is bound to the fictional Vigil website. Deployment recommendations come from the explicitly isolated test fixture.

![Step 10: Choose the website — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/10-website-selected.jpg)

11. **Review exact website records.** The client approves only the three shown website/proof records in the Name.com sandbox. The four existing mail/security fixtures remain outside the write plan.

![Step 11: Review exact website records — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/11-exact-dns-plan-and-consent.jpg)

12. **Sandbox DNS saved.** The application saves the records and clearly retains pending public DNS, HTTPS and approved Deploy Live. It does not invent a live connection.

![Step 12: Sandbox DNS saved — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/12-sandbox-dns-saved.jpg)

13. **Mobile client view.** The 390 × 844 viewport has document/body width 390px, with no horizontal overflow. This captures the same actual sandbox order.

![Step 13: Mobile client view — sandbox only](/Users/belierjavier/.codex/worktrees/vigil-domain-engine-v2/docs/dashboard-v1/domain-engine-v2/evidence/2026-10-29-sandbox/13-mobile-dns-saved.jpg)

## What remains for live client acceptance

A genuine owner and available domain; production Name.com credentials/funding and account arrangements; reviewed terms/tax/retention; verified vendor webhooks; a restricted release on current main; owner email verification; actual approved Vercel launch/public DNS/HTTPS; desktop/mobile screenshots from both production entry points. The approved recommendations do not make fictional registrant details suitable for a live registration.

The first checkout was interrupted and recovered via Resume; a fresh production browser run must verify that the initial transition is smooth. Sandbox registrar receipt latency also needs production acceptance. These are retained observations, not hidden passed checks.

Current application checks: **166 files / 2,936 tests**, TypeScript and lint passed. See `evidence/2026-10-29-sandbox/verification.json` for final build status.
