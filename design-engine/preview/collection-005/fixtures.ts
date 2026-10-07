import type { StaticImageData } from "next/image";
import type { TypographyProfileId } from "../../foundations/typography/profiles";
import streetWide from "@/docs/design-engine/creative-collection-005/assets/urban-street-wide-faceless.webp";
import streetLook from "@/docs/design-engine/creative-collection-005/assets/urban-street-look-faceless.webp";
import trainingWide from "@/docs/design-engine/creative-collection-005/assets/urban-training-wide-faceless.webp";
import trainingLook from "@/docs/design-engine/creative-collection-005/assets/urban-training-look-faceless.webp";
import fashion1 from "@/docs/design-engine/creative-collection-005/assets/retail-1.webp";
import fashion2 from "@/docs/design-engine/creative-collection-005/assets/retail-2.webp";
import fashion3 from "@/docs/design-engine/creative-collection-005/assets/retail-3.webp";
import fashion4 from "@/docs/design-engine/creative-collection-005/assets/retail-4.webp";
import food1 from "@/docs/design-engine/creative-collection-005/assets/restaurant-1.webp";
import food2 from "@/docs/design-engine/creative-collection-005/assets/restaurant-2.webp";
import food3 from "@/docs/design-engine/creative-collection-005/assets/restaurant-3.webp";
import food4 from "@/docs/design-engine/creative-collection-005/assets/restaurant-4.webp";
import coast from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture.jpg";
import night from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture-blue-hour.jpg";
import stone from "@/docs/design-engine/creative-calibration-002/assets/coastal-stone-detail.jpg";
import building from "@/docs/design-engine/creative-collection-001/assets/architecture-study.jpg";
import chair from "@/docs/design-engine/creative-calibration-002/assets/metal-chair-portrait.jpg";
export type MediaItem = { id: string; src: string; width: number; height: number; alt: string; title: string; note: string; group: string; focal: readonly [number, number]; kind: "image" | "video"; poster?: string; transcript?: string };
export type MediaBrief = { id: string; brand: string; context: string; title: string; deck: string; season: string; palette: readonly [string,string,string]; type: TypographyProfileId; items: readonly MediaItem[] };
function photo(asset: StaticImageData, id: string, title: string, alt: string, group: string, note: string): MediaItem {
  return { id, src: typeof asset === "string" ? asset : asset.src, width: asset.width || 1200, height: asset.height || 900, alt: `${alt}. Illustrative study asset.`, title, group, note, focal: [50,45], kind: "image" };
}
export const mediaBriefs: readonly MediaBrief[] = [
  { id: "selvedge", brand: "SELVEDGE", context: "Independent apparel label", title: "The art of everyday.", deck: "Soft structure. Considered objects. A wardrobe lived in, from the first light to the last appointment.", season: "Objects to wear / Edition 06", palette: ["#f2eee5", "#302d28", "#812f35"], type: "fashion", items: [
    photo(fashion1,"f1","Soft structure","Neutral garments on a rail above cobalt display blocks","Wardrobe","Cotton, linen and the space between them."),
    photo(fashion4,"f2","An unhurried silhouette","White blouse, tan skirt, flat shoes and a leather bag arranged on fabric","Wardrobe","A complete look, without a prescribed occasion."),
    photo(fashion2,"f3","Objects in company","Ceramic vase, leather bag and folded textiles in warm light","Objects","Material relationships, collected slowly."),
    photo(fashion3,"f4","An open room","Sunlit apparel showroom with a central stone table","Spaces","The collection in its natural surroundings."),
  ]},
  { id: "interval", brand: "INTERVAL / OFFICE", context: "Architecture practice", title: "Where the light stays.", deck: "A study of thresholds, surfaces and the changing horizon. Buildings understood through the places they make.", season: "Field records / Selected spaces", palette: ["#e4ecf0", "#183542", "#24576c"], type: "technical", items: [
    photo(coast,"a1","At the waterline","Low stone coastal building facing the sea","Exterior","The horizon establishes the first datum."),
    photo(stone,"a2","A close reading","Detailed limestone texture and joints","Material","A surface understood at the scale of a hand."),
    photo(building,"a3","Inside the pause","Architectural study of a quiet built space","Interior","An interval between enclosure and openness."),
    photo(night,"a4","After daylight","Coastal architecture at blue hour","Exterior","The same threshold, under a different sky."),
    photo(chair,"a5","A place to stop","Metal chair standing in a textured stone room","Interior","Objects give the room a human scale."),
  ]},
  { id: "supper", brand: "Supper Club", context: "Neighborhood restaurant", title: "Stay for one more.", deck: "A table in the morning, a familiar corner after dark. Small rituals and the people we gather around them.", season: "A day at the table / Volume 03", palette: ["#f2dca8", "#4b2329", "#84332d"], type: "playful", items: [
    photo(food1,"r1","The first table","Toast with fruit beside coffee and a croissant","Morning","Breakfast as a reason to take your time."),
    photo(food2,"r2","Something to share","Pasta with mushrooms on a ceramic plate","Evening","A little warmth at the center of the table."),
    photo(food3,"r3","A familiar ritual","Coffee and flaky pastry on a cafe table","Morning","One cup, and a moment before the day begins."),
    photo(food4,"r4","The room after five","Warm restaurant interior with booths and globe lights","Evening","The light changes. The welcome stays."),
    photo(food2,"r5","A closer look","Repeated editorial view of mushroom pasta","Evening","Texture, then taste; a second reading of the same frame."),
    photo(food1,"r6","Before we go","Fruit toast and a breakfast place setting","Morning","A final view of the morning table."),
  ]},
  { id: "concrete", brand: "CONCRETE / ATHLETICS", context: "Streetwear / training apparel", title: "Built for the everyday athlete.", deck: "Heavyweight layers. Technical essentials. From the block to the training floor, move on your own terms.", season: "Street / Training — Drop 01", palette: ["#e4e5df", "#181c18", "#496135"], type: "neo-grotesk", items: [
    photo(streetLook,"u1","Off duty","Faceless neck-down view of a charcoal oversized hoodie and cargo pants against a solid gray studio background","Street","Heavyweight cotton. A relaxed silhouette for the hours between."),
    photo(streetWide,"u2","Own the block","Faceless neck-down view of two models in oversized tees and cargo pants on an urban basketball court","Street","Washed layers, open space. A uniform with room to move."),
    photo(trainingLook,"u3","Find your pace","Faceless neck-down view of olive training apparel against a solid off-white studio background","Training","Technical layers, from the first warm-up to the walk home."),
    photo(trainingWide,"u4","Put in work","Faceless neck-down view of two athletes in olive and charcoal training apparel inside an industrial gym","Training","Show up. Put in the work. Make the next session yours."),
  ]},
];

