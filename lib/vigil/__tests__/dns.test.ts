import { afterEach, describe, expect, it } from "vitest";
import { checkDnsRecords, detectRegistrar, platformDnsRecords, requiredRecords } from "../services/dns";

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
});

describe("detectRegistrar", () => {
  it("looks up the apex and maps the nameservers", async () => {
    const seen: string[] = [];
    const r = await detectRegistrar("www.example.com", { resolveNs: async (h) => { seen.push(h); return ["ns1.domaincontrol.com"]; } });
    expect(seen).toEqual(["example.com"]);
    expect(r.registrar).toBe("godaddy");
    const miss = await detectRegistrar("nx.example", { resolveNs: async () => Promise.reject(new Error("ENOTFOUND")) });
    expect(miss).toEqual({ registrar: null, nameservers: [] });
  });
});
