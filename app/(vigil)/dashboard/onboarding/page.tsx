import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { resumeStep, stepsForProjectKind, type StepKey } from "@/lib/vigil/onboarding/brief";
import { getOnboardingProject, getProjectAssets } from "@/lib/vigil/queries/onboarding";
import { getOrgDomains } from "@/lib/vigil/queries/dashboard";
import { requiredRecords } from "@/lib/vigil/services/dns";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = { title: "Getting set up" };

/**
 * Virtue-guided onboarding. One project per organization goes through it;
 * the brief in `projects.brief` is the single source of what was answered.
 */
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const ctx = await requireOrgContext("/dashboard/onboarding");
  const found = await getOnboardingProject(ctx.organization.id);
  if (!found) redirect("/dashboard");
  const { project, brief } = found;
  const { step: requested } = await searchParams;
  const projectSteps = stepsForProjectKind(project.kind);
  const initialStep: StepKey = requested && (projectSteps as readonly string[]).includes(requested) ? (requested as StepKey) : resumeStep(brief, project.kind);

  const [assets, domains] = await Promise.all([getProjectAssets(project.id), getOrgDomains(ctx.organization.id)]);
  const domainRow = brief.domain?.domainId ? domains.find((d) => d.id === brief.domain?.domainId) ?? null : null;
  const domainSetup = domainRow
    ? {
        domainId: domainRow.id,
        hostname: domainRow.hostname,
        status: domainRow.status,
        registrar: brief.domain?.registrar ?? ("other" as const),
        records: requiredRecords(domainRow.hostname, domainRow.verification),
        dnsOk: domainRow.dns_ok,
        statusReason: domainRow.status_reason,
        cutoverReady: (domainRow.verification as { source?: string } | null)?.source === "provider" || domainRow.status === "connected",
      }
    : null;

  return (
    <OnboardingWizard
      projectId={project.id}
      projectKind={project.kind}
      organizationId={ctx.organization.id}
      businessName={brief.basics?.businessName || ctx.organization.name}
      firstName={ctx.profile.full_name?.split(" ")[0] ?? null}
      initialBrief={brief}
      initialStep={initialStep}
      initialAssets={assets}
      initialDomain={domainSetup}
      completedAt={project.intake_completed_at}
      canManageDomain={ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating}
    />
  );
}
