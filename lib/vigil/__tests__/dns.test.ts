import { afterEach, describe, expect, it } from "vitest";
import { checkDnsRecords, checkHttpsReachable, detectRegistrar, ownershipRecord, platformDnsRecords, requiredRecords, withOwnershipRecord } from "../services/dns";
import { managedDomainConfigs } from "../services/domain";

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

describe("platformDnsRecords", () => {
  it("is empty until the platform targets are configured", () => {
    delete process.env.VIGIL_DNS_APEX_A;
    delete process.env.VIGIL_DNS_CNAME_TARGET;
    expect(platformDnsRecords("example.com")).toEqual([]);
  });
  it("gives A + www CNAME for a root domain and a single CNAME for a subdomain", () => {
    process.env.VIGIL_DNS_APEX_A = "76.76.21.21";
    process.env.VIGIL_DNS_CNAME_TARGET = "cname.vercel-dns.com";
    expect(platformDnsRecords("example.com")).toEqual([
      { type: "A", name: "@", value: "76.76.21.21" },
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
    ]);
    expect(platformDnsRecords("shop.example.com")).toEqual([{ type: "CNAME", name: "shop", value: "cname.vercel-dns.com" }]);
    expect(platformDnsRecords("example.co.uk")).toEqual([
      { type: "A", name: "@", value: "76.76.21.21" },
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
    ]);
  });
  it("prefers records stored on the domain row", () => {
    process.env.VIGIL_DNS_APEX_A = "1.1.1.1";
    expect(requiredRecords("example.com", { required_records: [{ type: "A", name: "@", value: "9.9.9.9" }] })).toEqual([{ type: "A", name: "@", value: "9.9.9.9" }]);
    expect(requiredRecords("example.com", { required_records: [] })[0].value).toBe("1.1.1.1");
  });
});

describe("checkDnsRecords", () => {
  const resolver = {
    resolve4: async (h: string) => (h === "example.com" ? ["76.76.21.21"] : []),
    resolve6: async () => [],
    resolveCname: async (h: string) => (h === "www.example.com" ? ["cname.vercel-dns.com."] : Promise.reject(new Error("ENODATA"))),
    resolveTxt: async () => [["vigil-verify=abc"]],
  };
  it("compares each record case- and dot-insensitively and never throws", async () => {
    const out = await checkDnsRecords(
      "example.com",
      [
        { type: "A", name: "@", value: "76.76.21.21" },
        { type: "CNAME", name: "www", value: "CNAME.vercel-dns.com" },
        { type: "CNAME", name: "shop", value: "cname.vercel-dns.com" },
        { type: "TXT", name: "_vigil", value: "vigil-verify=abc" },
      ],
      resolver
    );
    expect(out.map((c) => c.ok)).toEqual([true, true, false, true]);
  });

  it("resolves a registrar-relative subdomain record from the registrable zone", async () => {
    const seen: string[] = [];
    const out = await checkDnsRecords(
      "drytest.vigilstudios.co",
      [{ type: "CNAME", name: "drytest", value: "cname.vercel-dns.com" }],
      {
        resolve4: async () => [],
        resolve6: async () => [],
        resolveCname: async (hostname) => { seen.push(hostname); return ["cname.vercel-dns.com."]; },
        resolveTxt: async () => [],
      }
    );
    expect(seen).toEqual(["drytest.vigilstudios.co"]);
    expect(out[0].ok).toBe(true);
  });
});

describe("checkHttpsReachable", () => {
  it("requires the public HTTPS address to answer without a server error", async () => {
    expect(await checkHttpsReachable("example.com", async () => new Response(null, { status: 200 }))).toBe(true);
    expect(await checkHttpsReachable("example.com", async () => new Response(null, { status: 503 }))).toBe(false);
    expect(await checkHttpsReachable("example.com", async () => { throw new Error("connection refused"); })).toBe(false);
  });
});

