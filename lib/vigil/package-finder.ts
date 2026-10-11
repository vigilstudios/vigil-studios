import type { BillingPeriodKey } from "./billing-periods";

export const PACKAGE_FINDER_HREF = "/find-your-fit";
export const PACKAGE_FINDER_LABEL = "Find my website fit";
export type WebsitePackage = "express" | "professional" | "growth";
export type PageScope = "single" | "multi" | "large" | "unsure";
export type DesignScope = "curated" | "tailored" | "bespoke" | "unsure";
export const PACKAGE_FEATURES = [
  { id: "basics", label: "Contact, social, booking or payment links", detail: "A clear next step, using existing tools." },
  { id: "forms", label: "Advanced forms and standard integrations", detail: "Multi-step enquiries, CRM forms or configurable third-party tools." },
  { id: "cms", label: "A blog, portfolio or regularly updated content", detail: "A content management system suited to your website." },
  { id: "store", label: "A complex online store", detail: "Inventory, shipping, fulfilment or marketplace features." },
  { id: "portal", label: "Accounts, memberships or a customer portal", detail: "A connected experience with custom application functionality." },
  { id: "booking", label: "A booking system built from scratch", detail: "Your own availability, calendars, reminders and workflows." },
  { id: "automation", label: "Custom APIs or complex automation", detail: "Custom backend logic or synchronization across multiple systems." },
] as const;
export type PackageFeature = (typeof PACKAGE_FEATURES)[number]["id"];
export type PackageAnswers = { pages: PageScope; design: DesignScope; features: readonly PackageFeature[] };

/** Fit follows actual build boundaries, never the selected subscription or entry CTA. */
export function recommendWebsitePackage(answers: PackageAnswers): { kind: WebsitePackage; reasons: string[] } {
  const advanced = answers.features.filter((feature) => ["store", "portal", "booking", "automation"].includes(feature));
  if (answers.pages === "large" || answers.design === "bespoke" || advanced.length) {
    return { kind: "growth", reasons: [
      ...(answers.pages === "large" ? ["Your page scope needs a written quote beyond the standard eight-page build."] : []),
      ...(answers.design === "bespoke" ? ["You want original design or interactions beyond our existing design systems."] : []),
      ...(advanced.length ? ["Your functionality needs custom development and a scope agreed with the team."] : []),
    ] };
  }
  if (answers.pages !== "single" || answers.design !== "curated" || answers.features.some((feature) => feature === "cms" || feature === "forms")) {
    return { kind: "professional", reasons: [
      ...(answers.pages === "multi" ? ["Up to eight primary pages gives your content a clear, tailored structure."] : []),
      ...(answers.design === "tailored" ? ["Your brand needs flexible page composition and art direction."] : []),
      ...(answers.features.includes("cms") ? ["Professional supports a CMS for your regularly updated content."] : []),
      ...(answers.features.includes("forms") ? ["Advanced forms and standard integrations fit Professional’s scope."] : []),
      ...(answers.pages === "unsure" || answers.design === "unsure" ? ["Professional gives you room to shape the site; a call can confirm the scope you are still deciding."] : []),
    ] };
  }
  return { kind: "express", reasons: ["One focused page suits the content you described.", "A curated industry design can be customized with your brand, imagery and words.", "Your links and supported embeds fit a streamlined Express build."] };
}

export type PurchasePreference = { plan?: string; period?: BillingPeriodKey };
export function withPurchasePreference(href: string, preference: PurchasePreference): string {
  const url = new URL(href, "https://www.vigilstudios.co");
  if (preference.plan) url.searchParams.set("plan", preference.plan);
  if (preference.period) url.searchParams.set("period", preference.period);
  return `${url.pathname}${url.search}${url.hash}`;
}
