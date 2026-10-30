#!/usr/bin/env node
// Read-only configuration check. Never loads .env files, contacts a provider or enables flags.
const env = process.env;
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
check('Name.com selected', env.VIGIL_DOMAIN_REGISTRAR === 'namecom');
check('Production Name.com username', env.VIGIL_NAMECOM_USERNAME && !env.VIGIL_NAMECOM_USERNAME.endsWith('-test'));
check('Production Name.com token present', env.VIGIL_NAMECOM_TOKEN);
check('Stripe live secret present', /^(sk|rk)_live_/.test(env.VIGIL_DOMAIN_STRIPE_LIVE_KEY ?? ''));
check('Expected Stripe account recorded', /^acct_[A-Za-z0-9]+$/.test(env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID ?? ''));
check('Stripe live publishable key present', /^pk_live_/.test(env.NEXT_PUBLIC_VIGIL_DOMAIN_STRIPE_LIVE_KEY ?? ''));
check('Stripe live webhook signing secret present', /^whsec_/.test(env.VIGIL_DOMAIN_STRIPE_LIVE_WEBHOOK_SECRET ?? ''));
check('Scheduled runner secret present', env.CRON_SECRET);
check('Supabase server credential present', env.SUPABASE_SECRET_KEY);
check('Vercel deployment credential present', env.VERCEL_TOKEN);
check('Registrar lifecycle polling enabled', env.VIGIL_DOMAIN_LIFECYCLE_SYNC_ENABLED === 'true');
check('Lifecycle reminders enabled', env.VIGIL_DOMAIN_LIFECYCLE_NOTIFICATIONS_ENABLED === 'true');
let encryptionValid = false;
try {
  const keys = JSON.parse(env.VIGIL_DOMAIN_ENCRYPTION_KEYS ?? '{}');
  encryptionValid = keys && typeof keys === 'object' && !Array.isArray(keys) && /^[A-Za-z0-9_-]{1,64}$/.test(env.VIGIL_DOMAIN_ACTIVE_KEY_ID ?? '') && Boolean(keys[env.VIGIL_DOMAIN_ACTIVE_KEY_ID]) && Object.entries(keys).every(([id, key]) => /^[A-Za-z0-9_-]{1,64}$/.test(id) && typeof key === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(key) && Buffer.from(key, 'base64').length === 32);
} catch { /* Report the invalid setting without exposing it. */ }
check('Valid tenant encryption keyring', encryptionValid);
let registrarWebhook = false;
try { registrarWebhook = new URL(env.VIGIL_NAMECOM_WEBHOOK_URL ?? '').protocol === 'https:' && Boolean(env.VIGIL_NAMECOM_WEBHOOK_TOKEN); } catch { /* No secret values in output. */ }
check('Name.com notification signing configuration present', registrarWebhook);
const report = {
  scope: 'configuration-only',
  networkRequests: 0,
  mutations: 0,
  configurationComplete: checks.every(c => c.passed),
  flags: {
    engine: env.VIGIL_DOMAIN_ENGINE_ENABLED === 'true',
    live: env.VIGIL_DOMAIN_LIVE_ENABLED === 'true',
    cloudflare: env.VIGIL_DOMAIN_CLOUDFLARE_ENABLED === 'true',
  },
  checks,
  stillRequires: ['Verified provider account identities and permissions', 'Reviewed migrations and immutable website/domain policies', 'Approved registrar ownership, tax, terms and retention', 'Vendor webhook delivery acceptance', 'Explicit restricted release, domain cost and DNS approval', 'Production client walkthrough and DNS/HTTPS acceptance'],
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.configurationComplete ? 0 : 1;
