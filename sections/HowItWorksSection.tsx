import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/Reveal";
import { HOW_IT_WORKS } from "@/lib/site-copy";

/** The real path, in the order it happens. Replaces the old agency "process". */
export function HowItWorksSection() {
  const last = HOW_IT_WORKS.length - 1;
  return (
    <Section id="how-it-works" alt fill>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <Reveal>
            <SectionIntro eyebrow="How it works" tone="teal" title="From the website you choose to a site that is looked after." lead="Five steps. Two of them are yours, and Virtue is with you for both." />
          </Reveal>
          <RevealGroup as="ol">
            {HOW_IT_WORKS.map((step, i) => (
              <RevealItem as="li" key={step.n} className="flex gap-5">
                {/* Number column: the connector sits under the number, centred, and stops at the last step. */}
                <div className="flex shrink-0 flex-col items-center">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--accent-4)] bg-[color:var(--bg-primary)] text-[11px] font-semibold text-[color:var(--accent-4)]">{step.n}</span>
                  {i < last ? <span className="mt-2 w-px flex-1" style={{ background: "color-mix(in srgb, var(--accent-4) 35%, transparent)" }} aria-hidden /> : null}
                </div>
                <div className={i < last ? "pb-7" : undefined}>
                  <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-1.5 max-w-xl text-[14px] leading-6 text-[color:var(--text-secondary)]">{step.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Container>
    </Section>
  );
}
