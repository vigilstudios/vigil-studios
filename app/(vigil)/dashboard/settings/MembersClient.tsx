"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteMember, removeMember, revokeInvite, type InviteState } from "@/lib/vigil/actions/organization";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";

export function InviteForm({ canInviteOwner }: { canInviteOwner: boolean }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteMember, null);
  const issues = state && !state.ok ? state.issues ?? {} : {};
  return (
    <form action={action} className="mt-2 grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end" noValidate>
      <div>
        <label htmlFor="invite-email" className={labelClass}>
          Email
        </label>
        <input id="invite-email" name="email" type="email" className={inputClass} placeholder="teammate@yourbusiness.com" required disabled={pending} />
        {issues.email ? <p className="mt-1 text-xs text-[#ef4444]">{issues.email[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="invite-role" className={labelClass}>
          Role
        </label>
        <select id="invite-role" name="role" className={inputClass} defaultValue="member" disabled={pending}>
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          {canInviteOwner ? <option value="owner">Owner</option> : null}
        </select>
      </div>
      <button type="submit" className="btn-secondary text-sm" disabled={pending}>
        {pending ? "Inviting…" : "Send invite"}
      </button>
      <div className="sm:col-span-3">
        <FormError message={state && !state.ok ? state.error : null} />
        <FormSuccess message={state?.ok ? "Invitation recorded. They can sign in at /login with that email." : null} />
      </div>
    </form>
  );
}

export function MemberActions({ userId, isSelf, canRemove }: { userId: string; isSelf: boolean; canRemove: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!isSelf && !canRemove) return null;
  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        className="text-xs text-[color:var(--text-secondary)] underline hover:text-[#ef4444]"
        onClick={() => {
          if (!confirm(isSelf ? "Leave this organization?" : "Remove this person from the organization?")) return;
          startTransition(async () => {
            const res = await removeMember(userId);
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}
      >
        {isSelf ? "Leave" : "Remove"}
      </button>
      {error ? <p className="mt-1 text-xs text-[#ef4444]">{error}</p> : null}
    </div>
  );
}

export function InviteActions({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-xs text-[color:var(--text-secondary)] underline hover:text-[#ef4444]"
      onClick={() =>
        startTransition(async () => {
          await revokeInvite(inviteId);
          router.refresh();
        })
      }
    >
      Revoke
    </button>
  );
}
