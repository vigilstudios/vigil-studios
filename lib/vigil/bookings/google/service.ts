import "server-only";
import { z } from "zod";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import {
  calendarConfig,
  calendarAccessToken,
  CalendarFailure,
  googleEventId,
  googleEvent,
  writeGoogleEvent,
} from "./provider";
const statusSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  enabled: z.boolean(),
  status: z.enum(["connected", "retrying", "attention", "disconnected"]),
  lastSyncedAt: z.string().nullable(),
  errorCode: z.string().nullable(),
});
export async function calendarConnectionStatus(userId: string, siteId: string) {
  if (!hasAdminClient()) return { configured: false, connection: null };
  const { data, error } = await createAdminClient().rpc(
    "booking_calendar_status",
    { p_user: userId, p_site: siteId },
  );
  if (error) {
    if (!calendarConfig() && error.code === "PGRST202")
      return { configured: false, connection: null };
    throw new Error("Calendar status unavailable");
  }
  return {
    configured: Boolean(calendarConfig()),
    connection: data ? statusSchema.parse(data) : null,
  };
}
const jobSchema = z.object({
  connectionId: z.uuid(),
  websiteId: z.uuid(),
  kind: z.enum(["appointment", "booking_block"]),
  entityId: z.uuid(),
  version: z.number().int().positive(),
  lease: z.uuid(),
  refreshToken: z.string().min(10),
  calendarId: z.string().min(5),
  eventId: z.string().nullable(),
  payload: z
    .object({
      start: z.string(),
      end: z.string(),
      timeZone: z.string(),
      title: z.string(),
      name: z.string().nullable().optional(),
      status: z.string(),
    })
    .nullable(),
});
/** Runs from the existing minute scheduler. No provider calls unless the separate opt-in rollout is configured. */
export async function syncBookingCalendars() {
  if (
    process.env.VIGIL_BOOKINGS_ENABLED !== "true" ||
    !calendarConfig() ||
    !hasAdminClient()
  )
    return { processed: 0 };
  const admin = createAdminClient();
  let processed = 0;
  const deadline = Date.now() + 40000;
  while (processed < 3 && Date.now() < deadline) {
    const claimed = await admin.rpc("claim_booking_calendar", {});
    if (claimed.error) throw new Error("Calendar queue unavailable");
    if (!claimed.data) break;
    const job = jobSchema.parse(claimed.data);
    let retryAfterSeconds: number | undefined;
    let errorCode: string | undefined,
      eventId: string | null = null;
    try {
      const token = await calendarAccessToken(job.refreshToken);
      const valid = await admin.rpc("booking_calendar_lease_valid", {
        p_connection: job.connectionId,
        p_lease: job.lease,
        p_kind: job.kind,
        p_entity: job.entityId,
        p_version: job.version,
      });
      if (valid.error || valid.data !== true)
        throw new CalendarFailure("sync_retry");
      const body = job.payload
        ? googleEvent(
            job.payload,
            job.websiteId,
            job.kind,
            job.entityId,
            job.version,
          )
        : null;
      eventId = await writeGoogleEvent(
        token,
        job.calendarId,
        job.eventId ?? googleEventId(job.connectionId, job.kind, job.entityId),
        body,
        job.version,
      );
    } catch (error) {
      errorCode = error instanceof CalendarFailure ? error.code : "sync_retry";
      retryAfterSeconds =
        error instanceof CalendarFailure ? error.retryAfterSeconds : undefined;
    }
    const finished = await admin.rpc("finish_booking_calendar", {
      p_connection: job.connectionId,
      p_lease: job.lease,
      p_kind: job.kind,
      p_entity: job.entityId,
      p_version: job.version,
      p_event: eventId ?? undefined,
      p_error: errorCode,
      p_retry_after: retryAfterSeconds,
    });
    if (finished.error) throw new Error("Calendar sync completion unavailable");
    processed++;
  }
  return { processed };
}
