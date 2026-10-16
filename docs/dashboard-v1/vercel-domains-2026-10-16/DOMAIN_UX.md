# Domain choice flow — 16 October 2026

The Domain page begins with two icon cards: **Find your domain** and **Already
own one**. Selecting either shows only that path, with a link back to all options.
The find path advances from a name search to price review, then the saved Connect
step after external handoff. Price review hides the search form; choosing another
name hides the saved connection panel until the customer finishes or returns.

The owned path first asks for the address, then navigates to that domain's setup
guide after a successful save. Existing domains show one guide at a time, with
secondary connection details collapsed. Connected state and prelaunch readiness
remain distinct. Existing registrar guidance is retained; this is not a new DNS
automation implementation or a substitute for the planned automated Vercel path.

Returning customers resume a saved handoff or an existing domain directly.
An explicit `flow=choose` returns to both options without cancelling anything.
Overview links carry the website identity so multiple sites resume the correct
saved choice. Multi-site customers select one website before a new search.

## Who does what for automatic connection

This is unfinished integration work, not a missing setting in Scar's dashboard.

- **Implementation work:** establish the supported authorization mechanism and
  minimum permissions, configure the Vercel app, implement secure consent/token
  storage, then prove a reversible cross-account fixture. Only after Phase 0
  passes, implement the durable DNS worker, launch guards and completion delivery.
- **Account-owner actions:** approve the app's access in Vercel when the exact
  permissions are ready, and expressly designate an existing disposable domain
  in a separate account for testing. Do not use Scar's domain or infer consent
  from her Vigil account, purchase intent or review approvals. No purchase is
  needed or authorized for QA.
- **Provider dependency:** confirm an acceptable DNS permission path. Classic
  Integration OAuth documents DNS and registrar operations under the same broad
  domain-write scope; newer resource permissions are marked private beta. That
  scope question remains unresolved. The inquiry in `FEASIBILITY.md` is prepared
  but unsent; no third-party support message is authorized by this UI request.

Customer consent must eventually occur in the customer's own Vercel account.
The target remains search → purchase in Vercel → consent/Connect in Vigil, with
no customer password, pasted broad token or manual DNS chores for the new flow.
Until the gate is proven, the UI explicitly says connection needs Vigil's help
before external purchase and keeps automatic Connect disabled afterward.

## Validation and release

Fresh local suite: 2,389 tests / 119 files, including eight route/choice regressions
covering exclusive paths, saved resume, explicit back, website identity and the
discovery rollback switch. Typecheck, lint and disposable migration/RLS checks
pass. Build, hosted browser and release receipts follow after verification.

No schema, provider scope, DNS, registrar purchase, customer launch, review,
content or contact-activation change is part of this slice.
