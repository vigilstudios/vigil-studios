import 'server-only';
import { z } from 'zod';
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin';
import { gmailConfig } from './provider';

const connectionSchema = z.object({email:z.string().email(),connectedAt:z.string(),refreshToken:z.string().nullable()});
export type GmailConnectionStatus = { configured:boolean; email:string|null };
export async function gmailConnection(userId: string, credentials = false) {
  const admin = createAdminClient();
  const {data,error} = await admin.rpc('gmail_connection',{p_user:userId,p_credentials:credentials});
  if (error) throw error;
  return data ? connectionSchema.parse(data) : null;
}
export async function gmailConnectionStatus(userId: string): Promise<GmailConnectionStatus> {
  if (!hasAdminClient()) return {configured:false,email:null};
  const connection = await gmailConnection(userId);
  return {configured:Boolean(gmailConfig()),email:connection?.email || null};
}
