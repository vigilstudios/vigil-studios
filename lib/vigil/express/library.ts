import "server-only";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/vigil/types";
import { catalogEntry, parseExpressDraft } from "./document";

export async function publishedExpressTemplates(client?: DbClient) {
 if (!client && !getPublicSupabaseEnv()) return [];
 const { data, error } = await (client ?? await createClient()).from("published_express_variants").select("slug,published").order("sort_order").order("slug");
 if (error) throw error;
 return (data ?? []).flatMap(row => row.slug && row.published ? [catalogEntry(row.slug, parseExpressDraft(row.published))] : []);
}
export async function publishedExpressVariant(slug: string, client?: DbClient) {
 if (!client && !getPublicSupabaseEnv()) return null;
 const { data, error } = await (client ?? await createClient()).from("published_express_variants").select("published").eq("slug", slug).maybeSingle();
 if (error) throw error;
 return data?.published ? parseExpressDraft(data.published) : null;
}
export async function isPublishedExpressSlug(slug: string, client?: DbClient): Promise<boolean> {
 return Boolean(await publishedExpressVariant(slug, client));
}
