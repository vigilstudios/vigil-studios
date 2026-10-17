# Guided domain setup — supported manual flow

The customer explicitly chose full guided setup instead of the beta OAuth route.
No beta app, resource grant, pasted token or customer DNS automation is used.
Registration, billing and renewal stay in the customer's account. The previously
prepared beta-access inquiry is not a prerequisite for this manual flow.

Domain and onboarding show one current task. Provider selection, sign-in, each
menu action, record type, name, value and Save each occupy their own screen.
Only one record field/value is displayed at a time. Back, copy feedback, retry,
help and locally saved step progress are supported. Domain identity and purchase
intent remain durable server state; the exact navigation cursor is local to the
browser and is reset if the provider/record requirements change. Navigation and
self-reported saving never claim purchase, ownership or connection success.

The saved Vercel purchase handoff now offers Set up with the selected hostname
and website prefilled. Saving an already-added domain on the same tenant/site
resumes it without duplication or re-staging an active provider association.
Onboarding can resume that same saved domain without overwriting other answers.
Existing registrar instructions remain supported as manual guidance.

Prelaunch setup publishes only a row-specific `_vigil` TXT ownership proof.
Public DNS verifies the exact token, without A/CNAME cutover, nameserver changes,
provider registration claims or preview association. Once verified the guide
shows one waiting-for-launch screen. Existing review/artifact/production gates
remain: a deliberate authorized production publish is still required. The
ownership-only staged requirements avoid a circular dependency in which a
customer would have to redirect an existing website before an approved build.

After production activation, the guide shows the current provider TXT/routing
requirements. Vercel DNS targets come from its current project-scoped config
response; no hardcoded target is substituted if recommendations are missing.
The activation service verifies current reviews, the saved production artifact and the provider’s actual Production status. Completion checks the canonical hostname’s alias against the exact expected Vercel project and deployment. A later purchase can use an existing eligible production build after ownership proof without triggering another deploy. A later Preview cannot detach a pending approved-production association; a lost connection falls back only to an approved Production URL.

Full record names are converted to the zone-relative names used by DNS forms.
An already observed ownership proof is not presented for re-entry. Connection
success requires the existing server verification (project verification, public
DNS, HTTPS/SSL and reachability), never clicking Continue. All work remains
separate from customer-site launch authorization. Staff viewing Scar is for
read-only presentation checks; no Scar domain, review, source or contact changes
are authorized as QA.

Validation and Preview/release receipts are saved under evidence/guided-setup.
The real customer DNS edit is intentionally manual; no real domain purchase or
DNS cutover is a test transaction. The earlier automatic-connection feasibility
gate remains unproven and unattended DNS stays disabled. Domain Connect template
onboarding is outside this release.
