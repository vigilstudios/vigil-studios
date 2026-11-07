/** Choose readable text for an owner-selected solid accent. Website palettes supply their own pair. */
export function bookingAccentForeground(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    ?.map((v) => parseInt(v, 16) / 255);
  if (!rgb || rgb.length !== 3 || rgb.some((v) => !Number.isFinite(v)))
    return "#ffffff";
  const linear = rgb.map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  const luminance =
    linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? "#000000"
    : "#ffffff";
}
export const bookingAccentPresets: Record<string, string> = {
  royal: "#2547b8",
  graphite: "#303b4d",
  plum: "#72365e",
};
