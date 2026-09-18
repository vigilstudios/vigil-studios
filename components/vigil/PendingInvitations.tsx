"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptInvitation, declineInvitation } from "@/lib/vigil/actions/organization";
import type { PendingInvitation } from "@/lib/vigil/queries/dashboard";
import { Card } from "@/components/vigil/ui";

const ROLE_LABEL: Record<string, string> = { owner: "an owner", manager: "a manager", member: "a member" };

/**
 * Invitations from another customer wait here until the person says yes.
 * Nothing about them is visible to the inviting organization before that.
 */
export function PendingInvitations({ invitations }: { invitations: PendingInvitation[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (invitations.length === 0) return null;

  const answer = (invite: PendingInvitation, accept: boolean) => {
    setError(null);
    setBusy(invite.id);
    start(async () => {
      const res = accept ? await acceptInvitation(invite.id) : await declineInvitation(invite.id);
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (accept) router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Card className="mb-4 border-[color:var(--accent)]/40" as="div">
      <h2 className="text-base font-semibold">{invitations.length === 1 ? "You have an invitation" : "You have invitations"}</h2>
      <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Accepting shares your name and email with that business and gives you access to its dashboard. Declining tells them no.</p>
      <ul className="mt-3 divide-y divide-[color:var(--border)]">
        {invitations.map((invite) => (
          <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">{invite.organization_name}</p>
              <p className="text-xs text-[color:var(--text-secondary)]">
                {invite.invited_by_name ? `${invite.invited_by_name} invited you` : "You were invited"} to join as {ROLE_LABEL[invite.role] ?? invite.role}.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className="btn-secondary text-xs" disabled={pending} onClick={() => answer(invite, false)}>
                {busy === invite.id && pending ? "…" : "Decline"}
              </button>
              <button type="button" className="btn-primary text-xs" disabled={pending} onClick={() => answer(invite, true)}>
                {busy === invite.id && pending ? "…" : "Accept"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-xs text-[#ef4444]">{error}</p> : null}
    </Card>
  );
}
