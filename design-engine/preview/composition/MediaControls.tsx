"use client";
import { useState } from "react";
import { ContentTextField } from "./ContentFields";
import { creatorImagePackages, creatorImageRoles, creatorImage, creatorRoleLabels } from "../creator-image-packages";
import type { SectionInstance } from "../../composition/schemas";
import { editableMedia, patchMediaValue } from "../../media/editing";
import { isVideoAsset } from "../../media/source";
export function MediaControls({
  section,
  onChange,
}: {
  section: SectionInstance;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const [error, setError] = useState("");
  const fields = editableMedia(section);
  if (!fields.length) return null;
  return (
    <details className="composition-media-controls">
      <summary>Images and videos</summary>
      <p>
        Use a file URL or select an uploaded asset. MP4/WebM URLs are recognized
        automatically; select Video for extensionless URLs.
      </p>
      {fields.map(({ path, value, videoRecord }) => {
        const label = path.join(" · "),
          playback = (value.playback ?? {}) as Record<string, unknown>;
        const video =
          videoRecord ||
          isVideoAsset({
            src: String(value.src),
            mediaType: value.mediaType as "image" | "video" | undefined,
          });
        function patch(next: Record<string, unknown>) {
          try { const candidate = patchMediaValue(section, path, next); onChange({
            content: candidate.content,
            ...("media" in candidate ? { media: candidate.media } : {}),
          }); setError(""); } catch(error) { setError(error instanceof Error ? error.message : "Invalid media."); }
        }
        return (
          <fieldset key={label}>
            <legend>{label}</legend>
            {!videoRecord && path.at(-1) !== "logo" && <label>
              Creator photograph
              <select aria-label={`Creator photograph · ${label}`} value={creatorImagePackages.flatMap(pack => creatorImageRoles.map(role => ({ id: `${pack.id}/${role}`, src: creatorImage(pack, role, path.includes("thumbnail")).src }))).find(asset => asset.src === value.src)?.id ?? ""}
                onChange={event => {
                  const [id, role] = event.target.value.split("/");
                  const pack = creatorImagePackages.find(pack => pack.id === id);
                  if (!pack || !creatorImageRoles.includes(role as typeof creatorImageRoles[number])) return;
                  patch({ ...Object.fromEntries(Object.keys(value).map(key => [key, undefined])), ...creatorImage(pack, role as typeof creatorImageRoles[number], path.includes("thumbnail")), ...(value.caption ? { caption: value.caption } : {}) });
                }}>
                <option value="" disabled>Choose a creator photo</option>
                {creatorImagePackages.map(pack => <optgroup key={pack.id} label={pack.label}>{creatorImageRoles.map(role => <option key={role} value={`${pack.id}/${role}`}>{creatorRoleLabels[role]}</option>)}</optgroup>)}
              </select>
            </label>}

            {!videoRecord && (
              <label>
                Media type
                <select
                  aria-label={`Media type · ${label}`}
                  value={String(value.mediaType ?? "auto")}
                  onChange={(event) =>
                    patch({
                      mediaType:
                        event.target.value === "auto"
                          ? undefined
                          : event.target.value,
                    })
                  }
                >
                  <option value="auto">Detect from URL</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </label>
            )}
            <label>
              Source URL
              <ContentTextField bare label={`Media source · ${label}`} value={String(value.src)} onChange={src => patch({src})}/>
            </label>
            {(["width", "height"] as const)
              .filter((key) => key in value)
              .map((key) => (
                <label key={key}>
                  {key}
                  <input
                    aria-label={`Media ${key} · ${label}`}
                    type="number"
                    min="1"
                    value={Number(value[key])}
                    onChange={(event) => {
                      if (Number(event.target.value) !== value[key])
                        patch({ [key]: Number(event.target.value) });
                    }}
                  />
                </label>
              ))}
            {"alt" in value && <ContentTextField label={`Alt text · ${label}`} value={String(value.alt ?? "")} onChange={alt => patch({alt})}/>}
            {!videoRecord && <ContentTextField label={`Caption · ${label}`} value={String(value.caption ?? "")} onChange={caption => patch({caption:caption || undefined})}/>}
            {!videoRecord && <label>Horizontal focal point<input aria-label={`Focal X · ${label}`} type="range" min={0} max={100} value={Number((value.focal as {x?:number})?.x ?? 50)} onChange={event=>patch({focal:{x:Number(event.target.value),y:Number((value.focal as {y?:number})?.y ?? 50)}})}/></label>}
            {!videoRecord && <label>Vertical focal point<input aria-label={`Focal Y · ${label}`} type="range" min={0} max={100} value={Number((value.focal as {y?:number})?.y ?? 50)} onChange={event=>patch({focal:{x:Number((value.focal as {x?:number})?.x ?? 50),y:Number(event.target.value)}})}/></label>}
            {video && (
              <>
                <p>
                  Hidden controls still allow click or Space to play/pause.
                  Autoplay is muted and respects reduced motion.
                </p>
                {(
                  [
                    { key: "loop", label: "Loop", fallback: false },
                    { key: "controls", label: "Show controls", fallback: true },
                    { key: "enlarge", label: "Allow enlarge", fallback: true },
                    {
                      key: "autoplay",
                      label: "Autoplay muted",
                      fallback: false,
                    },
                    { key: "muted", label: "Mute audio", fallback: false },
                  ] as const
                ).map((option) => (
                  <label key={option.key} className="composition-media-toggle">
                    <input
                      type="checkbox"
                      aria-label={`${option.label} · ${label}`}
                      checked={Boolean(playback[option.key] ?? option.fallback)}
                      onChange={(event) =>
                        patch({
                          playback: {
                            ...playback,
                            [option.key]: event.target.checked,
                          },
                        })
                      }
                    />
                    {option.label}
                  </label>
                ))}
                <label>
                  Poster image URL
                  <ContentTextField bare label={`Video poster · ${label}`} value={String(playback.poster ?? "")} multiline={false} onChange={next => patch({ playback: { ...playback, poster: next || undefined } })}/>
                </label>
                <label>
                  Mobile video URL
                  <ContentTextField bare label={`Mobile video · ${label}`} value={String(playback.mobileSrc ?? "")} multiline={false} onChange={next => patch({ playback: { ...playback, mobileSrc: next || undefined } })}/>
                </label>
                <label>
                  Transcript
                  <ContentTextField bare label={`Video transcript · ${label}`} value={String(playback.transcript ?? "")} multiline={true} onChange={next => patch({ playback: { ...playback, transcript: next || undefined } })}/>
                </label>
              </>
            )}
          </fieldset>
        );
      })}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
