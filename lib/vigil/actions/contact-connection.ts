"use server";
import { requireStaff } from "@/lib/vigil/auth/session";
import { toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { verifyContactAccountAccess } from "@/lib/vigil/contact/connection";

export async function verifyContactConnection(): Promise<ActionResult> {
  try {
    await requireStaff();
    await verifyContactAccountAccess();
    return {ok:true,data:undefined};
  } catch (error) {
    return toActionError(error,"staff");
  }
}
