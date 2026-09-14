import { describe, expect, it } from "vitest";
import { attachmentPath, validateAttachments } from "../attachments";

describe("validateAttachments", () => {
  it("accepts images and pdf under the limit", () => {
    expect(validateAttachments([{ name: "a.png", type: "image/png", size: 1000 }, { name: "b.pdf", type: "application/pdf", size: 5_000_000 }])).toEqual([]);
  });
  it("refuses wrong types, oversize, empty, and too many", () => {
    const p = validateAttachments([
      { name: "x.exe", type: "application/x-msdownload", size: 10 },
      { name: "big.jpg", type: "image/jpeg", size: 11 * 1024 * 1024 },
      { name: "empty.png", type: "image/png", size: 0 },
    ]);
    expect(p.map((x) => x.name)).toEqual(["x.exe", "big.jpg", "empty.png"]);
    const many = validateAttachments(Array.from({ length: 6 }, (_, i) => ({ name: `${i}.png`, type: "image/png", size: 1 })));
    expect(many[0].name).toBe("*");
  });
});

describe("attachmentPath", () => {
  it("prefixes the organization so storage RLS can read it", () => {
    expect(attachmentPath("org-1", "req-1", "image/png", "abc")).toBe("org-1/req-1/abc.png");
    expect(attachmentPath("org-1", "req-1", "application/pdf", "abc")).toBe("org-1/req-1/abc.pdf");
  });
});
