"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Film, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { recordProjectFiles } from "@/lib/vigil/actions/files";
import { removeProjectAsset, updateAssetCaption } from "@/lib/vigil/actions/onboarding";
import { formatBytes } from "@/lib/vigil/attachments";
import { FILE_ACCEPT, filePath, formatMb, isVideo, validateFileBatch, type FileLimits, type FileUsage } from "@/lib/vigil/files";
import { PROJECT_ASSETS_BUCKET } from "@/lib/vigil/onboarding/assets";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { FileUploadButton } from "@/components/vigil/FileUploadButton";
import { Panel } from "@/components/vigil/widgets";

type Progress = { done: number; total: number; current: string; fraction: number };

export function FilesLibrary({ projectId, projectName, organizationId, initialAssets, limits, initialUsage, canManage }: {
  projectId: string;
  projectName: string;
  organizationId: string;
  initialAssets: SignedAsset[];
  limits: FileLimits;
  initialUsage: FileUsage;
  canManage: boolean;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [usage, setUsage] = useState(initialUsage);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (picked: File[]) => {
    setError(null);
    setNotice(null);
    const files = picked.filter(Boolean);
    if (files.length === 0) return;
    const problems = validateFileBatch(files, limits, usage);
    if (problems.length > 0) {
      setError(problems.map((p) => (p.name === "*" ? p.reason : `${p.name}: ${p.reason}`)).join(" "));
      return;
    }
    const supabase = createClient();
    const { uploadToBucket } = await import("@/lib/vigil/storage-upload");
    const { sha256Blob } = await import("@/lib/vigil/checksum");
    const uploaded: { path: string; name: string; type: string; size: number; checksum: string | null }[] = [];
    const failed: string[] = [];
    setProgress({ done: 0, total: files.length, current: files[0].name, fraction: 0 });
    for (const file of files) {
      const path = filePath(organizationId, projectId, file.type, crypto.randomUUID());
      setProgress((p) => (p ? { ...p, current: file.name, fraction: 0 } : p));
      try {
        // Fingerprint first, streamed, so a large video never sits in memory.
        const checksum = await sha256Blob(file).catch(() => null);
        await uploadToBucket(supabase, PROJECT_ASSETS_BUCKET, path, file, (fraction) => setProgress((p) => (p ? { ...p, fraction } : p)));
        uploaded.push({ path, name: file.name, type: file.type, size: file.size, checksum });
      } catch (err) {
        console.error("upload failed:", err);
        failed.push(file.name);
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    if (uploaded.length > 0) {
      const res = await recordProjectFiles(projectId, uploaded);
      if (res.ok) {
        failed.push(...res.data.failed);
        const recorded = res.data.recorded.map((r) => {
          const u = uploaded.find((x) => x.path === r.path)!;
          const f = files.find((x) => x.name === u.name);
          return { id: r.id, kind: r.kind, file_name: u.name, content_type: u.type, size_bytes: u.size, caption: null, url: f ? URL.createObjectURL(f) : null, object_path: r.path } satisfies SignedAsset;
        });
        setAssets((current) => [...current, ...recorded]);
        setUsage((u) => ({ count: u.count + recorded.length, bytes: u.bytes + recorded.reduce((n, r) => n + r.size_bytes, 0) }));
        if (recorded.length > 0) setNotice(`${recorded.length} file${recorded.length === 1 ? "" : "s"} added. The Vigil team has been told.`);
      } else {
        failed.push(...uploaded.map((u) => u.name));
        setError(res.error);
      }
    }
    if (failed.length > 0 && !error) setError(`These did not upload: ${failed.join(", ")}. Try again in a moment.`);
    setProgress(null);
    router.refresh();
  };

  const remove = async (asset: SignedAsset) => {
    if (!window.confirm(`Remove ${asset.file_name}?`)) return;
    const res = await removeProjectAsset(asset.id);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setAssets((current) => current.filter((a) => a.id !== asset.id));
    setUsage((u) => ({ count: Math.max(0, u.count - 1), bytes: Math.max(0, u.bytes - asset.size_bytes) }));
    router.refresh();
  };

  const busy = progress !== null;
  const roomLeft = limits.maxCount !== null ? Math.max(0, limits.maxCount - usage.count) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel className="lg:col-span-4" title="Add files">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(Array.from(e.dataTransfer.files)); }}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${dragging ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-[color:var(--border)]"}`}
        >
          <UploadCloud className="h-6 w-6 text-[color:var(--text-secondary)]" aria-hidden />
          <p className="mt-2 text-sm font-semibold">Drop photos, videos or PDFs here</p>
          <p className="mt-1 text-[11px] leading-4 text-[color:var(--text-secondary)]">
            {limits.videoEnabled ? "MP4, MOV or WebM video; PNG, JPEG, WebP, HEIC photos; PDF." : "PNG, JPEG, WebP, HEIC photos; PDF."}
            {limits.maxFileBytes !== null ? ` Up to ${formatMb(limits.maxFileBytes)} each.` : ""}
            {roomLeft !== null ? ` Room for ${roomLeft} more.` : ""}
          </p>
          <FileUploadButton ariaLabel="Choose files to add" accept={FILE_ACCEPT} multiple disabled={busy || roomLeft === 0} onFiles={(files) => void upload(files)} className="btn-primary mt-4 min-h-10 items-center justify-center !px-4 text-sm">
            {busy ? "Uploading…" : "Choose files"}
          </FileUploadButton>
        </div>
        {progress ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-[color:var(--text-secondary)]">
              <span className="truncate pr-2">{progress.current}</span>
              <span className="shrink-0">{Math.min(progress.done + 1, progress.total)} of {progress.total}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--bg-surface-soft)]">
              <div className="h-full bg-[color:var(--accent)] transition-[width]" style={{ width: `${Math.round(((progress.done + progress.fraction) / progress.total) * 100)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">Large videos upload in pieces and resume if your connection drops. Keep this page open.</p>
          </div>
        ) : null}
        {error ? <p className="mt-3 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">{error}</p> : null}
        {notice ? <p className="mt-3 rounded-lg border border-[color:var(--accent)]/40 bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-3 py-2 text-xs">{notice}</p> : null}
        <p className="mt-3 text-[11px] leading-4 text-[color:var(--text-secondary)]">These go to the team building {projectName}. Changes to a live site still go through Requests.</p>
      </Panel>

      <Panel className="lg:col-span-8" title={`Your files${assets.length ? ` · ${assets.length}` : ""}`}>
        {assets.length === 0 ? (
          <p className="text-sm text-[color:var(--text-secondary)]">Nothing here yet. Anything you add during onboarding shows up here too.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {assets.map((asset) => (
              <FileTile key={asset.id} asset={asset} canManage={canManage} onRemove={() => remove(asset)} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function FileTile({ asset, canManage, onRemove }: { asset: SignedAsset; canManage: boolean; onRemove: () => void }) {
  const [caption, setCaption] = useState(asset.caption ?? "");
  const image = asset.content_type.startsWith("image/");
  const video = isVideo(asset.content_type);
  return (
    <li className="relative overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)]">
      <a href={asset.url ?? "#"} target="_blank" rel="noreferrer" className="flex aspect-square items-center justify-center overflow-hidden">
        {image && asset.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed or local object URL
          <img src={asset.url} alt={asset.caption ?? asset.file_name} className="h-full w-full object-cover" />
        ) : video && asset.url ? (
          <video src={asset.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 px-2 text-center text-[10px] font-semibold uppercase text-[color:var(--text-secondary)]">
            {video ? <Film className="h-5 w-5" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
            {asset.content_type === "application/pdf" ? "PDF" : asset.file_name.split(".").pop()}
          </span>
        )}
      </a>
      {video ? <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">Video</span> : null}
      {canManage ? (
        <button type="button" aria-label={`Remove ${asset.file_name}`} onClick={onRemove} className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <input
        aria-label={`Caption for ${asset.file_name}`}
        value={caption}
        placeholder={asset.file_name}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={() => { if ((asset.caption ?? "") !== caption) void updateAssetCaption(asset.id, caption); }}
        className="w-full border-t border-[color:var(--border)] bg-transparent px-2 py-1.5 text-[11px] focus:outline-none"
        maxLength={200}
      />
      <p className="truncate px-2 pb-1.5 text-[10px] text-[color:var(--text-secondary)]" title={asset.file_name}>{asset.file_name} · {formatBytes(asset.size_bytes)}</p>
    </li>
  );
}
