import { ActionForm } from './ActionControls';
import type { ActionResult } from '@/lib/vigil/auth/errors';
import { leadReplyPlatforms, leadReplyPlatformLabels, type LeadReplyPlatform } from '@/lib/vigil/leads/reply';

export function LeadReplyPreferencesForm({ platform, action }: {
  platform: LeadReplyPlatform;
  action: (form: FormData) => Promise<ActionResult<unknown>>;
}) {
  return <ActionForm action={action} submitLabel="Save reply preference" className="lead-form lead-reply-form" resetOnSuccess={false}>
    <label className="lead-field" htmlFor="lead-reply-platform">Default reply platform
      <select id="lead-reply-platform" name="reply_platform" defaultValue={platform} required aria-describedby="lead-reply-help">
        {leadReplyPlatforms.map(value => <option value={value} key={value}>{leadReplyPlatformLabels[value]}</option>)}
      </select>
      <small id="lead-reply-help">Gmail and Outlook open in a new tab. Choose Default email app to use the mail app set up on your device.</small>
    </label>
  </ActionForm>;
}