/** Finite fixture adaptation, not automatic composition or silent runtime coercion. */
export function briefForStudy(id: string, brief: MediaBrief): MediaBrief {
  if (id === "M13" && brief.id === "concrete") return { ...brief, items: [brief.items[0],brief.items[2],brief.items[1],brief.items[3]] };
  if (id === "M09" && brief.items.length % 2) return { ...brief, items: brief.items.slice(0,-1) };
  if (id !== "M11") return brief;
  const first = brief.items[0];
  return { ...brief, items: [...brief.items, { ...first, id: `${brief.id}-reel`, kind: "video", src: `/design-engine-study-005/${brief.id === "concrete" ? "concrete-faceless" : brief.id}.mp4`, width:960,height:540,poster:first.src,title:"Three views / study reel",group:"Motion",note:"Silent six-second edit assembled from these illustrative stills. User-started playback only.",transcript:`Three still photographs appear in sequence, held for two seconds each. ${brief.id === "concrete" ? "Faceless apparel views: a charcoal hoodie against solid gray; oversized streetwear on an urban court; olive training apparel against solid off-white." : brief.id === "selvedge" ? "Garments on a rail; a complete outfit; objects and textiles." : brief.id === "interval" ? "Coastal architecture in daylight; limestone detail; coastal architecture at blue hour." : "A breakfast table; mushroom pasta; the dining room."} No speech, music or documentary footage.` }] };
}
