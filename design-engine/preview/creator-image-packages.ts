import manifest from "../../public/design-engine-creators/manifest.json";
import { parseSection, sectionSchemas, type SectionInstance } from "../composition/schemas";
import type { SectionImage } from "../media/types";

/** Demo imagery lives at the Lab boundary; reusable production renderers own no client assets. */
export const creatorImagePackages = [
  { id: "creator-pink-light", set: "pink-light", label: "Creator · Pink / Light", brand: "PINK HOURS / DAY", title: "Small moments, softly seen.", background: "#f9eeef", foreground: "#38232c", accent: "#a1456b" },
  { id: "creator-pink-dark", set: "pink-dark", label: "Creator · Pink / Dark", brand: "PINK HOURS / NIGHT", title: "A little glow after hours.", background: "#23171e", foreground: "#f8e8ed", accent: "#e996b5" },
  { id: "creator-neutral-light", set: "neutral-light", label: "Creator · Neutral / Light", brand: "DAILY FRAME / DAY", title: "An everyday point of view.", background: "#f5f0e8", foreground: "#302b25", accent: "#78604b" },
  { id: "creator-neutral-dark", set: "neutral-dark", label: "Creator · Neutral / Dark", brand: "DAILY FRAME / NIGHT", title: "Find the story in the quiet.", background: "#211e1b", foreground: "#f0e9df", accent: "#c8ae8e" },
] as const;
export type CreatorImagePackage = (typeof creatorImagePackages)[number];
export type CreatorImageRole = "hero" | "product" | "pov" | "objects" | "gym" | "coffee" | "drive";
export const creatorImageRoles: readonly CreatorImageRole[] = ["hero", "product", "pov", "objects", "gym", "coffee", "drive"];

export const creatorRoleLabels: Record<CreatorImageRole, string> = {
  hero: "Behind the camera", product: "Product ritual", pov: "Creator POV", objects: "Everyday essentials",
  gym: "Gym snapshot", coffee: "Food & coffee", drive: "Car / road trip",
};

export function creatorPackageFor(id: string): CreatorImagePackage | undefined {
  return creatorImagePackages.find(pack => pack.id === id);
}

export function supportsCreatorPackage(id: string) {
  return id in sectionSchemas || ["primitive.media", "primitive.media-frame", "motion.media-reveal"].includes(id);
}

export function creatorImage(pack: CreatorImagePackage, role: CreatorImageRole, thumbnail = false): SectionImage {
  const asset = manifest.assets.find(asset => asset.id === `${pack.set}-${role}`);
  if (!asset) throw Error(`Missing creator image: ${pack.set}/${role}`);
  return {
    src: thumbnail ? asset.thumbnail.src : asset.src,
    alt: asset.alt,
    width: thumbnail ? asset.thumbnail.width : asset.width,
    height: thumbnail ? asset.thumbnail.height : asset.height,
    focal: { x: 50, y: 50 },
    mobileFocal: { x: 50, y: 50 },
    ...(!thumbnail ? { srcSet: asset.srcSet, sizes: "(max-width:700px) 100vw, 70vw" } : {}),
  };
}

export function creatorContext(pack: CreatorImagePackage) {
  return {
    id: pack.id,
    brand: pack.brand,
    short: pack.set.startsWith("pink") ? "PH" : "DF",
    kind: "Independent creator",
    logo: "wordmark",
    palette: [pack.background, pack.foreground, pack.accent],
    cta: "Let's collaborate",
    title: pack.title,
    note: `Everyday stories, thoughtful product edits and life behind the camera. ${pack.label}. Illustrative creator demo.`,
    links: [
      { label: "Selected work", children: ["Campaigns", "Product stories", "Behind the scenes"] },
      { label: "About", children: ["My approach", "Everyday journal"] },
      { label: "The edit", children: ["Daily essentials", "Creator tools"] },
      { label: "Collaborate" },
      { label: "Journal" },
      { label: "Contact" },
    ],
  };
}

