# Vigil Domain Engine v2

The final audit and production release were authorized on 30 October 2026. **Automated purchasing and DNS admission remain disabled pending real-client activation.** The reviewed domain migrations are installed in production; see the release record for checks and activation requirements.

- [Current purchase-policy and live-acceptance preparation](PURCHASE_POLICY_20261030.md): enabled signed receivers/lifecycle runtime, approved limits, recommended funding and the remaining business inputs. Domain terms are an unpublished draft.
- [Final audit and release record](FINAL_AUDIT_AND_RELEASE_20261030.md).
- [Earlier production preparation and release sequence](PRODUCTION_PREPARATION_20261029.md): verified provider setup, funding protection, migrations, validation, remaining activation steps and rollback.
- [Client UI/UX handoff](CLIENT_UI_HANDOFF.md): current dashboard/onboarding integration points, API contracts, state/consent requirements and screenshot acceptance.
- [Actual sandbox purchase and DNS walkthrough](SANDBOX_WALKTHROUGH_20261029.md): fictional customer, actual Name.com sandbox and Stripe test-mode capture, preserved mail records and clearly labelled limitations.
- [Reviewed release migration manifest](evidence/release-migrations-20261029.json).
- [Production-schema rehearsal](evidence/production-schema-rehearsal-20261029.json): production schema only, fictional test data, no production changes.

New registrations use Name.com with explicit customer registrant contacts and Stripe authorization followed by capture after registration confirmation. Clients need no Vercel account. Existing Vercel deployment, preview/live approvals, tenant authorization, Supabase queues and website billing remain in place.

Initial scope: ordinary non-premium `.com`, one year, manual renewal, approved website policies and spending ceilings. Existing-domain Cloudflare automation requires a scoped client token and exact DNS-plan consent; other hosts retain assistance/guides. Automatic paid renewals, automatic transfers and automated evidence erasure are not included.

Default-off flags, private account/website policies, explicit client approval and server-side reconciliation are independent gates. Do not substitute sandbox success, a browser callback or an enabled flag for production purchase/DNS authority. Operator configuration and account-specific evidence stay out of the client bundle and repository.
