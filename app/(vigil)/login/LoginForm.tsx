"use client";

import { useActionState } from "react";
import { signInWithEmail, type SignInState } from "@/lib/vigil/auth/actions";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInWithEmail, null);

  if (state?.ok) {
    return (
      <div>
        <FormSuccess message={`Check ${state.data.email} for your sign-in link. It expires in a few minutes.`} />
        <p className="mt-4 text-xs text-[color:var(--text-secondary)]">
          Nothing arrived? Look in spam, or request another link.
        </p>
        <form action={action} className="mt-4">
          <input type="hidden" name="email" value={state.data.email} />
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="btn-secondary w-full text-sm" disabled={pending}>
            {pending ? "Sending…" : "Send another link"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      <label htmlFor="email" className={labelClass}>
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="you@yourbusiness.com"
        className={inputClass}
        disabled={pending}
      />
      <input type="hidden" name="next" value={next} />
      <FormError message={state && !state.ok ? state.error : initialError} />
      <button type="submit" className="btn-primary mt-4 w-full text-sm" disabled={pending}>
        {pending ? "Sending link…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
