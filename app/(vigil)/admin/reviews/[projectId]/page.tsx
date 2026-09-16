import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminReviewPublishForm } from "@/components/vigil/AdminReviewPublishForm";
import { ActionButton } from "@/components/vigil/ActionControls";
import { Card, PageHeader, StatusPill } from "@/components/vigil/ui";
import { markReviewRevisionInProgress } from "@/lib/vigil/actions/reviews";
import { setProjectStatus } from "@/lib/vigil/actions/admin";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDateTime, titleCase } from "@/lib/vigil/format";
import { projectTransitions } from "@/lib/vigil/lifecycle";
import { getStaffProjectReviews } from "@/lib/vigil/queries/reviews";
import { createClient } from "@/lib/supabase/server";
import { TransitionSelect } from "@/components/vigil/ActionControls";

export const metadata: Metadata = { title: "Project reviews" };

const phaseLabel = { design_direction: "Design direction", full_site: "Full-site review" } as const;

export default async function AdminProjectReviewsPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireStaff();
  const { projectId } = await params;
  const reviews = await getStaffProjectReviews(projectId);
  if (!reviews) notFound();
  // Review attachments are private storage objects. Sign each visible object
  // at render time rather than exposing a permanent storage URL in the review
  // query or the customer-facing data model.
  const supabase = await createClient();
  const attachments = reviews.rounds.flatMap((round) => round.submissions.flatMap((submission) => submission.response?.attachments ?? []));
  const signedAttachmentUrls = new Map<string, string>();
  await Promise.all(attachments.map(async (attachment) => {
    const { data } = await supabase.storage.from(attachment.bucket_id).createSignedUrl(attachment.object_path, 60 * 60);
    if (data?.signedUrl) signedAttachmentUrls.set(attachment.id, data.signedUrl);
  }));

  const approvalsComplete = reviews.rounds.length === 2 && reviews.rounds.every((round) => round.status === "approved");
  return (
    <div>
      <PageHeader
        eyebrow="Professional project"
        title={`${reviews.project.name} reviews`}
        description={<><Link className="underline" href={`/admin/organizations/${reviews.project.organizationId}`}>Open customer</Link> · project is {titleCase(reviews.project.status)}</>}
        actions={<StatusPill tone={approvalsComplete ? "good" : "warn"}>{approvalsComplete ? "Ready for production" : "Production gated"}</StatusPill>}
      />

      <Card className="mb-4">
        <h2 className="text-base font-semibold">Launch gate</h2>
        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
          {approvalsComplete
            ? "Both included review rounds have an explicit customer approval. A production deploy can now be started from the website workspace."
            : "Production deploys are blocked until the customer explicitly approves both Design direction and Full-site review. Preview deploys remain available."}
        </p>
      </Card>

      <Card className="mb-4">
        <h2 className="text-base font-semibold">Project lifecycle</h2>
        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Keep the customer-facing project stage aligned with this review work. Changes requested normally returns the project to In progress; an approved final review can move it to Approved.</p>
        <div className="mt-3">
          <TransitionSelect current={reviews.project.status} options={projectTransitions[reviews.project.status as keyof typeof projectTransitions]} action={setProjectStatus.bind(null, reviews.project.id)} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {reviews.rounds.map((round) => {
          const previousRoundApproved = round.number === 1 || reviews.rounds.some((candidate) => candidate.number === 1 && candidate.status === "approved");
          const canPublish = previousRoundApproved && (round.status === "pending" || round.status === "revision_in_progress");
          return (
          <Card key={round.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Round {round.number}</p>
                <h2 className="text-base font-semibold">{phaseLabel[round.phase]}</h2>
              </div>
              <StatusPill tone={round.status === "approved" ? "good" : round.status === "changes_requested" ? "warn" : "info"}>{titleCase(round.status)}</StatusPill>
            </div>

            {round.status === "changes_requested" ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-[color:var(--border)] p-3">
                <p className="text-sm text-[color:var(--text-secondary)]">Mark the feedback as being addressed before publishing the next version.</p>
                <ActionButton action={markReviewRevisionInProgress.bind(null, reviews.project.id, round.number)}>Start revision</ActionButton>
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {round.submissions.map((submission) => (
                <article key={submission.id} className="rounded-md border border-[color:var(--border)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">Version {submission.version}</span>
                    <span className="text-xs text-[color:var(--text-secondary)]">Published {formatDateTime(submission.publishedAt)}</span>
                  </div>
                  <a href={submission.previewUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-sm underline">{submission.previewUrl}</a>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--text-secondary)]">{submission.notes}</p>
                  {submission.response ? (
                    <div className="mt-3 rounded bg-[color:var(--bg-surface-soft)] p-3 text-sm">
                      <p className="font-medium">Customer {submission.response.kind === "approved" ? "approved" : "requested changes"}</p>
                      {submission.response.feedback ? <p className="mt-1 whitespace-pre-wrap text-[color:var(--text-secondary)]">{submission.response.feedback}</p> : null}
                      <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Responded {formatDateTime(submission.response.respondedAt)}</p>
                      {submission.response.attachments.length ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {submission.response.attachments.map((attachment) => (
                            <li key={attachment.id}>
                              {signedAttachmentUrls.get(attachment.id) ? <a href={signedAttachmentUrls.get(attachment.id)} target="_blank" rel="noreferrer" className="rounded border border-[color:var(--border)] px-2 py-1 text-xs underline">{attachment.file_name}</a> : <span className="rounded border border-[color:var(--border)] px-2 py-1 text-xs">{attachment.file_name}</span>}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : <p className="mt-3 text-xs text-[color:var(--text-secondary)]">Awaiting customer feedback.</p>}
                </article>
              ))}
              {round.submissions.length === 0 ? <p className="text-sm text-[color:var(--text-secondary)]">No version has been published yet.</p> : null}
            </div>

            {canPublish ? <AdminReviewPublishForm projectId={reviews.project.id} roundNumber={round.number} submitLabel={round.submissions.length ? "Publish revised version" : "Publish for review"} /> : null}
            {round.number === 2 && !previousRoundApproved ? <p className="mt-4 text-sm text-[color:var(--text-secondary)]">Round 2 unlocks after the customer approves Design direction.</p> : null}
          </Card>
          );
        })}
      </div>
    </div>
  );
}
