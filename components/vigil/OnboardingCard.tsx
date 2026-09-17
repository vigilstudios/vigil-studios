import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { briefCompletion, type Brief, type ProjectKind } from "@/lib/vigil/onboarding/brief";
import { RESPONSE_WINDOW } from "@/lib/vigil/onboarding/virtue-copy";
import { formatDate } from "@/lib/vigil/format";
import { VirtueOrb } from "./VirtueOrb";
import { Checklist } from "./widgets";

/**
 * The Overview's Virtue card. Before the brief is sent: "Finish setting up"
 * with what is left. After: what happens next, with the configurable
 * response window. Renders nothing when there is no project to onboard.
 */
export function OnboardingCard({ brief, completedAt, businessName, projectKind }: { brief: Brief; completedAt: string | null; businessName: string; projectKind: ProjectKind }) {
  if (completedAt) {
    return (
      <section className="flex gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
        <VirtueOrb size="md" state="done" className="shrink-0" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">I&apos;ve handed your details to the team.</p>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
            Sent {formatDate(completedAt)}. {projectKind === "express" ? `You'll hear from Vigil within ${RESPONSE_WINDOW} with a first look at ${businessName}'s site.` : brief.kickoff?.mode === "call" ? "Your kickoff call with our team is the next step." : `Vigil will review the scope and contact you within ${RESPONSE_WINDOW} to confirm the site plan and timeline.`} Need to add something?{" "}
            <Link href="/dashboard/onboarding" className="underline underline-offset-2 hover:text-[color:var(--text-primary)]">See what you sent</Link>.
          </p>
        </div>
      </section>
    );
  }

  const items = briefCompletion(brief, projectKind);
  const done = items.filter((i) => i.done).length;
  const started = brief.progress.lastStep !== "welcome" || done > 0;
  return (
    <section className="rounded-xl border border-[color:var(--accent)]/40 bg-[color-mix(in_srgb,var(--accent)_6%,var(--bg-surface))] p-4">
      <div className="flex items-center gap-3">
        <VirtueOrb size="md" state="idle" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">{started ? "Let's finish setting up." : "Let me get you set up."}</p>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
            {started
              ? `${done} of ${items.length} parts done. The team starts building once you send the brief.`
              : projectKind === "express"
                ? `About ten minutes: the basics, what you offer, your story, photos and your domain. Everything saves as you go.`
                : `Tell us the basics, goals, pages, functionality, content, brand and domain. Everything saves as you go.`}
          </p>
        </div>
        <Link href="/dashboard/onboarding" className="btn-primary ml-auto min-h-11 shrink-0 !px-5 !py-2.5 text-sm">
          {started ? "Continue" : "Start"} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>
      {started ? (
        <div className="mt-3">
          <Checklist items={items.map((i) => ({ label: i.label, tone: i.done ? "good" : "neutral" }))} />
        </div>
      ) : null}
    </section>
  );
}
