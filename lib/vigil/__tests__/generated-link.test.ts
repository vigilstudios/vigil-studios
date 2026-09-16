import { describe, expect, it } from "vitest";
import { generatedConfirmationUrl, generatedEmailOtpType } from "@/lib/vigil/auth/generated-link";

describe("generated Supabase links", () => {
  it("preserves signup tokens returned for a first-time magic-link request", () => {
    const link = generatedConfirmationUrl(
      "https://www.vigilstudios.co",
      { hashed_token: "fresh-token", verification_type: "signup" },
      "/dashboard/onboarding/welcome",
    );

    expect(link).toBe(
      "https://www.vigilstudios.co/auth/confirm?token_hash=fresh-token&type=signup&next=%2Fdashboard%2Fonboarding%2Fwelcome",
    );
  });

  it("keeps existing-user and invitation token types intact", () => {
    expect(generatedEmailOtpType("magiclink")).toBe("magiclink");
    expect(generatedEmailOtpType("invite")).toBe("invite");
  });

  it("refuses an unknown verification type", () => {
    expect(generatedEmailOtpType("not-a-real-type")).toBeNull();
  });
});
