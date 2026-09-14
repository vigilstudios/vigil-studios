import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/vigil/Logo";
import { safeNextPath } from "@/lib/vigil/auth/redirects";

export const metadata: Metadata = { title: "Sign in" };

const errorMessages: Record<string, string> = {
  missing_code: "That sign-in link was incomplete. Request a new one below.",
  link_invalid: "That sign-in link is not valid. Request a new one below.",
  link_expired: "That sign-in link has expired. Request a new one below.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error = params.error ? errorMessages[params.error] ?? "Something went wrong. Please try again." : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Vigil Studios home">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in to Vigil</h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
            Enter your email and we will send you a sign-in link. No password needed.
          </p>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
          <LoginForm next={next} initialError={error} />
        </div>

        <p className="mt-6 text-center text-xs text-[color:var(--text-secondary)]">
          Access is by invitation from Vigil Studios. Need help?{" "}
          <a href="mailto:hello@vigilstudios.co" className="underline">
            hello@vigilstudios.co
          </a>
        </p>
      </div>
    </main>
  );
}
