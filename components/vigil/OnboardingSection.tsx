"use client";

import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

/** The shared visual hierarchy for intake questions and their review. */
export function OnboardingSection({ icon: Icon, title, description, optional, action, children, className }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  optional?: boolean;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={clsx("min-w-0 space-y-4 border-t border-[color:var(--border)] pt-6 first:border-t-0 first:pt-0", className)}>
      <header className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <h2 id={id} className="flex min-w-0 items-start gap-2.5 text-[15px] font-semibold leading-6 text-[color:var(--text-primary)]">
            <Icon aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span>{title}{optional && <span className="ml-2 text-[13px] font-normal text-[color:var(--text-secondary)]"> (optional)</span>}</span>
          </h2>
          {action}
        </div>
        {description && <p className="max-w-prose text-[13px] leading-5 text-[color:var(--text-secondary)]">{description}</p>}
      </header>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}
