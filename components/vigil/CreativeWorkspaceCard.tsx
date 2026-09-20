import { ActionButton } from "@/components/vigil/ActionControls";
import { Card, DefinitionList, StatusPill } from "@/components/vigil/ui";
import { enqueueWebsiteJob } from "@/lib/vigil/actions/admin";
import { CREATIVE_WORKSPACE_ROOT } from "@/lib/vigil/creative/config";
import { CREATIVE_STATUSES, CREATIVE_STATUS_LABELS, creativeStatusTone, isTerminalCreativeStatus, type CreativeStatus } from "@/lib/vigil/creative/status";
import { formatDateTime } from "@/lib/vigil/format";
import type { getCreativeWorkspace } from "@/lib/vigil/queries/admin";

type Workspace = NonNullable<Awaited<ReturnType<typeof getCreativeWorkspace>>>;

/**
 * Staff view of the creative hand-off for one website: where generation
 * is, what it warned about, why it failed, and a button to run it again
 * without touching the repository job. Nothing here reaches customers.
 */
export function CreativeWorkspaceCard({ websiteId, workspace, repositoryUrl, projectKind }: { websiteId: string; workspace: Workspace | null; repositoryUrl: string | undefined; projectKind: string | null | undefined }) {
  const status: CreativeStatus = workspace && (CREATIVE_STATUSES as readonly string[]).includes(workspace.status) ? (workspace.status as CreativeStatus) : "not_started";
  const warnings = Array.isArray(workspace?.warnings) ? (workspace!.warnings as unknown[]).filter((w): w is string => typeof w === "string") : [];
  const failure = workspace?.error && typeof workspace.error === "object" && !Array.isArray(workspace.error) ? (workspace.error as { code?: string; message?: string }) : null;
  const counts = workspace?.asset_counts && typeof workspace.asset_counts === "object" && !Array.isArray(workspace.asset_counts) ? (workspace.asset_counts as Record<string, number>) : null;
  const running = workspace != null && !isTerminalCreativeStatus(status) && status !== "not_started";
  const disabledReason = !repositoryUrl ? "Create the repository first." : running ? "Generation is running." : undefined;
  const workspaceUrl = repositoryUrl ? `${repositoryUrl}/tree/main/${CREATIVE_WORKSPACE_ROOT}` : null;

  return (
    <Card className="mt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Creative workspace</h2>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
            The <code>{CREATIVE_WORKSPACE_ROOT}/</code> hand-off in the repository: the customer&apos;s brief and files as given, Terra&apos;s normalised intelligence, and Astra&apos;s instructions.
            {projectKind === "express" ? " Express sites do not get one automatically; generate it here if the build needs it." : " Queued automatically after Create repository."}
          </p>
        </div>
        <StatusPill tone={creativeStatusTone(status)}>{CREATIVE_STATUS_LABELS[status]}</StatusPill>
      </div>

      {failure ? (
        <div className="mt-3 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 p-3 text-sm">
          <p className="font-semibold">Last run failed{failure.code ? ` (${failure.code})` : ""}</p>
          <p className="mt-1 whitespace-pre-wrap text-xs">{failure.message ?? "No message recorded."}</p>
          <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">The repository was not changed by the failed run. Fix the cause, then generate again; intelligence already produced for this brief is reused.</p>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3 text-sm">
          <p className="font-semibold">Warnings</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-start gap-2">
        <ActionButton
          disabled={Boolean(disabledReason)}
          disabledReason={disabledReason}
          action={enqueueWebsiteJob.bind(null, websiteId, "website.creative_workspace")}
          confirmText={workspace && isTerminalCreativeStatus(status) ? "Regenerate the creative workspace? Files under outputs/ and anything edited by hand are kept." : undefined}
        >
          {workspace && status !== "not_started" ? "Regenerate" : "Generate creative workspace"}
        </ActionButton>
        {workspaceUrl && (status === "ready" || status === "ready_with_warnings") ? (
          <a className="btn-secondary text-sm !px-3 !py-1.5" href={workspaceUrl} target="_blank" rel="noreferrer">Open in repository</a>
        ) : null}
      </div>

      {workspace ? (
        <DefinitionList
          items={[
            { label: "Last generated", value: formatDateTime(workspace.generated_at) },
            { label: "Last run", value: `${formatDateTime(workspace.started_at)} → ${workspace.finished_at ? formatDateTime(workspace.finished_at) : "running"}` },
            { label: "Intelligence", value: workspace.intelligence_at ? `${workspace.model_id ?? "model"} · ${formatDateTime(workspace.intelligence_at)}` : "Not generated" },
            { label: "Versions", value: workspace.workflow_version ? `workflow ${workspace.workflow_version} · prompt ${workspace.prompt_version ?? "–"} · schema ${workspace.schema_version ?? "–"} · template ${workspace.template_version ?? "–"}` : "–" },
            { label: "Assets", value: counts ? `${counts.total ?? 0} total · ${counts.committed ?? 0} in Git · ${counts.external ?? 0} in storage${counts.failed ? ` · ${counts.failed} failed` : ""}` : "–" },
            { label: "Commit", value: workspace.commit_sha ? <code className="text-xs">{workspace.commit_sha.slice(0, 12)}</code> : "None yet" },
          ]}
        />
      ) : null}
    </Card>
  );
}
