import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Chip, Container, Eyebrow, Section, SectionIntro } from "@/components/site/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/Reveal";
import { StartMarquee } from "@/components/site/StartMarquee";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import shots from "@/lib/express-section-shots.json";
import { START } from "@/lib/site-copy";
import { formatMoney } from "@/lib/vigil/format";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";

/**
 * Meet the customer where they are: the three builds as three starting
 * points, over a gallery of real Express sections. Names and prices are the
 * build_prices rows; the stage copy is START in site-copy.
 */
export async function StartSection() {
  const { builds } = await getPublicPricing();
  const available = EXPRESS_TEMPLATES.filter((t) => t.status === "available").map((t) => t.industry);
  const coming = EXPRESS_TEMPLATES.filter((t) => t.status === "coming").length;
  return (
    <Section id="start" fill className="isolate overflow-hidden">
      <StartMarquee images={shots.map((s) => s.src)} />
      <Container>
        <Reveal>
          <SectionIntro align="center" eyebrow={START.eyebrow} title={START.title} lead={START.lead} />
        </Reveal>
        <RevealGroup className="mt-8 grid gap-4 md:grid-cols-3">
          {builds.map((b) => {
            const stage = START.stages[b.kind];
            return (
              <RevealItem key={b.kind}>
                <div className="flex h-full flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-primary)]/85 p-5 backdrop-blur-md lg:p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-[color:var(--text-secondary)]/40">
                  <Eyebrow tone={stage.tone}>{stage.stage}</Eyebrow>
                  <h3 className="text-xl font-semibold tracking-tight">{b.name}</h3>
                  <p className="mt-1.5 text-[14px] leading-6 text-[color:var(--text-secondary)]">{stage.body}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">
                    {b.amountCents != null ? formatMoney(b.amountCents, b.currency).replace(/\.00$/, "") : "Quoted"}
                    <span className="text-sm font-normal text-[color:var(--text-secondary)]"> {b.amountCents != null ? "once, plus a Vigil plan" : "after a short call"}</span>
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-[color:var(--text-secondary)]">
                    {stage.bullets.map((x) => (
                      <li key={x} className="flex items-start gap-2">
                        <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" /> {x}
                      </li>
                    ))}
                  </ul>
                  {b.kind === "express" ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {available.map((name) => (
                        <Chip key={name}>{name}</Chip>
                      ))}
                      {coming > 0 ? <Chip tone="amber">{coming} more coming</Chip> : null}
                    </div>
                  ) : null}
                  <div className="mt-auto pt-5">
                    <Link href={stage.cta.href} className={stage.primary ? "btn-primary inline-flex min-h-11 w-full !px-4 !py-2 text-sm font-semibold" : "btn-secondary inline-flex min-h-11 w-full !px-4 !py-2 text-sm"}>
                      {stage.cta.label} <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-[color:var(--text-secondary)]">{START.note}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
