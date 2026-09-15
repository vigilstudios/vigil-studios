import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, Globe, Lock, MonitorSmartphone, RefreshCw, Shield } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Card, CardRow } from "@/components/site/Cards";
import { DashboardMock } from "@/components/site/DashboardMock";
import { Chip, Container, Eyebrow, Section, SectionIntro } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { GetStartedSection } from "@/sections/GetStartedSection";
import { PLAN_COPY, VIGIL_PAGE } from "@/lib/site-copy";
import { formatMoney } from "@/lib/vigil/format";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";

export const metadata: Metadata = {
  title: "The Vigil platform | Vigil Studios",
  description: "Vigil is the dashboard and the team behind every Vigil website: hosting, domain, security, updates, requests and billing, said in outcomes rather than settings.",
  alternates: { canonical: "/products/vigil" },
};

const OUTCOMES = [
  { icon: MonitorSmartphone, title: "Website Live", body: "Hosting, deployments and a health check you never run. Live, Building or Needs attention, in words." },
  { icon: Globe, title: "Domain Connected", body: "Own a domain? Virtue gives you the exact records and checks them. Need one? We register it in your name." },
  { icon: Shield, title: "SSL and security", body: "Certificates, renewals and platform maintenance happen without you. A green tick, not a settings page." },
  { icon: RefreshCw, title: "Website updates", body: "On Care and up, send a request with a sentence or a photo. A person makes the change." },
  { icon: CreditCard, title: "Subscription and billing", body: "One plan, one receipt, a portal for invoices and your card. Monthly, annual or three years." },
  { icon: Lock, title: "Yours to keep", body: "Your site's code and content are yours. Download them from the dashboard whenever you like." },
];

/** The platform: what the customer sees and what it does for them, with the real dashboard on show. */
export default async function VigilPage() {
  const { plans } = await getPublicPricing();
  return (
    <>
      {/* Landing: the words, then the dashboard itself, cropped like a window onto the product. */}
      <section className="relative overflow-hidden pt-32 sm:pt-40">
        <Container>
          <Reveal>
            <SectionIntro eyebrow="Vigil" tone="teal" title={VIGIL_PAGE.title} lead={VIGIL_PAGE.lead} />
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={VIGIL_PAGE.primary.href} className="btn-primary min-h-12 !px-6 text-sm font-semibold">{VIGIL_PAGE.primary.label} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            <Link href={VIGIL_PAGE.secondary.href} className="btn-secondary min-h-12 !px-6 text-sm font-medium">{VIGIL_PAGE.secondary.label}</Link>
          </Reveal>
          <Reveal delay={0.2} className="relative mt-14 sm:mt-20">
            <div className="overflow-hidden rounded-t-2xl border border-b-0 border-[color:var(--border)] bg-[color:var(--bg-primary)] shadow-[0_-20px_80px_-40px_rgba(0,0,0,0.6)]">
              <DashboardMock className="max-h-[520px]" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_bottom,transparent,var(--bg-section-alt))]" aria-hidden />
          </Reveal>
        </Container>
      </section>

      <Section alt id="experience">
        <Container>
          <Reveal>
            <SectionIntro eyebrow="What it is like" tone="teal" title="A dashboard that talks like a person." lead="Four things are true of every page in Vigil." />
          </Reveal>
          <CardRow className="mt-10 md:grid-cols-2 xl:grid-cols-4">
            {VIGIL_PAGE.experience.map((x, i) => (
              <Card key={x.title}>
                <div className="flex h-full flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-4)]">0{i + 1}</span>
                  <h3 className="mt-2 text-base font-semibold">{x.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[color:var(--text-secondary)]">{x.body}</p>
                </div>
              </Card>
            ))}
          </CardRow>
        </Container>
      </Section>

      <Section id="outcomes">
        <Container>
          <Reveal>
            <SectionIntro eyebrow="What it takes care of" tone="teal" title="Everything your website needs, said in plain words." lead="You see outcomes, not providers: no DNS panels, no hosting consoles, no invoices from services you have never heard of." />
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {OUTCOMES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
                  <Icon className="h-5 w-5 text-[color:var(--accent-4)]" />
                  <h3 className="mt-3 text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[color:var(--text-secondary)]">{body}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </Section>

      <Section alt id="plans">
        <Container>
          <Reveal>
            <SectionIntro eyebrow="Four service levels" tone="teal" title="Pick how much we take off your plate." lead="Every Vigil website runs on a plan. Basic keeps it online; Care means you never touch it; Growth and Priority add Virtue. Change plans any time." />
          </Reveal>
          <CardRow className="mt-10 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((p) => {
              const copy = PLAN_COPY[p.code];
              return (
                <Card key={p.code}>
                  <div className="flex h-full flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold">{p.name.replace(/^Vigil /, "")}</h3>
                      {copy?.virtue ? <VirtueOrb size="sm" label="Includes Virtue" /> : null}
                    </div>
                    <p className="text-sm text-[color:var(--text-secondary)]">{p.tagline}</p>
                    <p className="mt-3 text-sm">{copy?.headline}</p>
                    <p className="mt-auto pt-4 text-sm font-medium">{p.prices.month != null ? `From ${formatMoney(p.prices.month, p.currency).replace(/\.00$/, "")} / month` : ""}</p>
                  </div>
                </Card>
              );
            })}
          </CardRow>
          <Reveal delay={0.1}>
            <Link href="/pricing#plans" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)]">Full pricing, periods and what is included <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 sm:flex-row sm:items-center sm:p-8">
              <VirtueOrb size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Eyebrow tone="violet">Virtue</Eyebrow>
                  <Chip tone="violet">Growth · Priority</Chip>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">The employee who lives in this dashboard.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">She set you up on day one. On Growth and Priority she keeps working after launch: leads, missed calls, reviews.</p>
              </div>
              <Link href="/products/virtue" className="btn-primary min-h-11 shrink-0 !px-5 !py-2 text-sm font-semibold">Meet Virtue <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </div>
          </Reveal>
        </Container>
      </Section>

      <GetStartedSection />
      <Footer />
    </>
  );
}
