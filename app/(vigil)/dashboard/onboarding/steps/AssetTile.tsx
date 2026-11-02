"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AssetPreviewImage } from "@/components/vigil/AssetPreviewImage";
import { updateAssetCaption } from "@/lib/vigil/actions/onboarding";
import { formatBytes } from "@/lib/vigil/attachments";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";

export function AssetTile({ asset, onRemove, captionable }: { asset: SignedAsset; onRemove: () => void; captionable?: boolean }) {
  const [caption, setCaption] = useState(asset.caption ?? "");
  const isImage = asset.content_type.startsWith("image/");
  return (
    <li className="relative w-full overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)]">
      <div className="flex aspect-square items-center justify-center overflow-hidden">
        {isImage && asset.url ? (
          <AssetPreviewImage src={asset.url} alt={asset.caption ?? asset.file_name} className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-[10px] font-semibold uppercase text-[color:var(--text-secondary)]">{asset.content_type === "application/pdf" ? "PDF" : asset.file_name.split(".").pop()}</span>
        )}
      </div>
      <button type="button" aria-label={`Remove ${asset.file_name}`} onClick={onRemove} className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {captionable ? (
        <input
          aria-label={`Caption for ${asset.file_name}`}
          value={caption}
          placeholder="Caption"
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => { if ((asset.caption ?? "") !== caption) void updateAssetCaption(asset.id, caption); }}
          className="w-full border-t border-[color:var(--border)] bg-transparent px-2 py-1.5 text-[11px] focus:outline-none"
          maxLength={200}
        />
      ) : (
        <p className="truncate px-2 py-1.5 text-[11px] text-[color:var(--text-secondary)]" title={asset.file_name}>{asset.file_name} · {formatBytes(asset.size_bytes)}</p>
      )}
    </li>
  );
}
