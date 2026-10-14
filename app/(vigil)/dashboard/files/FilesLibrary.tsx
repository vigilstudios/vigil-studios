"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Film, Image as ImageIcon, FolderOpen, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { recordProjectFiles } from "@/lib/vigil/actions/files";
import { removeProjectAsset, updateAssetCaption } from "@/lib/vigil/actions/onboarding";
import { formatBytes } from "@/lib/vigil/attachments";
import { FILE_ACCEPT, filePath, formatMb, isVideo, validateFileBatch, type FileLimits, type FileUsage, FILE_FILTERS, filterFiles, type FileFilter } from "@/lib/vigil/files";
import { PROJECT_ASSETS_BUCKET } from "@/lib/vigil/onboarding/assets";
import { fileUploadError } from "@/lib/vigil/file-upload-error";
import "./files.css";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { FileUploadButton } from "@/components/vigil/FileUploadButton";
import { Panel } from "@/components/vigil/widgets";
import { AssetPreviewImage } from "@/components/vigil/AssetPreviewImage";

type Progress = { done: number; total: number; current: string; fraction: number; phase: "preparing" | "uploading" | "saving" };

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
  const [filter, setFilter] = useState<FileFilter>('all');
  const uploadPanel = useRef<HTMLElement>(null), uploadLock = useRef(false);
  // Measure against the dashboard's scroll viewport: the panel grows as it sticks,
  // while always retaining 24px of clearance above the viewport's bottom edge.
  useEffect(() => {
    const panel = uploadPanel.current;
    if (!panel) return;
    const scroller = panel.closest('main'), viewport = scroller ?? window;
    const desktop = window.matchMedia('(min-width: 1024px)');
    let frame = 0;
    const measure = () => {
      if (!desktop.matches) { panel.style.removeProperty('--files-upload-height'); return; }
      const bottom = Math.min(window.innerHeight, scroller?.getBoundingClientRect().bottom ?? window.innerHeight);
      panel.style.setProperty('--files-upload-height', `${Math.max(0, bottom - panel.getBoundingClientRect().top - 24)}px`);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    if (scroller) observer.observe(scroller);
    measure(); viewport.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule); desktop.addEventListener('change', schedule);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); viewport.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); desktop.removeEventListener('change', schedule); };
  }, []);

  const upload = async (picked: File[]) => {
    if (uploadLock.current) return;
    setError(null); setNotice(null);
    const files = picked.filter(Boolean);
    if (!files.length) return;
    const problems = validateFileBatch(files, limits, usage);
    if (problems.length) { setError(problems.map(p => p.name === '*' ? p.reason : `${p.name}: ${p.reason}`).join(' ')); return; }
    uploadLock.current = true;
    setProgress({ done: 0, total: files.length, current: files[0].name, fraction: 0, phase: 'preparing' });
    const failures: { name: string; reason: string }[] = [];
    try {
      const supabase = createClient();
      const { uploadToBucket } = await import('@/lib/vigil/storage-upload');
      const { sha256Blob } = await import('@/lib/vigil/checksum');
      const uploaded: { path: string; name: string; type: string; size: number; checksum: string | null }[] = [];
      for (const file of files) {
        const path = filePath(organizationId, projectId, file.type, crypto.randomUUID());
        setProgress(p => p ? { ...p, current: file.name, fraction: 0, phase: 'preparing' } : p);
        try {
          const checksum = await sha256Blob(file).catch(() => null);
          setProgress(p => p ? { ...p, phase: 'uploading' } : p);
          await uploadToBucket(supabase, PROJECT_ASSETS_BUCKET, path, file, fraction => setProgress(p => p ? { ...p, fraction } : p));
          uploaded.push({ path, name: file.name, type: file.type, size: file.size, checksum });
        } catch (failure) { failures.push({ name: file.name, reason: fileUploadError(failure) }); }
        setProgress(p => p ? { ...p, done: p.done + 1, fraction: 0 } : p);
      }
      if (uploaded.length) {
        setProgress(p => p ? { ...p, phase: 'saving' } : p);
        const result = await recordProjectFiles(projectId, uploaded);
        if (result.ok) {
          failures.push(...result.data.failed.map(name => ({ name, reason: 'The file uploaded but could not be added to your library. Check your available room and retry.' })));
          const recorded = result.data.recorded.map(row => {
            const item = uploaded.find(file => file.path === row.path)!;
            const original = files.find(file => file.name === item.name);
            return { id: row.id, kind: row.kind, file_name: item.name, content_type: item.type, size_bytes: item.size, caption: null, url: original ? URL.createObjectURL(original) : null, object_path: row.path } satisfies SignedAsset;
          });
          setAssets(current => [...current, ...recorded]);
          setUsage(current => ({ count: current.count + recorded.length, bytes: current.bytes + recorded.reduce((bytes, asset) => bytes + asset.size_bytes, 0) }));
          if (recorded.length) setNotice(`${recorded.length} file${recorded.length === 1 ? '' : 's'} added. The Vigil team has been told.`);
        } else failures.push(...uploaded.map(file => ({ name: file.name, reason: result.error })));
      }
    } catch (failure) { failures.push({ name: '*', reason: fileUploadError(failure) }); }
    finally {
      if (failures.length) setError(failures.map(failure => failure.name === '*' ? failure.reason : `${failure.name}: ${failure.reason}`).join(' '));
      uploadLock.current = false; setProgress(null); router.refresh();
    }
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
  const shown = filterFiles(assets, filter);
  const roomLeft = limits.maxCount !== null ? Math.max(0, limits.maxCount - usage.count) : null;

  return (
    <div className="files-library-grid">
      <aside ref={uploadPanel} className="files-upload-column" aria-label="Add files">
      <Panel className="files-upload-panel" title="Add files">
        <div
          onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(Array.from(e.dataTransfer.files)); }}
          className={`files-drop-zone flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${dragging ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-[color:var(--border)]"}`}
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
              <span className="truncate pr-2">{progress.phase === "preparing" ? "Preparing: " : progress.phase === "saving" ? "Adding to your library: " : "Uploading: "}{progress.current}</span>
              <span className="shrink-0">{Math.min(progress.done + 1, progress.total)} of {progress.total}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--bg-surface-soft)]">
              <div className="h-full bg-[color:var(--accent)] transition-[width]" style={{ width: `${Math.round(((progress.done + progress.fraction) / progress.total) * 100)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">Large videos upload in pieces and resume if your connection drops. Keep this page open.</p>
          </div>
        ) : null}
        {error ? <p role="alert" className="mt-3 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">{error}</p> : null}
        {notice ? <p role="status" className="mt-3 rounded-lg border border-[color:var(--accent)]/40 bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-3 py-2 text-xs">{notice}</p> : null}
        <p className="mt-3 text-[11px] leading-4 text-[color:var(--text-secondary)]">These go to the team building {projectName}. Changes to a live site still go through Requests.</p>
      </Panel>
      </aside>

      <Panel className="files-results-panel" title={`Your files${assets.length ? ` · ${assets.length}` : ""}`}>
        <div className="files-media-filters" role="group" aria-label="Filter files by media type">
          {FILE_FILTERS.map(value => { const count = filterFiles(assets, value).length, Icon = value === 'images' ? ImageIcon : value === 'videos' ? Film : value === 'documents' ? FileText : FolderOpen; return <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}><Icon size={15} aria-hidden/>{({all:'All files',images:'Images',videos:'Videos',documents:'Documents',other:'Other'})[value]}<span>{count}</span></button>; })}
        </div>
        <p className="files-filter-summary" role="status">Showing {shown.length} of {assets.length} files</p>
        {assets.length === 0 ? (
          <p className="text-sm text-[color:var(--text-secondary)]">Nothing here yet. Anything you add during onboarding shows up here too.</p>
        ) : shown.length === 0 ? <div className="files-filter-empty"><p>{filter === 'other' ? 'No other file types in your library yet.' : `No ${filter} in your library yet.`}</p><button type="button" onClick={() => setFilter('all')} className="btn-secondary">Show all files</button></div> : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {shown.map((asset) => (
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
          <AssetPreviewImage src={asset.url} alt={asset.caption ?? asset.file_name} className="h-full w-full object-cover" />
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
