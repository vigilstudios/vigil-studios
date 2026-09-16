import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/(vigil)/auth/confirm/route";

describe("email-link confirmation", () => {
  it("does not auto-submit a one-time token fetched by an inbox scanner", async () => {
    const response = await GET(new NextRequest("https://www.vigilstudios.co/auth/confirm?token_hash=abc123&type=signup&next=%2Fdashboard%2Fonboarding%2Fwelcome"));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Ready to sign you in");
    expect(html).toContain('name="type" value="signup"');
    expect(html).toContain('name="next" value="/dashboard/onboarding/welcome"');
    expect(html).not.toContain('.submit()');
  });

  it("rejects a confirmation URL without a token", async () => {
    const response = await GET(new NextRequest("https://www.vigilstudios.co/auth/confirm?type=magiclink"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://www.vigilstudios.co/login?error=link_invalid");
  });
});
