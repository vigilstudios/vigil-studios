/** Set by /dashboard/onboarding/later to the project whose welcome was deferred. */
export const ONBOARDING_SKIP_COOKIE = "vigil-onboarding-later";
export const ONBOARDING_WELCOME_HREF = "/dashboard/onboarding/welcome";
export const ONBOARDING_LATER_HREF = "/dashboard/onboarding/later";

/** A deferral for one customer project must never hide another project's welcome. */
export function welcomeWasDeferred(cookieValue: string | undefined, projectId: string): boolean {
  return cookieValue === projectId;
}
