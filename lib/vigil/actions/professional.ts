"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { createClient } from "@/lib/supabase/server";
import { saveProjectSite } from "@/lib/vigil/professional/workspace";
export async function saveProfessionalSite(projectId: string, input: unknown, revision: number): Promise<ActionResult<{ revision: number }>> {
  try {
    const staff = await requireStaffOrThrow();
    z.string().uuid().parse(projectId);
    z.number().int().positive().parse(revision);
    const data = await saveProjectSite(await createClient(), projectId, input, revision, staff.user.id);
    revalidatePath(`/admin/lab/project/${projectId}`);
    return { ok: true, data };
  } catch (failure) { return toActionError(failure, "staff"); }
}
