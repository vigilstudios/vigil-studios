import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/vigil/Logo";

/** Public, minimal chrome for checkout and its success page. */
export function CheckoutShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="vigil-frame min-h-screen bg-[color:var(--bg-primary)] text-[13px] text-[color:var(--text-primary)]">
      <header className="border-b border-[color:var(--border)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Vigil Studios home" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-sm font-semibold">Vigil Studios</span>
          </Link>
          <Link href="/login" className="text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">Already a customer? Sign in</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-[color:var(--text-secondary)]">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
