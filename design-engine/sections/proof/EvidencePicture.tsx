"use client";
import { MediaAsset } from "../../media/MediaAsset";
import { useState, type CSSProperties } from "react";
import type { SectionImage } from "../../media/types";
function Picture({image,label}:{image:SectionImage;label:string}) {
 const [failed,setFailed]=useState(false);
 const position=(f:SectionImage["focal"])=>f?`${f.x}% ${f.y}%`:"50% 50%";
 return <figure className="de-proof-picture" style={{"--de-proof-focal":position(image.focal),"--de-proof-mobile-focal":position(image.mobileFocal??image.focal)} as CSSProperties}>
 {failed?<div className="de-proof-image-unavailable" role="img" aria-label={image.alt}><span>{label} · image unavailable</span></div>:<MediaAsset asset={image} onError={()=>setFailed(true)}/>}
 {image.caption && <figcaption>{image.caption}</figcaption>}</figure>;
}
/** Plain media leaf, usable inside a loop without pulling reveal animation into its bundle. */
export function EvidencePicture({image,label}:{image?:SectionImage;label:string}) {
 return image ? <Picture key={image.src} image={image} label={label}/> : null;
}