describe("detectRegistrar", () => {
  it("looks up the apex and maps the nameservers", async () => {
    const seen: string[] = [];
    const r = await detectRegistrar("www.example.com", { resolveNs: async (h) => { seen.push(h); return ["ns1.domaincontrol.com"]; } });
    expect(seen).toEqual(["example.com"]);
    expect(r.registrar).toBe("godaddy");
    await detectRegistrar("shop.example.co.uk", { resolveNs: async (h) => { seen.push(h); return []; } });
    expect(seen.at(-1)).toBe("example.co.uk");
    const miss = await detectRegistrar("nx.example", { resolveNs: async () => Promise.reject(new Error("ENOTFOUND")) });
    expect(miss).toEqual({ registrar: null, nameservers: [] });
  });
});

describe("managedDomainConfigs", () => {
  it("uses www as canonical for an apex and redirects the bare domain", () => {
    expect(managedDomainConfigs("example.com", "apex")).toEqual([
      { hostname: "www.example.com", canonicalHostname: "www.example.com" },
      { hostname: "example.com", canonicalHostname: "www.example.com", redirectTo: "www.example.com" },
    ]);
  });

  it("leaves a customer-supplied subdomain unchanged", () => {
    expect(managedDomainConfigs("shop.example.com", "subdomain")).toEqual([
      { hostname: "shop.example.com", canonicalHostname: "shop.example.com" },
    ]);
  });
});

describe("ownership record", () => {
  it("lives at _vigil under the hostname and carries the row's token", () => {
    expect(ownershipRecord("example.com", "abc")).toEqual({ type: "TXT", name: "_vigil", value: "vigil-verify=abc" });
    expect(ownershipRecord("shop.example.com", "abc")).toEqual({ type: "TXT", name: "_vigil.shop", value: "vigil-verify=abc" });
    expect(ownershipRecord("example.co.uk", "abc").name).toBe("_vigil");
  });

  it("is added to the platform and stored records, replacing a stale token", () => {
    process.env.VIGIL_DNS_APEX_A = "76.76.21.21";
    delete process.env.VIGIL_DNS_CNAME_TARGET;
    expect(platformDnsRecords("example.com", "t1")).toEqual([
      { type: "A", name: "@", value: "76.76.21.21" },
      { type: "TXT", name: "_vigil", value: "vigil-verify=t1" },
    ]);
    const stored = [{ type: "A", name: "@", value: "9.9.9.9" }, { type: "TXT", name: "_vigil", value: "vigil-verify=old" }];
    expect(requiredRecords("example.com", { required_records: stored }, "t2")).toEqual([
      { type: "A", name: "@", value: "9.9.9.9" },
      { type: "TXT", name: "_vigil", value: "vigil-verify=t2" },
    ]);
    expect(withOwnershipRecord(stored, "example.com", null)).toEqual(stored);
  });

  it("is not offered before the platform targets exist, so nothing verifies on the token alone", () => {
    delete process.env.VIGIL_DNS_APEX_A;
    delete process.env.VIGIL_DNS_CNAME_TARGET;
    expect(platformDnsRecords("example.com", "t1")).toEqual([]);
  });

  it("only passes for the row whose token is published", async () => {
    process.env.VIGIL_DNS_APEX_A = "76.76.21.21";
    delete process.env.VIGIL_DNS_CNAME_TARGET;
    const resolver = {
      resolve4: async () => ["76.76.21.21"],
      resolve6: async () => [],
      resolveCname: async () => [],
      resolveTxt: async (h: string) => (h === "_vigil.example.com" ? [["vigil-verify=owner-token"]] : []),
    };
    const owner = await checkDnsRecords("example.com", platformDnsRecords("example.com", "owner-token"), resolver);
    const squatter = await checkDnsRecords("example.com", platformDnsRecords("example.com", "squatter-token"), resolver);
    expect(owner.every((c) => c.ok)).toBe(true);
    expect(squatter.map((c) => c.ok)).toEqual([true, false]);
  });
});
