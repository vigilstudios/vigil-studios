import { describe, expect, it } from "vitest";
import { PROFESSIONAL_QUALIFIERS, WEBSITE_TIERS, professionalPurchaseRoute } from "../site-tiers";

describe("website tier capabilities", () => {
  it("keeps the approved Professional boundary in one reusable definition", () => {
    expect(WEBSITE_TIERS.professional.primaryPages).toBe(8);
    expect(WEBSITE_TIERS.professional.booking).toMatch(/booking/i);
    expect(WEBSITE_TIERS.professional.integrations).toMatch(/standard configurable/i);
    expect(WEBSITE_TIERS.professional.included.join(" ")).toMatch(/CMS/i);
    expect(WEBSITE_TIERS.professional.excluded.join(" ")).toMatch(/Native booking/i);
    expect(WEBSITE_TIERS.express.integrations).toMatch(/template-supported/i);
  });

  it("sends standard website needs to checkout and complex scope to consultation", () => {
    expect(professionalPurchaseRoute(["business_site", "booking_embed", "standard_integrations"])).toBe("checkout");
    expect(professionalPurchaseRoute(["business_site", "extra_pages"])).toBe("consult");
    expect(professionalPurchaseRoute(["portal"])).toBe("consult");
    expect(professionalPurchaseRoute(["native_booking", "custom_systems"])).toBe("consult");
    expect(new Set(PROFESSIONAL_QUALIFIERS.map((item) => item.id)).size).toBe(PROFESSIONAL_QUALIFIERS.length);
  });
});
