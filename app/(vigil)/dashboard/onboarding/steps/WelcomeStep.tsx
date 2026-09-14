"use client";

import Link from "next/link";
import { ArrowRight, Clock, Save, ShieldCheck } from "lucide-react";
import { ONBOARDING_LATER_HREF } from "@/lib/vigil/onboarding/constants";
import type { VirtueLine } from "@/lib/vigil/onboarding/virtue-copy";
import { VirtueSays } from "../wizard-ui";

export function WelcomeStep({ line, businessName, onStart }: { line: VirtueLine; businessName: string; onStart: () => void }) {
  const items = [
    { icon: Clock, title: "About ten minutes", body: "Six short steps: basics, what you offer, your story, brand and photos, your domain, then a quick review." },
    { icon: Save, title: "Saves as you go", body: "Leave at any point. When you come back, I'll pick up where you stopped." },
    { icon: ShieldCheck, title: "Nothing technical", body: `The Vigil team builds ${businessName}'s site from what you tell me. Where a step touches something technical, I'll walk you through it.` },
  ];
  return (
    <div>
      <VirtueSays line={line} size="lg" />
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-xl border border-[color:var(--border)] p-3">
            <Icon className="h-4 w-4 text-[color:var(--accent)]" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={ONBOARDING_LATER_HREF} className="order-2 inline-flex min-h-11 items-center text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] sm:order-1">
          Look around the dashboard first
        </Link>
        <button type="button" onClick={onStart} className="btn-primary order-1 min-h-12 !px-6 text-sm sm:order-2">
          Let&apos;s begin <ArrowRight className="ml-1.5 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
