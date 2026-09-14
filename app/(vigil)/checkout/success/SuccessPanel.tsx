"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { StatusLine } from "@/components/vigil/widgets";
import { resendWelcome } from "@/lib/vigil/actions/checkout";
import { VIRTUE_NOTE } from "@/lib/vigil/onboarding/virtue-copy";

/** After payment: Virtue explains what happens next while the account is provisioned. */
export function SuccessPanel({ orderId, email, status, businessName }: { orderId: string; email: string; status: string; businessName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sent, setSent] = useState<string | null>(null);

  // While the webhook finishes, refresh a few times so the page settles on its own.
  useEffect(() => {
    if (status === "provisioned") return;
    const id = window.setTimeout(() => router.refresh(), 2500);
    return () => window.clearTimeout(id);
  }, [status, router]);

  const ready = status === "provisioned";
  const paid = status === "paid";
  return (
    <div className="max-w-xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <VirtueOrb size="lg" state={ready ? "done" : "working"} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight">{ready ? `Hello. I'm Virtue, and ${businessName} is set up.` : paid ? "Payment received. I'm setting up your account." : "Confirming your payment."}</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            {ready ? (
              <>
                I&apos;ve sent a sign-in link to <b className="text-[color:var(--text-primary)]">{email}</b>. It opens your dashboard, where I&apos;ll walk you through everything the team needs to build your site. No password to remember.
              </>
            ) : (
              <>This takes a few seconds. Your sign-in link goes to <b className="text-[color:var(--text-primary)]">{email}</b> as soon as it is done.</>
            )}
          </p>
          <div className="mt-3">
            <StatusLine tone={ready ? "good" : "info"} label={ready ? "Account ready" : paid ? "Setting up your account" : "Confirming payment"} size="sm" />
          </div>
        </div>
      </div>

      <ol className="mt-6 space-y-2 border-t border-[color:var(--border)] pt-4 text-sm">
        <li className="flex gap-2"><span className="font-semibold text-[color:var(--accent)]">1.</span> Open the email and tap <b>Start your onboarding</b>.</li>
        <li className="flex gap-2"><span className="font-semibold text-[color:var(--accent)]">2.</span> Tell me about your business, hours, what you offer, photos and your domain — about ten minutes, saved as you go.</li>
        <li className="flex gap-2"><span className="font-semibold text-[color:var(--accent)]">3.</span> The team builds. You review. We launch on your domain.</li>
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || !ready}
          className="btn-secondary min-h-10 !px-3 !py-1.5 text-xs disabled:opacity-60"
          onClick={() =>
            start(async () => {
              const res = await resendWelcome(orderId);
              setSent(res.ok ? "Sent. Check your inbox (and spam)." : res.error);
            })
          }
        >
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          {pending ? "Sending…" : "Resend the sign-in email"}
        </button>
        {sent ? <span className="text-xs text-[color:var(--text-secondary)]">{sent}</span> : null}
      </div>
      <p className="mt-5 text-[11px] text-[color:var(--text-secondary)]">{VIRTUE_NOTE}</p>
    </div>
  );
}
