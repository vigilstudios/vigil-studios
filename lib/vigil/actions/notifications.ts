"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/vigil/auth/session";
import { toActionError, type ActionResult } from "@/lib/vigil/auth/errors";

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const viewer = await requireViewer();
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", viewer.user.id);
    if (error) throw error;
    revalidatePath("/dashboard", "layout");
    revalidatePath("/admin", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
