import "server-only";
import { createHash, createPrivateKey, randomBytes, sign } from "node:crypto";
import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import { normalizeDomain } from "./normalize";
import { DomainEngineError } from "./errors";
import type { ExpectedDnsRecord } from "./contracts";

export async function discoverDomainDns(
  fqdn: string,
  resolver: Pick<typeof dns, "resolveNs" | "resolveTxt"> = dns,
) {
  const normalized = normalizeDomain(fqdn);
  const nameservers = await resolver
    .resolveNs(normalized.registrableDomain)
    .catch(() => []);
  const hints = await resolver
    .resolveTxt(`_domainconnect.${normalized.registrableDomain}`)
    .catch(() => []);
  // TXT values are untrusted discovery hints; never fetch arbitrary URLs from DNS.
  const hint = hints.map((chunks) =>
    chunks.join("").toLowerCase().replace(/\.$/, ""),
  );
  const provider = nameservers.some((ns) =>
    ns.toLowerCase().endsWith(".ns.cloudflare.com"),
  )
    ? "cloudflare"
    : nameservers.some((ns) => ns.toLowerCase().endsWith(".vercel-dns.com"))
      ? "vercel"
      : null;
  return {
    fqdn: normalized.fqdn,
    nameservers,
    dnsProvider: provider,
    domainConnectAdvertised: hint.length > 0,
  };
}

export function createDnsCallbackNonce() {
  const nonce = randomBytes(32).toString("base64url");
  return { nonce, digest: createHash("sha256").update(nonce).digest("hex") };
}

/** Offline URL builder; templates and key publication must be approved separately. */
export function createDomainConnectApplyUrl(input: {
  provider: "cloudflare" | "vercel";
  urlSyncUX: string;
  fqdn: string;
  records: ExpectedDnsRecord[];
  callbackOrigin: string;
  authorizationId: string;
  nonce: string;
  privateKeyPem: string;
  keyHost: string;
  providerTemplateApproved: boolean;
}) {
  if (!input.providerTemplateApproved)
    throw new DomainEngineError(
      "dns_template_unapproved",
      "This DNS provider requires assisted setup until its integration is approved.",
      403,
    );
  const fqdn = normalizeDomain(input.fqdn, { registration: true }).fqdn;
  const base = new URL(input.urlSyncUX);
  const origin = new URL(input.callbackOrigin);
  const allowed =
    input.provider === "cloudflare"
      ? "https://dash.cloudflare.com"
      : "https://vercel.com";
  if (
    base.origin !== allowed ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    !/^_[a-zA-Z0-9_-]{1,62}$/.test(input.keyHost) ||
    !/^[A-Za-z0-9_-]{43}$/.test(input.nonce) ||
    !/^[0-9a-f-]{36}$/i.test(input.authorizationId)
  )
    throw new DomainEngineError(
      "dns_authorization_invalid",
      "The DNS authorization could not be prepared.",
    );
  const records = websiteOnlyRecords(input.records);
  const callback = new URL("/api/domain-engine/dns/callback", origin);
  callback.searchParams.set("request", input.authorizationId);
  callback.searchParams.set("nonce", input.nonce);
  const params = new URLSearchParams({
    domain: fqdn,
    apexIPv4: records.apex,
    wwwCname: records.cname,
    ownershipToken: records.token,
    redirect_uri: callback.toString(),
  });
  const key = createPrivateKey(input.privateKeyPem);
  if (
    key.asymmetricKeyType !== "rsa" ||
    (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
  )
    throw new DomainEngineError(
      "dns_key_invalid",
      "The DNS signing key is not configured correctly.",
      503,
    );
  // Domain Connect excludes both key and sig from the signed query string.
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(params.toString()),
    key,
  ).toString("base64");
  params.set("key", input.keyHost);
  params.set("sig", signature); // Cloudflare requires sig last.
  return `${base.toString().replace(/\/$/, "")}/v2/domainTemplates/providers/vigilstudios.co/services/website/apply?${params.toString()}`;
}

function websiteOnlyRecords(records: ExpectedDnsRecord[]) {
  if (records.length !== 3)
    throw new DomainEngineError(
      "dns_change_set_invalid",
      "Review the exact website records before connecting.",
    );
  const apex = records.find(
    (record) => record.type === "A" && record.name === "@",
  );
  const cname = records.find(
    (record) => record.type === "CNAME" && record.name === "www",
  );
  const proof = records.find(
    (record) => record.type === "TXT" && record.name === "_vigil",
  );
  if (
    !apex ||
    !cname ||
    !proof ||
    isIP(apex.value) !== 4 ||
    !/^vigil-verify=[a-f0-9]{32}$/.test(proof.value)
  )
    throw new DomainEngineError(
      "dns_change_set_invalid",
      "Review the exact website records before connecting.",
    );
  const target = normalizeDomain(cname.value).fqdn;
  if (!/\.vercel-dns(?:-[0-9]+)?\.com$/.test(target))
    throw new DomainEngineError(
      "dns_target_invalid",
      "The project DNS target could not be confirmed.",
    );
  return {
    apex: apex.value,
    cname: target,
    token: proof.value.slice("vigil-verify=".length),
  };
}
