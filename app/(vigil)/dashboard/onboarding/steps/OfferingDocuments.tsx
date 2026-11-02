"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { FileUploadButton } from "@/components/vigil/FileUploadButton";
import { createClient } from "@/lib/supabase/browser";
import { getOnboardingAssets, recordProjectAssets, removeProjectAsset } from "@/lib/vigil/actions/onboarding";
import { assetPath, PROJECT_ASSETS_BUCKET, validateAssets } from "@/lib/vigil/onboarding/assets";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { OnboardingSection } from "../wizard-ui";
import { AssetTile } from "./AssetTile";

type Props = {
  projectId: string;
  organizationId: string;
  assets: SignedAsset[];
  onAssets: (assets: SignedAsset[]) => void;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
};

/** Documents keep their existing Files identities when moving between intake steps. */
export function OfferingDocuments({ projectId, organizationId, assets, onAssets, disabled, onBusy }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const documents = assets.filter(asset => asset.kind === "document");

  async function upload(files: File[]) {
    setError(null);
    const problems = validateAssets(files, "document");
    if (problems.length) { setError(problems.map(problem => `${problem.name}: ${problem.reason}`).join(" ")); return; }
    setUploading(true);
    onBusy(true);
    try {
      const supabase = createClient();
      const { sha256Blob } = await import("@/lib/vigil/checksum");
      const uploaded: { path: string; name: string; type: string; size: number; checksum: string | null }[] = [];
      const failed: string[] = [];
      for (const file of files) {
        const path = assetPath(organizationId, projectId, file.type, crypto.randomUUID());
        const checksum = await sha256Blob(file).catch(() => null);
        const result = await supabase.storage.from(PROJECT_ASSETS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (result.error) failed.push(file.name);
        else uploaded.push({ path, name: file.name, type: file.type, size: file.size, checksum });
      }
      if (uploaded.length) {
        const result = await recordProjectAssets(projectId, "document", uploaded);
        if (!result.ok) throw new Error(result.error);
        failed.push(...result.data.failed);
        const library = await getOnboardingAssets(projectId);
        if (!library.ok) throw new Error("Your documents were saved to Files, but the list could not reload. Refresh to see them.");
        onAssets(library.data);
      }
      if (failed.length) setError(`These files did not upload: ${failed.join(", ")}. Please try again.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your documents could not upload. Please try again.");
    } finally {
      setUploading(false);
      onBusy(false);
    }
  }

  async function remove(asset: SignedAsset) {
    setError(null);
    onBusy(true);
    try {
      const result = await removeProjectAsset(asset.id);
      if (!result.ok) throw new Error(result.error);
      onAssets(assets.filter(item => item.id !== asset.id));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your file could not be removed. Please try again.");
    } finally { onBusy(false); }
  }

  return (
    <OnboardingSection icon={FileText} title="Menus, price lists and brochures" description="Already have a document that explains what you offer? Upload it here. Your files stay in your workspace's Files library." optional>
      {documents.length > 0 && <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{documents.map(asset => <AssetTile key={asset.id} asset={asset} onRemove={() => void remove(asset)} />)}</ul>}
      <FileUploadButton ariaLabel="Upload menus, price lists or brochures" accept="application/pdf,image/png,image/jpeg,image/webp" multiple disabled={disabled} onFiles={files => void upload(files)} className="min-h-11 items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 text-[13px] hover:border-[color:var(--accent)]">
        <Upload aria-hidden="true" className="h-4 w-4" />{uploading ? "Uploading documents…" : "Upload a menu or brochure"}
      </FileUploadButton>
      <p className="text-[13px] leading-5 text-[color:var(--text-secondary)]">PDF, PNG, JPEG or WebP, up to 20 MB per file.</p>
      {error && <p role="alert" className="text-sm text-[color:var(--status-bad)]">{error}</p>}
    </OnboardingSection>
  );
}
