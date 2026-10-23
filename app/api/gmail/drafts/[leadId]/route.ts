import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrgContextOrThrow } from '@/lib/vigil/auth/session';
import { isSameOriginRequest } from '@/lib/vigil/auth/origin';
import { prepareGmailReply } from '@/lib/vigil/gmail/reply';

export async function POST(request: NextRequest, {params}: {params:Promise<{leadId:string}>}) {
  if (!isSameOriginRequest(request)) return new Response('Request not allowed.',{status:403});
  const {leadId} = await params;
  if (!z.string().uuid().safeParse(leadId).success) return new Response('Inquiry not found.',{status:404});
  let destination: string;
  try { destination = await prepareGmailReply(await requireOrgContextOrThrow(),leadId); }
  catch { destination = new URL(`/dashboard/leads/${leadId}?gmail=error`,request.url).href; }
  const response = NextResponse.redirect(destination,303);
  response.headers.set('Cache-Control','no-store');
  response.headers.set('Referrer-Policy','no-referrer');
  return response;
}
