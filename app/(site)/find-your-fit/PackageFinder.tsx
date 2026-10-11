"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { CampaignLink } from "@/components/creators/CampaignLink";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { formatMoney } from "@/lib/vigil/format";
import type { PublicBuild } from "@/lib/vigil/queries/public-pricing";
import { WEBSITE_TIERS } from "@/lib/vigil/site-tiers";
import { PACKAGE_FEATURES, recommendWebsitePackage, withPurchasePreference, type PageScope, type DesignScope, type PackageFeature, type PurchasePreference } from "@/lib/vigil/package-finder";
import styles from "./PackageFinder.module.css";

const pageOptions = [
  { id: "single", label: "One focused page", detail: "My story, offers, proof and contact in one place." },
  { id: "multi", label: "A multi-page website", detail: "Up to eight main pages for services, work, team or locations." },
  { id: "large", label: "More than eight main pages", detail: "A larger site with a scope to plan together." },
  { id: "unsure", label: "Help me work this out", detail: "I am still figuring out how much space my content needs." },
] as const;
const designOptions = [
  { id: "curated", label: "A curated design, made mine", detail: "A proven industry layout with my brand, photos and content." },
  { id: "tailored", label: "A tailored composition", detail: "Flexible sections, layouts and art direction shaped around my brand." },
  { id: "bespoke", label: "An original experience", detail: "New components, a bespoke visual system or unique interactions." },
  { id: "unsure", label: "Help me choose a direction", detail: "I would like guidance on how the site should look and feel." },
] as const;
const titles = ["How much space does your story need?", "What kind of design feels right?", "What should your website do?"];
const descriptions = ["Think about the content your visitors need. Simple and substantial projects both have a place here.", "Choose the level of design flexibility you want. Each approach can create a polished website.", "Select everything you need. Existing booking embeds and payment links differ from systems built from scratch."];

