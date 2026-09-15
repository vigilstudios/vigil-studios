"use client";

import { useActionState, useState } from "react";
import { signInWithEmail, signInWithPassword, type PasswordSignInState, type SignInState } from "@/lib/vigil/auth/actions";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";

/**
 * Two ways in: password (once one is set) or a one-time email link. The
 * link is the fallback for first sign-ins, forgotten passwords and new
 * devices; it never needs to be the everyday path.
 */
export function LoginForm({ next, initialError, initialEmail = "" }: { next: string; initialError: string | null; initialEmail?: string }) {
  // Arriving with an email (from the checkout success page) means "send me a link".
  const [mode, setMode] = useState<"password" | "link">(initialEmail ? "link" : "password");
  const [email, setEmail] = useState(initialEmail);
  const [linkState, linkAction, linkPending] = useActionState<SignInState, FormData>(signInWithEmail, null);
  const [pwState, pwAction, pwPending] = useActionState<PasswordSignInState, FormData>(signInWithPassword, null);

  if (linkState?.ok) {
    return (
      <div>
        <FormSuccess message={`Check ${linkState.data.email} for your sign-in link. It expires in a few minutes.`} />
        <p className="mt-4 text-xs text-[color:var(--text-secondary)]">Nothing arrived? Look in spam, or request another link.</p>
        <form action={linkAction} className="mt-4">
          <input type="hidden" name="email" value={linkState.data.email} />
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="btn-secondary w-full text-sm" disabled={linkPending}>
            {linkPending ? "Sending…" : "Send another link"}
          </button>
        </form>
      </div>
    );
  }

  const pending = linkPending || pwPending;

  return (
    <form action={mode === "password" ? pwAction : linkAction} noValidate>
      <label htmlFor="email" className={labelClass}>Email address</label>
      <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="you@yourbusiness.com" className={inputClass} disabled={pending} value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode === "password" ? (
        <div className="mt-3">
          <label htmlFor="password" className={labelClass}>Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} disabled={pending} />
        </div>
      ) : null}
      <input type="hidden" name="next" value={next} />
      <FormError message={mode === "password" ? (pwState && !pwState.ok ? pwState.error : initialError) : linkState && !linkState.ok ? linkState.error : initialError} />
      <button type="submit" className="btn-primary mt-4 w-full text-sm" disabled={pending}>
        {mode === "password" ? (pwPending ? "Signing in…" : "Sign in") : linkPending ? "Sending link…" : "Email me a sign-in link"}
      </button>
      <button type="button" onClick={() => setMode(mode === "password" ? "link" : "password")} className="mt-3 w-full text-center text-xs text-[color:var(--text-secondary)] underline-offset-2 hover:underline" disabled={pending}>
        {mode === "password" ? "No password yet, or forgot it? Email me a sign-in link" : "Have a password? Sign in with it"}
      </button>
    </form>
  );
}
