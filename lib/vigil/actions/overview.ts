"use server";

import { createClient } from "@/lib/supabase/server";
import { requireViewerOrThrow } from "@/lib/vigil/auth/session";
import { LAYOUT_METADATA_KEY, readLayout } from "@/lib/vigil/overview/model";
import {
  ValidationError,
  toActionError,
  type ActionResult,
} from "@/lib/vigil/auth/errors";

/** Personal appearance preferences only; cannot change the customer being viewed or grant access. */
export async function saveOverviewLayout(
  input: unknown,
): Promise<ActionResult> {
  try {
    await requireViewerOrThrow();
    const layout = readLayout(input);
    const client = await createClient();
    const { data, error } = await client.auth.updateUser({
      data: { [LAYOUT_METADATA_KEY]: layout },
    });
    if (error || !data.user)
      throw new ValidationError(
        "Your layout could not be saved. Please try again.",
      );
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
