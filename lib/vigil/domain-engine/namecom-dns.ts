import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { ExpectedDnsRecord } from "./contracts";
import { validatedWebsiteDnsRecords } from "./cloudflare-dns";
import { DomainEngineError } from "./errors";
import { normalizeDomain } from "./normalize";

const recordSchema = z.object({
  id: z.number().int().positive(),
  domainName: z.string(),
  type: z.string(),
  host: z.string().nullable(),
  answer: z.string(),
  ttl: z.number().int(),
});
type RecordRow = z.infer<typeof recordSchema>;
type Target = {
  type: "A" | "CNAME" | "TXT";
  host: string;
  answer: string;
  ttl: number;
};
export type NamecomDnsPlan = {
  fqdn: string;
  accountScope: string;
  snapshotDigest: string;
  expected: ExpectedDnsRecord[];
  creates: Target[];
};
type SandboxCall = (
  path: string,
  method?: string,
  body?: unknown,
) => Promise<unknown>;

/** Called only through the fixed-origin registrar after verifying its receipt and client owner.
 * Creates missing website records only. Existing conflicting records require reviewed assistance.
 */
export class NamecomSandboxDns {
  constructor(
    private readonly accountScope: string,
    private readonly call: SandboxCall,
  ) {}
  async prepare(
    fqdn: string,
    expected: ExpectedDnsRecord[],
  ): Promise<NamecomDnsPlan> {
    const name = normalizeDomain(fqdn, { registration: true }).fqdn;
    return plan(name, this.accountScope, await this.records(name), expected);
  }
  async apply(input: NamecomDnsPlan) {
    if (input.accountScope !== this.accountScope) throw conflict();
    let rows = await this.records(input.fqdn);
    const actual = plan(input.fqdn, this.accountScope, rows, input.expected);
    if (!actual.creates.length)
      return { applied: true, reconciled: true, publicDnsVerified: false };
    if (
      actual.snapshotDigest !== input.snapshotDigest ||
      JSON.stringify(actual.creates) !== JSON.stringify(input.creates)
    )
      throw conflict();
    for (const target of actual.creates) {
      // Name.com DNS create has no documented idempotency header. Read back before
      // each write and after any uncertain response; never blindly repeat a POST.
      rows = await this.records(input.fqdn);
      plan(input.fqdn, this.accountScope, rows, input.expected);
      if (rows.some((r) => same(r, target))) continue;
      try {
        await this.call(`/domains/${input.fqdn}/records`, "POST", target);
      } catch {
        rows = await this.records(input.fqdn);
        if (!rows.some((r) => same(r, target)))
          throw new DomainEngineError(
            "dns_outcome_unknown",
            "The sandbox DNS response needs reconciliation. No duplicate record was submitted.",
            503,
          );
        continue;
      }
      rows = await this.records(input.fqdn);
      if (!rows.some((r) => same(r, target)))
        throw new DomainEngineError(
          "dns_outcome_unknown",
          "The sandbox DNS record could not be confirmed. No duplicate record was submitted.",
          503,
        );
    }
    if (
      plan(input.fqdn, this.accountScope, rows, input.expected).creates.length
    )
      throw conflict();
    return { applied: true, reconciled: false, publicDnsVerified: false };
  }
  private async records(fqdn: string) {
    const name = normalizeDomain(fqdn, { registration: true }).fqdn;
    const rows: RecordRow[] = [];
    for (let page = 1; page <= 100; page++) {
      const data = z
        .object({
          records: z.array(recordSchema).default([]),
          nextPage: z.number().int().nonnegative().optional(),
          totalCount: z.number().int().nonnegative(),
        })
        .parse(
          await this.call(`/domains/${name}/records?page=${page}&perPage=100`),
        );
      if (data.records.some((r) => r.domainName !== name)) throw conflict();
      rows.push(...data.records);
      if (rows.length === data.totalCount && !data.nextPage) return rows;
      if (data.nextPage !== page + 1) throw conflict();
    }
    throw conflict();
  }
}
function plan(
  fqdn: string,
  accountScope: string,
  rows: RecordRow[],
  expected: ExpectedDnsRecord[],
): NamecomDnsPlan {
  const targets: Target[] = validatedWebsiteDnsRecords(fqdn, expected).map(
    (r) => ({
      type: r.type,
      host: r.name === fqdn ? "" : r.name.slice(0, -fqdn.length - 1),
      answer: r.content,
      ttl: r.ttl,
    }),
  );
  if (targets.some((t) => t.ttl < 300)) throw conflict();
  const creates: Target[] = [];
  for (const target of targets) {
    const atName = rows.filter(
      (r) =>
        (r.host === "@" ? "" : (r.host ?? "")).toLowerCase() === target.host,
    );
    if (
      atName.some(
        (r) =>
          !same(r, target) &&
          (r.type === target.type ||
            target.type === "CNAME" ||
            r.type === "CNAME" ||
            (["A", "AAAA", "ANAME"].includes(r.type) && target.type !== "TXT")),
      )
    )
      throw conflict();
    if (atName.some((r) => same(r, target))) continue;
    creates.push(target);
  }
  return {
    fqdn,
    accountScope,
    expected,
    creates,
    snapshotDigest: createHash("sha256")
      .update(JSON.stringify([...rows].sort((a, b) => a.id - b.id)))
      .digest("hex"),
  };
}
function same(row: RecordRow, target: Target) {
  return (
    row.type === target.type &&
    (row.host === "@" ? "" : (row.host ?? "")).toLowerCase() === target.host &&
    (row.type === "CNAME"
      ? row.answer.toLowerCase().replace(/\.$/, "") ===
        target.answer.toLowerCase().replace(/\.$/, "")
      : row.answer === target.answer)
  );
}
function conflict() {
  return new DomainEngineError(
    "dns_review_required",
    "Review an updated website DNS plan. Existing records and nameservers were preserved.",
    409,
  );
}
