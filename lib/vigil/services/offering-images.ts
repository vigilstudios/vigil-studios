import "server-only";

import type { ServerSupabaseClient } from "@/lib/supabase/server";
import { ValidationError } from "@/lib/vigil/auth/errors";
import type { Offerings } from "@/lib/vigil/onboarding/brief";
import { IMAGE_ACCEPT } from "@/lib/vigil/onboarding/assets";

/** Briefs reference private library IDs, never customer-supplied URLs or paths. */
export async function assertOfferingImages(supabase: ServerSupabaseClient, organizationId: string, projectId: string, offerings: Offerings): Promise<void> {
  const ids = [...new Set(offerings.sections.flatMap(section => section.items.flatMap(item => item.imageAssetIds)))];
  return assertProjectImages(supabase, organizationId, projectId, ids);
}

export async function assertProjectImages(supabase: ServerSupabaseClient, organizationId: string, projectId: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { data, error } = await supabase.from("project_assets")
    .select("id, content_type, bucket_id, object_path, size_bytes").eq("organization_id", organizationId).eq("project_id", projectId).in("id", ids);
  if (error) throw error;
  const allowed = new Set((data ?? []).filter(asset => IMAGE_ACCEPT.split(",").includes(asset.content_type) && ["project-assets", "content-media"].includes(asset.bucket_id) && asset.object_path.startsWith(`${organizationId}/${projectId}/`) && asset.size_bytes > 0).map(asset => asset.id));
  if (ids.some(id => !allowed.has(id))) throw new ValidationError("Some item images are no longer available in this project's Files. Remove them or choose another image.");
}
