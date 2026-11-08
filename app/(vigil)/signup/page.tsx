import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/vigil/Logo";
import { LoginForm } from "../login/LoginForm";
import { getViewer } from "@/lib/vigil/auth/session";
import { loginDestination, safeNextPath } from "@/lib/vigil/auth/redirects";
export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false },
};
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: requested } = await searchParams;
  const viewer = await getViewer();
  if (viewer) redirect(loginDestination(requested, viewer.staffRole));
  const next = safeNextPath(requested);
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-7 text-center">
          <Link
            href="/"
            aria-label="Vigil Studios home"
            className="inline-flex"
          >
            <Logo size="lg" />
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Your business starts here
          </h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
            Create your free account. Find your website when you&apos;re ready.
          </p>
        </header>
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
          <LoginForm
            signup
            next={next}
            initialError={null}
            googleEnabled={process.env.VIGIL_GOOGLE_AUTH_ENABLED === "true"}
          />
        </section>
        <p className="mt-6 text-center text-xs text-[color:var(--text-secondary)]">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-[color:var(--text-primary)] underline"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-[11px] text-[color:var(--text-secondary)]">
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/account-privacy" className="underline">
            Account privacy
          </Link>
        </p>
      </div>
    </main>
  );
}
