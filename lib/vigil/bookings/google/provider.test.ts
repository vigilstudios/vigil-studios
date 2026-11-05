import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CALENDAR_SCOPE,
  calendarAuthorization,
  calendarConfig,
  readCalendarCookie,
  googleEventId,
  googleEvent,
  writeGoogleEvent,
  exchangeCalendarCode,
  CalendarFailure,
} from "./provider";
const user = "bc000000-0000-4000-8000-000000000001",
  site = "bc000000-0000-4000-8000-000000000021",
  org = "bc000000-0000-4000-8000-000000000011";
beforeEach(() => {
  vi.stubEnv("VIGIL_GOOGLE_CALENDAR_ENABLED", "true");
  vi.stubEnv("GOOGLE_CALENDAR_CLIENT_ID", "calendar-client");
  vi.stubEnv("GOOGLE_CALENDAR_CLIENT_SECRET", "not-a-live-secret");
  vi.stubEnv(
    "GOOGLE_CALENDAR_REDIRECT_URI",
    "https://app.example.test/api/booking-calendar/callback",
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const payload = {
  start: "2026-11-04T15:00:00Z",
  end: "2026-11-04T15:30:00Z",
  timeZone: "America/New_York",
  title: "Consultation",
  name: "Example client",
  status: "requested",
};
describe("optional Google Calendar permissions", () => {
  it("uses app-created calendar scope and binds PKCE state to the signed-in user and tenant", () => {
    const result = calendarAuthorization(user, site, org),
      url = new URL(result.url),
      state = url.searchParams.get("state");
    expect(url.searchParams.get("scope")).toBe(
      `openid email ${CALENDAR_SCOPE}`,
    );
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(readCalendarCookie(result.cookie, state, user, org)?.websiteId).toBe(
      site,
    );
    expect(
      readCalendarCookie(
        result.cookie,
        state,
        "bc000000-0000-4000-8000-000000000002",
        org,
      ),
    ).toBeNull();
    expect(readCalendarCookie(result.cookie, "wrong", user, org)).toBeNull();
    expect(
      readCalendarCookie(
        result.cookie,
        state,
        user,
        "bc000000-0000-4000-8000-000000000012",
      ),
    ).toBeNull();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 601000);
    expect(readCalendarCookie(result.cookie, state, user, org)).toBeNull();
  });
  it("requires its own configured client and an explicit rollout", () => {
    vi.stubEnv("GMAIL_CLIENT_ID", "calendar-client");
    expect(calendarConfig()).toBeNull();
    vi.stubEnv("GMAIL_CLIENT_ID", "mail-client");
    vi.stubEnv("VIGIL_GOOGLE_CALENDAR_ENABLED", "false");
    expect(calendarConfig()).toBeNull();
  });
  it("requires verified Google email and the exact calendar grant before using a token", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "access",
          refresh_token: "private-refresh",
          scope: "openid email",
        }),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    await expect(
      exchangeCalendarCode("code", "verifier"),
    ).rejects.toBeInstanceOf(CalendarFailure);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
describe("outbound appointment copies", () => {
  it("keeps requests transparent and omits invitations, customer contact details and default reminders", () => {
    const event = googleEvent(
      payload,
      site,
      "appointment",
      "appointment-id",
      10,
    )!;
    expect(event).toMatchObject({
      status: "tentative",
      transparency: "transparent",
      reminders: { useDefault: false },
    });
    expect(event).not.toHaveProperty("attendees");
    expect(event.description).not.toContain("@example");
    expect(
      googleEvent(
        { ...payload, status: "cancelled" },
        site,
        "appointment",
        "appointment-id",
        11,
      ),
    ).toBeNull();
    expect(googleEventId(user, "appointment", site)).toMatch(/^[0-9a-v]{65}$/);
  });
  it("uses ETags and silent updates for an existing event", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            etag: '"original"',
            extendedProperties: { private: { vigilVersion: "9" } },
          }),
        ),
      )
      .mockResolvedValueOnce(new Response("{}"));
    vi.stubGlobal("fetch", fetch);
    expect(
      await writeGoogleEvent(
        "token",
        "calendar@example",
        "vevent",
        googleEvent(payload, site, "appointment", "id", 10),
        10,
      ),
    ).toBe("vevent");
    const [url, options] = fetch.mock.calls[1];
    expect(url).toContain("calendar%40example/events/vevent?sendUpdates=none");
    expect(options).toMatchObject({
      method: "PUT",
      headers: { "If-Match": '"original"' },
    });
  });
  it("never overwrites a newer remote snapshot", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          etag: '"new"',
          extendedProperties: { private: { vigilVersion: "20" } },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    await writeGoogleEvent(
      "token",
      "calendar",
      "vevent",
      googleEvent(payload, site, "appointment", "id", 10),
      10,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("deletes cancelled copies conditionally and without guest notifications", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ etag: '"old"' })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    expect(
      await writeGoogleEvent("token", "calendar", "vevent", null, 30),
    ).toBeNull();
    expect(fetch.mock.calls[1][1]).toMatchObject({
      method: "DELETE",
      headers: { "If-Match": '"old"' },
    });
  });
  it("converts Google revocation into a safe reconnect state", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("private provider payload", { status: 401 }),
        ),
    );
    await expect(
      writeGoogleEvent("token", "calendar", "id", null, 10),
    ).rejects.toMatchObject({
      code: "reconnect_required",
      message: "reconnect_required",
    });
  });
});

it("retries Google 403 quota errors with its Retry-After instead of revoking access", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { errors: [{ reason: "userRateLimitExceeded" }] },
          }),
          { status: 403, headers: { "Retry-After": "120" } },
        ),
      ),
  );
  await expect(
    writeGoogleEvent("token", "calendar", "id", null, 10),
  ).rejects.toMatchObject({ code: "sync_retry", retryAfterSeconds: 120 });
});
