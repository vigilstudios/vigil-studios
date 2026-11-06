import { beforeEach, it, expect, vi } from "vitest";
const { requireOrgContext, resolveEntitlements, getBookings, getOrgWebsites } =
  vi.hoisted(() => ({
    requireOrgContext: vi.fn(),
    resolveEntitlements: vi.fn(),
    getBookings: vi.fn(),
    getOrgWebsites: vi.fn(),
  }));
vi.mock("@/lib/vigil/auth/session", () => ({ requireOrgContext }));
vi.mock("@/lib/vigil/entitlements", () => ({
  FEATURES: { bookings: "bookings.enabled", requests: "requests.enabled" },
  resolveEntitlements,
}));
vi.mock("@/lib/vigil/queries/bookings", () => ({ getBookings }));
vi.mock("@/lib/vigil/queries/dashboard", () => ({ getOrgWebsites }));
import Page from "@/app/(vigil)/dashboard/bookings/page";
import { BookingAccessWall } from "@/components/vigil/BookingAccessWall";
beforeEach(() => {
  vi.clearAllMocks();
  requireOrgContext.mockResolvedValue({
    organization: { id: "org" },
    role: "owner",
    user: { id: "user" },
  });
});
it("never loads appointment records to populate a below-Care blurred preview", async () => {
  resolveEntitlements.mockResolvedValue({ enabled: () => false });
  const page = await Page({ searchParams: Promise.resolve({}) });
  expect(page.type).toBe(BookingAccessWall);
  expect(page.props.mode).toBe("upgrade");
  expect(getBookings).not.toHaveBeenCalled();
});
it("routes a Care customer without scheduling to the included request wall", async () => {
  resolveEntitlements.mockResolvedValue({ enabled: () => true });
  getBookings.mockResolvedValue({ enabled: false, notRequested: true });
  getOrgWebsites.mockResolvedValue([{ id: "site" }]);
  const page = await Page({
    searchParams: Promise.resolve({ website: "site" }),
  });
  expect(page.type).toBe(BookingAccessWall);
  expect(page.props).toMatchObject({
    mode: "request",
    canRequest: true,
    websiteId: "site",
  });
});
