import Link from "next/link";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { ThemeSwitch } from "./ThemeSwitch";

/**
 * Bottom of the sidebar: who is signed in, theme, sign-out and the
 * Admin <-> Client cross-link. Renders a compact icon row when the sidebar is
 * collapsed (the frame hides the text via the data-collapsed attribute).
 */
export function AccountBlock({
  name,
  email,
  crossLink,
}: {
  name: string | null;
  email: string;
  crossLink?: { href: string; label: string } | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-1 py-1 [aside[data-collapsed=true]_&]:justify-center">
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[11px] font-semibold uppercase text-[color:var(--accent)]"
        >
          {(name ?? email).slice(0, 1)}
        </span>
        <div className="min-w-0 [aside[data-collapsed=true]_&]:hidden">
          <div className="truncate text-xs font-medium">{name ?? email}</div>
          {name ? <div className="truncate text-[11px] text-[color:var(--text-secondary)]">{email}</div> : null}
        </div>
      </div>
      <div className="flex items-center gap-0.5 whitespace-nowrap [aside[data-collapsed=true]_&]:flex-col">
        <ThemeSwitch />
        {crossLink ? (
          <Link
            href={crossLink.href}
            title={crossLink.label}
            className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)] hover:text-[color:var(--text-primary)]"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-xs [aside[data-collapsed=true]_&]:hidden">{crossLink.label}</span>
          </Link>
        ) : null}
        <form action="/auth/signout" method="post" className="ml-auto [aside[data-collapsed=true]_&]:ml-0">
          <button
            type="submit"
            title="Sign out"
            className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)] hover:text-[color:var(--text-primary)]"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs [aside[data-collapsed=true]_&]:hidden">Sign out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
