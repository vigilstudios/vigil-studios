import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
export const CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created";
export const CALENDAR_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-vigil-booking-calendar"
    : "vigil-booking-calendar";
export function calendarConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID,
    clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;
  if (
    process.env.VIGIL_GOOGLE_CALENDAR_ENABLED !== "true" ||
    !clientId ||
    !clientSecret ||
    !redirectUri ||
    clientId === process.env.GMAIL_CLIENT_ID
  )
    return null;
  try {
    const url = new URL(redirectUri);
    if (
      url.pathname !== "/api/booking-calendar/callback" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          process.env.NODE_ENV !== "production" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        ))
    )
      return null;
  } catch {
    return null;
  }
  return { clientId, clientSecret, redirectUri };
}
function config() {
  const c = calendarConfig();
  if (!c) throw new Error("Calendar connection unavailable");
  return c;
}
export function calendarAuthorization(
  userId: string,
  websiteId: string,
  organizationId: string,
) {
  const cfg = config(),
    state = randomBytes(32).toString("base64url"),
    verifier = randomBytes(48).toString("base64url"),
    url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: `openid email ${CALENDAR_SCOPE}`,
    access_type: "offline",
    prompt: "consent select_account",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  return {
    url: url.href,
    cookie: JSON.stringify({
      userId,
      websiteId,
      organizationId,
      state,
      verifier,
      createdAt: Date.now(),
    }),
  };
}
export function readCalendarCookie(
  raw: string | undefined,
  state: string | null,
  userId: string,
  organizationId: string,
) {
  try {
    const c = z
      .object({
        userId: z.uuid(),
        websiteId: z.uuid(),
        organizationId: z.uuid(),
        state: z.string().min(40).max(128),
        verifier: z.string().min(43).max(128),
        createdAt: z.number(),
      })
      .parse(JSON.parse(raw ?? ""));
    if (
      !state ||
      c.userId !== userId ||
      c.organizationId !== organizationId ||
      Date.now() - c.createdAt > 600000 ||
      c.createdAt > Date.now() + 5000
    )
      return null;
    const a = Buffer.from(state),
      b = Buffer.from(c.state);
    return a.length === b.length && timingSafeEqual(a, b) ? c : null;
  } catch {
    return null;
  }
}
export class CalendarFailure extends Error {
  constructor(
    public code: "reconnect_required" | "sync_retry",
    public retryAfterSeconds?: number,
  ) {
    super(code);
  }
}
const API = "https://www.googleapis.com/calendar/v3";
async function google(url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
}
async function failure(response: Response): Promise<never> {
  const parsed = z
    .object({
      error: z.object({
        errors: z.array(z.object({ reason: z.string() })).optional(),
        status: z.string().optional(),
      }),
    })
    .safeParse(await response.json().catch(() => null));
  const transient =
    response.status === 429 ||
    response.status >= 500 ||
    (parsed.success &&
      (parsed.data.error.status === "RESOURCE_EXHAUSTED" ||
        parsed.data.error.errors?.some((e) =>
          [
            "rateLimitExceeded",
            "userRateLimitExceeded",
            "quotaExceeded",
            "backendError",
          ].includes(e.reason),
        )));
  const retry = response.headers.get("retry-after");
  const seconds = retry
    ? Number.isFinite(Number(retry))
      ? Number(retry)
      : (Date.parse(retry) - Date.now()) / 1000
    : undefined;
  throw new CalendarFailure(
    transient
      ? "sync_retry"
      : [400, 401, 403, 404, 410].includes(response.status)
        ? "reconnect_required"
        : "sync_retry",
    seconds !== undefined && Number.isFinite(seconds)
      ? Math.max(1, Math.min(86400, Math.ceil(seconds)))
      : undefined,
  );
}

