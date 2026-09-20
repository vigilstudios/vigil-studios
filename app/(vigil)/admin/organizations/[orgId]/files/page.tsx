import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, FileText, Film } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatBytes } from "@/lib/vigil/attachments";
import { formatDateTime } from "@/lib/vigil/format";
import { isVideo } from "@/lib/vigil/files";
import { Card, PageHeader, StatusPill } from "@/components/vigil/ui";

export const metadata: Metadata = { title: "Customer files" };

const SIGNED_URL_SECONDS = 60 * 60;

type FileRow = {
  id: string;
  kind: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  caption: string | null;
  created_at: string;
  object_path: string;
  bucket_id: string;
  project: { id: string; name: string } | null;
  uploader: { full_name: string | null; email: string } | null;
};

const SECTIONS: { kind: string; title: string; hint: string }[] = [
  { kind: "photo", title: "Photos", hint: "Photography the customer supplied for the build." },
  { kind: "video", title: "Videos", hint: "Clips and reels; open to play, download to keep." },
  { kind: "logo", title: "Logos", hint: "Brand marks, including SVG and PDF originals." },
  { kind: "document", title: "Documents", hint: "Briefs, menus, decks and other PDFs." },
  { kind: "other", title: "Inspiration and other", hint: "References and anything that did not fit above." },
];

/**
 * Everything a customer has given the team, laid out to look at and to
 * download: every project, every kind. Links are signed for an hour under
 * the staff session's storage policy; the download link carries the original
 * file name.
 */
export default async function CustomerFilesPage({ params }: { params: Promise<{ orgId: string }> }) {
  await requireStaff();
  const { orgId } = await params;
  const supabase = await createClient();
  const [{ data: org }, { data: rows, error }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
    supabase
      .from("project_assets")
      .select("id, kind, file_name, content_type, size_bytes, caption, created_at, object_path, bucket_id, project:projects!project_assets_project_id_fkey(id, name), uploader:profiles!project_assets_uploaded_by_fkey(full_name, email)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
  ]);
  if (!org) notFound();
  if (error) throw error;
  const files = (rows ?? []) as unknown as FileRow[];

  const urls = new Map<string, string>();
  const byBucket = new Map<string, FileRow[]>();
  for (const f of files) byBucket.set(f.bucket_id, [...(byBucket.get(f.bucket_id) ?? []), f]);
  for (const [bucket, list] of byBucket) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(list.map((f) => f.object_path), SIGNED_URL_SECONDS);
    for (const d of data ?? []) if (d.signedUrl && d.path) urls.set(`${bucket}:${d.path}`, d.signedUrl);
  }
  const totalBytes = files.reduce((n, f) => n + f.size_bytes, 0);
  const projects = Array.from(new Map(files.map((f) => [f.project?.id ?? "none", f.project?.name ?? "No project"])).entries());

  return (
    <div>
      <PageHeader
        eyebrow="Customer files"
        title={org.name}
        description={
          <>
            {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(totalBytes)}
            {projects.length > 1 ? ` · ${projects.length} projects` : ""}. Links stay valid for an hour; Download keeps the original file name, and Download all packs every file into one zip.
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/organizations/${org.id}`} className="btn-secondary text-sm">Back to customer</Link>
            {files.length > 0 ? (
              <a href={`/api/admin/organizations/${org.id}/files.zip`} download className="btn-primary inline-flex items-center gap-1.5 text-sm">
                <Download className="h-4 w-4" aria-hidden /> Download all (.zip)
              </a>
            ) : null}
          </div>
        }
      />

      <nav className="mb-4 flex flex-wrap gap-2 text-xs">
        {SECTIONS.map((section) => {
          const count = files.filter((f) => f.kind === section.kind).length;
          return count > 0 ? (
            <a key={section.kind} href={`#${section.kind}`} className="rounded-full border border-[color:var(--border)] px-3 py-1 hover:border-[color:var(--accent)]">
              {section.title} · {count}
            </a>
          ) : null;
        })}
      </nav>

      {files.length === 0 ? (
        <Card><p className="text-sm text-[color:var(--text-secondary)]">Nothing uploaded yet. Files the customer adds during onboarding or from their Files page appear here.</p></Card>
      ) : null}

      {SECTIONS.map((section) => {
        const list = files.filter((f) => f.kind === section.kind);
        if (list.length === 0) return null;
        return (
          <Card key={section.kind} className="mt-4" as="section">
            <div id={section.kind} className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold">{section.title} <span className="text-sm font-normal text-[color:var(--text-secondary)]">· {list.length}</span></h2>
              <p className="text-xs text-[color:var(--text-secondary)]">{section.hint}</p>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {list.map((f) => {
                const url = urls.get(`${f.bucket_id}:${f.object_path}`) ?? null;
                const download = url ? `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(f.file_name)}` : null;
                const image = f.content_type.startsWith("image/");
                const video = isVideo(f.content_type);
                return (
                  <li key={f.id} className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)]">
                    <a href={url ?? "#"} target="_blank" rel="noreferrer" className="relative flex aspect-square items-center justify-center overflow-hidden bg-black/20">
                      {image && url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- signed URL
                        <img src={url} alt={f.caption ?? f.file_name} className="h-full w-full object-cover" loading="lazy" />
                      ) : video && url ? (
                        <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex flex-col items-center gap-1 px-2 text-center text-[10px] font-semibold uppercase text-[color:var(--text-secondary)]">
                          {video ? <Film className="h-6 w-6" aria-hidden /> : <FileText className="h-6 w-6" aria-hidden />}
                          {f.content_type === "application/pdf" ? "PDF" : f.file_name.split(".").pop()}
                        </span>
                      )}
                      {video ? <span className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">Video</span> : null}
                    </a>
                    <div className="space-y-1 px-2 py-2">
                      <p className="truncate text-xs font-medium" title={f.file_name}>{f.file_name}</p>
                      {f.caption ? <p className="line-clamp-2 text-[11px] text-[color:var(--text-secondary)]" title={f.caption}>{f.caption}</p> : null}
                      <p className="truncate text-[10px] text-[color:var(--text-secondary)]" title={`${f.uploader?.full_name || f.uploader?.email || "Customer"} · ${formatDateTime(f.created_at)}`}>
                        {formatBytes(f.size_bytes)} · {formatDateTime(f.created_at)}
                        {projects.length > 1 && f.project ? ` · ${f.project.name}` : ""}
                      </p>
                      <div className="flex gap-1.5 pt-1">
                        {download ? (
                          <a href={download} className="btn-primary inline-flex min-h-8 flex-1 items-center justify-center gap-1 !px-2 !py-1 text-[11px]">
                            <Download className="h-3.5 w-3.5" aria-hidden /> Download
                          </a>
                        ) : (
                          <StatusPill tone="warn">Link unavailable</StatusPill>
                        )}
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${f.file_name}`} className="btn-secondary inline-flex min-h-8 items-center justify-center !px-2 !py-1">
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
