"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { clsx } from "clsx";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { formatMoney } from "@/lib/vigil/format";
import { PROFESSIONAL_QUALIFIERS, WEBSITE_TIERS, professionalPurchaseRoute, type ProfessionalQualifierId } from "@/lib/vigil/site-tiers";

const tier = WEBSITE_TIERS.professional;

export function ProfessionalWalkthrough({ amountCents, currency, checkoutAvailable }: { amountCents: number | null; currency: string; checkoutAvailable: boolean }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<ProfessionalQualifierId[]>(["business_site"]);
  const route = useMemo(() => professionalPurchaseRoute(selected), [selected]);
  const total = 4;
  const toggle = (id: ProfessionalQualifierId) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  useEffect(() => {
    // The qualifier is much taller than the surrounding steps. Return the
    // customer to the start when its height changes so the next answer is not
    // hidden behind the fixed navigation by browser scroll anchoring.
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [step]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <VirtueOrb size="lg" />
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Professional Site</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Let&apos;s make sure this is the right fit.</h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">I&apos;ll show you exactly what is included before you pay. This takes about two minutes.</p>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[color:var(--bg-surface-soft)]">
            <div className="h-full rounded-full bg-[color:var(--accent)] transition-[width]" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Step {step + 1} of {total}</p>
        </aside>

        <section className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 sm:p-8">
          {step === 0 ? (
            <WalkthroughStep title="A fully custom website, not a larger template." body="Professional is designed around your business, brand and customers from the ground up.">
              <FeatureList items={[`Up to ${tier.primaryPages} custom primary pages`, "Custom navigation, layouts and content hierarchy", "Responsive desktop, tablet and mobile design", "Conversion-focused design and two revision rounds"]} />
              <p className="mt-5 rounded-xl bg-[color:var(--bg-surface-soft)] p-4 text-sm leading-6 text-[color:var(--text-secondary)]">Privacy, terms, cookie and accessibility pages do not count toward the eight-page limit. Additional primary pages can be quoted separately.</p>
            </WalkthroughStep>
          ) : step === 1 ? (
            <WalkthroughStep title="Modern website functionality is included." body="Professional is the highest tier that is still fundamentally a website. We do not strip out useful integrations to make higher plans look better.">
              <FeatureList items={["Contact, quote and multi-step lead forms", "Calendly, Acuity, Square, Vagaro, Fresha, Mindbody and similar booking embeds", "Simple Stripe, PayPal or Square payments and deposits", "Maps, reviews, email marketing, CRM forms, chat and social integrations", "Analytics, conversion tracking, SEO foundations and CMS where appropriate"]} />
            </WalkthroughStep>
          ) : step === 2 ? (
            <WalkthroughStep title="What does your project need?" body="Choose everything that sounds relevant. I’ll tell you whether Professional can be purchased as-is or whether our team should scope it first.">
              <div className="grid gap-2">
                {PROFESSIONAL_QUALIFIERS.map((option) => {
                  const active = selected.includes(option.id);
                  return (
                    <button key={option.id} type="button" aria-pressed={active} onClick={() => toggle(option.id)} className={clsx("rounded-xl border p-3 text-left transition-colors", active ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-[color:var(--border)] hover:border-[color:var(--text-secondary)]")}>
                      <span className="flex items-start gap-2 text-sm font-medium"><span className={clsx("mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border", active && "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--bg-primary)]")}>{active ? <Check className="h-3 w-3" /> : null}</span>{option.label}</span>
                      <span className="ml-6 mt-0.5 block text-xs leading-5 text-[color:var(--text-secondary)]">{option.detail}</span>
                    </button>
                  );
                })}
              </div>
            </WalkthroughStep>
          ) : (
            <WalkthroughStep
              title={route === "checkout" ? "Professional fits what you described." : "A short scope call is the right next step."}
              body={route === "checkout" ? "You can purchase now. After payment, choose a kickoff call with our team or continue through my flexible guided brief." : "Part of what you selected needs an add-on or custom scope. Our team will confirm the right approach and price before you pay."}
            >
              {route === "checkout" ? (
                <div className="rounded-xl border border-[color:var(--accent)]/40 bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] p-5">
                  <p className="text-sm text-[color:var(--text-secondary)]">Professional website build</p>
                  <p className="mt-1 text-3xl font-semibold">{amountCents === null ? "Price shown at checkout" : formatMoney(amountCents, currency).replace(/\.00$/, "")} <span className="text-sm font-normal text-[color:var(--text-secondary)]">once, plus a Vigil plan</span></p>
                  <p className="mt-3 text-xs leading-5 text-[color:var(--text-secondary)]">At checkout you choose the plan that hosts and operates the site. Virtue guides setup for every customer; the ongoing Virtue AI employee is included only with eligible Growth and Priority plans.</p>
                  {checkoutAvailable ? (
                    <Link href="/checkout?build=professional" className="btn-primary mt-5 min-h-12 w-full !px-5 !py-2.5 text-sm font-semibold">Continue to checkout <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                  ) : (
                    <p className="mt-5 rounded-lg border border-[color:var(--border)] p-3 text-sm">Online Professional checkout is temporarily unavailable. Book a call and we&apos;ll prepare the order for you.</p>
                  )}
                </div>
              ) : null}
              <div className={route === "checkout" ? "mt-3" : "mt-5"}>
                <CalendlyPopup className="btn-secondary min-h-12 w-full !px-5 text-sm">Book a website call with us</CalendlyPopup>
              </div>
            </WalkthroughStep>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-[color:var(--border)] pt-4">
            <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-[color:var(--text-secondary)] disabled:invisible"><ArrowLeft className="h-4 w-4" /> Back</button>
            {step < total - 1 ? <button type="button" onClick={() => setStep((current) => Math.min(total - 1, current + 1))} className="btn-primary min-h-11 !px-5 text-sm">Continue <ArrowRight className="ml-1.5 h-4 w-4" /></button> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function WalkthroughStep({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return <div><h2 className="text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{body}</p><div className="mt-6">{children}</div></div>;
}

function FeatureList({ items }: { items: readonly string[] }) {
  return <ul className="space-y-3">{items.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-[color:var(--accent)]" />{item}</li>)}</ul>;
}
