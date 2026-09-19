import type { Metadata } from "next";
import { EmptyState } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { resolveEntitlements } from "@/lib/vigil/entitlements";
import { formatMb } from "@/lib/vigil/files";
import { getOnboardingProject } from "@/lib/vigil/queries/onboarding";
import { getProjectAssets } from "@/lib/vigil/queries/onboarding";
import { fileLimitsFor, fileUsageFor } from "@/lib/vigil/services/project-files";
import { createClient } from "@/lib/supabase/server";
import { FilesLibrary } from "./FilesLibrary";

export const metadata: Metadata = { title: "Files" };

/**
 * The project library. Everything the customer gives the team for the
 * build lives here: photos, videos, logos and documents, before and after
 * onboarding. Room is an entitlement, so one customer can have far more
 * than the default without it becoming everyone's.
 */
export default async function FilesPage() {
  const ctx = await requireOrgContext("/dashboard/files");
  const [onboarding, ent, supabase] = await Promise.all([getOnboardingProject(ctx.organization.id), resolveEntitlements(ctx.organization.id), createClient()]);
  const limits = fileLimitsFor(ent);
  const usage = await fileUsageFor(supabase, ctx.organization.id);

  if (!onboarding) {
    return (
      <div className="space-y-4">
        <Header limits={limits} usage={usage} />
        <EmptyState title="No project yet" description="Files attach to your website project. Once Vigil has set up your project, this is where you add photos, videos and documents for the build." />
      </div>
    );
  }

  const assets = await getProjectAssets(onboarding.project.id);
  return (
    <div className="space-y-4">
      <Header limits={limits} usage={usage} />
      <FilesLibrary
        projectId={onboarding.project.id}
        projectName={onboarding.project.name}
        organizationId={ctx.organization.id}
        initialAssets={assets}
        limits={limits}
        initialUsage={usage}
        canManage={ctx.role !== "member" || ctx.isImpersonating}
      />
    </div>
  );
}

function Header({ limits, usage }: { limits: ReturnType<typeof fileLimitsFor>; usage: { count: number; bytes: number } }) {
  const parts = [
    limits.maxCount !== null ? `${usage.count} of ${limits.maxCount} files` : `${usage.count} file${usage.count === 1 ? "" : "s"}`,
    limits.maxTotalBytes !== null ? `${formatMb(usage.bytes)} of ${formatMb(limits.maxTotalBytes)}` : formatMb(usage.bytes),
  ];
  return (
    <div>
      <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Files</h1>
      <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">
        Photos, videos, logos and documents for your website. Add as many as you like within your room ({parts.join(" · ")}); the team is told each time you add some.
      </p>
    </div>
  );
}
