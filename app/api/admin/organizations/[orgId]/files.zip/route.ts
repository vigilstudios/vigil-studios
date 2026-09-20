import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/vigil/audit";
import { isVigilError } from "@/lib/vigil/auth/errors";
import { requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { safeName, zipEntries, zipStream, type ZipSource } from "@/lib/vigil/services/files-zip";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SIGNED_URL_SECONDS = 10 * 60;

type FileRow = ZipSource & { size_bytes: number; object_path: string; bucket_id: string };

/**
 * Everything a customer has uploaded, as one zip for staff: the Download
 * all button on the customer files gallery. The archive is streamed (see
 * files-zip.ts); every export is audited.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireStaffOrThrow();
    const supabase = await createClient();
    const [{ data: org }, { data: rows, error }] = await Promise.all([
      supabase.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
      supabase
        .from("project_assets")
        .select("id, kind, file_name, size_bytes, created_at, object_path, bucket_id, project:projects!project_assets_project_id_fkey(id, name)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true }),
    ]);
    if (error) throw error;
    if (!org) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const files = (rows ?? []) as unknown as FileRow[];
    if (files.length === 0) return NextResponse.json({ error: "no_files", message: "This customer has not uploaded anything yet." }, { status: 404 });

    // Signed links for every object up front, one storage call per bucket.
    const urls = new Map<string, string>();
    const byBucket = new Map<string, FileRow[]>();
    for (const f of files) byBucket.set(f.bucket_id, [...(byBucket.get(f.bucket_id) ?? []), f]);
    for (const [bucket, list] of byBucket) {
      const { data, error: signError } = await supabase.storage.from(bucket).createSignedUrls(list.map((f) => f.object_path), SIGNED_URL_SECONDS);
      if (signError) throw signError;
      for (const d of data ?? []) if (d.signedUrl && d.path) urls.set(`${bucket}:${d.path}`, d.signedUrl);
    }
    const entries = zipEntries(org.name, files.map((f) => ({ ...f, url: urls.get(`${f.bucket_id}:${f.object_path}`) ?? null })));
    const filename = `${safeName(org.name)} files.zip`;

    await logAuditEvent(supabase, {
      action: "files.exported",
      entityType: "organization",
      entityId: org.id,
      organizationId: org.id,
      metadata: { files: entries.length, bytes: files.reduce((n, f) => n + f.size_bytes, 0) },
    });

    return new NextResponse(zipStream(entries), {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (isVigilError(err)) return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    console.error("customer files export failed:", err);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
