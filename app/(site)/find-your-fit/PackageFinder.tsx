"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { CampaignLink } from "@/components/creators/CampaignLink";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { formatMoney } from "@/lib/vigil/format";
import type { PublicBuild } from "@/lib/vigil/queries/public-pricing";
import { WEBSITE_TIERS } from "@/lib/vigil/site-tiers";
import { PACKAGE_FEATURES, getFinderSteps, isFinderStepReady, recommendWebsitePackage, updateFinderAnswer, withPurchasePreference, type FinderDraft, type FinderStep, type PackageAnswers, type PurchasePreference } from "@/lib/vigil/package-finder";
import styles from "./PackageFinder.module.css";

type Question = { title: string; description: string; options: readonly { id: string; label: string; detail: string }[] };
const questions: Record<FinderStep, Question> = {
  stage: {
    title: "Where is your business right now?",
    description: "I’ll use this to understand your priorities. Your stage alone never decides your package.",
    options: [
      { id: "starting", label: "Starting or validating an idea", detail: "I need to launch, test my offer and build initial trust." },
      { id: "established", label: "Established, with a site to improve", detail: "My offer works; my website needs to represent it better." },
      { id: "scaling", label: "Growing, with a specific bottleneck", detail: "I need the site to support more content, customers or operations." },
      { id: "unsure", label: "Still finding my direction", detail: "Help me focus on what is useful right now." },
    ],
  },
  goal: {
    title: "What is the main job of this website?",
    description: "Let’s start with the outcome your visitors need, before deciding how much to build.",
    options: [
      { id: "presence", label: "Give my business a clear online home", detail: "Introduce my offer and help people contact me." },
      { id: "leads", label: "Bring in enquiries or bookings", detail: "Turn interest into a clear next step." },
      { id: "proof", label: "Show my work and build credibility", detail: "Use a portfolio, results or content to earn trust." },
      { id: "workflows", label: "Support sales or customer workflows", detail: "Help customers buy, book, sign in or use a service." },
    ],
  },
  pages: {
    title: "How much space does your story need?",
    description: "Count primary pages such as Home, Services and About. Individual posts, products and portfolio entries are a different kind of content.",
    options: [
      { id: "single", label: "One focused page", detail: "My story, offers, proof and contact in one place." },
      { id: "multi", label: "A multi-page website", detail: "Up to eight primary pages for services, work, team or locations." },
      { id: "large", label: "More than eight primary pages", detail: "A larger site with a scope to plan together." },
      { id: "unsure", label: "Help me work this out", detail: "I am still deciding how my content should be organized." },
    ],
  },
  scopeCheck: {
    title: "Let’s separate pages from content entries.",
    description: "A collection of posts or projects does not automatically call for a bespoke build. Which structure actually serves your visitors?",
    options: [
      { id: "single", label: "The essentials can live on one page", detail: "Visitors can understand the offer and take action without separate pages." },
      { id: "multi", label: "Two to eight distinct primary pages", detail: "Different topics need their own page and navigation." },
      { id: "collections", label: "Up to eight primary pages, plus content entries", detail: "The volume is in blog posts, projects or similar CMS content. Custom store systems are assessed separately." },
      { id: "large", label: "More than eight genuinely distinct pages", detail: "Keep this scope and quote any extra pages. Standard pages alone do not require Growth." },
      { id: "unsure", label: "I need help mapping the content", detail: "Recommend a direction, then confirm the page plan together." },
    ],
  },
  design: {
    title: "What kind of design feels right?",
    description: "All three approaches can feel polished and personal. Choose the flexibility you think you need; I’ll help check it against your goals.",
    options: [
      { id: "curated", label: "A curated design, made mine", detail: "A proven industry layout with my brand, photos and content." },
      { id: "tailored", label: "A tailored composition", detail: "Flexible sections, layouts and art direction shaped around my brand." },
      { id: "bespoke", label: "Designed from scratch", detail: "I think I need an original visual system, components or interactions." },
      { id: "unsure", label: "Help me choose a direction", detail: "I would like guidance on how the site should look and feel." },
    ],
  },
  designCheck: {
    title: "What needs to be original?",
    description: "A one-page site can feel distinctive through typography, photos, color and content on a proven foundation. Original engineering is worthwhile when it serves a specific experience you cannot achieve that way.",
    options: [
      { id: "branded", label: "I mainly want it to feel like my brand", detail: "A curated foundation is fine if my imagery, words and branding make it personal." },
      { id: "flexible", label: "I need more control over the composition", detail: "Tailored layouts and art direction using premium components would meet my needs." },
      { id: "original", label: "An original experience is essential", detail: "Keep the bespoke scope. I need original components or interactions beyond the existing systems." },
      { id: "unsure", label: "Show me examples before I decide", detail: "Use a scope conversation to confirm what is essential." },
    ],
  },
  features: {
    title: "What should your website do?",
    description: "Select what you need at launch. Existing booking tools and payment links differ from systems built from scratch.",
    options: PACKAGE_FEATURES,
  },
  workflowCheck: {
    title: "Does this need a new system, or a connection?",
    description: "Before paying for custom development, let’s check whether existing tools already solve the job. Essential custom capabilities can stay in scope regardless of your budget or deadline.",
    options: [
      { id: "links", label: "Links to existing services are enough", detail: "Visitors can book, pay or sign in through services I already use." },
      { id: "integration", label: "I need an existing service integrated", detail: "A standard configurable embed or form may work. Confirm compatibility during intake." },
      { id: "essential", label: "A custom system is essential at launch", detail: "The workflows cannot be delivered by an existing service. Keep them in the build." },
      { id: "later", label: "Launch with links; build these systems later", detail: "I can explicitly defer the custom workflows while testing demand." },
      { id: "unsure", label: "I need help checking the options", detail: "Confirm what existing tools can do before agreeing a build." },
    ],
  },
  timing: {
    title: "When do you need this in people’s hands?",
    description: "Timing helps us plan a realistic launch. Express offers a fast first look after onboarding; a first look is not a guaranteed deployment date.",
    options: [
      { id: "soon", label: "As soon as practical", detail: "I want a useful first launch quickly, and can discuss phasing the scope." },
      { id: "weeks", label: "In the next few weeks", detail: "I have a target window; the team should confirm delivery during intake." },
      { id: "flexible", label: "My timing is flexible", detail: "The right scope and a considered result matter most." },
      { id: "date", label: "I have a fixed launch date", detail: "An event, campaign or commitment makes the date important. Confirm capacity before purchase." },
    ],
  },
  readiness: {
    title: "What is ready for that launch?",
    description: "Content, review and domain setup affect deployment as much as the build. Let’s account for any preparation you still need.",
    options: [
      { id: "ready", label: "My content and brand materials are ready", detail: "I have the words, photos and branding, and can review promptly." },
      { id: "help", label: "I have the basics, but need some help", detail: "Some copy, imagery or brand materials still need preparing." },
      { id: "shaping", label: "I am still shaping the offer", detail: "We need to clarify the message and content before a launch date is realistic." },
    ],
  },
  budget: {
    title: "What budget should we plan around?",
    description: "Sharing a limit is optional. It helps check feasibility, rather than pushing you into a higher package. This is for the one-time build; a Vigil subscription is separate.",
    options: [
      { id: "cap", label: "I have an upfront build limit", detail: "Check the necessary scope against the most I can spend on the build." },
      { id: "flexible", label: "Flexible if the work is justified", detail: "Recommend the smallest appropriate scope, even if I could spend more." },
      { id: "guidance", label: "Help me find a realistic budget", detail: "Show current prices and explain what I would be paying for." },
      { id: "private", label: "I would rather discuss budget privately", detail: "Keep going without sharing an amount here." },
    ],
  },
  tradeoff: {
    title: "Would a focused first launch serve you better?",
    description: "Your current scope points to Professional, but your launch functions can work on one curated page. You could launch the essentials first and add pages or tailored composition when they serve a clear need. The choice is yours.",
    options: [
      { id: "lean", label: "Start with one branded, curated page", detail: "I agree to combine the essential content into one page and defer extra pages or tailored layouts." },
      { id: "keep", label: "Keep the full scope I described", detail: "Those pages or design choices matter now. Keep Professional and check any budget or timing constraints." },
      { id: "discuss", label: "Help me weigh the tradeoff", detail: "Confirm what would be worth building now before I commit." },
    ],
  },
};

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function PackageFinder({ builds, preference, selectedPlanName }: { builds: PublicBuild[]; preference: PurchasePreference; selectedPlanName?: string }) {
  const [answers, setAnswers] = useState<FinderDraft>({});
  const [step, setStep] = useState<FinderStep>("stage");
  const [completed, setCompleted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const expressBuild = builds.find((item) => item.kind === "express");
  const professionalBuild = builds.find((item) => item.kind === "professional");
  // The limit is shown in the Express catalog currency. Never compare another currency's price.
  const currency = expressBuild?.currency ?? professionalBuild?.currency ?? "usd";
  const prices = { express: expressBuild?.currency === currency ? expressBuild.amountCents : undefined, professional: professionalBuild?.currency === currency ? professionalBuild.amountCents : undefined };
  const steps = getFinderSteps(answers, prices);
  const index = steps.indexOf(step);
  const question = questions[step];
  const today = localToday();
  const ready = isFinderStepReady(step, answers, today);
  const allReady = steps.every((item) => isFinderStepReady(item, answers, today));
  const recommendation = completed && allReady ? recommendWebsitePackage(answers as PackageAnswers, prices) : null;
  const kind = recommendation?.kind ?? "express";
  const catalogKind = kind === "growth" ? "custom" : kind;
  const tier = WEBSITE_TIERS[catalogKind];
  const build = builds.find((item) => item.kind === catalogKind);
  const name = kind === "growth" ? "Growth" : kind === "professional" ? "Professional" : "Express";
  const destination = withPurchasePreference(kind === "professional" ? "/checkout?build=professional" : "/express", preference);
  const review = !!recommendation?.cautions.length;
  const money = (item: PublicBuild | undefined) => item?.amountCents != null ? formatMoney(item.amountCents, item.currency).replace(/\.00$/, "") : "Price confirmed during intake";

  useEffect(() => {
    document.getElementById("site-root")?.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, [step, completed]);

  function answer(value: PackageAnswers[FinderStep]) { setAnswers((current) => updateFinderAnswer(current, step, value)); }
  function restart() { setAnswers({}); setCompleted(false); setStep("stage"); }
  function next() {
    if (!ready) return;
    if (index < steps.length - 1) setStep(steps[index + 1]);
    else if (allReady) setCompleted(true);
    else setStep(steps.find((item) => !isFinderStepReady(item, answers, today))!);
  }

  return (
    <section className={styles.stage} aria-label="Website package finder">
      {recommendation ? (
        <div className={styles.result} key="result">
          {!review && <div className={styles.confetti} aria-hidden="true">{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ "--x": `${(i * 37) % 100}%`, "--delay": `${(i % 9) * 0.08}s`, "--drift": `${((i % 7) - 3) * 35}px`, "--color": ["#16d45a", "#b9ffcc", "#a594ff", "#ffe185"][i % 4] } as CSSProperties} />)}</div>}
          <div className={styles.resultCard}>
            <div className={styles.resultOrb}><VirtueOrb size="md" state={review ? "idle" : "done"} label="Virtue, your website guide" /></div>
            <p className={styles.eyebrow}>{review ? "Virtue’s direction · confirm the scope" : "Virtue’s recommendation"}</p>
            <h1 ref={heading} tabIndex={-1} className={styles.resultTitle}>{review ? "Let’s plan your" : "You found your fit."}<br /><span>{name}{review ? " website." : "."}</span></h1>
            <p className={styles.resultLead}>{tier.summary}</p>
            <ul className={styles.reasons}>{recommendation.reasons.map((reason) => <li key={reason}><Check size={17} aria-hidden="true" /><span>{reason}</span></li>)}</ul>
            {review && <div className={styles.cautions}><strong>Before you commit</strong><ul>{recommendation.cautions.map((note) => <li key={note}>{note}</li>)}</ul></div>}
            <details className={styles.plan}><summary>Your launch plan, timing &amp; budget</summary><div>
              <strong>Build now</strong><ul>{recommendation.now.map((item) => <li key={item}>{item}</li>)}</ul>
              {recommendation.later.length > 0 && <><strong>Add later — by your choice</strong><ul>{recommendation.later.map((item) => <li key={item}>{item}</li>)}</ul></>}
              <strong>Timing</strong><p>{recommendation.timingNote}</p><strong>Budget</strong><p>{recommendation.budgetNote}</p>
            </div></details>
            <div className={styles.price}><strong>{kind === "growth" ? "Quoted for your project" : money(build)}</strong><span>{kind === "growth" ? "Scope, price and timeline agreed before you commit." : "One-time standard build · separate Vigil subscription required"}</span></div>
            {recommendation.action === "consult" ? <CalendlyPopup className={styles.primary}>{review ? "Plan my scope, timing & budget" : "Get my Growth quote"} <ArrowRight size={18} /></CalendlyPopup> : <CampaignLink href={destination} placement={`package_finder_${kind}`} className={styles.primary}>{kind === "express" ? "Choose my Express design" : "Start my Professional website"} <ArrowRight size={18} /></CampaignLink>}
            <p className={styles.nextNote}>{recommendation.action === "consult" ? "Bring this launch plan to your call. We’ll confirm the requirements and tradeoffs before you commit." : kind === "express" ? "Preview an available design, then choose your subscription at checkout." : "Review your build and subscription at checkout, then choose a kickoff call or guided brief."}</p>
            {selectedPlanName && <p className={styles.preference}>{recommendation.action === "consult" ? `Your ${selectedPlanName} subscription preference can be discussed during your call.` : `Your ${selectedPlanName} subscription preference carries forward. It does not determine your website recommendation.`}</p>}
            <div className={styles.resultActions}><button type="button" onClick={() => { setCompleted(false); setStep("stage"); }}><ArrowLeft size={15} /> Edit my answers</button><button type="button" onClick={restart}><RotateCcw size={15} /> Start again</button></div>
            {recommendation.action === "purchase" && <CalendlyPopup className={styles.call}>Talk through my recommendation</CalendlyPopup>}
          </div>
        </div>
      ) : (
        <div className={styles.guide}>
          <aside className={`${styles.intro} ${index > 0 ? styles.compactIntro : ""}`}>
            <VirtueOrb size="lg" label="Virtue, your website guide" />
            <p className={styles.eyebrow}>Find your website fit</p><h1>Let&apos;s find the right fit for you.</h1>
            <p className={styles.guideCopy}>I&apos;m Virtue. Let&apos;s work out what your business needs now, what can wait, and a realistic route to launch. Most projects take 2–3 minutes; I&apos;ll ask follow-ups where they help.</p>
            <div className={styles.progress} aria-label={`Step ${index + 1} of ${steps.length}; follow-ups adapt to your answers`}>{steps.map((item, i) => <span key={item} className={i <= index ? styles.progressActive : ""} />)}</div>
            <p className={styles.step}>Step {index + 1} of {steps.length} · tailored to your answers</p>
            {selectedPlanName && <p className={styles.guideCopy}>Your {selectedPlanName} subscription preference is selected. First, let&apos;s find your website build.</p>}
          </aside>
          <div className={styles.question} key={step}>
            <p className={styles.step}>{step === "features" ? "Select all that apply" : ["scopeCheck", "designCheck", "workflowCheck", "tradeoff", "readiness"].includes(step) ? "Let’s check the fit · select one" : "Select one"}</p>
            <h2 ref={heading} tabIndex={-1}>{question.title}</h2><p className={styles.description}>{question.description}</p>
            {step === "budget" && <p className={styles.priceReference}>Current one-time builds: <strong>Express {money(expressBuild)}</strong> · <strong>Professional {money(professionalBuild)}</strong> · Growth by written quote.</p>}
            {step === "tradeoff" && <p className={styles.priceReference}>Express {money(expressBuild)} · Professional {money(professionalBuild)}. A faster first look still depends on completed onboarding.</p>}
            <div className={styles.options} role={step === "features" ? "group" : "radiogroup"} aria-label={question.title}>{question.options.map((option) => <label key={option.id} className={styles.option}>
              <input type={step === "features" ? "checkbox" : "radio"} name={step} value={option.id} checked={step === "features" ? answers.features?.includes(option.id as PackageAnswers["features"][number]) ?? false : answers[step] === option.id} onChange={() => {
                if (step === "features") {
                  const id = option.id as PackageAnswers["features"][number];
                  answer(answers.features?.includes(id) ? answers.features.filter((item) => item !== id) : [...(answers.features ?? []), id]);
                } else answer(option.id as PackageAnswers[FinderStep]);
              }} /><span><strong>{option.label}</strong><small>{option.detail}</small></span>
            </label>)}</div>
            {step === "budget" && answers.budget === "cap" && <label className={styles.field}>Maximum one-time build budget ({currency.toUpperCase()})<input type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 1000" value={answers.budgetAmount ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, budgetAmount: event.target.value, tradeoff: undefined }))} aria-describedby="budget-help" /><small id="budget-help">Enter an amount of zero or more, with up to two decimal places. This does not include your subscription.</small></label>}
            {step === "timing" && answers.timing === "date" && <label className={styles.field}>Requested launch date<input type="date" min={today} value={answers.launchDate ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, launchDate: event.target.value, tradeoff: undefined }))} aria-describedby="date-help" /><small id="date-help">Choose today or a future date. The team will confirm feasibility before purchase.</small></label>}
            <div className={styles.controls}><button type="button" className={styles.back} onClick={() => setStep(steps[index - 1])} disabled={index === 0}><ArrowLeft size={16} /> Back</button><button type="button" className={styles.primary} disabled={!ready} onClick={next}>{index === steps.length - 1 ? "See my recommendation" : "Continue"} <ArrowRight size={17} /></button></div>
          </div>
          <p className={styles.disclaimer}>Your answers guide the recommendation. Nothing is purchased here. The website build is paid once; hosting and ongoing care use a separate subscription.</p>
        </div>
      )}
    </section>
  );
}
