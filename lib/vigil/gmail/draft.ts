import 'server-only';
import { leadReplyLink } from '@/lib/vigil/leads/reply';

export function gmailReplyMime(input: {email:unknown;name?:unknown;message:string;receivedAt:string;sender:string}) {
  if (!leadReplyLink('default',input.email) || !leadReplyLink('default',input.sender)) throw new Error('Invalid reply address.');
  const email = (input.email as string).trim();
  const name = typeof input.name === 'string' ? input.name.replace(/[\r\n\x00-\x1f]/g,' ').slice(0,120) : 'Website visitor';
  const body = `\n\n--- Original website inquiry ---\nFrom: ${name} <${email}>\nReceived: ${input.receivedAt}\n\n${input.message}`;
  // base64 body keeps visitor text out of RFC mail headers and preserves Unicode.
  const encoded = Buffer.from(body,'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';
  return Buffer.from(`From: ${input.sender}\r\nTo: ${email}\r\nSubject: Re: Your website inquiry\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${encoded}\r\n`,'utf8').toString('base64url');
}
