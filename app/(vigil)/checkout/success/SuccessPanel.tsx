"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import { resendWelcome } from "@/lib/vigil/actions/checkout";

export function SuccessPanel({ orderId, email, status }: { orderId: string; email: string; status: string }) {
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
  return (
    <div className="max-w-xl rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
      <div className="flex items-start gap-3">
        {ready ? <CheckCircle2 className="mt-0.5 h-6 w-6 text-[color:var(--status-good)]" /> : <Clock className="mt-0.5 h-6 w-6 text-[color:var(--status-info)]" />}
        <div>
          <p className="text-base font-semibold">{ready ? "Payment received and your account is ready." : status === "paid" ? "Payment received. Setting up your account…" : "Confirming your payment…"}</p>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
            We have sent a sign-in link to <b className="text-[color:var(--text-primary)]">{email}</b>. It opens your dashboard, where a short onboarding tells us everything we need to start building. No password to remember.
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-2 border-t border-[color:var(--border)] pt-4 text-sm">
        <li className="flex gap-2"><span className="font-semibold">1.</span> Open the email and tap <b>Start your onboarding</b>.</li>
        <li className="flex gap-2"><span className="font-semibold">2.</span> Tell us about your business, hours, services and photos — about ten minutes, save as you go.</li>
        <li className="flex gap-2"><span className="font-semibold">3.</span> We build. You review. We launch on your domain.</li>
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || !ready}
          className="btn-secondary !px-3 !py-1.5 text-xs"
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
    </div>
  );
}
