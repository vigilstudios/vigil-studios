import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/vigil/audit";
import { isVigilError } from "@/lib/vigil/auth/errors";
import { assertOrgRole, requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { buildSiteExport, ExportUnavailableError } from "@/lib/vigil/services/export";

export const dynamic = "force-dynamic";

/**
 * Download the site as a zip. Owners and managers of the organization (or
 * staff viewing as them); the website must be export-eligible and
 * customer-owned. Every export is audited.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  try {
    const { websiteId } = await params;
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);

    const supabase = await createClient();
    const { data: website, error } = await supabase.from("websites").select("*").eq("id", websiteId).eq("organization_id", ctx.organization.id).maybeSingle();
    if (error) throw error;
    if (!website) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!website.export_eligible || website.code_ownership !== "customer_owned") {
      return NextResponse.json({ error: "not_exportable", message: "This site is not eligible for export." }, { status: 403 });
    }

    const result = await buildSiteExport(website, {
      organizationName: ctx.organization.name,
      exportedBy: ctx.profile.email,
    });

    await logAuditEvent(supabase, {
      action: "website.exported",
      entityType: "website",
      entityId: website.id,
      organizationId: ctx.organization.id,
      metadata: { files: result.fileCount, source: result.source, bytes: result.bytes.byteLength },
    });

    return new NextResponse(new Uint8Array(result.bytes), {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${result.filename}"`,
        "content-length": String(result.bytes.byteLength),
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof ExportUnavailableError) {
      return NextResponse.json({ error: "export_unavailable", message: err.message }, { status: 409 });
    }
    if (isVigilError(err)) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    console.error("site export failed:", err);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
