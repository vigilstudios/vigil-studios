import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { COMPARISON } from "@/lib/site-copy";

/** Responsibility, not features: what a builder leaves with you and what Vigil takes on. */
export function WhyVigilSection() {
  return (
    <Section id="why-vigil" alt>
      <Container>
        <SectionIntro eyebrow="Why not a builder" tone="amber" title="Builders sell tools. Vigil takes responsibility." lead="A site builder hands you software and wishes you luck. Vigil delivers the website and then operates it, so the technical side is never your job." align="center" />
        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-[color:var(--border)]">
          <div className="grid grid-cols-[1fr_1.2fr_1.2fr] bg-[color:var(--bg-surface-soft)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
            <div className="px-4 py-3" />
            <div className="px-4 py-3">A site builder</div>
            <div className="px-4 py-3 text-[color:var(--accent)]">Vigil</div>
          </div>
          {COMPARISON.map((row) => (
            <div key={row.dimension} className="grid grid-cols-[1fr_1.2fr_1.2fr] border-t border-[color:var(--border)] text-sm">
              <div className="px-4 py-4 font-medium">{row.dimension}</div>
              <div className="px-4 py-4 text-[color:var(--text-secondary)]">{row.builder}</div>
              <div className="px-4 py-4">{row.vigil}</div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-[color:var(--text-secondary)]">
          The exit is part of the deal: you own the site-specific code and your domain, and if you ever leave you take both with you.
        </p>
      </Container>
    </Section>
  );
}
