<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Vigil Dashboard V1

The product (login, client dashboard, admin, checkout) lives under
`app/(vigil)`; the marketing site is `app/(site)`. Before touching it read
`docs/dashboard-v1/HANDOFF-CONTEXT.md` (current state and open work), then
`docs/dashboard-v1/ARCHITECTURE.md` and `IMPLEMENTATION_LOG.md`. Schema is
`supabase/migrations/*.sql` — validate with `npm run db:validate`, push with
`npx supabase@latest db push`, then regenerate `types/database.types.ts` with
`npx supabase@latest gen types typescript --linked --schema public --schema vigil`.
Authorization is RLS plus `lib/vigil/auth/session.ts`; `proxy.ts` only
redirects. Provider ids live only in `provider_links`. Plans, prices and
entitlements are rows, never constants.
