import "server-only";
import type { DbClient } from "../types";
import { parseBrief } from "../onboarding/brief";

/** Contact-only sites have no booking workspace. Paused setups keep their history. */
export async function bookingWorkspaceSites<
  T extends { id: string; project_id: string | null },
>(
  db: DbClient,
  organizationId: string,
  sites: T[],
  projects?: { id: string; brief: unknown }[],
): Promise<T[]> {
  if (process.env.VIGIL_BOOKINGS_ENABLED !== "true" || !sites.length) return [];
  const [settings, projectRows] = await Promise.all([
    db
      .from("booking_settings")
      .select("website_id")
      .eq("organization_id", organizationId),
    projects
      ? Promise.resolve({ data: projects, error: null })
      : db
          .from("projects")
          .select("id,brief")
          .eq("organization_id", organizationId),
  ]);
  if (settings.error) throw settings.error;
  if (projectRows.error) throw projectRows.error;
  const configured = new Set((settings.data ?? []).map((s) => s.website_id));
  const requested = new Set(
    (projectRows.data ?? [])
      .filter((p) => parseBrief(p.brief).basics?.booking?.approach === "vigil")
      .map((p) => p.id),
  );
  // An appointment's resource FK requires booking_settings, so retaining every
  // configured site also retains historical management after pause/downgrade.
  return sites.filter(
    (s) =>
      configured.has(s.id) ||
      (s.project_id !== null && requested.has(s.project_id)),
  );
}
