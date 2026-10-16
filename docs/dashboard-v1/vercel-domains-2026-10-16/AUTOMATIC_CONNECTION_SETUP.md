# Automatic connection: remaining setup

The search, prices, saved Vercel handoff and separate centered setup guides are
implemented. **Automatic connection is not complete or enabled.** The original
implementation prompt requires proof using authorized real provider fixtures
before implementing and releasing the DNS connection worker.

## Completed account preparation

- Registered **Vigil Domain Connect** in `vigilstudio-projects`.
- Client ID: `cl_GiSu5jiCuN4CIQlbRkMFDRYmpYc2c3CW` (public, not a secret).
- [App settings](https://vercel.com/vigilstudio-projects/~/settings/apps/cl_GiSu5jiCuN4CIQlbRkMFDRYmpYc2c3CW).
- [Permissions](https://vercel.com/vigilstudio-projects/~/settings/apps/cl_GiSu5jiCuN4CIQlbRkMFDRYmpYc2c3CW/permissions):
  observed only the four OpenID scopes, with no Domains resource permission.
- No client secret, installed grant, DNS change or purchase was made. No callback
  is configured because a working authorization handler has not been released.

## What Javier needs to do

1. Send the message below through the existing team's
   [Vercel Support](https://vercel.com/vigilstudio-projects/~/support). Ask for
   Domains resource permission eligibility for this app and confirmation of the
   DNS endpoints/token lifecycle. A normal identity app alone cannot edit DNS.
2. Designate **one existing disposable domain in a separate Vercel account/team**
   whose owner explicitly authorizes the reversible connection test. Identify the
   hostname and owner/team, and authorize temporary challenge/test records,
   fixture project association, revocation and restoration. Use a domain with no
   production website/email dependency. No domain purchase is required for QA;
   Scar's real domain is not the test fixture. Do not send passwords or tokens.
3. When the scoped consent flow is ready, the fixture account owner will approve
   it on Vercel. After the fixture passes and the implementation is validated,
   actual customers will do the same short consent step in their own account.

### Message ready to send (not sent)

> We are building a Vercel-only customer-domain connection in the Vigil dashboard.
> Our team is `vigilstudio-projects`. The registered app is **Vigil Domain
> Connect**, client ID `cl_GiSu5jiCuN4CIQlbRkMFDRYmpYc2c3CW`. Its Permissions page
> currently exposes only OpenID scopes. Please enable or confirm eligibility for
> customer-consented **Domains Read and Write** resource access, without Domain
> Registrar buying/transfer or Billing permissions.
>
> Customers purchase and retain registration, billing, renewals and transfer
> control in their own Vercel team. Vigil hosts the website project in a separate
> team. We need supported DNS list/create/update/delete access and cross-team TXT
> verification/project association without registration transfer or account moves.
> Please confirm the exact permission identifiers, DNS API coverage, team/domain
> restrictions, consent/install flow, refresh/expiry/revocation behavior, and how
> to test this reversibly without redirecting an existing live hostname before
> launch. Customer Project Write is not needed for our separately owned project.
>
> Classic Integration OAuth documents DNS and registrar buying/transfer together
> under domain Write. Is a DNS-only grant supported there, or must we use resource
> permissions? We must not request purchase permission for an external-checkout
> workflow. We have not purchased or modified a customer domain for QA.

## What remains for implementation after access is available

This is engineering work, not another setting for Javier or Scar to locate.
Configure the exact server callback and securely stored app credentials, then
prove scoped customer authorization, cross-team ownership verification,
reversible DNS writes, revocation and cleanup with the authorized fixture.
Keep Connect disabled until that evidence passes Phase 0.

Then implement the tenant/site/name/version-bound consent flow, Vault-backed
grant storage, atomic durable connection jobs, cancellation/revocation and stale
worker guards, conflict-aware record planning, approved-production deployment
guards, expected-site HTTPS/SSL checks and completion notification outbox. Test
and validate in isolated Preview before enabling it on the shared dashboard.
Setting `DOMAIN_HANDOFF_ENABLED=true` enables search/handoff only.

Scar can already search and buy directly in her own Vercel account. She cannot
yet rely on unattended connection. No Scar launch is authorized by this setup;
her Preview, reviews, content, contact activation and production DNS stay under
the existing release boundaries.
