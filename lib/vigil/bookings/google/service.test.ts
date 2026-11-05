import { beforeEach, afterEach, it, expect, vi } from "vitest";
const {
  createAdminClient,
  hasAdminClient,
  calendarConfig,
  calendarAccessToken,
  writeGoogleEvent,
} = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  hasAdminClient: vi.fn(),
  calendarConfig: vi.fn(),
  calendarAccessToken: vi.fn(),
  writeGoogleEvent: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient, hasAdminClient }));
vi.mock("./provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./provider")>()),
  calendarConfig,
  calendarAccessToken,
  writeGoogleEvent,
}));
import { syncBookingCalendars } from "./service";
import { CalendarFailure } from "./provider";
const job = {
  connectionId: "bc000000-0000-4000-8000-000000000001",
  websiteId: "bc000000-0000-4000-8000-000000000021",
  kind: "appointment",
  entityId: "bc000000-0000-4000-8000-000000000051",
  version: 3,
  lease: "bc000000-0000-4000-8000-000000000091",
  refreshToken: "private-refresh-token",
  calendarId: "example-calendar",
  eventId: null,
  payload: {
    start: "2026-11-04T15:00:00Z",
    end: "2026-11-04T15:30:00Z",
    timeZone: "UTC",
    title: "Consultation",
    status: "confirmed",
  },
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VIGIL_BOOKINGS_ENABLED", "true");
  calendarConfig.mockReturnValue({});
  hasAdminClient.mockReturnValue(true);
  calendarAccessToken.mockResolvedValue("access");
});
afterEach(() => vi.unstubAllEnvs());
it("does not query credentials or call Google before rollout configuration", async () => {
  calendarConfig.mockReturnValue(null);
  expect(await syncBookingCalendars()).toEqual({ processed: 0 });
  expect(createAdminClient).not.toHaveBeenCalled();
});
it("revalidates a claimed snapshot before any external event write", async () => {
  let claimed = false;
  const rpc = vi.fn(async (name: string) => ({
    data:
      name === "claim_booking_calendar"
        ? !claimed
          ? ((claimed = true), job)
          : null
        : name === "booking_calendar_lease_valid"
          ? false
          : true,
    error: null,
  }));
  createAdminClient.mockReturnValue({ rpc });
  await syncBookingCalendars();
  expect(writeGoogleEvent).not.toHaveBeenCalled();
  expect(rpc).toHaveBeenCalledWith(
    "finish_booking_calendar",
    expect.objectContaining({
      p_error: "sync_retry",
      p_connection: job.connectionId,
    }),
  );
});
it("stores a safe reconnect state when Google revokes access", async () => {
  let claimed = false;
  const rpc = vi.fn(async (name: string) => ({
    data:
      name === "claim_booking_calendar"
        ? !claimed
          ? ((claimed = true), job)
          : null
        : true,
    error: null,
  }));
  createAdminClient.mockReturnValue({ rpc });
  calendarAccessToken.mockRejectedValue(
    new CalendarFailure("reconnect_required"),
  );
  await syncBookingCalendars();
  expect(writeGoogleEvent).not.toHaveBeenCalled();
  expect(rpc).toHaveBeenCalledWith(
    "finish_booking_calendar",
    expect.objectContaining({ p_error: "reconnect_required" }),
  );
});
it("uses the current job's calendar and stable provider event mapping", async () => {
  let claimed = false;
  const rpc = vi.fn(async (name: string) => ({
    data:
      name === "claim_booking_calendar"
        ? !claimed
          ? ((claimed = true), { ...job, eventId: "mapped-event" })
          : null
        : true,
    error: null,
  }));
  createAdminClient.mockReturnValue({ rpc });
  writeGoogleEvent.mockResolvedValue("mapped-event");
  expect(await syncBookingCalendars()).toEqual({ processed: 1 });
  expect(writeGoogleEvent).toHaveBeenCalledWith(
    "access",
    "example-calendar",
    "mapped-event",
    expect.any(Object),
    3,
  );
  expect(rpc).toHaveBeenCalledWith(
    "finish_booking_calendar",
    expect.objectContaining({ p_event: "mapped-event", p_error: undefined }),
  );
});
