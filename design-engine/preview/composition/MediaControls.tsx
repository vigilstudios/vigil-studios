"use client";
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
          const candidate = patchMediaValue(section, path, next);
          onChange({
            content: candidate.content,
            ...("media" in candidate ? { media: candidate.media } : {}),
          });
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
              <input
                key={String(value.src)}
                aria-label={`Media source · ${label}`}
                defaultValue={String(value.src)}
                onBlur={(event) => {
                  if (event.target.value !== value.src)
                    patch({ src: event.target.value });
                }}
              />
            </label>
            {(["width", "height"] as const)
              .filter((key) => key in value)
              .map((key) => (
                <label key={key}>
                  {key}
                  <input
                    key={`${key}-${value[key]}`}
                    aria-label={`Media ${key} · ${label}`}
                    type="number"
                    min="1"
                    defaultValue={Number(value[key])}
                    onBlur={(event) => {
                      if (Number(event.target.value) !== value[key])
                        patch({ [key]: Number(event.target.value) });
                    }}
                  />
                </label>
              ))}
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
                  <input
                    key={String(playback.poster ?? "")}
                    aria-label={`Video poster · ${label}`}
                    defaultValue={String(playback.poster ?? "")}
                    onBlur={(event) => {
                      if (event.target.value !== (playback.poster ?? ""))
                        patch({
                          playback: {
                            ...playback,
                            poster: event.target.value || undefined,
                          },
                        });
                    }}
                  />
                </label>
                <label>
                  Mobile video URL
                  <input
                    key={String(playback.mobileSrc ?? "")}
                    aria-label={`Mobile video · ${label}`}
                    defaultValue={String(playback.mobileSrc ?? "")}
                    onBlur={(event) => {
                      if (event.target.value !== (playback.mobileSrc ?? ""))
                        patch({
                          playback: {
                            ...playback,
                            mobileSrc: event.target.value || undefined,
                          },
                        });
                    }}
                  />
                </label>
                <label>
                  Transcript
                  <textarea
                    key={String(playback.transcript ?? "")}
                    aria-label={`Video transcript · ${label}`}
                    defaultValue={String(playback.transcript ?? "")}
                    onBlur={(event) => {
                      if (event.target.value !== (playback.transcript ?? ""))
                        patch({
                          playback: {
                            ...playback,
                            transcript: event.target.value || undefined,
                          },
                        });
                    }}
                  />
                </label>
              </>
            )}
          </fieldset>
        );
      })}
    </details>
  );
}
