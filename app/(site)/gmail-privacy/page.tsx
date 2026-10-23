import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Container, Section, SectionIntro } from '@/components/site/primitives';
import { EmailText } from '@/components/site/Email';

export const metadata: Metadata = {title:'Gmail connection privacy | Vigil Studios',description:'How Lead Hub uses your optional Gmail connection to prepare inquiry reply drafts.',alternates:{canonical:'/gmail-privacy'}};
export default function GmailPrivacyPage() {
  return <><Section className="pt-32 sm:pt-40"><Container narrow>
    <SectionIntro eyebrow="Gmail connection privacy" title="Your replies. Your Gmail account." lead="An optional Lead Hub connection. Effective 23 October 2026." />
    <div className="mt-12 space-y-8 text-[15px] leading-7 text-[color:var(--text-secondary)]">
      <section><h2 className="text-xl font-semibold text-[color:var(--text-primary)]">What the connection does</h2><p className="mt-3">When you connect Gmail and click Reply in Gmail on a website inquiry, Vigil prepares a draft addressed to that visitor with the original inquiry quoted for context. You review and send it in Gmail. Vigil does not send these replies automatically, import your inbox, or synchronize your email conversations.</p></section>
      <section><h2 className="text-xl font-semibold text-[color:var(--text-primary)]">Google permissions and stored information</h2><p className="mt-3">Google asks permission to identify your email account and manage drafts and send email. The Google draft permission includes sending capability; Vigil’s reply feature uses it only to create drafts and reopen drafts it previously prepared. We store the connected email address, the connection credential in private Vault storage, and identifiers for drafts created through Lead Hub. Access credentials are handled on the server and are not placed in browser storage or your public profile.</p></section>
      <section><h2 className="text-xl font-semibold text-[color:var(--text-primary)]">Use of your data</h2><p className="mt-3">We use this information to provide the Gmail reply feature you request. We do not sell Google user data, use it for advertising, or use it to train general AI models. Vigil’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="underline">Google API Services User Data Policy</a>, including its Limited Use requirements.</p></section>
      <section><h2 className="text-xl font-semibold text-[color:var(--text-primary)]">Disconnecting and deletion</h2><p className="mt-3">Disconnect Gmail in Lead Hub Settings to revoke the saved Google grant and remove connection credentials and draft associations from active Vigil storage. This does not delete drafts or emails from Gmail, or website inquiries already saved in Lead Hub. You can also revoke Vigil’s access from your Google account’s third-party connections page. For data or account deletion requests, contact <EmailText />.</p></section>
      <p><Link href="/dashboard/leads?view=settings" className="font-medium text-[color:var(--accent)]">Return to Lead Hub Settings</Link></p>
    </div>
  </Container></Section><Footer /></>;
}
