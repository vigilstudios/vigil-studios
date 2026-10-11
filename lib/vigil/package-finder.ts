import type { BillingPeriodKey } from "./billing-periods";

export const PACKAGE_FINDER_HREF = "/find-your-fit";
export const PACKAGE_FINDER_LABEL = "Find my website fit";
export type WebsitePackage = "express" | "professional" | "growth";
export type PageScope = "single" | "multi" | "large" | "unsure";
export type DesignScope = "curated" | "tailored" | "bespoke" | "unsure";
export const PACKAGE_FEATURES = [
  { id: "basics", label: "Contact, social, booking or payment links", detail: "A clear next step, using existing tools." },
  { id: "forms", label: "Advanced forms and standard integrations", detail: "Multi-step enquiries, CRM forms or configurable third-party tools." },
  { id: "cms", label: "Regular content updates with a CMS", detail: "Manage new blog posts, projects or resources yourself. A fixed showcase can use ordinary sections." },
  { id: "store", label: "A complex online store", detail: "Inventory, shipping, fulfilment or marketplace features." },
  { id: "portal", label: "Accounts, memberships or a customer portal", detail: "A connected experience with custom application functionality." },
  { id: "booking", label: "A booking system built from scratch", detail: "Your own availability, calendars, reminders and workflows." },
  { id: "automation", label: "Custom APIs or complex automation", detail: "Custom backend logic or synchronization across multiple systems." },
] as const;
export type PackageFeature = (typeof PACKAGE_FEATURES)[number]["id"];
export type PackageAnswers = {
  stage: "starting" | "established" | "scaling" | "unsure";
  goal: "presence" | "leads" | "proof" | "workflows";
  pages: PageScope;
  scopeCheck?: "single" | "multi" | "collections" | "large" | "unsure";
  design: DesignScope;
  designCheck?: "branded" | "flexible" | "original" | "unsure";
  features: readonly PackageFeature[];
  workflowCheck?: "links" | "integration" | "essential" | "later" | "unsure";
  timing: "soon" | "weeks" | "flexible" | "date";
  launchDate?: string;
  readiness?: "ready" | "help" | "shaping";
  budget: "cap" | "flexible" | "guidance" | "private";
  budgetAmount?: string;
  tradeoff?: "lean" | "keep" | "discuss";
};
export type FinderDraft = Partial<PackageAnswers>;
export type FinderStep = "stage" | "goal" | "pages" | "scopeCheck" | "design" | "designCheck" | "features" | "workflowCheck" | "timing" | "readiness" | "budget" | "tradeoff";
export type FinderPrices = { express?: number | null; professional?: number | null };
const advancedFeatures: readonly PackageFeature[] = ["store", "portal", "booking", "automation"];
export const hasCustomFeatures = (features: readonly PackageFeature[] = []) => features.some((feature) => advancedFeatures.includes(feature));

/** Follow-ups only affect scope while their originating answer still applies. */
function resolveScope(answers: FinderDraft) {
  let pages = answers.pages ?? "unsure";
  let design = answers.design ?? "unsure";
  let features = [...(answers.features ?? [])];
  const later: string[] = [];
  const unresolved: string[] = [];
  if (pages === "large" || pages === "unsure") {
    switch (answers.scopeCheck) {
      case "single": pages = "single"; break;
      case "multi": pages = "multi"; break;
      case "collections": pages = "multi"; features = [...new Set([...features, "cms" as const])]; break;
      case "large": pages = "large"; break;
      default: unresolved.push("Confirm your primary pages before choosing a build. Content entries and primary pages are different.");
    }
  }
  if (design === "bespoke" || design === "unsure") {
    switch (answers.designCheck) {
      case "branded": design = "curated"; break;
      case "flexible": design = "tailored"; break;
      case "original": design = "bespoke"; break;
      default: unresolved.push("Review a design example together to confirm whether you need tailored composition or original development.");
    }
  }
  if (hasCustomFeatures(answers.features)) {
    switch (answers.workflowCheck) {
      case "links": features = features.filter((feature) => !advancedFeatures.includes(feature)); features.push("basics"); break;
      case "integration": features = features.filter((feature) => !advancedFeatures.includes(feature)); features.push("forms"); break;
      case "later":
        later.push("The custom workflows you selected, which you chose to defer until after the first launch.");
        features = features.filter((feature) => !advancedFeatures.includes(feature)); features.push("basics"); break;
      case "essential": break;
      default: unresolved.push("Confirm which workflows require custom development and which existing services can handle.");
    }
  }
  const kind: WebsitePackage = design === "bespoke" || hasCustomFeatures(features) ? "growth" : pages !== "single" || design !== "curated" || features.some((feature) => feature === "cms" || feature === "forms") ? "professional" : "express";
  return { pages, design, features, kind, later, unresolved };
}

