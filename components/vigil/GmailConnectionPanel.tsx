import type { ReactNode } from 'react';
import { Mail } from 'lucide-react';
import type { GmailConnectionStatus } from '@/lib/vigil/gmail/connection';

export function GmailConnectionPanel({status,disconnectControl,connectControl,notice}: {status:GmailConnectionStatus;disconnectControl:ReactNode;connectControl?:ReactNode;notice?:string}) {
  return <section className="lead-settings-panel" aria-labelledby="gmail-connection-title">
    <div className="lead-settings-summary"><span className="lead-setting-icon"><Mail size={19} aria-hidden="true" /></span><div><h3 id="gmail-connection-title">Gmail connection</h3><p>{status.email ? `Connected as ${status.email}` : 'Connect your own Google account to open prepared replies inside your full Gmail inbox.'}</p></div><span className="lead-status" data-tone={status.email&&status.configured?'good':'neutral'}><span aria-hidden="true" />{status.email?(status.configured?'Connected':'Setup needed'):'Not connected'}</span></div>
    {notice && <p className="lead-gmail-notice" role="status">{notice}</p>}
    <div className="lead-reply-actions">{connectControl || <form method="post" action="/api/gmail/connect"><button type="submit" className="lead-button" disabled={!status.configured}>{status.email?'Reconnect Gmail':'Connect Gmail'}</button></form>}{status.email&&disconnectControl}</div>
    {!status.configured && <p className="lead-settings-note">Google connection setup is required from Vigil before Gmail accounts can connect.</p>}
    <p className="lead-settings-note">Choose Gmail as your reply platform above. Lead Hub creates a draft addressed to the visitor and quotes the original inquiry. You review and send it in Gmail.</p>
    <p className="lead-settings-note">Google’s permission covers managing drafts and sending email. Vigil uses it to prepare drafts only. It does not read your inbox or send replies automatically. This connection belongs to your account.</p>
    <p className="lead-settings-note"><a href="/gmail-privacy" className="underline">Gmail connection privacy</a></p>
  </section>;
}
