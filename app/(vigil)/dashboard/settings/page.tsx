import type { Metadata } from "next";
import { Card, PageHeader, Table, tdClass, thClass } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { formatDate, titleCase } from "@/lib/vigil/format";
import { getOrgInvites, getOrgMembers } from "@/lib/vigil/queries/dashboard";
import { InviteForm, MemberActions, InviteActions } from "./MembersClient";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "@/components/vigil/PasswordForm";
import { hasPassword } from "@/lib/vigil/auth/password";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireOrgContext("/dashboard/settings");
  const canManage = ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating;
  const isOwner = ctx.role === "owner" || ctx.isImpersonating;
  const [members, invites] = await Promise.all([
    getOrgMembers(ctx.organization.id),
    canManage ? getOrgInvites(ctx.organization.id) : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title="Business and account" description="Who Vigil is working for, and who on your team can sign in." />

      <Card>
        <h2 className="text-base font-semibold">Business profile</h2>
        <ProfileForm organization={ctx.organization} readOnly={!canManage} />
      </Card>

      <Card className="mt-4">
        <h2 className="text-base font-semibold">Your sign-in</h2>
        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
          Signed in as <b className="text-[color:var(--text-primary)]">{ctx.profile.email}</b>.{" "}
          {hasPassword(ctx.user) ? "You sign in with a password; a one-time email link always works as a backup." : "Set a password so you can sign in without waiting for an email link."}
        </p>
        <PasswordForm hasPassword={hasPassword(ctx.user)} />
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Team</h2>
          <span className="text-xs text-[color:var(--text-secondary)]">Your role: {titleCase(ctx.role)}</span>
        </div>
        <div className="mt-4">
          <Table>
            <thead>
              <tr>
                <th className={thClass}>Person</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Since</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user_id}>
                  <td className={tdClass}>
                    <div className="font-medium">{m.profile?.full_name ?? "Not provided"}</div>
                    <div className="text-xs text-[color:var(--text-secondary)]">{m.profile?.email}</div>
                  </td>
                  <td className={tdClass}>{titleCase(m.role)}</td>
                  <td className={tdClass}>{formatDate(m.created_at)}</td>
                  <td className={tdClass}>
                    <MemberActions userId={m.user_id} isSelf={m.user_id === ctx.user.id} canRemove={isOwner} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {canManage ? (
          <>
            <h3 className="mt-6 text-sm font-semibold">Invite someone</h3>
            <InviteForm canInviteOwner={isOwner} />
            {invites.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Pending invitations</h3>
                <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
                  {invites.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <span className="font-medium">{i.email}</span>{" "}
                        <span className="text-[color:var(--text-secondary)]">· {titleCase(i.role)} · expires {formatDate(i.expires_at)}</span>
                      </div>
                      <InviteActions inviteId={i.id} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card className="mt-4">
        <h2 className="text-base font-semibold">Your account</h2>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Signed in as {ctx.profile.email}. Sign-in is by email link; there is no password to manage.
        </p>
      </Card>
    </div>
  );
}
