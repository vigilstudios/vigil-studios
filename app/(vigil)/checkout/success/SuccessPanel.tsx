"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { LogIn, Mail } from "lucide-react";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { VirtueSpeech, useSpeaking, type SpeechLine } from "@/components/vigil/VirtueSpeech";
import { resendWelcome } from "@/lib/vigil/actions/checkout";
import { VIRTUE_NOTE } from "@/lib/vigil/onboarding/virtue-copy";

/**
 * After payment: Virtue, centred, says what happened and the one thing to
 * do next — open the email. Nothing else competes for attention.
 */
export function SuccessPanel({ orderId, email, status, businessName, emailSent }: { orderId: string; email: string; status: string; businessName: string; emailSent: boolean | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sent, setSent] = useState<string | null>(null);
  const [spoken, setSpoken] = useState(false);
  const speech = useSpeaking();

  // While the webhook finishes, refresh a few times so the page settles on its own.
  useEffect(() => {
    if (status === "provisioned") return;
    const id = window.setTimeout(() => router.refresh(), 2500);
    return () => window.clearTimeout(id);
  }, [status, router]);

  const ready = status === "provisioned";
  const emailFailed = ready && emailSent === false;
  const signInHref = `/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent("/dashboard/onboarding")}`;

  const lines: SpeechLine[] = !ready
    ? [{ text: "Hello. I'm Virtue.", emphasis: true }, { text: `Payment received. Give me a moment while I set up ${businessName}.` }]
    : emailFailed
      ? [
          { text: `Hello. I'm Virtue, and ${businessName} is ready.`, emphasis: true },
          { text: `The welcome email could not be sent just now, so use the button below. The sign-in page will email ${email} a one-time link and bring you straight to me.` },
        ]
      : [
          { text: `Hello. I'm Virtue, and ${businessName} is ready.`, emphasis: true },
          { text: `I've sent a sign-in link to ${email}. Open it and I'll bring you into your dashboard, where we set up your site together. No password needed.` },
        ];

  return (
    <div className="flex w-full max-w-xl flex-col items-center">
      <VirtueOrb size="xl" state={!ready ? "thinking" : speech.speaking ? "talking" : "idle"} />
      <div className="mt-8 min-h-[7rem] w-full">
        <VirtueSpeech key={`${status}-${String(emailSent)}`} lines={lines} onStart={speech.onStart} onDone={() => { speech.onDone(); setSpoken(true); }} />
      </div>

      <div className={clsx("mt-8 flex w-full flex-col items-center gap-3 transition-opacity duration-700", spoken && ready ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!(spoken && ready)}>
        {emailFailed ? (
          <Link href={signInHref} className="btn-primary min-h-12 w-full !px-6 text-sm sm:w-auto">
            <LogIn className="mr-2 h-4 w-4" /> Sign in with a link
          </Link>
        ) : (
          <>
            <p className="text-xs text-[color:var(--text-secondary)]">Check {email} — and the spam folder, just in case.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={pending}
                className="btn-secondary min-h-11 !px-4 !py-2 text-sm disabled:opacity-60"
                onClick={() =>
                  start(async () => {
                    const res = await resendWelcome(orderId);
                    setSent(res.ok ? "Sent again." : res.error);
                  })
                }
              >
                <Mail className="mr-2 h-4 w-4" /> {pending ? "Sending…" : "Send it again"}
              </button>
              <Link href={signInHref} className="btn-secondary min-h-11 !px-4 !py-2 text-sm">
                <LogIn className="mr-2 h-4 w-4" /> Sign in with a link instead
              </Link>
            </div>
            {sent ? <p className="text-xs text-[color:var(--text-secondary)]">{sent}</p> : null}
          </>
        )}
        <p className="mt-6 max-w-sm text-center text-[11px] text-[color:var(--text-secondary)]">{VIRTUE_NOTE}</p>
      </div>
    </div>
  );
}
