"use client";

import { useState } from "react";
import { FolderOpen, ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { getOnboardingAssets, recordProjectAssets } from "@/lib/vigil/actions/onboarding";
import { assetPath, IMAGE_ACCEPT, MAX_PHOTOS, PROJECT_ASSETS_BUCKET, validateAssets } from "@/lib/vigil/onboarding/assets";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { AssetPreviewImage } from "@/components/vigil/AssetPreviewImage";
import { FileUploadButton } from "@/components/vigil/FileUploadButton";

type Props = {
  itemName: string; ids: string[]; onChange: (ids: string[]) => void;
  projectId: string; organizationId: string; assets: SignedAsset[];
  onAssets: (assets: SignedAsset[]) => void; disabled: boolean; onBusy: (busy: boolean) => void;
  maxImages?: number;
};

export function OfferingImages({ itemName, ids, onChange, projectId, organizationId, assets, onAssets, disabled, onBusy, maxImages = MAX_PHOTOS }: Props) {
  const [open, setOpen] = useState(false), [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null), [uploading, setUploading] = useState(false);
  const images = assets.filter(a => IMAGE_ACCEPT.split(",").includes(a.content_type));
  const buttonClass = "inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[color:var(--border)] px-3 text-xs disabled:opacity-50";

  async function refresh() {
    onBusy(true); setError(null);
    try {
      const result = await getOnboardingAssets(projectId);
      if (!result.ok) throw new Error(result.error);
      onAssets(result.data); setOpen(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Your Files could not load. Try again."); }
    finally { onBusy(false); }
  }

  async function upload(files: File[]) {
    setError(null);
    const problems = validateAssets(files, "photo");
    if (files.some(f => !IMAGE_ACCEPT.split(",").includes(f.type))) problems.push({ name: "*", reason: "Choose PNG, JPEG, WebP or GIF images." });
    if (files.length + ids.length > maxImages) problems.push({ name: "*", reason: `Choose up to ${maxImages} image${maxImages === 1 ? "" : "s"} per item.` });
    if (problems.length) { setError(problems.map(p => p.reason).join(" ")); return; }
    onBusy(true); setUploading(true);
    const uploaded: { path: string; name: string; type: string; size: number; checksum: string | null }[] = [];
    const failures: string[] = [];
    try {
      const supabase = createClient();
      const { sha256Blob } = await import("@/lib/vigil/checksum");
      for (const file of files) {
        const path = assetPath(organizationId, projectId, file.type, crypto.randomUUID());
        const checksum = await sha256Blob(file).catch(() => null);
        const result = await supabase.storage.from(PROJECT_ASSETS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (result.error) failures.push(file.name);
        else uploaded.push({ path, name: file.name, type: file.type, size: file.size, checksum });
      }
      if (uploaded.length) {
        const recorded = await recordProjectAssets(projectId, "photo", uploaded);
        if (!recorded.ok) throw new Error(recorded.error);
        failures.push(...recorded.data.failed);
        // Re-sign library URLs rather than retaining browser object URLs.
        const library = await getOnboardingAssets(projectId);
        if (!library.ok) throw new Error("Images were saved to Files, but previews could not reload. Choose from Files to attach them.");
        onAssets(library.data);
        onChange([...new Set([...ids, ...recorded.data.recorded.map(a => a.id)])]);
      }
      if (failures.length) setError(`These images did not upload: ${failures.join(", ")}. Please try again.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Images could not upload. Please try again."); }
    finally { setUploading(false); onBusy(false); }
  }

  return <div className="space-y-2 sm:col-span-3" aria-label={`Images for ${itemName}`}>
    <p className="text-sm font-medium">{maxImages === 1 ? "Photo" : "Images"} <span className="font-normal text-[color:var(--text-secondary)]">(optional · {ids.length}/{maxImages})</span></p>
    {ids.length > 0 && <ul className="flex flex-wrap gap-2">{ids.map((id, index) => {
      const asset = images.find(a => a.id === id);
      return <li key={id} className="relative w-20">
        {asset?.url ? <AssetPreviewImage src={asset.url} alt={asset.file_name} className="h-20 w-20 rounded-lg object-cover" /> : <div className="flex h-20 items-center justify-center rounded-lg border border-[color:var(--border)] text-center text-xs">Image unavailable</div>}
        <button type="button" aria-label={`Remove image ${index + 1} from ${itemName}`} disabled={disabled} onClick={() => onChange(ids.filter(value => value !== id))} className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--bg-primary)]"><X size={14} /></button>
        <p className="mt-1 truncate text-[10px] text-[color:var(--text-secondary)]">{maxImages === 1 ? "Portrait" : index === 0 ? "Cover image" : asset?.file_name ?? "Image"}</p>
      </li>;
    })}</ul>}
    <div className="flex flex-wrap gap-2">
      <FileUploadButton ariaLabel={`Upload images for ${itemName}`} accept={IMAGE_ACCEPT} multiple={maxImages > 1} disabled={disabled || ids.length >= maxImages} className={buttonClass} onFiles={files => void upload(files)}><ImagePlus size={14} />{uploading ? "Uploading…" : maxImages === 1 ? "Upload photo" : "Upload images"}</FileUploadButton>
      <button type="button" className={buttonClass} disabled={disabled} aria-expanded={open} onClick={() => open ? setOpen(false) : void refresh()}><FolderOpen size={14} />Choose from Files</button>
    </div>
    <p className="text-[13px] leading-5 text-[color:var(--text-secondary)]">Uploads are saved in Files. Removing an image here only unlinks it from this item.</p>
    {open && <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-3" aria-label={`Choose images for ${itemName}`}>
      <div className="mb-2 flex gap-2"><input aria-label={`Search images for ${itemName}`} type="search" placeholder="Search your Files" value={search} onChange={e => setSearch(e.target.value)} className="min-h-10 min-w-0 flex-1 rounded-md border border-[color:var(--border)] bg-transparent px-2 text-xs" /><button type="button" onClick={() => setOpen(false)} className="px-2 text-xs">Done</button></div>
      <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">{images.filter(a => a.file_name.toLowerCase().includes(search.toLowerCase())).map(asset => <button key={asset.id} type="button" aria-label={`Use ${asset.file_name}`} aria-pressed={ids.includes(asset.id)} disabled={disabled || !ids.includes(asset.id) && ids.length >= maxImages} onClick={() => onChange(ids.includes(asset.id) ? ids.filter(id => id !== asset.id) : [...ids, asset.id])} className={`min-w-0 rounded-lg border p-1 text-left ${ids.includes(asset.id) ? "border-[color:var(--accent)]" : "border-[color:var(--border)]"}`}>
        {asset.url && <AssetPreviewImage src={asset.url} alt="" className="aspect-square w-full rounded object-cover" />}<span className="block truncate text-[10px]">{ids.includes(asset.id) ? "✓ " : ""}{asset.file_name}</span>
      </button>)}</div>
      {!images.length && <p className="text-xs text-[color:var(--text-secondary)]">No images in this project&apos;s Files yet. Upload images above to get started.</p>}
    </section>}
    {error && <p role="alert" className="text-xs text-[color:var(--status-bad)]">{error}</p>}
  </div>;
}
