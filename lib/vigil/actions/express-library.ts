"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { ValidationError, NotFoundError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { blankExpressSite, parseExpressDraft } from "@/lib/vigil/express/document";
import { runtimeManifest } from "@/lib/vigil/professional/workspace";
import { slugify } from "@/lib/vigil/format";
import type { Json } from "@/types/database.types";

function refresh() { revalidatePath("/admin/lab/express", "layout"); revalidatePath("/express"); revalidatePath("/creators"); revalidatePath("/products"); revalidatePath("/products/websites"); }
export async function createExpressVariant(input: { name: string; industry: string; duplicateId?: string }): Promise<ActionResult<{ id: string }>> {
 try {
  const staff = await requireStaffOrThrow();
  const value = z.object({ name: z.string().trim().min(1).max(80), industry: z.string().trim().min(1).max(80), duplicateId: z.string().uuid().optional() }).parse(input);
  const client = await createClient(); const id = randomUUID();
  const source = value.duplicateId ? await client.from("express_variants").select("draft").eq("id", value.duplicateId).single() : null;
  if (source?.error) throw source.error;
  const base = source?.data ? parseExpressDraft(source.data.draft) : null;
  const draft = parseExpressDraft(base ? { ...base, variant: value.name, industry: value.industry, ...(base.kind === "site" ? { site: { ...base.site, id: `express-${id}` } } : {}) } : {
   variant: value.name, industry: value.industry, example: value.name, description: "", accent: "#bfa483", kind: "site", site: blankExpressSite(id, value.name),
  }, id);
  const slug = `${slugify(value.industry + "-" + value.name).slice(0,65)}-${id.slice(0,8)}`;
  const { error } = await client.from("express_variants").insert({ id, slug, draft: draft as unknown as Json, updated_by: staff.user.id });
  if (error) throw error; refresh(); return { ok: true, data: { id } };
 } catch (failure) { return toActionError(failure, "staff"); }
}
export async function saveExpressVariant(id: string, revision: number, input: unknown, publish = false): Promise<ActionResult<{ revision: number; publishedRevision: number | null }>> {
 try {
  const staff = await requireStaffOrThrow(); z.string().uuid().parse(id); z.number().int().positive().parse(revision); z.boolean().parse(publish);
  const draft = parseExpressDraft(input, id, publish);
  if (publish && draft.kind === "site") draft.engineVersion = (await runtimeManifest()).version;
  const client = await createClient();
  const { data, error } = await client.from("express_variants").update({ draft: draft as unknown as Json, revision: revision + 1, updated_by: staff.user.id,
   ...(publish ? { published: draft as unknown as Json, published_revision: revision + 1 } : {}),
  }).eq("id", id).eq("revision", revision).is("archived_at", null).select("revision,published_revision").maybeSingle();
  if (error) throw error;
  if (!data) throw new ValidationError("This variant was changed or removed in another editor. Reload before saving; your edits remain on screen.");
  refresh(); return { ok: true, data: { revision: data.revision, publishedRevision: data.published_revision } };
 } catch (failure) { return toActionError(failure, "staff"); }
}
export async function archiveExpressVariant(id: string, revision: number, restore = false): Promise<ActionResult> {
 try {
  const staff = await requireStaffOrThrow(); z.string().uuid().parse(id); z.number().int().positive().parse(revision); z.boolean().parse(restore);
  const client = await createClient();
  const { data, error } = await client.from("express_variants").update({ archived_at: restore ? null : new Date().toISOString(), revision: revision + 1, updated_by: staff.user.id }).eq("id", id).eq("revision", revision).select("id").maybeSingle();
  if (error) throw error; if (!data) throw new NotFoundError("Variant changed. Reload the catalog and try again.");
  refresh(); return { ok: true, data: undefined };
 } catch (failure) { return toActionError(failure, "staff"); }
}
