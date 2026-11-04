import "server-only";
import { parseBrief } from "../onboarding/brief";
import type { DbClient } from "../types";
/** Component delivery check, separate from the owner's availability review and public activation. */
export async function bookingReadiness(
  db: DbClient,
  org: string,
  project: { brief: unknown },
  website?: { id: string },
) {
  const needs = parseBrief(project.brief).basics?.booking;
  if (needs?.approach !== "vigil") return null;
  if (!website || process.env.VIGIL_BOOKINGS_ENABLED !== "true")
    return {
      ready: false,
      message:
        "Vigil bookings requested. Keep the site contact-only until a compatible component, Care or higher, availability review and owner activation are complete.",
    };
  const { data, error } = await db
    .from("booking_settings")
    .select("component_ready")
    .eq("website_id", website.id)
    .eq("organization_id", org)
    .maybeSingle();
  if (error) throw error;
  return {
    ready: data?.component_ready === true,
    message: data?.component_ready
      ? "Booking component verified. Eligibility, services and owner activation are managed in Lead Hub."
      : "Verify the deployed booking component before enabling appointments. The site keeps its contact form until setup is complete.",
  };
}
