"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { measurementKinds } from "@/lib/vigil/measurements/contract";

export async function saveWebsiteMeasurement(
  websiteId: string,
  kind: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const site = z.uuid().parse(websiteId),
      source = z.enum(measurementKinds).parse(kind);
    const property = z
      .string()
      .trim()
      .max(2048)
      .parse(form.get("search_property") ?? "");
    const client = await createClient();
    const { error } = await client.rpc("configure_website_measurement", {
      p_website: site,
      p_kind: source,
      p_enabled: form.get("enabled") === "on",
      p_search_property: property || undefined,
    });
    if (error) throw error;
    revalidatePath(`/admin/websites/${site}/analytics`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/analytics");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "staff");
  }
}
export async function refreshWebsiteMeasurement(
  connectionId: string,
): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const id = z.uuid().parse(connectionId),
      client = await createClient();
    const { error } = await client.rpc("refresh_website_measurement", {
      p_connection: id,
    });
    if (error) throw error;
    revalidatePath("/admin/websites");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "staff");
  }
}
