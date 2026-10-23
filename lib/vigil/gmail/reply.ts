import 'server-only';
import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/vigil/auth/errors';
import type { OrgContext } from '@/lib/vigil/auth/session';
import { enforceRateLimit, limitKey } from '@/lib/vigil/rate-limit';
import { gmailConnection } from './connection';
import { createGmailDraft, getGmailDraft, gmailAccessToken, gmailDraftUrl } from './provider';
import { gmailReplyMime } from './draft';

export async function prepareGmailReply(ctx: OrgContext, leadId: string) {
  const client = await createClient();
  // Resolve the lead under the selected tenant before retrieving any mailbox credential.
  const {data:lead,error} = await client.from('leads').select('id,contact,message,received_at').eq('id',leadId).eq('organization_id',ctx.organization.id).maybeSingle();
  if (error) throw error;
  if (!lead) throw new ValidationError('This inquiry is not available.');
  const admin = createAdminClient();
  const connection = await gmailConnection(ctx.user.id,true);
  if (!connection?.refreshToken) throw new ValidationError('Connect Gmail in Lead Hub Settings first.');
  await enforceRateLimit(limitKey('gmail-draft',ctx.user.id),{limit:15,windowSeconds:600},true);
  const lease = randomUUID();
  const {data:locked,error:lockError} = await admin.rpc('gmail_draft_lock',{p_user:ctx.user.id,p_lead:lead.id,p_token:lease});
  if (lockError) throw lockError;
  if (!locked) throw new ValidationError('A draft is already being prepared. Please wait a moment.');
  try {
    const kind = `gmail_draft_${ctx.user.id.replace(/-/g,'')}`;
    const accessToken = await gmailAccessToken(connection.refreshToken);
    const {data:link,error:linkError} = await admin.from('provider_links').select('external_id').eq('provider','other').eq('resource_kind',kind).eq('entity_type','lead').eq('entity_id',lead.id).maybeSingle();
    if (linkError) throw linkError;
    const existing = link && await getGmailDraft(accessToken,link.external_id);
    if (existing) return gmailDraftUrl(connection.email,existing);
    const contact = lead.contact as {email?:unknown;name?:unknown};
    const raw = gmailReplyMime({email:contact.email,name:contact.name,message:lead.message || '',receivedAt:lead.received_at,sender:connection.email});
    // Do not retry POST on a timeout: Google might already have created the draft.
    const draft = await createGmailDraft(accessToken,raw);
    const {data:saved,error:saveError} = await admin.rpc('finish_gmail_draft',{p_user:ctx.user.id,p_lead:lead.id,p_token:lease,p_connected_at:connection.connectedAt,p_draft:draft.id,p_thread:draft.message.threadId});
    if (saveError || !saved) throw new ValidationError('Your draft was created. Open Gmail Drafts before trying again.');
    return gmailDraftUrl(connection.email,draft);
  } finally {
    const {error:releaseError} = await admin.rpc('gmail_draft_lock',{p_user:ctx.user.id,p_lead:lead.id,p_token:lease,p_release:true});
    if (releaseError) console.error('[gmail] Could not release draft lease.');
  }
}
