#!/usr/bin/env node
// Read-only provider acceptance. Never creates payments, subscriptions, domains,
// DNS records, policies or deployments. Pass credentials through the environment.
const env = process.env;
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed, ...(detail === undefined ? {} : { detail }) });
async function get(url, headers = {}) {
  try {
    const response = await fetch(url, { headers, redirect: "error", signal: AbortSignal.timeout(15000) });
    let data;
    try { data = await response.json(); } catch { /* Only status is needed for some checks. */ }
    return { status: response.status, data };
  } catch {
    return { status: null };
  }
}

const nameConfigured = Boolean(env.VIGIL_NAMECOM_USERNAME && !env.VIGIL_NAMECOM_USERNAME.endsWith("-test") && env.VIGIL_NAMECOM_TOKEN);
check("Production registrar credentials supplied", nameConfigured);
if (nameConfigured) {
  const headers = { Authorization: `Basic ${Buffer.from(`${env.VIGIL_NAMECOM_USERNAME}:${env.VIGIL_NAMECOM_TOKEN}`).toString("base64")}` };
  const [hello, balance, notifications] = await Promise.all([
    get("https://api.name.com/core/v1/hello", headers),
    get("https://api.name.com/core/v1/accountinfo/balance", headers),
    get("https://api.name.com/core/v1/notifications", headers),
  ]);
  check("Production registrar authentication", hello.status === 200, { http: hello.status });
  check("Registrar prepaid credit available", balance.status === 200 && typeof balance.data?.balance === "number" && balance.data.balance > 0,
    { http: balance.status, balanceUsd: typeof balance.data?.balance === "number" ? balance.data.balance : null });
  const subscriptions = notifications.data?.subscriptions;
  check("Registrar notification subscriptions readable", notifications.status === 200 && Array.isArray(subscriptions),
    { http: notifications.status, count: Array.isArray(subscriptions) ? subscriptions.length : null });
}

const stripeConfigured = /^(sk|rk)_live_/.test(env.VIGIL_DOMAIN_STRIPE_LIVE_KEY ?? "");
check("Production billing credential supplied", stripeConfigured);
if (stripeConfigured) {
  const headers = { Authorization: `Bearer ${env.VIGIL_DOMAIN_STRIPE_LIVE_KEY}` };
  const [account, endpoints, tax, registrations] = await Promise.all([
    get("https://api.stripe.com/v1/account", headers),
    get("https://api.stripe.com/v1/webhook_endpoints?limit=100", headers),
    get("https://api.stripe.com/v1/tax/settings", headers),
    get("https://api.stripe.com/v1/tax/registrations?limit=100", headers),
  ]);
  check("Stripe account identity and charging eligibility", account.status === 200 && account.data?.id === env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID && account.data?.charges_enabled === true && account.data?.details_submitted === true,
    { http: account.status, accountMatches: account.data?.id === env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID, chargesEnabled: account.data?.charges_enabled === true, detailsSubmitted: account.data?.details_submitted === true });
  const webhook = endpoints.data?.data?.find(item => item.url === "https://www.vigilstudios.co/api/webhooks/domain-stripe-live");
  check("Separate domain webhook staged", Boolean(webhook), { http: endpoints.status, status: webhook?.status ?? "missing", apiVersion: webhook?.api_version ?? null, eventCount: webhook?.enabled_events?.length ?? 0 });
  check("Stripe Tax configuration active", tax.status === 200 && tax.data?.status === "active", { http: tax.status, status: tax.data?.status ?? null });
  check("Stripe Tax has an active registration", registrations.status === 200 && registrations.data?.data?.some(item => item.status === "active"),
    { http: registrations.status, activeRegistrationCount: registrations.data?.data?.filter(item => item.status === "active").length ?? 0 });
}

let databaseUrl;
try {
  const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (url.protocol === "https:" && url.hostname === "fotqwyfoqzjmcchwjpof.supabase.co" && !url.username && !url.password) databaseUrl = url.origin;
} catch { /* Never send production credentials to an unrecognized destination. */ }
check("Expected production database configured", Boolean(databaseUrl && env.SUPABASE_SECRET_KEY));
if (databaseUrl && env.SUPABASE_SECRET_KEY) {
  const headers = { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` };
  for (const table of ["websites", "domain_purchase_intents", "domain_orders", "domain_registrations"]) {
    const result = await get(`${databaseUrl}/rest/v1/${table}?select=id&limit=0`, headers);
    check(`Production table: ${table}`, result.status === 200 || result.status === 206, { http: result.status });
  }
}

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  scope: "production-read-only-provider-checks",
  mutations: 0,
  checks,
  readyForGeneralAccess: false,
  interpretation: "Successful account checks do not establish customer tax treatment, registrar funding sufficiency, vendor delivery acceptance, deployment readiness, or a verified live customer journey.",
}, null, 2));
process.exitCode = checks.every(item => item.passed) ? 0 : 1;
