import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/vigil/auth/session';
import { isSameOriginRequest } from '@/lib/vigil/auth/origin';
import { enforceRateLimit, limitKey } from '@/lib/vigil/rate-limit';
import { GMAIL_COOKIE, GMAIL_SETTINGS, gmailAuthorization, gmailConfig } from '@/lib/vigil/gmail/provider';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return new Response('Request not allowed.',{status:403});
  const viewer = await getViewer();
  if (!viewer) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(GMAIL_SETTINGS)}`,request.url),303);
  const cfg = gmailConfig();
  if (!cfg || new URL(cfg.redirectUri).host !== request.headers.get('host')) return NextResponse.redirect(new URL(`${GMAIL_SETTINGS}&gmail=setup`,request.url),303);
  try {
    await enforceRateLimit(limitKey('gmail-connect',viewer.user.id),{limit:10,windowSeconds:600},true);
    const authorization = gmailAuthorization(viewer.user.id);
    const response = NextResponse.redirect(authorization.url,303);
    response.cookies.set(GMAIL_COOKIE,authorization.cookie,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:600});
    response.headers.set('Cache-Control','no-store');
    return response;
  } catch { return NextResponse.redirect(new URL(`${GMAIL_SETTINGS}&gmail=error`,request.url),303); }
}
