"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, Mail } from "lucide-react";
import {
  registerWithPassword,
  signInWithEmail,
  signInWithGoogle,
  signInWithPassword,
  type PasswordSignInState,
  type SignInState,
} from "@/lib/vigil/auth/actions";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";
import { MIN_PASSWORD_LENGTH } from "@/lib/vigil/auth/password";

export function LoginForm({
  next,
  initialError,
  initialEmail = "",
  signup = false,
  googleEnabled = false,
}: {
  next: string;
  initialError: string | null;
  initialEmail?: string;
  signup?: boolean;
  googleEnabled?: boolean;
}) {
  const [mode, setMode] = useState<"password" | "link">(
    initialEmail || initialError ? "link" : "password",
  );
  const [email, setEmail] = useState(initialEmail),
    [showPassword, setShowPassword] = useState(false),
    [remember, setRemember] = useState(true);
  const [linkState, linkAction, linkPending] = useActionState<
    SignInState,
    FormData
  >(signInWithEmail, null);
  const [signupState, signupAction, signupPending] = useActionState<
    SignInState,
    FormData
  >(registerWithPassword, null);
  const [pwState, pwAction, pwPending] = useActionState<
    PasswordSignInState,
    FormData
  >(signInWithPassword, null);
  const [googleState, googleAction, googlePending] = useActionState<
    PasswordSignInState,
    FormData
  >(signInWithGoogle, null);
  const pending = linkPending || pwPending || signupPending || googlePending;
  const result = signup
    ? signupState
    : mode === "password"
      ? pwState
      : linkState;
  const sent = signup
    ? signupState?.ok
      ? signupState.data.email
      : null
    : linkState?.ok
      ? linkState.data.email
      : null;
  const context = (
    <>
      <input type="hidden" name="next" value={next} />
      <input
        type="hidden"
        name="remember"
        value={remember ? "remember" : "browser"}
      />
    </>
  );
  if (sent)
    return (
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent)]">
          <Mail size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Check your inbox</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            {signup
              ? "Confirm your email to open your account."
              : "Your sign-in link is on its way."}{" "}
            Check{" "}
            <strong className="text-[color:var(--text-primary)]">{sent}</strong>
            , including spam. If this address already has an account, you can
            sign in below.
          </p>
        </div>
        {!signup && (
          <form action={linkAction}>
            {context}
            <input type="hidden" name="email" value={sent} />
            <button
              className="btn-secondary min-h-11 w-full text-sm"
              disabled={pending}
            >
              Send another link
            </button>
          </form>
        )}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="btn-secondary min-h-11 w-full text-sm"
        >
          Back to sign in
        </Link>
      </div>
    );
  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <form action={googleAction}>
            {context}
            <button
              type="submit"
              disabled={pending}
              className="btn-secondary flex min-h-12 w-full items-center justify-center gap-3 text-sm"
            >
              <GoogleIcon />
              {googlePending ? "Opening Google…" : "Continue with Google"}
            </button>
            <FormError
              message={
                googleState && !googleState.ok ? googleState.error : null
              }
            />
          </form>
          <div className="flex items-center gap-3 text-[11px] text-[color:var(--text-secondary)]">
            <span className="h-px flex-1 bg-[color:var(--border)]" />
            or use email
            <span className="h-px flex-1 bg-[color:var(--border)]" />
          </div>
        </>
      )}
      <form
        action={
          signup ? signupAction : mode === "password" ? pwAction : linkAction
        }
        className="space-y-4"
      >
        {context}
        {signup && (
          <div>
            <label htmlFor="full_name" className={labelClass}>
              Your name
            </label>
            <input
              id="full_name"
              name="full_name"
              autoComplete="name"
              required
              maxLength={120}
              placeholder="Full name"
              className={inputClass}
              disabled={pending}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete={mode === "password" || signup ? "username" : "email"}
            required
            maxLength={254}
            placeholder="you@yourbusiness.com"
            className={inputClass}
            disabled={pending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {(signup || mode === "password") && (
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                required
                minLength={signup ? MIN_PASSWORD_LENGTH : undefined}
                maxLength={128}
                className={`${inputClass} !pr-12`}
                disabled={pending}
                aria-describedby={signup ? "password-help" : undefined}
              />
              <button
                type="button"
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center text-[color:var(--text-secondary)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {signup && (
              <p
                id="password-help"
                className="mt-2 text-xs text-[color:var(--text-secondary)]"
              >
                At least {MIN_PASSWORD_LENGTH} characters. Your password manager
                can create and save one.
              </p>
            )}
          </div>
        )}
        <label className="flex items-center gap-2.5 text-xs text-[color:var(--text-secondary)]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
            disabled={pending}
          />
          Keep me signed in on this device
        </label>
        <FormError
          message={result && !result.ok ? result.error : initialError}
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-primary flex min-h-12 w-full items-center justify-center gap-2 text-sm"
        >
          {pending
            ? signup
              ? "Creating account…"
              : "Signing in…"
            : signup
              ? "Create account"
              : mode === "password"
                ? "Sign in"
                : "Email me a sign-in link"}
          <ArrowRight size={16} />
        </button>
        {!signup && (
          <button
            type="button"
            onClick={() => setMode(mode === "password" ? "link" : "password")}
            className="min-h-10 w-full text-center text-xs text-[color:var(--text-secondary)] hover:underline"
            disabled={pending}
          >
            {mode === "password"
              ? "Forgot your password? Use an email link"
              : "Sign in with a password instead"}
          </button>
        )}
      </form>
      {signup && (
        <p className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
          <Check size={14} />
          No purchase or payment details required.
        </p>
      )}
    </div>
  );
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.06.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.42 13.92a6 6 0 0 1 0-3.84V7.49H3.08a10 10 0 0 0 0 9.02l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.92 5.49l3.34 2.59A6 6 0 0 1 12 5.96Z"
      />
    </svg>
  );
}
