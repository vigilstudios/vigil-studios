import "server-only";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";
import { normalizeDomain } from "./normalize";
import { DomainEngineError } from "./errors";
import type { ExpectedDnsRecord } from "./contracts";

const recordSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{32}$/),
  type: z.string(),
  name: z.string(),
  content: z.string(),
  ttl: z.number().int(),
  proxied: z.boolean().optional(),
  comment: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});
export type CloudflareRecord = z.infer<typeof recordSchema>;
export type CloudflareDnsChange = {
  operation: "create" | "delete" | "update";
  before: CloudflareRecord | null;
  after: {
    type: "A" | "CNAME" | "TXT";
    name: string;
    content: string;
    ttl: number;
    proxied?: false;
  } | null;
};
export type CloudflareDnsPlan = {
  fqdn: string;
  zoneId: string;
  zoneName: string;
  snapshotDigest: string;
  changes: CloudflareDnsChange[];
  expected: ExpectedDnsRecord[];
};
const identifier = z.string().regex(/^[a-f0-9]{32}$/);

/** Supported Cloudflare REST API only. There is no zone/settings/nameserver write method. */
export class CloudflareDnsClient {
  constructor(
    private readonly accessToken: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    if (!accessToken)
      throw new DomainEngineError(
        "dns_credentials_missing",
        "Authorize your DNS provider before connecting.",
        403,
      );
  }
  async findZone(fqdn: string) {
    const base = normalizeDomain(fqdn).registrableDomain;
    const result = z
      .array(
        z.object({
          id: identifier,
          name: z.string(),
          status: z.string(),
          account: z.object({ id: identifier }),
        }),
      )
      .parse(
        await this.call(
          `/zones?${new URLSearchParams({ name: base, status: "active", per_page: "2" })}`,
        ),
      );
    const matches = result.filter(
      (zone) => zone.name === base && zone.status === "active",
    );
    if (matches.length !== 1)
      throw new DomainEngineError(
        "dns_zone_unavailable",
        "This Cloudflare authorization does not include an active DNS zone for your domain.",
        403,
      );
    return matches[0];
  }
  async records(zoneId: string) {
    identifier.parse(zoneId);
    const all: CloudflareRecord[] = [];
    for (let page = 1; page <= 100; page++) {
      const { result, result_info } = await this.request(
        `/zones/${zoneId}/dns_records?${new URLSearchParams({ per_page: "500", page: String(page) })}`,
      );
      const rows = z.array(recordSchema).parse(result);
      all.push(...rows);
      const totalPages = z
        .object({ total_pages: z.number().int().nonnegative() })
        .optional()
        .parse(result_info)?.total_pages;
      if (totalPages !== undefined ? page >= totalPages : rows.length < 500)
        return all;
    }
    throw new DomainEngineError(
      "dns_inventory_limit",
      "This DNS zone needs assisted review before changing records.",
    );
  }
  async prepare(
    fqdn: string,
    expected: ExpectedDnsRecord[],
  ): Promise<CloudflareDnsPlan> {
    const zone = await this.findZone(fqdn);
    return planCloudflareWebsiteDns(
      fqdn,
      zone.id,
      zone.name,
      await this.records(zone.id),
      expected,
    );
  }
  async apply(plan: CloudflareDnsPlan, authorize?:()=>Promise<void>) {
    identifier.parse(plan.zoneId);
    if(authorize)await authorize();else assertCloudflareDnsWriteApproved(plan.fqdn);
    const current = await this.records(plan.zoneId);
    if (matchesExpectedDns(current, plan.expected, plan.fqdn))
      return { applied: true, reconciled: true };
    if (dnsSnapshotDigest(current) !== plan.snapshotDigest)
      throw new DomainEngineError(
        "dns_records_changed",
        "Your DNS changed after review. Approve an updated connection plan.",
        409,
      );
    // Rebuild rather than trusting a saved/browser change set. This also protects mail records.
    const actual = planCloudflareWebsiteDns(
      plan.fqdn,
      plan.zoneId,
      plan.zoneName,
      current,
      plan.expected,
    );
    if (JSON.stringify(actual.changes) !== JSON.stringify(plan.changes))
      throw new DomainEngineError(
        "dns_plan_invalid",
        "Review the website connection plan again.",
        409,
      );
    if (!actual.changes.length) return { applied: true, reconciled: true };
    const deletes = actual.changes
      .filter((c) => c.operation === "delete")
      .map((c) => ({ id: c.before!.id }));
    const patches = actual.changes
      .filter((c) => c.operation === "update")
      .map((c) => ({ id: c.before!.id, ...c.after }));
    const posts = actual.changes
      .filter((c) => c.operation === "create")
      .map((c) => c.after);
    try {
      if(authorize)await authorize();
      await this.call(`/zones/${plan.zoneId}/dns_records/batch`, "POST", {
        deletes,
        patches,
        posts,
      });
    } catch {
      // A timeout is not permission to apply another batch. Inspect external truth once.
      if (
        matchesExpectedDns(
          await this.records(plan.zoneId),
          plan.expected,
          plan.fqdn,
        )
      )
        return { applied: true, reconciled: true };
      throw new DomainEngineError(
        "dns_outcome_unknown",
        "Cloudflare could not confirm the change. Vigil will reconcile this request before trying again.",
        503,
      );
    }
    if (
      !matchesExpectedDns(
        await this.records(plan.zoneId),
        plan.expected,
        plan.fqdn,
      )
    )
      throw new DomainEngineError(
        "dns_verification_pending",
        "Cloudflare is still confirming the expected records. No second change was submitted.",
        503,
      );
    return { applied: true, reconciled: false };
  }
  private async call(path: string, method = "GET", body?: unknown) {
    return (await this.request(path, method, body)).result;
  }
  private async request(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<{ result: unknown; result_info?: unknown }> {
    let response: Response;
    try {
      response = await this.fetcher(
        new URL(`/client/v4${path}`, "https://api.cloudflare.com"),
        {
          method,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        },
      );
    } catch {
      throw new DomainEngineError(
        "dns_provider_unavailable",
        "Cloudflare did not confirm this request.",
        503,
      );
    }
    const raw = await response.text();
    if (Buffer.byteLength(raw) > 4_000_000)
      throw new DomainEngineError(
        "dns_response_invalid",
        "Cloudflare returned an unexpected response.",
        502,
      );
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new DomainEngineError(
        "dns_response_invalid",
        "Cloudflare returned an unexpected response.",
        502,
      );
    }
    const parsed = z
      .object({
        success: z.literal(true),
        result: z.unknown(),
        result_info: z.unknown().optional(),
      })
      .safeParse(data);
    if (!response.ok || !parsed.success)
      throw new DomainEngineError(
        "dns_provider_unavailable",
        response.status === 403
          ? "This authorization does not permit the requested DNS operation."
          : "Cloudflare did not confirm this request.",
        response.status === 403 ? 403 : 503,
      );
    return { result: parsed.data.result, result_info: parsed.data.result_info };
  }
}

