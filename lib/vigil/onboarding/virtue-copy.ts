import type { ProjectKind, StepKey } from "./brief";

/**
 * What Virtue says at the top of each step. One voice: short, warm, first
 * person, no exclamation marks, no jargon. Copy lives here so it can be
 * tuned without touching the wizard.
 */
export type VirtueLine = { title: string; body: string };

export const STEP_TITLES: Record<StepKey, string> = {
  welcome: "Welcome",
  basics: "Business basics",
  kickoff: "Choose how to begin",
  strategy: "Site goals and scope",
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
    case "kickoff":
      return {
        title: "Choose the way you work best.",
        body: "You can book a kickoff call with our team and finish for now, or keep going with me and build the brief at your own pace. You can also do both.",
      };
    case "strategy":
      return {
        title: "Let's shape the right site.",
        body: "Tell me who it needs to reach, what it needs to accomplish and what visitors should be able to do. The team will use this to confirm the structure with you before design starts.",
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

/** Spoken by the centred Virtue the first time the customer reaches the dashboard. */
export function welcomeSpeech(ctx: { firstName?: string | null; businessName: string; afterPassword?: boolean }): { text: string; emphasis?: boolean }[] {
  const name = ctx.firstName ? `, ${ctx.firstName}` : "";
  return [
    { text: ctx.afterPassword ? "Thank you. Welcome to Vigil." : `Hello${name}. I'm Virtue.`, emphasis: true },
    { text: `This is your dashboard. From here you'll see your website, your domain and your plan, and I'll be around whenever you need me.` },
    { text: `First, I'd like to learn about ${ctx.businessName} so the team can start building. It takes about ten minutes and saves as you go.` },
  ];
}

/** Spoken first when the account has no password yet. */
export function passwordSpeech(ctx: { firstName?: string | null }): { text: string; emphasis?: boolean }[] {
  const name = ctx.firstName ? `, ${ctx.firstName}` : "";
  return [
    { text: `Hello${name}. I'm Virtue.`, emphasis: true },
    { text: `Before anything else, choose a password. Next time you can sign in straight away, on any device, without waiting for an email.` },
  ];
}

export const RESPONSE_WINDOW = process.env.NEXT_PUBLIC_ONBOARDING_RESPONSE_WINDOW ?? "two business days";

export function afterSendLine(kind: ProjectKind, kickoffMode?: "guided" | "call" | "both" | null): VirtueLine {
  return kind === "express"
    ? {
        title: "Sent. The team has your brief.",
        body: `I've handed your details to the Vigil team. You'll hear from us within ${RESPONSE_WINDOW} with a first look at your site. Your dashboard shows where things are at any time.`,
      }
    : kickoffMode === "call"
      ? {
          title: "Your kickoff is set.",
          body: "I've saved what you shared and let the Vigil team know you'll cover the rest on your kickoff call. You can see the project status from your dashboard.",
        }
      : {
        title: "Sent. The team has your brief.",
        body: `I've handed your details to the Vigil team. They'll review the goals and scope, then contact you within ${RESPONSE_WINDOW} to confirm the site plan and timeline before design starts.`,
      };
}

/** Virtue helps everyone get set up; the AI employee is a Growth/Priority inclusion. */
export const VIRTUE_NOTE = "Virtue helps every Vigil customer get set up. On Growth and Priority it keeps working for you after launch.";
