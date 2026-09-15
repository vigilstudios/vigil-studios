import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Card, CardRow } from "@/components/site/Cards";
import { Chip, Container, Eyebrow, Section, SectionIntro } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { GetStartedSection } from "@/sections/GetStartedSection";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import { BUILD_COPY, WEBSITES_PAGE } from "@/lib/site-copy";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";

export const metadata: Metadata = {
  title: "Websites | Vigil Studios",
  description: "Vigil Express, Professional and Custom: what each website is for, who it suits, and how you start. Built by people, run on the Vigil platform, yours to keep.",
  alternates: { canonical: "/products/websites" },
};

const KINDS = ["express", "professional", "custom"] as const;

/**
 * Which website, and why. Names come from build_prices so they match the
 * checkout; prices deliberately live on /pricing, this page links there.
 */
export default async function WebsitesPage() {
  const { builds } = await getPublicPricing();
  const byKind = Object.fromEntries(builds.map((b) => [b.kind, b])) as Partial<Record<(typeof KINDS)[number], (typeof builds)[number]>>;
  const nameOf = (kind: (typeof KINDS)[number]) => byKind[kind]?.name ?? { express: "Vigil Express", professional: "Professional Site", custom: "Custom Build" }[kind];
  const available = EXPRESS_TEMPLATES.filter((t) => t.status === "available");
  const coming = EXPRESS_TEMPLATES.filter((t) => t.status === "coming");

  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container>
          <Reveal>
            <SectionIntro eyebrow="Websites" title={WEBSITES_PAGE.title} lead={WEBSITES_PAGE.lead} />
          </Reveal>
          <Reveal delay={0.1}>
            <CardRow className="mt-10 md:grid-cols-3">
              {KINDS.map((kind) => {
                const pkg = WEBSITES_PAGE.packages[kind];
                return (
                  <Card key={kind}>
                    <a href={`#${kind}`} className="flex h-full flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 transition-colors hover:border-[color:var(--text-secondary)]/40">
                      <Eyebrow tone={pkg.tone}>{pkg.stage}</Eyebrow>
                      <h2 className="text-lg font-semibold tracking-tight">{nameOf(kind)}</h2>
                      <p className="mt-1.5 text-sm leading-6 text-[color:var(--text-secondary)]">{BUILD_COPY[kind]?.tagline}</p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-[color:var(--accent)]">
                        What it is for <ArrowRight className="h-4 w-4" />
                      </span>
                    </a>
                  </Card>
                );
              })}
            </CardRow>
          </Reveal>
        </Container>
      </Section>

      {KINDS.map((kind, i) => {
        const pkg = WEBSITES_PAGE.packages[kind];
        const copy = BUILD_COPY[kind];
        return (
          <Section key={kind} id={kind} alt={i % 2 === 0} className="scroll-mt-24">
            <Container>
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
                <Reveal>
                  <Eyebrow tone={pkg.tone}>{pkg.stage}</Eyebrow>
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{nameOf(kind)}</h2>
                  <p className="mt-4 text-base leading-7 text-[color:var(--text-secondary)] sm:text-lg sm:leading-8">{pkg.what}</p>

                  <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">Good for</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {pkg.goodFor.map((g) => (
                      <li key={g} className="flex items-start gap-2 text-[15px] leading-6">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-[color:var(--accent)]" /> {g}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    <Minus className="mt-1 h-4 w-4 shrink-0" /> <span><span className="font-medium text-[color:var(--text-primary)]">Not the one</span> for {pkg.notFor.charAt(0).toLowerCase() + pkg.notFor.slice(1)}</span>
                  </p>

                  {kind === "express" ? (
                    <div className="mt-6 flex flex-wrap gap-1.5">
                      {available.map((t) => (
                        <Chip key={t.slug}>{t.industry}</Chip>
                      ))}
                      {coming.map((t) => (
                        <Chip key={t.slug} tone="amber">{t.industry} · coming</Chip>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link href={pkg.cta.href} className={kind === "express" ? "btn-primary min-h-11 !px-5 !py-2 text-sm font-semibold" : "btn-secondary min-h-11 !px-5 !py-2 text-sm"}>
                      {pkg.cta.label} <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                    <Link href="/pricing#builds" className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)]">
                      See the price <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={0.1}>
                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">What is included</h3>
                    <ul className="mt-4 space-y-2.5 text-sm">
                      {(copy?.bullets ?? []).map((b) => (
                        <li key={b} className="flex items-start gap-2">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" /> {b}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 border-t border-[color:var(--border)] pt-4 text-sm leading-6 text-[color:var(--text-secondary)]">{pkg.timeline}</p>
                  </div>
                </Reveal>
              </div>
            </Container>
          </Section>
        );
      })}

      <Section alt>
        <Container>
          <Reveal>
            <SectionIntro eyebrow="At a glance" title="Side by side." />
          </Reveal>
          <Reveal delay={0.1} className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] text-sm">
              <thead>
                <tr className="bg-[color:var(--bg-surface-soft)] text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
                  <th className="px-4 py-3 font-semibold" />
                  {KINDS.map((k) => (
                    <th key={k} className="px-4 py-3 font-semibold">{nameOf(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEBSITES_PAGE.glance.map((row) => (
                  <tr key={row.label} className="border-t border-[color:var(--border)]">
                    <th scope="row" className="border-t border-[color:var(--border)] px-4 py-3.5 text-left font-medium">{row.label}</th>
                    {KINDS.map((k) => (
                      <td key={k} className="border-t border-[color:var(--border)] px-4 py-3.5 text-[color:var(--text-secondary)]">{row[k]}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="border-t border-[color:var(--border)] px-4 py-3.5 text-left font-medium">Price</th>
                  <td colSpan={3} className="border-t border-[color:var(--border)] px-4 py-3.5 text-[color:var(--text-secondary)]">
                    Paid once, then a Vigil plan. <Link href="/pricing" className="font-medium text-[color:var(--accent)]">See pricing <ArrowRight className="inline h-3.5 w-3.5" /></Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="min-w-0 flex-1">
                <Eyebrow tone="teal">Underneath every one</Eyebrow>
                <h2 className="text-2xl font-semibold tracking-tight">The Vigil platform comes with it.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">{WEBSITES_PAGE.platformNote}</p>
              </div>
              <Link href="/products/vigil" className="btn-secondary min-h-11 shrink-0 !px-5 !py-2 text-sm">See the platform <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </div>
          </Reveal>
        </Container>
      </Section>

      <GetStartedSection />
      <Footer />
    </>
  );
}
