import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/vigil/ui";
import { getOrgContext, requireViewer } from "@/lib/vigil/auth/session";

export const metadata: Metadata = { title: "Welcome" };

/** Signed in, but not yet attached to a business. */
export default async function WelcomePage() {
  const viewer = await requireViewer("/dashboard");
  const ctx = await getOrgContext();
  if (ctx) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card>
        <h1 className="text-xl font-semibold">Welcome to Vigil</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
          You are signed in as <strong className="text-[color:var(--text-primary)]">{viewer.profile.email}</strong>, but this
          address is not attached to a business yet.
        </p>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
          If Vigil Studios is building your website, we will connect your account as part of onboarding. If someone on
          your team invited you, ask them to check the email address on the invitation.
        </p>
        <p className="mt-5 text-sm">
          Questions? <a className="underline" href="mailto:hello@vigilstudios.co">hello@vigilstudios.co</a>
        </p>
      </Card>
    </div>
  );
}
