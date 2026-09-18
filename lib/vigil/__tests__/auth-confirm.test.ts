import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/(vigil)/auth/confirm/route";
import { isSameOriginRequest } from "@/lib/vigil/auth/origin";

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

describe("login CSRF guard on the confirmation POST", () => {
  const form = () => {
    const body = new URLSearchParams({ token_hash: "abc123", type: "magiclink" });
    return { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } as Record<string, string> };
  };

  it("refuses a cross-site post before touching the token", async () => {
    const init = form();
    init.headers.origin = "https://evil.example";
    init.headers.host = "www.vigilstudios.co";
    const response = await POST(new NextRequest("https://www.vigilstudios.co/auth/confirm", init));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://www.vigilstudios.co/login?error=link_invalid");
  });

  it("treats sec-fetch-site: cross-site as foreign even when Origin matches", () => {
    const request = new NextRequest("https://www.vigilstudios.co/auth/confirm", { method: "POST", headers: { origin: "https://www.vigilstudios.co", host: "www.vigilstudios.co", "sec-fetch-site": "cross-site" } });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("accepts the site's own form post, including behind a forwarding proxy", () => {
    const direct = new NextRequest("https://www.vigilstudios.co/auth/confirm", { method: "POST", headers: { origin: "https://www.vigilstudios.co", host: "www.vigilstudios.co" } });
    const forwarded = new NextRequest("http://localhost:3000/auth/confirm", { method: "POST", headers: { origin: "https://www.vigilstudios.co", host: "localhost:3000", "x-forwarded-host": "www.vigilstudios.co" } });
    const legacy = new NextRequest("https://www.vigilstudios.co/auth/confirm", { method: "POST", headers: { host: "www.vigilstudios.co" } });
    expect(isSameOriginRequest(direct)).toBe(true);
    expect(isSameOriginRequest(forwarded)).toBe(true);
    expect(isSameOriginRequest(legacy)).toBe(true);
  });
});
