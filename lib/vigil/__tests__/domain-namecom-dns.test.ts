import { describe, expect, it, vi } from "vitest";
import { NamecomSandboxDns } from "../domain-engine/namecom-dns";
import type { ExpectedDnsRecord } from "../domain-engine/contracts";
const fqdn = "fixture.com";
const expected: ExpectedDnsRecord[] = [
  { name: "@", type: "A", value: "76.76.21.21", ttl: 300 },
  { name: "www", type: "CNAME", value: "fixture.vercel-dns-017.com", ttl: 300 },
];
function setup() {
  const records = [
    {
      id: 1,
      domainName: fqdn,
      type: "MX",
      host: "",
      answer: "mail.example.com",
      ttl: 300,
    },
    {
      id: 2,
      domainName: fqdn,
      type: "TXT",
      host: "",
      answer: "v=spf1 -all",
      ttl: 300,
    },
  ];
  let loseResponse = false;
  const call = vi.fn(async (_path: string, method?: string, body?: unknown) => {
    if (method === "POST") {
      const row = {
        ...(body as (typeof records)[number]),
        id: records.length + 1,
        domainName: fqdn,
      };
      records.push(row);
      if (loseResponse) {
        loseResponse = false;
        throw Error("Lost DNS response");
      }
      return row;
    }
    return { records: structuredClone(records), totalCount: records.length };
  });
  return {
    records,
    call,
    dns: new NamecomSandboxDns("namecom:test:fixture", call),
    loseNextResponse: () => {
      loseResponse = true;
    },
  };
}
describe("Name.com sandbox DNS", () => {
  it("creates only website records, preserves mail and converges without more POSTs", async () => {
    const { dns, records, call } = setup();
    const before = structuredClone(records);
    const p = await dns.prepare(fqdn, expected);
    expect(p.creates).toHaveLength(2);
    expect(await dns.apply(p)).toMatchObject({
      applied: true,
      publicDnsVerified: false,
    });
    expect(records.slice(0, 2)).toEqual(before);
    expect(call.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(2);
    expect(await dns.apply(p)).toMatchObject({ reconciled: true });
    expect(call.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(2);
  });
  it("reconciles a lost response without duplicating the record", async () => {
    const { dns, records, call, loseNextResponse } = setup();
    const p = await dns.prepare(fqdn, expected);
    loseNextResponse();
    await dns.apply(p);
    expect(records.filter((r) => r.type === "A")).toHaveLength(1);
    expect(call.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(2);
  });
  it("refuses stale review and a different account without a write", async () => {
    const { dns, records, call } = setup();
    const p = await dns.prepare(fqdn, expected);
    await expect(
      dns.apply({ ...p, accountScope: "another-account" }),
    ).rejects.toThrow();
    records.push({
      id: 9,
      domainName: fqdn,
      type: "TXT",
      host: "_dmarc",
      answer: "v=DMARC1; p=reject",
      ttl: 300,
    });
    await expect(dns.apply(p)).rejects.toThrow("updated website DNS plan");
    expect(call.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(0);
  });
  it("does not replace competing routing, even when one desired answer already exists", async () => {
    const { dns, records, call } = setup();
    records.push({
      id: 3,
      domainName: fqdn,
      type: "A",
      host: "",
      answer: "76.76.21.21",
      ttl: 300,
    });
    records.push({
      id: 4,
      domainName: fqdn,
      type: "A",
      host: "",
      answer: "1.1.1.1",
      ttl: 300,
    });
    await expect(dns.prepare(fqdn, expected)).rejects.toThrow();
    expect(call.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(0);
  });
  it("rejects mail changes, unrelated names, private targets and unsupported TTLs", async () => {
    const { dns, call } = setup();
    for (const r of [
      { ...expected[0], name: "mail" },
      { ...expected[0], value: "127.0.0.1" },
      { ...expected[0], ttl: 60 },
      {
        ...expected[0],
        name: "_dmarc",
        type: "TXT" as const,
        value: "v=DMARC1; p=none",
      },
    ]) {
      await expect(dns.prepare(fqdn, [r])).rejects.toThrow();
    }
    expect(call.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(0);
  });
});