export async function exchangeCalendarCode(code: string, verifier: string) {
  const cfg = config(),
    response = await google("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: cfg.redirectUri,
        code,
        code_verifier: verifier,
        grant_type: "authorization_code",
      }),
    });
  if (!response.ok) await failure(response);
  const token = z
    .object({
      access_token: z.string().min(1),
      refresh_token: z.string().min(10),
      scope: z.string(),
    })
    .parse(await response.json());
  if (!token.scope.split(" ").includes(CALENDAR_SCOPE))
    throw new CalendarFailure("reconnect_required");
  const identity = await google(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  if (!identity.ok) await failure(identity);
  const account = z
    .object({ email: z.email().max(254), email_verified: z.literal(true) })
    .parse(await identity.json());
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    email: account.email,
  };
}
export async function calendarAccessToken(refreshToken: string) {
  const cfg = config(),
    response = await google("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
  if (!response.ok) await failure(response);
  return z
    .object({ access_token: z.string().min(1) })
    .parse(await response.json()).access_token;
}
export async function createGoogleCalendar(
  token: string,
  name: string,
  timeZone: string,
) {
  const response = await google(API + "/calendars", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: `Vigil · ${name.slice(0, 100)}`,
      timeZone,
      description:
        "Appointments copied from Vigil. Manage bookings and availability in Vigil. Google edits do not update Vigil.",
    }),
  });
  if (!response.ok) await failure(response);
  return z
    .object({ id: z.string().min(5).max(1024) })
    .parse(await response.json()).id;
}
export async function googleCalendarExists(token: string, id: string) {
  const r = await google(API + "/calendars/" + encodeURIComponent(id), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 404 || r.status === 410) return false;
  if (!r.ok) await failure(r);
  return true;
}
export async function deleteProvisionalCalendar(token: string, id: string) {
  const r = await google(API + "/calendars/" + encodeURIComponent(id), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok && r.status !== 404 && r.status !== 410) await failure(r);
}
export type CalendarPayload = {
  start: string;
  end: string;
  timeZone: string;
  title: string;
  name?: string | null;
  status: string;
};
export function googleEventId(
  connection: string,
  kind: string,
  entity: string,
) {
  return (
    "v" +
    createHash("sha256").update(`${connection}:${kind}:${entity}`).digest("hex")
  );
}
export function googleEvent(
  payload: CalendarPayload,
  websiteId: string,
  kind: string,
  entityId: string,
  version: number,
) {
  const active = ["requested", "confirmed", "completed", "no_show"].includes(
    payload.status,
  );
  if (!active) return null;
  const label =
    payload.status === "requested"
      ? "Awaiting approval · "
      : payload.status === "completed"
        ? "Completed · "
        : payload.status === "no_show"
          ? "No-show · "
          : "";
  const url = new URL(
    "/dashboard/bookings",
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co",
  );
  url.searchParams.set("website", websiteId);
  if (kind === "appointment") url.searchParams.set("appointment", entityId);
  return {
    summary: (
      label +
      payload.title +
      (payload.name ? ` · ${payload.name}` : "")
    ).slice(0, 300),
    description: `Managed in Vigil. Changes here do not change business availability.\n${url.href}`,
    start: { dateTime: payload.start, timeZone: payload.timeZone },
    end: { dateTime: payload.end, timeZone: payload.timeZone },
    status: payload.status === "requested" ? "tentative" : "confirmed",
    transparency: payload.status === "requested" ? "transparent" : "opaque",
    visibility: "private",
    reminders: { useDefault: false },
    extendedProperties: { private: { vigilVersion: String(version) } },
  };
}
/** Deterministic ids and ETags make retries safe and prevent older snapshots overwriting newer ones. */
export async function writeGoogleEvent(
  token: string,
  calendarId: string,
  eventId: string,
  body: ReturnType<typeof googleEvent>,
  version: number,
  recovery = false,
) {
  const base = API + "/calendars/" + encodeURIComponent(calendarId) + "/events",
    url = base + "/" + encodeURIComponent(eventId),
    headers = { Authorization: `Bearer ${token}` };
  const read = await google(url, { headers });
  if (read.status === 404 || read.status === 410) {
    if (!body) return null;
    const r = await google(base + "?sendUpdates=none", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, id: eventId }),
    });
    if (r.status === 409) {
      const again = await google(url, { headers });
      if (again.ok && !recovery)
        return writeGoogleEvent(
          token,
          calendarId,
          eventId,
          body,
          version,
          true,
        );
      if (!recovery && [404, 410].includes(again.status))
        return writeGoogleEvent(
          token,
          calendarId,
          "v" +
            createHash("sha256").update(`${eventId}:${version}`).digest("hex"),
          body,
          version,
          true,
        );
      throw new CalendarFailure("sync_retry");
    }
    if (!r.ok) await failure(r);
    return eventId;
  }
  if (!read.ok) await failure(read);
  const old = z
    .object({
      etag: z.string(),
      extendedProperties: z
        .object({ private: z.record(z.string(), z.string()).optional() })
        .optional(),
    })
    .parse(await read.json());
  if (Number(old.extendedProperties?.private?.vigilVersion ?? 0) > version)
    return eventId;
  const r = await google(url + "?sendUpdates=none", {
    method: body ? "PUT" : "DELETE",
    headers: {
      ...headers,
      "If-Match": old.etag,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (r.status === 412) throw new CalendarFailure("sync_retry");
  if (!r.ok && !(body === null && [404, 410].includes(r.status)))
    await failure(r);
  return body ? eventId : null;
}
