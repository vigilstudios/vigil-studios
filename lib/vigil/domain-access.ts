import type { OrgContext } from "./auth/session";

/** Managing Vigil's setup is separate from authorizing access to a registrar account. */
export function canManageDomainSetup(ctx: Pick<OrgContext, "role" | "isImpersonating" | "staffRole">): boolean {
  return ctx.staffRole === "admin" || (!ctx.isImpersonating && (ctx.role === "owner" || ctx.role === "manager"));
}
