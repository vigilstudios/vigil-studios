import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { HOW_IT_WORKS } from "@/lib/site-copy";

/** The real path, in the order it happens. Replaces the old agency "process". */
export function HowItWorksSection() {
  return (
    <Section id="how-it-works" alt>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionIntro eyebrow="How it works" tone="teal" title="From a template to a site that is looked after." lead="Five steps. Two of them are yours, and Virtue is with you for both." />
          </div>
          <ol className="relative border-l border-[color:var(--border)] pl-8">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.n} className="relative pb-10 last:pb-0">
                <span className="absolute -left-[2.35rem] top-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--accent-4)] bg-[color:var(--bg-primary)] text-[11px] font-semibold text-[color:var(--accent-4)]">{step.n}</span>
                <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 max-w-xl text-[15px] leading-7 text-[color:var(--text-secondary)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
