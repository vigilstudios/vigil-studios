import { createClient } from "@/lib/supabase/server";
import { requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { isVigilError } from "@/lib/vigil/auth/errors";
import { professionalProject, projectAssets } from "@/lib/vigil/professional/workspace";
export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string; assetId: string }> }) {
  try {
    await requireStaffOrThrow();
    const { projectId, assetId } = await params;
    const client = await createClient();
    const { project } = await professionalProject(client, projectId);
    const asset = (await projectAssets(client, project.id, project.organization_id)).find(asset => asset.id === assetId);
    if (!asset) return Response.json({ error: "Asset not found in this project." }, { status: 404 });
    const { data, error } = await client.storage.from(asset.bucket_id).createSignedUrl(asset.object_path, 120);
    if (error) throw error;
    return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "private, no-store" } });
  } catch (failure) {
    return Response.json({ error: isVigilError(failure) ? failure.message : "Could not open this asset." }, { status: isVigilError(failure) ? failure.status : 500 });
  }
}
