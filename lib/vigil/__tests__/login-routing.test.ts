import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import type { Viewer } from "../auth/session";
import type { StaffRole } from "../types";
import { FakeAdmin } from "./fake-admin";

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  viewer: null as Viewer | null,
  refreshSession: vi.fn(),
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@/lib/supabase/proxy", () => ({ refreshSession: mocks.refreshSession }));
vi.mock("@/lib/vigil/auth/session", () => ({ getViewer: async () => mocks.viewer }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/vigil/rate-limit", () => ({
  clientIp: async () => "127.0.0.1", enforceRateLimit: vi.fn(), limitKey: (...parts: string[]) => parts.join(":"),
  RATE_LIMITS: { passwordEmail: {}, passwordIp: {} },
}));

import { signInWithPassword } from "../auth/actions";
import { loginDestination } from "../auth/redirects";
import { resolveLoginDestination } from "../auth/login-destination";
import { GET as callback } from "@/app/(vigil)/auth/callback/route";
import { POST as confirm } from "@/app/(vigil)/auth/confirm/route";
import LoginPage from "@/app/(vigil)/login/page";
import { proxy } from "@/proxy";

const origin = "https://www.vigilstudios.co";
function session(role: StaffRole | null) {
  // A different user's admin row must never grant this customer staff routing.
  const fake = new FakeAdmin({ staff_members: [
    { user_id: "someone-else", role: "admin" },
    ...(role ? [{ user_id: "signed-in-user", role }] : []),
  ] });
  const result = { data: { user: { id: "signed-in-user", user_metadata: { role: "admin" } } }, error: null };
  const auth = {
    signInWithPassword: vi.fn().mockResolvedValue(result),
    exchangeCodeForSession: vi.fn().mockResolvedValue(result),
    verifyOtp: vi.fn().mockResolvedValue(result),
  };
  const client = Object.assign(fake.asClient(), { auth });
  vi.spyOn(fake, "rpc").mockResolvedValue({ data: null, error: null });
  mocks.client.mockResolvedValue(client);
  return { client, fake, auth };
}
function passwordForm(next = "/dashboard") {
  const form = new FormData();
  form.set("email", "owner@example.com"); form.set("password", "test-password"); form.set("next", next);
  return form;
}
function confirmation(next?: string, cookieNext?: string) {
  return new NextRequest(`${origin}/auth/confirm`, {
    method: "POST",
    headers: { origin, host: "www.vigilstudios.co", "content-type": "application/x-www-form-urlencoded", ...(cookieNext ? { cookie: `vigil-next=${encodeURIComponent(cookieNext)}` } : {}) },
    body: new URLSearchParams({ token_hash: "test-token", type: "magiclink", ...(next ? { next } : {}) }),
  });
}

beforeEach(() => { vi.clearAllMocks(); mocks.viewer = null; });

describe("login destination policy", () => {
  it.each(["admin", "staff"] as const)("opens %s console for default and stale customer destinations", role => {
    for (const next of [undefined, "/dashboard", "/dashboard?welcome=1", "/dashboard/settings", "/dashboard/onboarding/welcome", "/dashboard/domain?website=sample"]) {
      expect(loginDestination(next, role)).toBe("/admin");
    }
    expect(loginDestination("/admin/websites?status=building", role)).toBe("/admin/websites?status=building");
    expect(loginDestination("/checkout/success?session_id=sample", role)).toBe("/checkout/success?session_id=sample");
  });
  it("preserves customer onboarding and destination links", () => {
    for (const next of ["/dashboard", "/dashboard/onboarding/welcome", "/dashboard/review?project=sample"]) expect(loginDestination(next, null)).toBe(next);
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/login", "/auth/confirm"])("rejects unsafe/looping next: %s", next => {
    expect(loginDestination(next, "admin")).toBe("/admin");
    expect(loginDestination(next, null)).toBe("/dashboard");
  });
});

