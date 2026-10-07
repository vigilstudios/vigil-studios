export type MediaPath = (string | number)[];
export type EditableMedia = {
  path: MediaPath;
  value: Record<string, unknown>;
  videoRecord: boolean;
};
/** Caption tracks, action URLs and documents are excluded; image/video slots share authoring controls. */
export function editableMedia(
  value: unknown,
  path: MediaPath = [],
): EditableMedia[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value))
    return value.flatMap((item, index) =>
      editableMedia(item, [...path, index]),
    );
  const object = value as Record<string, unknown>;
  if (
    typeof object.src === "string" &&
    (typeof object.alt === "string" ||
      typeof object.transcript === "string" ||
      path.at(-1) === "logo")
  )
    return [
      {
        path,
        value: object,
        videoRecord: "transcript" in object && "label" in object,
      },
      ...("poster" in object && typeof object.poster === "object"
        ? editableMedia(object.poster, [...path, "poster"])
        : []),
    ];
  return Object.entries(object).flatMap(([key, item]) =>
    editableMedia(item, [...path, key]),
  );
}
export function patchMediaValue<T>(
  value: T,
  path: MediaPath,
  patch: Record<string, unknown>,
): T {
  const copy = structuredClone(value);
  let owner = copy as Record<string | number, unknown>;
  for (const key of path.slice(0, -1))
    owner = owner[key] as Record<string | number, unknown>;
  const key = path.at(-1)!;
  owner[key] = { ...(owner[key] as Record<string, unknown>), ...patch };
  return copy;
}
