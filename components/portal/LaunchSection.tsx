import { ArrowRight, Rocket } from "lucide-react";

export default function LaunchSection() {
  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] p-6 shadow-[0_30px_120px_-70px_color-mix(in_srgb,var(--accent)_45%,transparent)] backdrop-blur-xl sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--bg-primary)]">
            <Rocket className="h-6 w-6" />
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">
            Final Launch
          </p>

          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-4xl">
            From onboarding to launch, every step is designed to move with
            clarity.
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--text-secondary)] sm:text-base">
            Once your content, assets, domain details, and approvals are ready,
            we’ll move through design, development, testing, final review, and
            launch. You’ll never have to guess what comes next.
          </p>
        </div>

        <a
          href="#client-checklist"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--text-primary)] px-6 py-3 text-sm font-semibold text-[color:var(--bg-primary)] transition hover:opacity-90"
        >
          Review checklist
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}