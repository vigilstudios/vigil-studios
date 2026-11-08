import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthenticatedError } from "../auth/errors";

const mock = vi.hoisted(() => ({
  viewer: vi.fn(),
  start: vi.fn(),
  send: vi.fn(),
  admin: vi.fn(),
  limit: vi.fn(),
  published: vi.fn(),
}));
vi.mock("../auth/session", () => ({ requireViewerOrThrow: mock.viewer }));
vi.mock("@/lib/supabase/admin", () => ({
  hasAdminClient: () => true,
  createAdminClient: mock.admin,
}));
vi.mock("../services/orders", () => ({
  startCheckout: mock.start,
  sendWelcome: mock.send,
}));
vi.mock("../express/library", () => ({
  isPublishedExpressSlug: mock.published,
}));
vi.mock("../rate-limit", () => ({
  enforceRateLimit: mock.limit,
  clientIp: async () => "fixture",
  limitKey: (...v: string[]) => v.join(":"),
  RATE_LIMITS: {},
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "fixture.test" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
import { beginCheckout, resendWelcome } from "./checkout";

const buyer = "da000000-0000-4000-8000-000000000001";
const orderId = "da000000-0000-4000-8000-000000000002";
function form(extra: Record<string, string> = {}) {
  const f = new FormData();
  Object.entries({
    email: "forged@example.test",
    business_name: "Fixture Studio",
    plan_code: "care",
    billing_period: "month",
    project_kind: "express",
    template_slug: "home-services",
    agree: "on",
    ...extra,
  }).forEach(([k, v]) => f.set(k, v));
  return f;
}
function order(data: Record<string, unknown> | null) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: async () => ({ data, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  mock.admin.mockReturnValue({ from: () => query });
}
beforeEach(() => {
  vi.clearAllMocks();
  mock.viewer.mockResolvedValue({
    user: {
      id: buyer,
      email: "verified@example.test",
      email_confirmed_at: "2026-11-07",
    },
    memberships: [],
    staffRole: null,
  });
  mock.published.mockResolvedValue(true);
  mock.start.mockResolvedValue({
    url: "https://checkout.stripe.com/fictional",
  });
  mock.admin.mockReturnValue({});
});
describe("verified checkout action boundary", () => {
  it("rejects anonymous and unverified callers before touching orders or billing", async () => {
    mock.viewer.mockRejectedValueOnce(new UnauthenticatedError());
    expect(await beginCheckout(null, form())).toMatchObject({
      ok: false,
      code: "unauthenticated",
    });
    mock.viewer.mockResolvedValueOnce({
      user: { id: buyer, email: "verified@example.test" },
    });
    expect(await beginCheckout(null, form())).toMatchObject({
      ok: false,
      code: "validation",
    });
    expect(mock.admin).not.toHaveBeenCalled();
    expect(mock.start).not.toHaveBeenCalled();
  });
  it("takes identity from verified Auth, never a submitted email", async () => {
    await expect(beginCheckout(null, form())).rejects.toThrow(
      "REDIRECT:https://checkout.stripe.com/fictional",
    );
    expect(mock.start).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        buyerUserId: buyer,
        email: "verified@example.test",
      }),
    );
  });
  it("rejects wrong tokens, different owners and expired quotes before billing", async () => {
    const base = {
      id: orderId,
      status: "pending",
      email: "verified@example.test",
      buyer_user_id: null,
      expires_at: null,
      build_amount_cents: 50000,
      project_kind: "custom",
      template_slug: null,
    };
    for (const row of [
      null,
      { ...base, buyer_user_id: "other" },
      { ...base, email: "other@example.test" },
      { ...base, expires_at: "2020-01-01" },
    ]) {
      order(row);
      expect(
        await beginCheckout(
          null,
          form({ order_id: orderId, checkout_token: "fixture-token" }),
        ),
      ).toMatchObject({ ok: false, code: "validation" });
    }
    expect(mock.start).not.toHaveBeenCalled();
  });
  it("preserves a trusted quote's build scope and amount over browser fields", async () => {
    order({
      id: orderId,
      status: "pending",
      email: "verified@example.test",
      buyer_user_id: buyer,
      expires_at: null,
      build_amount_cents: 50000,
      project_kind: "custom",
      template_slug: null,
    });
    await expect(
      beginCheckout(
        null,
        form({ order_id: orderId, checkout_token: "fixture-token" }),
      ),
    ).rejects.toThrow("REDIRECT:");
    expect(mock.start).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        existingOrderId: orderId,
        buyerUserId: buyer,
        projectKind: "custom",
        templateSlug: null,
        buildAmountOverrideCents: 50000,
        checkoutToken: "fixture-token",
      }),
    );
  });
  it("never sends another customer's welcome link to a caller holding only its id", async () => {
    order({
      email: "other@example.test",
      business_name: "Other",
      status: "provisioned",
      metadata: {},
      buyer_user_id: "other",
      organization_id: null,
    });
    expect(await resendWelcome(orderId)).toMatchObject({
      ok: false,
      code: "validation",
    });
    expect(mock.send).not.toHaveBeenCalled();
  });
});
