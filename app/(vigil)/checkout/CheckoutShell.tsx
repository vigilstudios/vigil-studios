import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/vigil/Logo";

/** Public, minimal chrome for checkout and its success page. */
export function CheckoutShell({ title, subtitle, children, centered }: { title?: string; subtitle?: string; children: ReactNode; /** Full-height centred stage with no heading (the Virtue pages). */ centered?: boolean }) {
  if (centered) {
    return (
      <div className="vigil-frame flex min-h-screen flex-col bg-[color:var(--bg-primary)] text-[13px] text-[color:var(--text-primary)]">
        <header className="border-b border-[color:var(--border)]">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link href="/" aria-label="Vigil home" className="flex items-center">
              <Logo size="sm" />
            </Link>
            <Link href="/login" className="text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">Already a customer? Sign in</Link>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">{children}</main>
      </div>
    );
  }
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
        {title ? <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1> : null}
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-[color:var(--text-secondary)]">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
