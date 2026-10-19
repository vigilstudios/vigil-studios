import { domainHandoffEnabled } from "@/lib/vigil/domain-commerce-config";
import { createClient } from "@/lib/supabase/server";
import { loadDomainIntent } from "@/lib/vigil/services/domain-handoff";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { canManageDomainSetup } from "@/lib/vigil/domain-access";
import { resumeStep, stepsForProjectKind, type StepKey } from "@/lib/vigil/onboarding/brief";
import { getOnboardingProject, getProjectAssets } from "@/lib/vigil/queries/onboarding";
import { getOrgDomains } from "@/lib/vigil/queries/dashboard";
import { guidedDomainRecords } from "@/lib/vigil/services/dns";
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
  const client = await createClient();
  const { data: website } = await client.from("websites").select("id").eq("organization_id", ctx.organization.id).eq("project_id", project.id).maybeSingle();
  const intent = website ? await loadDomainIntent(client, ctx.organization.id, website.id) : null;
  const domainRow = domains.find(d => d.id === brief.domain?.domainId && d.website_id === website?.id) ?? (intent && intent.phase !== "cancelled" ? domains.find(d => d.website_id === website?.id && d.hostname === intent.hostname && d.status !== "released") : null) ?? null;
  const domainSetup = domainRow
    ? {
        domainId: domainRow.id,
        hostname: domainRow.hostname,
        status: domainRow.status,
        registrar: brief.domain?.registrar ?? (domainRow.registrar === "vercel" ? "vercel" as const : "other" as const),
        records: guidedDomainRecords(domainRow.hostname, domainRow.verification, domainRow.verification_token),
        dnsOk: domainRow.dns_ok,
        sslOk: domainRow.ssl_ok,
        reachable: (domainRow.verification as { connection_reachable?: boolean } | null)?.connection_reachable ?? null,
        launchReady: (domainRow.verification as { launch_ready?: boolean } | null)?.launch_ready === true,
        statusReason: domainRow.status_reason,
        cutoverReady: (domainRow.verification as { source?: string } | null)?.source === "provider" || domainRow.status === "connected",
      }
    : null;

  return (
    <OnboardingWizard
      projectId={project.id}
      websiteId={domainHandoffEnabled() ? website?.id ?? null : null}
      initialIntent={intent}
      projectKind={project.kind}
      organizationId={ctx.organization.id}
      businessName={brief.basics?.businessName || ctx.organization.name}
      firstName={ctx.profile.full_name?.split(" ")[0] ?? null}
      initialBrief={brief}
      initialStep={initialStep}
      initialAssets={assets}
      initialDomain={domainSetup}
      completedAt={project.intake_completed_at}
      canManageDomain={canManageDomainSetup(ctx)}
    />
  );
}
