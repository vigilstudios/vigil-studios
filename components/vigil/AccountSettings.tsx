"use client";
import { useActionState } from "react";
import { saveAccountName } from "@/lib/vigil/actions/account";
import { FormError, FormSuccess, inputClass, labelClass } from "./ui";
export function AccountNameForm({ name }: { name: string | null }) {
  const [state, action, pending] = useActionState(
    async (_previous: unknown, form: FormData) => saveAccountName(form),
    null,
  );
  return (
    <form action={action} className="mt-4 max-w-md space-y-3">
      <label className={labelClass} htmlFor="account-name">
        Your name
      </label>
      <input
        name="full_name"
        id="account-name"
        autoComplete="name"
        required
        maxLength={120}
        defaultValue={name ?? ""}
        className={inputClass}
      />
      <button disabled={pending} className="btn-secondary min-h-11 text-sm">
        {pending ? "Saving…" : "Save name"}
      </button>
      {state?.ok ? (
        <FormSuccess message="Name saved." />
      ) : (
        <FormError message={state?.error} />
      )}
    </form>
  );
}
