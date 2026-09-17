import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/vigil/auth/origin";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/vigil/onboarding/constants";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { getOnboardingProject } from "@/lib/vigil/queries/onboarding";

/**
 * "Look around first" / "Do this later": remember only the current project.
 * A later customer or project in the same browser must receive its own welcome.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(`${requestOrigin(request)}/dashboard`, { status: 303 });
  if (request.nextUrl.searchParams.get("clear") === "1") {
    // ?clear=1 brings Virtue's welcome back (used from "Start" on the Overview card).
    response.cookies.set(ONBOARDING_SKIP_COOKIE, "", { path: "/", maxAge: 0 });
  } else {
    const requestedProject = request.nextUrl.searchParams.get("project")?.trim();
    const projectId = requestedProject || (await currentOnboardingProjectId());
    if (projectId) {
      response.cookies.set(ONBOARDING_SKIP_COOKIE, projectId, { path: "/", sameSite: "lax", httpOnly: true });
    }
  }
  return response;
}

async function currentOnboardingProjectId(): Promise<string | null> {
  const ctx = await requireOrgContext("/dashboard");
  const onboarding = await getOnboardingProject(ctx.organization.id);
  return onboarding?.project.id ?? null;
}
