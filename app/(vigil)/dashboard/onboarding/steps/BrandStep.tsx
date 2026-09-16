"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { recordProjectAssets, removeProjectAsset, updateAssetCaption } from "@/lib/vigil/actions/onboarding";
import { brandSchema, type Brand, type ProjectKind } from "@/lib/vigil/onboarding/brief";
import { assetPath, IMAGE_ACCEPT, LOGO_ACCEPT, MAX_PHOTOS, PROJECT_ASSETS_BUCKET, validateAssets, type AssetKind } from "@/lib/vigil/onboarding/assets";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { formatBytes } from "@/lib/vigil/attachments";
import { ChoiceCards, Field, StepFooter, TextArea, TextInput, useAutosave, VirtueAside, type SaveState } from "../wizard-ui";

type Props = {
  initial: Brand | undefined;
  projectKind: ProjectKind;
  projectId: string;
  organizationId: string;
  assets: SignedAsset[];
  onAssets: (a: SignedAsset[]) => void;
  save: (data: Brand, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};

type UploadState = { kind: AssetKind; done: number; total: number } | null;

export function BrandStep({ initial, projectKind, projectId, organizationId, assets, onAssets, save, onSaveState, onBack, onNext }: Props) {
  const [data, setData] = useState<Brand>(() => initial ?? brandSchema.parse({}));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<UploadState>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const inspirationInput = useRef<HTMLInputElement | null>(null);
  const { state, flush } = useAutosave(data, (v) => save(v));
  useEffect(() => onSaveState(state), [state, onSaveState]);

  const logos = assets.filter((a) => a.kind === "logo");
  const photos = assets.filter((a) => a.kind === "photo");
  const documents = assets.filter((a) => a.kind === "document");
  const inspiration = assets.filter((a) => a.kind === "other");

  /** Browser-direct upload to Storage, then record the rows. */
  const upload = async (files: File[], kind: AssetKind) => {
    setUploadError(null);
    const problems = validateAssets(files, kind, kind === "photo" ? photos.length : 0);
    if (problems.length > 0) {
      setUploadError(problems.map((p) => (p.name === "*" ? p.reason : `${p.name}: ${p.reason}`)).join(" "));
      return;
    }
    setUploading({ kind, done: 0, total: files.length });
    const supabase = createClient();
    const uploaded: { path: string; name: string; type: string; size: number }[] = [];
    const failed: string[] = [];
    for (const file of files) {
      const path = assetPath(organizationId, projectId, file.type, crypto.randomUUID());
      const { error } = await supabase.storage.from(PROJECT_ASSETS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) failed.push(file.name);
      else uploaded.push({ path, name: file.name, type: file.type, size: file.size });
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    if (uploaded.length > 0) {
      const res = await recordProjectAssets(projectId, kind, uploaded);
      if (res.ok) {
        failed.push(...res.data.failed);
        // Local object URLs until the page reloads with signed ones.
        const recorded = res.data.recorded.map((r) => {
          const u = uploaded.find((x) => x.path === r.path)!;
          const f = files.find((x) => x.name === u.name);
          return { id: r.id, kind, file_name: u.name, content_type: u.type, size_bytes: u.size, caption: null, url: f ? URL.createObjectURL(f) : null, object_path: r.path } satisfies SignedAsset;
        });
        onAssets([...assets, ...recorded]);
      } else {
        failed.push(...uploaded.map((u) => u.name));
      }
    }
    if (failed.length > 0) setUploadError(`These did not upload: ${failed.join(", ")}. Try again, or send them later from Requests.`);
    setUploading(null);
  };

  const remove = async (asset: SignedAsset) => {
    onAssets(assets.filter((a) => a.id !== asset.id));
    const res = await removeProjectAsset(asset.id);
    if (!res.ok) setUploadError(res.error);
  };

  const continueNext = async () => {
    setBusy(true);
    const ok = await flush();
    const done = ok && (await save(data, true));
    setBusy(false);
    if (done) onNext();
  };

  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setData((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-6">
      {/* Logo */}
      <section>
        <p className="mb-1 text-xs font-medium text-[color:var(--text-secondary)]">Logo <span className="font-normal opacity-70">(optional)</span></p>
        {logos.length > 0 ? (
          <ul className="mb-2 flex flex-wrap gap-2">
            {logos.map((a) => (
              <AssetTile key={a.id} asset={a} onRemove={() => remove(a)} />
            ))}
          </ul>
        ) : null}
        <input ref={logoInput} type="file" accept={LOGO_ACCEPT} className="sr-only" onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; if (f.length) void upload(f, "logo"); }} />
        <button type="button" onClick={() => logoInput.current?.click()} disabled={Boolean(uploading)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)] disabled:opacity-60">
          <Upload className="h-4 w-4" /> {logos.length ? "Add another version" : "Upload your logo"} <span className="opacity-70">· PNG, SVG, JPEG or PDF</span>
        </button>
        {logos.length === 0 ? <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">No logo yet? Skip this; the team can propose a simple wordmark.</p> : null}
      </section>

      {/* Colours */}
      <section>
        <p className="mb-2 text-xs font-medium text-[color:var(--text-secondary)]">Brand colours</p>
        <ChoiceCards
          name="Brand colours"
          value={data.colours.mode}
          onChange={(mode) => set("colours", { ...data.colours, mode })}
          options={[
            { value: "logo", label: "Use my logo's colours", hint: "The team matches the site to the logo." },
            { value: "pick", label: "I'll pick", hint: "Choose one or two colours below." },
            { value: "vigil", label: "You choose", hint: "Trust the team's judgement." },
          ]}
        />
        {data.colours.mode === "pick" ? (
          <div className="mt-3 flex flex-wrap gap-4">
            {(["primary", "secondary"] as const).map((k) => (
              <label key={k} className="flex min-h-11 items-center gap-2 text-[13px]">
                <input type="color" aria-label={`${k} colour`} value={data.colours[k] || "#10d45a"} onChange={(e) => set("colours", { ...data.colours, [k]: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[color:var(--border)] bg-transparent" />
                <span className="capitalize">{k}</span>
                {data.colours[k] ? <code className="text-[11px] text-[color:var(--text-secondary)]">{data.colours[k]}</code> : null}
              </label>
            ))}
          </div>
        ) : null}
      </section>

      {/* Photos */}
      <section>
        <p className="mb-1 text-xs font-medium text-[color:var(--text-secondary)]">Photos <span className="font-normal opacity-70">(optional · up to {MAX_PHOTOS})</span></p>
        <p className="mb-2 text-[11px] text-[color:var(--text-secondary)]">The place, the people, the work. Phone photos are fine. Add a caption if it helps.</p>
        {photos.length > 0 ? (
          <ul className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((a) => (
              <AssetTile key={a.id} asset={a} onRemove={() => remove(a)} captionable />
            ))}
          </ul>
        ) : null}
        <input ref={photoInput} type="file" multiple accept={IMAGE_ACCEPT} className="sr-only" onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; if (f.length) void upload(f, "photo"); }} />
        <button type="button" onClick={() => photoInput.current?.click()} disabled={Boolean(uploading)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)] disabled:opacity-60">
          <ImagePlus className="h-4 w-4" /> {uploading?.kind === "photo" ? `Uploading ${Math.min(uploading.done + 1, uploading.total)} of ${uploading.total}…` : "Add photos"}
        </button>
      </section>

      {/* Documents */}
      <section>
        <p className="mb-1 text-xs font-medium text-[color:var(--text-secondary)]">Menus, price lists, brochures <span className="font-normal opacity-70">(optional)</span></p>
        {documents.length > 0 ? (
          <ul className="mb-2 flex flex-wrap gap-2">
            {documents.map((a) => (
              <AssetTile key={a.id} asset={a} onRemove={() => remove(a)} />
            ))}
          </ul>
        ) : null}
        <label className="relative inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)]">
          <Upload className="h-4 w-4" /> Upload a file
          <input aria-label="Upload menus, price lists or brochures" type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" disabled={Boolean(uploading)} onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; if (f.length) void upload(f, "document"); }} />
        </label>
      </section>

      {projectKind !== "express" ? (
        <section>
          <p className="mb-1 text-xs font-medium text-[color:var(--text-secondary)]">Layouts, sketches and visual inspiration <span className="font-normal opacity-70">(optional)</span></p>
          <p className="mb-2 text-[11px] text-[color:var(--text-secondary)]">Upload screenshots, mood boards, rough wireframes, PDFs or anything that helps explain the style and layout you have in mind. Add captions to tell us what matters.</p>
          {inspiration.length > 0 ? (
            <ul className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {inspiration.map((asset) => <AssetTile key={asset.id} asset={asset} onRemove={() => remove(asset)} captionable />)}
            </ul>
          ) : null}
          <input ref={inspirationInput} type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) void upload(files, "other"); }} />
          <button type="button" onClick={() => inspirationInput.current?.click()} disabled={Boolean(uploading)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)] disabled:opacity-60"><Upload className="h-4 w-4" /> Add inspiration files</button>
        </section>
      ) : null}

      {uploadError ? <p role="alert" className="text-xs text-[color:var(--status-bad)]">{uploadError}</p> : null}
      {uploading ? <VirtueAside state="working">Uploading {uploading.done} of {uploading.total}… files go straight to your private storage.</VirtueAside> : null}

      {/* Social */}
      <section>
        <p className="mb-2 text-xs font-medium text-[color:var(--text-secondary)]">Where else are you online? <span className="font-normal opacity-70">(optional)</span></p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["instagram", "Instagram", "@yourbusiness or a link"],
              ["facebook", "Facebook", "Page link"],
              ["tiktok", "TikTok", "@yourbusiness"],
              ["google", "Google Business Profile", "Link to your listing"],
              ["yelp", "Yelp", "Link"],
              ["other", "Anything else", "Link"],
            ] as const
          ).map(([k, label, ph]) => (
            <Field key={k} id={`social-${k}`} label={label}>
              <TextInput id={`social-${k}`} value={data.social[k]} placeholder={ph} onChange={(e) => set("social", { ...data.social, [k]: e.target.value })} maxLength={300} className="!min-h-10" />
            </Field>
          ))}
        </div>
      </section>

      {projectKind !== "express" ? (
        <>
          <Field id="brandDirection" label="Describe the style, mood or feeling you want" optional hint="Words are enough: warm and editorial, bold and energetic, quiet luxury, playful, technical, traditional.">
            <TextArea id="brandDirection" rows={4} value={data.direction} onChange={(event) => set("direction", event.target.value)} maxLength={1000} />
          </Field>
          <Field id="brandAvoid" label="Anything you want us to avoid" optional>
            <TextArea id="brandAvoid" rows={3} value={data.avoid} onChange={(event) => set("avoid", event.target.value)} maxLength={600} />
          </Field>
        </>
      ) : null}

      <Field id="brandNotes" label={projectKind === "express" ? "Anything about the look you love or hate" : "Other brand or design notes"} optional hint={projectKind === "express" ? "Sites you admire, colours to avoid, fonts you already use." : undefined}>
        <TextArea id="brandNotes" rows={3} value={data.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} />
      </Field>

      <StepFooter onBack={onBack} onNext={continueNext} busy={busy || Boolean(uploading)} />
    </div>
  );
}

function AssetTile({ asset, onRemove, captionable }: { asset: SignedAsset; onRemove: () => void; captionable?: boolean }) {
  const [caption, setCaption] = useState(asset.caption ?? "");
  const isImage = asset.content_type.startsWith("image/");
  return (
    <li className="relative w-full overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)]">
      <div className="flex aspect-square items-center justify-center overflow-hidden">
        {isImage && asset.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed or local object URL
          <img src={asset.url} alt={asset.caption ?? asset.file_name} className="h-full w-full object-cover" />
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