export function PackageFinder({ builds, preference, selectedPlanName }: { builds: PublicBuild[]; preference: PurchasePreference; selectedPlanName?: string }) {
  const [step, setStep] = useState(0);
  const [pages, setPages] = useState<PageScope | null>(null);
  const [design, setDesign] = useState<DesignScope | null>(null);
  const [features, setFeatures] = useState<PackageFeature[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const completed = step === 3;
  const ready = step === 0 ? pages !== null : step === 1 ? design !== null : features.length > 0;
  const recommendation = pages && design ? recommendWebsitePackage({ pages, design, features }) : null;
  const kind = recommendation?.kind ?? "express";
  // Growth uses the existing quoted Custom build; recurring Growth is a separate plan.
  const catalogKind = kind === "growth" ? "custom" : kind;
  const tier = WEBSITE_TIERS[catalogKind];
  const build = builds.find((item) => item.kind === catalogKind);
  const name = kind === "growth" ? "Growth" : kind === "professional" ? "Professional" : "Express";
  const destination = withPurchasePreference(kind === "professional" ? "/checkout?build=professional" : "/express", preference);

  useEffect(() => {
    document.getElementById("site-root")?.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  function restart() { setPages(null); setDesign(null); setFeatures([]); setStep(0); }

  return (
    <section className={styles.stage} aria-label="Website package finder">
      {completed && recommendation ? (
        <div className={styles.result} key="result">
          <div className={styles.confetti} aria-hidden="true">{Array.from({ length: 36 }, (_, index) => <i key={index} style={{ "--x": `${(index * 37) % 100}%`, "--delay": `${(index % 9) * 0.08}s`, "--drift": `${((index % 7) - 3) * 35}px`, "--color": ["#16d45a", "#b9ffcc", "#a594ff", "#ffe185"][index % 4] } as CSSProperties} />)}</div>
          <div className={styles.resultCard}>
            <span className={styles.successIcon} aria-hidden="true"><Sparkles size={28} /></span>
            <p className={styles.eyebrow}>Your next chapter starts here</p>
            <h1 ref={heading} tabIndex={-1} className={styles.resultTitle}>You found your fit.<br /><span>{name}.</span></h1>
            <p className={styles.resultLead}>{tier.summary}</p>
            <ul className={styles.reasons}>{recommendation.reasons.map((reason) => <li key={reason}><Check size={17} aria-hidden="true" /><span>{reason}</span></li>)}</ul>
            <div className={styles.price}>
              <strong>{kind === "growth" ? "Quoted for your project" : build?.amountCents != null ? formatMoney(build.amountCents, build.currency).replace(/\.00$/, "") : "Current price at the next step"}</strong>
              <span>{kind === "growth" ? "Scope, price and timeline agreed before you commit." : "One-time website build · separate Vigil subscription required"}</span>
            </div>
            {kind === "growth" ? <CalendlyPopup className={styles.primary}>Get my Growth quote <ArrowRight size={18} /></CalendlyPopup> : <CampaignLink href={destination} placement={`package_finder_${kind}`} className={styles.primary}>{kind === "express" ? "Choose my Express design" : "Start my Professional website"} <ArrowRight size={18} /></CampaignLink>}
            <p className={styles.nextNote}>{kind === "growth" ? "Growth is our bespoke website build, quoted through a scope call. The recurring Vigil Growth subscription is a separate service." : kind === "express" ? "Preview an available design, then choose your subscription at checkout." : "Review your build and subscription at checkout, then choose a kickoff call or guided brief."}</p>
            {selectedPlanName ? <p className={styles.preference}>{kind === "growth" ? `You selected ${selectedPlanName} as your subscription preference. Discuss it with the team during your scope call.` : `Your ${selectedPlanName} subscription preference carries forward. It does not determine your website recommendation.`}</p> : null}
            <div className={styles.resultActions}><button type="button" onClick={() => setStep(2)}><ArrowLeft size={15} /> Edit my answers</button><button type="button" onClick={restart}><RotateCcw size={15} /> Start again</button></div>
            {kind !== "growth" ? <CalendlyPopup className={styles.call}>Talk through my recommendation</CalendlyPopup> : null}
          </div>
        </div>
      ) : (
        <div className={styles.guide}>
          <header className={styles.intro}><p className={styles.eyebrow}>Find your website fit</p><h1>One project. The right starting point.</h1><p>Express, Professional or Growth. Three short questions about what you need, then a recommendation made for you.</p></header>
          <div className={styles.question} key={step}>
            <div className={styles.progress} aria-label={`Question ${step + 1} of 3`}>{[0, 1, 2].map((index) => <span key={index} className={index <= step ? styles.progressActive : ""} />)}</div>
            <p className={styles.step}>Question {step + 1} of 3{step === 2 ? " · Select all that apply" : " · Select one"}</p>
            <h2 ref={heading} tabIndex={-1}>{titles[step]}</h2><p className={styles.description}>{descriptions[step]}</p>
            {step < 2 ? <div className={styles.options} role="radiogroup" aria-label={titles[step]}>{(step === 0 ? pageOptions : designOptions).map((option) => <label key={option.id} className={styles.option}><input type="radio" name={step === 0 ? "pages" : "design"} value={option.id} checked={(step === 0 ? pages : design) === option.id} onChange={() => step === 0 ? setPages(option.id as PageScope) : setDesign(option.id as DesignScope)} /><span><strong>{option.label}</strong><small>{option.detail}</small></span></label>)}</div> : <div className={styles.options} role="group" aria-label={titles[step]}>{PACKAGE_FEATURES.map((option) => <label key={option.id} className={styles.option}><input type="checkbox" checked={features.includes(option.id)} onChange={() => setFeatures((current) => current.includes(option.id) ? current.filter((item) => item !== option.id) : [...current, option.id])} /><span><strong>{option.label}</strong><small>{option.detail}</small></span></label>)}</div>}
            <div className={styles.controls}><button type="button" className={styles.back} onClick={() => setStep((current) => current - 1)} disabled={step === 0}><ArrowLeft size={16} /> Back</button><button type="button" className={styles.primary} disabled={!ready} onClick={() => setStep((current) => current + 1)}>{step === 2 ? "Reveal my fit" : "Continue"} <ArrowRight size={17} /></button></div>
          </div>
          <p className={styles.disclaimer}>The website build is paid once. Hosting and ongoing care use a separate subscription, chosen after you find your website fit.</p>
        </div>
      )}
    </section>
  );
}