export function budgetLimitCents(answers: FinderDraft): number | null {
  if (answers.budget !== "cap" || !answers.budgetAmount?.trim()) return null;
  // A build limit is a money amount, not scientific notation or a negative number.
  if (!/^\d+(?:\.\d{1,2})?$/.test(answers.budgetAmount.trim())) return null;
  const cents = Math.round(Number(answers.budgetAmount) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

/** A lean launch is offered only when no required system/content feature is lost. */
export function canOfferLeanLaunch(answers: FinderDraft, prices: FinderPrices = {}): boolean {
  const scope = resolveScope(answers);
  const cap = budgetLimitCents(answers);
  if (cap !== null && prices.express != null && cap < prices.express) return false;
  const budgetFitsLean = cap !== null && prices.express != null && prices.professional != null && cap >= prices.express && cap < prices.professional;
  return scope.kind === "professional" && scope.pages !== "large" && scope.unresolved.length === 0 && scope.features.every((feature) => feature === "basics") && (answers.stage === "starting" || answers.timing === "soon" || budgetFitsLean);
}

export function getFinderSteps(answers: FinderDraft, prices: FinderPrices = {}): FinderStep[] {
  return [
    "stage", "goal", "pages",
    ...(answers.pages === "large" || answers.pages === "unsure" ? ["scopeCheck" as const] : []),
    "design",
    ...(answers.design === "bespoke" || answers.design === "unsure" ? ["designCheck" as const] : []),
    "features",
    ...(hasCustomFeatures(answers.features) ? ["workflowCheck" as const] : []),
    "timing",
    ...(answers.timing === "soon" || answers.timing === "date" ? ["readiness" as const] : []),
    "budget",
    ...(canOfferLeanLaunch(answers, prices) ? ["tradeoff" as const] : []),
  ];
}

export function isFinderStepReady(step: FinderStep, answers: FinderDraft, today: string): boolean {
  if (step === "features") return !!answers.features?.length;
  if (step === "budget") return !!answers.budget && (answers.budget !== "cap" || budgetLimitCents(answers) !== null);
  if (step === "timing") return !!answers.timing && (answers.timing !== "date" || (!!answers.launchDate && /^\d{4}-\d{2}-\d{2}$/.test(answers.launchDate) && Number.isFinite(Date.parse(answers.launchDate)) && new Date(answers.launchDate).toISOString().slice(0, 10) === answers.launchDate && answers.launchDate >= today));
  return !!answers[step];
}

/** Changing an upstream answer invalidates dependent guidance, including consent to phase scope. */
export function updateFinderAnswer(answers: FinderDraft, step: FinderStep, value: PackageAnswers[FinderStep]): FinderDraft {
  const next: FinderDraft = { ...answers, [step]: value, tradeoff: undefined };
  if (step === "pages") next.scopeCheck = undefined;
  if (step === "design") next.designCheck = undefined;
  if (step === "features") next.workflowCheck = undefined;
  if (step === "timing") { next.readiness = undefined; next.launchDate = undefined; }
  if (step === "budget") next.budgetAmount = undefined;
  if (step === "tradeoff") next.tradeoff = value as PackageAnswers["tradeoff"];
  return next;
}

export type PackageRecommendation = {
  kind: WebsitePackage;
  action: "purchase" | "consult";
  reasons: string[];
  now: string[];
  later: string[];
  cautions: string[];
  timingNote: string;
  budgetNote: string;
};

/** Price and urgency constrain feasibility; neither buys a higher tier or erases an essential requirement. */
export function recommendWebsitePackage(answers: PackageAnswers, prices: FinderPrices = {}): PackageRecommendation {
  const scope = resolveScope(answers);
  const later = [...scope.later];
  let { kind } = scope;
  const lean = answers.tradeoff === "lean" && canOfferLeanLaunch(answers, prices);
  if (lean) {
    kind = "express";
    if (scope.pages !== "single") later.push("Additional primary pages; you chose to combine the essentials into one page for launch.");
    if (scope.design !== "curated") later.push("Tailored page composition; you chose a curated, branded design for launch.");
  }
  const cautions = [...scope.unresolved];
  if (scope.pages === "large" && kind === "professional") cautions.push("Professional includes up to eight primary pages. Extra pages need a written scope and price; page count alone does not require a bespoke Growth build.");
  if (answers.tradeoff === "discuss" && canOfferLeanLaunch(answers, prices)) cautions.push("Decide together whether a focused first launch or the full page scope better serves your business.");
  const cap = budgetLimitCents(answers);
  const amount = kind === "growth" ? null : prices[kind];
  let budgetNote = answers.budget === "guidance" ? "Use the current build price as a starting point. We can help you plan scope and the separate subscription." : "Your budget does not decide your package. The recommendation follows the work you need.";
  if (answers.budget === "cap") {
    if (cap === null) cautions.push("Confirm a valid upfront build limit before committing.");
    else if (kind === "growth") budgetNote = "Check your build limit against a written Growth quote; custom scope has no fixed catalog price.";
    else if (amount == null) cautions.push("Confirm the current build price against your limit before committing.");
    else if (cap < amount) {
      budgetNote = "Your limit does not cover this build’s listed price. Plan a viable scope or budget change with the team; no discount or reduced requirement has been assumed.";
      cautions.push("Your upfront limit is below this build’s current price. Discuss a viable scope or budget change before purchasing; essential requirements have been kept.");
    }
    else budgetNote = "The listed build price is within your upfront limit. Allow separately for the required subscription and any agreed extras.";
  }
  let timingNote = kind === "express" ? "Express’s first look is within two business days of completed onboarding. Deployment follows content, review and domain readiness." : kind === "professional" ? "Professional’s delivery schedule is confirmed after intake, based on scope and readiness." : "Growth’s schedule is agreed with its written scope. Original development needs planning time.";
  if (answers.timing === "date") cautions.push(`Confirm capacity and a delivery plan for your requested launch date (${answers.launchDate ?? "not yet provided"}) before committing. A first look is not a guaranteed launch.`);
  if (answers.timing === "soon" && kind !== "express") cautions.push("Your desired quick launch needs a scope and capacity check. A tailored or custom build cannot promise an immediate deployment.");
  if ((answers.timing === "soon" || answers.timing === "date") && answers.readiness !== "ready") {
    cautions.push("Your content or brand materials still need work. Plan that preparation into the launch date.");
  }
  if (answers.timing === "weeks") timingNote += " Tell us your target window during intake so we can confirm it.";
  const reasons = [
    kind === "express" ? "One focused, branded page covers the launch scope you chose." : kind === "professional" ? "Your page structure, tailored composition or standard content tools fit Professional." : "Original design or custom workflows point toward Growth; the exact development scope is agreed in writing.",
    answers.stage === "starting" ? "At your starting stage, prioritize proving the offer and making the next step clear; add complexity when it earns its place." : answers.stage === "scaling" ? "Keep the scope tied to the bottleneck you need to solve as you grow; a larger business does not automatically need a larger build." : "The recommendation follows your current website’s job, rather than assuming a higher tier for an established business.",
  ];
  const goalCopy = {
    presence: "A clear introduction, offer and contact route.",
    leads: "Your offer, credible proof and an obvious enquiry or booking route.",
    proof: "Your work, testimonials and evidence that build trust.",
    workflows: "A clear customer journey into the tools or systems you confirmed.",
  };
  const now = [goalCopy[answers.goal], ...(kind === "express" ? ["A curated industry design personalized with your brand, photos and words."] : [scope.pages === "large" ? "A primary-page plan with any extra pages separately scoped." : "A page structure designed around your essential content."]), ...(scope.features.includes("cms") ? ["A CMS for the content you need to update regularly."] : []), ...(scope.features.includes("forms") ? ["Standard configurable forms or integrations, with compatibility confirmed during intake."] : []), ...(hasCustomFeatures(scope.features) ? ["The essential custom workflows you selected, retained in your scope."] : [])];
  return { kind, action: kind === "growth" || cautions.length ? "consult" : "purchase", reasons, now, later, cautions, timingNote, budgetNote };
}

export type PurchasePreference = { plan?: string; period?: BillingPeriodKey };
export function withPurchasePreference(href: string, preference: PurchasePreference): string {
  const url = new URL(href, "https://www.vigilstudios.co");
  if (preference.plan) url.searchParams.set("plan", preference.plan);
  if (preference.period) url.searchParams.set("period", preference.period);
  return `${url.pathname}${url.search}${url.hash}`;
}
