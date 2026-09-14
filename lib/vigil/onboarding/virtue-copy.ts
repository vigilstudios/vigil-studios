import type { StepKey } from "./brief";

/**
 * What Virtue says at the top of each step. One voice: short, warm, first
 * person, no exclamation marks, no jargon. Copy lives here so it can be
 * tuned without touching the wizard.
 */
export type VirtueLine = { title: string; body: string };

export const STEP_TITLES: Record<StepKey, string> = {
  welcome: "Welcome",
  basics: "Business basics",
  offerings: "What you offer",
  about: "About you",
  brand: "Brand and photos",
  domain: "Your domain",
  review: "Review and send",
};

export function virtueLine(step: StepKey, ctx: { firstName?: string | null; businessName: string; noun?: string }): VirtueLine {
  const name = ctx.firstName ? `, ${ctx.firstName}` : "";
  switch (step) {
    case "welcome":
      return {
        title: `Hello${name}. I'm Virtue.`,
        body: `I'll get ${ctx.businessName} ready for the Vigil team. This takes about ten minutes, everything saves as you go, and you can stop and come back whenever you like.`,
      };
    case "basics":
      return {
        title: "Let's start with the essentials.",
        body: "How people reach you and when you're open. This goes straight onto the site, so write it the way you'd want a customer to read it.",
      };
    case "offerings":
      return {
        title: "Now, what do you offer?",
        body: `List your ${ctx.noun ?? "services"} the way you'd explain them to someone new. Prices are optional; rough is fine.`,
      };
    case "about":
      return {
        title: "Tell me the story.",
        body: "A few honest sentences about why you do this. The team writes the polished version; I just need the real one.",
      };
    case "brand":
      return {
        title: "Show me how it should look.",
        body: "Your logo, colours and photos. Phone photos are fine; the team picks the best ones and tidies them up.",
      };
    case "domain":
      return {
        title: "Let's sort out your web address.",
        body: "I'll ask one simple question first. Whatever the answer, you'll never have to deal with the technical side alone.",
      };
    case "review":
      return {
        title: "That's everything I need.",
        body: "Have a quick look below. When you send it, the Vigil team starts building and I'll let you know what happens next.",
      };
  }
}

export const RESPONSE_WINDOW = process.env.NEXT_PUBLIC_ONBOARDING_RESPONSE_WINDOW ?? "two business days";

export const AFTER_SEND: VirtueLine = {
  title: "Sent. The team has your brief.",
  body: `I've handed your details to the Vigil team. You'll hear from us within ${RESPONSE_WINDOW} with a first look at your site. Your dashboard shows where things are at any time.`,
};

/** Virtue helps everyone get set up; the AI employee is a Growth/Priority inclusion. */
export const VIRTUE_NOTE = "Virtue helps every Vigil customer get set up. On Growth and Priority it keeps working for you after launch.";