describe.each([
  { role: "admin" as const, expected: "/admin" },
  { role: "staff" as const, expected: "/admin" },
  { role: null, expected: "/dashboard" },
])("login entry points for $role", ({ role, expected }) => {
  it("password login chooses the verified role", async () => {
    const { fake } = session(role);
    await expect(signInWithPassword(null, passwordForm())).rejects.toThrow(`NEXT_REDIRECT:${expected}`);
    expect(fake.rpc).toHaveBeenCalledWith("accept_pending_invites");
  });
  it("PKCE login chooses the role and clears its destination cookie", async () => {
    session(role);
    const response = await callback(new NextRequest(`${origin}/auth/callback?code=valid-code`, { headers: { cookie: "vigil-next=%2Fdashboard" } }));
    expect(response.headers.get("location")).toBe(`${origin}${expected}`);
    expect(response.cookies.get("vigil-next")?.value).toBe("");
  });
  it("magic-link login chooses the role before entering any customer page", async () => {
    session(role);
    const response = await confirm(confirmation("/dashboard/onboarding/welcome"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}${role ? "/admin" : "/dashboard/onboarding/welcome"}`);
    expect(response.cookies.get("vigil-next")?.value).toBe("");
  });
  it("an existing session visiting login chooses the role", async () => {
    mocks.viewer = { staffRole: role } as Viewer;
    await expect(LoginPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(`NEXT_REDIRECT:${expected}`);
  });
});

describe("login edge cases", () => {
  it("honors a staff admin deep link after password login", async () => {
    session("admin");
    await expect(signInWithPassword(null, passwordForm("/admin/orders"))).rejects.toThrow("NEXT_REDIRECT:/admin/orders");
  });
  it("overrides a stale client cookie in an email link", async () => {
    session("admin");
    const response = await confirm(confirmation(undefined, "/dashboard/domain"));
    expect(response.headers.get("location")).toBe(`${origin}/admin`);
  });
  it("routes old signup links correctly after the legacy token retry", async () => {
    const { auth } = session("admin");
    auth.verifyOtp.mockResolvedValueOnce({ data: { user: null }, error: { message: "wrong token type" } });
    const response = await confirm(confirmation());
    expect(auth.verifyOtp).toHaveBeenLastCalledWith({ type: "signup", token_hash: "test-token" });
    expect(response.headers.get("location")).toBe(`${origin}/admin`);
  });
  it("does not route invalid credentials or query staff for a failed login", async () => {
    const { auth, fake } = session("admin");
    const from = vi.spyOn(fake, "from");
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: { message: "invalid credentials" } });
    expect(await signInWithPassword(null, passwordForm())).toMatchObject({ ok: false, code: "auth" });
    expect(from).not.toHaveBeenCalled(); expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("does not silently fall back to a customer when role lookup fails", async () => {
    const { client, fake } = session("admin");
    const from = fake.from.bind(fake);
    vi.spyOn(fake, "from").mockImplementation(table => {
      const query = from(table);
      vi.spyOn(query, "maybeSingle").mockResolvedValue({ data: null, error: { message: "role lookup unavailable" } });
      return query;
    });
    await expect(resolveLoginDestination(client, "signed-in-user", "/dashboard")).rejects.toMatchObject({ message: "role lookup unavailable" });
  });
  it("preserves an existing admin session's requested admin page", async () => {
    mocks.viewer = { staffRole: "admin" } as Viewer;
    await expect(LoginPage({ searchParams: Promise.resolve({ next: "/admin/orders" }) })).rejects.toThrow("NEXT_REDIRECT:/admin/orders");
  });
  it("shows the login form to an anonymous visitor", async () => {
    expect(await LoginPage({ searchParams: Promise.resolve({}) })).toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("lets the signed-in login page resolve roles and preserves refreshed cookies", async () => {
    const response = NextResponse.next(); response.cookies.set("refreshed-session", "updated");
    mocks.refreshSession.mockResolvedValue({ userId: "signed-in-user", response });
    const result = await proxy(new NextRequest(`${origin}/login?next=%2Fadmin%2Forders`));
    expect(result).toBe(response); expect(result.headers.get("location")).toBeNull();
    expect(result.cookies.get("refreshed-session")?.value).toBe("updated");
  });
  it("still protects signed-out customer and admin routes", async () => {
    mocks.refreshSession.mockResolvedValue({ userId: null, response: NextResponse.next() });
    const result = await proxy(new NextRequest(`${origin}/admin/orders?status=paid`));
    const location = new URL(result.headers.get("location")!);
    expect(location.pathname).toBe("/login"); expect(location.searchParams.get("next")).toBe("/admin/orders?status=paid");
  });
});
