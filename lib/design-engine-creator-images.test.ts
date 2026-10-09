import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import manifest from "../public/design-engine-creators/manifest.json";
import { creatorImagePackages } from "../design-engine/preview/creator-image-packages";
import { adaptSectionExample, adaptationDataPatch } from "../design-engine/preview/client-adaptations";
import { makeSection } from "../design-engine/preview/composition/fixtures";

describe("Creator photo package delivery", () => {
  it("ships all seven roles in all four sets with accurate full-size and thumbnail dimensions", async () => {
    expect(manifest.assets).toHaveLength(28);
    for (const pack of creatorImagePackages) {
      expect(manifest.assets.filter(asset => asset.set === pack.set).map(asset => asset.role).sort())
        .toEqual(["coffee", "drive", "gym", "hero", "objects", "pov", "product"]);
    }
    for (const asset of manifest.assets) {
      const bytes = await readFile(`public${asset.src}`);
      const metadata = await sharp(bytes).metadata();
      expect([metadata.width, metadata.height]).toEqual([asset.width, asset.height]);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      const thumb = await sharp(await readFile(`public${asset.thumbnail.src}`)).metadata();
      expect([thumb.width, thumb.height]).toEqual([asset.thumbnail.width, asset.thumbnail.height]);
      expect(thumb.width).toBe(240);
      expect(asset.alt).toContain("AI-generated");
      await readFile(`public/design-engine-creators/${asset.id}-640.webp`);
    }
  });

  it.each(creatorImagePackages)("$id replaces embedded gallery imagery and optional films with photos from the selected set", pack => {
    const section = adaptSectionExample(makeSection("work.media-cabinet", "work"), pack.id);
    const serialized = JSON.stringify(section.content);
    expect(serialized).not.toMatch(/design-engine-study|\.mp4|"kind":"video"/);
    for (const role of ["hero", "product", "pov", "objects", "gym", "coffee", "drive"]) expect(serialized).toContain(`${pack.set}-${role}`);
  });

  it.each(creatorImagePackages)("$id keeps comparison views registered and removes stale responsive sources", pack => {
    const section = adaptSectionExample(makeSection("hero.comparison", "opening"), pack.id);
    if (section.component !== "hero.comparison") throw Error("Wrong component");
    expect(section.media.before.width / section.media.before.height).toBe(section.media.after.width / section.media.after.height);
    expect(section.media.before.src).not.toBe(section.media.after.src);
    expect(JSON.stringify(section.media)).not.toContain("design-engine-study");
    expect(adaptationDataPatch(section, pack.id)).not.toHaveProperty("treatment");
    expect(adaptationDataPatch(section, pack.id)).not.toHaveProperty("structure");
  });
});