/** Adapt only data; the caller's geometry, behavior, actions and creative layers survive. */
export function adaptCreatorSection(section: SectionInstance, pack: CreatorImagePackage): SectionInstance {
  const context = creatorContext(pack);
  const commerce = section.component.startsWith("commerce.");
  const work = section.component.startsWith("work.");
  const objectHero = section.component === "hero.object-study";
  const titles = {
    hero: "Behind the camera",
    product: "The daily ritual",
    pov: "From my point of view",
    objects: "Everyday essentials",
    gym: "After the workout", coffee: "Coffee, then everything", drive: "Taking the long way home",
  };
  function roleFor(path: readonly (string | number)[]): CreatorImageRole {
    if (commerce) return "product";
    if (objectHero) return "product";
    if (path.includes("before")) return "hero";
    if (path.includes("after")) return "pov";
    if (path.includes("secondaryImage")) return "coffee";
    if (path.some(part => typeof part === "number")) {
      const index = path.find(part => typeof part === "number");
      return creatorImageRoles[typeof index === "number" ? index % creatorImageRoles.length : 0];
    }
    return "hero";
  }
  function media(value: unknown, path: (string | number)[] = []): unknown {
    if (Array.isArray(value)) return value.map((item, index) => media(item, [...path, index]));
    if (!value || typeof value !== "object") return value;
    const record = value as Record<string, unknown>;
    if (typeof record.src === "string" && typeof record.alt === "string" &&
        typeof record.width === "number" && typeof record.height === "number") {
      const image = creatorImage(pack, roleFor(path), path.includes("thumbnail"));
      return { ...image, ...(typeof record.caption === "string" ? { caption: "AI-generated creator demo photograph." } : {}) };
    }
    // This is a photo package. A cabinet's optional demo video becomes a photo record.
    if (work && record.kind === "video" && "video" in record) {
      const role = roleFor(path);
      return { id: record.id, title: titles[role], note: context.note, category: "Creator journal", kind: "image", image: creatorImage(pack, role) };
    }
    const result = Object.fromEntries(Object.entries(record).map(([key, item]) => [key, media(item, [...path, key])]));
    if (work && ("image" in result || "scene" in result)) {
      const role = roleFor(path);
      if ("title" in result) result.title = titles[role];
      if ("phrase" in result) result.phrase = titles[role];
      if ("note" in result) result.note = context.note;
      if ("narrative" in result) result.narrative = context.note;
      if ("detail" in result) result.detail = context.note;
      if ("category" in result) result.category = ({ hero: "Behind the scenes", product: "Product finds", pov: "Behind the scenes", objects: "Daily essentials", gym: "Wellness", coffee: "Food & coffee", drive: "On the road" } as const)[role];
      if ("caption" in result) result.caption = titles[role];
    }
    if (commerce && result.kind === "image" && "label" in result) result.label = "Creator product photograph";
    return result;
  }
  const content = media(section.content) as Record<string, unknown>;
  // Complete small demo photo collections with every role while retaining existing record IDs.
  if (["work.gallery-hanging", "work.expand-rail", "work.card-rail", "work.image-expansion", "work.image-gallery", "work.apple-cards", "work.liquid-glass", "work.media-cabinet"].includes(section.component)) {
    const key = section.component === "work.media-cabinet" ? "records" : "works";
    const records = content[key] as Record<string, unknown>[];
    for (let index = records.length; index < creatorImageRoles.length; index++) {
      const role = creatorImageRoles[index];
      let id = `creator-${role}`;
      while (records.some(record => record.id === id)) id += "-photo";
      records.push({ id, title: titles[role], category: creatorRoleLabels[role], note: context.note,
        ...(key === "records" ? { kind: "image" } : {}), image: creatorImage(pack, role) });
    }
  }
  const copy: Record<string, string> = {
    brand: context.brand, masthead: context.brand, title: commerce ? "The daily edit." : context.title,
    description: context.note, introduction: context.note, abstract: context.note,
    eyebrow: pack.label, category: context.kind, topic: context.kind,
    reference: pack.label, edition: pack.label, label: context.brand,
    note: context.note, closingPhrase: "Made from everyday moments.",
    sideNote: "An illustrative creator journal.", materialNote: "A candid look at the objects in a daily routine.",
    specification: "Camera, notebook, coffee and a little curiosity.",
  };
  for (const [key, value] of Object.entries(copy)) if (typeof content[key] === "string") content[key] = value;
  if (section.component.startsWith("navigation.")) {
    if (Array.isArray(content.links)) {
      content.links = content.links.map((link: Record<string, unknown>, index: number) => {
        const example = context.links[index % context.links.length];
        return { ...link, label: index < context.links.length ? example.label : `${example.label} ${Math.floor(index / context.links.length) + 1}`, ...(Array.isArray(link.children) ? {
          children: link.children.map((child: Record<string, unknown>, i: number) => ({
            ...child, label: example.children?.[i % example.children.length] ?? example.label,
          })),
        } : {}) };
      });
    }
    if (content.action && typeof content.action === "object") content.action = { ...content.action, label: context.cta };
    if (content.logo && typeof content.logo === "object") {
      const logo = content.logo as Record<string, unknown>;
      if (logo.src) content.logo = { ...logo, src: creatorLogo(context.brand, pack.foreground) };
    }
  } else if (section.component.startsWith("hero.") && content.action && typeof content.action === "object") {
    content.action = { ...content.action, label: context.cta };
  }
  if (section.component === "about.creator-profile") content.title = section.content.title;
  if (section.component === "story.open-letter") {
    content.salutation = `Dear fellow everyday storytellers · ${pack.label},`;
    content.signature = context.brand;
    content.signoff = "See you in the next frame,";
    content.paragraphs = [context.note, "A good story starts with a small detail: a coffee before the gym, a product that earns its place in your routine, or the view on a spontaneous drive. I share those moments and the people behind them."];
  }
  if (section.component === "hero.comparison") {
    content.beforeLabel = "Behind the camera";
    content.afterLabel = "A creator's POV";
  }
  return parseSection({
    ...section, content,
    ...("media" in section ? { media: media(section.media) } : {}),
  });
}

export function creatorLogo(brand: string, color: string) {
  return "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="68" viewBox="0 0 360 68"><text x="8" y="43" fill="${color}" font-family="sans-serif" font-size="23">${brand}</text></svg>`,
  );
}
