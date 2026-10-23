import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { gmailAuthorization, gmailConfig, readGmailOAuthCookie, exchangeGmailCode, gmailAccessToken, createGmailDraft, getGmailDraft, gmailDraftUrl, revokeGmailToken, GMAIL_SCOPE } from '../gmail/provider';
import { gmailReplyMime } from '../gmail/draft';
const user='ce500000-0000-4000-8000-000000000001';
beforeEach(()=>{vi.stubEnv('GMAIL_CLIENT_ID','test-client');vi.stubEnv('GMAIL_CLIENT_SECRET','test-client-secret');vi.stubEnv('GMAIL_REDIRECT_URI','https://www.vigilstudios.co/api/gmail/callback');});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('Gmail authorization',()=>{
 it('creates independent PKCE verifier/state and only draft plus identity scopes',()=>{
  const first=gmailAuthorization(user),second=gmailAuthorization(user),cookie=JSON.parse(first.cookie),url=new URL(first.url);
  expect(first.cookie).not.toBe(second.cookie);expect(cookie.userId).toBe(user);expect(url.origin).toBe('https://accounts.google.com');
  expect(url.searchParams.get('scope')?.split(' ')).toEqual(['openid','email',GMAIL_SCOPE]);
  expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(cookie.verifier).digest('base64url'));
  expect(url.searchParams.get('access_type')).toBe('offline');expect(url.searchParams.get('state')).toBe(cookie.state);
  expect(first.url).not.toContain('test-client-secret');expect(first.url).not.toContain(cookie.verifier);
 });
 it('binds callback state to the signed-in user and expiration',()=>{
  const {cookie}=gmailAuthorization(user),data=JSON.parse(cookie);
  expect(readGmailOAuthCookie(cookie,data.state,user)?.verifier).toBe(data.verifier);
  expect(readGmailOAuthCookie(cookie,'wrong',user)).toBeNull();
  expect(readGmailOAuthCookie(cookie,data.state,'another-user')).toBeNull();
  expect(readGmailOAuthCookie(JSON.stringify({...data,createdAt:Date.now()-601000}),data.state,user)).toBeNull();
  expect(readGmailOAuthCookie(JSON.stringify({...data,createdAt:Date.now()+100000}),data.state,user)).toBeNull();
  expect(readGmailOAuthCookie('bad JSON',data.state,user)).toBeNull();
 });
 it.each(['https://evil.example/callback','javascript:alert(1)','https://user:pass@www.vigilstudios.co/api/gmail/callback','https://www.vigilstudios.co/api/gmail/callback?next=other'])('rejects invalid configured callback %s',uri=>{vi.stubEnv('GMAIL_REDIRECT_URI',uri);expect(gmailConfig()).toBeNull();});
 it('is unavailable without client credentials',()=>{vi.stubEnv('GMAIL_CLIENT_SECRET','');expect(gmailConfig()).toBeNull();});
 it('exchanges a code and accepts only a verified mailbox with granted draft access',async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(Response.json({access_token:'access-private',refresh_token:'refresh-private',scope:`openid email ${GMAIL_SCOPE}`})).mockResolvedValueOnce(Response.json({email:'connected@example.com',email_verified:true}));vi.stubGlobal('fetch',fetcher);
  expect(await exchangeGmailCode('one-use-code','pkce-verifier')).toEqual({email:'connected@example.com',refreshToken:'refresh-private'});
  const request=fetcher.mock.calls[0][1];expect(request.body.get('code_verifier')).toBe('pkce-verifier');expect(request.body.get('redirect_uri')).toBe('https://www.vigilstudios.co/api/gmail/callback');
 });
 it.each([{access_token:'access',scope:GMAIL_SCOPE},{access_token:'access',refresh_token:'refresh-private',scope:'email'}])('rejects incomplete Google grants',async payload=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json(payload)));await expect(exchangeGmailCode('code','verifier')).rejects.toThrow('Allow Gmail draft access');});
 it('rejects an unverified mailbox',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(Response.json({access_token:'access',refresh_token:'refresh-private',scope:GMAIL_SCOPE})).mockResolvedValueOnce(Response.json({email:'connected@example.com',email_verified:false})));await expect(exchangeGmailCode('code','verifier')).rejects.toThrow();});
 it('handles a revoked grant without exposing Google response text',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({error:'invalid_grant',private_detail:'secret'},{status:400})));await expect(gmailAccessToken('refresh-private')).rejects.toThrow('Reconnect Gmail');});
});
describe('Draft payload and Gmail handoff',()=>{
 it('quotes the complete original inquiry beneath blank reply space and preserves Unicode',()=>{
  const message='Hello 👋\nBrand & film collaboration.\nBcc: this is inquiry text, never a header';
  const raw=gmailReplyMime({email:'visitor+film@example.com',name:'Maya\r\nInjected',message,receivedAt:'2026-10-23T03:00:00Z',sender:'connected@example.com'});
  const mime=Buffer.from(raw,'base64url').toString('utf8'),[headers,encoded]=mime.split('\r\n\r\n');
  expect(headers).toContain('To: visitor+film@example.com');expect(headers).not.toContain('Bcc:');expect(headers).not.toContain('Injected');
  const body=Buffer.from(encoded.replace(/\r\n/g,''),'base64').toString('utf8');expect(body.startsWith('\n\n--- Original website inquiry ---')).toBe(true);expect(body).toContain(message);expect(body).toContain('From: Maya  Injected <visitor+film@example.com>');
 });
 it.each(['a@example.com\r\nBcc:private@example.com','a@example.com,other@example.com','broken'])('rejects unsafe mail headers %s',email=>{expect(()=>gmailReplyMime({email,message:'hello',receivedAt:'today',sender:'connected@example.com'})).toThrow();});
 it('only creates a draft and builds a full Gmail URL for the connected account',async()=>{
  const draft={id:'r_draft_1',message:{threadId:'abcdef123'}};const fetcher=vi.fn().mockResolvedValue(Response.json(draft));vi.stubGlobal('fetch',fetcher);
  expect(await createGmailDraft('access-private','encoded-mime')).toEqual(draft);
  expect(fetcher).toHaveBeenCalledOnce();expect(fetcher.mock.calls[0][0]).toBe('https://gmail.googleapis.com/gmail/v1/users/me/drafts');
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({message:{raw:'encoded-mime'}});
  expect(gmailDraftUrl('connected+work@example.com',draft)).toBe('https://mail.google.com/mail/?authuser=connected%2Bwork%40example.com#drafts/abcdef123');
  expect(gmailDraftUrl('connected@example.com',draft)).not.toContain('view=cm');
 });
 it('treats a sent/deleted draft as missing without reading the mailbox',async()=>{const fetcher=vi.fn().mockResolvedValue(new Response(null,{status:404}));vi.stubGlobal('fetch',fetcher);expect(await getGmailDraft('token','r_1')).toBeNull();expect(fetcher.mock.calls[0][0]).toContain('/drafts/r_1?format=minimal');});
 it('does not retry an uncertain draft creation',async()=>{const fetcher=vi.fn().mockRejectedValue(new Error('timeout'));vi.stubGlobal('fetch',fetcher);await expect(createGmailDraft('token','raw')).rejects.toThrow();expect(fetcher).toHaveBeenCalledOnce();});
 it('revokes the grant only on explicit disconnect',async()=>{const fetcher=vi.fn().mockResolvedValue(new Response(null,{status:200}));vi.stubGlobal('fetch',fetcher);await revokeGmailToken('refresh-private');expect(fetcher.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/revoke');expect(fetcher.mock.calls[0][1].body.get('token')).toBe('refresh-private');});
});
