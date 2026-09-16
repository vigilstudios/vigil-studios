"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/vigil/audit";
import { ForbiddenError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { normalizeEmail } from "@/lib/vigil/auth/redirects";
import { ACTIVE_ORG_COOKIE, assertOrgRole, requireOrgContextOrThrow, requireViewerOrThrow } from "@/lib/vigil/auth/session";
import { sendOrganizationInvitation } from "@/lib/vigil/services/invitations";

/** Choose which business the dashboard shows. Validated against membership. */
export async function switchOrganization(organizationId: string): Promise<ActionResult> {
  try {
    const viewer = await requireViewerOrThrow();
    const allowed = viewer.memberships.some((m) => m.organization.id === organizationId) || Boolean(viewer.staffRole);
    if (!allowed) throw new ForbiddenError("You are not a member of that organization.");
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/dashboard", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Business name is too short.").max(120),
  legal_name: z.string().trim().max(160).optional().or(z.literal("")),
  billing_email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  website_url: z.string().trim().url("Enter a full URL, including https://").optional().or(z.literal("")),
  timezone: z.string().trim().min(1).max(64),
});

function issuesOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export type ProfileState = ActionResult | null;

export async function updateOrganizationProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  try {
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);

    const parsed = profileSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new ValidationError("Check the highlighted fields.", issuesOf(parsed.error));
    const v = parsed.data;

    const supabase = await createClient();
    const before = {
      name: ctx.organization.name,
      legal_name: ctx.organization.legal_name,
      billing_email: ctx.organization.billing_email,
      phone: ctx.organization.phone,
      website_url: ctx.organization.website_url,
      timezone: ctx.organization.timezone,
    };
    const after = {
      name: v.name,
      legal_name: v.legal_name || null,
      billing_email: v.billing_email ? normalizeEmail(v.billing_email) : null,
      phone: v.phone || null,
      website_url: v.website_url || null,
      timezone: v.timezone,
    };

    const { error } = await supabase.from("organizations").update(after).eq("id", ctx.organization.id);
    if (error) throw error;

    await logAuditEvent(supabase, {
      action: "organization.profile_updated",
      entityType: "organization",
      entityId: ctx.organization.id,
      organizationId: ctx.organization.id,
      before,
      after,
    });

    revalidatePath("/dashboard", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  role: z.enum(["owner", "manager", "member"]),
});

export type InviteState = ActionResult | null;

export async function inviteMember(_prev: InviteState, formData: FormData): Promise<InviteState> {
  try {
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);
    const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new ValidationError("Check the highlighted fields.", issuesOf(parsed.error));

    // Managers cannot mint owners.
    if (parsed.data.role === "owner" && ctx.role !== "owner" && !ctx.isImpersonating) {
      throw new ForbiddenError("Only an owner can invite another owner.");
    }

    const email = normalizeEmail(parsed.data.email);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organization_invites")
      .insert({ organization_id: ctx.organization.id, email, role: parsed.data.role, invited_by: ctx.user.id })
      .select("id")
      .single();
    if (error) throw error;

    await logAuditEvent(supabase, {
      action: "member.invited",
      entityType: "organization_invite",
      entityId: data.id,
      organizationId: ctx.organization.id,
      after: { email, role: parsed.data.role },
    });

    const delivery = await sendOrganizationInvitation({
      email,
      organizationName: ctx.organization.name,
      role: parsed.data.role,
    });
    if (!delivery.sent) throw new ValidationError(`The invitation was saved, but the email could not be sent${delivery.error ? `: ${delivery.error}` : "."}`);

    revalidatePath("/dashboard/settings");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  try {
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);
    const supabase = await createClient();
    const { error } = await supabase
      .from("organization_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", inviteId)
      .eq("organization_id", ctx.organization.id)
      .is("accepted_at", null);
    if (error) throw error;
    await logAuditEvent(supabase, {
      action: "member.invite_revoked",
      entityType: "organization_invite",
      entityId: inviteId,
      organizationId: ctx.organization.id,
    });
    revalidatePath("/dashboard/settings");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeMember(userId: string): Promise<ActionResult> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const removingSelf = userId === ctx.user.id;
    if (!removingSelf) await assertOrgRole(ctx, ["owner"]);
    const supabase = await createClient();
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", ctx.organization.id)
      .eq("user_id", userId);
    if (error) {
      // 23514: the last-owner guard.
      if (error.code === "23514") throw new ForbiddenError("An organization must keep at least one owner.");
      throw error;
    }
    await logAuditEvent(supabase, {
      action: removingSelf ? "member.left" : "member.removed",
      entityType: "organization_member",
      entityId: userId,
      organizationId: ctx.organization.id,
    });
    revalidatePath("/dashboard", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
