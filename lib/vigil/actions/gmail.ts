'use server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireViewerOrThrow } from '@/lib/vigil/auth/session';
import { toActionError, type ActionResult } from '@/lib/vigil/auth/errors';
import { gmailConnection } from '@/lib/vigil/gmail/connection';
import { revokeGmailToken } from '@/lib/vigil/gmail/provider';

export async function disconnectGmail(): Promise<ActionResult> {
  try {
    const viewer = await requireViewerOrThrow();
    const connection = await gmailConnection(viewer.user.id,true);
    if (connection?.refreshToken) await revokeGmailToken(connection.refreshToken);
    const {error} = await createAdminClient().rpc('remove_gmail_connection',{p_user:viewer.user.id});
    if (error) throw error;
    revalidatePath('/dashboard/leads','layout');
    return {ok:true,data:undefined};
  } catch (error) { return toActionError(error); }
}
