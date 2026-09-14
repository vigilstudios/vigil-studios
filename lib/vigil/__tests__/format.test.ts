import { describe, expect, it } from "vitest";
import { formatMoney, humanizeAction, slugify, titleCase } from "../format";

describe("slugify", () => {
  it("matches the organizations.slug check constraint", () => {
    const re = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    for (const input of ["Babylon Bean Coffee House", "  C&D Long Island Contracting Corp. ", "Salon Protégé", "x".repeat(100), "--weird__name--"]) {
      const slug = slugify(input);
      expect(slug).toMatch(re);
    }
    expect(slugify("Babylon Bean Coffee House")).toBe("babylon-bean-coffee-house");
    expect(slugify("Salon Protégé")).toBe("salon-protege");
  });
  it("returns empty for nothing usable", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("formatters", () => {
  it("renders unapproved prices honestly", () => {
    expect(formatMoney(null)).toBe("Not set");
    expect(formatMoney(4900)).toBe("$49.00");
  });
  it("humanizes audit actions", () => {
    expect(humanizeAction("websites.status_changed")).toBe("Website status changed");
    expect(humanizeAction("member.invited")).toBe("Member invited");
  });
  it("title-cases enum values", () => {
    expect(titleCase("past_due")).toBe("Past Due");
  });
});
