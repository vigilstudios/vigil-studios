import Link from "next/link";
import { ArrowUpRight, Hammer } from "lucide-react";
import { Chip, Container, Section, SectionIntro } from "@/components/site/primitives";
import { EXPRESS_TEMPLATES } from "@/lib/constants";

/** The catalogue's industries; each card is a real template, not a stock photo. */
export function IndustriesSection() {
  return (
    <Section id="industries">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionIntro eyebrow="Vigil Express" title="Made for your kind of business." lead="Each template is a finished example site for one industry. See the whole thing before you buy." />
          <Link href="/express" className="btn-secondary min-h-11 shrink-0 !px-5 text-sm">Browse the catalogue <ArrowUpRight className="ml-1.5 h-4 w-4" /></Link>
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPRESS_TEMPLATES.map((t) => {
            const coming = t.status === "coming";
            const inner = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{t.industry}</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">{t.example}</h3>
                  </div>
                  {coming ? <Chip tone="amber"><Hammer className="h-3 w-3" /> Under construction</Chip> : <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.accent }} aria-hidden />}
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{t.description}</p>
              </>
            );
            return (
              <li key={t.slug}>
                {coming ? (
                  <div className="h-full rounded-2xl border border-dashed border-[color:var(--border)] p-5 opacity-80">{inner}</div>
                ) : (
                  <Link href="/express" className="block h-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 transition-colors hover:border-[color:var(--text-secondary)]/40">
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
