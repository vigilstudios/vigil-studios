import { parseSection, type SectionInstance } from "../composition/schemas";
import type { CreatorSectionId } from "../composition/creator-schemas";
import { creatorImage, creatorImagePackages } from "./creator-image-packages";
/** Illustrative content is owned by the Lab, never by production components. */
export function makeCreatorSection<K extends CreatorSectionId>(component: K, id: string, config: Readonly<Record<string, string>> = {}): SectionInstance<K> {
  const pack = creatorImagePackages[0];
  const common = { id, component, motion: "none", density: "open", surface: "transparent", alignment: "left" };
  const payload = component === "proof.social-reach" ? {
    ...common, structure: "cards", statsStyle: "bold", linkStyle: "pills",
    content: { eyebrow: "My corner of the internet", title: "Small moments. A shared connection.", introduction: "Everyday stories, honest recommendations and a community that keeps showing up.", basis: "Illustrative demo metrics · replace with your own analytics and reporting period.",
      stats: [{ id: "following", value: "128K", label: "Followers", platform: "Instagram" }, { id: "views", value: "2.4M", label: "Video views", platform: "TikTok", period: "Last 30 days" }, { id: "reach", value: "860K", label: "Accounts reached", platform: "Instagram", period: "Last 30 days" }],
      socials: [{ id: "instagram", platform: "Instagram", handle: "@yourhandle", href: "https://www.instagram.com/" }, { id: "tiktok", platform: "TikTok", handle: "@yourhandle", href: "https://www.tiktok.com/" }, { id: "youtube", platform: "YouTube", handle: "Your channel", href: "https://www.youtube.com/" }],
    },
  } : {
    ...common, structure: "scrapbook", imageSide: "left", photoStyle: "snapshot", imageShape: "portrait",
    content: { eyebrow: "A little about me", title: "Hi, I'm Avery.", name: "Avery", role: "Lifestyle creator & everyday storyteller", location: "Brooklyn, NY", biography: "I'm a creator who finds inspiration in the everyday: a good coffee, a slow morning, a new place and the things that make life feel like you.\n\nHere you'll find little glimpses of my world, honest product finds and stories made with a camera always close by. I partner with brands that feel like a natural part of that story.", signature: "See you around, Avery", image: creatorImage(pack, "hero"), secondaryImage: creatorImage(pack, "pov"), interests: [{ id: "rituals", label: "Daily rituals" }, { id: "wellness", label: "Wellness" }, { id: "style", label: "Personal style" }] },
  };
  const choices = Object.fromEntries(Object.entries(config).filter(([key]) => key in payload && !["id", "component", "content"].includes(key)));
  return parseSection({ ...payload, ...choices }) as unknown as SectionInstance<K>;
}
