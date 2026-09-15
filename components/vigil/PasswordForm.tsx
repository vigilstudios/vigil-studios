"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { setPassword, type PasswordState } from "@/lib/vigil/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/vigil/auth/password";
import { FormError, FormSuccess, inputClass, labelClass } from "./ui";

/** Set or change the signed-in person's password. */
export function PasswordForm({ hasPassword, compact }: { hasPassword: boolean; compact?: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    async (prev, fd) => {
      const res = await setPassword(prev, fd);
      if (res?.ok) router.refresh();
      return res;
    },
    null
  );
  const issues = state && !state.ok ? state.issues ?? {} : {};

  if (state?.ok) {
    return <FormSuccess message="Password saved. Next time, sign in with your email and password." />;
  }

  return (
    <form action={action} className={compact ? "grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" : "mt-4 grid gap-4 sm:grid-cols-2"} noValidate>
      <div>
        <label htmlFor="new-password" className={labelClass}>{hasPassword ? "New password" : "Password"}</label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required className={inputClass} disabled={pending} />
        {issues.password ? <p className="mt-1 text-xs text-[color:var(--status-bad)]">{issues.password[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="confirm-password" className={labelClass}>Confirm</label>
        <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required className={inputClass} disabled={pending} />
        {issues.confirm ? <p className="mt-1 text-xs text-[color:var(--status-bad)]">{issues.confirm[0]}</p> : null}
      </div>
      <div className={compact ? "" : "sm:col-span-2"}>
        <button type="submit" className="btn-primary min-h-11 !px-4 !py-2 text-sm" disabled={pending}>
          {pending ? "Saving…" : hasPassword ? "Change password" : "Save password"}
        </button>
      </div>
      {!compact ? <p className="text-xs text-[color:var(--text-secondary)] sm:col-span-2">At least {MIN_PASSWORD_LENGTH} characters. Forgot it later? Email yourself a sign-in link from the sign-in page and set a new one here.</p> : null}
      <div className={compact ? "sm:col-span-3" : "sm:col-span-2"}>
        <FormError message={state && !state.ok ? state.error : null} />
      </div>
    </form>
  );
}
