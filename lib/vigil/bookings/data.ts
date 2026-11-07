import type { Database } from "@/types/database.types";
export const appointmentColumns =
  "id,website_id,organization_id,service_id,resource_id,lead_id,service_name,time_zone,confirmation_mode,status,starts_at,ends_at,reserved_from,reserved_until,duration,buffer_before,buffer_after,requested_start_at,request_expires_at,contact,notes,revision,created_at,updated_at,party_size" as const;
export type Appointment = Omit<
  Database["public"]["Tables"]["appointments"]["Row"],
  "guest_token_hash" | "submission_key" | "submission_hash"
>;
export function appointmentStatus(
  a: Pick<Appointment, "status" | "request_expires_at">,
  now = Date.now(),
) {
  return a.status === "requested" &&
    a.request_expires_at &&
    Date.parse(a.request_expires_at) <= now
    ? "expired"
    : a.status;
}
