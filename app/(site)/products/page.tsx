import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, CreditCard, Globe, Lock, MonitorSmartphone, RefreshCw, Shield } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Chip, Container, Eyebrow, Section, SectionIntro } from "@/components/site/primitives";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { GetStartedSection } from "@/sections/GetStartedSection";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import { BUILD_COPY, PLAN_COPY } from "@/lib/site-copy";
import { formatMoney } from "@/lib/vigil/format";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";

export const metadata: Metadata = {
  title: "Products | Vigil Studios",
  description: "Websites built for you, the Vigil platform that keeps them running, and Virtue, the AI employee inside it.",
  alternates: { canonical: "/products" },
};

const PLATFORM = [
  { icon: MonitorSmartphone, title: "Website Live", body: "Hosting, deployments and a health check you never have to run. The dashboard says Live, Building or Needs attention in plain words." },
  { icon: Globe, title: "Domain Connected", body: "Own a domain? Virtue gives you the exact records for your registrar and checks them. Need one? We register it in your name." },
  { icon: Shield, title: "SSL and security", body: "Certificates, renewals and platform maintenance happen without you. You see a green tick, not a settings page." },
  { icon: RefreshCw, title: "Website updates", body: "On Care and up, send a request with a photo or a sentence. A person makes the change and you see it in the dashboard." },
  { icon: CreditCard, title: "Subscription and billing", body: "One plan, one receipt, a portal for invoices and your card. Monthly, annual or three years." },
  { icon: Lock, title: "Yours to keep", body: "Your site's code and content are yours. Export them from the dashboard whenever you like." },
];

export default async function ProductsPage() {
  const { plans, builds } = await getPublicPricing();
  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container>
          <SectionIntro eyebrow="Products" title="A website to start with. A platform that keeps it running. An employee inside it." lead="Three parts, one relationship. This page walks through each one and what it costs." />
          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/products/websites" className="btn-secondary min-h-10 !px-4 !py-1.5 text-sm">Websites <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            <Link href="/products/vigil" className="btn-secondary min-h-10 !px-4 !py-1.5 text-sm">The Vigil platform <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            <Link href="/products/virtue" className="btn-secondary min-h-10 !px-4 !py-1.5 text-sm">Virtue <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
          </div>
        </Container>
      </Section>

      <Section id="websites" alt>
        <Container>
          <SectionIntro eyebrow="Websites" title="Built for you, by a person." lead="Start with a Vigil Express template for your industry, or go Professional or Custom. Whichever you choose, someone at Vigil builds it from what you tell Virtue." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {builds.map((b) => {
              const copy = BUILD_COPY[b.kind];
              return (
                <div key={b.kind} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
                  <h3 className="text-lg font-semibold tracking-tight">{b.name}</h3>
                  <p className="text-sm text-[color:var(--text-secondary)]">{copy?.tagline ?? b.description}</p>
                  <p className="mt-4 text-2xl font-semibold tracking-tight">{b.amountCents != null ? formatMoney(b.amountCents, b.currency).replace(/\.00$/, "") : "Quoted"}</p>
                  <ul className="mt-4 space-y-2 text-sm text-[color:var(--text-secondary)]">
                    {(copy?.bullets ?? []).slice(0, 4).map((x) => (
                      <li key={x} className="flex items-start gap-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" /> {x}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/express" className="btn-primary min-h-11 !px-5 !py-2 text-sm font-semibold">See the templates <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            <p className="text-sm text-[color:var(--text-secondary)]">
              {EXPRESS_TEMPLATES.filter((t) => t.status === "available").length} industries ready today · {EXPRESS_TEMPLATES.filter((t) => t.status === "coming").length} under construction
            </p>
          </div>
        </Container>
      </Section>

      <Section id="vigil">
        <Container>
          <SectionIntro eyebrow="The Vigil platform" tone="teal" title="Everything your website needs, said in plain words." lead="Vigil is the dashboard and the team behind it. You see outcomes, not providers: no DNS panels, no hosting consoles, no invoices from services you have never heard of." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
                <Icon className="h-5 w-5 text-[color:var(--accent-4)]" />
                <h3 className="mt-3 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--text-secondary)]">{body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-14">
            <Eyebrow tone="teal">Four service levels</Eyebrow>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((p) => {
                const copy = PLAN_COPY[p.code];
                return (
                  <div key={p.code} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold">{p.name.replace(/^Vigil /, "")}</h3>
                      {copy?.virtue ? <VirtueOrb size="sm" label="Includes Virtue" /> : null}
                    </div>
                    <p className="text-sm text-[color:var(--text-secondary)]">{p.tagline}</p>
                    <p className="mt-3 text-sm">{copy?.headline}</p>
                    <p className="mt-3 text-sm font-medium">{p.prices.month != null ? `${formatMoney(p.prices.month, p.currency).replace(/\.00$/, "")} / month` : ""}</p>
                  </div>
                );
              })}
            </div>
            <Link href="/pricing" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)]">Full pricing and periods <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Container>
      </Section>

      <Section alt>
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 sm:flex-row sm:items-center sm:p-8">
            <VirtueOrb size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Eyebrow tone="violet">Virtue</Eyebrow>
                <Chip tone="violet">Growth · Priority</Chip>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">The employee who lives in your dashboard.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">Today Virtue sets up every customer. On Growth and Priority she keeps working after launch: leads, missed calls, reviews. See what she does now and what is coming.</p>
            </div>
            <Link href="/products/virtue" className="btn-primary min-h-11 shrink-0 !px-5 !py-2 text-sm font-semibold">Meet Virtue <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </div>
        </Container>
      </Section>

      <GetStartedSection />
      <Footer />
    </>
  );
}
