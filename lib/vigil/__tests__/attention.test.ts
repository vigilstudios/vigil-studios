import { describe, expect, it } from "vitest";
import { customerDomainNeedsAttention } from "../attention";

describe("customer attention rules", () => {
  const domain = { status: "pending", website_id: "website-1" };

  it("does not ask for DNS work before the linked website can be previewed", () => {
    expect(customerDomainNeedsAttention([domain], [{ id: "website-1", preview_url: null, live_url: null }])).toBe(false);
  });

  it("asks for DNS work once the linked website preview is ready", () => {
    expect(customerDomainNeedsAttention([domain], [{ id: "website-1", preview_url: "https://preview.example", live_url: null }])).toBe(true);
  });

  it("does not use another website's preview to unlock the domain task", () => {
    expect(customerDomainNeedsAttention([domain], [{ id: "website-2", preview_url: "https://preview.example", live_url: null }])).toBe(false);
  });

  it("keeps domain problems visible for a live linked website", () => {
    expect(customerDomainNeedsAttention([{ ...domain, status: "error" }], [{ id: "website-1", preview_url: null, live_url: "https://example.com" }])).toBe(true);
  });

  it("does not flag a connected domain", () => {
    expect(customerDomainNeedsAttention([{ ...domain, status: "connected" }], [{ id: "website-1", preview_url: "https://preview.example", live_url: null }])).toBe(false);
  });
});
