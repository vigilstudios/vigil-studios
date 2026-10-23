'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireViewerOrThrow } from '@/lib/vigil/auth/session';
import { ValidationError, toActionError, type ActionResult } from '@/lib/vigil/auth/errors';
import { isLeadReplyPlatform } from '@/lib/vigil/leads/reply';

export async function saveLeadReplyPreference(form: FormData): Promise<ActionResult> {
  try {
    await requireViewerOrThrow();
    const platform = form.get('reply_platform');
    if (!isLeadReplyPlatform(platform)) throw new ValidationError('Choose a supported reply platform.');
    const client = await createClient();
    // Auth updates only the signed-in user and merges this one non-sensitive key.
    // Never accept a user id or update the customer being viewed by staff.
    const { data, error } = await client.auth.updateUser({ data: { lead_reply_platform: platform } });
    if (error || !data.user) throw new ValidationError('Your reply preference could not be saved. Please try again.');
    revalidatePath('/dashboard/leads', 'layout');
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
