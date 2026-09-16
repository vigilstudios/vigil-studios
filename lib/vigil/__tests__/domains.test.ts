import { describe, expect, it } from "vitest";
import { domainKind, registrableDomain, relativeDnsName } from "../domains";

describe("domain names", () => {
  it("understands multi-label public suffixes", () => {
    expect(registrableDomain("www.example.co.uk")).toBe("example.co.uk");
    expect(domainKind("example.co.uk")).toBe("apex");
    expect(domainKind("shop.example.co.uk")).toBe("subdomain");
    expect(relativeDnsName("shop.example.co.uk")).toBe("shop");
  });

  it("keeps nested subdomain names intact for DNS forms", () => {
    expect(relativeDnsName("checkout.eu.example.com")).toBe("checkout.eu");
  });
});
