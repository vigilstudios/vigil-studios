import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { ProviderError, ProviderNotConfiguredError, ValidationError } from '@/lib/vigil/auth/errors';

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.compose';
export const GMAIL_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-vigil-gmail-oauth' : 'vigil-gmail-oauth';
export const GMAIL_SETTINGS = '/dashboard/leads?view=settings';
const SCOPES = ['openid', 'email', GMAIL_SCOPE];

export function gmailConfig() {
  const clientId = process.env.GMAIL_CLIENT_ID, clientSecret = process.env.GMAIL_CLIENT_SECRET, redirectUri = process.env.GMAIL_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  try {
    const url = new URL(redirectUri);
    if (url.pathname !== '/api/gmail/callback' || url.search || url.hash || url.username || url.password || (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && ['localhost','127.0.0.1'].includes(url.hostname)))) return null;
  } catch { return null; }
  return { clientId, clientSecret, redirectUri };
}
function config() { const value = gmailConfig(); if (!value) throw new ProviderNotConfiguredError('Gmail'); return value; }
export function gmailAuthorization(userId: string) {
  const cfg = config(), state = randomBytes(32).toString('base64url'), verifier = randomBytes(48).toString('base64url');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({client_id:cfg.clientId,redirect_uri:cfg.redirectUri,response_type:'code',scope:SCOPES.join(' '),access_type:'offline',prompt:'consent select_account',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
  return { url: url.href, cookie: JSON.stringify({userId,state,verifier,createdAt:Date.now()}) };
}
export function readGmailOAuthCookie(raw: string | undefined, state: string | null, userId: string) {
  try {
    const value = z.object({userId:z.string().uuid(),state:z.string().min(40).max(128),verifier:z.string().min(43).max(128),createdAt:z.number()}).parse(JSON.parse(raw || ''));
    if (!state || value.userId !== userId || Date.now()-value.createdAt > 600_000 || value.createdAt > Date.now()+5000) return null;
    const actual = Buffer.from(state), expected = Buffer.from(value.state);
    return actual.length === expected.length && timingSafeEqual(actual,expected) ? value : null;
  } catch { return null; }
}
async function googleJson(url: string, init: RequestInit) {
  const response = await fetch(url, {...init,cache:'no-store',signal:AbortSignal.timeout(15_000)});
  if (!response.ok) {
    if ([400,401,403].includes(response.status)) throw new ValidationError('Gmail access needs attention. Reconnect Gmail in Lead Hub Settings.');
    throw new ProviderError('gmail',`Google returned HTTP ${response.status}.`,{retryable:response.status>=500});
  }
  return response.json() as Promise<unknown>;
}
const tokenSchema = z.object({access_token:z.string().min(1),refresh_token:z.string().min(10).optional(),scope:z.string().optional()});
export async function exchangeGmailCode(code: string, verifier: string) {
  const cfg = config();
  const token = tokenSchema.parse(await googleJson('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code,code_verifier:verifier,client_id:cfg.clientId,client_secret:cfg.clientSecret,redirect_uri:cfg.redirectUri,grant_type:'authorization_code'})}));
  if (!token.refresh_token || !token.scope?.split(' ').includes(GMAIL_SCOPE)) throw new ValidationError('Allow Gmail draft access to finish connecting your account.');
  const account = z.object({email:z.string().email().max(254),email_verified:z.literal(true)}).parse(await googleJson('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${token.access_token}`}}));
  return {email:account.email,refreshToken:token.refresh_token};
}
export async function gmailAccessToken(refreshToken: string) {
  const cfg = config();
  const token = tokenSchema.parse(await googleJson('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({refresh_token:refreshToken,client_id:cfg.clientId,client_secret:cfg.clientSecret,grant_type:'refresh_token'})}));
  return token.access_token;
}
const draftSchema = z.object({id:z.string().regex(/^[a-zA-Z0-9_-]+$/),message:z.object({threadId:z.string().regex(/^[a-f0-9]+$/)})});
export type GmailDraft = z.infer<typeof draftSchema>;
export async function getGmailDraft(accessToken: string, id: string): Promise<GmailDraft | null> {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${encodeURIComponent(id)}?format=minimal`,{headers:{Authorization:`Bearer ${accessToken}`},cache:'no-store',signal:AbortSignal.timeout(15_000)});
  if (response.status === 404) return null;
  if (!response.ok) throw new ValidationError('Your Gmail draft could not be opened. Reconnect Gmail if this continues.');
  return draftSchema.parse(await response.json());
}
/** No send/update/delete endpoints: a reply is prepared only after a user click. */
export async function createGmailDraft(accessToken: string, raw: string): Promise<GmailDraft> {
  return draftSchema.parse(await googleJson('https://gmail.googleapis.com/gmail/v1/users/me/drafts',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({message:{raw}})}));
}
export function gmailDraftUrl(email: string, draft: GmailDraft) {
  return `https://mail.google.com/mail/?authuser=${encodeURIComponent(email)}#drafts/${draft.message.threadId}`;
}
export async function revokeGmailToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',body:new URLSearchParams({token:refreshToken}),cache:'no-store',signal:AbortSignal.timeout(15_000)});
  if (!response.ok && response.status !== 400) throw new ValidationError('Google could not disconnect Gmail. Please try again.');
}
