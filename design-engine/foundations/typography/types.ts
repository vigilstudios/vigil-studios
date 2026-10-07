export const typeRoles = ["display", "heading", "body", "accent", "mono"] as const;
export type TypeRole = (typeof typeRoles)[number];
export type FontKey = "fraunces" | "bodoni" | "public" | "jost" | "anton" | "source" | "plex" | "archivo" | "recursive" | "cormorant";
/** Font loading belongs to the application boundary. Values may be next/font families or CSS stacks. */
export type FontBindings = Partial<Record<FontKey, string>>;
export type TypeStyle = {
  font: FontKey;
  weight: number;
  style: "normal" | "italic";
  size: string;
  leading: number;
  tracking: string;
  measure: string;
  transform: "none" | "uppercase" | "lowercase";
  numerals: "normal" | "lining-nums tabular-nums" | "oldstyle-nums proportional-nums";
  /** Only axes present in the supplied font file. Use weight for wght. */
  axes?: Readonly<Record<string, number>>;
};
export type TypographyProfile = {
  id: string;
  name: string;
  description: string;
  roles: Record<TypeRole, TypeStyle>;
  emphasis: { role: "display" | "accent"; style: "normal" | "italic" };
};
