import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/vigil/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { GMAIL_COOKIE, GMAIL_SETTINGS, exchangeGmailCode, gmailConfig, readGmailOAuthCookie } from '@/lib/vigil/gmail/provider';

export async function GET(request: NextRequest) {
  let outcome = 'error';
  try {
    const viewer = await getViewer(), cfg = gmailConfig();
    const state = viewer && readGmailOAuthCookie(request.cookies.get(GMAIL_COOKIE)?.value,request.nextUrl.searchParams.get('state'),viewer.user.id);
    if (state && cfg && new URL(cfg.redirectUri).host === request.headers.get('host')) {
      const code = request.nextUrl.searchParams.get('code');
      if (request.nextUrl.searchParams.get('error')) outcome = 'cancelled';
      else if (code && code.length <= 4096) {
        const account = await exchangeGmailCode(code,state.verifier);
        const {error} = await createAdminClient().rpc('save_gmail_connection',{p_user:viewer!.user.id,p_email:account.email,p_refresh_token:account.refreshToken});
        if (error) throw error;
        outcome = 'connected';
      }
    }
  } catch { /* No authorization codes, tokens, or provider payloads in logs or redirects. */ }
  const response = NextResponse.redirect(new URL(`${GMAIL_SETTINGS}&gmail=${outcome}`,request.url),303);
  response.cookies.set(GMAIL_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
  response.headers.set('Cache-Control','no-store');
  response.headers.set('Referrer-Policy','no-referrer');
  return response;
}
