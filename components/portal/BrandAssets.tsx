import { FileText, Image, Palette, Type, UploadCloud } from "lucide-react";
import PortalSection from "./PortalSection";

const assets = [
  {
    title: "Logo Files",
    description: "SVG, PNG, or high-resolution transparent logo files.",
    icon: Image,
  },
  {
    title: "Brand Colors",
    description: "Hex codes, color palette, or visual references.",
    icon: Palette,
  },
  {
    title: "Fonts",
    description: "Brand fonts, Google Fonts, Adobe Fonts, or preferred style.",
    icon: Type,
  },
  {
    title: "Brand Guide",
    description: "Optional PDF or document with complete brand rules.",
    icon: FileText,
  },
];

export default function BrandAssets() {
  return (
    <PortalSection
      eyebrow="Brand Assets"
      title="Upload your visual identity."
      description="These assets help us keep your website aligned with your existing brand."
    >
      <div className="mb-6 rounded-[1.5rem] border border-dashed border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent)]">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="font-medium text-[color:var(--text-primary)]">
          Upload area placeholder
        </p>

        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          File uploads will be connected in the Supabase version. For now, this
          section defines exactly what clients need to prepare.
        </p>
      </div>

      <div className="grid gap-3">
        {assets.map((asset) => {
          const Icon = asset.icon;

          return (
            <div
              key={asset.title}
              className="flex gap-4 rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--bg-surface-soft)] text-[color:var(--accent)]">
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-medium text-[color:var(--text-primary)]">
                  {asset.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">
                  {asset.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </PortalSection>
  );
}