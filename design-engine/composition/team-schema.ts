import { z } from "zod";
import { imageSchema } from "../media/types";
const member = z.object({ id: z.string().regex(/^[a-z][a-z0-9-]*$/).max(80), name: z.string().trim().min(1).max(160), role: z.string().max(160).default(""), bio: z.string().max(2000).default(""), image: imageSchema.optional() }).strict();
export const teamSectionSchemas = {
  "about.team": z.object({ content: z.object({ title: z.string().trim().min(1).max(180), introduction: z.string().max(600).default(""), members: z.array(member).max(50).refine(rows => new Set(rows.map(row => row.id)).size === rows.length, "Team member IDs must be unique.") }).strict(), structure: z.enum(["cards", "list", "editorial", "spotlight"]),
    flow: z.enum(["grid", "horizontal"]).default("grid"),
    columns: z.enum(["two", "three", "four"]).default("three"),
    density: z.enum(["open", "compact"]).default("open"),
    surface: z.enum(["transparent", "surface", "framed"]).default("transparent"),
    alignment: z.enum(["left", "center"]).default("left"),
    portrait: z.enum(["portrait", "square", "circle", "landscape"]).default("portrait"),
    biography: z.enum(["visible", "hidden"]).default("visible"),
    motion: z.enum(["none", "fade", "stagger", "mask", "media-reveal"]) }).strict(),
} as const;
