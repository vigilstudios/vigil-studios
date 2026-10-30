import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CloudflareDnsClient,
  assertCloudflareDnsWriteApproved,
  dnsSnapshotDigest,
  isPublicWebsiteIpv4,
  matchesExpectedDns,
  planCloudflareWebsiteDns,
  type CloudflareRecord,
} from "../domain-engine/cloudflare-dns";
import type { ExpectedDnsRecord } from "../domain-engine/contracts";
const zone = "a".repeat(32);
const expected: ExpectedDnsRecord[] = [
  { type: "A", name: "@", value: "76.76.21.21", ttl: 300 },
  { type: "CNAME", name: "www", value: "cname.vercel-dns.com", ttl: 300 },
];
function row(
  id: string,
  type: string,
  name: string,
  content: string,
): CloudflareRecord {
  return { id: id.repeat(32), type, name, content, ttl: 300, proxied: false };
}
const mail = [
  row("1", "MX", "example.com", "mail.example.com"),
  row("2", "TXT", "example.com", "v=spf1 -all"),
  row("3", "TXT", "_dmarc.example.com", "v=DMARC1; p=reject"),
  row("4", "CAA", "example.com", "0 issue letsencrypt.org"),
];
const old = [
  row("5", "A", "example.com", "1.1.1.1"),
  row("6", "AAAA", "example.com", "2606:4700:4700::1111"),
  row("7", "A", "www.example.com", "1.1.1.1"),
];
function plan(records = [...mail, ...old]) {
  return planCloudflareWebsiteDns(
    "example.com",
    zone,
    "example.com",
    records,
    expected,
  );
}
function reply(result: unknown, info?: unknown) {
  return new Response(
    JSON.stringify({ success: true, result, result_info: info }),
    { status: 200 },
  );
}
afterEach(() => vi.unstubAllEnvs());
function approve() {
  vi.stubEnv("VIGIL_DOMAIN_DNS_WRITES_APPROVED", "true");
  vi.stubEnv("VIGIL_DOMAIN_DNS_APPROVAL_REFERENCE", "explicit-test-approval");
  vi.stubEnv("VIGIL_DOMAIN_DNS_APPROVED_HOSTNAMES", "example.com");
}
describe("Cloudflare website-only DNS plans", () => {
  it("preserves mail, policy and unrelated hostnames while replacing old routing", () => {
    const records = [
      ...mail,
      ...old,
      row("8", "A", "api.example.com", "8.8.8.8"),
    ];
    const p = plan(records);
    expect(p.changes.map((c) => c.before?.id)).not.toContain("1".repeat(32));
    expect(
      p.changes
        .filter((c) => c.operation === "delete")
        .map((c) => c.before?.type),
    ).toEqual(["AAAA", "A"]);
    expect(p.changes.map((c) => c.after?.name).filter(Boolean)).toEqual([
      "example.com",
      "www.example.com",
    ]);
    expect(p.changes.some((c) => c.before?.name === "api.example.com")).toBe(
      false,
    );
  });
  it("refuses a CNAME that would conflict with non-website records", () => {
    expect(() =>
      plan([...mail, ...old, row("9", "TXT", "www.example.com", "keep-me")]),
    ).toThrow(/non-website/);
  });
  it.each(["evil.example.com", "mail.example.com", "example.net"])(
    "rejects unapproved hostname %s",
    (name) => {
      expect(() =>
        planCloudflareWebsiteDns(
          "example.com",
          zone,
          "example.com",
          [],
          [{ ...expected[0], name }],
        ),
      ).toThrow(/approved website names/);
    },
  );
  it("rejects an unrelated DNS zone and conflicting targets", () => {
    expect(() =>
      planCloudflareWebsiteDns("example.com", zone, "other.com", [], expected),
    ).toThrow(/does not match/);
    expect(() =>
      planCloudflareWebsiteDns(
        "example.com",
        zone,
        "example.com",
        [],
        [expected[0], { ...expected[1], name: "@" }],
      ),
    ).toThrow(/conflicting/);
  });
  it.each([
    "127.0.0.1",
    "169.254.169.254",
    "10.1.2.3",
    "192.168.1.1",
    "172.16.0.1",
    "100.64.0.1",
    "0.0.0.0",
    "198.18.0.1",
    "192.0.2.1",
    "203.0.113.1",
    "224.0.0.1",
    "::1",
  ])("rejects non-public A target %s", (value) => {
    expect(isPublicWebsiteIpv4(value)).toBe(false);
    expect(() =>
      planCloudflareWebsiteDns(
        "example.com",
        zone,
        "example.com",
        [],
        [{ ...expected[0], value }],
      ),
    ).toThrow(/targets/);
  });
  it("preserves unrelated ownership-proof records", () => {
    expect(() =>
      planCloudflareWebsiteDns(
        "example.com",
        zone,
        "example.com",
        [row("a", "TXT", "_vigil.example.com", "unrelated")],
        [
          {
            type: "TXT",
            name: "_vigil",
            value: `vigil-verify=${"a".repeat(32)}`,
            ttl: 300,
          },
        ],
      ),
    ).toThrow(/unrelated/);
  });
  it("canonicalizes inventory order and ignores no records in its change detector", () => {
    expect(dnsSnapshotDigest(mail)).toBe(
      dnsSnapshotDigest([...mail].reverse()),
    );
    expect(dnsSnapshotDigest(mail)).not.toBe(
      dnsSnapshotDigest([
        ...mail,
        row("9", "TXT", "_other.example.com", "new"),
      ]),
    );
  });
  it("requires an approval reference and the exact hostname before any write", () => {
    expect(() => assertCloudflareDnsWriteApproved("example.com", {})).toThrow(
      /explicit DNS/,
    );
    expect(() =>
      assertCloudflareDnsWriteApproved("www.example.com", {
        VIGIL_DOMAIN_DNS_WRITES_APPROVED: "true",
        VIGIL_DOMAIN_DNS_APPROVAL_REFERENCE: "ok",
        VIGIL_DOMAIN_DNS_APPROVED_HOSTNAMES: "example.com",
      }),
    ).toThrow();
  });
  it("keeps production writes blocked even with local approval variables", () => {
    expect(() =>
      assertCloudflareDnsWriteApproved("example.com", {
        NODE_ENV: "production",
        VIGIL_DOMAIN_DNS_WRITES_APPROVED: "true",
        VIGIL_DOMAIN_DNS_APPROVAL_REFERENCE: "local-only",
        VIGIL_DOMAIN_DNS_APPROVED_HOSTNAMES: "example.com",
      }),
    ).toThrow(/approved release/);
  });
  it("fails before writing when the reviewed snapshot changed", async () => {
    approve();
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        reply([...mail, ...old, row("8", "TXT", "new.example.com", "changed")]),
      );
    await expect(
      new CloudflareDnsClient("test-token", fetcher).apply(plan()),
    ).rejects.toThrow(/changed after review/);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("submits one batch and independently verifies it", async () => {
    approve();
    const final = [
      ...mail,
      row("5", "A", "example.com", "76.76.21.21"),
      row("8", "CNAME", "www.example.com", "cname.vercel-dns.com"),
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply([...mail, ...old]))
      .mockResolvedValueOnce(reply({}))
      .mockResolvedValueOnce(reply(final));
    expect(
      await new CloudflareDnsClient("test-token", fetcher).apply(plan()),
    ).toEqual({ applied: true, reconciled: false });
    const [url, init] = fetcher.mock.calls[1];
    expect(String(url)).toBe(
      `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/batch`,
    );
    expect(JSON.parse(init.body)).toMatchObject({
      deletes: [{ id: "6".repeat(32) }, { id: "7".repeat(32) }],
      patches: [{ id: "5".repeat(32), type: "A", proxied: false }],
      posts: [{ type: "CNAME", name: "www.example.com" }],
    });
    expect(matchesExpectedDns(final, expected, "example.com")).toBe(true);
  });
  it("reconciles a lost response without submitting a second batch", async () => {
    approve();
    const final = [
      ...mail,
      row("5", "A", "example.com", "76.76.21.21"),
      row("8", "CNAME", "www.example.com", "cname.vercel-dns.com"),
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply([...mail, ...old]))
      .mockRejectedValueOnce(new Error("lost response"))
      .mockResolvedValueOnce(reply(final));
    expect(
      await new CloudflareDnsClient("test-token", fetcher).apply(plan()),
    ).toEqual({ applied: true, reconciled: true });
    expect(
      fetcher.mock.calls.filter(([, init]) => init.method === "POST"),
    ).toHaveLength(1);
  });
  it("retains an uncertain outcome when provider truth is still wrong", async () => {
    approve();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply([...mail, ...old]))
      .mockRejectedValueOnce(new Error("lost response"))
      .mockResolvedValueOnce(reply([...mail, ...old]));
    await expect(
      new CloudflareDnsClient("test-token", fetcher).apply(plan()),
    ).rejects.toThrow(/reconcile/);
    expect(
      fetcher.mock.calls.filter(([, init]) => init.method === "POST"),
    ).toHaveLength(1);
  });
  it("paginates DNS inventory and refuses provider-controlled redirects", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply([mail[0]], { total_pages: 2 }))
      .mockResolvedValueOnce(reply([mail[1]], { total_pages: 2 }));
    expect(
      await new CloudflareDnsClient("test-token", fetcher).records(zone),
    ).toHaveLength(2);
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      redirect: "error",
      cache: "no-store",
    });
  });
});
