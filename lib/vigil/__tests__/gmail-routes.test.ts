import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks=vi.hoisted(()=>({viewer:vi.fn(),context:vi.fn(),admin:vi.fn(),rpc:vi.fn(),rate:vi.fn(),exchange:vi.fn(),prepare:vi.fn()}));
vi.mock('@/lib/vigil/auth/session',()=>({getViewer:mocks.viewer,requireOrgContextOrThrow:mocks.context}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocks.admin}));
vi.mock('@/lib/vigil/rate-limit',()=>({enforceRateLimit:mocks.rate,limitKey:(scope:string,id:string)=>`${scope}:${id}`}));
vi.mock('@/lib/vigil/gmail/reply',()=>({prepareGmailReply:mocks.prepare}));
vi.mock('@/lib/vigil/gmail/provider',async importOriginal=>({...await importOriginal<typeof import('../gmail/provider')>(),exchangeGmailCode:mocks.exchange}));
import { POST as connect } from '@/app/api/gmail/connect/route';
import { GET as callback } from '@/app/api/gmail/callback/route';
import { POST as draft } from '@/app/api/gmail/drafts/[leadId]/route';
import { gmailAuthorization,GMAIL_COOKIE } from '../gmail/provider';
const user='ce500000-0000-4000-8000-000000000001',lead='ce500000-0000-4000-8000-000000000031';
function request(path:string,method='POST',headers:Record<string,string>={}){return new NextRequest(`https://www.vigilstudios.co${path}`,{method,headers:{host:'www.vigilstudios.co',origin:'https://www.vigilstudios.co',...headers}});}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('GMAIL_CLIENT_ID','client');vi.stubEnv('GMAIL_CLIENT_SECRET','client-secret');vi.stubEnv('GMAIL_REDIRECT_URI','https://www.vigilstudios.co/api/gmail/callback');mocks.viewer.mockResolvedValue({user:{id:user}});mocks.context.mockResolvedValue({user:{id:user},organization:{id:'org'}});mocks.admin.mockReturnValue({rpc:mocks.rpc});mocks.rpc.mockResolvedValue({error:null});mocks.exchange.mockResolvedValue({email:'mine@example.com',refreshToken:'private-refresh-token'});mocks.prepare.mockResolvedValue('https://mail.google.com/mail/?authuser=mine@example.com#drafts/abc123');});
describe('Gmail OAuth routes',()=>{
 it('starts only from authenticated same-origin POST and sets a short HTTP-only cookie',async()=>{const response=await connect(request('/api/gmail/connect'));expect(response.status).toBe(303);expect(response.headers.get('location')).toContain('https://accounts.google.com/o/oauth2/v2/auth?');const cookie=response.headers.get('set-cookie')!;expect(cookie).toContain('HttpOnly');expect(cookie).toContain('SameSite=lax');expect(cookie).toContain('Max-Age=600');expect(cookie).toContain('Path=/');});
 it('refuses cross-site initiation before reading identity',async()=>{const response=await connect(request('/api/gmail/connect','POST',{origin:'https://evil.example','sec-fetch-site':'cross-site'}));expect(response.status).toBe(403);expect(mocks.viewer).not.toHaveBeenCalled();});
 it('uses the forwarded public host behind the deployment proxy',async()=>{const req=new NextRequest('https://internal.vercel.app/api/gmail/connect',{method:'POST',headers:{host:'internal.vercel.app','x-forwarded-host':'www.vigilstudios.co','x-forwarded-proto':'https',origin:'https://www.vigilstudios.co'}});const response=await connect(req);expect(response.headers.get('location')).toContain('https://accounts.google.com/o/oauth2/v2/auth?');});
 it('requires a signed-in user',async()=>{mocks.viewer.mockResolvedValue(null);const response=await connect(request('/api/gmail/connect'));expect(response.headers.get('location')).toContain('/login?next=');expect(mocks.exchange).not.toHaveBeenCalled();});
 it('does not begin authorization when Google configuration is missing',async()=>{vi.stubEnv('GMAIL_CLIENT_SECRET','');const response=await connect(request('/api/gmail/connect'));expect(response.headers.get('location')).toContain('gmail=setup');expect(response.headers.get('set-cookie')).toBeNull();});
 it('exchanges a state-bound code and saves credentials only for the verified signed-in user',async()=>{
  const authorization=gmailAuthorization(user),state=JSON.parse(authorization.cookie).state;
  const req=request(`/api/gmail/callback?state=${state}&code=one-use-code`,'GET',{cookie:`${GMAIL_COOKIE}=${encodeURIComponent(authorization.cookie)}`});
  const response=await callback(req);expect(response.headers.get('location')).toContain('gmail=connected');
  expect(mocks.rpc).toHaveBeenCalledWith('save_gmail_connection',{p_user:user,p_email:'mine@example.com',p_refresh_token:'private-refresh-token'});
  expect(response.cookies.get(GMAIL_COOKIE)?.maxAge).toBe(0);expect(response.headers.get('location')).not.toContain('private-refresh');
 });
 it('refuses a callback copied from another application user',async()=>{const authorization=gmailAuthorization('ce500000-0000-4000-8000-000000000002');const response=await callback(request(`/api/gmail/callback?state=${JSON.parse(authorization.cookie).state}&code=code`,'GET',{cookie:`${GMAIL_COOKIE}=${encodeURIComponent(authorization.cookie)}`}));expect(response.headers.get('location')).toContain('gmail=error');expect(mocks.exchange).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();});
 it('handles denied consent without overwriting the current connection',async()=>{const authorization=gmailAuthorization(user);const response=await callback(request(`/api/gmail/callback?state=${JSON.parse(authorization.cookie).state}&error=access_denied`,'GET',{cookie:`${GMAIL_COOKIE}=${encodeURIComponent(authorization.cookie)}`}));expect(response.headers.get('location')).toContain('gmail=cancelled');expect(mocks.rpc).not.toHaveBeenCalled();});
 it('rejects a callback with no state cookie',async()=>{const response=await callback(request('/api/gmail/callback?state=forged&code=code','GET'));expect(response.headers.get('location')).toContain('gmail=error');expect(mocks.exchange).not.toHaveBeenCalled();});
 it('returns callback errors to the public origin rather than the internal deployment host',async()=>{const response=await callback(new NextRequest('https://internal.vercel.app/api/gmail/callback',{headers:{host:'internal.vercel.app','x-forwarded-host':'www.vigilstudios.co','x-forwarded-proto':'https'}}));expect(response.headers.get('location')).toBe('https://www.vigilstudios.co/dashboard/leads?view=settings&gmail=error');});
});
describe('Authenticated draft handoff',()=>{
 it('creates a draft only after an authenticated same-origin POST',async()=>{const response=await draft(request(`/api/gmail/drafts/${lead}`),{params:Promise.resolve({leadId:lead})});expect(response.status).toBe(303);expect(response.headers.get('location')).toContain('#drafts/abc123');expect(response.headers.get('Cache-Control')).toBe('no-store');expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');expect(mocks.prepare).toHaveBeenCalledWith(expect.objectContaining({user:{id:user}}),lead);});
 it('does not create a draft from a cross-origin request',async()=>{const response=await draft(request(`/api/gmail/drafts/${lead}`,'POST',{origin:'https://evil.example'}),{params:Promise.resolve({leadId:lead})});expect(response.status).toBe(403);expect(mocks.prepare).not.toHaveBeenCalled();});
 it('validates the inquiry id before touching provider credentials',async()=>{const response=await draft(request('/api/gmail/drafts/invalid'),{params:Promise.resolve({leadId:'invalid'})});expect(response.status).toBe(404);expect(mocks.context).not.toHaveBeenCalled();expect(mocks.prepare).not.toHaveBeenCalled();});
 it('keeps provider failures within a safe first-party error view',async()=>{mocks.prepare.mockRejectedValue(new Error('secret provider error'));const response=await draft(request(`/api/gmail/drafts/${lead}`),{params:Promise.resolve({leadId:lead})});expect(response.headers.get('location')).toBe(`https://www.vigilstudios.co/dashboard/leads/${lead}?gmail=error`);});
});
