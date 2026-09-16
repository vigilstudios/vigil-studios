import type { Metadata } from "next";
import { EmptyState } from "@/components/vigil/ui";
import { ReviewDashboard } from "@/components/vigil/ReviewDashboard";
import { attachReviewFiles, submitReviewDecision } from "@/lib/vigil/actions/reviews";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { getOrgProjects } from "@/lib/vigil/queries/dashboard";
import { getCustomerReview } from "@/lib/vigil/queries/reviews";

export const metadata: Metadata = { title: "Design review" };

/**
 * The review action seam is deliberately kept at the page boundary.
 *
 * `getCustomerReview(projectId)` returns the client-safe `CustomerReview`
 * view-model, including short-lived signed attachment URLs.
 * `submitReviewDecision({ reviewId, round, decision, feedback })` returns
 * `{ ok: true, data: { id: responseId } }`; `attachReviewFiles(responseId,
 * uploaded)` records browser-direct Storage uploads.
 *
 * The page still provides the complete review surface when no version has
 * been published yet. It never
 * gates access on the `requests.enabled` entitlement: Professional build
 * reviews are part of the build, including Basic-plan Professional sites.
 */
export default async function ReviewPage() {
  const ctx = await requireOrgContext("/dashboard/review");
  const projects = await getOrgProjects(ctx.organization.id);
  const professionalProject = projects.find((project) => project.kind === "professional");

  if (!professionalProject) {
    return (
      <EmptyState
        title="No Professional review yet"
        description="Your two-round design review appears here for a Professional website build. If you think this is unexpected, contact Vigil and we will take a look."
      />
    );
  }

  const review = await getCustomerReview(professionalProject.id);
  return (
    <ReviewDashboard
      review={review}
      organizationId={ctx.organization.id}
      actions={{ submitDecision: submitReviewDecision, attachFiles: attachReviewFiles }}
    />
  );
}
