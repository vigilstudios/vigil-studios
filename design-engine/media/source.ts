import type { SectionImage, SectionVideo } from "./types";
/** Explicit type handles extensionless/private URLs; ordinary video URLs also work when pasted into a media slot. */
export function isVideoAsset(
  asset: Pick<SectionImage, "src" | "mediaType">,
): boolean {
  return (
    asset.mediaType === "video" ||
    (asset.mediaType !== "image" &&
      /\.(mp4|webm|ogv|ogg|mov|m4v)(?:[?#]|$)/i.test(asset.src))
  );
}
export function videoAsAsset(video: SectionVideo): SectionImage {
  return {
    src: video.src,
    alt: video.label,
    width: video.width,
    height: video.height,
    mediaType: "video",
    playback: {
      ...video.playback,
      poster: video.playback?.poster ?? video.poster.src,
      captions: video.captions ?? video.playback?.captions,
      transcript: video.transcript,
      hasSpeech: video.hasSpeech,
    },
  };
}

export function containsVideoAsset(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsVideoAsset);
  const record = value as Record<string, unknown>;
  if (
    typeof record.src === "string" &&
    (record.mediaType === "video" ||
      typeof record.alt === "string" ||
      typeof record.transcript === "string")
  )
    return (
      isVideoAsset({
        src: record.src,
        mediaType: record.mediaType as "image" | "video" | undefined,
      }) || "transcript" in record
    );
  return Object.values(record).some(containsVideoAsset);
}
