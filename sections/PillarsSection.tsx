import Link from "next/link";
import { ArrowRight, Globe, MonitorSmartphone } from "lucide-react";
import { Chip, Container, Eyebrow, Section, SectionIntro } from "@/components/site/primitives";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { PILLARS } from "@/lib/site-copy";

const toneColor = { accent: "var(--accent)", violet: "var(--accent-2)", amber: "var(--accent-3)", teal: "var(--accent-4)" } as const;

/** Websites → Vigil → Virtue: the three things, each with its own colour. */
export function PillarsSection() {
  return (
    <Section id="what-you-get">
      <Container>
        <SectionIntro eyebrow="What you get" title="Three things, one relationship." lead="A website to start with, a platform that keeps it running, and an AI employee who works inside it. You deal with Vigil; Vigil deals with everything underneath." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PILLARS.map((p, i) => {
            const color = toneColor[p.tone];
            return (
              <Link key={p.key} href={p.href} className="group relative flex flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 transition-colors hover:border-[color:var(--text-secondary)]/40">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: color }} aria-hidden />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)]/60">
                  {p.key === "virtue" ? <VirtueOrb size="sm" label="" /> : p.key === "websites" ? <MonitorSmartphone className="h-5 w-5" style={{ color }} /> : <Globe className="h-5 w-5" style={{ color }} />}
                </div>
                <div className="mt-5">
                  <Eyebrow tone={p.tone}>{["Websites", "Vigil", "Virtue"][i]}</Eyebrow>
                  <h3 className="text-xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[color:var(--text-secondary)]">{p.body}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium" style={{ color }}>
                  {p.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                {p.key === "virtue" ? <div className="absolute right-5 top-5"><Chip tone="violet">Growth · Priority</Chip></div> : null}
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
