"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Upload, Fingerprint, Palette, Images, LayoutTemplate, Globe2, Paintbrush } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { recordProjectAssets, removeProjectAsset } from "@/lib/vigil/actions/onboarding";
import { brandSchema, logoCompletionIssue, type Brand, type ProjectKind } from "@/lib/vigil/onboarding/brief";
import { assetPath, IMAGE_ACCEPT, LOGO_ACCEPT, MAX_PHOTOS, PROJECT_ASSETS_BUCKET, validateAssets, type AssetKind } from "@/lib/vigil/onboarding/assets";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { FileUploadButton } from "@/components/vigil/FileUploadButton";
import { TeamFields } from "./TeamFields";
import { AssetTile } from "./AssetTile";
import { OnboardingSection, ChoiceCards, Field, StepFooter, TextArea, TextInput, useAutosave, VirtueAside, type SaveState } from "../wizard-ui";

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
  const hasLogo = assets.some((asset) => asset.kind === "logo");
  const [data, setData] = useState<Brand>(() => {
    const brand = initial ?? brandSchema.parse({});
    const mode = brand.logo.mode ?? (hasLogo ? "upload" : "vigil");
    return { ...brand, logo: { ...brand.logo, mode }, colours: { ...brand.colours, mode: (!hasLogo || mode !== "upload") && brand.colours.mode === "logo" ? "vigil" : brand.colours.mode } };
  });
  const logoMode = data.logo.mode ?? (hasLogo ? "upload" : "vigil");
  const canUseLogoColours = hasLogo && logoMode === "upload";
  // Only a selected, uploaded logo can provide the website's colours.
  if (!canUseLogoColours && data.colours.mode === "logo") {
    setData({ ...data, colours: { ...data.colours, mode: "vigil" } });
  }
  const [logoError, setLogoError] = useState<string | null>(null);
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<UploadState>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { state, flush } = useAutosave(data, (v) => save(v));
  useEffect(() => onSaveState(state), [state, onSaveState]);

  const logos = assets.filter((a) => a.kind === "logo");
  const photos = assets.filter((a) => a.kind === "photo");
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
    const { sha256Blob } = await import("@/lib/vigil/checksum");
    const uploaded: { path: string; name: string; type: string; size: number; checksum: string | null }[] = [];
    const failed: string[] = [];
    for (const file of files) {
      const path = assetPath(organizationId, projectId, file.type, crypto.randomUUID());
      const checksum = await sha256Blob(file).catch(() => null);
      const { error } = await supabase.storage.from(PROJECT_ASSETS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) failed.push(file.name);
      else uploaded.push({ path, name: file.name, type: file.type, size: file.size, checksum });
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    if (uploaded.length > 0) {
      const res = await recordProjectAssets(projectId, kind, uploaded);
      if (res.ok) {
        if (kind === "logo" && res.data.recorded.length > 0) setLogoError(null);
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
    if (failed.length > 0) setUploadError(`These did not upload: ${failed.join(", ")}. Try again, or add them later from Files in your dashboard.`);
    setUploading(null);
  };

  const remove = async (asset: SignedAsset) => {
    const res = await removeProjectAsset(asset.id);
    if (!res.ok) setUploadError(res.error);
    else onAssets(assets.filter((a) => a.id !== asset.id));
  };

  const continueNext = async () => {
    const logoIssue = logoCompletionIssue({ ...data.logo, mode: logoMode }, hasLogo);
    if (logoIssue) { setLogoError(logoIssue); document.getElementById(logoMode === "upload" ? "logoUpload" : "logoWordmark")?.focus(); return; }
    setLogoError(null);
    if (data.team.enabled && (!data.team.members.length || data.team.members.some(member => !member.name.trim()))) { setTeamError("Add a name for each team member, or turn off Showcase my team to skip this section."); return; }
    setTeamError(null);
    setBusy(true);
    const ok = await flush();
    const done = ok && (await save(data, true));
    setBusy(false);
    if (done) onNext();
  };

  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setData((d) => ({ ...d, [k]: v }));

  return (
    <fieldset disabled={teamBusy || Boolean(uploading) || busy} className="min-w-0 space-y-6">
      {/* Logo */}
      <OnboardingSection icon={Fingerprint} title="Logo" description="Use an existing logo, tell us your wordmark text, or let Vigil suggest one." optional>
        <ChoiceCards name="Logo choice" value={logoMode} onChange={mode => { set("logo", { ...data.logo, mode }); setLogoError(null); }} options={[
          { value: "upload", label: "Upload a logo", hint: "Use a logo you already have." },
          { value: "wordmark", label: "Type a wordmark", hint: "Your name, styled as a text logo." },
          { value: "vigil", label: "Let Vigil propose one", hint: "We will suggest a simple wordmark." },
        ]} />
        {logoMode === "upload" ? <div id="logoUpload" tabIndex={-1} className="space-y-3 outline-none">
        {logoError && <p role="alert" className="text-sm text-[color:var(--status-bad)]">{logoError}</p>}
        {logos.length > 0 ? (
          <ul className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {logos.map((a) => (
              <AssetTile key={a.id} asset={a} onRemove={() => remove(a)} />
            ))}
          </ul>
        ) : null}
        <FileUploadButton ariaLabel="Upload your logo" accept={LOGO_ACCEPT} disabled={Boolean(uploading)} onFiles={(files) => void upload(files, "logo")} className="min-h-11 items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)]">
          <Upload className="h-4 w-4" /> {logos.length ? "Add another version" : "Upload your logo"} <span className="opacity-70">· PNG, SVG, JPEG or PDF</span>
        </FileUploadButton>
        </div> : logoMode === "wordmark" ? <Field id="logoWordmark" label="Wordmark text" hint="Enter the exact spelling and capitalisation you want in your logo." error={logoError}>
          <TextInput id="logoWordmark" value={data.logo.wordmark} onChange={event => { set("logo", { ...data.logo, wordmark: event.target.value }); setLogoError(null); }} maxLength={160} placeholder="e.g. Northline Studio" aria-describedby="logoWordmark-hint" aria-invalid={Boolean(logoError)} />
        </Field> : <p className="text-[13px] leading-5 text-[color:var(--text-secondary)]">We will propose a simple wordmark for you to review with your website design.</p>}
      </OnboardingSection>

      {/* Colours */}
      <OnboardingSection icon={Palette} title="Brand colours" description="Choose a direction for your website's palette.">
        <ChoiceCards
          name="Brand colours"
          value={data.colours.mode}
          onChange={(mode) => set("colours", { ...data.colours, mode })}
          options={[
            { value: "logo", label: "Use my logo's colours", hint: canUseLogoColours ? "The team matches the site to the logo." : hasLogo ? "Select Upload a logo to use its colours." : "Upload a logo first to use its colours.", disabled: !canUseLogoColours },
            { value: "pick", label: "I'll pick", hint: "Choose one or two colours below." },
            { value: "vigil", label: "Let Vigil choose", hint: "Trust the team's judgement." },
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
      </OnboardingSection>

      {/* Photos */}
      <OnboardingSection icon={Images} title="Photos" description={`The place, the people, the work. Add up to ${MAX_PHOTOS} photos; phone photos are fine. You can add videos and more images in Files later.`} optional>
        {photos.length > 0 ? (
          <ul className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((a) => (
              <AssetTile key={a.id} asset={a} onRemove={() => remove(a)} captionable />
            ))}
          </ul>
        ) : null}
        <FileUploadButton ariaLabel="Add photos" accept={IMAGE_ACCEPT} multiple disabled={Boolean(uploading)} onFiles={(files) => void upload(files, "photo")} className="min-h-11 items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)]">
          <ImagePlus className="h-4 w-4" /> {uploading?.kind === "photo" ? `Uploading ${Math.min(uploading.done + 1, uploading.total)} of ${uploading.total}…` : "Add photos"}
        </FileUploadButton>
      </OnboardingSection>

      <TeamFields value={data.team} onChange={team => set("team", team)} projectId={projectId} organizationId={organizationId} assets={assets} onAssets={onAssets} disabled={teamBusy || Boolean(uploading) || busy} onBusy={setTeamBusy} />
      {teamError && <p role="alert" className="text-xs text-[color:var(--status-bad)]">{teamError}</p>}

      {projectKind !== "express" ? (
        <OnboardingSection icon={LayoutTemplate} title="Layouts, sketches and inspiration" description="Share screenshots, mood boards, rough wireframes or PDFs. These guide your design; bespoke components need a separately agreed scope." optional>
          {inspiration.length > 0 ? (
            <ul className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {inspiration.map((asset) => <AssetTile key={asset.id} asset={asset} onRemove={() => remove(asset)} captionable />)}
            </ul>
          ) : null}
          <FileUploadButton ariaLabel="Add inspiration files" accept="application/pdf,image/png,image/jpeg,image/webp,image/gif" multiple disabled={Boolean(uploading)} onFiles={(files) => void upload(files, "other")} className="min-h-11 items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)]"><Upload className="h-4 w-4" /> Add inspiration files</FileUploadButton>
        </OnboardingSection>
      ) : null}

      {uploadError ? <p role="alert" className="text-xs text-[color:var(--status-bad)]">{uploadError}</p> : null}
      {uploading ? <VirtueAside state="working">Uploading {uploading.done} of {uploading.total}… files go straight to your private storage.</VirtueAside> : null}

      {/* Social */}
      <OnboardingSection icon={Globe2} title="Where else are you online?" description="Connect your website with the profiles and listings customers already know." optional>
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
      </OnboardingSection>

      <OnboardingSection icon={Paintbrush} title="Design preferences" description="Tell us what feels right for your business and anything we should avoid." optional>
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

      </OnboardingSection>

      <StepFooter onBack={onBack} onNext={continueNext} busy={busy || Boolean(uploading) || teamBusy} />
    </fieldset>
  );
}