export function dnsSnapshotDigest(records: CloudflareRecord[]) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        [...records]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((r) => ({
            id: r.id,
            type: r.type,
            name: r.name.toLowerCase(),
            content: r.content,
            ttl: r.ttl,
            proxied: r.proxied ?? false,
            comment: r.comment ?? null,
            tags: r.tags ?? [],
          })),
      ),
    )
    .digest("hex");
}
function recordName(name: string, fqdn: string) {
  const value =
    name === "@" ? fqdn : name.includes(".") ? name : `${name}.${fqdn}`;
  const normalized = value.toLowerCase().replace(/\.$/, "");
  if (![fqdn, `www.${fqdn}`, `_vigil.${fqdn}`].includes(normalized))
    throw new DomainEngineError(
      "dns_name_invalid",
      "Only the approved website names may be changed.",
    );
  return normalized;
}
function sameContent(a: string, b: string, type: string) {
  return type === "CNAME"
    ? a.toLowerCase().replace(/\.$/, "") === b.toLowerCase().replace(/\.$/, "")
    : a === b;
}
export function validatedWebsiteDnsRecords(
  fqdn: string,
  expected: ExpectedDnsRecord[],
) {
  if (expected.length < 1 || expected.length > 4)
    throw new DomainEngineError(
      "dns_plan_invalid",
      "Review the exact website records before connecting.",
    );
  const seen = new Set<string>();
  const routingNames = new Set<string>();
  return expected.map((r) => {
    const name = recordName(r.name, fqdn);
    const key = `${r.type}:${name}`;
    if (seen.has(key))
      throw new DomainEngineError(
        "dns_plan_invalid",
        "A website record is duplicated.",
      );
    seen.add(key);
    if (r.type !== "TXT") {
      if (routingNames.has(name))
        throw new DomainEngineError(
          "dns_plan_invalid",
          "A website hostname has conflicting routing targets.",
        );
      routingNames.add(name);
    }
    if (
      r.type === "TXT"
        ? name !== `_vigil.${fqdn}` ||
          !/^vigil-verify=[a-f0-9]{32}$/.test(r.value)
        : r.type === "A"
          ? !isPublicWebsiteIpv4(r.value)
          : r.type === "CNAME"
            ? !/^[a-z0-9.-]+\.vercel-dns(?:-[0-9]+)?\.com\.?$/i.test(r.value)
            : true
    )
      throw new DomainEngineError(
        "dns_target_invalid",
        "The website DNS targets could not be verified.",
      );
    if (!Number.isInteger(r.ttl) || r.ttl < 60 || r.ttl > 86400)
      throw new DomainEngineError(
        "dns_plan_invalid",
        "The website DNS TTL is invalid.",
      );
    return {
      type: r.type,
      name,
      content: r.value,
      ttl: r.ttl,
      ...(r.type !== "TXT" ? { proxied: false as const } : {}),
    };
  });
}
export function planCloudflareWebsiteDns(
  fqdnInput: string,
  zoneId: string,
  zoneName: string,
  records: CloudflareRecord[],
  expected: ExpectedDnsRecord[],
): CloudflareDnsPlan {
  const fqdn = normalizeDomain(fqdnInput).fqdn;
  identifier.parse(zoneId);
  if (normalizeDomain(fqdn).registrableDomain !== zoneName)
    throw new DomainEngineError(
      "dns_zone_mismatch",
      "The DNS zone does not match this domain.",
      403,
    );
  const targets = validatedWebsiteDnsRecords(fqdn, expected);
  const changes: CloudflareDnsChange[] = [];
  for (const target of targets) {
    const atName = records.filter(
      (r) => r.name.toLowerCase().replace(/\.$/, "") === target.name,
    );
    if (
      target.type === "CNAME" &&
      atName.some((r) => !["A", "AAAA", "CNAME"].includes(r.type))
    )
      throw new DomainEngineError(
        "dns_preservation_conflict",
        "This website hostname also has non-website records. Vigil must review it before connecting.",
        409,
      );
    if (
      target.type === "TXT" &&
      atName.some(
        (r) => r.type === "TXT" && !r.content.startsWith("vigil-verify="),
      )
    )
      throw new DomainEngineError(
        "dns_preservation_conflict",
        "The ownership-proof name has unrelated records. Vigil must review it before connecting.",
        409,
      );
    const editable = atName.filter((r) =>
      target.type === "TXT"
        ? r.type === "TXT" && r.content.startsWith("vigil-verify=")
        : ["A", "AAAA", "CNAME"].includes(r.type),
    );
    const same = editable.find(
      (r) =>
        r.type === target.type &&
        sameContent(r.content, target.content, target.type),
    );
    const keeper = same ?? editable.find((r) => r.type === target.type);
    for (const record of editable)
      if (record.id !== keeper?.id)
        changes.push({ operation: "delete", before: record, after: null });
    if (!keeper)
      changes.push({ operation: "create", before: null, after: target });
    else if (!same || keeper.proxied === true || keeper.ttl !== target.ttl)
      changes.push({ operation: "update", before: keeper, after: target });
  }
  if (changes.length > 20)
    throw new DomainEngineError(
      "dns_assistance_required",
      "This DNS change needs assisted review.",
      409,
    );
  return {
    fqdn,
    zoneId,
    zoneName,
    snapshotDigest: dnsSnapshotDigest(records),
    changes,
    expected,
  };
}
export function matchesExpectedDns(
  records: CloudflareRecord[],
  expected: ExpectedDnsRecord[],
  fqdn: string,
) {
  const plan = planCloudflareWebsiteDns(
    fqdn,
    "0".repeat(32),
    normalizeDomain(fqdn).registrableDomain,
    records,
    expected,
  );
  return plan.changes.length === 0;
}
export function assertCloudflareDnsWriteApproved(
  fqdn: string,
  env: Record<string, string | undefined> = process.env,
) {
  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production")
    throw new DomainEngineError(
      "dns_live_release_required",
      "Production DNS writes require a separately approved release.",
      403,
    );
  const names = (env.VIGIL_DOMAIN_DNS_APPROVED_HOSTNAMES ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (
    env.VIGIL_DOMAIN_DNS_WRITES_APPROVED !== "true" ||
    !env.VIGIL_DOMAIN_DNS_APPROVAL_REFERENCE ||
    !names.includes(normalizeDomain(fqdn).fqdn)
  )
    throw new DomainEngineError(
      "dns_write_approval_required",
      "This domain needs Vigil's explicit DNS release approval before changes can be applied.",
      403,
    );
}

/** Only public IPv4 destinations are valid for a public website connection. */
export function isPublicWebsiteIpv4(value: string) {
  if (isIP(value) !== 4) return false;
  const [a, b, c] = value.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 &&
      (b === 168 || b === 0 || b === 2 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}
