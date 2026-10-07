import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  sectionSchemas,
  parseSection,
  type SectionId,
} from "@/design-engine/composition/schemas";
import { renderSection } from "@/design-engine/composition/render";
import { makeSection } from "@/design-engine/preview/composition/fixtures";
import { imageSchema, videoSchema } from "@/design-engine/media/types";
import { editableMedia, patchMediaValue } from "@/design-engine/media/editing";
import { isVideoAsset } from "@/design-engine/media/source";
import { makeComplexSiteFixture } from "@/design-engine/preview/composition/site-fixture";
import {
  serializeSite,
  deserializeSite,
} from "@/design-engine/site/persistence";
const clip = "/design-engine-study-005/selvedge.mp4";
const ids = Object.keys(sectionSchemas) as SectionId[];
describe("video delivery and saved section widths", () => {
  it.each(ids)(
    "accepts and renders video input in every authored media slot of %s",
    (id) => {
      let section = makeSection(id, "media-audit");
      const fields = editableMedia(section).filter(
        (field) => !field.path.includes("poster"),
      );
      for (const field of fields)
        section = patchMediaValue(
          section,
          field.path,
          field.videoRecord
            ? {
                src: clip,
                playback: { loop: true, controls: false, enlarge: true },
              }
            : {
                src: clip,
                mediaType: "video",
                playback: { loop: true, controls: false, enlarge: true },
              },
        );
      const parsed = parseSection(section);
      const html = renderToStaticMarkup(renderSection(parsed));
      expect(html).not.toMatch(/<img[^>]+src="[^\"]+\.mp4/);
      if (
        fields.length &&
        /<(img|video)\b/.test(
          renderToStaticMarkup(renderSection(makeSection(id, "original"))),
        )
      )
        expect(html).toContain("<video");
    },
  );
  it.each(ids)(
    "persists independent edge width without replacing the structural layout of %s",
    (id) => {
      const original = makeSection(id, "width-audit");
      const parsed = parseSection({ ...original, sectionWidth: "edge" });
      expect(parsed.structure).toBe(original.structure);
      if ("layout" in original)
        expect((parsed as typeof original).layout).toBe(original.layout);
      expect(renderToStaticMarkup(renderSection(parsed))).toContain(
        'data-width="edge"',
      );
    },
  );
  it("retains video options and width through portable site save/import", () => {
    const site = makeComplexSiteFixture(),
      source = makeSection("work.image-expansion", "campaign");
    const field = editableMedia(source)[0];
    site.pages[0].sections = [
      parseSection({
        ...patchMediaValue(source, field.path, {
          src: "https://example.com/private-clip?token=public-fixture",
          mediaType: "video",
          playback: {
            loop: true,
            controls: false,
            enlarge: true,
            autoplay: true,
            muted: true,
            poster: "/poster.jpg",
            mobileSrc: "/phone.webm",
          },
        }),
        sectionWidth: "edge",
      }),
    ];
    expect(deserializeSite(serializeSite(site)).pages[0].sections).toEqual(
      site.pages[0].sections,
    );
  });
  it("supports pasted video URLs and explicit extensionless sources without treating images as video", () => {
    expect(
      isVideoAsset({ src: "https://example.com/movie.MP4?signature=test" }),
    ).toBe(true);
    expect(isVideoAsset({ src: "/stream", mediaType: "video" })).toBe(true);
    expect(isVideoAsset({ src: "/image.webp" })).toBe(false);
    expect(isVideoAsset({ src: "/movie.mp4", mediaType: "image" })).toBe(false);
  });
  it("validates playback settings and preserves existing caption requirements", () => {
    const asset = {
      src: clip,
      alt: "Campaign film",
      width: 1280,
      height: 720,
      mediaType: "video",
      playback: { loop: true, controls: false, enlarge: true },
    };
    expect(imageSchema.safeParse(asset).success).toBe(true);
    expect(
      imageSchema.safeParse({ ...asset, playback: { loop: "yes" } }).success,
    ).toBe(false);
    expect(
      imageSchema.safeParse({ ...asset, playback: { hasSpeech: true } })
        .success,
    ).toBe(false);
    const explicit = {
      src: clip,
      label: "Campaign",
      width: 1280,
      height: 720,
      poster: {
        src: "/poster.jpg",
        alt: "Campaign poster",
        width: 1280,
        height: 720,
      },
      transcript: "A silent campaign film.",
      hasSpeech: false,
    };
    expect(
      videoSchema.safeParse({ ...explicit, playback: asset.playback }).success,
    ).toBe(true);
    expect(
      videoSchema.safeParse({ ...explicit, hasSpeech: true }).success,
    ).toBe(false);
    expect(() =>
      parseSection({
        ...makeSection("hero.front-page", "test"),
        sectionWidth: "viewport",
      }),
    ).toThrow();
  });
});
