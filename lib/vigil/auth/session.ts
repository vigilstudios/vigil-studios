import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Organization, OrgRole, Profile, StaffRole } from "@/lib/vigil/types";
import { ForbiddenError, UnauthenticatedError } from "./errors";

/**
 * Data Access Layer for identity.
 *
 * Every Server Component, Server Action and Route Handler under (vigil) goes
 * through these helpers. They are memoised per request with React `cache`, so
 * a page and its layout share one round-trip. Nothing here trusts a cookie
 * beyond what Supabase Auth has verified; tenancy is re-checked against
 * `organization_members` under RLS on every call.
 */

export const ACTIVE_ORG_COOKIE = "vigil-org";

export type Membership = {
  organization: Organization;
  role: OrgRole;
};

export type Viewer = {
  user: User;
  profile: Profile;
  staffRole: StaffRole | null;
  memberships: Membership[];
};

export type OrgContext = Viewer & {
  organization: Organization;
  role: OrgRole;
  /** Staff viewing a customer's dashboard without being a member. */
  isImpersonating: boolean;
};

export type StaffContext = Viewer & { staffRole: StaffRole };

export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const [profileRes, staffRes, membershipRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("staff_members").select("role").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("organization_members")
      .select("role, status, organization:organizations(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (staffRes.error) throw staffRes.error;
  if (membershipRes.error) throw membershipRes.error;

  // The trigger creates the profile at sign-up; a missing row means the
  // database was reset underneath a live session. Treat as signed out.
  if (!profileRes.data) return null;

  const memberships: Membership[] = [];
  for (const row of membershipRes.data ?? []) {
    if (row.organization) {
      memberships.push({ organization: row.organization, role: row.role });
    }
  }

  return {
    user,
    profile: profileRes.data,
    staffRole: staffRes.data?.role ?? null,
    memberships,
  };
});

function loginRedirect(next?: string): never {
  const target = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  redirect(target);
}

export async function requireViewer(next?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) loginRedirect(next);
  return viewer;
}

export async function requireStaff(next?: string): Promise<StaffContext> {
  const viewer = await requireViewer(next);
  if (!viewer.staffRole) {
    redirect("/dashboard");
  }
  return { ...viewer, staffRole: viewer.staffRole };
}

export async function requireAdmin(next?: string): Promise<StaffContext> {
  const staff = await requireStaff(next);
  if (staff.staffRole !== "admin") {
    throw new ForbiddenError("Admin access is required.");
  }
  return staff;
}

/**
 * Resolve which organization the viewer is acting for. The cookie is a
 * preference, not an authorization: it must match an active membership, or
 * (for staff) any organization they can read under RLS.
 */
export const getOrgContext = cache(async (): Promise<OrgContext | null> => {
  const viewer = await getViewer();
  if (!viewer) return null;

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;

  const fromMembership =
    (preferred && viewer.memberships.find((m) => m.organization.id === preferred)) ||
    viewer.memberships[0] ||
    null;

  if (fromMembership) {
    return {
      ...viewer,
      organization: fromMembership.organization,
      role: fromMembership.role,
      isImpersonating: false,
    };
  }

  // Staff may open any organization they can see, acting with owner-level
  // UI affordances; RLS still decides what actually succeeds.
  if (viewer.staffRole && preferred) {
    const supabase = await createClient();
    const { data } = await supabase.from("organizations").select("*").eq("id", preferred).maybeSingle();
    if (data) {
      return { ...viewer, organization: data, role: "owner", isImpersonating: true };
    }
  }

  return null;
});

export async function requireOrgContext(next?: string): Promise<OrgContext> {
  const viewer = await getViewer();
  if (!viewer) loginRedirect(next);
  const ctx = await getOrgContext();
  if (!ctx) {
    // Signed in, but no business yet. Staff go to their own console.
    redirect(viewer.staffRole ? "/admin" : "/dashboard/welcome");
  }
  return ctx;
}

/** For server actions: throw rather than redirect so the caller can respond. */
export async function assertOrgRole(ctx: OrgContext, roles: OrgRole[]): Promise<void> {
  if (ctx.isImpersonating && ctx.staffRole) return;
  if (!roles.includes(ctx.role)) {
    throw new ForbiddenError("Your role in this organization does not allow that.");
  }
}

export async function requireViewerOrThrow(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new UnauthenticatedError();
  return viewer;
}

export async function requireStaffOrThrow(): Promise<StaffContext> {
  const viewer = await requireViewerOrThrow();
  if (!viewer.staffRole) throw new ForbiddenError("Staff access is required.");
  return { ...viewer, staffRole: viewer.staffRole };
}

export async function requireAdminOrThrow(): Promise<StaffContext> {
  const staff = await requireStaffOrThrow();
  if (staff.staffRole !== "admin") throw new ForbiddenError("Admin access is required.");
  return staff;
}

export async function requireOrgContextOrThrow(): Promise<OrgContext> {
  await requireViewerOrThrow();
  const ctx = await getOrgContext();
  if (!ctx) throw new ForbiddenError("You are not a member of an organization.");
  return ctx;
}
