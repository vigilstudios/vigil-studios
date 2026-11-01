import type { Project, ProjectStatus, Website } from "@/lib/vigil/types";
import { effectiveProjectStatus, projectStepIndex } from "@/lib/vigil/presenters";

type Review = { status: "pending" | "awaiting_feedback" | "changes_requested" | "revision_in_progress" | "approved"; currentSubmissionId: string | null };
export type PreviewProgressInput = {
  project: Pick<Project, "kind" | "status" | "intake_completed_at"> | null;
  hasPreview: boolean;
  reviews: Review[];
  domainReady: boolean;
  planActive: boolean;
  domainHref: string;
};

/** Keep a site's progress attached to its own project, even with several builds. */
export function previewProject(projects: Project[], website: Pick<Website, "project_id"> | null): Project | null {
  if (website?.project_id) return projects.find(project => project.id === website.project_id) ?? null;
  return projects.find(project => !["closed", "cancelled"].includes(project.status)) ?? projects[0] ?? null;
}

export function previewProgress(input: PreviewProgressInput) {
  const { project, hasPreview, reviews, domainReady, planActive, domainHref } = input;
  let stage: ProjectStatus = project ? effectiveProjectStatus(project.status, {
    intakeCompleted: Boolean(project.intake_completed_at),
    previewReady: hasPreview,
  }) : "in_progress";
  const terminal = stage === "cancelled" || stage === "closed";
  const requiredRounds = project?.kind === "professional" ? 2 : project?.kind === "express" ? 1 : 0;
  const approvedReviews = requiredRounds > 0 && reviews.length === requiredRounds && reviews.every(round => round.status === "approved" && round.currentSubmissionId);
  if (approvedReviews && !terminal && stage !== "launched") stage = "approved";
  const review = reviews.find(round => round.status !== "approved");
  const actionableReview = review?.status === "awaiting_feedback" && Boolean(review.currentSubmissionId);
  const revision = review?.status === "changes_requested" || review?.status === "revision_in_progress";
  const intakeNeeded = Boolean(project && ["draft", "intake"].includes(project.status) && !project.intake_completed_at);
  const reviewHref = project?.kind === "professional" ? "/dashboard/review" : "/dashboard/website";
  const approved = stage === "approved" || stage === "launched" || approvedReviews;

  let next = {
    title: "Your website is taking shape",
    description: "Vigil is preparing your website. Your first look will appear here when it is ready.",
    label: "View your brief", href: "/dashboard/onboarding", owner: "With Vigil",
  };
  if (!project) {
    next = { title: "Preparing your website", description: "Your website setup is underway. We will keep this overview updated as the build progresses.", label: "View website", href: "/dashboard/website", owner: "With Vigil" };
  } else if (terminal) {
    next = { title: stage === "cancelled" ? "Project cancelled" : "Project completed", description: "Your project history and the details you shared are available below.", label: "View your brief", href: "/dashboard/onboarding", owner: "Project history" };
  } else if (intakeNeeded) {
    next = { title: "Let’s bring your website to life", description: "Share your business, content and brand with Virtue. Everything saves as you go; the team starts once you send your brief.", label: "Continue setup", href: "/dashboard/onboarding", owner: "Your next step" };
  } else if (actionableReview) {
    next = { title: "Your design is ready for you", description: project.kind === "professional" ? "Explore the latest version and send your consolidated feedback in your design review." : "Explore your Express preview, request your included changes or approve the design.", label: "Review your website", href: reviewHref, owner: "Your next step" };
  } else if (revision) {
    next = { title: "We’re refining your website", description: "Your feedback is with Vigil. We will share the updated version when it is ready for another look.", label: "View your feedback", href: reviewHref, owner: "With Vigil" };
  } else if (approved && !domainReady) {
    next = { title: "Give your website a home", description: "Your design is approved. Check your domain setup so Vigil can prepare the final connection for launch.", label: "Open domain setup", href: domainHref, owner: "Before launch" };
  } else if (approved && !planActive) {
    next = { title: "Check your Vigil plan", description: "Your design is approved. An active hosting plan is needed before your website can go live.", label: "View subscription", href: "/dashboard/billing", owner: "Before launch" };
  } else if (approved) {
    next = { title: "Getting ready to go live", description: "Your design is approved and the launch essentials are in place. Vigil will complete the final checks and publish your website.", label: "View approved design", href: project.kind === "custom" ? "/dashboard/website" : reviewHref, owner: "With Vigil" };
  } else if (project.kind === "professional" && reviews.some(round => round.status === "approved")) {
    next = { title: "Your full website is coming together", description: "Your design direction is approved. Vigil is preparing the full-site review, including the remaining pages and details.", label: "View design review", href: reviewHref, owner: "With Vigil" };
  } else if (stage === "review" && hasPreview) {
    next = { title: "Take a look at your website", description: "Your build preview is available. We will confirm when it is ready for feedback; you can also reply to your project email with questions.", label: "Open website preview", href: "/dashboard/website", owner: "Build preview" };
  }
  const checks = [
    { id: "brief", label: "Business brief", done: Boolean(project?.intake_completed_at), pending: intakeNeeded ? "Your details needed" : "Not submitted" },
    { id: "preview", label: "Website preview", done: hasPreview, pending: "Being prepared" },
    { id: "approval", label: "Design approval", done: approved, pending: actionableReview ? "Ready for your review" : revision ? "Changes in progress" : "After design review" },
    { id: "domain", label: "Domain connection", done: domainReady, pending: "Setup pending" },
    { id: "plan", label: "Vigil plan", done: planActive, pending: "Not active" },
  ];
  return { stage, step: projectStepIndex(stage), next, checks, intakeNeeded, approved };
}
