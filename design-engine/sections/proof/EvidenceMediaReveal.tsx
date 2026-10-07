import { MediaReveal } from "../../motion/MediaReveal";
import type { SectionImage } from "../../media/types";
import { EvidencePicture } from "./EvidencePicture";
/** Optional reveal wrapper stays outside the plain loop media leaf. */
export function EvidenceMediaReveal({image,label,motion="none"}:{image?:SectionImage;label:string;motion?:string}) {
 if(!image)return null;
 const picture=<EvidencePicture image={image} label={label}/>;
 return motion === "media-reveal" ? <MediaReveal>{picture}</MediaReveal> : picture;
}
