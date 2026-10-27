import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LAYOUT, LAYOUT_METADATA_KEY } from "../overview/model";
const mocks = vi.hoisted(() => ({
  viewer: vi.fn(),
  client: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/vigil/auth/session", () => ({
  requireViewerOrThrow: mocks.viewer,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
import { saveOverviewLayout } from "../actions/overview";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.viewer.mockResolvedValue({
    user: { id: "actual-admin" },
    isImpersonating: true,
    organization: { id: "customer-org" },
  });
  mocks.client.mockResolvedValue({ auth: { updateUser: mocks.update } });
  mocks.update.mockResolvedValue({
    data: { user: { id: "actual-admin" } },
    error: null,
  });
});
describe("overview preferences", () => {
  it("updates only the authenticated account metadata, even while staff view a customer", async () => {
    expect(
      await saveOverviewLayout({
        ...DEFAULT_LAYOUT,
        user_id: "customer",
        role: "admin",
        spans: { website: 12 },
      }),
    ).toMatchObject({ ok: true });
    expect(mocks.update).toHaveBeenCalledWith({
      data: {
        [LAYOUT_METADATA_KEY]: {
          ...DEFAULT_LAYOUT,
          spans: { ...DEFAULT_LAYOUT.spans, website: 12 },
        },
      },
    });
  });
  it("requires a verified session before an auth update", async () => {
    mocks.viewer.mockRejectedValue(new Error("Session expired"));
    expect(await saveOverviewLayout(DEFAULT_LAYOUT)).toMatchObject({
      ok: false,
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("reports failed saves without claiming persistence", async () => {
    mocks.update.mockResolvedValue({
      data: { user: null },
      error: { message: "unavailable" },
    });
    expect(await saveOverviewLayout(DEFAULT_LAYOUT)).toMatchObject({
      ok: false,
      error: "Your layout could not be saved. Please try again.",
    });
  });
});
